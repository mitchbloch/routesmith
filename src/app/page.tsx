'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import { reverseGeocode } from '@/lib/geocoding';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const AddressSearch = dynamic(() => import('@/components/AddressSearch'), { ssr: false });

export default function Home() {
  const router = useRouter();
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

  return (
    <div className="h-screen w-screen relative">
      <Nav />
      <Map
        onLocationSelect={(lat, lng) => handleLocationSelect(lat, lng)}
        marker={marker}
        className="w-full h-full"
      />

      {/* Search overlay */}
      <div className="absolute top-20 left-4 right-4 z-10 max-w-lg mx-auto">
        <AddressSearch
          onResult={(lat, lng, address) => handleLocationSelect(lat, lng, address)}
          placeholder="Where do you want to start?"
        />
      </div>

      {/* CTA */}
      {location && (
        <div className="absolute bottom-8 left-4 right-4 z-10 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            {location.address && (
              <p className="text-sm text-gray-500 mb-3 truncate">{location.address}</p>
            )}
            <button
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition-colors"
            >
              Generate Route
            </button>
          </div>
        </div>
      )}

      {/* Hint */}
      {!location && (
        <div className="absolute bottom-8 left-4 right-4 z-10 max-w-lg mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 text-center">
            <p className="text-gray-600">
              Search for an address or tap the map to set your starting point
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
