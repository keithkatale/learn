import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto max-w-md flex-1 px-4 py-20">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Invite link</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Register first, then ask the creator to grant access. Invite token: <span className="font-mono">{token}</span>
      </p>
      <p className="mt-6 text-sm">
        <Link href="/register" className="text-indigo-600 hover:underline dark:text-indigo-400">Go to register</Link>
      </p>
    </div>
  );
}
