"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawReturn = searchParams.get("returnTo");
  const returnTo = rawReturn && rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(returnTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="field-card w-full max-w-sm">
        <div className="px-7 pt-7 pb-7">
          <div className="mb-3">
            <span className="text-[13px] font-semibold tracking-tight text-ink">Routesmith</span>
          </div>

          <h1 className="text-[24px] font-semibold leading-tight text-ink mb-1 tracking-tight">
            Sign in
          </h1>
          <p className="text-[13px] text-ink-faded mb-6 leading-snug">
            Sign in to save routes and access your library.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-[12px] text-ink-faded block mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-hairline focus:border-ink py-1.5 text-[14px] text-ink placeholder:text-ink-ghost outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-[12px] text-ink-faded block mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-b border-hairline focus:border-ink py-1.5 text-[14px] text-ink placeholder:text-ink-ghost outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-[12px] text-vermillion-deep">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vermillion text-white py-2.5 mt-2 text-[13px] font-medium hover:bg-vermillion-deep disabled:opacity-50 transition-colors"
            >
              {loading ? "Working…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-[12px] text-ink-faded">
            You can browse and generate routes without an account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
