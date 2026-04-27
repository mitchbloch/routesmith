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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLibraryClick = (e: React.MouseEvent) => {
    if (user) return; // let Link navigate
    e.preventDefault();
    setPendingNav('/library');
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
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

          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span className="hidden sm:inline max-w-[180px] truncate">{user.email}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-20">
                      <button
                        onClick={handleSignOut}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
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
