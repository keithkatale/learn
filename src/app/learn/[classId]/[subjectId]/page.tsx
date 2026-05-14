"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLearnerAccess } from "@/hooks/use-learner-access";
import {
  fetchPublishedLessonsBySubject,
  type TopicWithPublishedLessons,
} from "@/lib/learn-topic-lessons";
import {
  LearnBreadcrumbs,
  type BreadcrumbItem,
} from "@/components/learn-breadcrumbs";
import { LoadingBlock } from "@/components/loading-spinner";
import { LessonBrowseCard } from "@/components/lesson-browse-card";
import { fetchClassFreePreviewLessonId } from "@/lib/class-free-preview";

export default function LearnLessonsPage() {
  const params = useParams();
  const classId =
    typeof params.classId === "string"
      ? params.classId
      : params.classId?.[0] ?? "";
  const subjectId =
    typeof params.subjectId === "string"
      ? params.subjectId
      : params.subjectId?.[0] ?? "";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const {
    ready: authReady,
    userId,
    accessKind,
    canWatchLesson,
    grantCount,
    studioPreview,
    fullAccess,
  } = useLearnerAccess(supabase);

  const [topics, setTopics] = useState<TopicWithPublishedLessons[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [classPreviewLessonId, setClassPreviewLessonId] = useState<
    string | null
  >(null);
  const [previewResolved, setPreviewResolved] = useState(false);

  useEffect(() => {
    if (!subjectId || !classId) return;
    let cancelled = false;
    void (async () => {
      setTopicsLoading(true);
      setFetchError(null);
      setPreviewResolved(false);
      try {
        const [{ topics: rows, error }, { data: cls }, { data: sub }, preview] =
          await Promise.all([
            fetchPublishedLessonsBySubject(supabase, subjectId, classId),
            supabase.from("Class").select("name").eq("id", classId).maybeSingle(),
            supabase
              .from("Subject")
              .select("name")
              .eq("id", subjectId)
              .maybeSingle(),
            fetchClassFreePreviewLessonId(supabase, classId),
          ]);
        if (cancelled) return;
        setClassPreviewLessonId(preview.lessonId);
        if (error) {
          setFetchError(error);
          setTopics([]);
        } else {
          setTopics(rows);
        }
        setClassName(cls?.name ?? "");
        setSubjectName(sub?.name ?? "");
      } finally {
        setTopicsLoading(false);
        setPreviewResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, classId, supabase]);

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
    authReady &&
    !!userId &&
    !studioPreview &&
    !fullAccess &&
    totalPublished > 0;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
    {
      label: className || "Class",
      href: `/learn/${classId}`,
    },
    { label: subjectName || "Subject" },
  ];

  if (topicsLoading || !authReady || !previewResolved) {
    return (
      <div className="space-y-6">
        <LearnBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Learn", href: "/learn" },
            { label: "…", href: `/learn/${classId}` },
            { label: "Lessons" },
          ]}
        />
        <LoadingBlock label="Loading lessons" className="py-16" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <LearnBreadcrumbs items={breadcrumbItems} />

      <Link
        href={`/learn/${classId}`}
        className="inline-flex text-sm font-semibold text-lum-primary hover:underline"
      >
        ← Back to subjects
      </Link>
      <h1 className="font-display text-3xl font-bold text-lum-on-background">
        Lessons
      </h1>

      {fetchError ? (
        <p className="rounded-lg border border-lum-error/25 bg-lum-error-container/80 px-4 py-3 text-sm text-lum-error">
          {fetchError}
        </p>
      ) : null}

      {totalPublished === 0 ? (
        <div className="lum-card max-w-lg p-6">
          <p className="font-medium text-lum-on-background">
            No lessons created yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-lum-on-surface-variant">
            There are no published lessons for this subject yet. Your instructor
            can add them from Studio.
          </p>
        </div>
      ) : (
        <>
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
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-lum-secondary">
                  Chapter {topic.sortOrder} · {topic.name}
                </h2>
                <div className="grid gap-3">
                  {lessons.map((lesson) => {
                    const freePreview =
                      qualifiesForPublicSample &&
                      classPreviewLessonId !== null &&
                      lesson.id === classPreviewLessonId;
                    const open = authReady
                      ? canWatchLesson(lesson.id, freePreview)
                      : freePreview;
                    return (
                      <LessonBrowseCard
                        key={lesson.id}
                        href={`/learn/${classId}/${subjectId}/lesson/${lesson.id}`}
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
        </>
      )}
    </div>
  );
}
