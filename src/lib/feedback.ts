import { createClient } from "./supabase/server";
import type { UserPreferences } from "./types";

export interface RouteFeedback {
  id: string;
  userId: string;
  routeId: string | null;
  chosen: boolean;
  rating: number | null;
  feedbackText: string | null;
  preferencesSnapshot: UserPreferences | null;
  createdAt: string;
}

export async function recordFeedback(
  userId: string,
  routeId: string | null,
  chosen: boolean,
  preferences: UserPreferences | null,
  rating?: number,
  feedbackText?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("route_feedback").insert({
    user_id: userId,
    route_id: routeId,
    chosen,
    rating: rating ?? null,
    feedback_text: feedbackText ?? null,
    preferences_snapshot: preferences,
  });

  if (error) throw error;
}

export async function listFeedback(userId: string): Promise<RouteFeedback[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("route_feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    routeId: row.route_id,
    chosen: row.chosen,
    rating: row.rating,
    feedbackText: row.feedback_text,
    preferencesSnapshot: row.preferences_snapshot,
    createdAt: row.created_at,
  }));
}
