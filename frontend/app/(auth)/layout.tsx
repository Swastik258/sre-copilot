import { AuthHeader } from "@/components/AuthHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="ink"
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <AuthHeader />
      <main id="main-content" className="grid min-h-screen place-items-center px-6 py-24">
        {children}
      </main>
    </div>
  );
}
