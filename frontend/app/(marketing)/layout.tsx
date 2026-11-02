import "@/components/landing/landing.css";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingNavigation } from "@/components/landing/MarketingNavigation";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="dark"
      className="marketing-site min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <MarketingNavigation />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
