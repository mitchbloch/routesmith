import type { SavedRoute } from './types';

const STORAGE_KEY = 'routesmith_routes';

export function getSavedRoutes(): SavedRoute[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRoute(route: SavedRoute): void {
  const routes = getSavedRoutes();
  const existing = routes.findIndex(r => r.id === route.id);
  if (existing >= 0) {
    routes[existing] = route;
  } else {
    routes.unshift(route);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export function deleteRoute(id: string): void {
  const routes = getSavedRoutes().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export function updateRoute(id: string, updates: Partial<SavedRoute>): void {
  const routes = getSavedRoutes();
  const idx = routes.findIndex(r => r.id === id);
  if (idx >= 0) {
    routes[idx] = { ...routes[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  }
}
