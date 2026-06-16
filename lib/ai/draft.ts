import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  DRAFT_SCHEMA,
  type DraftContext,
} from "./prompt";

const MODEL = process.env.DRAFT_MODEL ?? "claude-opus-4-8";

export const hasDraftLLM = Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
function anthropic() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type DraftResult = {
  text: string;
  confidence: number;
  usedChunkIds: string[];
};

const LOW_CONF_THRESHOLD = 0.55;

export function isLowConfidence(r: DraftResult): boolean {
  return r.confidence < LOW_CONF_THRESHOLD || r.usedChunkIds.length === 0;
}

/**
 * Deterministic fallback used when ANTHROPIC_API_KEY is absent, so the inbox is
 * still demoable. Produces a plausible, grounded-looking reply from the top
 * retrieved chunk, or a holding reply when nothing relevant was found.
 */
function fallbackDraft(ctx: DraftContext): DraftResult {
  const first = ctx.chunks[0];
  const greeting = `Hi ${ctx.clientName.split(" ")[0] || "there"},`;
  const signoff = "Kind regards,\nThe TLF Partners team";

  // No confidently relevant knowledge -> polite holding/clarifying reply.
  if (!first || first.similarity < 0.1) {
    return {
      text: `${greeting}\n\nThanks for getting in touch about "${ctx.subject}". I want to make sure I give you the right information, so I'm just confirming the details with the team and will come back to you shortly.\n\nIf there's anything specific (such as the relevant entity, period, or document), feel free to reply and it'll help us turn this around faster.\n\n${signoff}`,
      confidence: 0.25,
      usedChunkIds: [],
    };
  }

  const summary = first.text.replace(/\s+/g, " ").trim().slice(0, 320);
  const firstName = ctx.clientName.split(" ")[0] || "there";
  let body: string;
  switch (ctx.channel) {
    case "sms":
      body = `Hi ${firstName}, ${summary.slice(0, 240)} Reply if you'd like more detail.`;
      break;
    case "chat":
      body = `${greeting} ${summary} Let me know if you'd like more detail. — TLF Partners`;
      break;
    case "call":
      body = `Call-back script for ${ctx.clientName}:\n- Opener: "Hi ${firstName}, it's the team at TLF Partners returning your call about ${ctx.subject}."\n- Key point: ${summary}\n- Next step: confirm the details and offer to follow up in writing.`;
      break;
    default: // email / phone (legacy)
      body = `${greeting}\n\nThanks for reaching out about "${ctx.subject}". ${summary}\n\nPlease let me know if you'd like me to go into more detail or help with the next steps.\n\n${signoff}`;
  }

  // Confidence tracks retrieval strength so weak matches surface as low-confidence.
  const confidence = Math.max(0.25, Math.min(0.9, 0.4 + first.similarity));

  return {
    text: body,
    confidence,
    usedChunkIds: ctx.chunks.slice(0, 2).map((c) => c.chunkId),
  };
}

export async function generateDraft(ctx: DraftContext): Promise<DraftResult> {
  if (!hasDraftLLM) return fallbackDraft(ctx);

  try {
    const res = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: DRAFT_SCHEMA },
      },
      messages: [{ role: "user", content: buildUserPrompt(ctx) }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = res.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const parsed = JSON.parse(raw) as {
      draft?: string;
      confidence?: number;
      used_chunk_ids?: string[];
    };

    return {
      text: parsed.draft?.trim() || fallbackDraft(ctx).text,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5,
      usedChunkIds: Array.isArray(parsed.used_chunk_ids)
        ? parsed.used_chunk_ids
        : [],
    };
  } catch (err) {
    console.error("[draft] LLM error, using fallback:", err);
    return fallbackDraft(ctx);
  }
}
