"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ContourField } from "@/components/ContourField";

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
    <main
      id="main-content"
      data-theme="ink"
      className="error-page"
    >
      <ContourField className="error-page__contour" rings={9} />
      <section className="shell error-page__inner">
        <p className="section-label">Unexpected error</p>
        <h1>This view could not be rendered.</h1>
        <p className="error-page__lead">
          No infrastructure data was changed. Try the request again; if the
          error persists, check the deployment logs with the reference below.
        </p>
        {error.digest ? (
          <p className="error-page__reference">reference: {error.digest}</p>
        ) : null}
        <div className="page-actions">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-glass">
            Back to home
          </Link>
        </div>
        <p className="error-page__note">
          The raw exception is not shown here because it can contain request or
          account data.
        </p>
      </section>
    </main>
  );
}
