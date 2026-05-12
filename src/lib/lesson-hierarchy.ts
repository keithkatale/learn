import type { SupabaseClient } from "@supabase/supabase-js";

/** Hierarchy chips for studio UI */
export type LessonTopicHierarchy = {
  name: string;
  subject: {
    name: string;
    class: { name: string };
  };
};

export type LessonWithHierarchy = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  published: boolean;
  sortOrder: number;
  attachments?: unknown;
  topic: LessonTopicHierarchy | null;
};

/**
 * Loads lessons without embedding Lesson→Topic in one query (PostgREST reports
 * “more than one relationship” when FK + inverse relation both exist).
 */
export async function fetchStudioLessonsWithHierarchy(
  supabase: SupabaseClient,
): Promise<{ lessons: LessonWithHierarchy[]; error: string | null }> {
  const { data: lessons, error: lErr } = await supabase
    .from("Lesson")
    .select(
      "id,title,description,videoUrl,published,sortOrder,attachments,topicId",
    )
    .order("id", { ascending: false });

  if (lErr) {
    return { lessons: [], error: lErr.message };
  }
  if (!lessons?.length) {
    return { lessons: [], error: null };
  }

  const topicIds = [
    ...new Set(
      lessons.map((row: { topicId?: string }) => row.topicId).filter(Boolean),
    ),
  ] as string[];

  if (topicIds.length === 0) {
    return {
      lessons: lessons.map((row: Record<string, unknown>) => ({
        ...stripTopicId(row),
        topic: null,
      })) as LessonWithHierarchy[],
      error: null,
    };
  }

  const { data: topics, error: tErr } = await supabase
    .from("Topic")
    .select(
      `
      id,
      name,
      class:Class(name),
      subject:Subject(
        name
      )
    `,
    )
    .in("id", topicIds);

  if (tErr) {
    return {
      lessons: lessons.map((row: Record<string, unknown>) => ({
        ...stripTopicId(row),
        topic: null,
      })) as LessonWithHierarchy[],
      error: tErr.message,
    };
  }

  const topicMap = new Map<string, LessonTopicHierarchy>();
  for (const raw of topics ?? []) {
    const row = raw as { id?: string };
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) continue;
    const normalized = normalizeTopicHierarchy(raw);
    if (normalized) topicMap.set(id, normalized);
  }

  const merged = lessons.map((row: LessonFlatRow) => {
    const tid = row.topicId;
    const t = tid ? topicMap.get(tid) : undefined;
    const { topicId: _, ...rest } = row;
    return {
      ...rest,
      topic: t ?? null,
    } as LessonWithHierarchy;
  });

  return { lessons: merged, error: null };
}

type LessonFlatRow = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  published: boolean;
  sortOrder: number;
  attachments?: unknown;
  topicId: string | null;
};

function stripTopicId(row: Record<string, unknown>) {
  const { topicId: _, ...rest } = row;
  return rest;
}

/**
 * Single lesson for edit page — two-step fetch avoids Lesson↔Topic embed ambiguity.
 */
export async function fetchLessonForStudioEdit(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<{ lesson: LessonWithHierarchy | null; error: string | null }> {
  const { data: row, error: lErr } = await supabase
    .from("Lesson")
    .select(
      "id,title,description,videoUrl,published,sortOrder,attachments,topicId",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (lErr) {
    return { lesson: null, error: lErr.message };
  }
  if (!row) {
    return { lesson: null, error: "Lesson not found." };
  }

  const lessonRow = row as LessonFlatRow;
  if (!lessonRow.topicId) {
    const { topicId: _, ...rest } = lessonRow;
    return {
      lesson: { ...rest, topic: null },
      error: null,
    };
  }

  const { data: topic, error: tErr } = await supabase
    .from("Topic")
    .select(
      `
      name,
      class:Class(name),
      subject:Subject(
        name
      )
    `,
    )
    .eq("id", lessonRow.topicId)
    .maybeSingle();

  const { topicId: _, ...rest } = lessonRow;

  if (tErr) {
    return {
      lesson: { ...rest, topic: null },
      error: null,
    };
  }

  return {
    lesson: {
      ...rest,
      topic: normalizeTopicHierarchy(topic),
    },
    error: null,
  };
}

/** PostgREST may return nested embeds as objects or single-element arrays. */
function normalizeTopicHierarchy(raw: unknown): LessonTopicHierarchy | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const name = typeof t.name === "string" ? t.name : "";
  let subjectRaw = t.subject;
  if (Array.isArray(subjectRaw)) subjectRaw = subjectRaw[0];
  if (!subjectRaw || typeof subjectRaw !== "object") return null;
  const s = subjectRaw as Record<string, unknown>;
  const subjectName = typeof s.name === "string" ? s.name : "";
  let classRaw = t.class;
  if (Array.isArray(classRaw)) classRaw = classRaw[0];
  if (!classRaw || typeof classRaw !== "object") return null;
  const c = classRaw as Record<string, unknown>;
  const className = typeof c.name === "string" ? c.name : "";
  return {
    name,
    subject: {
      name: subjectName,
      class: { name: className },
    },
  };
}
