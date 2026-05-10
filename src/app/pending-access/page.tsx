import Link from "next/link";
import { adminWhatsAppDigits, whatsAppMeUrl } from "@/lib/whatsapp";

export default function PendingAccessPage() {
  const digits = adminWhatsAppDigits();
  const waUrl = digits
    ? whatsAppMeUrl(
        "Hi — I'd like access to lessons on Learn with Jovan. My account is registered with my phone number. Please let me know the next steps.",
        digits,
      )
    : null;

  return (
    <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center">
      <h1 className="font-display text-xl font-semibold text-lum-on-background">
        Pending access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-lum-on-surface-variant">
        Your instructor grants access from Studio by phone number — either the
        full catalog or specific lessons with an expiry date.
      </p>
      {waUrl ? (
        <p className="mt-6 text-sm">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-5 py-2.5 font-semibold text-white hover:opacity-92"
          >
            Message instructor on WhatsApp
          </a>
        </p>
      ) : null}
      <p className="mt-6 text-sm">
        <Link href="/" className="font-semibold text-lum-primary hover:underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
