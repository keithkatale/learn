import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16">
      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500">Loading…</p>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
