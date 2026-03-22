import { MAPBOX_TOKEN } from './mapbox';
import { haversineDistance } from './geometry';

const SAMPLE_INTERVAL_METERS = 160.934; // ~0.1 miles
const MIN_SAMPLES = 5;
const MAX_SAMPLES = 80; // cap to stay well within 600/min Tilequery rate limit

/**
 * Sample coordinates along a route at fixed distance intervals (~0.1 mi).
 * Longer routes get more samples; shorter routes get fewer.
 * Coords are [lng, lat] pairs from Mapbox geometry.
 */
function sampleCoordinates(coords: [number, number][]): [number, number][] {
  if (coords.length < 2) return coords;

  // Calculate cumulative distances along the polyline
  const cumDist: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    cumDist.push(cumDist[i - 1] + haversineDistance(lat1, lng1, lat2, lng2));
  }

  const totalDist = cumDist[cumDist.length - 1];
  const targetCount = Math.max(MIN_SAMPLES, Math.min(MAX_SAMPLES, Math.ceil(totalDist / SAMPLE_INTERVAL_METERS)));

  if (coords.length <= targetCount) return coords;

  const interval = totalDist / (targetCount - 1);
  const samples: [number, number][] = [coords[0]];
  let nextTarget = interval;
  let segIdx = 0;

  while (samples.length < targetCount - 1 && segIdx < coords.length - 1) {
    // Advance segment index until we pass the target distance
    while (segIdx < coords.length - 2 && cumDist[segIdx + 1] < nextTarget) {
      segIdx++;
    }

    // Interpolate within the current segment
    const segStart = cumDist[segIdx];
    const segEnd = cumDist[segIdx + 1];
    const segLen = segEnd - segStart;
    const t = segLen > 0 ? (nextTarget - segStart) / segLen : 0;

    const [lng1, lat1] = coords[segIdx];
    const [lng2, lat2] = coords[segIdx + 1];
    samples.push([
      lng1 + t * (lng2 - lng1),
      lat1 + t * (lat2 - lat1),
    ]);

    nextTarget += interval;
  }

  // Always include the last point
  samples.push(coords[coords.length - 1]);
  return samples;
}

/**
 * Query elevation at a single point using Mapbox Tilequery API.
 * Returns elevation in meters, or null if unavailable.
 */
async function queryElevation(lng: number, lat: number, token: string): Promise<number | null> {
  try {
    const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lng},${lat}.json?layers=contour&limit=1&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    return feature?.properties?.ele ?? null;
  } catch {
    return null;
  }
}

/**
 * Get real elevation gain/loss for a route by sampling points along the geometry.
 * Returns null if insufficient elevation data is available (triggers fallback to heuristic).
 */
export async function getRouteElevation(
  coords: [number, number][]
): Promise<{ gain: number; loss: number } | null> {
  if (!MAPBOX_TOKEN || coords.length < 2) return null;

  const samples = sampleCoordinates(coords);

  const elevations = await Promise.all(
    samples.map(([lng, lat]) => queryElevation(lng, lat, MAPBOX_TOKEN))
  );

  const valid = elevations.filter((e): e is number => e !== null);

  // Need at least 3 valid elevation points for meaningful gain/loss
  if (valid.length < 3) return null;

  let gain = 0;
  let loss = 0;

  for (let i = 1; i < valid.length; i++) {
    const diff = valid[i] - valid[i - 1];
    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
  }

  return { gain: Math.round(gain), loss: Math.round(loss) };
}
