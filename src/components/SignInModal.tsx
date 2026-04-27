'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import CompassRose from './ornament/CompassRose';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

type Mode = 'signin' | 'signup';

export default function SignInModal({
  open,
  onClose,
  onSuccess,
  title = 'Sign in',
  subtitle = 'Sign in to save routes and access your library.',
}: SignInModalProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setInfo(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      onSuccess?.();
      onClose();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setInfo('Check your email to confirm your account, then sign in.');
      setMode('signin');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="field-card w-full max-w-sm relative ink-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner accents */}
        <span className="absolute top-2 left-2 w-2 h-2 border-l border-t border-ink" aria-hidden />
        <span className="absolute top-2 right-2 w-2 h-2 border-r border-t border-ink" aria-hidden />
        <span className="absolute bottom-2 left-2 w-2 h-2 border-l border-b border-ink" aria-hidden />
        <span className="absolute bottom-2 right-2 w-2 h-2 border-r border-b border-ink" aria-hidden />

        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-ink-faded hover:text-ink transition-colors p-1"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-7 pt-7 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-ink"><CompassRose size={16} /></span>
            <span className="label-mono-sm">Routesmith</span>
          </div>

          <h2 className="font-display text-[26px] font-semibold leading-tight text-ink mb-1.5"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0, "opsz" 36' }}>
            {title === 'Sign in' && mode === 'signup' ? 'Create account' : title}
          </h2>
          <p className="text-[13px] text-ink-faded mb-5 leading-snug">{subtitle}</p>

          <div className="flex border border-hairline mb-5 text-[11px] font-mono uppercase tracking-[0.18em]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
              className={`flex-1 py-2 transition-colors ${
                mode === 'signin' ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
              className={`flex-1 py-2 transition-colors border-l border-hairline ${
                mode === 'signup' ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="label-mono-sm block mb-1.5">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-hairline focus:border-ink py-1.5 text-ink placeholder:text-ink-ghost outline-none transition-colors font-sans"
              />
            </div>

            <div>
              <label htmlFor="signin-password" className="label-mono-sm block mb-1.5">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent border-b border-hairline focus:border-ink py-1.5 text-ink placeholder:text-ink-ghost outline-none transition-colors font-sans"
              />
            </div>

            {error && (
              <p className="text-[12px] text-vermillion-deep font-mono">— {error}</p>
            )}
            {info && (
              <p className="text-[12px] text-forest font-mono">— {info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vermillion text-paper py-2.5 mt-2 label-mono-sm !text-paper hover:bg-vermillion-deep disabled:opacity-50 transition-colors"
            >
              {loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
