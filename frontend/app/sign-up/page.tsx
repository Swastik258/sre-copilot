import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create account · SRE Copilot",
  description: "Create your local SRE Copilot account and open the dashboard.",
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
