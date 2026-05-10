"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { canAccessStudio } from "@/lib/creator-access";

export function StudioGate({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<"checking" | "allowed" | "redirected">(
    "checking",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/admin/login";
        if (!cancelled) setStatus("redirected");
        return;
      }
      const { data: row } = await supabase
        .from("User")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const allowed = canAccessStudio(data.user.email, row?.role);

      if (!allowed) {
        window.location.href = "/learn";
        if (!cancelled) setStatus("redirected");
        return;
      }
      if (!cancelled) setStatus("allowed");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (status !== "allowed") {
    return (
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-20 text-center text-sm text-lum-on-surface-variant">
        Verifying creator access…
      </div>
    );
  }

  return <>{children}</>;
}
