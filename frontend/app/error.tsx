"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Never echo exception text: it can contain request or account data.
    console.error("Unhandled UI error", { digest: error.digest ?? null });
  }, [error.digest]);

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 py-24 text-[var(--text)]">
      <div className="w-full max-w-xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--surface-shadow)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--danger)]">Unexpected error</p>
        <h1 className="mt-4 text-3xl font-semibold">This view could not be rendered.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          No infrastructure data was changed. Try the request again; if the error
          persists, check the browser console and the deployment logs with the
          reference below.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-[var(--text-muted)]">reference: {error.digest}</p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn-accent">Try again</button>
          <Link href="/" className="btn-ghost">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
