import * as jose from "jose";
import bcrypt from "bcryptjs";

export const LEARNER_SESSION_COOKIE = "learner_session";

const JWT_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days — keep in sync with setExpirationTime below

function jwtSecretKey(): Uint8Array {
  const s = process.env.LEARNER_JWT_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error(
      "Set LEARNER_JWT_SECRET in .env (at least 16 characters).",
    );
  }
  return new TextEncoder().encode(s);
}

export function hashLearnerPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyLearnerPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export async function signLearnerSessionToken(payload: {
  sub: string;
  phone: string;
}): Promise<string> {
  return await new jose.SignJWT({ phone: payload.phone })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(jwtSecretKey());
}

export async function verifyLearnerSessionToken(
  token: string,
): Promise<{ userId: string; phone: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, jwtSecretKey(), {
      algorithms: ["HS256"],
    });
    const sub = payload.sub;
    const phone =
      typeof payload.phone === "string" ? payload.phone : undefined;
    if (!sub || !phone) return null;
    return { userId: sub, phone };
  } catch {
    return null;
  }
}

export function learnerSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_MAX_AGE_SEC,
  };
}
