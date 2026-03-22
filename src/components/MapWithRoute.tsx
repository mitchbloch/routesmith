'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getMapboxToken } from '@/lib/mapbox';
import type { GeneratedRoute } from '@/lib/types';

interface MapWithRouteProps {
  routes: GeneratedRoute[];
  selectedRouteId?: string | null;
  onRouteSelect?: (id: string) => void;
  center?: [number, number];
  className?: string;
}

export default function MapWithRoute({
  routes,
  selectedRouteId,
  onRouteSelect,
  center,
  className = 'w-full h-full',
}: MapWithRouteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

    const defaultCenter: [number, number] = center ||
      (routes[0]?.geometry.coordinates[0] as [number, number]) ||
      [-87.6298, 41.8781];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: defaultCenter,
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.on('load', () => setMapLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clean existing layers
    routes.forEach((_, i) => {
      const id = `route-${i}`;
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    // Also clean extras
    for (let i = routes.length; i < 10; i++) {
      const id = `route-${i}`;
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }

    if (routes.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    routes.forEach((route, i) => {
      const id = `route-${i}`;
      const isSelected = selectedRouteId ? route.id === selectedRouteId : i === 0;

      map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { routeId: route.id },
          geometry: route.geometry,
        },
      });

      map.addLayer({
        id,
        type: 'line',
        source: id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': route.color,
          'line-width': isSelected ? 5 : 3,
          'line-opacity': isSelected ? 1 : 0.5,
        },
      });

      if (onRouteSelect) {
        map.on('click', id, () => onRouteSelect(route.id));
        map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
      }

      route.geometry.coordinates.forEach(coord => {
        bounds.extend(coord as [number, number]);
      });
    });

    // Add start marker
    const startCoord = routes[0].geometry.coordinates[0] as [number, number];
    new mapboxgl.Marker({ color: '#3b82f6' }).setLngLat(startCoord).addTo(map);

    map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
  }, [routes, selectedRouteId, mapLoaded, onRouteSelect]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
