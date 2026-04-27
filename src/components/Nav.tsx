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
    if (user) return; // let Link navigate
    e.preventDefault();
    setPendingNav('/library');
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const linkClass = (href: string, base = 'text-gray-500 hover:text-gray-900') =>
    `text-sm font-medium transition-colors ${pathname === href ? 'text-blue-600' : base}`;

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className={pathname === '/' ? 'text-blue-600 text-lg font-bold' : 'text-gray-900 text-lg font-bold'}>
              Routesmith
            </Link>
            <Link href="/library" onClick={handleLibraryClick} className={linkClass('/library')}>
              Library
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <>
                <span
                  className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-600 max-w-[200px]"
                  title={user.email ?? undefined}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="truncate">{user.email}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setPendingNav(null); setModalOpen(true); }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
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
