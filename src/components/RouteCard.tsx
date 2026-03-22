'use client';

import type { GeneratedRoute, ActivityType } from '@/lib/types';
import { metersToMiles } from '@/lib/geometry';

interface RouteCardProps {
  route: GeneratedRoute;
  rank: number;
  activityType?: ActivityType;
  selected?: boolean;
  onClick?: () => void;
}

function formatDistance(meters: number): string {
  const miles = metersToMiles(meters);
  return `${miles.toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function formatElevation(meters: number): string {
  const feet = Math.round(meters * 3.281);
  return `${feet} ft`;
}

export default function RouteCard({ route, rank, selected, onClick }: RouteCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: route.color }}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">{route.name}</h3>
            <span className="text-sm font-medium text-blue-600 shrink-0 ml-2">
              {route.score.overall}/100
            </span>
          </div>

          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>{formatDistance(route.distance)}</span>
            <span>{formatDuration(route.duration)}</span>
            <span>+{formatElevation(route.elevationGain)}</span>
          </div>

          {route.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {route.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
