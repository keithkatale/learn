import Link from "next/link";
import { adminWhatsAppDigits, whatsAppMeUrl } from "@/lib/whatsapp";

function buildWhatsAppMessage(opts: {
  lessonTitle: string;
  lessonUrl: string;
  userPhone?: string | null;
}): string {
  const lines = [
    `Hi — I'd like access to this lesson on Learn with Jovan:`,
    opts.lessonTitle,
    opts.lessonUrl,
  ];
  if (opts.userPhone) {
    lines.push(`My registered number: ${opts.userPhone}`);
  }
  lines.push(`Please let me know how to pay / unlock access. Thank you.`);
  return lines.join("\n");
}

export function LessonLockedPanel({
  signedIn,
  fullAccess,
  hasLessonGrant,
  grantCount,
  lessonTitle,
  lessonUrl,
  userPhone,
}: {
  signedIn: boolean;
  fullAccess: boolean;
  hasLessonGrant: boolean;
  grantCount: number;
  lessonTitle: string;
  lessonUrl: string;
  userPhone?: string | null;
}) {
  const waDigits = adminWhatsAppDigits();
  const waUrl =
    waDigits &&
    whatsAppMeUrl(
      buildWhatsAppMessage({ lessonTitle, lessonUrl, userPhone }),
      waDigits,
    );

  const partial = signedIn && grantCount > 0 && !fullAccess;

  return (
    <div className="lum-card space-y-4 p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lum-surface-container text-lum-primary"
          aria-hidden
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>
        <div className="min-w-0 space-y-2">
          <h3 className="font-display text-lg font-semibold text-lum-on-background">
            Video locked
          </h3>
          {!signedIn ? (
            <p className="text-sm leading-relaxed text-lum-on-surface-variant">
              Sign in to track access. Playback unlocks when your instructor
              approves your account or the lessons you&apos;ve paid for.
            </p>
          ) : partial && !hasLessonGrant ? (
            <p className="text-sm leading-relaxed text-lum-on-surface-variant">
              You have access to{" "}
              <strong className="text-lum-on-background">
                {grantCount} selected lesson{grantCount === 1 ? "" : "s"}
              </strong>{" "}
              only. This lesson isn&apos;t included. Contact your instructor to
              unlock more content.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-lum-on-surface-variant">
              Your account doesn&apos;t include this lesson yet. Ask your
              instructor to grant access (they can tie it to your phone number
              and an expiry date).
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        {!signedIn ? (
          <>
            <Link href="/login" className="lum-btn-primary px-5 py-2.5">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-lum-outline/35 px-5 py-2.5 text-sm font-semibold text-lum-on-background hover:bg-lum-surface-container-low"
            >
              Create account
            </Link>
          </>
        ) : null}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-92"
          >
            Message instructor on WhatsApp
          </a>
        ) : (
          <p className="text-xs text-lum-on-surface-variant">
            WhatsApp contact isn&apos;t configured yet (set{" "}
            <span className="font-mono">NEXT_PUBLIC_ADMIN_WHATSAPP</span>).
          </p>
        )}
      </div>
    </div>
  );
}
