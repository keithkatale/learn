"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * True when Supabase session exists or learner JWT cookie is valid.
 * Priority matches SiteHeader (Supabase wins).
 */
export function useClientSignedIn() {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        if (!cancelled) {
          setSignedIn(true);
          setReady(true);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/learner/session", {
          credentials: "include",
        });
        const json = (await res.json()) as { authenticated?: boolean };
        if (!cancelled) {
          setSignedIn(json.authenticated === true);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setSignedIn(false);
          setReady(true);
        }
      }
    }

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  return { signedIn, ready };
}
