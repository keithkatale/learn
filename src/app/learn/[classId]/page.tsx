"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchSubjectIdsWithPublishedLessons } from "@/lib/learn-subjects";
import { LoadingBlock } from "@/components/loading-spinner";
import {
  LearnBreadcrumbs,
  type BreadcrumbItem,
} from "@/components/learn-breadcrumbs";

type SubjectRow = { id: string; name: string };

export default function LearnSubjectsPage() {
  const params = useParams();
  const classId =
    typeof params.classId === "string"
      ? params.classId
      : params.classId?.[0] ?? "";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data: cls } = await supabase
        .from("Class")
        .select("name")
        .eq("id", classId)
        .maybeSingle();
      if (!cancelled) setClassName(cls?.name ?? "");

      const { data: allSubjects, error: subErr } = await supabase
        .from("Subject")
        .select("id,name")
        .order("name");

      if (cancelled) return;

      if (subErr) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      const { subjectIds: withLessons, error: filterErr } =
        await fetchSubjectIdsWithPublishedLessons(supabase, classId);

      if (cancelled) return;

      if (filterErr) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      const filtered = (allSubjects ?? []).filter((s) => withLessons.has(s.id));
      setSubjects(filtered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, supabase]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
    { label: className || "Class" },
  ];

  return (
    <div className="space-y-10">
      <LearnBreadcrumbs items={breadcrumbItems} />
      <Link
        href="/learn"
        className="inline-flex text-sm font-semibold text-lum-primary hover:underline"
      >
        ← Back to classes
      </Link>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lum-secondary">
          Subjects
        </p>
        <h1 className="font-display text-3xl font-bold text-lum-on-background">
          Choose a subject
        </h1>
        <p className="max-w-lg text-sm text-lum-on-surface-variant">
          Only subjects that already have at least one published lesson are
          shown.
        </p>
      </div>

      {loading ? (
        <LoadingBlock label="Loading subjects" className="py-8" />
      ) : subjects.length === 0 ? (
        <div className="lum-card max-w-lg p-6">
          <p className="font-medium text-lum-on-background">
            No lessons in this class yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-lum-on-surface-variant">
            There are no published lessons for any subject in this class. Check
            back later or browse another class.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={`/learn/${classId}/${s.id}`}
              className="lum-card group p-6 transition hover:border-lum-primary/25 hover:shadow-lum-card"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-lum-secondary">
                Subject
              </p>
              <h2 className="font-display mt-2 text-xl font-semibold text-lum-on-background">
                {s.name}
              </h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
