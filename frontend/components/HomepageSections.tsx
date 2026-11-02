import Link from "next/link";
import { FAQ } from "@/components/FAQ";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { InvestigationFeature } from "@/components/landing/InvestigationFeature";
import { Analytics } from "@vercel/analytics/next";

const INTEGRATIONS = ["Kubernetes", "GitHub Actions", "Prometheus"];
export function HomepageSections() {
  const isVercelDeployment = process.env.VERCEL === "1";

  return (
    <>
      {isVercelDeployment ? <Analytics /> : null}

      <InvestigationFeature />

      <HowItWorks />

      <section
        className="marketing-integrations"
        aria-labelledby="home-integrations-title"
      >
          <div className="shell marketing-integrations-grid">
            <div className="marketing-section-heading">
              <p className="marketing-section-label">Supported sources</p>
              <h2 id="home-integrations-title">Connect the systems you investigate.</h2>
              <p>
                Built-in adapters are available for Kubernetes, GitHub Actions,
                and Prometheus.
              </p>
            </div>
            <ul className="marketing-integration-list">
              {INTEGRATIONS.map((integration) => (
                <li key={integration}>
                  <span aria-hidden="true" />
                  {integration}
                </li>
              ))}
            </ul>
          </div>
      </section>

      <section className="marketing-trust" aria-labelledby="home-trust-title">
          <div className="shell marketing-trust-grid">
            <div>
              <p className="marketing-section-label">Operational control</p>
              <h2 id="home-trust-title">Read-only by default.</h2>
            </div>
            <div>
              <p>
                Tarn gathers evidence from configured sources and leaves every
                infrastructure change to the operator. Hypotheses are presented
                for review; generated changes are proposals, not applied actions.
              </p>
              <Link href="/security" className="marketing-text-link">
                Read about security <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
      </section>

      <section className="marketing-faq" aria-labelledby="home-faq-title">
          <div className="shell marketing-faq-grid">
            <div className="marketing-section-heading">
              <p className="marketing-section-label">Questions</p>
              <h2 id="home-faq-title">Answers stay attached to their sources.</h2>
            </div>
            <div className="marketing-faq-content">
              <FAQ />
            </div>
          </div>
      </section>

      <Pricing />

      <section className="marketing-close" aria-labelledby="home-cta-title">
        <div className="shell marketing-close-inner">
          <div>
            <h2 id="home-cta-title">Make the next investigation easier to verify.</h2>
            <p>Start with the evidence. Keep the decision with your team.</p>
          </div>
          <Link href="/sign-up" className="btn-accent">
            Get started
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12m-5-5 5 5-5 5" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
