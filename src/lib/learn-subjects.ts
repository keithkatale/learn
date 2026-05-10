import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Subject IDs for this class that have at least one published lesson (via Topic).
 */
export async function fetchSubjectIdsWithPublishedLessons(
  supabase: SupabaseClient,
  classId: string,
): Promise<{ subjectIds: Set<string>; error: string | null }> {
  const { data: subjects, error: sErr } = await supabase
    .from("Subject")
    .select("id")
    .eq("classId", classId);

  if (sErr) {
    return { subjectIds: new Set(), error: sErr.message };
  }

  const subjectIdsInClass = (subjects ?? []).map((s) => s.id);
  if (subjectIdsInClass.length === 0) {
    return { subjectIds: new Set(), error: null };
  }

  const { data: lessonRows, error: lErr } = await supabase
    .from("Lesson")
    .select("topicId")
    .eq("published", true);

  if (lErr) {
    return { subjectIds: new Set(), error: lErr.message };
  }

  const topicIdsWithLesson = new Set(
    (lessonRows ?? [])
      .map((r) => r.topicId)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  if (topicIdsWithLesson.size === 0) {
    return { subjectIds: new Set(), error: null };
  }

  const { data: topicRows, error: tErr } = await supabase
    .from("Topic")
    .select("id,subjectId")
    .in("subjectId", subjectIdsInClass);

  if (tErr) {
    return { subjectIds: new Set(), error: tErr.message };
  }

  const out = new Set<string>();
  for (const t of topicRows ?? []) {
    if (topicIdsWithLesson.has(t.id)) {
      out.add(t.subjectId);
    }
  }

  return { subjectIds: out, error: null };
}
