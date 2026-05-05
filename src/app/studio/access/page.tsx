"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Enrollment = { id: string; userId: string; createdAt: string };

export default function StudioAccessPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadEnrollments() {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("Enrollment")
      .select("id,userId,createdAt")
      .order("createdAt", { ascending: false });
    if (dbError) setError(dbError.message);
    else setEnrollments((data as Enrollment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from("Enrollment")
        .select("id,userId,createdAt")
        .order("createdAt", { ascending: false });
      if (dbError) setError(dbError.message);
      else setEnrollments((data as Enrollment[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  async function allowAccess(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      setError("Enter a valid email address.");
      setSubmitting(false);
      return;
    }

    const { data: userRows, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("email", normalized)
      .limit(1);

    if (userError || !userRows || userRows.length === 0) {
      setError("User must register first with this email.");
      setSubmitting(false);
      return;
    }

    const userId = (userRows[0] as { id: string }).id;
    const { error: enrollError } = await supabase
      .from("Enrollment")
      .upsert({ userId }, { onConflict: "userId" });

    if (enrollError) setError(enrollError.message);
    setEmail("");
    setSubmitting(false);
    await loadEnrollments();
  }

  async function revoke(userId: string) {
    setSubmitting(true);
    await supabase.from("Enrollment").delete().eq("userId", userId);
    setSubmitting(false);
    await loadEnrollments();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Access</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Grant or revoke learner access by email.</p>
      </div>

      <form onSubmit={allowAccess} className="flex flex-col gap-3 sm:flex-row">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="learner@email.com" className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">{submitting ? "Saving..." : "Allow access"}</button>
      </form>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">Loading access list...</div>
      ) : (
        <ul className="space-y-2">
          {enrollments.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
              <span className="font-mono">{e.userId}</span>
              <button type="button" disabled={submitting} onClick={() => revoke(e.userId)} className="text-red-600 hover:underline disabled:opacity-60 dark:text-red-400">Revoke</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
