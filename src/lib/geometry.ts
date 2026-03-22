const R = 6371000; // Earth's radius in meters

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function destinationPoint(
  lat: number, lng: number,
  bearing: number, distance: number
): [number, number] {
  const d = distance / R;
  const brng = toRad(bearing);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lng2), toDeg(lat2)]; // [lng, lat] for Mapbox
}

export function boundingBox(
  lat: number, lng: number, radiusMeters: number
): { south: number; west: number; north: number; east: number } {
  const dLat = toDeg(radiusMeters / R);
  const dLng = dLat / Math.cos(toRad(lat));
  return {
    south: lat - dLat,
    west: lng - dLng,
    north: lat + dLat,
    east: lng + dLng,
  };
}

export function generateLoopWaypoints(
  lat: number, lng: number,
  targetDistanceMeters: number,
  numWaypoints: number,
  startBearing: number
): [number, number][] {
  // Route goes: center → wp1 → wp2 → ... → wpN → center.
  // Crow-flies total ≈ 2r + (N-1) * chord, where chord ≈ 2r*sin(π/N).
  // Road routing adds ~40% overhead on top of crow-flies distance.
  // Empirically calibrated: overhead factor of 2 balances under/over-shooting.
  const routingOverhead = 2;
  const reach = targetDistanceMeters / (routingOverhead * numWaypoints);
  const waypoints: [number, number][] = [];
  const angleStep = 360 / numWaypoints;

  for (let i = 0; i < numWaypoints; i++) {
    const bearing = (startBearing + i * angleStep) % 360;
    const jitter = (Math.random() - 0.5) * angleStep * 0.4;
    const distJitter = reach * (0.8 + Math.random() * 0.4);
    waypoints.push(destinationPoint(lat, lng, bearing + jitter, distJitter));
  }

  return waypoints;
}

export function routeGeographicCenter(coords: [number, number][]): [number, number] {
  let lngSum = 0, latSum = 0;
  for (const [lng, lat] of coords) {
    lngSum += lng;
    latSum += lat;
  }
  return [lngSum / coords.length, latSum / coords.length];
}

export function metersToMiles(m: number): number {
  return m * 0.000621371;
}

export function milesToMeters(mi: number): number {
  return mi / 0.000621371;
}

export function metersToKm(m: number): number {
  return m / 1000;
}

export function kmToMeters(km: number): number {
  return km * 1000;
}
