"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UgPhoneInput } from "@/components/ug-phone-input";
import { e164ToUgNationalDigits, isValidUgE164 } from "@/lib/ug-phone";

export function RegisterForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const learnerDestination = searchParams.get("callbackUrl") ?? "/";
  const phoneFromQuery = searchParams.get("phone");
  const phonePrefillNational = useMemo(() => {
    const raw = phoneFromQuery?.trim() ?? "";
    if (!raw || !isValidUgE164(raw)) return "";
    return e164ToUgNationalDigits(raw);
  }, [phoneFromQuery]);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");

    let phoneE164: string | null = null;
    if (!isAdmin) {
      const raw = String(fd.get("phone") ?? "").trim();
      if (!isValidUgE164(raw)) {
        setPending(false);
        setError(
          "Enter a complete Ugandan mobile number (9 digits after +256).",
        );
        return;
      }
      phoneE164 = raw;

      const res = await fetch("/api/auth/learner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phoneE164, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setPending(false);
      if (!res.ok) {
        setError(
          typeof json.error === "string"
            ? json.error
            : "Registration failed. Try again.",
        );
        return;
      }

      router.push(learnerDestination);
      router.refresh();
      return;
    }

    const { data, error: signErr } = await supabase.auth.signUp({
      email: String(fd.get("email") ?? "").trim().toLowerCase(),
      password,
    });

    if (signErr) {
      setPending(false);
      setError(signErr.message);
      return;
    }

    const userId = data.user?.id;
    const adminEmail = String(fd.get("email") ?? "").trim().toLowerCase();
    if (userId) {
      await supabase.from("User").upsert({
        id: userId,
        email: adminEmail,
        phone: null,
        role: "CREATOR",
      });
    }

    setPending(false);
    router.push("/admin/login?registered=1");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <form onSubmit={onSubmit} className="space-y-4">
        {isAdmin ? (
          <input
            name="email"
            type="email"
            required
            placeholder="Admin Email"
            className="lum-input"
          />
        ) : (
          <UgPhoneInput
            initialNationalDigits={
              phonePrefillNational ? phonePrefillNational : undefined
            }
          />
        )}
        <input
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="Password"
          className="lum-input lum-input--pill"
        />
        {error ? (
          <p className="border-b-2 border-lum-error px-1 pb-1 text-sm text-lum-error">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="lum-btn-primary w-full">
          {pending ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
