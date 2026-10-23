import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions" },
  title: "Solutions — Tarn",
  description:
    "Evidence-backed diagnosis for platform teams, SRE on-call, and DevOps review.",
};

const AUDIENCES = [
  {
    title: "Platform teams",
    body: "Standardize how incidents are diagnosed across clusters, services, and pipelines. One read-only evidence contract instead of tribal knowledge.",
    href: "/solutions/platform",
    label: "For platform teams",
  },
  {
    title: "SRE on-call",
    body: "Get to the two or three facts that explain the page, with ranked hypotheses and cited next steps to review at 03:00.",
    href: "/solutions/sre",
    label: "For SRE on-call",
  },
  {
    title: "DevOps",
    body: "Review failures and infrastructure changes before production. Explain the failing step or the destructive plan line before it becomes an incident.",
    href: "/solutions/devops",
    label: "For DevOps",
  },
];

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Solutions</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        One diagnosis layer, three ways to use it.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Tarn is built for the people who have to explain a failure under
        time pressure. The same evidence model serves platform standards,
        on-call triage, and pre-production review.
      </p>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {AUDIENCES.map((audience) => (
          <article key={audience.title} className="card flex flex-col p-6">
            <span className="label-caps">{audience.label}</span>
            <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
              {audience.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {audience.body}
            </p>
            <Link
              href={audience.href}
              className="link-editorial mt-6 text-sm"
            >
              Read the solution
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap gap-3">
        <Link href="/assistant" className="btn-accent">
          Start an investigation
        </Link>
        <Link href="/product" className="btn-ghost">
          See the product
        </Link>
      </div>
    </div>
  );
}
