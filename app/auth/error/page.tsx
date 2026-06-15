import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy">Login link failed</h1>
        <p className="mt-2 text-sm text-muted">
          The confirmation link is invalid or has expired.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-orange px-5 text-sm font-semibold text-navy hover:bg-orange-600"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
