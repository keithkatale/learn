/**
 * Studio access: DB role CREATOR, or email matching NEXT_PUBLIC_CREATOR_EMAIL
 * (same idea as the site header Studio link).
 */
export function emailMatchesCreatorEnv(
  email: string | null | undefined,
): boolean {
  const configured = (process.env.NEXT_PUBLIC_CREATOR_EMAIL ?? "")
    .trim()
    .toLowerCase();
  if (!configured || !email) return false;
  return email.trim().toLowerCase() === configured;
}

export function canAccessStudio(
  authEmail: string | null | undefined,
  dbRole: string | null | undefined,
): boolean {
  if (dbRole === "CREATOR") return true;
  return emailMatchesCreatorEnv(authEmail);
}
