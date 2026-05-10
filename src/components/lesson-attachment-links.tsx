"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { attachmentsBucket, parseAttachments } from "@/lib/lesson-attachments";

export function LessonAttachmentLinks({
  rawAttachments,
  enabled = true,
}: {
  rawAttachments: unknown;
  enabled?: boolean;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const items = useMemo(
    () => parseAttachments(rawAttachments),
    [rawAttachments],
  );
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || items.length === 0) return;
    let cancelled = false;
    const bucket = attachmentsBucket();

    void (async () => {
      const next: Record<string, string> = {};
      for (const a of items) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(a.path, 3600);
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setFailed(error?.message ?? "Could not prepare download.");
          return;
        }
        next[a.path] = data.signedUrl;
      }
      if (!cancelled) setUrls(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, items, supabase]);

  if (items.length === 0) return null;

  if (!enabled) {
    return (
      <div className="lum-card border border-lum-outline/20 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-lum-secondary">
          Materials & downloads
        </h3>
        <p className="mt-2 text-sm text-lum-on-surface-variant">
          Files unlock when you&apos;re signed in and have access from your
          instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="lum-card border border-lum-outline/20 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-lum-secondary">
        Materials & downloads
      </h3>
      {failed ? (
        <p className="mt-2 text-sm text-lum-error">{failed}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((a) => (
            <li key={a.path}>
              {urls[a.path] ? (
                <a
                  href={urls[a.path]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-lum-primary hover:underline"
                >
                  {a.label}
                </a>
              ) : (
                <span className="text-sm text-lum-on-surface-variant">
                  Preparing link…
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-lum-on-surface-variant">
        Links expire after about an hour; refresh the page if needed.
      </p>
    </div>
  );
}
