"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchStudioLessonsWithHierarchy,
  type LessonWithHierarchy,
} from "@/lib/lesson-hierarchy";
import Link from "next/link";

export default function StudioLessonsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [lessons, setLessons] = useState<LessonWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const { lessons: rows, error } =
      await fetchStudioLessonsWithHierarchy(supabase);

    setLessons(rows);
    setFetchError(error);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Supabase client-side initial fetch
    void loadLessons();
  }, [loadLessons]);

  async function removeLesson(id: string) {
    if (!confirm("Are you sure?")) return;
    await supabase.from("Lesson").delete().eq("id", id);
    await loadLessons();
  }

  return (
    <div className="space-y-8 text-lum-on-background">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-lum-on-background">
          Lessons
        </h1>
        <p className="text-base text-lum-on-surface-variant">
          Manage your hierarchical curriculum.
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-lum-outline/25 bg-lum-surface-container-low px-4 py-3 text-sm text-lum-on-surface-variant shadow-sm">
          <span className="font-semibold text-lum-on-background">Note: </span>
          {fetchError}
        </div>
      ) : null}

      {loading ? (
        <div className="py-20 text-center text-lum-on-surface-variant">
          Loading curriculum…
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-lum-outline/30 bg-lum-surface-container-low/60 py-20 text-center">
          <p className="text-lum-on-surface-variant">No lessons created yet.</p>
          <Link
            href="/studio/lessons/new"
            className="mt-3 inline-block font-semibold text-lum-primary hover:underline"
          >
            Create your first lesson
          </Link>
        </div>
      ) : (
        <div className="lum-card overflow-hidden rounded-2xl border border-lum-outline/20 bg-lum-surface-container-lowest shadow-lum-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-lum-outline/20 bg-lum-surface-container-low">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
                    Title
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
                    Hierarchy
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="border-b border-lum-outline/15 transition-colors last:border-0 hover:bg-lum-surface-container-low/80"
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-lum-on-background">
                          {lesson.title}
                        </p>
                        <span
                          className={
                            lesson.published
                              ? "rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900"
                              : "rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950"
                          }
                        >
                          {lesson.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-lum-on-surface-variant">
                        {lesson.description || "No description"}
                      </p>
                      {!lesson.published ? (
                        <p className="mt-2 text-[11px] text-lum-on-surface-variant">
                          Not visible on Learn until you publish (Edit → check
                          &quot;Published&quot;).
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top">
                      {lesson.topic ? (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-lum-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-lum-primary">
                            {lesson.topic.subject.class.name}
                          </span>
                          <span className="rounded-md bg-lum-secondary/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-lum-secondary">
                            {lesson.topic.subject.name}
                          </span>
                          <span className="rounded-md bg-lum-tertiary/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-lum-tertiary">
                            {lesson.topic.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-lum-on-surface-variant/70">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <Link
                        href={`/studio/lessons/${lesson.id}/edit`}
                        className="font-semibold text-lum-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="mx-2 text-lum-outline-variant">|</span>
                      <button
                        type="button"
                        onClick={() => removeLesson(lesson.id)}
                        className="font-semibold text-lum-error hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
