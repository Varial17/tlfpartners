"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/inbox");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center rounded-2xl bg-navy px-6 py-5">
          <Logo />
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-navy">Support Hub</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to the internal support inbox.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 rounded-xl bg-lightblue/60 px-3 py-2 text-xs text-navy/70">
            Demo logins are seeded — e.g.{" "}
            <span className="font-medium">gary@tlfpartners.com.au</span> /{" "}
            <span className="font-medium">password</span>
          </p>
        </div>
      </div>
    </div>
  );
}
