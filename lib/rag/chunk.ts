// Chunk text into ~500-800 token windows with overlap (PRD §8).
// We approximate tokens by characters (~4 chars/token) -> ~2800 chars,
// ~400 char overlap, splitting on paragraph boundaries where possible.

export type Chunk = { text: string; section?: string; chunkIndex: number };

const MAX_CHARS = 2800;
const OVERLAP_CHARS = 400;

export function chunkText(input: string): Chunk[] {
  const clean = input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n\n+/);
  const chunks: Chunk[] = [];
  let buf = "";
  let section: string | undefined;

  const flush = () => {
    const text = buf.trim();
    if (text)
      chunks.push({ text, section, chunkIndex: chunks.length });
    // carry overlap into next buffer
    buf = text.length > OVERLAP_CHARS ? text.slice(-OVERLAP_CHARS) : "";
  };

  for (const para of paragraphs) {
    // treat short ALL-CAPS / heading-ish lines as a section marker
    const firstLine = para.split("\n")[0].trim();
    if (
      firstLine.length > 0 &&
      firstLine.length < 80 &&
      /^[A-Z0-9][A-Za-z0-9 ,&/()'-]+$/.test(firstLine) &&
      para.length < 120
    ) {
      section = firstLine.replace(/[:#]+$/, "");
    }

    if ((buf + "\n\n" + para).length > MAX_CHARS && buf) {
      flush();
    }
    buf = buf ? `${buf}\n\n${para}` : para;

    while (buf.length > MAX_CHARS) {
      // hard-split very long paragraphs
      const slice = buf.slice(0, MAX_CHARS);
      chunks.push({ text: slice.trim(), section, chunkIndex: chunks.length });
      buf = buf.slice(MAX_CHARS - OVERLAP_CHARS);
    }
  }
  if (buf.trim()) chunks.push({ text: buf.trim(), section, chunkIndex: chunks.length });

  return chunks;
}
