/**
 * Turn generic browser/network failures into actionable copy for learners/creators.
 */
export function describeSupabaseFetchFailure(message: string): string {
  const m = message.trim().toLowerCase();
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("err_name_not_resolved")
  ) {
    return [
      "Cannot reach your Supabase API (network or DNS).",
      "",
      "Fix: set NEXT_PUBLIC_SUPABASE_URL to the exact HTTPS URL from Supabase → Settings → API (Project URL). It should look like https://xxxxxxxx.supabase.co — not the database host, not a placeholder.",
      "",
      "After editing .env, restart the dev server (npm run dev). For local Supabase CLI use http://127.0.0.1:54321 while supabase start is running.",
    ].join("\n");
  }
  return message;
}
