import Image from "next/image";
import Link from "next/link";
import { FAQ } from "@/components/FAQ";
import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    title: "Collect",
    body: "Connect a supported source and choose the system you need to inspect.",
  },
  {
    title: "Inspect",
    body: "Review observations, events, logs, and their evidence references.",
  },
  {
    title: "Assess",
    body: "Compare ranked hypotheses with the facts before choosing what to do.",
  },
];

const INTEGRATIONS = ["Kubernetes", "GitHub Actions", "Prometheus"];

export function HomepageSections() {
  return (
    <>
      <Reveal duration={0.25}>
        <section className="home-section" aria-labelledby="home-how-title">
          <div className="home-container home-grid">
            <div className="home-section-heading">
              <p className="home-eyebrow">How diagnosis works</p>
              <h2 id="home-how-title">A short path from signal to source.</h2>
            </div>
            <ol className="home-step-list">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="home-step-index">{`0${index + 1}`}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      <Reveal duration={0.25}>
        <section className="home-burst" aria-labelledby="home-burst-title">
          <div className="home-container home-burst-layout">
            <div className="home-section-heading">
              <p className="home-eyebrow">A clear path through an incident</p>
              <h2 id="home-burst-title">Start with evidence. Keep the context.</h2>
              <p>
                Move from source records to a diagnosis without losing the
                details that support it.
              </p>
            </div>
            <div className="home-burst-shot">
              <Image
                src="/images/tarn-workspace-empty.png"
                alt="Tarn dashboard showing the empty recent investigations panel"
                width={1068}
                height={336}
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal duration={0.25}>
        <section className="home-section" aria-labelledby="home-trust-title">
          <div className="home-container home-grid home-trust">
            <p className="home-eyebrow">Trust</p>
            <div>
              <h2 id="home-trust-title">Read-only by default.</h2>
              <p>
                Tarn gathers evidence from configured sources and leaves every
                infrastructure change to the operator.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal duration={0.25}>
        <section className="home-section" aria-labelledby="home-integrations-title">
          <div className="home-container home-grid">
            <div className="home-section-heading">
              <p className="home-eyebrow">Integrations</p>
              <h2 id="home-integrations-title">Built-in adapters.</h2>
              <p>Connect Tarn to the systems it currently supports.</p>
            </div>
            <ul className="home-integration-list">
              {INTEGRATIONS.map((integration) => (
                <li key={integration}>{integration}</li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal duration={0.25}>
        <FAQ />
      </Reveal>

      <Reveal duration={0.25}>
        <section className="home-cta-band" aria-labelledby="home-cta-title">
          <div className="home-container home-cta-content">
            <div>
              <p className="home-eyebrow">Tarn</p>
              <h2 id="home-cta-title">
                Make the next investigation easier to verify.
              </h2>
            </div>
            <Link href="/sign-up" className="home-button home-button-primary">
              Get started
            </Link>
          </div>
        </section>
      </Reveal>
    </>
  );
}
