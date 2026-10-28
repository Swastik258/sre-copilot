import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthPacket } from "@/components/AuthPacket";

export const metadata: Metadata = {
  title: "Sign in · Tarn",
  robots: { index: false, follow: false },
  description: "Sign in to your Tarn workspace.",
};

export default function Page() {
  return (
    <AuthPacket>
      <AuthForm mode="login" />
    </AuthPacket>
  );
}
