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
    if (confirm('Delete this route?')) {
      remove(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Route Library</h1>

        {!hydrated ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No saved routes yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
            >
              Generate Your First Route
            </button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
                {(['all', 'walking', 'running', 'biking'] as const).map((act) => (
                  <button
                    key={act}
                    onClick={() => setFilterActivity(act)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      filterActivity === act ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {act === 'all' ? 'All' : act.charAt(0).toUpperCase() + act.slice(1)}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white"
              >
                <option value="newest">Newest</option>
                <option value="rating">Highest rated</option>
                <option value="distance">Longest</option>
              </select>
            </div>

            {/* Route list */}
            <div className="space-y-3">
              {filtered.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleView(route)}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {route.customName || route.name}
                      </h3>
                      <div className="flex gap-3 mt-1 text-sm text-gray-500">
                        <span>{metersToMiles(route.distance).toFixed(1)} mi</span>
                        <span>{route.activityType}</span>
                        {route.startAddress && (
                          <span className="truncate max-w-[200px]">{route.startAddress}</span>
                        )}
                      </div>
                      {route.rating && route.rating > 0 && (
                        <div className="mt-1">
                          <StarRating rating={route.rating} size="sm" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, route.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-8">No routes match this filter</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
