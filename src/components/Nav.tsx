'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { createClient } from '@/lib/supabase/client';
import SignInModal from './SignInModal';
import CompassRose from './ornament/CompassRose';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const handleLibraryClick = (e: React.MouseEvent) => {
    if (user) return;
    e.preventDefault();
    setPendingNav('/library');
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const isLibrary = pathname === '/library';

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-20 bg-paper/92 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-ink group-hover:text-vermillion transition-colors">
                <CompassRose size={22} />
              </span>
              <span className="font-display text-[19px] font-semibold tracking-tight text-ink leading-none" style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 14' }}>
                Routesmith
              </span>
            </Link>
            <span className="hidden md:inline label-mono-sm">— a fieldbook of routes</span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/library"
              onClick={handleLibraryClick}
              className={`label-mono-sm px-3 py-1.5 transition-colors ${
                isLibrary ? 'text-vermillion' : 'text-ink-faded hover:text-ink'
              }`}
            >
              Library
            </Link>

            <span className="mx-2 h-4 w-px bg-hairline hidden sm:block" aria-hidden />

            {loading ? (
              <span className="w-20" />
            ) : user ? (
              <>
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 max-w-[180px] mr-1"
                  title={user.email ?? undefined}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper text-[11px] font-mono font-semibold shrink-0">
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="font-mono text-[11px] text-ink-faded truncate">{user.email}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="label-mono-sm px-3 py-1.5 text-ink-faded hover:text-vermillion transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setPendingNav(null); setModalOpen(true); }}
                className="label-mono-sm px-3 py-1.5 text-ink hover:text-vermillion transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Tick-rule hairline bottom edge */}
        <div className="text-ink absolute left-0 right-0 -bottom-px">
          <svg viewBox="0 0 1200 6" preserveAspectRatio="none" className="w-full h-[6px] block" aria-hidden>
            <line x1="0" y1="3" x2="1200" y2="3" stroke="currentColor" strokeWidth="0.5" opacity="0.45" />
            {Array.from({ length: 51 }).map((_, i) => {
              const x = i * 24;
              const major = i % 5 === 0;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={major ? 0 : 2}
                  x2={x}
                  y2={major ? 6 : 4}
                  stroke="currentColor"
                  strokeWidth={major ? 0.7 : 0.4}
                  opacity={major ? 0.55 : 0.35}
                />
              );
            })}
          </svg>
        </div>
      </nav>

      <SignInModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          if (pendingNav) {
            const target = pendingNav;
            setPendingNav(null);
            router.push(target);
          } else {
            router.refresh();
          }
        }}
      />
    </>
  );
}
