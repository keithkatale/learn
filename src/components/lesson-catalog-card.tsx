"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CatalogLessonRow } from "@/lib/public-catalog";
import { videoThumbnailUrl } from "@/lib/video";

function excerpt(text: string | null, max = 110): string | null {
  if (!text?.trim()) return null;
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function ThumbnailPlaceholder() {
  return (
    <div className="flex h-full min-h-[9rem] items-center justify-center bg-gradient-to-br from-lum-primary/10 via-lum-surface-container-low to-lum-secondary/12">
      <svg
        className="size-14 text-lum-primary/35"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.25"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

export function LessonCatalogCard({ row }: { row: CatalogLessonRow }) {
  const thumb = videoThumbnailUrl(row.videoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  const usePlaceholder = !thumb || imgFailed;
  const blur = excerpt(row.description);

  return (
    <Link
      href={row.href}
      className="group lum-card flex h-full flex-col overflow-hidden p-0 transition hover:border-lum-primary/25 hover:shadow-lum-card"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-lum-surface-container">
        {!usePlaceholder && thumb ? (
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[11px] text-lum-on-surface-variant">
            #{row.lessonSortOrder}
          </span>
        </div>
        <h3 className="font-display mt-1 line-clamp-2 text-base font-semibold leading-snug text-lum-on-background">
          {row.title}
        </h3>
        {blur ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-lum-on-surface-variant">
            {blur}
          </p>
        ) : null}
        <span className="mt-auto pt-3 text-sm font-semibold text-lum-secondary">
          View lesson →
        </span>
      </div>
    </Link>
  );
}
