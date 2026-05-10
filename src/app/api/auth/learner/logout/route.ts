import { NextResponse } from "next/server";
import { LEARNER_SESSION_COOKIE } from "@/lib/learner-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LEARNER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
