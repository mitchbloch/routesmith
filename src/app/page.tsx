'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
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
            <div className="w-6 h-6 border-2 border-hairline border-t-vermillion rounded-full compass-spin mx-auto mb-3" />
            <p className="text-[12px] text-ink-faded">Locating</p>
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

      {/* Search — floats over map, top-left under nav */}
      <div className="absolute top-16 left-4 right-4 sm:left-6 sm:right-auto z-10 sm:w-[400px] ink-rise">
        <AddressSearch
          onResult={(lat, lng, address) => handleLocationSelect(lat, lng, address)}
          placeholder="Search an address, or tap the map"
          proximity={proximity}
        />
      </div>

      {/* Start point card — floats bottom-left when chosen */}
      {location && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-10 sm:w-[400px] ink-rise">
          <div className="field-card">
            <div className="px-4 pt-3 pb-3">
              <p className="text-[12px] font-medium text-ink-faded mb-1">Start</p>
              <p className="text-[14px] leading-snug text-ink mb-3 truncate" title={location.address}>
                {location.address ?? <span className="text-ink-faded italic">Resolving address…</span>}
              </p>

              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-between bg-vermillion hover:bg-vermillion-deep text-white px-4 py-2.5 transition-colors text-[13px] font-medium"
              >
                <span>Plot a route</span>
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
