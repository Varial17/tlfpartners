import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { drafts, conversations, messages } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { editedText } = await req.json().catch(() => ({}));

  const [draft] = await db
    .select()
    .from(drafts)
    .where(eq(drafts.id, id))
    .limit(1);
  if (!draft)
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const edited =
    typeof editedText === "string" && editedText.trim() !== ""
      ? editedText.trim()
      : null;
  const finalText = edited ?? draft.generatedText;

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, draft.conversationId))
    .limit(1);

  // Mock "send": record an outbound message and resolve the conversation.
  await db.insert(messages).values({
    conversationId: draft.conversationId,
    direction: "outbound",
    body: finalText,
    channel: conv?.channel ?? "email",
  });

  await db
    .update(drafts)
    .set({ status: "sent", editedText: edited })
    .where(eq(drafts.id, id));

  await db
    .update(conversations)
    .set({ status: "sent", updatedAt: new Date() })
    .where(eq(conversations.id, draft.conversationId));

  return NextResponse.json({ ok: true });
}
