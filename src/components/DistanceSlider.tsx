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
  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2">
        <button
          onClick={() => onChangeUnit('miles')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            unit === 'miles' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Miles
        </button>
        <button
          onClick={() => onChangeUnit('km')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            unit === 'km' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Kilometers
        </button>
      </div>

      <div className="text-center">
        <span className="text-4xl font-bold text-gray-900">
          {valueMin} — {valueMax}
        </span>
        <span className="text-lg text-gray-500 ml-2">{unit === 'miles' ? 'mi' : 'km'}</span>
      </div>

      <div className="space-y-4 px-2">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Minimum</label>
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
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Maximum</label>
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
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
