import { nanoid } from 'nanoid';
import type { UserPreferences, GeneratedRoute, OverpassData, ActivityType } from './types';
import { generateLoopWaypoints, haversineDistance, milesToMeters, kmToMeters } from './geometry';
import { scoreRoute, applyDiversityBonus } from './scoring';
import { directionsUrl } from './mapbox';
import { getRouteElevation } from './elevation';

const ROUTE_NAMES = [
  'Scenic Loop', 'Riverside Run', 'Park Circuit', 'Neighborhood Tour',
  'Green Path', 'Urban Explorer', 'Lakeside Trail', 'Hill Climb',
  'Easy Stroll', 'Sunset Route', 'Morning Circuit', 'Coastal Path',
];

function profileForActivity(activity: ActivityType): 'walking' | 'cycling' {
  return activity === 'biking' ? 'cycling' : 'walking';
}

function generateTags(route: GeneratedRoute, prefs: UserPreferences): string[] {
  const tags: string[] = [];
  if (route.elevationGain < route.distance * 0.01) tags.push('Flat');
  else if (route.elevationGain > route.distance * 0.04) tags.push('Hilly');
  else tags.push('Rolling');

  const sceneryPrefs = Array.isArray(prefs.scenery) ? prefs.scenery : [prefs.scenery];
  if (!sceneryPrefs.includes('no-preference')) {
    const label: Record<string, string> = { parks: 'Green', waterfront: 'Waterfront', urban: 'Urban', residential: 'Quiet' };
    for (const s of sceneryPrefs) {
      if (label[s]) tags.push(label[s]);
    }
  }
  if (route.score.safetyMatch > 14) tags.push('Low traffic');
  return tags.filter(Boolean);
}

/**
 * Extract sample points from Overpass paths and parks to use as waypoint attractors.
 * These are spots the router is likely to route through trails/paths instead of roads.
 */
function extractAttractorPoints(overpassData: OverpassData): [number, number][] {
  const points: [number, number][] = [];

  // Sample points from paths (cycleways, footways, pedestrian paths) and parks
  const features = [...overpassData.paths, ...overpassData.parks];
  for (const feature of features) {
    const geom = feature.geometry;
    if (geom.type === 'LineString') {
      const coords = geom.coordinates as [number, number][];
      // Sample every ~4th coordinate for good coverage without excessive points
      for (let i = 0; i < coords.length; i += Math.max(1, Math.floor(coords.length / 5))) {
        points.push(coords[i]);
      }
    }
  }

  return points;
}

/**
 * Snap a waypoint to the nearest trail/path/park point if one is within range.
 * Full snap (not a blend) so the Directions API routes through the trail
 * rather than a parallel road.
 */
function snapToNearbyPath(
  waypoint: [number, number],  // [lng, lat]
  attractors: [number, number][],
  maxDistanceMeters: number
): [number, number] {
  if (attractors.length === 0) return waypoint;

  let bestDist = Infinity;
  let bestAttractor: [number, number] | null = null;

  for (const att of attractors) {
    const d = haversineDistance(waypoint[1], waypoint[0], att[1], att[0]);
    if (d < bestDist) {
      bestDist = d;
      bestAttractor = att;
    }
  }

  if (!bestAttractor || bestDist > maxDistanceMeters) return waypoint;

  return bestAttractor;
}

function estimateElevation(distance: number, seed: number): { gain: number; loss: number } {
  // Estimate based on typical terrain — real elevation would come from Mapbox Tilequery
  const factor = 0.005 + (seed % 7) * 0.005;
  const gain = Math.round(distance * factor);
  return { gain, loss: gain };
}

export async function generateRoutes(
  preferences: UserPreferences,
  overpassData: OverpassData
): Promise<GeneratedRoute[]> {
  const { startLocation, routeType, activityType, distanceUnit } = preferences;
  const toMeters = distanceUnit === 'miles' ? milesToMeters : kmToMeters;
  const minMeters = toMeters(preferences.distanceMin);
  const maxMeters = toMeters(preferences.distanceMax);
  const targetMeters = (minMeters + maxMeters) / 2;
  const profile = profileForActivity(activityType);

  const candidates: GeneratedRoute[] = [];

  if (routeType === 'loop') {
    // Generate 12 candidates by varying:
    //   - Distance target: p25, p50, p75 of user's range
    //   - Bearing: 4 directions per target
    //   - Waypoint count: alternating 3 and 4 per loop
    // Hard distance filter keeps only those within range.
    const range = maxMeters - minMeters;
    const distanceTargets = [
      minMeters + range * 0.25,  // 25th percentile
      targetMeters,              // 50th (midpoint)
      minMeters + range * 0.75,  // 75th percentile
    ];
    const bearings = [0, 90, 180, 270];

    const variations: { target: number; waypoints: number; bearing: number }[] = [];
    for (const target of distanceTargets) {
      for (let i = 0; i < bearings.length; i++) {
        variations.push({ target, waypoints: i % 2 === 0 ? 3 : 4, bearing: bearings[i] });
      }
    }

    // Extract points along known trails/paths/parks to bias waypoints toward them
    const attractors = extractAttractorPoints(overpassData);
    // Nudge radius: waypoints within this distance of a trail get pulled toward it
    const nudgeRadius = Math.max(targetMeters * 0.3, 500);

    const routePromises = variations.map(async (v, idx) => {
      try {
        const rawWaypoints = generateLoopWaypoints(
          startLocation.lat, startLocation.lng,
          v.target, v.waypoints, v.bearing
        );

        // Snap waypoints onto nearby paths/parks so the router uses them
        const waypoints = rawWaypoints.map(wp => snapToNearbyPath(wp, attractors, nudgeRadius));

        const coords: [number, number][] = [
          [startLocation.lng, startLocation.lat],
          ...waypoints,
          [startLocation.lng, startLocation.lat],
        ];

        const url = directionsUrl(profile, coords);
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return null;

        // Try real elevation from Tilequery API, fall back to heuristic
        const routeCoords: [number, number][] = route.geometry?.coordinates || [];
        const realElevation = await getRouteElevation(routeCoords);
        const { gain, loss } = realElevation || estimateElevation(route.distance, idx);

        const generated: GeneratedRoute = {
          id: nanoid(10),
          name: ROUTE_NAMES[idx % ROUTE_NAMES.length],
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration,
          elevationGain: gain,
          elevationLoss: loss,
          score: { overall: 0, distanceFit: 0, elevationMatch: 0, sceneryMatch: 0, safetyMatch: 0, diversityBonus: 0 },
          tags: [],
          waypoints: coords,
          color: '',
        };

        generated.score = scoreRoute(generated, preferences, overpassData, minMeters, maxMeters);
        generated.tags = generateTags(generated, preferences);
        return generated;
      } catch (e) {
        console.error('Route generation failed for variation', idx, e);
        return null;
      }
    });

    const results = await Promise.all(routePromises);
    candidates.push(...results.filter((r): r is GeneratedRoute => r !== null));
  } else {
    // Point-to-point
    const end = preferences.endLocation;
    if (!end) return [];

    const coords: [number, number][] = [
      [startLocation.lng, startLocation.lat],
      [end.lng, end.lat],
    ];

    const url = directionsUrl(profile, coords, { alternatives: true });
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    for (let i = 0; i < (data.routes?.length || 0); i++) {
      const route = data.routes[i];
      const routeCoords: [number, number][] = route.geometry?.coordinates || [];
      const realElevation = await getRouteElevation(routeCoords);
      const { gain, loss } = realElevation || estimateElevation(route.distance, i);
      const generated: GeneratedRoute = {
        id: nanoid(10),
        name: ROUTE_NAMES[i % ROUTE_NAMES.length],
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        elevationGain: gain,
        elevationLoss: loss,
        score: { overall: 0, distanceFit: 0, elevationMatch: 0, sceneryMatch: 0, safetyMatch: 0, diversityBonus: 0 },
        tags: [],
        waypoints: coords,
        color: '',
      };
      generated.score = scoreRoute(generated, preferences, overpassData, minMeters, maxMeters);
      generated.tags = generateTags(generated, preferences);
      candidates.push(generated);
    }
  }

  // Hard filter: distance range is a first-order requirement.
  // With 18 candidates spanning min/mid/max targets, we can enforce strictly.
  // Small 5% tolerance to avoid discarding routes that are a few hundred meters off.
  const tolerance = 0.05;
  const hardMin = minMeters * (1 - tolerance);
  const hardMax = maxMeters * (1 + tolerance);
  const inRange = candidates.filter(r => r.distance >= hardMin && r.distance <= hardMax);

  // Fall back to closest candidates if none pass the hard filter
  const pool = inRange.length > 0 ? inRange : candidates
    .map(r => ({ route: r, gap: Math.min(Math.abs(r.distance - minMeters), Math.abs(r.distance - maxMeters)) }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 3)
    .map(r => r.route);

  // Apply diversity bonus and sort
  const withDiversity = applyDiversityBonus(pool);
  withDiversity.sort((a, b) => b.score.overall - a.score.overall);

  const colors = ['#3b82f6', '#ef4444', '#10b981'];
  return withDiversity.slice(0, 3).map((r, i) => ({
    ...r,
    color: colors[i],
  }));
}
