"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  GripVertical,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { channelMeta, clientTypeLabel, statusMeta } from "@/lib/display";
import { formatRelative } from "@/lib/utils";
import type { InboxRow } from "@/lib/queries";

const columns = [
  { id: "new", title: "New" },
  { id: "drafted", title: "Drafted" },
  { id: "awaiting_review", title: "Review" },
  { id: "sent", title: "Sent" },
  { id: "resolved", title: "Resolved" },
] as const;

type StatusId = (typeof columns)[number]["id"];

export function KanbanBoard({ rows }: { rows: InboxRow[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(rows);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<StatusId | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const next = new Map<StatusId, InboxRow[]>();
    for (const column of columns) next.set(column.id, []);
    for (const ticket of tickets) {
      const status = isStatusId(ticket.status) ? ticket.status : "new";
      next.get(status)?.push(ticket);
    }
    return next;
  }, [tickets]);

  async function moveTicket(id: string, status: StatusId) {
    const current = tickets.find((ticket) => ticket.id === id);
    if (!current || current.status === status) return;

    setSavingId(id);
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status, updatedAt: new Date() } : ticket,
      ),
    );

    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setTickets(rows);
    }
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1120px] grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnRows = grouped.get(column.id) ?? [];
          const st = statusMeta[column.id] ?? statusMeta.new;
          const isOver = overStatus === column.id;

          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setOverStatus(column.id);
              }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                setDraggingId(null);
                setOverStatus(null);
                if (id) void moveTicket(id, column.id);
              }}
              className={`flex min-h-[620px] flex-col rounded-2xl border bg-white/70 transition-colors ${
                isOver
                  ? "border-orange/60 bg-orange/10"
                  : "border-navy/10"
              }`}
            >
              <div className="flex items-center justify-between border-b border-navy/10 px-3 py-3">
                <div>
                  <h2 className="text-base font-bold text-navy">
                    {column.title}
                  </h2>
                  <p className="text-xs text-muted">
                    {columnRows.length} ticket{columnRows.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-3">
                {columnRows.length === 0 && (
                  <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-navy/15 bg-cream/50 px-3 text-center text-sm text-muted">
                    Drop tickets here
                  </div>
                )}

                {columnRows.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    saving={savingId === ticket.id}
                    faded={draggingId === ticket.id}
                    onDragStart={() => setDraggingId(ticket.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStatus(null);
                    }}
                    onMove={(status) => void moveTicket(ticket.id, status)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  saving,
  faded,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  ticket: InboxRow;
  saving: boolean;
  faded: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (status: StatusId) => void;
}) {
  const Ch = channelMeta[ticket.channel].icon;

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", ticket.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border border-navy/10 bg-white p-3 shadow-sm transition ${
        faded ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/conversations/${ticket.id}`}
          className="min-w-0 text-sm font-bold leading-snug text-navy hover:text-bright"
        >
          {ticket.clientName}
        </Link>
        <div className="flex shrink-0 items-center gap-1 text-muted">
          {saving ? (
            <Loader2 size={15} className="animate-spin text-bright" />
          ) : (
            <GripVertical size={15} />
          )}
        </div>
      </div>

      <Link
        href={`/conversations/${ticket.id}`}
        className="block text-sm font-medium leading-snug text-navy/90 hover:text-bright"
      >
        {ticket.subject}
      </Link>

      {ticket.snippet && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">
          {ticket.snippet}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="grey">
          <Ch size={12} /> {channelMeta[ticket.channel].label}
        </Badge>
        <Badge tone="grey">
          {clientTypeLabel[ticket.clientType] ?? ticket.clientType}
        </Badge>
        {ticket.priority === "high" && <Badge tone="red">High</Badge>}
        {ticket.needsPartnerReview && (
          <span title="Needs partner review">
            <ShieldAlert size={15} className="text-orange-600" />
          </span>
        )}
        {ticket.lowConfidence && (
          <span title="Low-confidence draft">
            <AlertTriangle size={15} className="text-amber-500" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-navy/5 pt-3">
        <div className="min-w-0 text-xs text-muted">
          <p className="truncate">{ticket.assigneeName ?? "Unassigned"}</p>
          <p>{ticket.updatedAt ? formatRelative(ticket.updatedAt) : ""}</p>
        </div>
        <Select
          value={ticket.status}
          disabled={saving}
          onChange={(event) => {
            if (isStatusId(event.target.value)) onMove(event.target.value);
          }}
          className="h-8 w-28 rounded-full px-3 py-1 text-xs"
          aria-label={`Move ${ticket.subject}`}
        >
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </Select>
      </div>
    </article>
  );
}

function isStatusId(value: string): value is StatusId {
  return columns.some((column) => column.id === value);
}
