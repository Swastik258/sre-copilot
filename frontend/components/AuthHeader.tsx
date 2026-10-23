import Link from "next/link";

export function AuthHeader() {
  return (
    <header className="border-b border-[var(--border)]">
      <div className="shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm font-semibold text-[var(--text)]"
        >
          <span className="grid size-8 place-items-center border border-[var(--border-strong)] bg-[var(--bg-subtle)] font-mono text-xs font-semibold text-[var(--accent)]">
            T
          </span>
          <span>Tarn</span>
        </Link>
        <Link href="/" className="link-editorial text-sm">
          Back to home
        </Link>
      </div>
    </header>
  );
}
