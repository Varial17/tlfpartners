import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractText, ingestText } from "@/lib/rag/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const text = await extractText(buffer, file.name);
    const { sourceId, chunkCount } = await ingestText({
      filename: file.name,
      text,
    });
    return NextResponse.json({ ok: true, sourceId, chunkCount });
  } catch (err) {
    console.error("[ingest] failed:", err);
    return NextResponse.json(
      { error: "Failed to ingest document", detail: String(err) },
      { status: 500 },
    );
  }
}
