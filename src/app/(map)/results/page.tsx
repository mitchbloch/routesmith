'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RouteCard from '@/components/RouteCard';
import { mapStore, useMapState } from '@/lib/mapStore';
import type { GeneratedRoute, UserPreferences } from '@/lib/types';

export default function ResultsPage() {
  const router = useRouter();
  const { routes, selectedRouteId } = useMapState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mapStore.set({ activeRoute: null });

    const prefsStr = sessionStorage.getItem('routesmith_prefs');
    if (!prefsStr) {
      router.replace('/');
      return;
    }

    const parsed: UserPreferences = JSON.parse(prefsStr);
    mapStore.set({ center: [parsed.startLocation.lng, parsed.startLocation.lat] });

    const cachedRoutes = sessionStorage.getItem('routesmith_routes');
    if (cachedRoutes) {
      try {
        const cached: GeneratedRoute[] = JSON.parse(cachedRoutes);
        if (cached.length > 0) {
          mapStore.set({ routes: cached, selectedRouteId: cached[0].id });
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
        sessionStorage.setItem('routesmith_routes', JSON.stringify(data.routes));
        if (data.routes.length > 0) {
          mapStore.set({ routes: data.routes, selectedRouteId: data.routes[0].id });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleViewDetail = (route: GeneratedRoute) => {
    sessionStorage.setItem('routesmith_route', JSON.stringify(route));
    sessionStorage.setItem('routesmith_routes', JSON.stringify(routes));
    mapStore.set({ activeRoute: route, selectedRouteId: route.id });
    router.push(`/route/${route.id}`);
  };

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="text-center py-16">
          <div className="w-7 h-7 border-2 border-hairline border-t-vermillion rounded-full compass-spin mx-auto mb-4" />
          <p className="text-[16px] text-ink leading-tight">Plotting your routes…</p>
          <p className="text-[12px] text-ink-faded mt-1.5">Surveying paths and scoring corridors</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <div className="field-card px-5 py-6 text-center mt-4">
          <p className="text-[12px] text-vermillion font-medium mb-2">Something went wrong</p>
          <p className="text-[16px] font-semibold text-ink mb-2 leading-tight">
            We couldn&apos;t plot routes here.
          </p>
          <p className="text-[13px] text-ink-faded mb-5">{error}</p>
          <button
            onClick={() => router.push('/wizard')}
            className="bg-vermillion text-white px-5 py-2 text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
          >
            Adjust preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-3">
      <div className="mb-4">
        <p className="text-[12px] text-ink-faded mb-0.5">
          {routes.length} candidate{routes.length === 1 ? '' : 's'}
        </p>
        <h2 className="text-[22px] font-semibold text-ink leading-tight tracking-tight">
          Choose your route
        </h2>
      </div>
      {routes.map((route, i) => (
        <div key={route.id} onClick={() => handleViewDetail(route)} className="cursor-pointer">
          <RouteCard
            route={route}
            rank={i + 1}
            selected={route.id === selectedRouteId}
            onClick={() => mapStore.set({ selectedRouteId: route.id })}
          />
        </div>
      ))}
      {routes.length === 0 && (
        <div className="field-card px-5 py-6 text-center">
          <p className="text-[14px] text-ink mb-1 font-medium">No matches</p>
          <p className="text-[13px] text-ink-faded mb-4">Try adjusting your preferences.</p>
          <button
            onClick={() => router.push('/wizard')}
            className="bg-vermillion text-white px-5 py-2 text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
          >
            Adjust preferences
          </button>
        </div>
      )}
    </div>
  );
}
