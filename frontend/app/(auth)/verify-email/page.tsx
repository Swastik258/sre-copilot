import type { Metadata } from "next";
import { VerifyEmailStatus } from "@/components/AccountRecovery";

export const metadata: Metadata = {
  title: "Verify email · Tarn",
  description: "Confirm your email address for Tarn.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="w-full">
      <div className="auth-form-card">
        <VerifyEmailStatus />
      </div>
    </div>
  );
}
