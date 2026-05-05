"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LessonPlayer } from "@/components/lesson-player";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  published: boolean;
};

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from("Lesson")
        .select("id,title,description,videoUrl,published")
        .eq("id", lessonId)
        .single();

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }
      setLesson(data as Lesson);
      setLoading(false);
    }
    void run();
  }, [lessonId, supabase]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (loading || !lesson) {
    return (
      <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
        Loading lesson video...
      </div>
    );
  }

  return (
    <article className="space-y-8">
      <div>
        <Link href="/learn" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">All lessons</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{lesson.title}</h1>
        {lesson.description ? <p className="mt-3 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{lesson.description}</p> : null}
      </div>
      <LessonPlayer embedUrl={lesson.videoUrl} title={lesson.title} />
    </article>
  );
}
