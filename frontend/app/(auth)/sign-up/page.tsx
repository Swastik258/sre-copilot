import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create account · Tarn",
  robots: { index: false, follow: false },
  description: "Create your account and personal workspace.",
};

export default function Page() {
  return (
    <div className="w-full">
      <div className="auth-form-card">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
