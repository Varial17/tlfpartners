import { Mail, Phone, MessageSquare, Plug } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const channels = [
  {
    icon: Mail,
    name: "Email",
    detail: "support@tlfpartners.com.au",
    note: "Will connect to Outlook via Microsoft Graph in Phase 2.",
  },
  {
    icon: Phone,
    name: "Phone / SMS",
    detail: "+61 3 9000 0000",
    note: "Voice & SMS (e.g. Twilio) planned for Phase 3.",
  },
  {
    icon: MessageSquare,
    name: "Web chat",
    detail: "tlfpartners.com.au widget",
    note: "Embeddable client chat widget planned for Phase 3.",
  },
];

export default function ChannelsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Channels"
        subtitle="The omnichannel vision — all client conversations in one inbox."
      />
      <div className="mx-auto w-full max-w-3xl space-y-5 p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-bright/20 bg-lightblue/40 px-4 py-3 text-sm text-navy">
          <Plug size={18} className="mt-0.5 shrink-0 text-bright" />
          <p>
            These connections are <strong>mocked</strong> for the MVP. Inbound
            messages are simulated and replies are not sent externally — the live
            integrations land in later phases.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.name}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy">
                      <Icon size={20} />
                    </div>
                    <Badge tone="amber">Not yet live</Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy">{c.name}</h3>
                    <p className="text-sm text-navy/70">{c.detail}</p>
                  </div>
                  <p className="text-xs text-muted">{c.note}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
