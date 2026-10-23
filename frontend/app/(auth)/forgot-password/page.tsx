import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/AccountRecovery";

export const metadata: Metadata = {
  title: "Reset password · Tarn",
  description: "Request a single-use password reset link for your account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="w-full max-w-md">
      <div className="card p-8 sm:p-10">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
