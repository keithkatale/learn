"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { canAccessStudio } from "@/lib/creator-access";
import { maskUgPhoneDisplay } from "@/lib/ug-phone";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navLinkClass =
  "rounded-lg px-3 py-2.5 text-sm font-medium text-lum-on-surface-variant hover:bg-lum-surface-container hover:text-lum-on-background md:py-1.5";

export function SiteHeader() {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [learnerPhone, setLearnerPhone] = useState<string | null>(null);
  const [dbRole, setDbRole] = useState<string | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      const u = authData.user ?? null;
      if (u) {
        if (cancelled) return;
        setLearnerPhone(null);
        setUser(u);
        const { data: row } = await supabase
          .from("User")
          .select("role")
          .eq("id", u.id)
          .maybeSingle();
        if (!cancelled) setDbRole(row?.role ?? null);
        return;
      }

      try {
        const sessionRes = await fetch("/api/auth/learner/session", {
          credentials: "include",
        });
        const sessionJson = (await sessionRes.json()) as {
          authenticated?: boolean;
          phone?: string;
          role?: string | null;
        };
        if (
          sessionJson.authenticated === true &&
          typeof sessionJson.phone === "string"
        ) {
          if (cancelled) return;
          setLearnerPhone(sessionJson.phone);
          setUser(null);
          setDbRole(sessionJson.role ?? null);
          return;
        }
      } catch {
        /* ignore */
      }

      if (cancelled) return;
      setLearnerPhone(null);
      setUser(null);
      setDbRole(undefined);
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isCreator = canAccessStudio(user?.email, dbRole);

  async function onSignOut() {
    await fetch("/api/auth/learner/logout", {
      method: "POST",
      credentials: "include",
    });
    await supabase.auth.signOut();
    setLearnerPhone(null);
    setUser(null);
    setDbRole(undefined);
    window.location.href = "/";
  }

  const signedIn = !!learnerPhone || !!user;

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link href="/" className={navLinkClass}>
        Home
      </Link>
      <Link href="/learn" className={navLinkClass}>
        Learn
      </Link>
      {isCreator ? (
        <Link
          href="/studio"
          className="rounded-lg px-3 py-2.5 text-sm font-semibold text-lum-primary hover:bg-lum-surface-container md:py-1.5"
        >
          Studio
        </Link>
      ) : null}
      {signedIn ? (
        <>
          {mobile && learnerPhone ? (
            <span className="truncate px-3 py-2 text-xs text-lum-on-surface-variant">
              {maskUgPhoneDisplay(learnerPhone)}
            </span>
          ) : null}
          {!mobile && learnerPhone ? (
            <span className="hidden max-w-[180px] truncate px-2 text-xs text-lum-on-surface-variant lg:inline xl:max-w-[220px]">
              {maskUgPhoneDisplay(learnerPhone)}
            </span>
          ) : null}
          {mobile && user?.email ? (
            <span className="truncate px-3 py-2 text-xs text-lum-on-surface-variant">
              {user.email}
            </span>
          ) : null}
          {!mobile && user?.email ? (
            <span className="hidden max-w-[140px] truncate px-2 text-xs text-lum-on-surface-variant lg:inline xl:max-w-[220px]">
              {user.email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void onSignOut();
              setMenuOpen(false);
            }}
            className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-lum-on-surface-variant hover:bg-lum-surface-container hover:text-lum-on-background md:py-1.5"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={navLinkClass}>
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-lum-primary px-3 py-2.5 text-center text-sm font-semibold text-white hover:opacity-92 md:py-1.5"
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-lum-outline/25 bg-lum-surface-container-lowest/95 text-lum-on-background backdrop-blur-md supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-14 max-w-[1280px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-[48px]">
        <Link
          href="/"
          className="font-display min-w-0 shrink text-sm font-bold tracking-tight text-lum-on-background sm:text-[15px]"
        >
          Learn with Jovan
        </Link>
        <nav
          className="hidden flex-wrap items-center gap-1 md:flex md:gap-2 lg:gap-3"
          aria-label="Main"
        >
          <NavLinks />
        </nav>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-lum-outline/30 text-lum-on-background md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>
      <div
        id="mobile-navigation"
        className={`border-t border-lum-outline/20 bg-lum-surface-container-lowest px-4 py-3 md:hidden ${menuOpen ? "block" : "hidden"}`}
      >
        <nav
          className="flex max-h-[min(70vh,calc(100dvh-8rem))] flex-col gap-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
          aria-label="Mobile"
        >
          <NavLinks mobile />
        </nav>
      </div>
    </header>
  );
}
