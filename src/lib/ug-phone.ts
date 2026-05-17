/** Uganda — Supabase / E.164 uses +256 plus 9-digit national number. */
export const UG_PHONE_E164_PREFIX = "+256";

/**
 * Pull up to 9 national digits from pasted or typed input.
 * Accepts 077…, 256…, +256…, and digit-only pastes.
 */
export function parseUgNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("256")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

/** Spaces for display only — 7XX XXX XXX */
export function formatUgNationalDisplay(digits: string): string {
  const d = digits.slice(0, 9);
  if (d.length === 0) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function ugNationalToE164(nationalDigits: string): string | null {
  if (!/^\d{9}$/.test(nationalDigits)) return null;
  return `${UG_PHONE_E164_PREFIX}${nationalDigits}`;
}

export function isValidUgE164(e164: string): boolean {
  return /^\+256\d{9}$/.test(e164.trim());
}

/** National digits (9) from a valid +256… string; otherwise empty. */
export function e164ToUgNationalDigits(e164: string): string {
  const t = e164.trim();
  if (!isValidUgE164(t)) return "";
  return t.slice(UG_PHONE_E164_PREFIX.length);
}

/** Short mask for header UI — keeps last 3 digits visible */
/**
 * Synthetic email for DBs that still have NOT NULL on `User.email`.
 * One-to-one with E.164 phone; not deliverable (reserved-style local part).
 */
export function learnerPlaceholderEmail(e164Phone: string): string {
  const digits = e164Phone.replace(/\D/g, "");
  return `${digits}@learners.phone`;
}

/** Reverse of {@link learnerPlaceholderEmail} when `User.phone` is empty. */
export function phoneFromLearnerPlaceholderEmail(
  email: string | null | undefined,
): string | null {
  if (!email?.trim()) return null;
  const m = /^(\d{11,12})@learners\.phone$/i.exec(email.trim());
  if (!m) return null;
  const digits = m[1];
  if (digits.length === 12 && digits.startsWith("256")) {
    return `+${digits}`;
  }
  return null;
}

export function maskUgPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  let national = digits;
  if (digits.startsWith("256") && digits.length >= 12) {
    national = digits.slice(3);
  }
  if (national.length < 3) return e164;
  const last3 = national.slice(-3);
  return `+256 ••• ••• ${last3}`;
}
