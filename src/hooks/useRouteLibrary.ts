'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedRoute, GeneratedRoute, ActivityType } from '@/lib/types';

const LEGACY_STORAGE_KEY = 'routesmith_routes';
const MIGRATION_FLAG = 'routesmith_migrated';

export function useRouteLibrary() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Fetch routes from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        // Migrate localStorage data if present
        await migrateLocalStorage();

        const res = await fetch('/api/routes');
        if (res.ok) {
          const data = await res.json();
          setRoutes(data);
        }
      } catch {
        // Silently fail — user may not be authenticated
      }
      setHydrated(true);
    }
    load();
  }, []);

  const save = useCallback(async (route: GeneratedRoute, activityType: ActivityType, startAddress?: string) => {
    const saved: SavedRoute = {
      ...route,
      savedAt: new Date().toISOString(),
      activityType,
      startAddress,
    };

    // Optimistic update with client-side id
    setRoutes(prev => {
      if (prev.some(r => r.id === route.id)) return prev;
      return [saved, ...prev];
    });

    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      });

      if (!res.ok) throw new Error('Failed to save');

      // Replace client-side id with DB-generated UUID
      const { id: dbId } = await res.json();
      const persisted = { ...saved, id: dbId };
      setRoutes(prev => prev.map(r => r.id === route.id ? persisted : r));
      return persisted;
    } catch {
      // Revert on failure
      setRoutes(prev => prev.filter(r => r.id !== route.id));
      return saved;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const prev = routes;
    setRoutes(r => r.filter(route => route.id !== id));

    try {
      await fetch(`/api/routes/${id}`, { method: 'DELETE' });
    } catch {
      setRoutes(prev);
    }
  }, [routes]);

  const update = useCallback(async (id: string, updates: Partial<SavedRoute>) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    try {
      await fetch(`/api/routes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // Silently fail — optimistic update stays
    }
  }, []);

  return { routes, save, remove, update, hydrated };
}

/** One-time migration of localStorage routes to Supabase */
async function migrateLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return;
  }

  try {
    const routes: SavedRoute[] = JSON.parse(raw);
    if (routes.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return;
    }

    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routes),
    });

    if (res.ok) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.setItem(MIGRATION_FLAG, 'true');
    }
  } catch {
    // Migration failed — will retry next load
  }
}
