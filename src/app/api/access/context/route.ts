import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  LEARNER_SESSION_COOKIE,
  verifyLearnerSessionToken,
} from "@/lib/learner-auth";
import {
  loadAccessGrantsForUser,
  loadEnrollmentFullAccess,
} from "@/lib/access/load-access-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    const serverSb = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await serverSb.auth.getUser();

    if (authUser?.id) {
      const { data: profile } = await admin
        .from("User")
        .select("role,phone")
        .eq("id", authUser.id)
        .maybeSingle();

      const fullAccess = await loadEnrollmentFullAccess(admin, authUser.id);
      const grantedLessonIds = await loadAccessGrantsForUser(
        admin,
        authUser.id,
      );

      const body: Record<string, unknown> = {
        authenticated: true,
        userId: authUser.id,
        email: authUser.email ?? null,
        phone: (profile?.phone as string | null) ?? null,
        role: (profile?.role as string | null) ?? null,
        fullAccess,
        grantedLessonIds,
      };
      return NextResponse.json(body);
    }

    const store = await cookies();
    const raw = store.get(LEARNER_SESSION_COOKIE)?.value;
    if (!raw) {
      return NextResponse.json({ authenticated: false });
    }

    const claims = await verifyLearnerSessionToken(raw);
    if (!claims) {
      return NextResponse.json({ authenticated: false });
    }

    const { data: user, error } = await admin
      .from("User")
      .select("id,role,passwordHash,phone")
      .eq("id", claims.userId)
      .maybeSingle();

    if (error || !user?.passwordHash) {
      return NextResponse.json({ authenticated: false });
    }

    const fullAccess = await loadEnrollmentFullAccess(admin, user.id);
    const grantedLessonIds = await loadAccessGrantsForUser(admin, user.id);

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: null,
      phone: (user.phone as string | null) ?? claims.phone,
      role: user.role as string | null,
      fullAccess,
      grantedLessonIds,
    });
  } catch (e) {
    console.error("[access/context]", e);
    return NextResponse.json({ authenticated: false });
  }
}
