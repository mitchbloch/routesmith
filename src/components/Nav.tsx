'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { createClient } from '@/lib/supabase/client';
import SignInModal from './SignInModal';

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
      <nav className="absolute top-0 left-0 right-0 z-20 bg-paper/95 backdrop-blur-md border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <span className="text-[15px] font-semibold tracking-tight text-ink leading-none group-hover:text-vermillion transition-colors">
              Routesmith
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/library"
              onClick={handleLibraryClick}
              className={`text-[12px] font-medium px-2.5 py-1.5 transition-colors ${
                isLibrary ? 'text-vermillion' : 'text-ink-faded hover:text-ink'
              }`}
            >
              Library
            </Link>

            {loading ? (
              <span className="w-16" />
            ) : user ? (
              <>
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 max-w-[220px] ml-2 mr-1"
                  title={user.email ?? undefined}
                >
                  <span className="text-[12px] text-ink-faded truncate">{user.email}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-[12px] font-medium px-2.5 py-1.5 text-ink-faded hover:text-vermillion transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setPendingNav(null); setModalOpen(true); }}
                className="text-[12px] font-medium px-2.5 py-1.5 text-ink hover:text-vermillion transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
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
