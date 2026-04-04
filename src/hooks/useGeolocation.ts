'use client';

import { useState, useEffect } from 'react';

export interface GeolocationState {
  location: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
}

const BOSTON_FALLBACK = { lat: 42.3601, lng: -71.0589 };
const DEFAULT_TIMEOUT = 5000;

export function useGeolocation(options?: { timeout?: number }): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ location: BOSTON_FALLBACK, loading: false, error: 'Geolocation not supported' });
      return;
    }

    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({
          location: BOSTON_FALLBACK,
          loading: false,
          error: err.message,
        });
      },
      {
        enableHighAccuracy: false,
        timeout,
        maximumAge: 300000, // Cache for 5 minutes
      },
    );
  }, [options?.timeout]);

  return state;
}
