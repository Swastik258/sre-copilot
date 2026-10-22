/**
 * Dependency-free release smoke test.
 *
 * This intentionally uses Node's built-in fetch instead of a browser test
 * runner. It verifies that every product and marketing route renders a real
 * HTML document, plus metadata routes and the branded 404 from the production
 * build. Interactive browser E2E coverage still needs an explicitly approved
 * runner (see docs/TESTING.md).
 */
const base = (process.env.RELEASE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const routes = [
  "/",
  "/dashboard",
  "/kubernetes",
  "/logs",
  "/assistant",
  "/metrics",
  "/runbooks",
  "/audit",
  "/settings",
  "/terraform",
  "/infra-code",
  "/cicd",
  "/login",
  "/sign-up",
  "/docs",
  "/security",
];

const metadataChecks = [
  {
    path: "/robots.txt",
    status: 200,
    contentType: "text/plain",
    includes: ["Disallow: /dashboard/", "Sitemap:"],
  },
  {
    path: "/sitemap.xml",
    status: 200,
    contentType: "xml",
    includes: ["<urlset", "/security"],
  },
  {
    path: "/icon.svg",
    status: 200,
    contentType: "image/svg+xml",
    includes: ["<svg"],
  },
  {
    path: "/this-route-does-not-exist",
    status: 404,
    contentType: "text/html",
    includes: ["<!doctype html", "Page not found"],
  },
];

let failures = 0;

for (const route of routes) {
  try {
    const response = await fetch(`${base}${route}`, {
      headers: { accept: "text/html" },
      redirect: "follow",
    });
    const body = await response.text();
    const isHtml = body.toLowerCase().includes("<!doctype html");
    if (!response.ok || !isHtml) {
      failures += 1;
      console.error(
        `FAIL ${route} -> ${response.status} ${response.headers.get("content-type") ?? "no content-type"}`,
      );
    } else {
      console.log(`ok   ${route} -> ${response.status}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${route} -> ${error instanceof Error ? error.message : error}`);
  }
}

for (const check of metadataChecks) {
  try {
    const response = await fetch(`${base}${check.path}`, { redirect: "manual" });
    const body = (await response.text()).toLowerCase();
    const contentType = response.headers.get("content-type") ?? "";
    const missing = check.includes.filter(
      (value) => !body.includes(value.toLowerCase()),
    );
    if (
      response.status !== check.status ||
      !contentType.includes(check.contentType) ||
      missing.length > 0
    ) {
      failures += 1;
      console.error(
        `FAIL ${check.path} -> ${response.status} ${contentType || "no content-type"} (missing: ${missing.join(", ") || "none"})`,
      );
    } else {
      console.log(`ok   ${check.path} -> ${response.status}`);
    }
  } catch (error) {
    failures += 1;
    console.error(
      `FAIL ${check.path} -> ${error instanceof Error ? error.message : error}`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed the release smoke test.`);
  process.exit(1);
}

console.log(
  `\nAll ${routes.length} HTML routes and ${metadataChecks.length} metadata/error checks passed.`,
);
