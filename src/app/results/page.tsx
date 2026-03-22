'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import RouteCard from '@/components/RouteCard';
import Nav from '@/components/Nav';
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
        <div className="flex-1 flex items-center justify-center pt-14">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">Generating your routes...</p>
            <p className="text-sm text-gray-400 mt-1">Finding the best paths for you</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center pt-14">
          <div className="text-center p-8">
            <p className="text-lg font-medium text-red-600 mb-2">Something went wrong</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/wizard')}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 flex flex-col lg:flex-row pt-14">
          {/* Map */}
          <div className="h-[35vh] sm:h-[40vh] lg:h-full lg:flex-1">
            <MapWithRoute
              routes={routes}
              selectedRouteId={selectedId}
              onRouteSelect={setSelectedId}
              center={prefs ? [prefs.startLocation.lng, prefs.startLocation.lat] : undefined}
            />
          </div>

          {/* Route cards */}
          <div className="flex-1 lg:w-96 lg:flex-none overflow-y-auto p-4 pb-20 lg:pb-4 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {routes.length} Routes Found
            </h2>
            {routes.map((route, i) => (
              <div key={route.id} onClick={() => handleViewDetail(route)} className="cursor-pointer">
                <RouteCard
                  route={route}
                  rank={i + 1}
                  selected={route.id === selectedId}
                  onClick={() => handleRouteClick(route.id)}
                />
              </div>
            ))}
            {routes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No routes found. Try adjusting your preferences.</p>
                <button
                  onClick={() => router.push('/wizard')}
                  className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                >
                  Edit Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
