import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { LoadingBlock } from "@/components/loading-spinner";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16">
      <Suspense fallback={<LoadingBlock label="Loading" variant="zinc" className="py-12" />}>
        <div className="mx-auto w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Admin Sign In</h1>
          <LoginForm isAdmin={true} />
        </div>
      </Suspense>
    </div>
  );
}
