import { NextResponse } from "next/server";
import { isValidUgE164, learnerPlaceholderEmail } from "@/lib/ug-phone";
import {
  hashLearnerPassword,
  learnerSessionCookieOptions,
  LEARNER_SESSION_COOKIE,
  signLearnerSessionToken,
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
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from("User")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this number already exists." },
        { status: 409 },
      );
    }

    const id = crypto.randomUUID();
    const passwordHash = hashLearnerPassword(password);
    const email = learnerPlaceholderEmail(phone);

    const { error } = await admin.from("User").insert({
      id,
      email,
      phone,
      passwordHash,
      role: "VIEWER",
    });

    if (error) {
      console.error("[learner/register]", error);
      return NextResponse.json(
        { error: "Could not create account. Try again later." },
        { status: 500 },
      );
    }

    const token = await signLearnerSessionToken({ sub: id, phone });
    const res = NextResponse.json({ ok: true, userId: id });
    res.cookies.set(
      LEARNER_SESSION_COOKIE,
      token,
      learnerSessionCookieOptions(),
    );
    return res;
  } catch (e) {
    console.error("[learner/register]", e);
    const message =
      e instanceof Error && e.message.includes("LEARNER_JWT_SECRET")
        ? "Server misconfiguration: missing LEARNER_JWT_SECRET."
        : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
