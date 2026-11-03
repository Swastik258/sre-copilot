import { InvestigationFeature } from "@/components/landing/InvestigationFeature";
import { LandingRemainder } from "@/components/landing/LandingRemainder";
import { Analytics } from "@vercel/analytics/next";

export function HomepageSections() {
  const isVercelDeployment = process.env.VERCEL === "1";

  return (
    <>
      {isVercelDeployment ? <Analytics /> : null}

      <InvestigationFeature />
      <LandingRemainder />
    </>
  );
}
