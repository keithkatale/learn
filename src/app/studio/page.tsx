"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StudioHomePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email?.toLowerCase() ?? "";
      const creator = (process.env.NEXT_PUBLIC_CREATOR_EMAIL ?? "").toLowerCase();
      if (email !== creator) {
        window.location.href = "/learn";
      } else {
        setAllowed(true);
      }
    });
  }, [supabase]);

  if (!allowed) return <p className="text-sm text-zinc-500">Checking creator access...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Studio</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Manage lessons and learner access.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/studio/lessons" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Lessons</h2>
        </Link>
        <Link href="/studio/access" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Access</h2>
        </Link>
      </div>
    </div>
  );
}
