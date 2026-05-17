"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const INTERVAL_MS = 45_000;

/**
 * Pings the server while a signed-in learner session exists so instructors
 * can see last visit and time-on-platform in Studio → Access.
 */
export function LearnerActivityBeacon() {
  const pathname = usePathname();
  const activeRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = () => {
      if (!activeRef.current || cancelled) return;
      void fetch("/api/auth/learner/activity", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => {});
    };

    const onVis = () => {
      if (document.visibilityState === "visible") ping();
    };

    async function startIfLearner() {
      try {
        const res = await fetch("/api/auth/learner/session", {
          credentials: "include",
        });
        const json = (await res.json()) as { authenticated?: boolean };
        if (cancelled || json.authenticated !== true) {
          activeRef.current = false;
          return;
        }

        activeRef.current = true;
        ping();
        timer = setInterval(ping, INTERVAL_MS);
        document.addEventListener("visibilitychange", onVis);
      } catch {
        activeRef.current = false;
      }
    }

    void startIfLearner();

    return () => {
      cancelled = true;
      activeRef.current = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pathname]);

  return null;
}
