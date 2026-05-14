"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { LessonPlayer } from "@/components/lesson-player";
import { LessonAttachmentLinks } from "@/components/lesson-attachment-links";
import { LessonLockedPanel } from "@/components/lesson-locked-panel";
import Link from "next/link";
import { useLearnerAccess } from "@/hooks/use-learner-access";
import { fetchBreadcrumbLabelsForTopic } from "@/lib/learn-topic-lessons";
import { fetchClassFreePreviewLessonId } from "@/lib/class-free-preview";
import { LoadingBlock } from "@/components/loading-spinner";
import {
  LearnBreadcrumbs,
  type BreadcrumbItem,
} from "@/components/learn-breadcrumbs";

function lessonBreadcrumbItems(
  classId: string,
  subjectId: string,
  crumbLabels: { className: string; subjectName: string } | null,
  lessonTitle: string,
): BreadcrumbItem[] {
  return [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
    {
      label: crumbLabels?.className || "Class",
      href: `/learn/${classId}`,
    },
    {
      label: crumbLabels?.subjectName || "Subject",
      href: `/learn/${classId}/${subjectId}`,
    },
    { label: lessonTitle },
  ];
}

export default function LessonDetailPage() {
  const params = useParams();
  const classId =
    typeof params.classId === "string"
      ? params.classId
      : params.classId?.[0] ?? "";
  const subjectId =
    typeof params.subjectId === "string"
      ? params.subjectId
      : params.subjectId?.[0] ?? "";
  const lessonId =
    typeof params.lessonId === "string"
      ? params.lessonId
      : params.lessonId?.[0] ?? "";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const {
    ready: authReady,
    userId,
    userPhone,
    fullAccess,
    grantCount,
    grantedLessonIds,
    canWatchLesson,
    accessKind,
  } = useLearnerAccess(supabase);

  const [lesson, setLesson] = useState<{
    title: string;
    description: string | null;
    videoUrl: string;
    attachments?: unknown;
    published: boolean;
    topicId: string | null;
    sortOrder: number;
  } | null>(null);

  const [lessonLoading, setLessonLoading] = useState(true);
  const [crumbLabels, setCrumbLabels] = useState<{
    className: string;
    subjectName: string;
  } | null>(null);
  const [classPreviewLessonId, setClassPreviewLessonId] = useState<
    string | null
  >(null);
  const [previewResolved, setPreviewResolved] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : "");
  }, []);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    void (async () => {
      setLessonLoading(true);
      setCrumbLabels(null);
      const { data } = await supabase
        .from("Lesson")
        .select(
          "title,description,videoUrl,attachments,published,topicId,sortOrder",
        )
        .eq("id", lessonId)
        .maybeSingle();
      if (cancelled) return;
      setLesson(
        data
          ? {
              ...data,
              topicId: data.topicId ?? null,
              sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
            }
          : null,
      );
      if (data?.topicId) {
        const labels = await fetchBreadcrumbLabelsForTopic(
          supabase,
          data.topicId,
        );
        if (!cancelled) setCrumbLabels(labels);
      } else if (!cancelled) {
        setCrumbLabels(null);
      }
      setLessonLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, supabase]);

  useEffect(() => {
    if (!classId) {
      setClassPreviewLessonId(null);
      setPreviewResolved(true);
      return;
    }
    let cancelled = false;
    setPreviewResolved(false);
    void (async () => {
      setPreviewResolved(false);
      try {
        const { lessonId: previewLesson } = await fetchClassFreePreviewLessonId(
          supabase,
          classId,
        );
        if (!cancelled) {
          setClassPreviewLessonId(previewLesson);
        }
      } finally {
        setPreviewResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, supabase]);

  const qualifiesForPublicSample =
    accessKind === "anon" || accessKind === "none";

  const freePreview = Boolean(
    lesson?.published &&
      previewResolved &&
      qualifiesForPublicSample &&
      classPreviewLessonId !== null &&
      lessonId === classPreviewLessonId,
  );

  const hasLessonGrant =
    !!lessonId && grantedLessonIds.includes(lessonId);

  const canWatch =
    !!lesson?.published &&
    canWatchLesson(lessonId, freePreview);

  if (lessonLoading || !authReady || !previewResolved) {
    const loadingCrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      { label: "Learn", href: "/learn" },
    ];
    if (classId) {
      loadingCrumbs.push({ label: "…", href: `/learn/${classId}` });
    }
    if (classId && subjectId) {
      loadingCrumbs.push({
        label: "…",
        href: `/learn/${classId}/${subjectId}`,
      });
    }
    loadingCrumbs.push({ label: "Lesson" });
    return (
      <div className="space-y-6">
        <LearnBreadcrumbs items={loadingCrumbs} />
        <LoadingBlock label="Loading lesson" className="py-16" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-6 py-10">
        <LearnBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Learn", href: "/learn" },
            { label: "Lesson not found" },
          ]}
        />
        <p className="text-lum-error">Lesson not found.</p>
        <Link
          href="/learn"
          className="text-sm font-semibold text-lum-primary hover:underline"
        >
          ← Back to Learn
        </Link>
      </div>
    );
  }

  if (!lesson.published) {
    return (
      <div className="space-y-6 py-10">
        <LearnBreadcrumbs
          items={lessonBreadcrumbItems(
            classId,
            subjectId,
            crumbLabels,
            lesson.title,
          )}
        />
        <p className="text-lum-on-surface-variant">
          This lesson isn&apos;t published yet.
        </p>
        <Link
          href={`/learn/${classId}/${subjectId}`}
          className="text-sm font-semibold text-lum-primary hover:underline"
        >
          ← Back to topic
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <LearnBreadcrumbs
        items={lessonBreadcrumbItems(
          classId,
          subjectId,
          crumbLabels,
          lesson.title,
        )}
      />
      <Link
        href={`/learn/${classId}/${subjectId}`}
        className="inline-flex text-sm font-semibold text-lum-primary hover:underline"
      >
        ← Back to topic
      </Link>
      <h1 className="font-display text-3xl font-bold text-lum-on-background">
        {lesson.title}
      </h1>

      {canWatch ? (
        <LessonPlayer embedUrl={lesson.videoUrl} title={lesson.title} />
      ) : (
        <LessonLockedPanel
          signedIn={!!userId}
          fullAccess={fullAccess}
          hasLessonGrant={hasLessonGrant}
          grantCount={grantCount}
          lessonTitle={lesson.title}
          lessonUrl={shareUrl || `Lesson: ${lesson.title}`}
          userPhone={userPhone}
        />
      )}

      <LessonAttachmentLinks
        rawAttachments={lesson.attachments}
        enabled={canWatch}
      />

      <div className="lum-card p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-lum-on-surface-variant">
          Description
        </h3>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-lum-on-surface-variant">
          {lesson.description ?? "No description for this lesson."}
        </p>
      </div>
    </div>
  );
}
