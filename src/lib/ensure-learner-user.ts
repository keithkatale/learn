import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidUgE164, learnerPlaceholderEmail } from "@/lib/ug-phone";

/**
 * Ensures a VIEWER row exists for this phone so Enrollment / grants can attach.
 * Pre-created by Studio access before the learner registers; registration then sets passwordHash.
 */
export async function ensureLearnerUserForPhone(
  admin: SupabaseClient,
  phone: string,
): Promise<{ userId: string } | { error: string }> {
  if (!isValidUgE164(phone)) {
    return { error: "Invalid phone." };
  }

  const { data: existing, error: selErr } = await admin
    .from("User")
    .select("id,role")
    .eq("phone", phone)
    .maybeSingle();

  if (selErr) {
    return { error: selErr.message };
  }

  if (existing) {
    if (existing.role === "CREATOR") {
      return {
        error:
          "This phone is tied to a creator account. Use a learner number or remove the phone from that account.",
      };
    }
    return { userId: existing.id as string };
  }

  const id = crypto.randomUUID();
  const { error: insErr } = await admin.from("User").insert({
    id,
    email: learnerPlaceholderEmail(phone),
    phone,
    passwordHash: null,
    role: "VIEWER",
  });

  if (insErr) {
    if (insErr.code === "23505") {
      const { data: raced } = await admin
        .from("User")
        .select("id,role")
        .eq("phone", phone)
        .maybeSingle();
      if (raced && raced.role !== "CREATOR") {
        return { userId: raced.id as string };
      }
    }
    return { error: insErr.message };
  }

  return { userId: id };
}
