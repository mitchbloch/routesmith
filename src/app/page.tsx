'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import Coordinate from '@/components/ornament/Coordinate';
import CompassRose from '@/components/ornament/CompassRose';
import { reverseGeocode } from '@/lib/geocoding';
import { useGeolocation } from '@/hooks/useGeolocation';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const AddressSearch = dynamic(() => import('@/components/AddressSearch'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const geo = useGeolocation();
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [marker, setMarker] = useState<[number, number] | null>(null);

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLocation({ lat, lng, address });
    setMarker([lng, lat]);

    if (!address) {
      reverseGeocode(lat, lng).then((resolved) => {
        if (resolved) {
          setLocation((prev) => prev && prev.lat === lat && prev.lng === lng ? { ...prev, address: resolved } : prev);
        }
      });
    }
  };

  const handleGenerate = () => {
    if (!location) return;
    sessionStorage.setItem('routesmith_start', JSON.stringify(location));
    router.push('/wizard');
  };

  if (geo.loading) {
    return (
      <div className="h-screen w-screen relative bg-paper">
        <Nav />
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-ink mx-auto mb-5 w-fit">
              <CompassRose size={56} spin />
            </div>
            <p className="label-mono">Locating · finding your bearings</p>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = geo.location
    ? [geo.location.lng, geo.location.lat]
    : [-71.0589, 42.3601];

  const proximity: [number, number] = mapCenter;

  return (
    <div className="h-screen w-screen relative bg-paper">
      <Nav />
      <Map
        onLocationSelect={(lat, lng) => handleLocationSelect(lat, lng)}
        center={mapCenter}
        marker={marker}
        className="w-full h-full"
      />

      {/* Masthead — sits below nav, above search */}
      <div className="absolute top-16 left-0 right-0 z-10 px-5 pointer-events-none">
        <div className="max-w-lg mx-auto text-center ink-rise">
          <p className="label-mono-sm mb-1" style={{ animationDelay: '50ms' }}>Plate I · Personal cartography</p>
          <h1
            className="font-display text-[44px] sm:text-[52px] leading-[0.95] font-semibold text-ink tracking-tight"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144', animationDelay: '100ms' }}
          >
            A fieldbook
            <span className="block italic text-ink-soft" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}> of routes.</span>
          </h1>
        </div>
      </div>

      {/* Search overlay */}
      <div className="absolute top-[200px] sm:top-[220px] left-4 right-4 z-10 max-w-lg mx-auto ink-rise" style={{ animationDelay: '180ms' }}>
        <AddressSearch
          onResult={(lat, lng, address) => handleLocationSelect(lat, lng, address)}
          placeholder="Search for an address, or tap the map…"
          proximity={proximity}
        />
      </div>

      {/* CTA — Logbook Entry card */}
      {location && (
        <div className="absolute bottom-6 left-4 right-4 z-10 max-w-lg mx-auto ink-rise">
          <div className="field-card relative">
            {/* Corner crosshairs */}
            <span className="absolute -top-px -left-px w-3 h-3 border-l border-t border-ink" aria-hidden />
            <span className="absolute -top-px -right-px w-3 h-3 border-r border-t border-ink" aria-hidden />
            <span className="absolute -bottom-px -left-px w-3 h-3 border-l border-b border-ink" aria-hidden />
            <span className="absolute -bottom-px -right-px w-3 h-3 border-r border-b border-ink" aria-hidden />

            <div className="px-5 pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label-mono-sm">Logbook entry · start point</span>
                <span className="coord-mono text-ink-faded">№01</span>
              </div>

              {location.address ? (
                <p className="font-display text-[18px] leading-tight text-ink mb-1 truncate" title={location.address}
                   style={{ fontVariationSettings: '"SOFT" 50, "opsz" 24' }}>
                  {location.address}
                </p>
              ) : (
                <p className="font-display text-[18px] leading-tight text-ink-faded italic mb-1">
                  Resolving address…
                </p>
              )}

              <Coordinate lat={location.lat} lng={location.lng} className="block mb-4" />

              <button
                onClick={handleGenerate}
                className="w-full group flex items-center justify-between bg-vermillion hover:bg-vermillion-deep text-paper px-5 py-3 transition-colors"
              >
                <span className="label-mono-sm !text-paper">Plot a route</span>
                <span className="font-mono text-[13px] text-paper/80 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {!location && (
        <div className="absolute bottom-6 left-4 right-4 z-10 max-w-lg mx-auto ink-rise" style={{ animationDelay: '240ms' }}>
          <div className="field-card px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-ink-faded mt-0.5"><CompassRose size={18} /></span>
              <div className="flex-1">
                <p className="label-mono-sm mb-1">Awaiting bearings</p>
                <p className="font-display text-[15px] text-ink-soft leading-snug">
                  Search for a place, or tap a point on the map to set your start.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
