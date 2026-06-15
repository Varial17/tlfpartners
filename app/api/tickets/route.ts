import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { clients, conversations, messages } from "@/lib/db/schema";
import { generateDraftForConversation } from "@/lib/draft-service";

export const runtime = "nodejs";
export const maxDuration = 60;

type Channel = "email" | "phone" | "chat";
type ClientType = "smsf" | "business" | "individual";
type Priority = "low" | "normal" | "high";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    clientId,
    newClientName,
    newClientType,
    newClientEntity,
    channel,
    subject,
    message,
    priority,
    assigneeId,
  } = body as {
    clientId?: string;
    newClientName?: string;
    newClientType?: ClientType;
    newClientEntity?: string;
    channel?: Channel;
    subject?: string;
    message?: string;
    priority?: Priority;
    assigneeId?: string;
  };

  if (!channel || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Channel, subject, and message are required." },
      { status: 400 },
    );
  }

  try {
    // Resolve the client: use the chosen one, or create a new record.
    let resolvedClientId = clientId;
    if (!resolvedClientId) {
      if (!newClientName?.trim() || !newClientType) {
        return NextResponse.json(
          { error: "Pick an existing client or provide a new client name and type." },
          { status: 400 },
        );
      }
      const [created] = await db
        .insert(clients)
        .values({
          name: newClientName.trim(),
          entityName: newClientEntity?.trim() || null,
          type: newClientType,
        })
        .returning();
      resolvedClientId = created.id;
    }

    const [conv] = await db
      .insert(conversations)
      .values({
        clientId: resolvedClientId,
        channel,
        subject: subject.trim(),
        priority: priority ?? "normal",
        assigneeId: assigneeId || session.user.id,
        status: "new",
      })
      .returning();

    await db.insert(messages).values({
      conversationId: conv.id,
      direction: "inbound",
      body: message.trim(),
      channel,
    });

    // Generate the AI draft reply (RAG-grounded) right away.
    await generateDraftForConversation(conv.id);

    return NextResponse.json({ ok: true, conversationId: conv.id });
  } catch (err) {
    console.error("[tickets] failed:", err);
    return NextResponse.json(
      { error: "Failed to create ticket", detail: String(err) },
      { status: 500 },
    );
  }
}
