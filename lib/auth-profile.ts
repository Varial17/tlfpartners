import { eq } from "drizzle-orm";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const SUPABASE_AUTH_PASSWORD_SENTINEL = "supabase-auth";

export async function getProfileByEmail(email: string) {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return profile ?? null;
}

export async function ensureProfileForAuthUser(
  authUser: SupabaseUser,
  fallbackName?: string | null,
) {
  if (!authUser.email) return null;

  const email = authUser.email.toLowerCase();
  const existing = await getProfileByEmail(email);
  if (existing) return existing;

  const metadataName =
    typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : null;

  const [profile] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      name: fallbackName?.trim() || metadataName || email,
      passwordHash: SUPABASE_AUTH_PASSWORD_SENTINEL,
      role: "staff",
    })
    .returning();

  return profile;
}
