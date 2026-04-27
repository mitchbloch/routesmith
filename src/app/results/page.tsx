'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import RouteCard from '@/components/RouteCard';
import Nav from '@/components/Nav';
import CompassRose from '@/components/ornament/CompassRose';
import type { GeneratedRoute, UserPreferences } from '@/lib/types';

const MapWithRoute = dynamic(() => import('@/components/MapWithRoute'), { ssr: false });

export default function ResultsPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<GeneratedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const prefsStr = sessionStorage.getItem('routesmith_prefs');
    if (!prefsStr) {
      router.replace('/');
      return;
    }

    const parsed: UserPreferences = JSON.parse(prefsStr);
    setPrefs(parsed);

    // Use cached routes if available (e.g. navigating back from route detail)
    const cachedRoutes = sessionStorage.getItem('routesmith_routes');
    if (cachedRoutes) {
      try {
        const cached: GeneratedRoute[] = JSON.parse(cachedRoutes);
        if (cached.length > 0) {
          setRoutes(cached);
          setSelectedId(cached[0].id);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to fresh generation
      }
    }

    fetch('/api/generate-routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: prefsStr,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to generate routes');
        const data = await res.json();
        setRoutes(data.routes);
        sessionStorage.setItem('routesmith_routes', JSON.stringify(data.routes));
        if (data.routes.length > 0) setSelectedId(data.routes[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleRouteClick = (id: string) => {
    setSelectedId(id);
  };

  const handleViewDetail = (route: GeneratedRoute) => {
    sessionStorage.setItem('routesmith_route', JSON.stringify(route));
    sessionStorage.setItem('routesmith_routes', JSON.stringify(routes));
    router.push(`/route/${route.id}`);
  };

  return (
    <div className="h-screen flex flex-col">
      <Nav />

      {loading && (
        <div className="flex-1 flex items-center justify-center pt-14 bg-paper">
          <div className="text-center">
            <div className="text-ink mx-auto mb-5 w-fit">
              <CompassRose size={56} spin />
            </div>
            <p className="font-display text-[20px] text-ink leading-tight"
               style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}>
              Plotting your routes…
            </p>
            <p className="label-mono-sm mt-2">Surveying paths · scoring corridors</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center pt-14 bg-paper">
          <div className="field-card max-w-sm mx-4 px-6 py-6 text-center">
            <p className="label-mono-sm !text-vermillion mb-2">— Survey failed</p>
            <p className="font-display text-[20px] text-ink mb-2"
               style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}>
              We couldn&apos;t plot routes here.
            </p>
            <p className="text-[13px] text-ink-faded mb-4">{error}</p>
            <button
              onClick={() => router.push('/wizard')}
              className="bg-vermillion text-paper px-5 py-2 label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors"
            >
              Adjust survey
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 flex flex-col lg:flex-row pt-14 bg-paper">
          {/* Map */}
          <div className="h-[35vh] sm:h-[40vh] lg:h-full lg:flex-1 relative">
            <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-ink z-10 pointer-events-none" aria-hidden />
            <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-ink z-10 pointer-events-none" aria-hidden />
            <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-ink z-10 pointer-events-none" aria-hidden />
            <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-ink z-10 pointer-events-none" aria-hidden />
            <MapWithRoute
              routes={routes}
              selectedRouteId={selectedId}
              onRouteSelect={setSelectedId}
              center={prefs ? [prefs.startLocation.lng, prefs.startLocation.lat] : undefined}
            />
          </div>

          {/* Route cards */}
          <div className="flex-1 lg:w-[420px] lg:flex-none overflow-y-auto p-4 pb-20 lg:pb-4 space-y-3 lg:border-l lg:border-hairline">
            <div className="mb-3">
              <p className="label-mono-sm">Survey complete · {routes.length} candidate{routes.length === 1 ? '' : 's'}</p>
              <h2
                className="font-display text-[24px] font-semibold text-ink leading-tight"
                style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}
              >
                Choose your line.
              </h2>
            </div>
            {routes.map((route, i) => (
              <div key={route.id} onClick={() => handleViewDetail(route)} className="cursor-pointer ink-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <RouteCard
                  route={route}
                  rank={i + 1}
                  selected={route.id === selectedId}
                  onClick={() => handleRouteClick(route.id)}
                />
              </div>
            ))}
            {routes.length === 0 && (
              <div className="field-card px-5 py-6 text-center">
                <p className="label-mono-sm mb-2">— No routes</p>
                <p className="text-[14px] text-ink-faded mb-4">Try adjusting your preferences.</p>
                <button
                  onClick={() => router.push('/wizard')}
                  className="bg-vermillion text-paper px-5 py-2 label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors"
                >
                  Adjust survey
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
