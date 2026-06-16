import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  conversations,
  clients,
  messages,
  drafts,
  type Citation,
} from "@/lib/db/schema";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { generateDraft, isLowConfidence } from "@/lib/ai/draft";
import type { RetrievedChunk } from "@/lib/ai/prompt";

function toCitations(
  chunks: RetrievedChunk[],
  usedIds: string[],
): Citation[] {
  // If the model named chunks, cite those; otherwise cite the top retrieved.
  const used = usedIds.length
    ? chunks.filter((c) => usedIds.includes(c.chunkId))
    : chunks.slice(0, 2);
  return used.map((c) => ({
    chunkId: c.chunkId,
    sourceId: c.sourceId,
    filename: c.filename,
    section: c.section ?? null,
    snippet: c.text.replace(/\s+/g, " ").trim().slice(0, 220),
  }));
}

/**
 * Generate (or regenerate) the draft reply for a conversation's latest inbound
 * message: retrieve knowledge, draft with Claude, persist the draft + citations,
 * and move the conversation to "awaiting_review".
 */
export async function generateDraftForConversation(
  conversationId: string,
  instruction?: string | null,
) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conv) throw new Error("Conversation not found");

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, conv.clientId))
    .limit(1);

  // Full thread (oldest first) so the model has prior context for continuity.
  const thread = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  // Reply to the most recent inbound message; everything before it is history.
  let inboundIdx = -1;
  for (let i = thread.length - 1; i >= 0; i--) {
    if (thread[i].direction === "inbound") {
      inboundIdx = i;
      break;
    }
  }
  if (inboundIdx === -1) throw new Error("No inbound message to reply to");
  const inbound = thread[inboundIdx];
  const history = thread
    .slice(0, inboundIdx)
    .map((m) => ({ direction: m.direction, body: m.body }));

  const query = [conv.subject, inbound.body, client?.type ?? ""]
    .filter(Boolean)
    .join("\n");
  const chunks = await retrieveChunks(query, 5);

  const result = await generateDraft({
    channel: conv.channel,
    clientName: client?.name ?? "there",
    entityName: client?.entityName,
    clientType: client?.type ?? "client",
    subject: conv.subject,
    inboundBody: inbound.body,
    chunks,
    instruction,
    history,
  });

  const citations = toCitations(chunks, result.usedChunkIds);
  const low = isLowConfidence(result) ? 1 : 0;

  // Supersede any previous pending draft.
  await db
    .update(drafts)
    .set({ status: "discarded" })
    .where(
      and(
        eq(drafts.conversationId, conversationId),
        eq(drafts.status, "pending"),
      ),
    );

  const [draft] = await db
    .insert(drafts)
    .values({
      conversationId,
      messageId: inbound.id,
      generatedText: result.text,
      confidence: result.confidence,
      lowConfidence: low,
      citations,
      status: "pending",
    })
    .returning();

  await db
    .update(conversations)
    .set({ status: "awaiting_review", updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return draft;
}
