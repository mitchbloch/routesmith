'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { decompressFromEncodedURIComponent } from 'lz-string';
import ShareButton from '@/components/ShareButton';
import SignInModal from '@/components/SignInModal';
import StarRating from '@/components/StarRating';
import { mapStore } from '@/lib/mapStore';
import type { GeneratedRoute, SavedRoute } from '@/lib/types';
import { metersToMiles } from '@/lib/geometry';
import { useRouteLibrary } from '@/hooks/useRouteLibrary';
import { useAuth } from '@/lib/auth/useAuth';

function formatDistance(meters: number): string {
  return `${metersToMiles(meters).toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export default function RouteDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { routes: savedRoutes, save, update } = useRouteLibrary();
  const { user } = useAuth();
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [customName, setCustomName] = useState('');
  const [editing, setEditing] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    const compressed = searchParams.get('data');
    if (compressed) {
      try {
        const json = decompressFromEncodedURIComponent(compressed);
        if (json) {
          const parsed = JSON.parse(json);
          setRoute(parsed);
          return;
        }
      } catch {
        // fall through
      }
    }

    const stored = sessionStorage.getItem('routesmith_route');
    if (stored) {
      setRoute(JSON.parse(stored));
      return;
    }

    const saved = savedRoutes.find(r => r.id === params.id);
    if (saved) {
      setRoute(saved);
      setIsSaved(true);
      setCustomName(saved.customName || saved.name);
    }
  }, [params.id, searchParams, savedRoutes]);

  // Keep map store in sync with active route
  useEffect(() => {
    if (route) {
      mapStore.set({
        activeRoute: route,
        selectedRouteId: route.id,
        center: [route.geometry.coordinates[0][0], route.geometry.coordinates[0][1]],
      });
    }
    return () => {
      mapStore.set({ activeRoute: null });
    };
  }, [route]);

  useEffect(() => {
    if (route) {
      const saved = savedRoutes.find(r => r.id === route.id);
      if (saved) {
        setIsSaved(true);
        setCustomName(saved.customName || saved.name);
      }
    }
  }, [route, savedRoutes]);

  const persistRoute = () => {
    if (!route) return;
    const prefs = sessionStorage.getItem('routesmith_prefs');
    const activityType = prefs ? JSON.parse(prefs).activityType : 'running';
    const startAddr = prefs ? JSON.parse(prefs).startLocation?.address : undefined;
    save(route, activityType, startAddr);
    setIsSaved(true);
    setCustomName(route.name);
  };

  const handleSave = () => {
    if (!route) return;
    if (!user) {
      setSignInOpen(true);
      return;
    }
    persistRoute();
  };

  const handleRename = () => {
    if (!route || !customName.trim()) return;
    update(route.id, { customName: customName.trim() });
    setEditing(false);
  };

  const handleRate = (rating: number) => {
    if (!route) return;
    update(route.id, { rating });
  };

  if (!route) {
    return (
      <div className="px-5 sm:px-7 py-10 text-center">
        <p className="text-[12px] text-ink-faded mb-2">Not found</p>
        <p className="text-[18px] font-semibold text-ink mb-4 leading-tight">
          We can&apos;t find this route.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-vermillion text-white px-5 py-2 text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
        >
          Back to start
        </button>
      </div>
    );
  }

  const savedRoute = savedRoutes.find(r => r.id === route.id) as SavedRoute | undefined;

  const scoreRows: Array<[string, number, number]> = [
    ['Distance fit', route.score.distanceFit, 15],
    ['Elevation', route.score.elevationMatch, 20],
    ['Scenery', route.score.sceneryMatch, 20],
    ['Safety', route.score.safetyMatch, 15],
    ['Corridor', route.score.corridorAdherence, 20],
    ['Diversity', route.score.diversityBonus, 10],
  ];

  return (
    <>
      <div className="px-5 sm:px-7 py-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-[12px] text-ink-faded mb-1.5">{formatDistance(route.distance)} route</p>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 text-[24px] font-semibold bg-transparent border-b border-ink outline-none pb-1 text-ink tracking-tight"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
              <button onClick={handleRename} className="text-[13px] font-medium text-vermillion px-2">
                Save
              </button>
            </div>
          ) : (
            <h1
              className="text-[26px] sm:text-[28px] font-semibold text-ink leading-tight tracking-tight cursor-pointer hover:text-vermillion transition-colors"
              onClick={() => isSaved && setEditing(true)}
              title={isSaved ? 'Click to rename' : ''}
            >
              {savedRoute?.customName || route.name}
            </h1>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 border-y border-hairline divide-x divide-hairline">
          <div className="px-2 py-3 text-center">
            <p className="text-[11px] text-ink-faded mb-1">Distance</p>
            <p className="text-[20px] sm:text-[22px] font-semibold text-ink leading-none tabular-nums">
              {formatDistance(route.distance)}
            </p>
          </div>
          <div className="px-2 py-3 text-center">
            <p className="text-[11px] text-ink-faded mb-1">Duration</p>
            <p className="text-[20px] sm:text-[22px] font-semibold text-ink leading-none tabular-nums">
              {formatDuration(route.duration)}
            </p>
          </div>
          <div className="px-2 py-3 text-center">
            <p className="text-[11px] text-ink-faded mb-1">Elevation</p>
            <p className="text-[20px] sm:text-[22px] font-semibold text-ink leading-none tabular-nums">
              +{Math.round(route.elevationGain * 3.281)}<span className="text-[14px] text-ink-faded ml-0.5 font-normal">ft</span>
            </p>
          </div>
        </div>

        {/* Match Score */}
        <div className="border border-hairline">
          <div className="flex items-baseline justify-between px-4 py-2 border-b border-hairline bg-paper-deep/40">
            <span className="text-[12px] text-ink-faded font-medium">Match score</span>
            <span className="text-[22px] font-semibold text-ink leading-none tabular-nums">
              {route.score.overall}<span className="text-ink-ghost text-[14px] font-normal">/100</span>
            </span>
          </div>
          <ul className="px-4 py-3 space-y-1.5">
            {scoreRows.map(([label, value, max]) => {
              const pct = (value / max) * 100;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span className="text-[12px] text-ink-faded w-24 shrink-0">{label}</span>
                  <span className="flex-1 h-[2px] bg-hairline-soft relative">
                    <span
                      className="absolute inset-y-0 left-0 bg-vermillion"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="text-[12px] text-ink-soft tabular-nums w-12 text-right shrink-0">
                    {value}<span className="text-ink-ghost">/{max}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tags */}
        {route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] text-ink-faded border border-hairline-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        {isSaved && (
          <div>
            <p className="text-[12px] text-ink-faded mb-2">Your rating</p>
            <StarRating rating={savedRoute?.rating || 0} onChange={handleRate} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isSaved ? (
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-vermillion text-white text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
            >
              Save to library
            </button>
          ) : (
            <div className="flex-1 py-2.5 text-center text-[13px] font-medium text-forest border border-forest/40 bg-forest/5">
              Saved
            </div>
          )}
          <ShareButton route={route} />
        </div>

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="w-full text-[13px] py-2 text-ink-faded hover:text-ink transition-colors"
        >
          ← Back to results
        </button>
      </div>

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={persistRoute}
        subtitle="Sign in to save this route to your library."
      />
    </>
  );
}
