'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import StarRating from '@/components/StarRating';
import CompassRose from '@/components/ornament/CompassRose';
import { useRouteLibrary } from '@/hooks/useRouteLibrary';
import { metersToMiles } from '@/lib/geometry';
import type { ActivityType, SavedRoute } from '@/lib/types';

type SortBy = 'newest' | 'rating' | 'distance';
type FilterActivity = ActivityType | 'all';

export default function LibraryPage() {
  const router = useRouter();
  const { routes, remove, hydrated } = useRouteLibrary();
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterActivity, setFilterActivity] = useState<FilterActivity>('all');

  const filtered = routes
    .filter(r => filterActivity === 'all' || r.activityType === filterActivity)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'distance': return b.distance - a.distance;
        default: return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }
    });

  const handleView = (route: SavedRoute) => {
    sessionStorage.setItem('routesmith_route', JSON.stringify(route));
    router.push(`/route/${route.id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Remove this route from your fieldbook?')) {
      remove(id);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-20 pb-12">
        {/* Masthead */}
        <div className="mb-8 ink-rise">
          <p className="label-mono-sm">Your fieldbook · saved routes</p>
          <h1
            className="font-display text-[40px] sm:text-[48px] font-semibold text-ink leading-[1.0] tracking-tight mt-1"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 96' }}
          >
            The library.
          </h1>
        </div>

        {!hydrated ? (
          <div className="text-center py-16">
            <div className="text-ink mx-auto mb-4 w-fit">
              <CompassRose size={40} spin />
            </div>
            <p className="label-mono-sm">Loading your fieldbook</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="field-card px-7 py-10 text-center">
            <div className="text-ink-faded mx-auto mb-3 w-fit">
              <CompassRose size={32} />
            </div>
            <p className="label-mono-sm mb-2">— No entries yet</p>
            <p className="font-display text-[20px] text-ink mb-5"
               style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}>
              Your fieldbook is empty.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-vermillion text-paper px-5 py-2.5 label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors"
            >
              Plot your first route
            </button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center mb-5 pb-4 border-b border-hairline">
              <div className="inline-flex border border-hairline">
                {(['all', 'walking', 'running', 'biking'] as const).map((act, i) => (
                  <button
                    key={act}
                    onClick={() => setFilterActivity(act)}
                    className={`label-mono-sm px-3 py-1.5 transition-colors ${
                      filterActivity === act ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
                    } ${i > 0 ? 'border-l border-hairline' : ''}`}
                  >
                    {act === 'all' ? 'All' : act}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="label-mono-sm">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent border border-hairline px-2.5 py-1.5 label-mono-sm text-ink focus:border-ink outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
              <span className="ml-auto coord-mono text-ink-faded">
                {String(filtered.length).padStart(3, '0')} entr{filtered.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            {/* Route list */}
            <div className="space-y-2">
              {filtered.map((route, i) => (
                <div
                  key={route.id}
                  onClick={() => handleView(route)}
                  className="relative bg-paper border border-hairline hover:border-ink-faded transition-colors cursor-pointer ink-rise"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="px-5 py-4 flex items-start gap-4">
                    <span
                      className="font-display text-[26px] leading-none font-semibold text-ink-faded tabular-nums shrink-0 mt-0.5"
                      style={{ fontVariationSettings: '"SOFT" 30, "opsz" 60' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-display text-[18px] font-medium text-ink leading-snug truncate"
                        style={{ fontVariationSettings: '"SOFT" 50, "opsz" 24' }}
                      >
                        {route.customName || route.name}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 coord-mono text-ink-soft">
                        <span>{metersToMiles(route.distance).toFixed(1)} mi</span>
                        <span className="label-mono-sm">{route.activityType}</span>
                        {route.startAddress && (
                          <span className="truncate max-w-[260px]">{route.startAddress}</span>
                        )}
                      </div>
                      {route.rating && route.rating > 0 && (
                        <div className="mt-2">
                          <StarRating rating={route.rating} size="sm" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, route.id)}
                      className="text-ink-ghost hover:text-vermillion transition-colors p-1 shrink-0"
                      title="Remove from fieldbook"
                      aria-label="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center label-mono-sm py-10">No entries match this filter.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
