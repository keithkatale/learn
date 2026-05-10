/**
 * One free “chapter intro” lesson per topic for anonymous + unpaid learners.
 * Picks the published lesson with the smallest sortOrder in that topic (ties → stable id).
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
