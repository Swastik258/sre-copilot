import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthPacket } from "@/components/AuthPacket";

export const metadata: Metadata = {
  title: "Create account · Tarn",
  robots: { index: false, follow: false },
  description: "Create an account to use Tarn.",
};

export default function Page() {
  return (
    <AuthPacket>
      <AuthForm mode="signup" />
    </AuthPacket>
  );
}
