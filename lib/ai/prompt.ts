export type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  filename: string;
  text: string;
  section?: string | null;
  similarity: number;
};

export type DraftContext = {
  channel: "email" | "phone" | "chat" | "sms" | "call";
  clientName: string;
  entityName?: string | null;
  clientType: string;
  subject: string;
  inboundBody: string;
  chunks: RetrievedChunk[];
  instruction?: string | null;
  history?: { direction: "inbound" | "outbound"; body: string }[];
};

// Per-channel format + tone so the draft is ready to send with minimal edits.
export const CHANNEL_GUIDE: Record<string, string> = {
  email: `Format: a complete email. Open with "Hi {first name}," then 1–3 short paragraphs, then sign off "Kind regards,\\nThe TLF Partners team". Professional and warm. Plain text (no markdown).`,
  sms: `Format: a single SMS. Plain text, no greeting block and no sign-off, under ~320 characters. Warm but brief and direct; you may use the client's first name once. Get straight to the answer.`,
  chat: `Format: a live-chat reply. Conversational and concise — one to three short sentences, friendly, no formal greeting or sign-off. It should read like a helpful person typing in a chat window.`,
  call: `Format: this is NOT a message to the client — it is a short CALL-BACK SCRIPT for the accountant to use on the phone. Give a one-line suggested opener, then 3–5 short bullet points of the key facts to cover, then a suggested next step. Conversational, spoken tone.`,
  phone: `Format: a short call-back note / talking points for the accountant.`,
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
- Use any prior conversation history for context and continuity (don't repeat what was already said).
- Cite the knowledge chunks you actually used by their id.
- Write the draft in the exact FORMAT for the channel given below — the staff member should be able to fact-check and approve with minimal editing.
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

  const priorHistory =
    ctx.history && ctx.history.length > 0
      ? `\n<conversation_history>\n${ctx.history
          .map(
            (m) =>
              `${m.direction === "inbound" ? "Client" : "TLF Partners"}: ${m.body}`,
          )
          .join("\n")}\n</conversation_history>\n`
      : "";

  const channelGuide = CHANNEL_GUIDE[ctx.channel] ?? CHANNEL_GUIDE.email;

  return `Channel: ${ctx.channel}
${channelGuide}

Client: ${ctx.clientName}${ctx.entityName ? ` (entity: ${ctx.entityName})` : ""} — type: ${ctx.clientType}
Subject: ${ctx.subject}
${priorHistory}
Latest client message to reply to:
"""
${ctx.inboundBody}
"""

<knowledge>
${knowledge}
</knowledge>
${ctx.instruction ? `\nExtra instruction from staff: ${ctx.instruction}\n` : ""}
Draft the reply now, in the exact format for the ${ctx.channel} channel.`;
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
