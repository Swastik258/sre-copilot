import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in · SRE Copilot",
  description: "Sign in to your SRE Copilot dashboard.",
};

export default function Page() {
  return (
    <div className="w-full max-w-md">
      <div className="card p-8 sm:p-10">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
