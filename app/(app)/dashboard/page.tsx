import { Inbox, ClipboardCheck, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats, type DashboardStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

const empty: DashboardStats = {
  newCount: 0,
  awaitingReview: 0,
  resolvedToday: 0,
  totalDrafts: 0,
  avgDraftsPerConversation: 0,
  sentCount: 0,
  sentAsIs: 0,
  sentEdited: 0,
  pctAsIs: 0,
};

export default async function DashboardPage() {
  let s = empty;
  try {
    s = await getDashboardStats();
  } catch {
    // DB not provisioned yet.
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dashboard"
        subtitle="A light view of inbox throughput and draft quality (PRD §5.6)."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Inbox size={18} />}
            label="New"
            value={s.newCount}
            tone="bg-lightblue/60"
          />
          <Stat
            icon={<ClipboardCheck size={18} />}
            label="Awaiting review"
            value={s.awaitingReview}
            tone="bg-amber-100/70"
          />
          <Stat
            icon={<CheckCircle2 size={18} />}
            label="Resolved today"
            value={s.resolvedToday}
            tone="bg-green-100/70"
          />
          <Stat
            icon={<Sparkles size={18} />}
            label="Drafts generated"
            value={s.totalDrafts}
            tone="bg-orange/20"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-bold text-navy">
                Draft quality — sent as-is vs edited
              </h3>
              <p className="mt-1 text-sm text-muted">
                A proxy for how often drafts are good enough to send without
                changes.
              </p>
              <div className="mt-4">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-extrabold text-navy">
                    {s.pctAsIs}%
                  </span>
                  <span className="text-sm text-muted">
                    sent as-is ({s.sentAsIs} of {s.sentCount})
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-navy/10">
                  <div
                    className="h-full rounded-full bg-orange"
                    style={{ width: `${s.pctAsIs}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted">
                  <span>{s.sentAsIs} sent unchanged</span>
                  <span>{s.sentEdited} edited before sending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-bold text-navy">
                Average drafts per conversation
              </h3>
              <p className="mt-1 text-sm text-muted">
                Includes regenerations — higher can mean prompts need tuning.
              </p>
              <p className="mt-4 text-3xl font-extrabold text-navy">
                {s.avgDraftsPerConversation}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-navy ${tone}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold text-navy">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
