import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create account · SRE Copilot",
  robots: { index: false, follow: false },
  description: "Create your account and personal workspace.",
};

export default function Page() {
  return (
    <div className="w-full max-w-md">
      <div className="card p-8 sm:p-10">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
