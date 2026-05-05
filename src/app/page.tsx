import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <div className="max-w-lg space-y-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Learning platform
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Creator uploads lessons, learners access by enrollment.
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          This build now uses Supabase client auth/data with anon key and URL.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/login" className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">Sign in</Link>
          <Link href="/register" className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900">Register</Link>
        </div>
      </div>
    </div>
  );
}
