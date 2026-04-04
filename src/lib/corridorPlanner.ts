import type { CorridorGraph, GraphNode, GraphSegment } from './corridorGraph';
import { haversineDistance, toRad, toDeg } from './geometry';

// ── Types ──

export interface CorridorRoute {
  waypoints: [number, number][]; // Ordered [lng, lat] for Mapbox Directions
  segmentIds: string[];          // GraphSegment IDs used
  strategy: 'A' | 'B' | 'C' | 'D';
  estimatedDistance: number;     // Sum of segment lengths
}

// ── Constants ──

const MAX_WAYPOINTS = 20; // Mapbox limit is 25, leave margin
const MAX_CANDIDATES_PER_STRATEGY = 4;

// ── Public API ──

/**
 * Generate corridor-based route candidates by traversing the corridor graph.
 * Produces up to `count` candidates using 4 different strategies.
 */
export function planCorridorRoutes(
  graph: CorridorGraph,
  start: { lat: number; lng: number },
  targetDistanceMeters: number,
  count: number = 12,
): CorridorRoute[] {
  const startNode = findNearestNode(graph, start);
  if (!startNode) return [];

  const startCoord: [number, number] = [start.lng, start.lat];
  const isStartFar = haversineDistance(
    start.lat, start.lng,
    startNode.coord[1], startNode.coord[0],
  ) > 500;

  const candidates: CorridorRoute[] = [];

  // Strategy A: Out-and-back (best for short distances)
  const aRoutes = planOutAndBack(graph, startNode, targetDistanceMeters, startCoord, isStartFar);
  candidates.push(...aRoutes.slice(0, MAX_CANDIDATES_PER_STRATEGY));

  // Strategy B: Two-corridor loop
  const bRoutes = planTwoCorridorLoop(graph, startNode, targetDistanceMeters, startCoord, isStartFar);
  candidates.push(...bRoutes.slice(0, MAX_CANDIDATES_PER_STRATEGY));

  // Strategy C: Multi-corridor loop (best for longer distances)
  const cRoutes = planMultiCorridorLoop(graph, startNode, targetDistanceMeters, startCoord, isStartFar);
  candidates.push(...cRoutes.slice(0, MAX_CANDIDATES_PER_STRATEGY));

  // Strategy D: Exploratory (variety)
  const dRoutes = planExploratory(graph, startNode, targetDistanceMeters, startCoord, isStartFar);
  candidates.push(...dRoutes.slice(0, MAX_CANDIDATES_PER_STRATEGY));

  // Sort by how close estimated distance is to target, take top `count`
  candidates.sort((a, b) =>
    Math.abs(a.estimatedDistance - targetDistanceMeters) -
    Math.abs(b.estimatedDistance - targetDistanceMeters)
  );

  return candidates.slice(0, count);
}

// ── Strategy A: Out-and-Back ──

function planOutAndBack(
  graph: CorridorGraph,
  startNode: GraphNode,
  targetDistance: number,
  startCoord: [number, number],
  isStartFar: boolean,
): CorridorRoute[] {
  const halfTarget = targetDistance / 2;
  const routes: CorridorRoute[] = [];

  // Find high-quality corridors reachable from start
  const startSegIds = graph.adjacency.get(startNode.id) ?? [];
  const startSegs = startSegIds
    .map(id => graph.segments.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.quality - a.quality);

  // Try each starting corridor
  for (const firstSeg of startSegs.slice(0, 4)) {
    const path = walkCorridor(graph, startNode.id, firstSeg, halfTarget);
    if (path.segments.length === 0) continue;

    const totalDist = path.distance * 2; // out and back
    const waypoints = extractWaypoints(path.coords, startCoord, isStartFar, true);

    routes.push({
      waypoints,
      segmentIds: path.segments,
      strategy: 'A',
      estimatedDistance: totalDist,
    });
  }

  return routes;
}

// ── Strategy B: Two-Corridor Loop ──

function planTwoCorridorLoop(
  graph: CorridorGraph,
  startNode: GraphNode,
  targetDistance: number,
  startCoord: [number, number],
  isStartFar: boolean,
): CorridorRoute[] {
  const routes: CorridorRoute[] = [];
  const halfBudget = targetDistance / 2;

  const startSegIds = graph.adjacency.get(startNode.id) ?? [];
  const startSegs = startSegIds
    .map(id => graph.segments.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.quality - a.quality);

  // Try pairs of corridors going in different directions
  for (let i = 0; i < Math.min(startSegs.length, 3); i++) {
    const outSeg = startSegs[i];

    // Walk outbound corridor
    const outPath = walkCorridor(graph, startNode.id, outSeg, halfBudget);
    if (outPath.segments.length === 0) continue;

    // At the turnaround node, look for a different corridor heading back
    const turnNodeId = outPath.endNodeId;
    const turnSegIds = graph.adjacency.get(turnNodeId) ?? [];
    const returnSegs = turnSegIds
      .map(id => graph.segments.get(id)!)
      .filter(s => s && !outPath.segments.includes(s.id))
      .sort((a, b) => {
        // Prefer segments heading back toward start
        const aEnd = otherEnd(a, turnNodeId, graph);
        const bEnd = otherEnd(b, turnNodeId, graph);
        const aDist = haversineDistance(startNode.coord[1], startNode.coord[0], aEnd[1], aEnd[0]);
        const bDist = haversineDistance(startNode.coord[1], startNode.coord[0], bEnd[1], bEnd[0]);
        return aDist - bDist;
      });

    for (const retSeg of returnSegs.slice(0, 2)) {
      const retPath = walkCorridorToward(
        graph, turnNodeId, retSeg, halfBudget,
        startNode.coord, new Set(outPath.segments),
      );

      const totalDist = outPath.distance + retPath.distance;
      const loopCoords = [...outPath.coords, ...retPath.coords.slice(1)];
      const waypoints = extractWaypoints(loopCoords, startCoord, isStartFar, true);

      routes.push({
        waypoints,
        segmentIds: [...outPath.segments, ...retPath.segments],
        strategy: 'B',
        estimatedDistance: totalDist,
      });
    }
  }

  return routes;
}

// ── Strategy C: Multi-Corridor Loop ──

function planMultiCorridorLoop(
  graph: CorridorGraph,
  startNode: GraphNode,
  targetDistance: number,
  startCoord: [number, number],
  isStartFar: boolean,
): CorridorRoute[] {
  const routes: CorridorRoute[] = [];

  // Try different initial directions
  const startSegIds = graph.adjacency.get(startNode.id) ?? [];
  const startSegs = startSegIds
    .map(id => graph.segments.get(id)!)
    .filter(Boolean);

  // Sort by bearing to get diverse starting directions
  const sorted = startSegs.map(seg => ({
    seg,
    bearing: bearingTo(startNode.coord, otherEnd(seg, startNode.id, graph)),
  })).sort((a, b) => a.bearing - b.bearing);

  // Pick up to 4 diverse starting directions
  const picks = pickDiverseByBearing(sorted, 4);

  for (const { seg: firstSeg } of picks) {
    const route = dfsLoop(graph, startNode, firstSeg, targetDistance);
    if (!route) continue;

    const waypoints = extractWaypoints(route.coords, startCoord, isStartFar, true);

    routes.push({
      waypoints,
      segmentIds: route.segments,
      strategy: 'C',
      estimatedDistance: route.distance,
    });
  }

  return routes;
}

// ── Strategy D: Exploratory ──

function planExploratory(
  graph: CorridorGraph,
  startNode: GraphNode,
  targetDistance: number,
  startCoord: [number, number],
  isStartFar: boolean,
): CorridorRoute[] {
  const routes: CorridorRoute[] = [];

  // Random walk weighted by quality, with some randomness
  for (let attempt = 0; attempt < 3; attempt++) {
    const route = randomWalkLoop(graph, startNode, targetDistance, attempt);
    if (!route) continue;

    const waypoints = extractWaypoints(route.coords, startCoord, isStartFar, true);

    routes.push({
      waypoints,
      segmentIds: route.segments,
      strategy: 'D',
      estimatedDistance: route.distance,
    });
  }

  return routes;
}

// ── Graph Traversal Helpers ──

interface WalkResult {
  coords: [number, number][];
  segments: string[];
  distance: number;
  endNodeId: string;
}

/** Walk along the graph following highest-quality segments until distance budget is reached */
function walkCorridor(
  graph: CorridorGraph,
  fromNodeId: string,
  firstSeg: GraphSegment,
  maxDistance: number,
): WalkResult {
  const segments: string[] = [firstSeg.id];
  const visited = new Set<string>([firstSeg.id]);
  let distance = firstSeg.lengthMeters;
  let currentNodeId = firstSeg.from === fromNodeId ? firstSeg.to : firstSeg.from;
  const coords: [number, number][] = getOrientedCoords(firstSeg, fromNodeId, graph);

  while (distance < maxDistance) {
    const nextSegIds = graph.adjacency.get(currentNodeId) ?? [];
    const candidates = nextSegIds
      .map(id => graph.segments.get(id)!)
      .filter(s => s && !visited.has(s.id))
      .sort((a, b) => b.quality - a.quality);

    if (candidates.length === 0) break;

    const next = candidates[0];
    if (distance + next.lengthMeters > maxDistance * 1.3) break; // Don't overshoot too much

    visited.add(next.id);
    segments.push(next.id);
    distance += next.lengthMeters;

    const oriented = getOrientedCoords(next, currentNodeId, graph);
    coords.push(...oriented.slice(1)); // skip first coord (shared with prev)

    currentNodeId = next.from === currentNodeId ? next.to : next.from;
  }

  return { coords, segments, distance, endNodeId: currentNodeId };
}

/** Walk toward a target coordinate, preferring segments that reduce distance to target */
function walkCorridorToward(
  graph: CorridorGraph,
  fromNodeId: string,
  firstSeg: GraphSegment,
  maxDistance: number,
  target: [number, number],
  excludeSegments: Set<string>,
): WalkResult {
  const segments: string[] = [firstSeg.id];
  const visited = new Set<string>([firstSeg.id, ...excludeSegments]);
  let distance = firstSeg.lengthMeters;
  let currentNodeId = firstSeg.from === fromNodeId ? firstSeg.to : firstSeg.from;
  const coords: [number, number][] = getOrientedCoords(firstSeg, fromNodeId, graph);

  while (distance < maxDistance) {
    const currentNode = graph.nodes.get(currentNodeId);
    if (!currentNode) break;

    // Check if we're close enough to target
    const distToTarget = haversineDistance(currentNode.coord[1], currentNode.coord[0], target[1], target[0]);
    if (distToTarget < 200) break; // Close enough, let Mapbox route the last bit

    const nextSegIds = graph.adjacency.get(currentNodeId) ?? [];
    const candidates = nextSegIds
      .map(id => graph.segments.get(id)!)
      .filter(s => s && !visited.has(s.id))
      .sort((a, b) => {
        // Score: quality + proximity to target
        const aEnd = otherEnd(a, currentNodeId, graph);
        const bEnd = otherEnd(b, currentNodeId, graph);
        const aCloser = distToTarget - haversineDistance(aEnd[1], aEnd[0], target[1], target[0]);
        const bCloser = distToTarget - haversineDistance(bEnd[1], bEnd[0], target[1], target[0]);
        // Combine quality and "heading home" factor
        return (b.quality + bCloser / 1000) - (a.quality + aCloser / 1000);
      });

    if (candidates.length === 0) break;

    const next = candidates[0];
    visited.add(next.id);
    segments.push(next.id);
    distance += next.lengthMeters;

    const oriented = getOrientedCoords(next, currentNodeId, graph);
    coords.push(...oriented.slice(1));

    currentNodeId = next.from === currentNodeId ? next.to : next.from;
  }

  return { coords, segments, distance, endNodeId: currentNodeId };
}

/** DFS to find a loop back to start within a distance budget */
function dfsLoop(
  graph: CorridorGraph,
  startNode: GraphNode,
  firstSeg: GraphSegment,
  targetDistance: number,
): WalkResult | null {
  const homeThreshold = Math.max(targetDistance * 0.1, 300); // Within 10% or 300m of start

  interface State {
    nodeId: string;
    distance: number;
    segments: string[];
    coords: [number, number][];
    visited: Set<string>;
  }

  const initial: State = {
    nodeId: firstSeg.from === startNode.id ? firstSeg.to : firstSeg.from,
    distance: firstSeg.lengthMeters,
    segments: [firstSeg.id],
    coords: getOrientedCoords(firstSeg, startNode.id, graph),
    visited: new Set([firstSeg.id]),
  };

  // BFS with distance-budget pruning
  const queue: State[] = [initial];
  let bestRoute: WalkResult | null = null;
  let bestDistError = Infinity;
  let iterations = 0;
  const maxIterations = 500; // Bound computation

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const state = queue.shift()!;

    // Check if we're near start and have enough distance
    const currentNode = graph.nodes.get(state.nodeId);
    if (!currentNode) continue;

    const distToStart = haversineDistance(
      currentNode.coord[1], currentNode.coord[0],
      startNode.coord[1], startNode.coord[0],
    );

    const distanceRatio = state.distance / targetDistance;

    // Accept if we're near start and distance is 50-150% of target
    if (distToStart < homeThreshold && distanceRatio >= 0.5 && distanceRatio <= 1.5) {
      const distError = Math.abs(state.distance - targetDistance);
      if (distError < bestDistError) {
        bestDistError = distError;
        bestRoute = {
          coords: state.coords,
          segments: state.segments,
          distance: state.distance,
          endNodeId: state.nodeId,
        };
      }
    }

    // Don't explore further if we've overshot
    if (state.distance > targetDistance * 1.5) continue;

    // Expand neighbors
    const nextSegIds = graph.adjacency.get(state.nodeId) ?? [];
    const candidates = nextSegIds
      .map(id => graph.segments.get(id)!)
      .filter(s => s && !state.visited.has(s.id));

    // Past 60% of budget, prefer segments heading toward start
    const headingHome = distanceRatio > 0.6;

    const scored = candidates.map(seg => {
      const endCoord = otherEnd(seg, state.nodeId, graph);
      const distToHome = haversineDistance(endCoord[1], endCoord[0], startNode.coord[1], startNode.coord[0]);
      const homeScore = headingHome ? (distToStart - distToHome) / 1000 : 0;
      return { seg, score: seg.quality + homeScore };
    }).sort((a, b) => b.score - a.score);

    // Limit branching to keep computation bounded
    for (const { seg } of scored.slice(0, 3)) {
      const oriented = getOrientedCoords(seg, state.nodeId, graph);
      const newVisited = new Set(state.visited);
      newVisited.add(seg.id);

      queue.push({
        nodeId: seg.from === state.nodeId ? seg.to : seg.from,
        distance: state.distance + seg.lengthMeters,
        segments: [...state.segments, seg.id],
        coords: [...state.coords, ...oriented.slice(1)],
        visited: newVisited,
      });
    }

    // Sort queue by distance-to-target closeness (best-first)
    queue.sort((a, b) => {
      const aNode = graph.nodes.get(a.nodeId);
      const bNode = graph.nodes.get(b.nodeId);
      if (!aNode || !bNode) return 0;
      const aHome = haversineDistance(aNode.coord[1], aNode.coord[0], startNode.coord[1], startNode.coord[0]);
      const bHome = haversineDistance(bNode.coord[1], bNode.coord[0], startNode.coord[1], startNode.coord[0]);
      const aScore = Math.abs(a.distance + aHome - targetDistance);
      const bScore = Math.abs(b.distance + bHome - targetDistance);
      return aScore - bScore;
    });
  }

  return bestRoute;
}

/** Random walk that tries to form a loop, with controlled randomness */
function randomWalkLoop(
  graph: CorridorGraph,
  startNode: GraphNode,
  targetDistance: number,
  seed: number,
): WalkResult | null {
  const visited = new Set<string>();
  const segments: string[] = [];
  const coords: [number, number][] = [];
  let distance = 0;
  let currentNodeId = startNode.id;

  // Seeded pseudo-random for reproducible variety
  let rng = seed * 2654435761; // Knuth's multiplicative hash
  function random(): number {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  }

  const maxSteps = 50;
  for (let step = 0; step < maxSteps; step++) {
    const nextSegIds = graph.adjacency.get(currentNodeId) ?? [];
    const candidates = nextSegIds
      .map(id => graph.segments.get(id)!)
      .filter(s => s && !visited.has(s.id));

    if (candidates.length === 0) break;

    const distanceRatio = distance / targetDistance;

    // Past 60%, prefer heading home
    let chosen: GraphSegment;
    if (distanceRatio > 0.6) {
      const scored = candidates.map(seg => {
        const endCoord = otherEnd(seg, currentNodeId, graph);
        const distHome = haversineDistance(endCoord[1], endCoord[0], startNode.coord[1], startNode.coord[0]);
        return { seg, distHome };
      }).sort((a, b) => a.distHome - b.distHome);
      // Pick from top 2 with randomness
      const idx = scored.length > 1 && random() > 0.6 ? 1 : 0;
      chosen = scored[idx].seg;
    } else {
      // Random selection weighted slightly by quality
      const weighted = candidates.map(s => ({ seg: s, weight: s.quality + random() * 0.5 }));
      weighted.sort((a, b) => b.weight - a.weight);
      chosen = weighted[0].seg;
    }

    visited.add(chosen.id);
    segments.push(chosen.id);
    distance += chosen.lengthMeters;

    const oriented = getOrientedCoords(chosen, currentNodeId, graph);
    if (coords.length === 0) {
      coords.push(...oriented);
    } else {
      coords.push(...oriented.slice(1));
    }

    currentNodeId = chosen.from === currentNodeId ? chosen.to : chosen.from;

    // Check if we're near start and have enough distance
    if (distanceRatio >= 0.5) {
      const distToStart = haversineDistance(
        graph.nodes.get(currentNodeId)!.coord[1], graph.nodes.get(currentNodeId)!.coord[0],
        startNode.coord[1], startNode.coord[0],
      );
      if (distToStart < Math.max(targetDistance * 0.1, 300)) break;
    }

    if (distance > targetDistance * 1.5) break;
  }

  if (segments.length === 0) return null;

  return { coords, segments, distance, endNodeId: currentNodeId };
}

// ── Waypoint Extraction ──

/**
 * Extract key waypoints from a full coordinate path for the Mapbox Directions API.
 * Selects evenly-spaced points plus start/end, capped at MAX_WAYPOINTS.
 */
function extractWaypoints(
  coords: [number, number][],
  startCoord: [number, number],
  isStartFar: boolean,
  isLoop: boolean,
): [number, number][] {
  if (coords.length === 0) return [startCoord, startCoord];

  const waypoints: [number, number][] = [];

  // Start with actual start location
  waypoints.push(startCoord);

  // If start is far from the corridor, the first/last corridor point becomes a waypoint
  // (Mapbox will route from actual start to the corridor)
  const maxIntermediateWaypoints = MAX_WAYPOINTS - (isLoop ? 2 : 2); // reserve start + end

  if (coords.length <= maxIntermediateWaypoints) {
    // Few enough coords to use them all — but sample evenly
    const step = Math.max(1, Math.floor(coords.length / maxIntermediateWaypoints));
    for (let i = 0; i < coords.length; i += step) {
      waypoints.push(coords[i]);
    }
    // Ensure last coord is included
    if (waypoints[waypoints.length - 1] !== coords[coords.length - 1]) {
      waypoints.push(coords[coords.length - 1]);
    }
  } else {
    // Sample evenly
    const step = coords.length / maxIntermediateWaypoints;
    for (let i = 0; i < maxIntermediateWaypoints; i++) {
      const idx = Math.min(Math.floor(i * step), coords.length - 1);
      waypoints.push(coords[idx]);
    }
  }

  // Close the loop
  if (isLoop) {
    waypoints.push(startCoord);
  }

  return waypoints;
}

// ── Utility Functions ──

/** Find the nearest graph node to a coordinate */
export function findNearestNode(
  graph: CorridorGraph,
  coord: { lat: number; lng: number },
): GraphNode | null {
  let best: GraphNode | null = null;
  let bestDist = Infinity;

  for (const node of graph.nodes.values()) {
    const d = haversineDistance(coord.lat, coord.lng, node.coord[1], node.coord[0]);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  }

  return best;
}

/** Get the coordinate of the "other end" of a segment from a given node */
function otherEnd(seg: GraphSegment, fromNodeId: string, graph: CorridorGraph): [number, number] {
  const otherId = seg.from === fromNodeId ? seg.to : seg.from;
  return graph.nodes.get(otherId)?.coord ?? seg.coords[seg.coords.length - 1];
}

/** Get segment coordinates oriented away from a given node */
function getOrientedCoords(seg: GraphSegment, fromNodeId: string, graph: CorridorGraph): [number, number][] {
  const fromNode = graph.nodes.get(fromNodeId);
  if (!fromNode) return seg.coords;

  const startDist = haversineDistance(fromNode.coord[1], fromNode.coord[0], seg.coords[0][1], seg.coords[0][0]);
  const endDist = haversineDistance(fromNode.coord[1], fromNode.coord[0], seg.coords[seg.coords.length - 1][1], seg.coords[seg.coords.length - 1][0]);

  // If the segment's last coord is closer to fromNode, reverse it
  if (endDist < startDist) {
    return [...seg.coords].reverse();
  }

  return seg.coords;
}

/** Calculate bearing from one coordinate to another (degrees) */
function bearingTo(from: [number, number], to: [number, number]): number {
  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Pick items with diverse bearings (at least ~60 degrees apart) */
function pickDiverseByBearing<T extends { bearing: number }>(items: T[], count: number): T[] {
  if (items.length <= count) return items;

  const picks: T[] = [items[0]];
  for (const item of items.slice(1)) {
    if (picks.length >= count) break;
    const tooClose = picks.some(p => {
      const diff = Math.abs(item.bearing - p.bearing);
      return Math.min(diff, 360 - diff) < 60;
    });
    if (!tooClose) picks.push(item);
  }

  // Fill remaining slots if we didn't get enough
  for (const item of items) {
    if (picks.length >= count) break;
    if (!picks.includes(item)) picks.push(item);
  }

  return picks;
}
