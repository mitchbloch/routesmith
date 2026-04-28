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
      className={`relative w-full text-left transition-colors overflow-hidden border ${
        selected
          ? 'border-vermillion bg-vermillion/5'
          : 'border-hairline bg-paper hover:border-ink-faded'
      }`}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: route.color }}
      />

      <div className="pl-5 pr-4 py-3.5">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[12px] text-ink-faded">Route {rank}</span>
          <span className="text-[13px] tabular-nums">
            <span className="text-ink font-semibold">{route.score.overall}</span>
            <span className="text-ink-ghost">/100</span>
          </span>
        </div>

        <h3
          className="text-[16px] leading-snug font-medium text-ink truncate mb-2"
          title={route.name}
        >
          {route.name}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2.5 text-[13px] tabular-nums text-ink-soft">
          <span>{formatDistance(route.distance)}</span>
          <span className="text-ink-ghost">·</span>
          <span>{formatDuration(route.duration)}</span>
          <span className="text-ink-ghost">·</span>
          <span>↑ {formatElevation(route.elevationGain)}</span>
        </div>

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
      </div>
    </button>
  );
}
