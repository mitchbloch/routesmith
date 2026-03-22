import { createClient } from "./supabase/server";

export interface Corridor {
  id: string;
  userId: string | null;
  name: string;
  geometry: GeoJSON.LineString;
  corridorType: string;
  lengthMeters: number | null;
  surface: string | null;
  tags: string[];
  isFavorite: boolean;
  osmWayIds: number[];
  createdAt: string;
}

function rowToCorridor(row: Record<string, unknown>): Corridor {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    name: row.name as string,
    geometry: row.geometry as GeoJSON.LineString,
    corridorType: row.corridor_type as string,
    lengthMeters: row.length_meters ? Number(row.length_meters) : null,
    surface: row.surface as string | null,
    tags: row.tags as string[],
    isFavorite: row.is_favorite as boolean,
    osmWayIds: row.osm_way_ids as number[],
    createdAt: row.created_at as string,
  };
}

export async function listCorridors(): Promise<Corridor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("corridors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToCorridor);
}

export async function createCorridor(
  corridor: Omit<Corridor, "id" | "createdAt">,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("corridors")
    .insert({
      user_id: corridor.userId,
      name: corridor.name,
      geometry: corridor.geometry,
      corridor_type: corridor.corridorType,
      length_meters: corridor.lengthMeters,
      surface: corridor.surface,
      tags: corridor.tags,
      is_favorite: corridor.isFavorite,
      osm_way_ids: corridor.osmWayIds,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateCorridorFavorite(id: string, isFavorite: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("corridors")
    .update({ is_favorite: isFavorite })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCorridor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("corridors").delete().eq("id", id);
  if (error) throw error;
}
