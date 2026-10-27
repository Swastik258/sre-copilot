import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/AccountRecovery";

export const metadata: Metadata = {
  title: "Choose a new password · Tarn",
  description: "Complete a single-use password reset.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="w-full">
      <div className="auth-form-card">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
