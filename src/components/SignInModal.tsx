'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
      // Reset on close so a reopen feels fresh
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

    // signup
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmations are enabled, session will be null until verified.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">{subtitle}</p>

        <div className="mb-4 flex rounded-lg bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="signin-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="signin-password" className="mb-1 block text-sm font-medium text-gray-700">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-blue-600">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
