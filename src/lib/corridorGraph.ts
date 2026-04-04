import type { OverpassData } from './types';
import { haversineDistance, toRad, toDeg } from './geometry';

// ── Types ──

export type CorridorType =
  | 'river_path'
  | 'bike_path'
  | 'greenway'
  | 'park_perimeter'
  | 'named_trail'
  | 'multi_use'
  | 'bridge'
  | 'connector';

export interface GraphNode {
  id: string;
  coord: [number, number]; // [lng, lat]
  type: 'intersection' | 'bridge' | 'dead_end' | 'start';
}

export interface GraphSegment {
  id: string;
  from: string; // GraphNode id
  to: string;   // GraphNode id
  coords: [number, number][]; // [lng, lat][]
  lengthMeters: number;
  quality: number; // 0-1
  corridorType: CorridorType;
  surface?: string;
  name?: string;
  osmTags: Record<string, string>;
}

export interface CorridorGraph {
  nodes: Map<string, GraphNode>;
  segments: Map<string, GraphSegment>;
  adjacency: Map<string, string[]>; // nodeId -> segmentIds
}

export interface GraphDensity {
  adequate: boolean;
  totalPathLength: number;
  nodeCount: number;
}

// ── Constants ──

const SNAP_TOLERANCE_METERS = 20;
const GRID_CELL_SIZE = 0.0005; // ~50m in degrees

// ── Public API ──

export function buildCorridorGraph(
  overpassData: OverpassData,
  center: { lat: number; lng: number },
  radiusMeters: number,
): CorridorGraph {
  // 1. Extract raw segments from all path-like features
  const rawSegments = extractSegments(overpassData);

  // 2. Snap nearby endpoints into shared nodes
  const { nodes, segments: snappedSegments } = snapEndpoints(rawSegments);

  // 3. Score segment quality
  for (const seg of snappedSegments) {
    seg.quality = scoreSegmentQuality(seg, overpassData);
  }

  // 4. Merge collinear degree-2 chains of same corridor type
  const mergedSegments = mergeCollinearSegments(snappedSegments, nodes);

  // 5. Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const node of nodes.values()) {
    adjacency.set(node.id, []);
  }
  for (const seg of mergedSegments) {
    adjacency.get(seg.from)?.push(seg.id);
    adjacency.get(seg.to)?.push(seg.id);
  }

  // 6. Classify node types based on degree
  for (const node of nodes.values()) {
    const degree = adjacency.get(node.id)?.length ?? 0;
    if (degree <= 1) {
      node.type = 'dead_end';
    } else if (degree >= 3) {
      node.type = 'intersection';
    }
    // degree 2 nodes keep their assigned type (bridge or intersection)
  }

  const segmentMap = new Map<string, GraphSegment>();
  for (const seg of mergedSegments) {
    segmentMap.set(seg.id, seg);
  }

  return { nodes, segments: segmentMap, adjacency };
}

export function assessGraphDensity(
  graph: CorridorGraph,
  center: { lat: number; lng: number },
  targetDistanceMeters: number,
): GraphDensity {
  let totalPathLength = 0;
  for (const seg of graph.segments.values()) {
    totalPathLength += seg.lengthMeters;
  }

  const nodeCount = graph.nodes.size;
  const adequate = totalPathLength >= targetDistanceMeters * 2 && nodeCount >= 4;

  return { adequate, totalPathLength, nodeCount };
}

// ── Segment Extraction ──

function extractSegments(overpassData: OverpassData): GraphSegment[] {
  const segments: GraphSegment[] = [];
  let segId = 0;

  // Build sets for quick lookup of bridge/named route OSM features
  const bridgeCoordSets = buildCoordSet(overpassData.bridges);
  const namedRouteCoordSets = buildCoordSet(overpassData.namedRoutes);

  const allPathFeatures = [
    ...overpassData.paths,
    ...overpassData.bridges,
    ...overpassData.namedRoutes,
  ];

  // Deduplicate features by their coordinate signature
  const seen = new Set<string>();

  for (const feature of allPathFeatures) {
    const geom = feature.geometry;
    if (geom.type !== 'LineString') continue;

    const coords = geom.coordinates as [number, number][];
    if (coords.length < 2) continue;

    // Simple dedup: hash first and last coord
    const key = `${coords[0][0].toFixed(6)},${coords[0][1].toFixed(6)}-${coords[coords.length - 1][0].toFixed(6)},${coords[coords.length - 1][1].toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = (feature.properties || {}) as Record<string, string>;
    const corridorType = classifyCorridorType(tags, coords, overpassData, bridgeCoordSets, namedRouteCoordSets);

    const lengthMeters = measureLineLength(coords);

    segments.push({
      id: `seg_${segId++}`,
      from: '', // assigned during snapping
      to: '',
      coords,
      lengthMeters,
      quality: 0,
      corridorType,
      surface: tags.surface,
      name: tags.name,
      osmTags: tags,
    });
  }

  return segments;
}

function buildCoordSet(features: GeoJSON.Feature[]): Set<string> {
  const set = new Set<string>();
  for (const f of features) {
    if (f.geometry.type === 'LineString') {
      for (const c of f.geometry.coordinates as [number, number][]) {
        set.add(`${c[0].toFixed(5)},${c[1].toFixed(5)}`);
      }
    }
  }
  return set;
}

// ── Corridor Classification ──

function classifyCorridorType(
  tags: Record<string, string>,
  coords: [number, number][],
  overpassData: OverpassData,
  bridgeCoords: Set<string>,
  namedRouteCoords: Set<string>,
): CorridorType {
  // Check bridge first (most specific)
  if (tags.bridge === 'yes') return 'bridge';

  // Named routes/trails
  if (tags.route === 'hiking' || tags.route === 'bicycle' || tags.route === 'foot') return 'named_trail';
  if (tags.name && ['cycleway', 'footway', 'path', 'track'].includes(tags.highway)) return 'named_trail';

  // Bike paths
  if (tags.highway === 'cycleway') return 'bike_path';

  // Check proximity to water (sample midpoint)
  const mid = coords[Math.floor(coords.length / 2)];
  if (isNearFeatures(mid, overpassData.water, 100)) return 'river_path';

  // Check if within/along a park
  if (isNearFeatures(mid, overpassData.parks, 50)) return 'greenway';

  // Multi-use paths
  if (tags.highway === 'path' || tags.highway === 'pedestrian') return 'multi_use';
  if (tags.highway === 'footway') return 'multi_use';

  // Everything else
  return 'connector';
}

function isNearFeatures(coord: [number, number], features: GeoJSON.Feature[], thresholdMeters: number): boolean {
  for (const feature of features) {
    if (feature.geometry.type !== 'LineString') continue;
    const fCoords = feature.geometry.coordinates as [number, number][];
    // Sample a few points from the feature for proximity check
    for (let i = 0; i < fCoords.length; i += Math.max(1, Math.floor(fCoords.length / 5))) {
      const d = haversineDistance(coord[1], coord[0], fCoords[i][1], fCoords[i][0]);
      if (d < thresholdMeters) return true;
    }
  }
  return false;
}

// ── Endpoint Snapping ──

/** Snap nearby segment endpoints into shared graph nodes using a grid spatial index */
function snapEndpoints(segments: GraphSegment[]): {
  nodes: Map<string, GraphNode>;
  segments: GraphSegment[];
} {
  const nodes = new Map<string, GraphNode>();
  const grid = new Map<string, GraphNode[]>(); // cell key -> nodes in cell
  let nodeId = 0;

  function gridKey(coord: [number, number]): string {
    const col = Math.floor(coord[0] / GRID_CELL_SIZE);
    const row = Math.floor(coord[1] / GRID_CELL_SIZE);
    return `${col},${row}`;
  }

  function findNearbyNode(coord: [number, number]): GraphNode | null {
    const col = Math.floor(coord[0] / GRID_CELL_SIZE);
    const row = Math.floor(coord[1] / GRID_CELL_SIZE);

    // Check 3x3 neighborhood
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const key = `${col + dc},${row + dr}`;
        const cellNodes = grid.get(key);
        if (!cellNodes) continue;
        for (const node of cellNodes) {
          const d = haversineDistance(coord[1], coord[0], node.coord[1], node.coord[0]);
          if (d < SNAP_TOLERANCE_METERS) return node;
        }
      }
    }
    return null;
  }

  function getOrCreateNode(coord: [number, number]): GraphNode {
    const existing = findNearbyNode(coord);
    if (existing) return existing;

    const id = `node_${nodeId++}`;
    const node: GraphNode = { id, coord, type: 'intersection' };
    nodes.set(id, node);

    const key = gridKey(coord);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(node);

    return node;
  }

  for (const seg of segments) {
    const startCoord = seg.coords[0];
    const endCoord = seg.coords[seg.coords.length - 1];

    const startNode = getOrCreateNode(startCoord);
    const endNode = getOrCreateNode(endCoord);

    seg.from = startNode.id;
    seg.to = endNode.id;
  }

  return { nodes, segments };
}

// ── Collinear Merging ──

/** Merge chains of degree-2 nodes with same corridor type into single segments */
function mergeCollinearSegments(
  segments: GraphSegment[],
  nodes: Map<string, GraphNode>,
): GraphSegment[] {
  // Build temporary adjacency for merge analysis
  const adj = new Map<string, string[]>();
  for (const node of nodes.values()) {
    adj.set(node.id, []);
  }
  for (const seg of segments) {
    adj.get(seg.from)?.push(seg.id);
    adj.get(seg.to)?.push(seg.id);
  }

  const segMap = new Map<string, GraphSegment>();
  for (const seg of segments) {
    segMap.set(seg.id, seg);
  }

  const merged: GraphSegment[] = [];
  const consumed = new Set<string>();
  let mergeId = 0;

  for (const seg of segments) {
    if (consumed.has(seg.id)) continue;

    // Try to extend this segment forward through degree-2 nodes
    const chain = [seg];
    consumed.add(seg.id);

    // Extend forward from 'to' node
    let currentNodeId = seg.to;
    while (true) {
      const degree = adj.get(currentNodeId)?.length ?? 0;
      if (degree !== 2) break;

      const neighborSegIds = adj.get(currentNodeId)!;
      const nextSegId = neighborSegIds.find(id => !consumed.has(id));
      if (!nextSegId) break;

      const nextSeg = segMap.get(nextSegId)!;
      if (nextSeg.corridorType !== seg.corridorType) break;

      consumed.add(nextSegId);
      chain.push(nextSeg);
      currentNodeId = nextSeg.from === currentNodeId ? nextSeg.to : nextSeg.from;
    }

    // Extend backward from 'from' node
    currentNodeId = seg.from;
    while (true) {
      const degree = adj.get(currentNodeId)?.length ?? 0;
      if (degree !== 2) break;

      const neighborSegIds = adj.get(currentNodeId)!;
      const prevSegId = neighborSegIds.find(id => !consumed.has(id));
      if (!prevSegId) break;

      const prevSeg = segMap.get(prevSegId)!;
      if (prevSeg.corridorType !== seg.corridorType) break;

      consumed.add(prevSegId);
      chain.unshift(prevSeg);
      currentNodeId = prevSeg.from === currentNodeId ? prevSeg.to : prevSeg.from;
    }

    if (chain.length === 1) {
      merged.push(seg);
      continue;
    }

    // Build merged coordinates in order
    const mergedCoords = buildOrderedCoords(chain);
    const fromNode = getEndpointNodeId(chain[0], chain.length > 1 ? chain[1] : null, adj);
    const toNode = getEndpointNodeId(chain[chain.length - 1], chain.length > 1 ? chain[chain.length - 2] : null, adj);

    merged.push({
      id: `merged_${mergeId++}`,
      from: fromNode,
      to: toNode,
      coords: mergedCoords,
      lengthMeters: measureLineLength(mergedCoords),
      quality: chain.reduce((sum, s) => sum + s.quality * s.lengthMeters, 0) /
               chain.reduce((sum, s) => sum + s.lengthMeters, 0) || 0,
      corridorType: seg.corridorType,
      surface: seg.surface,
      name: chain.find(s => s.name)?.name,
      osmTags: seg.osmTags,
    });
  }

  // Clean up degree-2 nodes that were merged through
  const usedNodes = new Set<string>();
  for (const seg of merged) {
    usedNodes.add(seg.from);
    usedNodes.add(seg.to);
  }
  for (const nodeId of [...nodes.keys()]) {
    if (!usedNodes.has(nodeId)) {
      nodes.delete(nodeId);
    }
  }

  return merged;
}

/** Build ordered coordinate array from a chain of segments */
function buildOrderedCoords(chain: GraphSegment[]): [number, number][] {
  if (chain.length === 0) return [];
  if (chain.length === 1) return [...chain[0].coords];

  const coords: [number, number][] = [...chain[0].coords];

  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];

    // Determine if current segment needs to be reversed
    const prevEnd = coords[coords.length - 1];
    const currStart = curr.coords[0];
    const currEnd = curr.coords[curr.coords.length - 1];

    const distToStart = haversineDistance(prevEnd[1], prevEnd[0], currStart[1], currStart[0]);
    const distToEnd = haversineDistance(prevEnd[1], prevEnd[0], currEnd[1], currEnd[0]);

    if (distToEnd < distToStart) {
      // Reverse the segment
      for (let j = curr.coords.length - 2; j >= 0; j--) {
        coords.push(curr.coords[j]);
      }
    } else {
      // Append in order (skip first point to avoid duplication)
      for (let j = 1; j < curr.coords.length; j++) {
        coords.push(curr.coords[j]);
      }
    }
  }

  return coords;
}

/** Get the "outer" endpoint node of a segment in a chain */
function getEndpointNodeId(
  seg: GraphSegment,
  neighbor: GraphSegment | null,
  adj: Map<string, string[]>,
): string {
  if (!neighbor) return seg.from;

  // The endpoint NOT shared with the neighbor is the outer endpoint
  if (seg.from === neighbor.from || seg.from === neighbor.to) return seg.to;
  return seg.from;
}

// ── Segment Quality Scoring ──

function scoreSegmentQuality(seg: GraphSegment, overpassData: OverpassData): number {
  let score = 0;
  const tags = seg.osmTags;

  // Dedicated infrastructure (0.3)
  if (['cycleway', 'footway', 'path', 'pedestrian'].includes(tags.highway)) {
    score += 0.3;
  } else if (['track', 'bridleway', 'living_street'].includes(tags.highway)) {
    score += 0.15;
  }

  // Named trail (0.2)
  if (seg.name || tags.route) {
    score += 0.2;
  }

  // Near water (0.2) — sample midpoint
  const mid = seg.coords[Math.floor(seg.coords.length / 2)];
  if (isNearFeatures(mid, overpassData.water, 100)) {
    score += 0.2;
  }

  // Near park (0.2)
  if (isNearFeatures(mid, overpassData.parks, 50)) {
    score += 0.2;
  }

  // Surface quality (0.1)
  if (seg.surface === 'paved' || seg.surface === 'asphalt' || seg.surface === 'concrete') {
    score += 0.1;
  } else if (!seg.surface) {
    score += 0.05; // Unknown surface gets partial credit
  }

  return Math.min(1, score);
}

// ── Geometry Helpers ──

function measureLineLength(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  return total;
}
