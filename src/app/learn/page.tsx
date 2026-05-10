"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LearnBreadcrumbs } from "@/components/learn-breadcrumbs";

type ClassRow = { id: string; name: string };

export default function LearnClassesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  useEffect(() => {
    supabase
      .from("Class")
      .select("id,name")
      .order("name")
      .then(({ data }) => setClasses(data ?? []));
  }, [supabase]);

  return (
    <div className="space-y-10">
      <LearnBreadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Learn" }]}
      />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lum-secondary">
          Browse
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-lum-on-background sm:text-4xl">
          Select your class
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-lum-on-surface-variant">
          Choose a cohort to see subjects and lessons.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/learn/${c.id}`}
            className="lum-card group p-6 transition hover:border-lum-primary/25 hover:shadow-lum-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-lum-secondary">
              Class
            </p>
            <h2 className="font-display mt-2 text-xl font-semibold text-lum-on-background">
              {c.name}
            </h2>
          </Link>
        ))}
      </div>
      {classes.length === 0 ? (
        <p className="text-sm text-lum-on-surface-variant">
          No classes yet — your instructor will add them in Studio.
        </p>
      ) : null}
    </div>
  );
}
