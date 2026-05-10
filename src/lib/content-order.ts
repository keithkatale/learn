import type { SupabaseClient } from "@supabase/supabase-js";

/** Next lesson index for this topic (1-based sequence by creation). */
export async function nextLessonSortOrder(
  supabase: SupabaseClient,
  topicId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("Lesson")
    .select("sortOrder")
    .eq("topicId", topicId);

  if (error) throw error;
  const max = Math.max(0, ...(data ?? []).map((r) => Number(r.sortOrder) || 0));
  return max + 1;
}

/** Next chapter/topic index for this subject (1-based sequence by creation). */
export async function nextTopicSortOrder(
  supabase: SupabaseClient,
  subjectId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("Topic")
    .select("sortOrder")
    .eq("subjectId", subjectId);

  if (error) throw error;
  const max = Math.max(0, ...(data ?? []).map((r) => Number(r.sortOrder) || 0));
  return max + 1;
}
