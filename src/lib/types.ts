export type ActivityType = 'walking' | 'running' | 'biking';
export type RouteType = 'loop' | 'point-to-point';
export type ElevationPreference = 'flat' | 'moderate' | 'hilly' | 'no-preference';
export type SceneryPreference = 'parks' | 'waterfront' | 'urban' | 'residential' | 'no-preference';
export type SafetyPreference = 'dedicated-paths' | 'minimize-crossings' | 'no-preference';
export type DistanceUnit = 'miles' | 'km';

export interface UserPreferences {
  startLocation: { lat: number; lng: number; address?: string };
  endLocation?: { lat: number; lng: number; address?: string };
  activityType: ActivityType;
  routeType: RouteType;
  distanceMin: number;
  distanceMax: number;
  distanceUnit: DistanceUnit;
  elevation: ElevationPreference;
  scenery: SceneryPreference[];
  safety: SafetyPreference[];
}

export interface RouteScore {
  overall: number;
  distanceFit: number;       // 15pts (was 20)
  elevationMatch: number;    // 20pts (was 25)
  sceneryMatch: number;      // 20pts (was 25)
  safetyMatch: number;       // 15pts (was 20)
  corridorAdherence: number; // 20pts (new)
  diversityBonus: number;    // 10pts
}

export interface GeneratedRoute {
  id: string;
  name: string;
  geometry: GeoJSON.LineString;
  distance: number; // in meters
  duration: number; // in seconds
  elevationGain: number;
  elevationLoss: number;
  score: RouteScore;
  tags: string[];
  waypoints: [number, number][]; // [lng, lat]
  color: string;
}

export interface SavedRoute extends GeneratedRoute {
  savedAt: string;
  customName?: string;
  rating?: number;
  activityType: ActivityType;
  startAddress?: string;
}

export interface OverpassData {
  parks: GeoJSON.Feature[];
  water: GeoJSON.Feature[];
  paths: GeoJSON.Feature[];
  crossings: GeoJSON.Feature[];
  bridges: GeoJSON.Feature[];
  namedRoutes: GeoJSON.Feature[];
}

export const ACTIVITY_DEFAULTS: Record<ActivityType, { minDist: number; maxDist: number; pace: number }> = {
  walking: { minDist: 1, maxDist: 3, pace: 20 },   // min/mile
  running: { minDist: 2, maxDist: 6, pace: 10 },
  biking: { minDist: 5, maxDist: 15, pace: 4 },
};

export const ROUTE_COLORS = ['#3b82f6', '#ef4444', '#10b981'];
