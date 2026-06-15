import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export type AppSession = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: "staff" | "admin";
  };
};

export async function auth(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser?.email) return null;

  const email = authUser.email.toLowerCase();
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return {
    user: {
      id: profile?.id ?? authUser.id,
      name:
        profile?.name ??
        (typeof authUser.user_metadata?.name === "string"
          ? authUser.user_metadata.name
          : null),
      email,
      role: profile?.role ?? "staff",
    },
  };
}
