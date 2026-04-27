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
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Route not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const savedRoute = savedRoutes.find(r => r.id === route.id) as SavedRoute | undefined;

  return (
    <div className="h-screen flex flex-col">
      <Nav />

      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Map */}
        <div className="h-[40vh] sm:h-[50vh] lg:h-full lg:flex-1">
          <MapWithRoute routes={[route]} />
        </div>

        {/* Detail panel */}
        <div className="flex-1 lg:w-96 lg:flex-none overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Name */}
          <div>
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 text-xl font-bold border-b-2 border-blue-500 outline-none pb-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                />
                <button onClick={handleRename} className="text-blue-500 font-medium">Save</button>
              </div>
            ) : (
              <h1
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                onClick={() => isSaved && setEditing(true)}
                title={isSaved ? 'Click to rename' : ''}
              >
                {savedRoute?.customName || route.name}
              </h1>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-sm text-gray-500">Distance</p>
              <p className="text-base sm:text-lg font-semibold">{formatDistance(route.distance)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-base sm:text-lg font-semibold">{formatDuration(route.duration)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-sm text-gray-500">Elevation</p>
              <p className="text-base sm:text-lg font-semibold">+{Math.round(route.elevationGain * 3.281)} ft</p>
            </div>
          </div>

          {/* Score */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-800">Match Score</span>
              <span className="text-xl font-bold text-blue-600">{route.score.overall}/100</span>
            </div>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex justify-between">
                <span>Distance fit</span><span>{route.score.distanceFit}/15</span>
              </div>
              <div className="flex justify-between">
                <span>Elevation</span><span>{route.score.elevationMatch}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Scenery</span><span>{route.score.sceneryMatch}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Safety</span><span>{route.score.safetyMatch}/15</span>
              </div>
              <div className="flex justify-between">
                <span>Corridor</span><span>{route.score.corridorAdherence}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Diversity</span><span>{route.score.diversityBonus}/10</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {route.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          {isSaved && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Your rating</p>
              <StarRating rating={savedRoute?.rating || 0} onChange={handleRate} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isSaved ? (
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                Save Route
              </button>
            ) : (
              <div className="flex-1 py-3 text-center text-green-600 font-medium">
                Saved
              </div>
            )}
            <ShareButton route={route} />
          </div>

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Back to results
          </button>
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
