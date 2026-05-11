import type { SupabaseClient } from "@supabase/supabase-js";
import { describeSupabaseFetchFailure } from "@/lib/supabase-errors";

/** One published lesson with routing IDs for learner URLs. */
export type CatalogLessonRow = {
  lessonId: string;
  title: string;
  description: string | null;
  videoUrl: string;
  lessonSortOrder: number;
  topicId: string;
  topicName: string;
  topicSortOrder: number;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  href: string;
};

function lessonHref(
  classId: string,
  subjectId: string,
  lessonId: string,
): string {
  return `/learn/${classId}/${subjectId}/lesson/${lessonId}`;
}

/**
 * Published lessons with class/subject/topic placement (no Lesson→Topic embed).
 */
export async function fetchPublishedLessonCatalog(
  supabase: SupabaseClient,
): Promise<{ lessons: CatalogLessonRow[]; error: string | null }> {
  let lessonRows: unknown[] | null = null;
  try {
    const res = await supabase
      .from("Lesson")
      .select("id,title,description,videoUrl,sortOrder,topicId")
      .eq("published", true);

    if (res.error) {
      return {
        lessons: [],
        error: describeSupabaseFetchFailure(res.error.message),
      };
    }
    lessonRows = res.data as unknown[] | null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { lessons: [], error: describeSupabaseFetchFailure(msg) };
  }
  if (!lessonRows?.length) {
    return { lessons: [], error: null };
  }

  const typedLessons = lessonRows as { topicId?: string | null }[];
  const topicIds = [
    ...new Set(
      typedLessons
        .map((r) => r.topicId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  if (topicIds.length === 0) {
    return { lessons: [], error: null };
  }

  let topics: unknown[] | null = null;
  try {
    const res = await supabase
      .from("Topic")
      .select(
        `
      id,
      name,
      sortOrder,
      subject:Subject(
        id,
        name,
        class:Class(id, name)
      )
    `,
      )
      .in("id", topicIds);

    if (res.error) {
      return {
        lessons: [],
        error: describeSupabaseFetchFailure(res.error.message),
      };
    }
    topics = res.data as unknown[] | null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { lessons: [], error: describeSupabaseFetchFailure(msg) };
  }

  const placementMap = new Map<string, TopicPlacement>();
  for (const raw of topics ?? ([] as unknown[])) {
    const row = raw as { id?: string };
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) continue;
    const p = normalizeTopicPlacement(raw);
    if (p) placementMap.set(id, p);
  }

  const lessons: CatalogLessonRow[] = [];
  for (const row of typedLessons as {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string;
    sortOrder: number;
    topicId: string | null;
  }[]) {
    if (!row.topicId) continue;
    const p = placementMap.get(row.topicId);
    if (!p) continue;
    lessons.push({
      lessonId: row.id,
      title: row.title,
      description: row.description,
      videoUrl: row.videoUrl,
      lessonSortOrder: row.sortOrder,
      topicId: p.topicId,
      topicName: p.topicName,
      topicSortOrder: p.topicSortOrder,
      subjectId: p.subjectId,
      subjectName: p.subjectName,
      classId: p.classId,
      className: p.className,
      href: lessonHref(p.classId, p.subjectId, row.id),
    });
  }

  lessons.sort((a, b) => {
    const c = a.className.localeCompare(b.className);
    if (c !== 0) return c;
    const s = a.subjectName.localeCompare(b.subjectName);
    if (s !== 0) return s;
    if (a.topicSortOrder !== b.topicSortOrder)
      return a.topicSortOrder - b.topicSortOrder;
    if (a.topicName !== b.topicName)
      return a.topicName.localeCompare(b.topicName);
    if (a.lessonSortOrder !== b.lessonSortOrder)
      return a.lessonSortOrder - b.lessonSortOrder;
    return a.title.localeCompare(b.title);
  });

  return { lessons, error: null };
}

type TopicPlacement = {
  topicId: string;
  topicName: string;
  topicSortOrder: number;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
};

function normalizeTopicPlacement(raw: unknown): TopicPlacement | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const topicId = typeof t.id === "string" ? t.id : "";
  const topicName = typeof t.name === "string" ? t.name : "";
  const topicSortOrder =
    typeof t.sortOrder === "number" ? t.sortOrder : Number(t.sortOrder) || 0;
  if (!topicId) return null;

  let subjectRaw = t.subject;
  if (Array.isArray(subjectRaw)) subjectRaw = subjectRaw[0];
  if (!subjectRaw || typeof subjectRaw !== "object") return null;
  const s = subjectRaw as Record<string, unknown>;
  const subjectId = typeof s.id === "string" ? s.id : "";
  const subjectName = typeof s.name === "string" ? s.name : "";
  let classRaw = s.class;
  if (Array.isArray(classRaw)) classRaw = classRaw[0];
  if (!classRaw || typeof classRaw !== "object") return null;
  const c = classRaw as Record<string, unknown>;
  const classId = typeof c.id === "string" ? c.id : "";
  const className = typeof c.name === "string" ? c.name : "";
  if (!subjectId || !classId) return null;

  return {
    topicId,
    topicName,
    topicSortOrder,
    subjectId,
    subjectName,
    classId,
    className,
  };
}
