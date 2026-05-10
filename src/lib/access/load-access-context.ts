import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessContextPayload = {
  authenticated: true;
  userId: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  fullAccess: boolean;
  grantedLessonIds: string[];
};

export async function loadAccessGrantsForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("LearningAccessGrant")
    .select("lessonId")
    .eq("userId", userId)
    .gt("expiresAt", now);

  if (error || !data) return [];
  return data
    .map((r: { lessonId?: string }) => r.lessonId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function loadEnrollmentFullAccess(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("Enrollment")
    .select("id")
    .eq("userId", userId)
    .maybeSingle();
  return !!data;
}
