import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "public-anon-key-placeholder";

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    try {
      const u = new URL(url);
      const badPlaceholder =
        url.includes("your-project-ref") || url.includes("YOUR_PROJECT");
      if (badPlaceholder) {
        console.warn(
          "[Supabase] NEXT_PUBLIC_SUPABASE_URL still looks like a placeholder. Copy the Project URL from the Supabase dashboard.",
        );
      }
      if (
        !u.hostname.endsWith("supabase.co") &&
        u.hostname !== "127.0.0.1" &&
        u.hostname !== "localhost"
      ) {
        console.warn(
          "[Supabase] Unexpected API host:",
          u.hostname,
          "(expected *.supabase.co or 127.0.0.1). Wrong host causes ERR_NAME_NOT_RESOLVED / Failed to fetch.",
        );
      }
    } catch {
      console.error("[Supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid URL:", url);
    }
  }

  return createBrowserClient(url, key);
}
