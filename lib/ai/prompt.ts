export type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  filename: string;
  text: string;
  section?: string | null;
  similarity: number;
};

export type DraftContext = {
  channel: "email" | "phone" | "chat";
  clientName: string;
  entityName?: string | null;
  clientType: string;
  subject: string;
  inboundBody: string;
  chunks: RetrievedChunk[];
  instruction?: string | null;
};

// Short tone/style guide captured for the firm's draft voice (PRD §5.3).
export const TONE_GUIDE = `You write on behalf of TLF Partners, an Australian accounting firm moving toward virtual-CFO advisory.
Voice: professional, warm, concise, and plain-English. Australian spelling. No jargon unless the client used it.
Always be helpful and reassuring. Sign off as "The TLF Partners team" unless a name is given.
Never invent facts, fees, dates, or policies — rely ONLY on the provided knowledge context.`;

export const SYSTEM_PROMPT = `You are an internal drafting assistant for staff at TLF Partners. You draft a reply to a client's inbound message that a staff member will review before sending. You never send anything yourself.

${TONE_GUIDE}

Rules:
- Ground every factual claim ONLY in the provided <knowledge> context. Do not use outside knowledge for firm-specific facts (deadlines, fees, processes, entity names).
- If the knowledge context does not contain enough to answer confidently, DO NOT guess. Instead write a polite holding/clarifying reply (acknowledge, say you're looking into it or ask for the specific detail you need) and set low confidence.
- Cite the knowledge chunks you actually used by their id.
- Match the channel: "email" = a fuller reply with greeting and sign-off; "chat" = friendly and brief; "phone" = a short call-back note / talking points.
- Confidence is your honest 0-1 estimate that this draft is accurate and complete enough to send with minimal edits.`;

export function buildUserPrompt(ctx: DraftContext): string {
  const knowledge =
    ctx.chunks.length > 0
      ? ctx.chunks
          .map(
            (c, i) =>
              `[chunk ${i + 1}] id=${c.chunkId} source="${c.filename}"${
                c.section ? ` section="${c.section}"` : ""
              }\n${c.text}`,
          )
          .join("\n\n")
      : "(no relevant knowledge found)";

  return `Channel: ${ctx.channel}
Client: ${ctx.clientName}${ctx.entityName ? ` (entity: ${ctx.entityName})` : ""} — type: ${ctx.clientType}
Subject: ${ctx.subject}

Client's message:
"""
${ctx.inboundBody}
"""

<knowledge>
${knowledge}
</knowledge>
${ctx.instruction ? `\nExtra instruction from staff: ${ctx.instruction}\n` : ""}
Draft the reply now.`;
}

// JSON schema for structured output.
export const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    draft: { type: "string", description: "The reply text to show the staff member." },
    confidence: {
      type: "number",
      description: "0-1 estimate of accuracy/completeness.",
    },
    used_chunk_ids: {
      type: "array",
      items: { type: "string" },
      description: "ids of the knowledge chunks actually used.",
    },
  },
  required: ["draft", "confidence", "used_chunk_ids"],
  additionalProperties: false,
} as const;
