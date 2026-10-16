import { PageShell } from "@/components/PageShell";
import { Badge, CTASection, Card, Section } from "@/components/ui";

const POSTS = [
  {
    tag: "Architecture",
    date: "Oct 2026",
    title: "Read-only by construction, not by promise",
    excerpt:
      "Most tools say 'read-only' and mean 'we chose not to write'. We removed the write path entirely: the Kubernetes client has no create, update, patch, or delete methods, and a test fails the build if one ever appears. Safety that depends on discipline erodes; safety that is structural does not.",
  },
  {
    tag: "Evidence",
    date: "Oct 2026",
    title: "Facts first: separating observations from hypotheses",
    excerpt:
      "A diagnosis is only useful if you can tell what is known from what is guessed. Every result splits into confirmed observations, each tied to a stable evidence id, and ranked hypotheses that cite those ids. When a hypothesis has no evidence behind it, the UI says so.",
  },
  {
    tag: "Honesty",
    date: "Oct 2026",
    title: "Demo mode without fake data",
    excerpt:
      "Demo mode is a label, not a fallback. Integration status reports what is actually configured, and every fixture-backed record carries demo: true through the API and into the UI badge. Nothing in the product presents sample data as if it came from a real cluster.",
  },
  {
    tag: "Tooling",
    date: "Oct 2026",
    title: "Why the model never gets a shell",
    excerpt:
      "The AI can only request a fixed set of schema-validated read operations, and a separate policy layer decides whether each request runs. There is no code path from a model response to an unrestricted command, which is what lets you use it on production at all.",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageShell
        eyebrow="Blog"
        title="Engineering notes"
        subtitle="Short, technical write-ups about building a diagnosis tool that has to be trustworthy. These describe decisions in the actual codebase, not aspirational marketing."
      >
        <Section>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {POSTS.map((p) => (
              <Card key={p.title} hover className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <Badge tone="warn">{p.tag}</Badge>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
                    {p.date}
                  </span>
                </div>
                <h2 className="font-serif text-xl text-paper-50">{p.title}</h2>
                <p className="text-dense text-paper-300">{p.excerpt}</p>
              </Card>
            ))}
          </div>

          <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
            Full posts publish as the project matures · principles are already enforced in the repo
          </p>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Read the code,
            <br />
            not just the prose.
          </>
        }
        body="Every claim in these notes maps to something in the repository — a schema, a test, or a documented limitation."
        primary={{ label: "Read the docs", href: "/docs" }}
        secondary={{ label: "View the changelog", href: "/changelog" }}
      />
    </>
  );
}
