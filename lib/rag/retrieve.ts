import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { embed } from "@/lib/ai/embeddings";
import type { RetrievedChunk } from "@/lib/ai/prompt";

/**
 * Top-k cosine similarity search over knowledge_chunks (pgvector).
 * Returns chunks joined to their source filename.
 */
export async function retrieveChunks(
  query: string,
  k = 5,
): Promise<RetrievedChunk[]> {
  const vec = await embed(query);
  const vecLiteral = `[${vec.join(",")}]`;

  const rows = (await db.execute(sql`
    select
      c.id            as "chunkId",
      c.source_id     as "sourceId",
      c.text          as "text",
      c.metadata->>'section' as "section",
      s.filename      as "filename",
      1 - (c.embedding <=> ${vecLiteral}::vector) as "similarity"
    from knowledge_chunks c
    join knowledge_sources s on s.id = c.source_id
    where c.embedding is not null
    order by c.embedding <=> ${vecLiteral}::vector
    limit ${k}
  `)) as unknown as Array<{
    chunkId: string;
    sourceId: string;
    text: string;
    section: string | null;
    filename: string;
    similarity: number;
  }>;

  return rows.map((r) => ({
    chunkId: r.chunkId,
    sourceId: r.sourceId,
    text: r.text,
    section: r.section,
    filename: r.filename,
    similarity: Number(r.similarity),
  }));
}
