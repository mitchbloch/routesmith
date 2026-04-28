'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getMapboxToken } from '@/lib/mapbox';

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  onMapReady?: (map: mapboxgl.Map) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  marker?: [number, number] | null;
  className?: string;
  interactive?: boolean;
}

export default function Map({
  onLocationSelect,
  onMapReady,
  center = [-71.0589, 42.3601], // Boston default
  zoom = 12,
  marker,
  className = 'w-full h-full',
  interactive = true,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let token: string;
    try {
      token = getMapboxToken();
    } catch (e) {
      setError((e as Error).message);
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
      interactive,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    if (onLocationSelect) {
      map.on('click', (e) => {
        onLocationSelect(e.lngLat.lat, e.lngLat.lng);
      });
    }

    map.on('load', () => {
      onMapReady?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (marker) {
      markerRef.current = new mapboxgl.Marker({ color: '#1E3FFF' })
        .setLngLat(marker)
        .addTo(mapRef.current);
    }
  }, [marker]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-8 max-w-md">
          <p className="text-lg font-semibold text-gray-800 mb-2">Map Unavailable</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
