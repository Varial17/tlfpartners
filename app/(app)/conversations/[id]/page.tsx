import { notFound } from "next/navigation";
import { getConversationDetail } from "@/lib/queries";
import { Conversation } from "@/components/Conversation";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getConversationDetail(id).catch(() => null);
  if (!detail || !detail.conv) notFound();

  return (
    <Conversation
      conv={detail.conv}
      client={detail.client}
      thread={detail.thread}
      draft={detail.draft}
      staff={detail.staff}
    />
  );
}
