import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clients, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { NewTicketForm } from "@/components/NewTicketForm";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  let clientList: { id: string; name: string; entityName: string | null }[] = [];
  let staff: { id: string; name: string }[] = [];
  try {
    clientList = await db
      .select({ id: clients.id, name: clients.name, entityName: clients.entityName })
      .from(clients)
      .orderBy(asc(clients.name));
    staff = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .orderBy(asc(users.name));
  } catch {
    // DB not provisioned yet.
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="New ticket"
        subtitle="Log a client message and let the AI draft a grounded reply you can review."
      />
      <div className="mx-auto w-full max-w-2xl p-6">
        <NewTicketForm clients={clientList} staff={staff} />
      </div>
    </div>
  );
}
