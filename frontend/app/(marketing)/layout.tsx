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
      <main id="main-content" className="site-main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
