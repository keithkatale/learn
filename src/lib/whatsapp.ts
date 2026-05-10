/** NEXT_PUBLIC_ADMIN_WHATSAPP — digits only, country code included (no +). E.g. 256701234567 */
export function adminWhatsAppDigits(): string | null {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "").trim().replace(/\D/g, "");
  return raw.length >= 10 ? raw : null;
}

export function whatsAppMeUrl(message: string, phoneDigits: string): string {
  const clean = phoneDigits.replace(/\D/g, "");
  const q = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${q}`;
}
