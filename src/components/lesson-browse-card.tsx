import Link from "next/link";

export function LessonBrowseCard({
  href,
  sortOrder,
  title,
  locked,
  lockReason,
}: {
  href: string;
  sortOrder: number;
  title: string;
  locked: boolean;
  lockReason: string;
}) {
  return (
    <Link
      href={href}
      className="lum-card relative block overflow-hidden p-4 transition hover:border-lum-primary/25 hover:shadow-lum-card"
    >
      <div
        className={`flex items-center justify-between gap-4 ${
          locked ? "blur-[5px] opacity-65" : ""
        }`}
      >
        <div className="min-w-0">
          <span className="mr-3 font-mono text-sm text-lum-on-surface-variant">
            #{sortOrder}
          </span>
          <span className="font-medium text-lum-on-background">{title}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold text-lum-secondary">
          {locked ? "Locked" : "Open"}
        </span>
      </div>
      {locked ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-lum-background/88 px-4 py-3 text-center backdrop-blur-[2px]">
          <span className="text-sm font-semibold text-lum-on-background">
            Access required
          </span>
          <span className="max-w-xs text-xs leading-snug text-lum-on-surface-variant">
            {lockReason}
          </span>
        </div>
      ) : null}
    </Link>
  );
}
