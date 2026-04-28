'use client';

import type { DistanceUnit } from '@/lib/types';

interface DistanceSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  unit: DistanceUnit;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  onChangeUnit: (u: DistanceUnit) => void;
}

export default function DistanceSlider({
  min,
  max,
  valueMin,
  valueMax,
  unit,
  onChangeMin,
  onChangeMax,
  onChangeUnit,
}: DistanceSliderProps) {
  const unitLabel = unit === 'miles' ? 'mi' : 'km';
  const range = max - min;
  const minPct = ((valueMin - min) / range) * 100;
  const maxPct = ((valueMax - min) / range) * 100;

  return (
    <div className="space-y-7">
      {/* Unit toggle */}
      <div className="flex justify-center">
        <div className="inline-flex border border-hairline">
          <button
            onClick={() => onChangeUnit('miles')}
            className={`text-[13px] font-medium px-4 py-1.5 transition-colors ${
              unit === 'miles' ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
            }`}
          >
            Miles
          </button>
          <button
            onClick={() => onChangeUnit('km')}
            className={`text-[13px] font-medium px-4 py-1.5 transition-colors border-l border-hairline ${
              unit === 'km' ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
            }`}
          >
            Kilometers
          </button>
        </div>
      </div>

      {/* Display range */}
      <div className="text-center py-3 border-y border-hairline">
        <p className="text-[12px] text-ink-faded mb-2">Target distance</p>
        <div className="flex items-baseline justify-center gap-2 tabular-nums">
          <span className="text-[52px] sm:text-[60px] font-semibold text-ink leading-none tracking-tight">
            {valueMin}
          </span>
          <span className="text-[28px] text-ink-ghost">–</span>
          <span className="text-[52px] sm:text-[60px] font-semibold text-ink leading-none tracking-tight">
            {valueMax}
          </span>
          <span className="text-[14px] text-ink-faded ml-1">{unitLabel}</span>
        </div>
      </div>

      {/* Dual-handle slider */}
      <div className="px-2 pb-2">
        <div className="relative h-5 flex items-center">
          {/* Track */}
          <div className="absolute left-0 right-0 h-[1px] bg-hairline" />
          {/* Active fill */}
          <div
            className="absolute h-[2px] bg-vermillion"
            style={{
              left: `${minPct}%`,
              right: `${100 - maxPct}%`,
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={0.5}
            value={valueMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChangeMin(Math.min(v, valueMax - 0.5));
            }}
            className="dual-range"
            aria-label="Minimum distance"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={0.5}
            value={valueMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChangeMax(Math.max(v, valueMin + 0.5));
            }}
            className="dual-range"
            aria-label="Maximum distance"
          />
        </div>
        <div className="flex justify-between mt-2 text-[12px] tabular-nums text-ink-faded">
          <span>{min} {unitLabel}</span>
          <span>{max} {unitLabel}</span>
        </div>
      </div>
    </div>
  );
}
