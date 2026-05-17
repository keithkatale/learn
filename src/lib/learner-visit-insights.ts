import type { SupabaseClient } from "@supabase/supabase-js";

export type UserInsightRow = {
  id: string;
  phone: string | null;
  instructorLabel: string | null;
  lastSeenAt: string | null;
  passwordHash: string | null;
  createdAt: string;
};

/** Loads learner rows for Studio analytics; falls back if optional columns are missing in DB. */
export async function fetchUsersForInsights(
  admin: SupabaseClient,
  ids: string[],
): Promise<UserInsightRow[]> {
  if (ids.length === 0) return [];

  const { data, error } = await admin
    .from("User")
    .select(
      "id,phone,instructorLabel,lastSeenAt,passwordHash,createdAt",
    )
    .in("id", ids);

  if (!error && data) {
    return data as UserInsightRow[];
  }

  if (error) {
    console.warn(
      "[fetchUsersForInsights] full select failed, retrying core columns:",
      error.message,
    );
  }

  const { data: core, error: coreErr } = await admin
    .from("User")
    .select("id,phone,passwordHash,createdAt")
    .in("id", ids);

  if (coreErr || !core) {
    console.error("[fetchUsersForInsights] core select failed:", coreErr?.message);
    return [];
  }

  return core.map((u) => ({
    id: u.id as string,
    phone: (u.phone as string | null) ?? null,
    passwordHash: (u.passwordHash as string | null) ?? null,
    createdAt: u.createdAt as string,
    instructorLabel: null,
    lastSeenAt: null,
  }));
}

export type VisitSessionRow = {
  durationSeconds: number | null;
  startedAt: string;
  lastActivityAt: string;
  endedAt: string | null;
};

/** Sum visit time and latest activity from sessions + optional User.lastSeenAt. */
export function aggregateVisitStats(
  sessions: VisitSessionRow[],
  userLastSeenAt: string | null,
): { totalVisitSeconds: number; lastActivityAt: string | null } {
  const closed = sessions.filter((s) => s.endedAt);
  const open = sessions.filter((s) => !s.endedAt);
  let totalVisitSeconds = 0;

  for (const s of closed) {
    if (typeof s.durationSeconds === "number") {
      totalVisitSeconds += s.durationSeconds;
    } else if (s.endedAt) {
      totalVisitSeconds += Math.max(
        0,
        Math.floor(
          (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) /
            1000,
        ),
      );
    }
  }

  if (open.length > 0) {
    const latest = open.reduce((a, b) =>
      new Date(a.lastActivityAt) > new Date(b.lastActivityAt) ? a : b,
    );
    totalVisitSeconds += Math.max(
      0,
      Math.floor(
        (new Date(latest.lastActivityAt).getTime() -
          new Date(latest.startedAt).getTime()) /
          1000,
      ),
    );
  }

  let lastMs = userLastSeenAt ? new Date(userLastSeenAt).getTime() : 0;
  for (const s of sessions) {
    const t = new Date(s.lastActivityAt).getTime();
    if (t > lastMs) lastMs = t;
  }

  return {
    totalVisitSeconds,
    lastActivityAt: lastMs > 0 ? new Date(lastMs).toISOString() : null,
  };
}
