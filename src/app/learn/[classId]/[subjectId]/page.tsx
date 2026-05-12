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
import { topicPublicPreviewLessonId } from "@/lib/free-lesson-preview";

function LessonBrowseCard({
  href,
  sortOrder,
  title,
  locked,
  lockReason,
}: {
  href: string;
  sortOrder: number;
  title: string;
  locked: boolean;
  lockReason: string;
}) {
  return (
    <Link
      href={href}
      className="lum-card relative block overflow-hidden p-4 transition hover:border-lum-primary/25 hover:shadow-lum-card"
    >
      <div
        className={`flex items-center justify-between gap-4 ${
          locked ? "blur-[5px] opacity-65" : ""
        }`}
      >
        <div className="min-w-0">
          <span className="mr-3 font-mono text-sm text-lum-on-surface-variant">
            #{sortOrder}
          </span>
          <span className="font-medium text-lum-on-background">{title}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold text-lum-secondary">
          {locked ? "Locked" : "Open"}
        </span>
      </div>
      {locked ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-lum-background/88 px-4 py-3 text-center backdrop-blur-[2px]">
          <span className="text-sm font-semibold text-lum-on-background">
            Access required
          </span>
          <span className="max-w-xs text-xs leading-snug text-lum-on-surface-variant">
            {lockReason}
          </span>
        </div>
      ) : null}
    </Link>
  );
}

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

  useEffect(() => {
    if (!subjectId || !classId) return;
    let cancelled = false;
    void (async () => {
      setTopicsLoading(true);
      setFetchError(null);
      const [{ topics: rows, error }, { data: cls }, { data: sub }] =
        await Promise.all([
          fetchPublishedLessonsBySubject(supabase, subjectId, classId),
          supabase.from("Class").select("name").eq("id", classId).maybeSingle(),
          supabase
            .from("Subject")
            .select("name")
            .eq("id", subjectId)
            .maybeSingle(),
        ]);
      if (cancelled) return;
      if (error) {
        setFetchError(error);
        setTopics([]);
      } else {
        setTopics(rows);
      }
      setClassName(cls?.name ?? "");
      setSubjectName(sub?.name ?? "");
      setTopicsLoading(false);
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
      return "Sign in so your instructor can tie access to your phone number.";
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

  if (topicsLoading || !authReady) {
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
        <div className="py-16 text-center text-sm text-lum-on-surface-variant">
          Loading lessons…
        </div>
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
                  : "Each chapter lists one sample lesson as Open (lowest lesson number in that chapter). Other lessons stay locked until your instructor grants access."}
              </span>
            </div>
          ) : null}

          {topics.map((topic) => {
            const lessons = topic.lessons;
            if (lessons.length === 0) return null;
            const previewLessonId = topicPublicPreviewLessonId(
              lessons.map((l) => ({ id: l.id, sortOrder: l.sortOrder })),
            );
            return (
              <div key={topic.id} className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-lum-secondary">
                  Chapter {topic.sortOrder} · {topic.name}
                </h2>
                <div className="grid gap-3">
                  {lessons.map((lesson) => {
                    const freePreview =
                      previewLessonId !== null &&
                      lesson.id === previewLessonId;
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
