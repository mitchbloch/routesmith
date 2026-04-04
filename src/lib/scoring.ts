import type {
  UserPreferences,
  RouteScore,
  OverpassData,
  GeneratedRoute,
  SceneryPreference,
  SafetyPreference,
} from './types';
import type { CorridorGraph } from './corridorGraph';
import { haversineDistance, routeGeographicCenter } from './geometry';

function scoreDistanceFit(
  routeDistanceMeters: number,
  minMeters: number,
  maxMeters: number
): number {
  const mid = (minMeters + maxMeters) / 2;
  const range = maxMeters - minMeters;
  const diff = Math.abs(routeDistanceMeters - mid);
  if (diff <= range / 2) return 15;
  const overshoot = diff - range / 2;
  return Math.max(0, 15 - (overshoot / mid) * 30);
}

function scoreElevation(
  elevationGain: number,
  distanceMeters: number,
  preference: UserPreferences['elevation']
): number {
  if (preference === 'no-preference') return 20;

  const gradePercent = distanceMeters > 0 ? (elevationGain / distanceMeters) * 100 : 0;

  switch (preference) {
    case 'flat':
      if (gradePercent < 1) return 20;
      if (gradePercent < 2) return 14;
      return Math.max(0, 20 - gradePercent * 4);
    case 'moderate':
      if (gradePercent >= 1.5 && gradePercent <= 4) return 20;
      return Math.max(0, 20 - Math.abs(gradePercent - 2.75) * 5);
    case 'hilly':
      if (gradePercent > 4) return 20;
      if (gradePercent > 2.5) return 14;
      return Math.max(0, gradePercent * 4);
  }
}

function scoreScenerySingle(
  routeCoords: [number, number][],
  overpassData: OverpassData,
  preference: SceneryPreference,
  samplePoints: [number, number][],
  threshold: number
): number {
  let nearFeatureCount = 0;

  const features =
    preference === 'parks' ? overpassData.parks :
    preference === 'waterfront' ? overpassData.water :
    preference === 'urban' ? [] :
    overpassData.parks; // residential — prefer parks/quiet areas

  if (preference === 'urban') {
    for (const [lng, lat] of samplePoints) {
      const nearPark = overpassData.parks.some(f => isNearFeature(lat, lng, f, threshold));
      const nearWater = overpassData.water.some(f => isNearFeature(lat, lng, f, threshold));
      if (!nearPark && !nearWater) nearFeatureCount++;
    }
  } else {
    for (const [lng, lat] of samplePoints) {
      if (features.some(f => isNearFeature(lat, lng, f, threshold))) {
        nearFeatureCount++;
      }
    }
  }

  const ratio = samplePoints.length > 0 ? nearFeatureCount / samplePoints.length : 0;
  return Math.round(ratio * 20);
}

function scoreScenery(
  routeCoords: [number, number][],
  overpassData: OverpassData,
  preferences: UserPreferences['scenery']
): number {
  const prefs = Array.isArray(preferences) ? preferences : [preferences];
  if (prefs.includes('no-preference')) return 20;

  const samplePoints = routeCoords.filter((_, i) => i % Math.max(1, Math.floor(routeCoords.length / 20)) === 0);
  const threshold = 200;

  const scores = prefs.map(p =>
    scoreScenerySingle(routeCoords, overpassData, p, samplePoints, threshold)
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function isNearFeature(lat: number, lng: number, feature: GeoJSON.Feature, threshold: number): boolean {
  const geom = feature.geometry;
  if (geom.type === 'Point') {
    const [fLng, fLat] = geom.coordinates;
    return haversineDistance(lat, lng, fLat, fLng) < threshold;
  }
  if (geom.type === 'LineString') {
    return geom.coordinates.some(([fLng, fLat]) =>
      haversineDistance(lat, lng, fLat, fLng) < threshold
    );
  }
  return false;
}

function scoreSafetySingle(
  routeCoords: [number, number][],
  routeDistanceMeters: number,
  overpassData: OverpassData,
  preference: SafetyPreference
): number {
  if (preference === 'dedicated-paths') {
    const samplePoints = routeCoords.filter((_, i) => i % Math.max(1, Math.floor(routeCoords.length / 20)) === 0);
    let onPath = 0;
    for (const [lng, lat] of samplePoints) {
      if (overpassData.paths.some(f => isNearFeature(lat, lng, f, 30))) {
        onPath++;
      }
    }
    const ratio = samplePoints.length > 0 ? onPath / samplePoints.length : 0;
    return Math.round(ratio * 15);
  }

  // minimize-crossings
  const crossingCount = overpassData.crossings.filter(f => {
    const [fLng, fLat] = (f.geometry as GeoJSON.Point).coordinates;
    return routeCoords.some(([lng, lat]) =>
      haversineDistance(lat, lng, fLat, fLng) < 25
    );
  }).length;

  const perKm = routeDistanceMeters > 0 ? crossingCount / (routeDistanceMeters / 1000) : 0;
  if (perKm < 1) return 15;
  if (perKm < 3) return 10;
  if (perKm < 6) return 6;
  return 3;
}

function scoreSafety(
  routeCoords: [number, number][],
  routeDistanceMeters: number,
  overpassData: OverpassData,
  preferences: UserPreferences['safety']
): number {
  const prefs = Array.isArray(preferences) ? preferences : [preferences];
  if (prefs.includes('no-preference')) return 15;

  const scores = prefs.map(p =>
    scoreSafetySingle(routeCoords, routeDistanceMeters, overpassData, p)
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Score how well a route adheres to corridor graph segments (0-20 pts) */
function scoreCorridorAdherence(
  routeCoords: [number, number][],
  corridorGraph: CorridorGraph | null,
): number {
  if (!corridorGraph || corridorGraph.segments.size === 0) return 0;

  const samplePoints = routeCoords.filter(
    (_, i) => i % Math.max(1, Math.floor(routeCoords.length / 20)) === 0,
  );

  // Collect all corridor segment coordinates for proximity checks
  const corridorCoords: [number, number][] = [];
  for (const seg of corridorGraph.segments.values()) {
    // Sample every few coords from each segment
    for (let i = 0; i < seg.coords.length; i += Math.max(1, Math.floor(seg.coords.length / 5))) {
      corridorCoords.push(seg.coords[i]);
    }
  }

  let onCorridor = 0;
  for (const [lng, lat] of samplePoints) {
    const near = corridorCoords.some(([cLng, cLat]) =>
      haversineDistance(lat, lng, cLat, cLng) < 30,
    );
    if (near) onCorridor++;
  }

  const ratio = samplePoints.length > 0 ? onCorridor / samplePoints.length : 0;
  return Math.round(ratio * 20);
}

export function scoreRoute(
  route: { distance: number; elevationGain: number; geometry: GeoJSON.LineString },
  preferences: UserPreferences,
  overpassData: OverpassData,
  minMeters: number,
  maxMeters: number,
  corridorGraph?: CorridorGraph | null,
): RouteScore {
  const coords = route.geometry.coordinates as [number, number][];
  const distanceFit = Math.round(scoreDistanceFit(route.distance, minMeters, maxMeters));
  const elevationMatch = Math.round(scoreElevation(route.elevationGain, route.distance, preferences.elevation));
  const sceneryMatch = Math.round(scoreScenery(coords, overpassData, preferences.scenery));
  const safetyMatch = Math.round(scoreSafety(coords, route.distance, overpassData, preferences.safety));
  const corridorAdherence = scoreCorridorAdherence(coords, corridorGraph ?? null);

  return {
    distanceFit,
    elevationMatch,
    sceneryMatch,
    safetyMatch,
    corridorAdherence,
    diversityBonus: 0, // set later
    overall: distanceFit + elevationMatch + sceneryMatch + safetyMatch + corridorAdherence,
  };
}

export function applyDiversityBonus(routes: GeneratedRoute[]): GeneratedRoute[] {
  if (routes.length <= 1) return routes;

  return routes.map((route, i) => {
    let bonus = 0;
    const center = routeGeographicCenter(route.geometry.coordinates as [number, number][]);

    for (let j = 0; j < routes.length; j++) {
      if (i === j) continue;
      const otherCenter = routeGeographicCenter(routes[j].geometry.coordinates as [number, number][]);
      const dist = haversineDistance(center[1], center[0], otherCenter[1], otherCenter[0]);
      if (dist > 500) bonus += 5;
    }

    bonus = Math.min(10, bonus);
    const newScore = {
      ...route.score,
      diversityBonus: bonus,
      overall: route.score.overall + bonus,
    };
    return { ...route, score: newScore };
  });
}
