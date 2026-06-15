import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { conversations } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.status === "string") patch.status = body.status;
  if (body.assigneeId !== undefined) patch.assigneeId = body.assigneeId;
  if (typeof body.needsPartnerReview === "boolean")
    patch.needsPartnerReview = body.needsPartnerReview ? 1 : 0;

  await db
    .update(conversations)
    .set(patch)
    .where(eq(conversations.id, id));

  return NextResponse.json({ ok: true });
}
