import { createClient } from "./supabase/server";
import type { SavedRoute, RouteScore } from "./types";

/** Convert Supabase row (snake_case) to SavedRoute (camelCase) */
function rowToRoute(row: Record<string, unknown>): SavedRoute {
  return {
    id: row.id as string,
    name: row.name as string,
    customName: row.custom_name as string | undefined,
    geometry: row.geometry as GeoJSON.LineString,
    distance: Number(row.distance),
    duration: Number(row.duration ?? 0),
    elevationGain: Number(row.elevation_gain ?? 0),
    elevationLoss: Number(row.elevation_loss ?? 0),
    score: row.score as RouteScore,
    tags: row.tags as string[],
    waypoints: row.waypoints as [number, number][],
    color: row.color as string,
    activityType: row.activity_type as SavedRoute["activityType"],
    startAddress: row.start_address as string | undefined,
    rating: row.rating as number | undefined,
    savedAt: row.saved_at as string,
  };
}

/** Convert SavedRoute (camelCase) to Supabase row (snake_case) */
function routeToRow(route: SavedRoute, userId: string) {
  return {
    id: route.id,
    user_id: userId,
    name: route.name,
    custom_name: route.customName ?? null,
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    elevation_gain: route.elevationGain,
    elevation_loss: route.elevationLoss,
    score: route.score,
    tags: route.tags,
    waypoints: route.waypoints,
    color: route.color,
    activity_type: route.activityType,
    start_address: route.startAddress ?? null,
    rating: route.rating ?? null,
    saved_at: route.savedAt,
  };
}

export async function listRoutes(): Promise<SavedRoute[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_routes")
    .select("*")
    .order("saved_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToRoute);
}

export async function getRoute(id: string): Promise<SavedRoute | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_routes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return rowToRoute(data);
}

export async function createRoute(route: SavedRoute, userId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_routes")
    .insert(routeToRow(route, userId))
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateRoute(
  id: string,
  updates: Partial<Pick<SavedRoute, "customName" | "rating">>,
): Promise<void> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {};
  if (updates.customName !== undefined) row.custom_name = updates.customName;
  if (updates.rating !== undefined) row.rating = updates.rating;

  const { error } = await supabase
    .from("saved_routes")
    .update(row)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteRoute(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_routes").delete().eq("id", id);
  if (error) throw error;
}

export async function createRoutesBatch(routes: SavedRoute[], userId: string): Promise<void> {
  const supabase = await createClient();
  const rows = routes.map((r) => routeToRow(r, userId));
  const { error } = await supabase.from("saved_routes").insert(rows);
  if (error) throw error;
}
