import OpenAI from "openai";

const EMBED_DIM = 1536;
const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

export const hasEmbeddings = Boolean(process.env.OPENAI_API_KEY);

let client: OpenAI | null = null;
function openai() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/**
 * Deterministic, dependency-free fallback embedding. Hashes whitespace tokens
 * into a fixed-width vector so identical text always yields the same vector and
 * similar text overlaps. Not as good as a real model, but it keeps ingestion +
 * retrieval coherent for the demo before an OPENAI_API_KEY is provisioned.
 */
function localEmbed(text: string): number[] {
  const vec = new Array(EMBED_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % EMBED_DIM;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embed(text: string): Promise<number[]> {
  if (!hasEmbeddings) return localEmbed(text);
  const res = await openai().embeddings.create({ model: MODEL, input: text });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (!hasEmbeddings) return texts.map(localEmbed);
  const res = await openai().embeddings.create({ model: MODEL, input: texts });
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
