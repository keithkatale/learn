import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Published lessons for a subject, grouped by topic — avoids PostgREST
 * Topic→Lesson embed issues (empty arrays / ambiguous FKs).
 */
export type TopicWithPublishedLessons = {
  id: string;
  name: string;
  sortOrder: number;
  lessons: {
    id: string;
    title: string;
    sortOrder: number;
    published: boolean;
  }[];
};

export async function fetchPublishedLessonsBySubject(
  supabase: SupabaseClient,
  subjectId: string,
): Promise<{ topics: TopicWithPublishedLessons[]; error: string | null }> {
  const { data: topicRows, error: tErr } = await supabase
    .from("Topic")
    .select("id,name,sortOrder")
    .eq("subjectId", subjectId)
    .order("sortOrder", { ascending: true })
    .order("name", { ascending: true });

  if (tErr) {
    return { topics: [], error: tErr.message };
  }
  if (!topicRows?.length) {
    return { topics: [], error: null };
  }

  const topicIds = topicRows.map((t) => t.id);

  const { data: lessonRows, error: lErr } = await supabase
    .from("Lesson")
    .select("id,title,sortOrder,published,topicId")
    .in("topicId", topicIds)
    .eq("published", true);

  if (lErr) {
    return { topics: [], error: lErr.message };
  }

  const lessonsByTopic = new Map<
    string,
    {
      id: string;
      title: string;
      sortOrder: number;
      published: boolean;
    }[]
  >();
  for (const tid of topicIds) {
    lessonsByTopic.set(tid, []);
  }
  for (const row of lessonRows ?? []) {
    if (!row.topicId) continue;
    const arr = lessonsByTopic.get(row.topicId);
    if (arr) {
      arr.push({
        id: row.id,
        title: row.title,
        sortOrder: row.sortOrder,
        published: row.published,
      });
    }
  }
  for (const arr of lessonsByTopic.values()) {
    arr.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const topics: TopicWithPublishedLessons[] = topicRows.map((t) => ({
    id: t.id,
    name: t.name,
    sortOrder: t.sortOrder,
    lessons: lessonsByTopic.get(t.id) ?? [],
  }));

  return { topics, error: null };
}

/** Labels for breadcrumbs from a topic (single FK path Topic→Subject→Class). */
export async function fetchBreadcrumbLabelsForTopic(
  supabase: SupabaseClient,
  topicId: string | null | undefined,
): Promise<{ className: string; subjectName: string } | null> {
  if (!topicId) return null;
  const { data, error } = await supabase
    .from("Topic")
    .select(
      `
      subject:Subject(
        name,
        class:Class(name)
      )
    `,
    )
    .eq("id", topicId)
    .maybeSingle();

  if (error || !data) return null;

  const t = data as Record<string, unknown>;
  let subjectRaw = t.subject;
  if (Array.isArray(subjectRaw)) subjectRaw = subjectRaw[0];
  if (!subjectRaw || typeof subjectRaw !== "object") return null;
  const s = subjectRaw as Record<string, unknown>;
  const subjectName = typeof s.name === "string" ? s.name : "";
  let classRaw = s.class;
  if (Array.isArray(classRaw)) classRaw = classRaw[0];
  if (!classRaw || typeof classRaw !== "object") return null;
  const c = classRaw as Record<string, unknown>;
  const className = typeof c.name === "string" ? c.name : "";
  if (!className && !subjectName) return null;
  return { className, subjectName };
}
