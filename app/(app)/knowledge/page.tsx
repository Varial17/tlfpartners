import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { knowledgeSources } from "@/lib/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { KnowledgeManager } from "@/components/KnowledgeManager";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  let sources: (typeof knowledgeSources.$inferSelect)[] = [];
  try {
    sources = await db
      .select()
      .from(knowledgeSources)
      .orderBy(desc(knowledgeSources.uploadedAt));
  } catch {
    // DB not provisioned yet — render empty state.
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Knowledge base"
        subtitle="Documents the AI uses to ground every draft reply (PRD §5.5)."
      />
      <div className="mx-auto w-full max-w-3xl p-6">
        <KnowledgeManager sources={sources} />
      </div>
    </div>
  );
}
