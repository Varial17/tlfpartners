"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(
      mode === "signin" ? "/api/auth/login" : "/api/auth/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      signedIn?: boolean;
    };

    if (!res.ok) {
      setLoading(false);
      setError(body.error ?? "Authentication failed.");
      return;
    }

    if (mode === "signup" && !body.signedIn) {
      setLoading(false);
      setMessage(body.message ?? "Account created. You can now sign in.");
      setMode("signin");
      return;
    }

    router.push("/inbox");
    router.refresh();
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center rounded-2xl bg-navy px-6 py-5">
          <Logo />
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-navy">Support Hub</h1>
          <p className="mt-1 text-sm text-muted">
            {isSignup
              ? "Create a Supabase Auth account for the internal support inbox."
              : "Sign in with your Supabase Auth account."}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-full bg-cream p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                !isSignup ? "bg-white text-navy shadow-sm" : "text-muted"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                isSignup ? "bg-white text-navy shadow-sm" : "text-muted"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {isSignup && (
              <div>
                <label className="mb-1 block text-xs font-medium text-navy">
                  Name
                </label>
                <Input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Gary Limardiono"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">
                Email
              </label>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tlfpartners.com.au"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">
                Password
              </label>
              <Input
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? isSignup
                  ? "Creating account..."
                  : "Signing in..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 rounded-xl bg-lightblue/60 px-3 py-2 text-xs text-navy/70">
            Existing seeded staff profiles are linked by email. Create an
            account with the same email to use the Supabase Auth login.
          </p>
        </div>
      </div>
    </div>
  );
}
