import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomepageSections } from "@/components/HomepageSections";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Tarn — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
};

export default function Page() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-container home-hero-layout">
          <div className="home-hero-copy">
            <p className="home-eyebrow">Infrastructure diagnosis</p>
            <h1 id="home-title">Infrastructure diagnosis you can verify.</h1>
            <p className="home-lead">
              Follow every finding back to the source evidence behind it.
            </p>
            <div className="home-actions">
              <Link href="/sign-up" className="home-button home-button-primary">
                Get started
              </Link>
              <Link href="/docs" className="home-button home-button-secondary">
                Read the docs
              </Link>
            </div>
          </div>
          <div className="home-product-shot">
            <div className="home-visual-mark" aria-hidden="true">
              <Image
                src="/tarn-wordmark-ink.svg"
                alt=""
                width={444}
                height={132}
              />
            </div>
            <div className="home-shot-frame">
              <Image
                src="/images/tarn-workspace-empty.png"
                alt="Tarn dashboard showing the empty recent investigations panel"
                width={1068}
                height={336}
                priority
              />
            </div>
            <div className="home-float-card home-float-card-evidence">
              <span className="home-float-label">Evidence</span>
              <span>Linked to source records</span>
            </div>
            <div className="home-float-card home-float-card-findings">
              <span className="home-float-label">Findings</span>
              <span>Facts kept distinct from hypotheses</span>
            </div>
          </div>
        </div>
      </section>
      <HomepageSections />
    </div>
  );
}
