"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Textarea, Input, Select } from "@/components/ui/field";
import { channelMeta, statusMeta, clientTypeLabel } from "@/lib/display";
import { formatRelative } from "@/lib/utils";
import type {
  Conversation as Conv,
  Client,
  Message,
  Draft,
} from "@/lib/db/schema";

type Props = {
  conv: Conv;
  client?: Client;
  thread: Message[];
  draft: Draft | null;
  staff: { id: string; name: string }[];
};

export function Conversation({ conv, client, thread, draft, staff }: Props) {
  const router = useRouter();
  const Ch = channelMeta[conv.channel].icon;
  const st = statusMeta[conv.status] ?? statusMeta.new;

  const [text, setText] = useState(draft?.editedText ?? draft?.generatedText ?? "");
  const [instruction, setInstruction] = useState("");

  // Re-sync the editor when a new draft arrives (generate/regenerate), without
  // clobbering in-progress edits to the same draft. useState's initializer only
  // runs on mount, so we sync explicitly when the draft id changes.
  const lastDraftId = useRef(draft?.id ?? null);
  useEffect(() => {
    const id = draft?.id ?? null;
    if (id !== lastDraftId.current) {
      setText(draft?.editedText ?? draft?.generatedText ?? "");
      lastDraftId.current = id;
    }
  }, [draft]);
  const [busy, setBusy] = useState<null | "send" | "regen" | "escalate" | "assign">(
    null,
  );

  const edited = draft ? text.trim() !== draft.generatedText.trim() : false;

  async function send() {
    if (!draft) return;
    setBusy("send");
    await fetch(`/api/drafts/${draft.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editedText: edited ? text : null }),
    });
    setBusy(null);
    router.refresh();
  }

  async function regenerate() {
    setBusy("regen");
    await fetch("/api/drafts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conv.id, instruction }),
    });
    setInstruction("");
    setBusy(null);
    router.refresh();
  }

  async function patchConv(body: Record<string, unknown>, kind: "escalate" | "assign") {
    setBusy(kind);
    await fetch(`/api/conversations/${conv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    router.refresh();
  }

  const isClosed = conv.status === "sent" || conv.status === "resolved";

  return (
    <div className="flex flex-col">
      {/* header */}
      <div className="border-b border-navy/10 bg-cream/60 px-6 py-4">
        <Link
          href="/inbox"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-bright hover:underline"
        >
          <ArrowLeft size={15} /> Back to inbox
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-extrabold text-navy">{conv.subject}</h1>
          <Badge tone={st.tone}>{st.label}</Badge>
          <Badge tone="grey">
            <Ch size={12} /> {channelMeta[conv.channel].label}
          </Badge>
          {conv.priority === "high" && <Badge tone="red">High priority</Badge>}
          {conv.needsPartnerReview === 1 && (
            <Badge tone="orange">
              <ShieldAlert size={12} /> Needs partner review
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {client?.name}
          {client?.entityName ? ` · ${client.entityName}` : ""}
        </p>
      </div>

      <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* thread */}
          <Thread thread={thread} channel={conv.channel} clientName={client?.name ?? "Client"} />

          {/* draft panel */}
          {draft ? (
            <Card className="border-orange/30">
              <div className="flex items-center justify-between p-5 pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-600" /> AI draft
                  reply
                </CardTitle>
                <ConfidenceBadge
                  confidence={draft.confidence}
                  low={draft.lowConfidence === 1}
                />
              </div>
              <CardContent className="space-y-4">
                {draft.lowConfidence === 1 && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    Low confidence — the knowledge base didn&apos;t have a
                    strong match. Review carefully before sending.
                  </div>
                )}

                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={9}
                  className="font-sans text-sm leading-relaxed"
                />

                <Citations draft={draft} />

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={send} disabled={busy !== null}>
                    {busy === "send" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {edited ? "Send edited reply" : "Approve & send"}
                  </Button>
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="Guidance e.g. 'make it shorter', 'ask for their TFN'"
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={regenerate}
                      disabled={busy !== null}
                    >
                      {busy === "regen" ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isClosed ? (
            <Card>
              <CardContent className="flex items-center gap-2 p-5 text-sm text-green-700">
                <CheckCircle2 size={18} /> Reply sent — conversation resolved.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <span className="text-sm text-muted">
                  No draft yet for this conversation.
                </span>
                <Button onClick={regenerate} disabled={busy !== null}>
                  {busy === "regen" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  Generate draft
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* client panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <CardTitle className="text-base">Client</CardTitle>
              <Detail label="Name" value={client?.name ?? "—"} />
              <Detail label="Entity" value={client?.entityName ?? "—"} />
              <Detail
                label="Type"
                value={clientTypeLabel[client?.type ?? ""] ?? "—"}
              />
              {client?.notes && <Detail label="Notes" value={client.notes} />}
              {client?.openItems && client.openItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted">Open items</p>
                  <ul className="mt-1 space-y-1">
                    {client.openItems.map((it, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-lightblue/50 px-2.5 py-1.5 text-xs text-navy"
                      >
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <CardTitle className="text-base">Triage</CardTitle>
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Assignee</p>
                <Select
                  value={conv.assigneeId ?? ""}
                  disabled={busy !== null}
                  onChange={(e) =>
                    patchConv(
                      { assigneeId: e.target.value || null },
                      "assign",
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant={conv.needsPartnerReview === 1 ? "secondary" : "outline"}
                className="w-full"
                disabled={busy !== null}
                onClick={() =>
                  patchConv(
                    { needsPartnerReview: conv.needsPartnerReview !== 1 },
                    "escalate",
                  )
                }
              >
                <ShieldAlert size={16} />
                {conv.needsPartnerReview === 1
                  ? "Clear partner review"
                  : "Escalate to partner"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Thread({
  thread,
  channel,
  clientName,
}: {
  thread: Message[];
  channel: string;
  clientName: string;
}) {
  // SMS / chat render as bubbles; email and call notes render as cards.
  const bubbles = channel === "sms" || channel === "chat" || channel === "phone";
  return (
    <div className="space-y-3">
      {thread.map((m) => {
        const inbound = m.direction === "inbound";
        if (bubbles) {
          return (
            <div
              key={m.id}
              className={`flex ${inbound ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  inbound
                    ? "bg-white text-navy border border-navy/10"
                    : "bg-orange text-navy"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-60">
                  {inbound ? clientName : "TLF Partners"} ·{" "}
                  {m.createdAt ? formatRelative(m.createdAt) : ""}
                </p>
              </div>
            </div>
          );
        }
        return (
          <Card key={m.id} className={inbound ? "" : "border-bright/20 bg-lightblue/20"}>
            <CardContent className="p-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span className="font-medium text-navy">
                  {inbound ? clientName : "TLF Partners (you)"}
                </span>
                <span>{m.createdAt ? formatRelative(m.createdAt) : ""}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-navy/90">{m.body}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Citations({ draft }: { draft: Draft }) {
  const cites = draft.citations ?? [];
  if (cites.length === 0) return null;
  return (
    <div className="rounded-xl border border-navy/10 bg-cream/50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy">
        <FileText size={13} /> Sources used ({cites.length})
      </p>
      <ul className="space-y-2">
        {cites.map((c, i) => (
          <li key={i} className="text-xs">
            <span className="font-medium text-bright">{c.filename}</span>
            {c.section ? (
              <span className="text-muted"> · {c.section}</span>
            ) : null}
            <p className="mt-0.5 text-navy/70">“{c.snippet}…”</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfidenceBadge({
  confidence,
  low,
}: {
  confidence: number;
  low: boolean;
}) {
  const pct = Math.round(confidence * 100);
  const tone = low ? "amber" : pct >= 75 ? "green" : "blue";
  return <Badge tone={tone}>Confidence {pct}%</Badge>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-sm text-navy">{value}</p>
    </div>
  );
}
