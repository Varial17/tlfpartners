import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { knowledgeSources, knowledgeChunks } from "@/lib/db/schema";
import { embedBatch } from "@/lib/ai/embeddings";
import { chunkText } from "./chunk";

export async function extractText(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "txt" || ext === "md") return buffer.toString("utf8");
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (ext === "pdf") {
    // pdf-parse v2 exposes a PDFParse class; loaded lazily to keep it off the
    // edge/build path.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }
  // Fallback: treat as plain text.
  return buffer.toString("utf8");
}

/**
 * Chunk -> embed -> store. Updates the source row's status & chunk count.
 * Used both by the upload API and the seed script.
 */
export async function ingestText(opts: {
  filename: string;
  text: string;
}): Promise<{ sourceId: string; chunkCount: number }> {
  const [source] = await db
    .insert(knowledgeSources)
    .values({
      filename: opts.filename,
      status: "processing",
    })
    .returning();

  try {
    const chunks = chunkText(opts.text);
    if (chunks.length === 0) {
      await db
        .update(knowledgeSources)
        .set({ status: "ingested", chunkCount: 0 })
        .where(eq(knowledgeSources.id, source.id));
      return { sourceId: source.id, chunkCount: 0 };
    }

    const embeddings = await embedBatch(chunks.map((c) => c.text));
    await db.insert(knowledgeChunks).values(
      chunks.map((c, i) => ({
        sourceId: source.id,
        text: c.text,
        embedding: embeddings[i],
        metadata: { section: c.section, chunkIndex: c.chunkIndex },
      })),
    );

    await db
      .update(knowledgeSources)
      .set({ status: "ingested", chunkCount: chunks.length })
      .where(eq(knowledgeSources.id, source.id));

    return { sourceId: source.id, chunkCount: chunks.length };
  } catch (err) {
    await db
      .update(knowledgeSources)
      .set({ status: "error", error: String(err) })
      .where(eq(knowledgeSources.id, source.id));
    throw err;
  }
}

export async function deleteSource(sourceId: string) {
  await db.delete(knowledgeSources).where(eq(knowledgeSources.id, sourceId));
}
