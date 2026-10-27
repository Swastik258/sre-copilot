import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in · Tarn",
  robots: { index: false, follow: false },
  description: "Sign in to your Tarn workspace.",
};

export default function Page() {
  return (
    <div className="w-full">
      <div className="auth-form-card">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
