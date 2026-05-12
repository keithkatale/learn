import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Subject IDs for this class that have at least one published lesson (via Topic).
 */
export async function fetchSubjectIdsWithPublishedLessons(
  supabase: SupabaseClient,
  classId: string,
): Promise<{ subjectIds: Set<string>; error: string | null }> {
  const { data: topics, error: tErr } = await supabase
    .from("Topic")
    .select("id,subjectId")
    .eq("classId", classId);

  if (tErr) {
    return { subjectIds: new Set(), error: tErr.message };
  }

  if (!topics?.length) {
    return { subjectIds: new Set(), error: null };
  }

  const topicToSubject = new Map<string, string>();
  for (const t of topics) {
    if (t.id && t.subjectId) topicToSubject.set(t.id, t.subjectId);
  }
  const topicIdsInClass = [...topicToSubject.keys()];
  if (topicIdsInClass.length === 0) return { subjectIds: new Set(), error: null };

  const { data: lessonRows, error: lErr } = await supabase
    .from("Lesson")
    .select("topicId")
    .eq("published", true)
    .in("topicId", topicIdsInClass);

  if (lErr) {
    return { subjectIds: new Set(), error: lErr.message };
  }

  const out = new Set<string>();
  for (const r of lessonRows ?? []) {
    const tid = r.topicId;
    if (!tid) continue;
    const sid = topicToSubject.get(tid);
    if (sid) out.add(sid);
  }

  return { subjectIds: out, error: null };
}
