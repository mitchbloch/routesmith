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
  return `${metersToMiles(meters).toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function formatElevation(meters: number): string {
  return `${Math.round(meters * 3.281)} ft`;
}

export default function RouteCard({ route, rank, selected, onClick }: RouteCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left transition-all overflow-hidden border ${
        selected
          ? 'border-ink bg-paper-deep'
          : 'border-hairline bg-paper hover:border-ink-faded'
      }`}
    >
      {/* Route signature color stripe */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: route.color }}
      />

      {/* Selected stamp */}
      {selected && (
        <span
          aria-hidden
          className="absolute top-2 right-2 label-mono-sm !text-vermillion"
        >
          ●
        </span>
      )}

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-baseline gap-3 mb-1.5">
          <span
            className="font-display text-[28px] leading-none font-semibold text-ink tabular-nums"
            style={{ fontVariationSettings: '"SOFT" 30, "opsz" 60' }}
          >
            {String(rank).padStart(2, '0')}
          </span>
          <span className="label-mono-sm">— Plate</span>
        </div>

        <h3
          className="font-display text-[18px] leading-snug font-medium text-ink truncate mb-1"
          style={{ fontVariationSettings: '"SOFT" 50, "opsz" 24' }}
          title={route.name}
        >
          {route.name}
        </h3>

        <div className="flex items-baseline gap-3 mb-3">
          <span className="coord-mono text-ink">
            <span className="text-ink font-semibold">{route.score.overall}</span>
            <span className="text-ink-ghost">/100</span>
          </span>
          <span className="label-mono-sm">match</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 coord-mono">
          <span><span className="label-mono-sm mr-1">D</span>{formatDistance(route.distance)}</span>
          <span><span className="label-mono-sm mr-1">T</span>{formatDuration(route.duration)}</span>
          <span><span className="label-mono-sm mr-1">↑</span>{formatElevation(route.elevationGain)}</span>
        </div>

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
      </div>
    </button>
  );
}
