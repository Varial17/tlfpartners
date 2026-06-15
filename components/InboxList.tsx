"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { channelMeta, statusMeta, clientTypeLabel } from "@/lib/display";
import { formatRelative } from "@/lib/utils";
import type { InboxRow } from "@/lib/queries";

export function InboxList({ rows }: { rows: InboxRow[] }) {
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [pri, setPri] = useState("all");

  const assignees = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) if (r.assigneeId && r.assigneeName) m.set(r.assigneeId, r.assigneeName);
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (channel !== "all" && r.channel !== channel) return false;
    if (status !== "all" && r.status !== status) return false;
    if (assignee !== "all" && r.assigneeId !== assignee) return false;
    if (pri !== "all" && r.priority !== pri) return false;
    if (q) {
      const hay = `${r.clientName} ${r.subject} ${r.snippet}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search client or keyword…"
            className="pl-9"
          />
        </div>
        <Select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-auto min-w-36"
        >
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="phone">Phone / SMS</option>
          <option value="chat">Chat</option>
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-auto min-w-36"
        >
          <option value="all">All statuses</option>
          {Object.entries(statusMeta).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <Select
          value={pri}
          onChange={(e) => setPri(e.target.value)}
          className="w-auto min-w-36"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </Select>
        <Select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-auto min-w-40"
        >
          <option value="all">All assignees</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">
            No conversations match your filters.
          </p>
        )}
        <ul className="divide-y divide-navy/5">
          {filtered.map((r) => {
            const Ch = channelMeta[r.channel].icon;
            const st = statusMeta[r.status] ?? statusMeta.new;
            return (
              <li key={r.id}>
                <Link
                  href={`/conversations/${r.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-lightblue/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/70">
                    <Ch size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-navy">
                        {r.clientName}
                      </span>
                      <Badge tone="grey">
                        {clientTypeLabel[r.clientType] ?? r.clientType}
                      </Badge>
                      {r.priority === "high" && (
                        <Badge tone="red">High</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-navy/90">
                      {r.subject}
                    </p>
                    <p className="truncate text-xs text-muted">{r.snippet}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      {r.needsPartnerReview && (
                        <span title="Needs partner review">
                          <ShieldAlert size={15} className="text-orange-600" />
                        </span>
                      )}
                      {r.lowConfidence && (
                        <span title="Low-confidence draft — needs human">
                          <AlertTriangle size={15} className="text-amber-500" />
                        </span>
                      )}
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <span className="text-xs text-muted">
                      {r.assigneeName ?? "Unassigned"} ·{" "}
                      {r.updatedAt ? formatRelative(r.updatedAt) : ""}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
