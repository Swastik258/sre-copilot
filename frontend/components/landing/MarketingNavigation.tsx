"use client";

import { usePathname } from "next/navigation";
import { LandingNav } from "@/components/landing/Nav";
import { TopNav } from "@/components/TopNav";

export function MarketingNavigation() {
  const pathname = usePathname();

  return pathname === "/" ? <LandingNav /> : <TopNav />;
}
