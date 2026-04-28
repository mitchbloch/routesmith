'use client';

import { useSyncExternalStore } from 'react';
import type { GeneratedRoute } from './types';

type MapState = {
  routes: GeneratedRoute[];
  activeRoute: GeneratedRoute | null;
  selectedRouteId: string | null;
  center: [number, number] | null;
};

let state: MapState = {
  routes: [],
  activeRoute: null,
  selectedRouteId: null,
  center: null,
};

const listeners = new Set<() => void>();

export const mapStore = {
  get: () => state,
  set: (next: Partial<MapState>) => {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

const subscribe = (l: () => void) => mapStore.subscribe(l);
const getSnapshot = () => state;

export function useMapState(): MapState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
