"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UgPhoneInput } from "@/components/ug-phone-input";
import { isValidUgE164 } from "@/lib/ug-phone";

export function LoginForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? (isAdmin ? "/studio" : "/");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");

    if (!isAdmin) {
      const phone = String(fd.get("phone") ?? "").trim();
      if (!isValidUgE164(phone)) {
        setPending(false);
        setError(
          "Enter a complete Ugandan mobile number (9 digits after +256).",
        );
        return;
      }

      const res = await fetch("/api/auth/learner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      setPending(false);
      if (!res.ok) {
        setError(
          typeof json.error === "string"
            ? json.error
            : "Sign-in failed. Try again.",
        );
        return;
      }

      router.push(callbackUrl);
      router.refresh();
      return;
    }

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email") ?? "").trim().toLowerCase(),
      password,
    });

    setPending(false);
    if (signErr) {
      setError(signErr.message || "Invalid credentials.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isAdmin ? (
          <input
            name="email"
            type="email"
            required
            placeholder="Admin Email"
            className="lum-input"
          />
        ) : (
          <UgPhoneInput />
        )}
        <input
          name="password"
          type="password"
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
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
