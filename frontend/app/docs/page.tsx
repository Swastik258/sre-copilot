import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { CTASection, Card, Icon } from "@/components/ui";

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-amber-600">{children}</code>;
}

function DocSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-b border-hairline py-10 first:pt-0 last:border-0">
      <h2 className="font-serif text-2xl tracking-tight text-paper-50">{title}</h2>
      <div className="mt-4 space-y-4 text-dense-lg leading-7 text-paper-300">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-dense text-paper-300">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DocsPage() {
  return (
    <>
      <PageShell
        eyebrow="Docs"
        title="Product overview, scope, and local setup"
        subtitle="Written to match the repository, not to oversell it. Where a feature is not built yet, these docs say so."
        actions={
          <>
            <Link href="/kubernetes" className="btn-accent">
              Try the live demo
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/changelog" className="btn-ghost">
              View the changelog
            </Link>
          </>
        }
      >
        <div className="shell py-16">
          <div className="max-w-3xl">
            <DocSection title="What is in the current build">
              <p>
                SRE Copilot is an early interface for investigating reliability issues
                across Kubernetes, logs, CI/CD, and infrastructure code. The promise is
                simple: diagnose failures with evidence, not guesses.
              </p>
              <Bullets
                items={[
                  <>
                    <strong className="text-paper-100">Live:</strong> read-only Kubernetes
                    diagnosis at <Link href="/kubernetes" className="link-editorial">/kubernetes</Link>{" "}
                    — crash loops, OOM kills, image-pull failures, scheduling, and probe
                    errors, each backed by cited evidence.
                  </>,
                  <>
                    <strong className="text-paper-100">Live:</strong> a health check at{" "}
                    <Code>/api/v1/health</Code> and an honest integration-status API at{" "}
                    <Code>/api/v1/integrations</Code>.
                  </>,
                  <>
                    <strong className="text-paper-100">Planned:</strong> the AI Assistant,
                    Logs, CI/CD, Terraform, infrastructure code, audit UI, and settings —
                    each labeled on its page with the milestone that ships it.
                  </>,
                ]}
              />
            </DocSection>

            <DocSection title="Interface & design system">
              <p>
                The interface uses a near-black surface with a single violet
                accent, a modern sans for headings and body, and a mono face for labels
                and evidence. Hairline borders, soft glows, and generous whitespace
                keep dense diagnostic content readable.
              </p>
              <Bullets
                items={[
                  "One accent color is used for emphasis; status colors are reserved for health.",
                  "Keyboard focus is always visible, and reduced-motion preferences are respected.",
                  "Every demo-backed record is labeled, so fixtures are never mistaken for real data.",
                ]}
              />
            </DocSection>

            <DocSection title="Workspace areas">
              <p>
                The navigation groups the app around product surfaces, solutions for
                platform, SRE and DevOps teams, customers, and resources. Audience
                descriptions are product direction — the project does not claim current
                customers.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {[
                  { label: "Kubernetes", href: "/kubernetes" },
                  { label: "Logs", href: "/logs" },
                  { label: "CI/CD", href: "/cicd" },
                  { label: "Terraform", href: "/terraform" },
                  { label: "Infrastructure code", href: "/infra-code" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="link-editorial">
                    {l.label}
                  </Link>
                ))}
              </div>
            </DocSection>

            <DocSection title="Authentication & keys">
              <p>
                Signup and sign-in are self-hosted. Accounts and sessions live in your own
                backend (<Code>/api/v1/auth/*</Code>): passwords are hashed with scrypt, and
                the session token is carried in an <Code>HttpOnly</Code> cookie — never
                exposed to JavaScript or returned in a response body. After signing in you
                land on the dashboard.
              </p>
              <p>
                API-wide enforcement is <strong>off by default</strong> so the demo and tests
                run without credentials. Set <Code>AUTH_REQUIRED=true</Code> to require a
                session on the read-only routes; health and the auth endpoints stay public.
                There is no authorization model yet — see the{" "}
                <Link href="/security" className="link-editorial">security notes</Link>{" "}
                before exposing the API publicly.
              </p>
              <p>
                Clerk remains optional: when <Code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</Code>{" "}
                and <Code>CLERK_SECRET_KEY</Code> are present at build time, the navigation
                uses Clerk&apos;s sign-in/sign-up modals instead of the local auth pages. AI
                provider keys are read on the backend only and are never sent to the browser.
              </p>
            </DocSection>

            <DocSection title="Run locally">
              <ol className="space-y-3">
                {[
                  <>
                    Start the stack from the repo root with{" "}
                    <Code>docker compose -f deploy/docker-compose.yml up --build</Code>.
                  </>,
                  <>
                    Open the web app at <Code>http://localhost:3000</Code>.
                  </>,
                  <>
                    The API is at <Code>http://localhost:8000</Code>; its interactive docs
                    are at <Code>http://localhost:8000/docs</Code>.
                  </>,
                  <>
                    For the Kubernetes demo, run the backend with{" "}
                    <Code>KUBERNETES_ENABLED=true</Code> and{" "}
                    <Code>KUBERNETES_DEMO_MODE=true</Code>.
                  </>,
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-dense text-paper-300">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full border border-hairline-strong bg-ink-800 font-mono text-[10px] text-paper-300">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </DocSection>

            <DocSection title="Project change history">
              <p>
                A short summary of the work completed so far. The full, current list lives
                in the <Link href="/changelog" className="link-editorial">changelog</Link>.
              </p>
              <div className="space-y-6">
                {[
                  {
                    t: "Milestone 2 — read-only Kubernetes diagnosis",
                    d: "Normalized models, a structurally read-only client, deterministic rules, evidence-backed diagnoses, REST endpoints, and a functional console.",
                  },
                  {
                    t: "Milestone 1 — foundation & evidence model",
                    d: "Fixed latent migration and ORM bugs, added validated config, structured logging, redaction, typed schemas, an integration-status API, CI, and docs.",
                  },
                  {
                    t: "Interface refresh",
                    d: "Moved the design system to a dark, modern palette with a violet accent and sans headings, added reusable UI primitives and a global footer, rebuilt every stub page with real content, and marked planned features honestly.",
                  },
                ].map((x) => (
                  <div key={x.t}>
                    <h3 className="font-serif text-lg text-paper-100">{x.t}</h3>
                    <p className="mt-1.5 text-dense text-paper-300">{x.d}</p>
                  </div>
                ))}
              </div>
            </DocSection>

            <Card className="mt-8 p-6">
              <h3 className="font-serif text-lg text-paper-50">Canonical reference</h3>
              <p className="mt-2 text-dense text-paper-300">
                The repository remains the source of truth. If anything on this page
                contradicts the code, the code wins.
              </p>
              <a
                href="https://github.com/Swastik258/sre-copilot"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-amber-500"
              >
                View the repository
                <Icon name="arrow" className="size-3.5" />
              </a>
            </Card>
          </div>
        </div>
      </PageShell>

      <CTASection
        title={
          <>
            Read the docs,
            <br />
            then break something.
          </>
        }
        body="Diagnose a labelled demo failure end to end — crash loop, OOM kill, image-pull error — without a cluster or a key."
        primary={{ label: "Open Kubernetes diagnostics", href: "/kubernetes" }}
        secondary={{ label: "See what's live", href: "/product" }}
      />
    </>
  );
}
