"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoadingBlock } from "@/components/loading-spinner";
import { LearnBreadcrumbs, type BreadcrumbItem } from "@/components/learn-breadcrumbs";
import { LessonBrowseCard } from "@/components/lesson-browse-card";
import { useClientSignedIn } from "@/hooks/use-client-signed-in";
import { useLearnerAccess } from "@/hooks/use-learner-access";
import { fetchSubjectIdsWithPublishedLessons } from "@/lib/learn-subjects";
import {
  fetchPublishedLessonsBySubject,
  type TopicWithPublishedLessons,
} from "@/lib/learn-topic-lessons";
import { fetchClassFreePreviewLessonId } from "@/lib/class-free-preview";

type ClassRow = { id: string; name: string };
type SubjectRow = { id: string; name: string };

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { signedIn, ready: authReady } = useClientSignedIn();
  const {
    ready: accessReady,
    userId,
    accessKind,
    canWatchLesson,
    grantCount,
    studioPreview,
    fullAccess,
  } = useLearnerAccess(supabase);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [topics, setTopics] = useState<TopicWithPublishedLessons[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [classPreviewLessonId, setClassPreviewLessonId] = useState<
    string | null
  >(null);
  const [previewResolved, setPreviewResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setClassesLoading(true);
      const { data } = await supabase
        .from("Class")
        .select("id,name")
        .order("name");
      if (!cancelled) {
        setClasses(data ?? []);
        setClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setClassName("");
      setSubjectsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setSubjectsLoading(true);
      const { data: cls } = await supabase
        .from("Class")
        .select("name")
        .eq("id", selectedClassId)
        .maybeSingle();
      if (!cancelled) setClassName(cls?.name ?? "");

      const { data: allSubjects, error: subErr } = await supabase
        .from("Subject")
        .select("id,name")
        .order("name");

      if (cancelled) return;

      if (subErr) {
        setSubjects([]);
        setSubjectsLoading(false);
        return;
      }

      const { subjectIds: withLessons, error: filterErr } =
        await fetchSubjectIdsWithPublishedLessons(supabase, selectedClassId);

      if (cancelled) return;

      if (filterErr) {
        setSubjects([]);
      } else {
        const filtered = (allSubjects ?? []).filter((s) =>
          withLessons.has(s.id),
        );
        setSubjects(filtered);
      }
      setSubjectsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, supabase]);

  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setTopics([]);
      setSubjectName("");
      setTopicsError(null);
      setTopicsLoading(false);
      setPreviewResolved(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setTopicsLoading(true);
      setTopicsError(null);
      setPreviewResolved(false);
      try {
        const [{ topics: rows, error }, { data: sub }, preview] =
          await Promise.all([
            fetchPublishedLessonsBySubject(
              supabase,
              selectedSubjectId,
              selectedClassId,
            ),
            supabase
              .from("Subject")
              .select("name")
              .eq("id", selectedSubjectId)
              .maybeSingle(),
            fetchClassFreePreviewLessonId(supabase, selectedClassId),
          ]);
        if (cancelled) return;
        setClassPreviewLessonId(preview.lessonId);
        if (error) {
          setTopicsError(error);
          setTopics([]);
        } else {
          setTopics(rows);
        }
        setSubjectName(sub?.name ?? "");
      } finally {
        if (!cancelled) {
          setTopicsLoading(false);
          setPreviewResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, selectedSubjectId, supabase]);

  const goToClasses = useCallback(() => {
    setSelectedClassId(null);
    setSelectedSubjectId(null);
  }, []);

  const goToSubjects = useCallback(() => {
    setSelectedSubjectId(null);
  }, []);

  const selectClass = useCallback((id: string) => {
    setSelectedClassId(id);
    setSelectedSubjectId(null);
  }, []);

  const selectSubject = useCallback((id: string) => {
    setSelectedSubjectId(id);
  }, []);

  const totalPublished = useMemo(() => {
    let n = 0;
    for (const topic of topics) {
      n += topic.lessons.length;
    }
    return n;
  }, [topics]);

  function browseLockReason(): string {
    if (!userId) {
      return "Without an account and instructor access, only the first lesson in the first chapter of this class is open. Sign in so your instructor can unlock more.";
    }
    if (accessKind === "partial") {
      return "Not on your paid list — open the lesson page to message your instructor.";
    }
    return "No access yet — your instructor can grant lessons or full catalog access.";
  }

  const showAccessBanner =
    accessReady &&
    !!userId &&
    !studioPreview &&
    !fullAccess &&
    totalPublished > 0 &&
    !!selectedSubjectId;

  let breadcrumbItems: BreadcrumbItem[];
  if (!selectedClassId) {
    breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Catalog" }];
  } else if (!selectedSubjectId) {
    breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: className || "Class" },
    ];
  } else {
    breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: className || "Class" },
      { label: subjectName || "Subject" },
    ];
  }

  const lessonsReady =
    accessReady && previewResolved && !topicsLoading && !!selectedSubjectId;

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
                Pick your class below, then a subject — browse anytime; sign in
                with approved access to watch and download.
              </p>
              <div className="mx-auto w-full max-w-xl rounded-xl border border-lum-secondary/30 bg-lum-secondary-container/20 px-4 py-3 text-left sm:mx-0 sm:max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lum-secondary">
                  Pricing
                </p>
                <p className="mt-1.5 font-display text-lg font-bold tracking-tight text-lum-on-background sm:text-xl">
                  UGX 15,000{" "}
                  <span className="text-base font-semibold text-lum-on-surface-variant sm:text-lg">
                    per lesson
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-lum-on-surface-variant sm:text-sm">
                  15,000 Ugandan Shillings (UGX 15k) for each lesson you unlock.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
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
          <LearnBreadcrumbs items={breadcrumbItems} />

          {!selectedClassId ? (
            <>
              <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lum-secondary">
                    Browse
                  </p>
                  <h2 className="font-display mt-1 text-2xl font-bold text-lum-on-background sm:text-3xl">
                    Select your class
                  </h2>
                  <p className="mt-1 max-w-lg text-sm text-lum-on-surface-variant">
                    Choose a cohort to see subjects and lessons — same flow as
                    Learn.
                  </p>
                </div>
                <Link
                  href="/learn"
                  className="text-sm font-semibold text-lum-primary hover:underline"
                >
                  Open Learn →
                </Link>
              </div>
              {classesLoading ? (
                <LoadingBlock label="Loading classes" className="py-12" />
              ) : classes.length === 0 ? (
                <p className="text-sm text-lum-on-surface-variant">
                  No classes yet — your instructor will add them in Studio.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClass(c.id)}
                      className="lum-card group w-full cursor-pointer p-6 text-left transition hover:border-lum-primary/25 hover:shadow-lum-card"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-lum-secondary">
                        Class
                      </p>
                      <h3 className="font-display mt-2 text-xl font-semibold text-lum-on-background">
                        {c.name}
                      </h3>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : !selectedSubjectId ? (
            <>
              <button
                type="button"
                onClick={goToClasses}
                className="mb-6 inline-flex text-sm font-semibold text-lum-primary hover:underline"
              >
                ← All classes
              </button>
              <div className="mb-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lum-secondary">
                  Subjects
                </p>
                <h2 className="font-display text-2xl font-bold text-lum-on-background sm:text-3xl">
                  Choose a subject
                </h2>
                <p className="max-w-lg text-sm text-lum-on-surface-variant">
                  Only subjects that already have at least one published lesson
                  are shown.
                </p>
              </div>
              {subjectsLoading ? (
                <LoadingBlock label="Loading subjects" className="py-12" />
              ) : subjects.length === 0 ? (
                <div className="lum-card max-w-lg p-6">
                  <p className="font-medium text-lum-on-background">
                    No lessons in this class yet
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-lum-on-surface-variant">
                    There are no published lessons for any subject in this
                    class. Check back later or pick another class.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSubject(s.id)}
                      className="lum-card group w-full cursor-pointer p-6 text-left transition hover:border-lum-primary/25 hover:shadow-lum-card"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-lum-secondary">
                        Subject
                      </p>
                      <h3 className="font-display mt-2 text-xl font-semibold text-lum-on-background">
                        {s.name}
                      </h3>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : !lessonsReady ? (
            <LoadingBlock label="Loading lessons" className="py-16" />
          ) : (
            <>
              <button
                type="button"
                onClick={goToSubjects}
                className="mb-6 inline-flex text-sm font-semibold text-lum-primary hover:underline"
              >
                ← Back to subjects
              </button>
              <h2 className="font-display text-2xl font-bold text-lum-on-background sm:text-3xl">
                Lessons
              </h2>

              {topicsError ? (
                <p className="mt-4 rounded-lg border border-lum-error/25 bg-lum-error-container/80 px-4 py-3 text-sm text-lum-error">
                  {topicsError}
                </p>
              ) : null}

              {totalPublished === 0 ? (
                <div className="lum-card mt-6 max-w-lg p-6">
                  <p className="font-medium text-lum-on-background">
                    No lessons created yet
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-lum-on-surface-variant">
                    There are no published lessons for this subject yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-8">
                  {showAccessBanner ? (
                    <div className="rounded-xl border border-lum-secondary/35 bg-lum-secondary-container/25 px-4 py-3 text-sm text-lum-on-secondary-container">
                      <span className="font-semibold text-lum-on-background">
                        {accessKind === "partial"
                          ? `You have ${grantCount} lesson${grantCount === 1 ? "" : "s"} unlocked`
                          : "Limited access"}
                      </span>
                      <span className="text-lum-on-surface-variant">
                        {" "}
                        —{" "}
                        {accessKind === "partial"
                          ? "Only lessons marked Open below match your plan. Others stay locked until your instructor adds them."
                          : "Without full access, only the first lesson in the first chapter of this class is open. Ask your instructor to unlock the rest."}
                      </span>
                    </div>
                  ) : null}

                  {topics.map((topic) => {
                    const lessons = topic.lessons;
                    if (lessons.length === 0) return null;
                    const qualifiesForPublicSample =
                      accessKind === "anon" || accessKind === "none";
                    return (
                      <div key={topic.id} className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-lum-secondary">
                          Chapter {topic.sortOrder} · {topic.name}
                        </h3>
                        <div className="grid gap-3">
                          {lessons.map((lesson) => {
                            const freePreview =
                              qualifiesForPublicSample &&
                              classPreviewLessonId !== null &&
                              lesson.id === classPreviewLessonId;
                            const open = accessReady
                              ? canWatchLesson(lesson.id, freePreview)
                              : freePreview;
                            return (
                              <LessonBrowseCard
                                key={lesson.id}
                                href={`/learn/${selectedClassId}/${selectedSubjectId}/lesson/${lesson.id}`}
                                sortOrder={lesson.sortOrder}
                                title={lesson.title}
                                locked={!open}
                                lockReason={browseLockReason()}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
