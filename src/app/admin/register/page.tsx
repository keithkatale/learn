import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";
import { LoadingBlock } from "@/components/loading-spinner";

export default function AdminRegisterPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Admin Registration</h1>
        <Suspense
          fallback={<LoadingBlock label="Loading" variant="zinc" className="py-12" />}
        >
          <RegisterForm isAdmin={true} />
        </Suspense>
      </div>
    </div>
  );
}
