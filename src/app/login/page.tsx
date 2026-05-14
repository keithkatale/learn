import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { LoadingBlock } from "@/components/loading-spinner";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16">
      <Suspense
        fallback={<LoadingBlock label="Loading" variant="zinc" className="py-12" />}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
