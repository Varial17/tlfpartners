import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDraftForConversation } from "@/lib/draft-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, instruction } = await req.json();
  if (!conversationId)
    return NextResponse.json(
      { error: "conversationId required" },
      { status: 400 },
    );

  try {
    const draft = await generateDraftForConversation(
      conversationId,
      instruction ?? null,
    );
    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("[drafts/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate draft", detail: String(err) },
      { status: 500 },
    );
  }
}
