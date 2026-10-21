import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create account · SRE Copilot",
  description: "Create your local SRE Copilot account and open the dashboard.",
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
