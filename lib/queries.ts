import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  conversations,
  clients,
  users,
  messages,
  drafts,
} from "@/lib/db/schema";

export type InboxRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  channel: "email" | "phone" | "chat";
  updatedAt: Date | null;
  clientName: string;
  clientType: string;
  assigneeId: string | null;
  assigneeName: string | null;
  snippet: string;
  lowConfidence: boolean;
  needsPartnerReview: boolean;
};

export async function getInboxRows(): Promise<InboxRow[]> {
  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      status: conversations.status,
      priority: conversations.priority,
      channel: conversations.channel,
      updatedAt: conversations.updatedAt,
      needsPartnerReview: conversations.needsPartnerReview,
      assigneeId: conversations.assigneeId,
      clientName: clients.name,
      clientType: clients.type,
      assigneeName: users.name,
    })
    .from(conversations)
    .innerJoin(clients, eq(clients.id, conversations.clientId))
    .leftJoin(users, eq(users.id, conversations.assigneeId))
    .orderBy(desc(conversations.updatedAt));

  // Latest message snippet per conversation.
  const allMsgs = await db
    .select({
      conversationId: messages.conversationId,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .orderBy(desc(messages.createdAt));
  const snippetByConv = new Map<string, string>();
  for (const m of allMsgs) {
    if (!snippetByConv.has(m.conversationId))
      snippetByConv.set(m.conversationId, m.body);
  }

  // Pending draft low-confidence flag per conversation.
  const pending = await db
    .select({
      conversationId: drafts.conversationId,
      lowConfidence: drafts.lowConfidence,
    })
    .from(drafts)
    .where(eq(drafts.status, "pending"));
  const lowByConv = new Map<string, boolean>();
  for (const d of pending)
    lowByConv.set(d.conversationId, Boolean(d.lowConfidence));

  return rows.map((r) => ({
    ...r,
    snippet: snippetByConv.get(r.id)?.slice(0, 140) ?? "",
    lowConfidence: lowByConv.get(r.id) ?? false,
    needsPartnerReview: Boolean(r.needsPartnerReview),
  }));
}

export type DashboardStats = {
  newCount: number;
  awaitingReview: number;
  resolvedToday: number;
  totalDrafts: number;
  avgDraftsPerConversation: number;
  sentCount: number;
  sentAsIs: number;
  sentEdited: number;
  pctAsIs: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const convs = await db
    .select({
      status: conversations.status,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations);

  const allDrafts = await db
    .select({ status: drafts.status, editedText: drafts.editedText })
    .from(drafts);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const newCount = convs.filter((c) => c.status === "new").length;
  const awaitingReview = convs.filter(
    (c) => c.status === "awaiting_review",
  ).length;
  const resolvedToday = convs.filter(
    (c) =>
      (c.status === "sent" || c.status === "resolved") &&
      c.updatedAt &&
      new Date(c.updatedAt) >= startOfToday,
  ).length;

  const totalDrafts = allDrafts.length;
  const sent = allDrafts.filter((d) => d.status === "sent");
  const sentEdited = sent.filter(
    (d) => d.editedText && d.editedText.trim() !== "",
  ).length;
  const sentAsIs = sent.length - sentEdited;
  const pctAsIs = sent.length ? Math.round((sentAsIs / sent.length) * 100) : 0;

  return {
    newCount,
    awaitingReview,
    resolvedToday,
    totalDrafts,
    avgDraftsPerConversation: convs.length
      ? Math.round((totalDrafts / convs.length) * 10) / 10
      : 0,
    sentCount: sent.length,
    sentAsIs,
    sentEdited,
    pctAsIs,
  };
}

export async function getConversationDetail(id: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  if (!conv) return null;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, conv.clientId))
    .limit(1);

  const thread = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  const [draft] = await db
    .select()
    .from(drafts)
    .where(and(eq(drafts.conversationId, id), eq(drafts.status, "pending")))
    .orderBy(desc(drafts.createdAt))
    .limit(1);

  const staff = await db
    .select({ id: users.id, name: users.name })
    .from(users);

  return { conv, client, thread, draft: draft ?? null, staff };
}
