"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio", label: "Overview", match: (p: string) => p === "/studio" },
  {
    href: "/studio/subjects",
    label: "Subjects",
    match: (p: string) => p.startsWith("/studio/subjects"),
  },
  {
    href: "/studio/classes",
    label: "Classes",
    match: (p: string) => p.startsWith("/studio/classes"),
  },
  {
    href: "/studio/lessons",
    label: "Lessons",
    match: (p: string) => p.startsWith("/studio/lessons"),
  },
  {
    href: "/studio/access",
    label: "Access",
    match: (p: string) => p.startsWith("/studio/access"),
  },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-nowrap gap-1.5 sm:flex-wrap sm:gap-2">
      {links.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? "rounded-lg bg-lum-primary px-3 py-1.5 text-sm font-semibold text-lum-on-primary shadow-sm ring-1 ring-lum-primary/30"
                : "rounded-lg px-3 py-1.5 text-sm font-medium text-lum-on-surface-variant hover:bg-lum-surface-container-low hover:text-lum-on-background"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
