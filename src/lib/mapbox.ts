export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function getMapboxToken(): string {
  if (!MAPBOX_TOKEN) {
    throw new Error(
      'Mapbox token not found. Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local. ' +
      'Get a free token at https://account.mapbox.com/access-tokens/'
    );
  }
  return MAPBOX_TOKEN;
}

export function directionsUrl(
  profile: 'walking' | 'cycling' | 'driving',
  coordinates: [number, number][],
  options: { alternatives?: boolean; geometries?: string; overview?: string; steps?: boolean; continue_straight?: boolean } = {}
): string {
  const coords = coordinates.map(c => c.join(',')).join(';');
  const params = new URLSearchParams({
    access_token: getMapboxToken(),
    geometries: options.geometries || 'geojson',
    overview: options.overview || 'full',
    steps: String(options.steps ?? false),
    alternatives: String(options.alternatives ?? false),
    continue_straight: String(options.continue_straight ?? true),
  });
  return `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?${params}`;
}
