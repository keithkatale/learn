import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  LEARNER_SESSION_COOKIE,
  verifyLearnerSessionToken,
} from "@/lib/learner-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const store = await cookies();
    const raw = store.get(LEARNER_SESSION_COOKIE)?.value;
    if (!raw) {
      return NextResponse.json({ authenticated: false });
    }

    const claims = await verifyLearnerSessionToken(raw);
    if (!claims) {
      return NextResponse.json({ authenticated: false });
    }

    const admin = createSupabaseAdminClient();
    const { data: user, error } = await admin
      .from("User")
      .select("id,role,passwordHash")
      .eq("id", claims.userId)
      .maybeSingle();

    if (error || !user?.passwordHash) {
      return NextResponse.json({ authenticated: false });
    }

    const { data: en } = await admin
      .from("Enrollment")
      .select("id")
      .eq("userId", user.id)
      .maybeSingle();

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      phone: claims.phone,
      role: user.role as string,
      enrolled: !!en,
    });
  } catch (e) {
    console.error("[learner/session]", e);
    return NextResponse.json({ authenticated: false });
  }
}
