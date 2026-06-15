"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { KnowledgeSource } from "@/lib/db/schema";

export function KnowledgeManager({ sources }: { sources: KnowledgeSource[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMsg(`Failed to ingest ${file.name}: ${body.error ?? res.status}`);
      } else {
        const body = await res.json();
        setMsg(`Ingested ${file.name} (${body.chunkCount} chunks).`);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Remove this source and its chunks?")) return;
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card
        className="border-2 border-dashed border-navy/20 bg-lightblue/30"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange/20 text-orange-600">
            <Upload size={22} />
          </div>
          <div>
            <p className="font-semibold text-navy">
              Drop SOP / FAQ / policy documents here
            </p>
            <p className="text-sm text-muted">PDF, DOCX, TXT or MD</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Ingesting…
              </>
            ) : (
              <>Choose files</>
            )}
          </Button>
          {msg && <p className="text-sm text-navy/70">{msg}</p>}
        </div>
      </Card>

      <Card>
        <div className="divide-y divide-navy/5">
          {sources.length === 0 && (
            <p className="p-6 text-sm text-muted">
              No sources yet. Upload your SOP and FAQ documents to ground the
              AI's draft replies.
            </p>
          )}
          {sources.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-4">
              <FileText size={18} className="shrink-0 text-navy/50" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">{s.filename}</p>
                <p className="text-xs text-muted">
                  {s.chunkCount} chunks ·{" "}
                  {s.uploadedAt
                    ? new Date(s.uploadedAt).toLocaleDateString("en-AU")
                    : ""}
                </p>
              </div>
              <StatusBadge status={s.status} />
              <button
                onClick={() => onDelete(s.id)}
                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ingested")
    return (
      <Badge tone="green">
        <CheckCircle2 size={12} /> Ingested
      </Badge>
    );
  if (status === "error")
    return (
      <Badge tone="red">
        <AlertCircle size={12} /> Error
      </Badge>
    );
  return (
    <Badge tone="amber">
      <Loader2 size={12} className="animate-spin" /> Processing
    </Badge>
  );
}
