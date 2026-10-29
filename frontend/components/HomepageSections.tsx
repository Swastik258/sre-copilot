import Link from "next/link";
import { FAQ } from "@/components/FAQ";
import { Analytics } from "@vercel/analytics/next"

const INTEGRATIONS = ["Kubernetes", "GitHub Actions", "Prometheus"];

export function HomepageSections() {
  return (
    <>
      <section className="packet-section packet-trust" aria-labelledby="home-trust-title">
        <div className="home-container packet-trust-grid">
          <h2 id="home-trust-title">Read-only by default.</h2>
          <p>
            Tarn gathers evidence from configured sources and leaves every
            infrastructure change to the operator.
          </p>
        </div>
      </section>
      <Analytics />


      <section
        className="packet-section packet-integrations"
        aria-labelledby="home-integrations-title"
      >
        <div className="home-container packet-integrations-grid">
          <div className="packet-section-copy">
            <h2 id="home-integrations-title">Built-in adapters.</h2>
            <p>Connect Tarn to the systems it currently supports.</p>
          </div>
          <ul className="packet-adapter-list">
            {INTEGRATIONS.map((integration) => (
              <li key={integration}>{integration}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="packet-section packet-faq"
        aria-labelledby="home-faq-title"
      >
        <div className="home-container packet-section-grid">
          <div className="packet-section-copy">
            <h2 id="home-faq-title">Answers stay attached to their sources.</h2>
          </div>
          <div className="packet-faq-content" aria-labelledby="home-faq-title">
            <FAQ />
          </div>
        </div>
      </section>

      <section className="packet-close" aria-labelledby="home-cta-title">
        <div className="home-container packet-close-inner">
          <div>
            <h2 id="home-cta-title">
              Make the next investigation easier to verify.
            </h2>
          </div>
          <Link href="/sign-up" className="packet-close-action">
            Start free
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.5 10h12m-5-5 5 5-5 5" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
