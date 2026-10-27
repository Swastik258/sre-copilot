import Link from "next/link";
import Image from "next/image";
import { ContourField } from "@/components/ContourField";
import { DepthScale } from "@/components/editorial";

const DEPTH = [
  {
    mark: "0m",
    label: "Observed",
    detail: "Pod status, event, log line, plan change.",
  },
  {
    mark: "1m",
    label: "Evidence",
    detail: "The read-only payload behind the observation.",
  },
  {
    mark: "2m",
    label: "Hypothesis",
    detail: "An explanation with a confidence and citation.",
  },
];

export function AuthHeader() {
  return (
    <header className="auth-header" data-theme="paper">
      <div className="shell auth-header__inner">
        <Link href="/" className="site-brand" aria-label="Tarn home">
          <Image
            className="wordmark-paper"
            src="/tarn-wordmark.svg"
            alt="Tarn"
            width={124}
            height={37}
            priority
          />
          <Image
            className="wordmark-ink"
            src="/tarn-wordmark-ink.svg"
            alt=""
            aria-hidden
            width={124}
            height={37}
            priority
          />
        </Link>
        <Link href="/" className="auth-header__back">
          Back to home
        </Link>
      </div>
    </header>
  );
}

/** Two-column auth chrome: operating context beside the form. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="auth-shell" data-theme="paper">
      <ContourField className="auth-shell__contour" rings={9} />
      <div className="shell auth-shell__grid">
        <aside className="auth-shell__context">
          <p className="section-label">Read-only investigation</p>
          <h2 className="mt-4">
            Review the observation before the explanation.
          </h2>
          <p>
            Tarn investigates Kubernetes, logs, CI/CD, and Terraform. It reads,
            correlates, and explains — and tells you which evidence each
            conclusion rests on.
          </p>
          <DepthScale items={DEPTH} />
          <p className="auth-shell__note">
            Passwords are hashed, sessions use an HttpOnly cookie, and this
            deployment does not receive a cluster mutation credential.
          </p>
        </aside>

        <div className="auth-shell__form">
          <div className="auth-shell__form-inner">{children}</div>
        </div>
      </div>
    </section>
  );
}
