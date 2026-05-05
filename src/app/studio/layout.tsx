import Link from "next/link";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <nav className="mb-10 flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <Link href="/studio" className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50">Overview</Link>
        <Link href="/studio/lessons" className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50">Lessons</Link>
        <Link href="/studio/access" className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50">Access</Link>
      </nav>
      {children}
    </div>
  );
}
