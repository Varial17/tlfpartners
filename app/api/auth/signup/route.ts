import { NextResponse } from "next/server";
import { ensureProfileForAuthUser } from "@/lib/auth-profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));
  const normalizedEmail =
    typeof email === "string" ? email.toLowerCase().trim() : "";
  const fullName = typeof name === "string" ? name.trim() : "";

  if (!fullName || !normalizedEmail || typeof password !== "string") {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: fullName },
      emailRedirectTo: `${new URL(req.url).origin}/auth/confirm`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    await ensureProfileForAuthUser(data.user, fullName);
  }

  return NextResponse.json({
    ok: true,
    signedIn: Boolean(data.session),
    message: data.session
      ? "Account created."
      : "Account created. Check your email if confirmation is enabled.",
  });
}
