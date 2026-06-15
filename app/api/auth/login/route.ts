import { NextResponse } from "next/server";
import { ensureProfileForAuthUser } from "@/lib/auth-profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const normalizedEmail =
    typeof email === "string" ? email.toLowerCase().trim() : "";

  if (!normalizedEmail || typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  await ensureProfileForAuthUser(data.user);

  return NextResponse.json({ ok: true });
}
