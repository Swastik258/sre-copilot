import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function Page() {
  return (
    <PageShell title="Docs" subtitle="Product overview, current scope, and local setup.">
      <div className="mt-10 max-w-4xl space-y-14">
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-semibold text-paper-50">What is in the current build</h2>
          <p className="mt-3 text-base leading-7 text-paper-300">
            SRE Copilot is an early interface for investigating reliability issues across Kubernetes, logs, CI/CD, and infrastructure code. The homepage combines a live backend health check with a sample diagnosis preview and links into the workspace routes.
          </p>
          <ul className="mt-5 list-inside list-disc space-y-2 text-base leading-7 text-paper-300">
            <li>The health indicator requests <code className="font-mono text-sm text-paper-100">/api/v1/health</code> from the backend every 15 seconds.</li>
            <li>The diagnosis preview is illustrative sample data; it is not generated from a connected cluster.</li>
            <li>Workspace and solution pages are currently route placeholders and do not run integrations.</li>
          </ul>
        </section>

        <section aria-labelledby="design-heading" className="border-t border-white/[0.08] pt-8">
          <h2 id="design-heading" className="text-xl font-semibold text-paper-50">Interface design</h2>
          <p className="mt-3 text-base leading-7 text-paper-300">
            The landing page and shared navigation use a cohesive dark navy palette with restrained blue accents, a subtle grid and ambient glow, clearer type hierarchy, and higher-contrast calls to action. Workspace cards and the diagnosis preview use consistent borders, rounded corners, and responsive layouts.
          </p>
          <ul className="mt-5 list-inside list-disc space-y-2 text-base leading-7 text-paper-300">
            <li>The navigation uses larger, easy-to-scan links and touch targets, with an expandable mobile menu; Escape, outside clicks, and route changes close it.</li>
            <li>Keyboard users receive a visible focus indicator, and reduced-motion preferences are respected.</li>
            <li>The home page retains its live API health check and clearly labels the diagnosis panel as illustrative sample data.</li>
          </ul>
        </section>

        <section aria-labelledby="audiences-heading" className="border-t border-white/[0.08] pt-8">
          <h2 id="audiences-heading" className="text-xl font-semibold text-paper-50">Workspace areas</h2>
          <p className="mt-3 text-base leading-7 text-paper-300">
            The navigation groups the app around platform teams, SRE and on-call, DevOps, customers, and resources. The audience descriptions are product direction, not a list of current customers.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link className="text-blue-300 hover:text-blue-200" href="/kubernetes">Kubernetes</Link>
            <Link className="text-blue-300 hover:text-blue-200" href="/logs">Logs</Link>
            <Link className="text-blue-300 hover:text-blue-200" href="/cicd">CI/CD</Link>
            <Link className="text-blue-300 hover:text-blue-200" href="/terraform">Terraform</Link>
            <Link className="text-blue-300 hover:text-blue-200" href="/infra-code">Infrastructure code</Link>
          </div>
        </section>

        <section aria-labelledby="auth-heading" className="border-t border-white/[0.08] pt-8">
          <h2 id="auth-heading" className="text-xl font-semibold text-paper-50">Authentication</h2>
          <p className="mt-3 text-base leading-7 text-paper-300">
            Clerk powers the navigation sign-in and sign-up modals and the signed-in user menu. Configure <code className="font-mono text-sm text-paper-100">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code className="font-mono text-sm text-paper-100">CLERK_SECRET_KEY</code> in <code className="font-mono text-sm text-paper-100">frontend/.env.local</code>. Keep the secret key private and out of source control.
          </p>
          <p className="mt-3 text-base leading-7 text-paper-300">
            Clerk middleware is enabled, but application routes are public until route protection is explicitly configured.
          </p>
        </section>

        <section aria-labelledby="run-heading" className="border-t border-white/[0.08] pt-8">
          <h2 id="run-heading" className="text-xl font-semibold text-paper-50">Run locally</h2>
          <ol className="mt-4 list-inside list-decimal space-y-3 text-base leading-7 text-paper-300">
            <li>From the repository root, start the stack with <code className="font-mono text-sm text-paper-100">docker compose -f deploy/docker-compose.yml up --build</code>.</li>
            <li>Open the web app at <code className="font-mono text-sm text-paper-100">http://localhost:3000</code>.</li>
            <li>The FastAPI health endpoint is <code className="font-mono text-sm text-paper-100">http://localhost:8000/api/v1/health</code>; its interactive API docs are at <code className="font-mono text-sm text-paper-100">http://localhost:8000/docs</code>.</li>
          </ol>
          <p className="mt-4 text-sm leading-6 text-paper-400">
            The frontend Docs page is at <code className="font-mono">/docs</code>; the backend Swagger page is on port 8000.
          </p>
        </section>

        <section aria-labelledby="history-heading" className="border-t border-white/[0.08] pt-8">
          <h2 id="history-heading" className="text-xl font-semibold text-paper-50">Project change history</h2>
          <p className="mt-3 text-base leading-7 text-paper-300">
            Summary of the implementation work completed for this project so far.
          </p>
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="text-base font-semibold text-paper-100">Modern interface refresh</h3>
              <p className="mt-2 text-sm leading-6 text-paper-300">
                Added the landing page grid, gradient headline, ambient lighting, and matching blue-accented workspace and diagnosis cards. Enlarged the shared navigation links, dropdowns, and touch targets, added a responsive mobile menu, and improved keyboard focus and reduced-motion behavior. The live health check and sample-data labels remain intact.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-paper-100">Backend dependencies</h3>
              <p className="mt-2 text-sm leading-6 text-paper-300">
                Added <code className="font-mono text-paper-100">backend/requirement.txt</code> with the six runtime dependencies declared by the backend package metadata: Alembic, FastAPI, Pydantic Settings, Psycopg, SQLAlchemy, and Uvicorn.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-paper-100">Frontend routes</h3>
              <p className="mt-2 text-sm leading-6 text-paper-300">
                Added placeholder pages for Platform teams, SRE on-call, DevOps, Customers, Case studies, Testimonials, Resources, Docs, Blog, Changelog, Support, and Pricing. The existing Solutions overview route was retained. These pages provide navigation destinations, not completed product features.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-paper-100">Visual styling and homepage</h3>
              <p className="mt-2 text-sm leading-6 text-paper-300">
                Updated the global stylesheet to Tailwind 4 syntax and connected the existing theme configuration. Restyled and enlarged the top navigation, added the multi-column homepage footer, increased workspace text sizing, and added team-audience and current-build sections. The team list describes intended users; it does not claim these organizations are customers.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-paper-100">Clerk authentication</h3>
              <p className="mt-2 text-sm leading-6 text-paper-300">
                Added ClerkProvider, the Next.js proxy middleware, local environment configuration, sign-in and sign-up modal buttons, and the signed-in user menu. Routes remain public until access rules are added.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-paper-100">Verification</h3>
              <p className="mt-2 text-sm leading-6 text-paper-300">
                Focused ESLint checks and production Next.js builds passed after the corresponding changes. The build reports a non-blocking module-type warning for the existing TypeScript Tailwind configuration.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}