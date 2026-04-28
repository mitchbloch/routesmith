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
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const onRouteSelectRef = useRef(onRouteSelect);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Keep latest callback without retriggering effects
  useEffect(() => {
    onRouteSelectRef.current = onRouteSelect;
  }, [onRouteSelect]);

  // Init map once
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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.on('load', () => setMapLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      startMarkerRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add / replace route layers when the route SET changes (not selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clean any existing route layers (up to 10 just in case)
    for (let i = 0; i < 10; i++) {
      const id = `route-${i}`;
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }

    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
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
          'line-width-transition': { duration: 200, delay: 0 },
          'line-opacity-transition': { duration: 200, delay: 0 },
        },
      });

      map.on('click', id, () => onRouteSelectRef.current?.(route.id));
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });

      route.geometry.coordinates.forEach(coord => {
        bounds.extend(coord as [number, number]);
      });
    });

    const startCoord = routes[0].geometry.coordinates[0] as [number, number];
    startMarkerRef.current = new mapboxgl.Marker({ color: '#1E3FFF' })
      .setLngLat(startCoord)
      .addTo(map);

    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
  }, [routes, mapLoaded]);

  // Update only paint properties when selection changes — no teardown, no camera fly
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || routes.length === 0) return;

    routes.forEach((route, i) => {
      const id = `route-${i}`;
      if (!map.getLayer(id)) return;
      const isSelected = selectedRouteId ? route.id === selectedRouteId : i === 0;
      map.setPaintProperty(id, 'line-width', isSelected ? 5 : 3);
      map.setPaintProperty(id, 'line-opacity', isSelected ? 1 : 0.5);
    });
  }, [selectedRouteId, routes, mapLoaded]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
