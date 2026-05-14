/**
 * Pick the published lesson with the smallest sortOrder in a topic (ties → stable id).
 * Used when resolving the single class-wide preview chapter’s first lesson.
 */

export function topicPublicPreviewLessonId(
  publishedLessonsInTopic: { id: string; sortOrder: number }[],
): string | null {
  if (!publishedLessonsInTopic.length) return null;
  const sorted = [...publishedLessonsInTopic].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  return sorted[0]?.id ?? null;
}

export function isLessonTopicPublicPreview(
  publishedLessonsInTopic: { id: string; sortOrder: number }[],
  lessonId: string,
): boolean {
  const pid = topicPublicPreviewLessonId(publishedLessonsInTopic);
  return pid !== null && pid === lessonId;
}
