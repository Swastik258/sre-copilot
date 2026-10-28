import { AuthHeader } from "@/components/AuthHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="ink"
      className="auth-page min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <AuthHeader />
      <main id="main-content" className="auth-main grid place-items-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
