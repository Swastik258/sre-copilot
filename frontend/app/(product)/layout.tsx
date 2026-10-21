import { TopNav } from "@/components/TopNav";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="ink"
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <TopNav />
      <main className="pt-16">{children}</main>
    </div>
  );
}
