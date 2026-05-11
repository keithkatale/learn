import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canAccessStudio } from "@/lib/creator-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function assertStudioCreator(): Promise<
  | { userId: string; email: string | null; admin: SupabaseClient }
  | { error: NextResponse }
> {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("User")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessStudio(user.email, row?.role as string | undefined)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id, email: user.email ?? null, admin };
}
