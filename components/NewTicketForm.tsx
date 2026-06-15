"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Channel = "email" | "phone" | "chat";

const channelOptions: { value: Channel; label: string; icon: typeof Mail }[] = [
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone / SMS", icon: Phone },
  { value: "chat", label: "Chat", icon: MessageSquare },
];

export function NewTicketForm({
  clients,
  staff,
}: {
  clients: { id: string; name: string; entityName: string | null }[];
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();

  const [channel, setChannel] = useState<Channel>("email");
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "__new");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEntity, setNewClientEntity] = useState("");
  const [newClientType, setNewClientType] = useState("individual");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewClient = clientId === "__new";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        subject,
        message,
        priority,
        assigneeId: assigneeId || undefined,
        clientId: isNewClient ? undefined : clientId,
        newClientName: isNewClient ? newClientName : undefined,
        newClientEntity: isNewClient ? newClientEntity : undefined,
        newClientType: isNewClient ? newClientType : undefined,
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      conversationId?: string;
      error?: string;
    };

    if (!res.ok || !body.conversationId) {
      setLoading(false);
      setError(body.error ?? "Failed to create ticket.");
      return;
    }

    // Land on the conversation so you can watch the AI's drafted reply.
    router.push(`/conversations/${body.conversationId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Channel */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {channelOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannel(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    channel === value
                      ? "border-orange bg-orange/15 font-semibold text-navy"
                      : "border-navy/15 text-navy/70 hover:bg-navy/5",
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Client
            </label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.entityName ? ` — ${c.entityName}` : ""}
                </option>
              ))}
              <option value="__new">+ New client…</option>
            </Select>
          </div>

          {isNewClient && (
            <div className="grid gap-3 rounded-xl bg-lightblue/30 p-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-navy">
                  Name
                </label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Jane Smith"
                  required={isNewClient}
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-navy">
                  Entity (optional)
                </label>
                <Input
                  value={newClientEntity}
                  onChange={(e) => setNewClientEntity(e.target.value)}
                  placeholder="Smith Pty Ltd"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-navy">
                  Type
                </label>
                <Select
                  value={newClientType}
                  onChange={(e) => setNewClientType(e.target.value)}
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="smsf">SMSF</option>
                </Select>
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. When is my BAS due?"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Client message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Paste or type the client's message here…"
              required
            />
          </div>

          {/* Priority + assignee */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Priority
              </label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Assign to
              </label>
              <Select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Me</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating ticket &
                drafting reply…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Create ticket & generate AI reply
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted">
            The AI drafts a grounded reply from the knowledge base — you&apos;ll
            land on the conversation to review, edit, and send it.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
