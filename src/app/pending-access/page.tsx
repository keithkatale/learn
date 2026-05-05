import Link from "next/link";

export default function PendingAccessPage() {
  return (
    <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Pending access</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Ask the instructor to grant access from Studio.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/" className="text-indigo-600 hover:underline dark:text-indigo-400">Back home</Link>
      </p>
    </div>
  );
}
