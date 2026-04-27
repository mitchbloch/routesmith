"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import CompassRose from "@/components/ornament/CompassRose";

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
      <div className="field-card w-full max-w-sm relative ink-rise">
        {/* Corner crosshairs */}
        <span className="absolute -top-px -left-px w-3 h-3 border-l border-t border-ink" aria-hidden />
        <span className="absolute -top-px -right-px w-3 h-3 border-r border-t border-ink" aria-hidden />
        <span className="absolute -bottom-px -left-px w-3 h-3 border-l border-b border-ink" aria-hidden />
        <span className="absolute -bottom-px -right-px w-3 h-3 border-r border-b border-ink" aria-hidden />

        <div className="px-7 pt-7 pb-7">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-ink"><CompassRose size={16} /></span>
            <span className="label-mono-sm">Routesmith</span>
          </div>

          <h1
            className="font-display text-[28px] font-semibold leading-tight text-ink mb-1"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 48' }}
          >
            Sign in.
          </h1>
          <p className="text-[13px] text-ink-faded mb-6 leading-snug">
            Sign in to save routes and access your library.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-mono-sm block mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-hairline focus:border-ink py-1.5 text-ink placeholder:text-ink-ghost outline-none transition-colors font-sans"
              />
            </div>

            <div>
              <label htmlFor="password" className="label-mono-sm block mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-b border-hairline focus:border-ink py-1.5 text-ink placeholder:text-ink-ghost outline-none transition-colors font-sans"
              />
            </div>

            {error && (
              <p className="text-[12px] text-vermillion-deep font-mono">— {error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vermillion text-paper py-2.5 mt-2 label-mono-sm !text-paper hover:bg-vermillion-deep disabled:opacity-50 transition-colors"
            >
              {loading ? "Working…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center label-mono-sm">
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
