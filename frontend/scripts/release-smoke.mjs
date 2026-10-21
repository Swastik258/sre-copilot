/**
 * Dependency-free release smoke test.
 *
 * This intentionally uses Node's built-in fetch instead of a browser test
 * runner. It verifies that every product and marketing route renders a real
 * HTML document from the production build. Interactive browser E2E coverage
 * still needs an explicitly approved runner (see docs/TESTING.md).
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

if (failures > 0) {
  console.error(`\n${failures} route(s) failed the release smoke test.`);
  process.exit(1);
}

console.log(`\nAll ${routes.length} routes returned an HTML document.`);
