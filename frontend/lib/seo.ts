const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string | undefined): string {
  const configured = value?.trim();
  if (!configured) return FALLBACK_SITE_URL;

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return url.origin;
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an absolute http(s) origin, for example https://app.example.com.",
    );
  }
}

/**
 * Public origin used for canonical metadata, robots, and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL at build time for a deployed environment.
 */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
