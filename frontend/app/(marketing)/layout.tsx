import { MarketingFooter } from "@/components/MarketingFooter";
import { TopNav } from "@/components/TopNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="paper"
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <TopNav />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
