import type { SupabaseClient } from "@supabase/supabase-js";
import { phoneFromLearnerPlaceholderEmail } from "@/lib/ug-phone";

export type UserInsightRow = {
  id: string;
  phone: string | null;
  instructorLabel: string | null;
  lastSeenAt: string | null;
  passwordHash: string | null;
  accountCreatedAt: string | null;
};

type RawUserRow = Record<string, unknown>;

const USER_SELECT_ATTEMPTS = [
  "id,phone,email,instructorLabel,lastSeenAt,passwordHash",
  "id,phone,email,instructorLabel,passwordHash",
  "id,phone,email,passwordHash",
  "id,phone,passwordHash",
  "id,phone,email",
  "id,phone",
  "id,email,passwordHash",
  "id",
] as const;

function normalizeUserRow(raw: RawUserRow): UserInsightRow {
  const id = String(raw.id ?? "");
  const phoneCol =
    typeof raw.phone === "string" && raw.phone.trim()
      ? raw.phone.trim()
      : null;
  const email =
    typeof raw.email === "string" && raw.email.trim() ? raw.email.trim() : null;
  const phone = phoneCol ?? phoneFromLearnerPlaceholderEmail(email);

  return {
    id,
    phone,
    instructorLabel:
      typeof raw.instructorLabel === "string" ? raw.instructorLabel : null,
    lastSeenAt:
      typeof raw.lastSeenAt === "string" ? raw.lastSeenAt : null,
    passwordHash:
      typeof raw.passwordHash === "string" ? raw.passwordHash : null,
    accountCreatedAt:
      typeof raw.createdAt === "string" ? raw.createdAt : null,
  };
}

/**
 * Loads learner rows for Studio analytics. Tries several column sets because
 * production Supabase schemas may omit Prisma-only columns (e.g. createdAt).
 */
export async function fetchUsersForInsights(
  admin: SupabaseClient,
  ids: string[],
): Promise<UserInsightRow[]> {
  if (ids.length === 0) return [];

  let lastError: string | undefined;

  for (const columns of USER_SELECT_ATTEMPTS) {
    const { data, error } = await admin.from("User").select(columns).in("id", ids);

    if (!error && data?.length) {
      return (data as unknown as RawUserRow[]).map(normalizeUserRow);
    }

    if (error) {
      lastError = error.message;
      continue;
    }

    if (data?.length === 0 && ids.length > 0) {
      return [];
    }
  }

  if (lastError) {
    console.error("[fetchUsersForInsights] all selects failed:", lastError);
  }

  return [];
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
): {
  totalVisitSeconds: number;
  lastActivityAt: string | null;
  visitCount: number;
} {
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
    visitCount: sessions.length,
  };
}
