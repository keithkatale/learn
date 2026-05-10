import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";

export default function AdminRegisterPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Admin Registration</h1>
        <Suspense
          fallback={
            <p className="text-center text-sm text-zinc-500">Loading…</p>
          }
        >
          <RegisterForm isAdmin={true} />
        </Suspense>
      </div>
    </div>
  );
}
