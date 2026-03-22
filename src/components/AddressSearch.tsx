'use client';

import { useRef, useEffect } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { getMapboxToken } from '@/lib/mapbox';

interface AddressSearchProps {
  onResult: (lat: number, lng: number, address: string) => void;
  placeholder?: string;
  className?: string;
  proximity?: [number, number]; // [lng, lat] to bias results toward
}

export default function AddressSearch({
  onResult,
  placeholder = 'Search for an address...',
  className = '',
  proximity,
}: AddressSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);

  useEffect(() => {
    if (!containerRef.current || geocoderRef.current) return;

    let token: string;
    try {
      token = getMapboxToken();
    } catch {
      return;
    }

    const geocoder = new MapboxGeocoder({
      accessToken: token,
      placeholder,
      types: 'address,poi,place',
      marker: false,
      proximity: proximity
        ? { longitude: proximity[0], latitude: proximity[1] }
        : 'ip',
    });

    geocoder.on('result', (e: { result: { center: [number, number]; place_name: string } }) => {
      const [lng, lat] = e.result.center;
      onResult(lat, lng, e.result.place_name);
    });

    geocoder.addTo(containerRef.current);
    geocoderRef.current = geocoder;

    return () => {
      geocoder.onRemove();
      geocoderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
}
