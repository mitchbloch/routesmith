import type { OverpassData } from './types';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

function buildQuery(south: number, west: number, north: number, east: number): string {
  const bbox = `${south},${west},${north},${east}`;
  return `
[out:json][timeout:25];
(
  // Parks and green spaces
  way["leisure"="park"](${bbox});
  way["landuse"="recreation_ground"](${bbox});
  relation["leisure"="park"](${bbox});
  // Water features
  way["natural"="water"](${bbox});
  way["waterway"](${bbox});
  relation["natural"="water"](${bbox});
  // Dedicated paths
  way["highway"="cycleway"](${bbox});
  way["highway"="footway"](${bbox});
  way["highway"="path"](${bbox});
  way["highway"="pedestrian"](${bbox});
  way["highway"="track"](${bbox});
  way["highway"="bridleway"](${bbox});
  way["highway"="living_street"](${bbox});
  // Bridges
  way["bridge"="yes"](${bbox});
  // Named routes and trails
  way["route"="hiking"](${bbox});
  way["route"="bicycle"](${bbox});
  way["route"="foot"](${bbox});
  // Crossings
  node["highway"="crossing"](${bbox});
  node["highway"="traffic_signals"](${bbox});
);
out body geom;
`;
}

function parseOverpassResponse(data: { elements: Array<Record<string, unknown>> }): OverpassData {
  const parks: GeoJSON.Feature[] = [];
  const water: GeoJSON.Feature[] = [];
  const paths: GeoJSON.Feature[] = [];
  const crossings: GeoJSON.Feature[] = [];
  const bridges: GeoJSON.Feature[] = [];
  const namedRoutes: GeoJSON.Feature[] = [];

  for (const el of data.elements) {
    const tags = (el.tags || {}) as Record<string, string>;
    const geom = el.geometry as Array<{ lat: number; lon: number }> | undefined;

    if (el.type === 'node') {
      const feature: GeoJSON.Feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [el.lon as number, el.lat as number] },
        properties: tags,
      };
      if (tags.highway === 'crossing' || tags.highway === 'traffic_signals') {
        crossings.push(feature);
      }
    } else if (geom && geom.length > 0) {
      const coords: [number, number][] = geom.map(g => [g.lon, g.lat]);
      const feature: GeoJSON.Feature = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: tags,
      };

      // Classify into categories (a feature can appear in multiple)
      if (tags.leisure === 'park' || tags.landuse === 'recreation_ground') {
        parks.push(feature);
      } else if (tags.natural === 'water' || tags.waterway) {
        water.push(feature);
      } else if (['cycleway', 'footway', 'path', 'pedestrian', 'track', 'bridleway', 'living_street'].includes(tags.highway)) {
        paths.push(feature);
      }

      // Bridge overlay — a way can be both a path and a bridge
      if (tags.bridge === 'yes') {
        bridges.push(feature);
      }

      // Named routes/trails
      if (tags.route === 'hiking' || tags.route === 'bicycle' || tags.route === 'foot' || (tags.name && ['cycleway', 'footway', 'path', 'track'].includes(tags.highway))) {
        namedRoutes.push(feature);
      }
    }
  }

  return { parks, water, paths, crossings, bridges, namedRoutes };
}

export async function queryOverpass(
  south: number, west: number, north: number, east: number
): Promise<OverpassData> {
  const query = buildQuery(south, west, north, east);
  const res = await fetch(OVERPASS_API, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) {
    console.error('Overpass API error:', res.status);
    return { parks: [], water: [], paths: [], crossings: [], bridges: [], namedRoutes: [] };
  }

  const data = await res.json();
  return parseOverpassResponse(data);
}
