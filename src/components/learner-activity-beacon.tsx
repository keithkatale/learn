"use client";

import { useEffect } from "react";

const INTERVAL_MS = 45_000;

/**
 * Periodically pings the server while a learner session cookie exists so
 * instructors can see last visit and time-on-platform in Studio → Access.
 */
export function LearnerActivityBeacon() {
  useEffect(() => {
    const ping = () => {
      void fetch("/api/auth/learner/activity", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const timer = setInterval(ping, INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
