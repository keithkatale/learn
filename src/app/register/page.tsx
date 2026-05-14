import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";
import { LoadingBlock } from "@/components/loading-spinner";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16">
      <Suspense
        fallback={<LoadingBlock label="Loading" variant="zinc" className="py-12" />}
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
