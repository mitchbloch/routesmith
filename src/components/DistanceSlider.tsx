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

  return (
    <div className="space-y-7">
      {/* Unit toggle */}
      <div className="flex justify-center">
        <div className="inline-flex border border-hairline">
          <button
            onClick={() => onChangeUnit('miles')}
            className={`label-mono-sm px-4 py-1.5 transition-colors ${
              unit === 'miles' ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
            }`}
          >
            Miles
          </button>
          <button
            onClick={() => onChangeUnit('km')}
            className={`label-mono-sm px-4 py-1.5 transition-colors border-l border-hairline ${
              unit === 'km' ? 'bg-ink text-paper' : 'text-ink-faded hover:bg-paper-deep'
            }`}
          >
            Kilometers
          </button>
        </div>
      </div>

      {/* Display range — large numerals */}
      <div className="text-center py-2 border-y border-hairline">
        <span className="label-mono-sm block mb-1">Range · target distance</span>
        <span
          className="font-display text-[56px] sm:text-[64px] font-semibold text-ink leading-none tracking-tight"
          style={{ fontVariationSettings: '"SOFT" 30, "opsz" 144' }}
        >
          {valueMin}
        </span>
        <span className="font-display text-[36px] text-ink-ghost mx-2">—</span>
        <span
          className="font-display text-[56px] sm:text-[64px] font-semibold text-ink leading-none tracking-tight"
          style={{ fontVariationSettings: '"SOFT" 30, "opsz" 144' }}
        >
          {valueMax}
        </span>
        <span className="label-mono ml-2">{unitLabel}</span>
      </div>

      {/* Sliders */}
      <div className="space-y-5 px-1">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="label-mono-sm">Minimum</span>
            <span className="coord-mono">{valueMin.toFixed(1)} {unitLabel}</span>
          </div>
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
            className="field-range"
          />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="label-mono-sm">Maximum</span>
            <span className="coord-mono">{valueMax.toFixed(1)} {unitLabel}</span>
          </div>
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
            className="field-range"
          />
        </div>
      </div>
    </div>
  );
}
