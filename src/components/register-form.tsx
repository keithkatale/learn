"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setPending(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const creatorEmail =
        (process.env.NEXT_PUBLIC_CREATOR_EMAIL ?? "").trim().toLowerCase();
      const role = email === creatorEmail ? "CREATOR" : "VIEWER";
      await supabase.from("User").upsert({
        id: userId,
        email,
        role,
        name: email.split("@")[0],
      });
    }

    setPending(false);
    router.push("/login?registered=1");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create account</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Register with Supabase auth credentials.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" />
        <input name="password" type="password" minLength={8} required placeholder="Password (min 8 chars)" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" />
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <button type="submit" disabled={pending} className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
          {pending ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Sign in</Link>
      </p>
    </div>
  );
}
