"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UgPhoneInput } from "@/components/ug-phone-input";
import {
  fetchStudioLessonsWithHierarchy,
  type LessonWithHierarchy,
} from "@/lib/lesson-hierarchy";
import { isValidUgE164 } from "@/lib/ug-phone";
import { StudioLearnerLabelEditor } from "@/components/studio-learner-label-editor";

type GrantRow = {
  id: string;
  expiresAt: string;
  createdAt: string;
  lessonId: string;
  userId: string;
  phone: string | null;
  lessonTitle: string;
};

type FullRow = {
  id: string;
  userId: string;
  createdAt: string;
  phone: string | null;
};

type LearnerInsight = {
  userId: string;
  phone: string | null;
  instructorLabel: string | null;
  accountCreatedAt: string | null;
  registered: boolean;
  lastSeenAt: string | null;
  hasVisitedPlatform: boolean;
  totalVisitSeconds: number;
};

function formatVisitSeconds(sec: number): string {
  if (sec <= 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ""}`;
  return `${s}s`;
}

export default function StudioAccessPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [lessons, setLessons] = useState<LessonWithHierarchy[]>([]);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [fullUsers, setFullUsers] = useState<FullRow[]>([]);
  const [learnerInsights, setLearnerInsights] = useState<LearnerInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullCatalog, setFullCatalog] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 16);
  });

  async function reloadLists() {
    setLoading(true);
    setError(null);
    const [{ lessons: les, error: lErr }, grantsRes] = await Promise.all([
      fetchStudioLessonsWithHierarchy(supabase),
      fetch("/api/studio/access-grants", { credentials: "include" }),
    ]);
    if (lErr) setError(lErr);
    setLessons(les.filter((l) => l.published));

    if (grantsRes.ok) {
      const data = (await grantsRes.json()) as {
        grants?: GrantRow[];
        fullAccessUsers?: FullRow[];
        learnerInsights?: LearnerInsight[];
      };
      setGrants(data.grants ?? []);
      setFullUsers(data.fullAccessUsers ?? []);
      setLearnerInsights(data.learnerInsights ?? []);
    } else {
      const err = await grantsRes.json().catch(() => ({}));
      setError(
        typeof err.error === "string" ? err.error : "Could not load access list.",
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    void reloadLists();
  }, [supabase]);

  function toggleLesson(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const phone = String(fd.get("phone") ?? "").trim();
    if (!isValidUgE164(phone)) {
      setError("Enter a complete Ugandan phone number.");
      setSubmitting(false);
      return;
    }

    const isoExpiry = new Date(expiresAt).toISOString();
    const res = await fetch("/api/studio/access-grants", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        fullPlatformAccess: fullCatalog,
        lessonIds: fullCatalog ? [] : [...selected],
        expiresAt: isoExpiry,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Save failed.");
      return;
    }
    setSelected(new Set());
    await reloadLists();
  }

  async function revokeGrant(id: string) {
    setSubmitting(true);
    await fetch(`/api/studio/access-grants?grantId=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setSubmitting(false);
    await reloadLists();
  }

  async function revokeAllForUser(userId: string) {
    setSubmitting(true);
    await fetch(`/api/studio/access-grants?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setSubmitting(false);
    await reloadLists();
  }

  const groupedLessons = useMemo(() => {
    const m = new Map<string, LessonWithHierarchy[]>();
    for (const l of lessons) {
      const cls = l.topic?.subject?.class?.name ?? "Class";
      const sub = l.topic?.subject?.name ?? "Subject";
      const key = `${cls} · ${sub}`;
      const arr = m.get(key) ?? [];
      arr.push(l);
      m.set(key, arr);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [lessons]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-lum-on-background">
          Access
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-lum-on-surface-variant">
          Grant learners access by <strong>phone number</strong> (Uganda +256).
          Choose <strong>full catalog</strong> or pick individual published
          lessons — access expires on the date you set (default one year).
          You can add numbers <strong>before</strong> they register; when they
          sign up with the same number, access applies automatically.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-lum-on-background">
          Learner visits &amp; labels
        </h2>
        <p className="max-w-3xl text-xs leading-relaxed text-lum-on-surface-variant">
          Names here are for your reference only (not shown to learners). Visit
          times come from short pings while a learner is signed in on the site;
          idle for 30 minutes starts a new visit. Run the SQL migration{" "}
          <span className="font-mono text-lum-primary">
            prisma/migrations/20260513_learner_activity/migration.sql
          </span>{" "}
          in Supabase if this table is empty or you see fetch errors.
        </p>
        {loading ? (
          <p className="text-sm text-lum-on-surface-variant">Loading…</p>
        ) : learnerInsights.length === 0 ? (
          <p className="text-sm text-lum-on-surface-variant">
            No learners with access yet. Grant full catalog or lesson access
            above — pre-registered numbers appear here too.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-lum-outline/20 shadow-lum-card">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-lum-outline/20 bg-lum-surface-container-low/80 text-xs font-bold uppercase tracking-wide text-lum-on-surface-variant">
                  <th className="px-3 py-3">Your label</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Account</th>
                  <th className="px-3 py-3">Visited site</th>
                  <th className="px-3 py-3">Last visit</th>
                  <th className="px-3 py-3">Time on site</th>
                </tr>
              </thead>
              <tbody>
                {learnerInsights.map((row) => (
                  <tr
                    key={row.userId}
                    className="border-b border-lum-outline/15 last:border-0"
                  >
                    <td className="px-3 py-3 align-top">
                      <StudioLearnerLabelEditor
                        userId={row.userId}
                        initialLabel={row.instructorLabel ?? ""}
                        disabled={submitting}
                        onSaved={() => void reloadLists()}
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-lum-on-background">
                      {row.phone ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-lum-on-surface-variant">
                      {row.registered ? (
                        <span className="font-medium text-lum-secondary">
                          Registered
                        </span>
                      ) : (
                        <span className="text-amber-900">Pending signup</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {row.hasVisitedPlatform ? (
                        <span className="font-medium text-lum-secondary">Yes</span>
                      ) : (
                        <span className="text-lum-on-surface-variant">Not yet</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-lum-on-surface-variant">
                      {row.lastSeenAt
                        ? new Date(row.lastSeenAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-lum-on-background">
                      {formatVisitSeconds(row.totalVisitSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form
        onSubmit={onSubmit}
        className="lum-card space-y-5 p-4 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-lum-on-background">
          Grant or update access
        </h2>
        <UgPhoneInput />
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={fullCatalog}
            onChange={(e) => {
              setFullCatalog(e.target.checked);
              if (e.target.checked) setSelected(new Set());
            }}
            className="mt-1"
          />
          <span className="text-sm leading-relaxed text-lum-on-surface-variant">
            <span className="font-medium text-lum-on-background">
              Full catalog
            </span>{" "}
            — unlock every published lesson until expiry (replaces lesson picks
            for this learner).
          </span>
        </label>

        {!fullCatalog ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-lum-secondary">
              Lesson access (published only)
            </p>
            <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-lg border border-lum-outline/25 bg-lum-surface-container-low/40 p-3">
              {groupedLessons.length === 0 ? (
                <p className="text-sm text-lum-on-surface-variant">
                  No published lessons yet.
                </p>
              ) : (
                groupedLessons.map(([group, rows]) => (
                  <div key={group} className="mb-4 last:mb-0">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-lum-on-surface-variant">
                      {group}
                    </p>
                    <ul className="space-y-2">
                      {rows.map((l) => (
                        <li key={l.id}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selected.has(l.id)}
                              onChange={() => toggleLesson(l.id)}
                              className="mt-0.5"
                            />
                            <span className="text-lum-on-background">
                              <span className="font-mono text-xs text-lum-on-surface-variant">
                                #{l.sortOrder}
                              </span>{" "}
                              {l.topic?.name ? `${l.topic.name} · ` : ""}
                              {l.title}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-lum-secondary">
            Access valid until
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="lum-input mt-2 max-w-xs"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-lum-error/25 bg-lum-error-container/80 px-3 py-2 text-sm text-lum-error">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || loading}
          className="lum-btn-primary px-6 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save access"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-lum-on-background">
          Full catalog learners
        </h2>
        {loading ? (
          <p className="text-sm text-lum-on-surface-variant">Loading…</p>
        ) : fullUsers.length === 0 ? (
          <p className="text-sm text-lum-on-surface-variant">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {fullUsers.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lum-outline/20 bg-lum-surface-container-lowest px-4 py-3 text-sm shadow-lum-card"
              >
                <span className="font-mono text-lum-on-background">
                  {row.phone ?? row.userId}
                </span>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => revokeAllForUser(row.userId)}
                  className="font-semibold text-lum-error hover:underline disabled:opacity-60"
                >
                  Revoke all access
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-lum-on-background">
          Lesson-specific grants
        </h2>
        {loading ? (
          <p className="text-sm text-lum-on-surface-variant">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="text-sm text-lum-on-surface-variant">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {grants.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-2 rounded-xl border border-lum-outline/20 bg-lum-surface-container-lowest px-4 py-3 text-sm shadow-lum-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-lum-on-background">
                    {g.phone ?? g.userId}
                  </p>
                  <p className="truncate text-lum-on-surface-variant">
                    {g.lessonTitle}
                  </p>
                  <p className="text-xs text-lum-on-surface-variant">
                    Until {new Date(g.expiresAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => revokeGrant(g.id)}
                  className="shrink-0 font-semibold text-lum-error hover:underline disabled:opacity-60"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
