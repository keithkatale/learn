"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canAccessStudio } from "@/lib/creator-access";

type ContextJson =
  | {
      authenticated: true;
      userId: string;
      email: string | null;
      phone: string | null;
      role: string | null;
      fullAccess: boolean;
      grantedLessonIds: string[];
    }
  | { authenticated: false };

/**
 * Lesson playback: full catalog (Enrollment), scoped grants, studio preview,
 * or anonymous Senior 1 sample lesson via `canWatchLesson(id, freePreview)`.
 */
export function useLearnerAccess(supabase: SupabaseClient) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [fullAccess, setFullAccess] = useState(false);
  const [grantedLessonIds, setGrantedLessonIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/access/context", {
          credentials: "include",
        });
        const data = (await res.json()) as ContextJson;
        if (cancelled) return;
        if (!data.authenticated) {
          setUserId(null);
          setUserEmail(null);
          setUserPhone(null);
          setDbRole(null);
          setFullAccess(false);
          setGrantedLessonIds([]);
        } else {
          setUserId(data.userId);
          setUserEmail(data.email);
          setUserPhone(data.phone);
          setDbRole(data.role);
          setFullAccess(data.fullAccess);
          setGrantedLessonIds(data.grantedLessonIds ?? []);
        }
      } catch {
        if (!cancelled) {
          setUserId(null);
          setUserEmail(null);
          setUserPhone(null);
          setDbRole(null);
          setFullAccess(false);
          setGrantedLessonIds([]);
        }
      } finally {
        if (!cancelled) setReady(true);
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

  const grantCount = grantedLessonIds.length;
  const studioPreview = canAccessStudio(userEmail, dbRole);

  const accessKind = useMemo((): "anon" | "studio" | "full" | "partial" | "none" => {
    if (!userId) return "anon";
    if (studioPreview) return "studio";
    if (fullAccess) return "full";
    if (grantCount > 0) return "partial";
    return "none";
  }, [userId, studioPreview, fullAccess, grantCount]);

  function canWatchLesson(lessonId: string, freePreview: boolean): boolean {
    if (freePreview) return true;
    if (!lessonId) return false;
    if (!userId) return false;
    if (studioPreview) return true;
    if (fullAccess) return true;
    return grantedLessonIds.includes(lessonId);
  }

  /** @deprecated Use canWatchLesson(lessonId, false) per lesson */
  const canPlayPublishedLessons =
    !!userId && (fullAccess || studioPreview || grantCount > 0);

  return {
    ready,
    userEmail,
    userPhone,
    userId,
    dbRole,
    /** Full catalog via Enrollment */
    fullAccess,
    /** Back-compat name for full Enrollment access */
    enrolled: fullAccess,
    grantedLessonIds,
    grantCount,
    accessKind,
    studioPreview,
    canWatchLesson,
    canPlayPublishedLessons,
  };
}
