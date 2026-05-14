import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  LEARNER_SESSION_COOKIE,
  verifyLearnerSessionToken,
} from "@/lib/learner-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const IDLE_MS = 30 * 60 * 1000;
const LAST_SEEN_MIN_INTERVAL_MS = 25_000;

function sessionDurationSeconds(startedAt: string, lastActivityAt: string): number {
  const a = new Date(startedAt).getTime();
  const b = new Date(lastActivityAt).getTime();
  return Math.max(0, Math.floor((b - a) / 1000));
}

export async function POST() {
  try {
    const store = await cookies();
    const raw = store.get(LEARNER_SESSION_COOKIE)?.value;
    if (!raw) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const claims = await verifyLearnerSessionToken(raw);
    if (!claims) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: user, error: userErr } = await admin
      .from("User")
      .select("id,passwordHash")
      .eq("id", claims.userId)
      .maybeSingle();

    if (userErr || !user?.passwordHash) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const userId = user.id as string;
    const now = new Date();
    const nowIso = now.toISOString();
    const idleBefore = new Date(now.getTime() - IDLE_MS).toISOString();

    const { data: openSessions, error: openErr } = await admin
      .from("LearnerVisitSession")
      .select("id,startedAt,lastActivityAt")
      .eq("userId", userId)
      .is("endedAt", null);

    if (openErr) {
      console.error("[learner/activity]", openErr);
      return NextResponse.json({ error: openErr.message }, { status: 500 });
    }

    for (const row of openSessions ?? []) {
      if (new Date(row.lastActivityAt).getTime() < new Date(idleBefore).getTime()) {
        const dur = sessionDurationSeconds(row.startedAt, row.lastActivityAt);
        await admin
          .from("LearnerVisitSession")
          .update({
            endedAt: row.lastActivityAt,
            durationSeconds: dur,
          })
          .eq("id", row.id);
      }
    }

    const { data: stillOpen, error: reopenErr } = await admin
      .from("LearnerVisitSession")
      .select("id,lastActivityAt")
      .eq("userId", userId)
      .is("endedAt", null)
      .order("lastActivityAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reopenErr) {
      console.error("[learner/activity]", reopenErr);
      return NextResponse.json({ error: reopenErr.message }, { status: 500 });
    }

    if (
      stillOpen &&
      new Date(stillOpen.lastActivityAt).getTime() >= new Date(idleBefore).getTime()
    ) {
      await admin
        .from("LearnerVisitSession")
        .update({ lastActivityAt: nowIso })
        .eq("id", stillOpen.id);
    } else {
      await admin.from("LearnerVisitSession").insert({
        id: crypto.randomUUID(),
        userId,
        startedAt: nowIso,
        lastActivityAt: nowIso,
      });
    }

    const { data: u2 } = await admin
      .from("User")
      .select("lastSeenAt")
      .eq("id", userId)
      .maybeSingle();

    const last = u2?.lastSeenAt ? new Date(u2.lastSeenAt as string).getTime() : 0;
    if (!last || now.getTime() - last >= LAST_SEEN_MIN_INTERVAL_MS) {
      await admin.from("User").update({ lastSeenAt: nowIso }).eq("id", userId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[learner/activity]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
