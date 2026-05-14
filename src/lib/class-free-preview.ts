import type { SupabaseClient } from "@supabase/supabase-js";
import { topicPublicPreviewLessonId } from "@/lib/free-lesson-preview";

type TopicRow = {
  id: string;
  name: string;
  sortOrder: number;
  subjectId: string;
  subject: { name: string } | { name: string }[] | null;
};

function subjectNameFromTopic(row: TopicRow): string {
  let s = row.subject as unknown;
  if (Array.isArray(s)) s = s[0];
  if (!s || typeof s !== "object") return "";
  const name = (s as { name?: string }).name;
  return typeof name === "string" ? name : "";
}

/**
 * One free lesson for the whole class: first published lesson in the
 * earliest chapter (topic), where chapters are ordered by subject name,
 * then topic sortOrder, then topic id.
 *
 * Only used for visitors with no catalog access (anonymous or signed-in
 * with no grants / full enrollment).
 */
export async function fetchClassFreePreviewLessonId(
  supabase: SupabaseClient,
  classId: string,
): Promise<{ lessonId: string | null; error: string | null }> {
  if (!classId) return { lessonId: null, error: null };

  const { data: topicRows, error: tErr } = await supabase
    .from("Topic")
    .select("id,name,sortOrder,subjectId,subject:Subject(name)")
    .eq("classId", classId);

  if (tErr) {
    return { lessonId: null, error: tErr.message };
  }

  const topics = (topicRows ?? []) as TopicRow[];
  if (topics.length === 0) {
    return { lessonId: null, error: null };
  }

  const topicIds = topics.map((t) => t.id).filter(Boolean);
  const { data: lessonRows, error: lErr } = await supabase
    .from("Lesson")
    .select("id,topicId,sortOrder")
    .eq("published", true)
    .in("topicId", topicIds);

  if (lErr) {
    return { lessonId: null, error: lErr.message };
  }

  const publishedByTopic = new Map<string, { id: string; sortOrder: number }[]>();
  for (const row of lessonRows ?? []) {
    const tid = row.topicId as string | undefined;
    if (!tid) continue;
    const arr = publishedByTopic.get(tid) ?? [];
    arr.push({
      id: row.id as string,
      sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    });
    publishedByTopic.set(tid, arr);
  }

  const withLessons = topics.filter((t) => (publishedByTopic.get(t.id)?.length ?? 0) > 0);
  if (withLessons.length === 0) {
    return { lessonId: null, error: null };
  }

  withLessons.sort((a, b) => {
    const sub = subjectNameFromTopic(a).localeCompare(subjectNameFromTopic(b));
    if (sub !== 0) return sub;
    const sid = a.subjectId.localeCompare(b.subjectId);
    if (sid !== 0) return sid;
    const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (so !== 0) return so;
    return a.id.localeCompare(b.id);
  });

  const firstTopic = withLessons[0];
  const lessons = publishedByTopic.get(firstTopic.id) ?? [];
  const lessonId = topicPublicPreviewLessonId(lessons);

  return { lessonId, error: null };
}
