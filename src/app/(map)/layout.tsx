'use client';

import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import { useMapState, mapStore } from '@/lib/mapStore';

const MapWithRoute = dynamic(() => import('@/components/MapWithRoute'), { ssr: false });

export default function MapGroupLayout({ children }: { children: React.ReactNode }) {
  const { routes, activeRoute, selectedRouteId, center } = useMapState();
  const displayed = activeRoute ? [activeRoute] : routes;

  return (
    <div className="h-screen flex flex-col bg-paper">
      <Nav />
      <div className="flex-1 flex flex-col lg:flex-row pt-12">
        <div className="h-[35vh] sm:h-[40vh] lg:h-full lg:flex-1 relative">
          <MapWithRoute
            routes={displayed}
            selectedRouteId={selectedRouteId}
            onRouteSelect={(id) => mapStore.set({ selectedRouteId: id })}
            center={center ?? undefined}
          />
        </div>
        <div className="flex-1 lg:w-[420px] lg:flex-none overflow-y-auto lg:border-l lg:border-hairline">
          {children}
        </div>
      </div>
    </div>
  );
}
