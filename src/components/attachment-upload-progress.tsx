import type { LessonAttachmentUploadProgress } from "@/lib/lesson-attachments";

export function AttachmentUploadProgressBar(props: LessonAttachmentUploadProgress) {
  const { completed, total, activeFile } = props;
  if (total <= 0) return null;

  const pct = Math.min(100, (completed / total) * 100);
  const inFlight = activeFile !== null && activeFile.length > 0;
  const currentIndex = inFlight ? completed + 1 : completed;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={inFlight}
      className="mt-3 rounded-lg border border-lum-primary/30 bg-lum-primary/5 px-4 py-3"
    >
      <p className="text-sm font-semibold text-lum-on-background">
        {inFlight
          ? `Uploading file ${currentIndex} of ${total}`
          : completed >= total
            ? "Attachments finished"
            : "Preparing uploads…"}
      </p>
      {inFlight ? (
        <p
          className="mt-1 truncate text-xs text-lum-on-surface-variant"
          title={activeFile ?? undefined}
        >
          {activeFile}
        </p>
      ) : null}
      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-lum-outline/25">
        <div
          className="relative z-10 h-full rounded-full bg-lum-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
        {inFlight ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      {inFlight ? (
        <p className="mt-2 text-[11px] leading-snug text-lum-on-surface-variant">
          Large files may take a while — keep this tab open until uploads finish.
        </p>
      ) : null}
    </div>
  );
}
