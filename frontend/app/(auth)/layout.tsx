import { AuthHeader } from "@/components/AuthHeader";
import { AuthShell } from "@/components/AuthShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="paper"
      className="auth-page bg-[var(--bg)] text-[var(--text)]"
    >
      <AuthHeader />
      <main id="main-content" className="auth-main">
        <AuthShell>{children}</AuthShell>
      </main>
    </div>
  );
}
