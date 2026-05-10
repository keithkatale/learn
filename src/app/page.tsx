"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchPublishedLessonCatalog,
  type CatalogLessonRow,
} from "@/lib/public-catalog";
import { LessonCatalogCard } from "@/components/lesson-catalog-card";
import { LearnBreadcrumbs } from "@/components/learn-breadcrumbs";
import { useClientSignedIn } from "@/hooks/use-client-signed-in";

type CatalogSection = {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicSortOrder: number;
  topicName: string;
  lessons: CatalogLessonRow[];
};

function buildCatalogSections(
  lessons: CatalogLessonRow[],
): CatalogSection[] {
  const sections: CatalogSection[] = [];
  for (const row of lessons) {
    const last = sections[sections.length - 1];
    if (
      last &&
      last.classId === row.classId &&
      last.subjectId === row.subjectId &&
      last.topicId === row.topicId
    ) {
      last.lessons.push(row);
    } else {
      sections.push({
        classId: row.classId,
        className: row.className,
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        topicId: row.topicId,
        topicSortOrder: row.topicSortOrder,
        topicName: row.topicName,
        lessons: [row],
      });
    }
  }
  return sections;
}

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { signedIn, ready: authReady } = useClientSignedIn();
  const [lessons, setLessons] = useState<CatalogLessonRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sections = useMemo(
    () => buildCatalogSections(lessons),
    [lessons],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { lessons: rows, error: msg } =
        await fetchPublishedLessonCatalog(supabase);
      if (!cancelled) {
        setLessons(rows);
        setError(msg);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="studio-discovery flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-[1280px] px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-5 lg:px-12">
        <div className="rounded-2xl border border-lum-outline/15 bg-lum-surface-container-low/60 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative size-32 shrink-0 overflow-hidden rounded-full ring-2 ring-lum-outline/20 shadow-md sm:size-40 md:size-44">
              <Image
                src="/mrJovan.jpeg"
                alt="Teacher Jovan"
                fill
                className="object-cover object-[center_20%]"
                sizes="(max-width: 640px) 144px, (max-width: 1024px) 160px, 176px"
                priority
              />
            </div>
            <div className="w-full min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lum-primary">
                Learn with Jovan
              </p>
              <h1 className="font-display text-[clamp(1.125rem,2.4vw,1.75rem)] font-bold leading-snug tracking-tight text-lum-on-background">
                Physics and Math Lessons by Teacher Jovan for All Secondary
                Classes
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-lum-on-surface-variant sm:text-[0.9375rem]">
                Explore the catalog below — browse anytime; sign in with approved
                access to watch and download.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
                <Link
                  href="/learn"
                  className="lum-btn-secondary px-4 py-2 text-sm sm:px-5 sm:py-2.5"
                >
                  Browse by class
                </Link>
                {authReady && !signedIn ? (
                  <>
                    <Link
                      href="/login"
                      className="lum-btn-primary px-4 py-2 text-sm sm:px-5 sm:py-2.5"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-lg border border-lum-outline/35 px-4 py-2 text-sm font-semibold text-lum-on-background hover:bg-lum-surface-container-low sm:px-5 sm:py-2.5"
                    >
                      Register
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-lum-outline/15 bg-lum-surface-container-low/40 py-10 sm:py-12">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-12">
          <LearnBreadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Catalog" }]}
          />
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lum-secondary">
                Catalog
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold text-lum-on-background">
                All published lessons
              </h2>
              <p className="mt-1 max-w-xl text-sm text-lum-on-surface-variant">
                Same courses you&apos;ll open from Learn — listed here for quick
                discovery.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-lum-on-surface-variant">
              Loading lessons…
            </p>
          ) : error ? (
            <p className="rounded-lg border border-lum-error/25 bg-lum-error-container/80 px-4 py-3 text-sm text-lum-error">
              {error}
            </p>
          ) : lessons.length === 0 ? (
            <p className="text-sm text-lum-on-surface-variant">
              No published lessons yet. Creators can add them from Studio.
            </p>
          ) : (
            <div className="space-y-12">
              {sections.map((sec, i) => {
                const prev = sections[i - 1];
                const showClass = !prev || prev.classId !== sec.classId;
                const showSubject =
                  !prev || prev.subjectId !== sec.subjectId || showClass;

                return (
                  <div
                    key={`${sec.classId}-${sec.subjectId}-${sec.topicId}`}
                    className="space-y-4"
                  >
                    {showClass ? (
                      <h3 className="font-display border-b border-lum-outline/20 pb-2 text-xl font-bold text-lum-on-background">
                        {sec.className}
                      </h3>
                    ) : null}
                    {showSubject ? (
                      <p className="text-sm font-semibold text-lum-primary">
                        {sec.subjectName}
                      </p>
                    ) : null}
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-lum-on-surface-variant">
                      Chapter {sec.topicSortOrder} · {sec.topicName}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {sec.lessons.map((row) => (
                        <LessonCatalogCard key={row.lessonId} row={row} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
