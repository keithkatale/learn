"use client";

import Link from "next/link";
import type { ReactElement, SVGProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLayers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconGraduation(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

type StatCard = {
  title: string;
  count: number;
  href: string;
  description: string;
  icon: ReactElement;
  accent:
    | "indigo"
    | "emerald"
    | "amber"
    | "rose";
};

const accentStyles = {
  indigo: {
    ring: "ring-lum-primary/18",
    iconWrap: "bg-lum-primary/12 text-lum-primary",
    hover: "hover:border-lum-primary/40",
  },
  emerald: {
    ring: "ring-lum-secondary/22",
    iconWrap: "bg-lum-secondary/12 text-lum-secondary",
    hover: "hover:border-lum-secondary/40",
  },
  amber: {
    ring: "ring-lum-tertiary/22",
    iconWrap: "bg-lum-tertiary/12 text-lum-tertiary",
    hover: "hover:border-lum-tertiary/35",
  },
  rose: {
    ring: "ring-lum-error/18",
    iconWrap: "bg-lum-error/10 text-lum-error",
    hover: "hover:border-lum-error/30",
  },
} as const;

export default function StudioHomePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [stats, setStats] = useState({
    lessons: 0,
    classes: 0,
    subjects: 0,
    /** Distinct users with Enrollment and/or any LearningAccessGrant */
    learnersWithAccess: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [l, c, s, learnerRes] = await Promise.all([
        supabase.from("Lesson").select("*", { count: "exact", head: true }),
        supabase.from("Class").select("*", { count: "exact", head: true }),
        supabase.from("Subject").select("*", { count: "exact", head: true }),
        fetch("/api/studio/dashboard-stats", { credentials: "include" }),
      ]);
      let learnersWithAccess = 0;
      if (learnerRes.ok) {
        const body = (await learnerRes.json()) as {
          learnersWithAccess?: number;
        };
        learnersWithAccess =
          typeof body.learnersWithAccess === "number"
            ? body.learnersWithAccess
            : 0;
      }
      if (!cancelled) {
        setStats({
          lessons: l.count ?? 0,
          classes: c.count ?? 0,
          subjects: s.count ?? 0,
          learnersWithAccess,
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const cards: StatCard[] = [
    {
      title: "Lessons",
      count: stats.lessons,
      href: "/studio/lessons",
      description: "Videos and lesson content",
      icon: <IconBook className="h-5 w-5" />,
      accent: "indigo",
    },
    {
      title: "Classes",
      count: stats.classes,
      href: "/studio/classes",
      description: "Cohorts or grade levels",
      icon: <IconGraduation className="h-5 w-5" />,
      accent: "emerald",
    },
    {
      title: "Subjects",
      count: stats.subjects,
      href: "/studio/subjects",
      description: "Linked to each class",
      icon: <IconLayers className="h-5 w-5" />,
      accent: "amber",
    },
    {
      title: "Learners",
      count: stats.learnersWithAccess,
      href: "/studio/access",
      description: "With access (full catalog or lesson grants)",
      icon: <IconUsers className="h-5 w-5" />,
      accent: "rose",
    },
  ];

  const isEmpty = !loading && stats.classes === 0 && stats.lessons === 0;
  const totalContent =
    stats.lessons + stats.classes + stats.subjects;

  return (
    <div className="space-y-10 pb-8">
      {/* Hero */}
      <section className="lum-card relative overflow-hidden rounded-3xl bg-gradient-to-br from-lum-surface-container-low via-lum-surface-container-lowest to-lum-surface-container p-8 shadow-lum-card sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lum-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-lum-primary">
            Creator studio
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-lum-on-background sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-lum-on-surface-variant">
            Shape your curriculum, publish lessons, and control who can learn.
            Everything starts with a class, then subjects, topics, and lessons.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio/lessons/new" className="lum-btn-primary px-6 py-3">
              Create lesson
            </Link>
            <Link
              href="/studio/classes"
              className="inline-flex items-center justify-center rounded-lg border border-lum-outline/35 bg-lum-surface-container-lowest/90 px-6 py-3 text-sm font-semibold text-lum-on-background backdrop-blur hover:bg-lum-surface-container-low"
            >
              Manage classes
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="stats-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="stats-heading" className="font-display text-xl font-semibold text-lum-on-background">
              At a glance
            </h2>
            <p className="mt-1 text-sm text-lum-on-surface-variant">
              {loading
                ? "Loading your numbers…"
                : totalContent === 0
                  ? "No content yet — use the checklist below to begin."
                  : `${stats.lessons} lesson${stats.lessons === 1 ? "" : "s"} across your catalog.`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const a = accentStyles[card.accent];
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`lum-card group relative p-5 ring-1 ring-inset ${a.ring} transition-all hover:-translate-y-0.5 hover:shadow-lum-card ${a.hover}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.iconWrap}`}
                  >
                    {card.icon}
                  </div>
                  <span className="text-3xl font-bold tabular-nums text-lum-on-background">
                    {loading ? (
                      <span className="inline-block h-9 w-10 animate-pulse rounded-lg bg-lum-surface-container-high/80" />
                    ) : (
                      card.count
                    )}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-lum-on-background">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-lum-on-surface-variant">
                  {card.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-lum-primary opacity-0 transition group-hover:opacity-100">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Getting started vs workflow */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-lum-outline/20 bg-lum-surface-container-low/90 p-6">
          <h3 className="font-display text-base font-semibold text-lum-on-background">
            {isEmpty ? "Getting started" : "Curriculum flow"}
          </h3>
          <p className="mt-2 text-sm text-lum-on-surface-variant">
            {isEmpty
              ? "Follow these steps once — after that, adding lessons is quick."
              : "When you add a lesson, you always pick subject → class → topic."}
          </p>
          <ol className="mt-5 space-y-4">
            {[
              {
                step: 1,
                title: "Create classes",
                body: "Define cohorts or levels learners will pick from.",
                href: "/studio/classes",
                done: stats.classes > 0,
              },
              {
                step: 2,
                title: "Add subjects per class",
                body: "Each subject sits under exactly one class.",
                href: "/studio/subjects",
                done: stats.subjects > 0,
              },
              {
                step: 3,
                title: "Add lessons",
                body: "Wizard walks you through topic (create if needed) and video.",
                href: "/studio/lessons/new",
                done: stats.lessons > 0,
              },
              {
                step: 4,
                title: "Grant access",
                body: "Enroll learners who can open the Learn area.",
                href: "/studio/access",
                done: stats.learnersWithAccess > 0,
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    item.done
                      ? "bg-lum-secondary text-lum-on-secondary"
                      : "bg-lum-surface-container-high text-lum-on-surface-variant"
                  }`}
                >
                  {item.done ? "✓" : item.step}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-lum-on-background">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-lum-on-surface-variant">
                    {item.body}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-block text-sm font-semibold text-lum-primary hover:underline"
                  >
                    Go to step →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-lum-primary/25 bg-gradient-to-b from-lum-primary to-lum-primary-container p-6 text-lum-on-primary shadow-lum-card">
          <div>
            <h3 className="font-display text-lg font-bold">New lesson</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Opens a four-step flow: choose subject, choose class, pick or create
              a topic, then title and video.
            </p>
          </div>
          <Link
            href="/studio/lessons/new"
            className="lum-btn-secondary mt-6 w-full justify-center px-4 py-3 sm:w-auto"
          >
            Start lesson wizard
          </Link>
        </section>
      </div>
    </div>
  );
}
