import { KanbanBoard } from "@/components/KanbanBoard";
import { PageHeader } from "@/components/PageHeader";
import { getInboxRows, type InboxRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  let rows: InboxRow[] = [];
  try {
    rows = await getInboxRows();
  } catch {
    // DB not provisioned yet.
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Ticket board"
        subtitle="Move client conversations through review, send, and resolution."
      />
      <div className="p-6">
        <KanbanBoard rows={rows} />
      </div>
    </div>
  );
}
