'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import StarRating from '@/components/StarRating';
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
    if (confirm('Remove this route from your library?')) {
      remove(id);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-12">
        {/* Header */}
        <div className="mb-7">
          <p className="text-[12px] text-ink-faded mb-1">Saved routes</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold text-ink leading-tight tracking-tight">
            Library
          </h1>
        </div>

        {!hydrated ? (
          <div className="text-center py-16">
            <div className="w-7 h-7 border-2 border-hairline border-t-vermillion rounded-full compass-spin mx-auto mb-3" />
            <p className="text-[12px] text-ink-faded">Loading</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="field-card px-7 py-10 text-center">
            <p className="text-[12px] text-ink-faded mb-1">No entries yet</p>
            <p className="text-[18px] font-semibold text-ink mb-5 leading-tight">
              Your library is empty.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-vermillion text-white px-5 py-2.5 text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
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
                    className={`text-[13px] font-medium px-3 py-1.5 transition-colors ${
                      filterActivity === act ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
                    } ${i > 0 ? 'border-l border-hairline' : ''}`}
                  >
                    {act === 'all' ? 'All' : act.charAt(0).toUpperCase() + act.slice(1)}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[12px] text-ink-faded">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent border border-hairline px-2.5 py-1.5 text-[13px] text-ink focus:border-ink outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
              <span className="ml-auto text-[12px] text-ink-faded">
                {filtered.length} {filtered.length === 1 ? 'route' : 'routes'}
              </span>
            </div>

            {/* Route list */}
            <div className="space-y-2">
              {filtered.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleView(route)}
                  className="relative bg-paper border border-hairline hover:border-ink-faded transition-colors cursor-pointer"
                >
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-medium text-ink leading-snug truncate">
                        {route.customName || route.name}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[13px] tabular-nums text-ink-soft">
                        <span>{metersToMiles(route.distance).toFixed(1)} mi</span>
                        <span className="text-ink-ghost">·</span>
                        <span className="text-ink-faded">{route.activityType}</span>
                        {route.startAddress && (
                          <>
                            <span className="text-ink-ghost">·</span>
                            <span className="truncate max-w-[240px]">{route.startAddress}</span>
                          </>
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
                      title="Remove from library"
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
              <p className="text-center text-[13px] text-ink-faded py-10">No routes match this filter.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
