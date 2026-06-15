import { PageHeader } from "@/components/PageHeader";
import { InboxList } from "@/components/InboxList";
import { getInboxRows, type InboxRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  let rows: InboxRow[] = [];
  try {
    rows = await getInboxRows();
  } catch {
    // DB not provisioned yet.
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Inbox"
        subtitle="All client conversations across channels (mocked) in one queue."
      />
      <div className="p-6">
        <InboxList rows={rows} />
      </div>
    </div>
  );
}
