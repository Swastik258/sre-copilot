import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/AccountRecovery";

export const metadata: Metadata = {
  title: "Choose a new password · SRE Copilot",
  description: "Complete a single-use password reset.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="w-full max-w-md">
      <div className="card p-8 sm:p-10">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
