interface CoordinateProps {
  lat: number;
  lng: number;
  precision?: number;
  className?: string;
}

/**
 * Cartographic-style coordinate readout: 42.3601°N · 71.0589°W
 */
export default function Coordinate({ lat, lng, precision = 4, className = '' }: CoordinateProps) {
  const latStr = `${Math.abs(lat).toFixed(precision)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(precision)}°${lng >= 0 ? 'E' : 'W'}`;
  return (
    <span className={`coord-mono ${className}`}>
      {latStr} <span className="text-ink-ghost mx-0.5">·</span> {lngStr}
    </span>
  );
}
