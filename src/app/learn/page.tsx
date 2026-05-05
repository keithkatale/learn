"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  published: boolean;
  sortOrder: number;
};

export default function LearnPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        window.location.href = "/login?callbackUrl=/learn";
        return;
      }
      setUser(authData.user);

      const creatorEmail =
        (process.env.NEXT_PUBLIC_CREATOR_EMAIL ?? "").trim().toLowerCase();
      const isCreator = authData.user.email?.toLowerCase() === creatorEmail;

      const query = supabase
        .from("Lesson")
        .select("id,title,description,videoUrl,published,sortOrder")
        .order("sortOrder", { ascending: true });

      const { data, error: dbError } = isCreator
        ? await query
        : await query.eq("published", true);

      if (dbError) {
        setError(dbError.message);
      } else {
        setLessons((data as Lesson[]) ?? []);
      }
      setLoading(false);
    }

    void run();
  }, [supabase]);

  if (loading || !user) {
    return (
      <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
        Loading lessons...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Lessons
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Published lessons are available for learners.
        </p>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {lessons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No lessons yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link href={`/learn/${lesson.id}`} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm transition hover:border-indigo-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700">
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{lesson.title}</span>
                  {lesson.description ? <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{lesson.description}</p> : null}
                </div>
                <span className="shrink-0 text-sm text-indigo-600 dark:text-indigo-400">Watch</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
