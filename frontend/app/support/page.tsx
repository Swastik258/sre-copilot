import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CTASection, Icon, Section } from "@/components/ui";

const CHANNELS = [
  {
    icon: "flag" as const,
    title: "Report a bug",
    body: "Open an issue on GitHub with the failing command, the environment, and what you expected to see. Include the request id from the error response when you have one.",
    action: { label: "Open GitHub issues", href: "https://github.com/Swastik258/sre-copilot/issues" },
  },
  {
    icon: "assistant" as const,
    title: "Request a feature",
    body: "Describe the failure you keep hitting and what evidence would have explained it. Roadmap input comes directly from these requests.",
    action: { label: "Read the roadmap", href: "/changelog" },
  },
  {
    icon: "users" as const,
    title: "Join early access",
    body: "For teams who want to use SRE Copilot on real infrastructure, tell us what you run and we will set up a read-only pilot.",
    action: { label: "See the program", href: "/customers" },
  },
];

export default function SupportPage() {
  return (
    <>
      <PageShell
        eyebrow="Support"
        title="Get help, or help shape it"
        subtitle="SRE Copilot is in early access, so support is direct and honest. Tell us what broke and we will tell you exactly where it stands — including when a feature is not built yet."
        actions={
          <>
            <a
              href="https://github.com/Swastik258/sre-copilot/issues"
              className="btn-accent"
              rel="noreferrer"
            >
              Open an issue
              <Icon name="arrow" className="size-4" />
            </a>
            <Link href="/docs" className="btn-ghost">
              Read the docs
            </Link>
          </>
        }
      >
        <Section eyebrow="Channels" title="How to reach us">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CHANNELS.map((c) => (
              <Card key={c.title} hover className="flex h-full flex-col gap-4 p-6">
                <span className="grid size-10 place-items-center rounded-xl border border-hairline-strong bg-ink-800 text-amber-400">
                  <Icon name={c.icon} />
                </span>
                <h3 className="font-serif text-xl text-paper-50">{c.title}</h3>
                <p className="text-dense text-paper-300">{c.body}</p>
                <a
                  href={c.action.href}
                  className="mt-auto flex items-center gap-2 pt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-amber-500"
                  {...(c.action.href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {c.action.label}
                  <Icon name="arrow" className="size-3.5" />
                </a>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Before you ask"
          title="Two things worth checking first"
          lead="Most early questions are answered by the docs or by running the demo locally."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-serif text-lg text-paper-50">Is an integration configured?</h3>
              <p className="mt-2 text-dense text-paper-300">
                The console reports what is connected, what is in demo mode, and what is
                off. If a surface returns <code className="font-mono text-amber-300">503 not_configured</code>,
                it is disabled, not broken.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-serif text-lg text-paper-50">Run the offline demo</h3>
              <p className="mt-2 text-dense text-paper-300">
                The full stack runs with no keys and no cluster. Start it locally and
                diagnose a labelled demo pod before filing anything.
              </p>
            </Card>
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Something wrong?
            <br />
            We want to know.
          </>
        }
        body="Early feedback on misleading diagnoses is the most valuable input we get. It changes the rules directly."
        primary={{ label: "Open an issue", href: "https://github.com/Swastik258/sre-copilot/issues" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
      />
    </>
  );
}
