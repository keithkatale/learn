import { NextResponse } from "next/server";
import { isValidUgE164 } from "@/lib/ug-phone";
import {
  learnerSessionCookieOptions,
  LEARNER_SESSION_COOKIE,
  signLearnerSessionToken,
  verifyLearnerPassword,
} from "@/lib/learner-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; password?: string };
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!isValidUgE164(phone)) {
      return NextResponse.json(
        { error: "Enter a valid Ugandan mobile number." },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: user, error } = await admin
      .from("User")
      .select("id,passwordHash")
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Sign-in is temporarily unavailable. Try again shortly." },
        { status: 503 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "No account uses this number yet.",
          code: "PHONE_NOT_REGISTERED",
        },
        { status: 401 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error: "This number has no password set yet. Finish signing up on the register page.",
          code: "PHONE_NOT_REGISTERED",
        },
        { status: 401 },
      );
    }

    const ok = verifyLearnerPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        {
          error: "Incorrect password. Check caps lock and try again.",
          code: "WRONG_PASSWORD",
        },
        { status: 401 },
      );
    }

    const token = await signLearnerSessionToken({
      sub: user.id,
      phone,
    });
    const res = NextResponse.json({ ok: true, userId: user.id });
    res.cookies.set(
      LEARNER_SESSION_COOKIE,
      token,
      learnerSessionCookieOptions(),
    );
    return res;
  } catch (e) {
    console.error("[learner/login]", e);
    const message =
      e instanceof Error && e.message.includes("LEARNER_JWT_SECRET")
        ? "Server misconfiguration: missing LEARNER_JWT_SECRET."
        : "Sign-in failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
