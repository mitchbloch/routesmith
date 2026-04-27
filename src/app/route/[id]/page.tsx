'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { decompressFromEncodedURIComponent } from 'lz-string';
import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import ShareButton from '@/components/ShareButton';
import SignInModal from '@/components/SignInModal';
import StarRating from '@/components/StarRating';
import type { GeneratedRoute, SavedRoute } from '@/lib/types';
import { metersToMiles } from '@/lib/geometry';
import { useRouteLibrary } from '@/hooks/useRouteLibrary';
import { useAuth } from '@/lib/auth/useAuth';

const MapWithRoute = dynamic(() => import('@/components/MapWithRoute'), { ssr: false });

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
    // Try to load from compressed URL data
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

    // Try sessionStorage
    const stored = sessionStorage.getItem('routesmith_route');
    if (stored) {
      setRoute(JSON.parse(stored));
      return;
    }

    // Check saved routes
    const saved = savedRoutes.find(r => r.id === params.id);
    if (saved) {
      setRoute(saved);
      setIsSaved(true);
      setCustomName(saved.customName || saved.name);
    }
  }, [params.id, searchParams, savedRoutes]);

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
      <div className="h-screen flex items-center justify-center bg-paper">
        <div className="field-card max-w-sm mx-4 px-6 py-6 text-center">
          <p className="label-mono-sm mb-2">— Not in the fieldbook</p>
          <p className="font-display text-[20px] text-ink mb-4"
             style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}>
            We can&apos;t find this route.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-vermillion text-paper px-5 py-2 label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors"
          >
            Back to start
          </button>
        </div>
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
    <div className="h-screen flex flex-col bg-paper">
      <Nav />

      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Map */}
        <div className="h-[40vh] sm:h-[50vh] lg:h-full lg:flex-1 relative">
          <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-ink z-10 pointer-events-none" aria-hidden />
          <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-ink z-10 pointer-events-none" aria-hidden />
          <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-ink z-10 pointer-events-none" aria-hidden />
          <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-ink z-10 pointer-events-none" aria-hidden />
          <MapWithRoute routes={[route]} />
        </div>

        {/* Detail panel */}
        <div className="flex-1 lg:w-[420px] lg:flex-none overflow-y-auto px-5 sm:px-7 py-6 lg:border-l lg:border-hairline">
          <div className="space-y-6">
            {/* Plate header */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="label-mono-sm">Plate · saved route</span>
                <span className="coord-mono text-ink-faded">{formatDistance(route.distance)}</span>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 font-display text-[24px] font-semibold bg-transparent border-b border-ink outline-none pb-1 text-ink"
                    style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  />
                  <button onClick={handleRename} className="label-mono-sm !text-vermillion px-2">
                    Save
                  </button>
                </div>
              ) : (
                <h1
                  className="font-display text-[28px] sm:text-[30px] font-semibold text-ink leading-[1.05] tracking-tight cursor-pointer hover:text-vermillion transition-colors"
                  style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 60' }}
                  onClick={() => isSaved && setEditing(true)}
                  title={isSaved ? 'Click to rename' : ''}
                >
                  {savedRoute?.customName || route.name}
                </h1>
              )}
            </div>

            {/* Stats grid — three plates with hairlines */}
            <div className="grid grid-cols-3 border-y border-hairline divide-x divide-hairline">
              <div className="px-2 py-3 text-center">
                <p className="label-mono-sm mb-1">Distance</p>
                <p className="font-display text-[20px] sm:text-[22px] font-semibold text-ink leading-none"
                   style={{ fontVariationSettings: '"SOFT" 30, "opsz" 36' }}>
                  {formatDistance(route.distance)}
                </p>
              </div>
              <div className="px-2 py-3 text-center">
                <p className="label-mono-sm mb-1">Duration</p>
                <p className="font-display text-[20px] sm:text-[22px] font-semibold text-ink leading-none"
                   style={{ fontVariationSettings: '"SOFT" 30, "opsz" 36' }}>
                  {formatDuration(route.duration)}
                </p>
              </div>
              <div className="px-2 py-3 text-center">
                <p className="label-mono-sm mb-1">Elevation</p>
                <p className="font-display text-[20px] sm:text-[22px] font-semibold text-ink leading-none"
                   style={{ fontVariationSettings: '"SOFT" 30, "opsz" 36' }}>
                  +{Math.round(route.elevationGain * 3.281)}<span className="text-[14px] text-ink-faded ml-0.5">ft</span>
                </p>
              </div>
            </div>

            {/* Match Score block */}
            <div className="border border-hairline">
              <div className="flex items-baseline justify-between px-4 py-2 border-b border-hairline bg-paper-deep/40">
                <span className="label-mono-sm">Match Score</span>
                <span className="font-display text-[24px] font-semibold text-ink leading-none"
                      style={{ fontVariationSettings: '"SOFT" 50, "opsz" 36' }}>
                  {route.score.overall}<span className="text-ink-ghost text-[16px]">/100</span>
                </span>
              </div>
              <ul className="px-4 py-3 space-y-1.5">
                {scoreRows.map(([label, value, max]) => {
                  const pct = (value / max) * 100;
                  return (
                    <li key={label} className="flex items-center gap-3">
                      <span className="label-mono-sm w-24 shrink-0">{label}</span>
                      <span className="flex-1 h-[2px] bg-hairline-soft relative">
                        <span
                          className="absolute inset-y-0 left-0 bg-vermillion"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="coord-mono text-ink-soft tabular-nums w-12 text-right shrink-0">
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
                    className="px-2 py-0.5 label-mono-sm border border-hairline-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            {isSaved && (
              <div>
                <p className="label-mono-sm mb-2">Your rating</p>
                <StarRating rating={savedRoute?.rating || 0} onChange={handleRate} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {!isSaved ? (
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-vermillion text-paper label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>Save to library</span>
                  <span className="font-mono text-[12px] group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              ) : (
                <div className="flex-1 py-3 text-center label-mono-sm !text-forest border border-forest/40 bg-forest/5">
                  ● Saved
                </div>
              )}
              <ShareButton route={route} />
            </div>

            {/* Back */}
            <button
              onClick={() => router.back()}
              className="w-full label-mono-sm py-2 text-ink-faded hover:text-ink transition-colors"
            >
              ← Back to results
            </button>
          </div>
        </div>
      </div>

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={persistRoute}
        subtitle="Sign in to save this route to your library."
      />
    </div>
  );
}
