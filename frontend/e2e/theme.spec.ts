import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/dashboard",
  "/dashboard/coming-soon",
  "/dashboard/upgrade",
  "/assistant",
  "/audit",
  "/cicd",
  "/history",
  "/infra-code",
  "/kubernetes",
  "/logs",
  "/metrics",
  "/runbooks",
  "/settings",
  "/terraform",
  "/admin/settings",
];
const themes = ["dark", "light"] as const;
const widths = [1440, 390] as const;

async function mockApi(page: Page) {
  await page.context().addCookies([{
    name: "sre_session",
    value: "theme-test-session",
    url: "http://127.0.0.1:3180",
  }]);
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/auth/me") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "theme-test-user",
          email: "operator@example.test",
          display_name: "Theme Test",
          role: "admin",
          tenant_id: "theme-test-tenant",
          is_active: true,
          created_at: "2026-01-01T00:00:00Z",
        }),
      });
      return;
    }

    const fixtures: Record<string, unknown> = {
      "/api/v1/investigations": { investigations: [], total: 0 },
      "/api/v1/integrations": { integrations: [], demo_mode: false },
      "/api/v1/account": {
        profile: { display_name: "Theme Test", email: "operator@example.test" },
        preferences: { theme: "system", notifications: false },
        integrations: { kubernetes: false, github: false, prometheus: false },
        api_keys: [],
        plan: "free",
        role: "admin",
      },
    };
    if (url.pathname in fixtures) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixtures[url.pathname]),
      });
      return;
    }

    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "test_api_unavailable",
          message: "API data is not part of this visual test.",
        },
      }),
    });
  });
}

async function openWorkspace(page: Page, route = "/dashboard") {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".workspace-header")).toBeVisible();
  await page.waitForLoadState("networkidle");
}

type Color = [number, number, number, number];

function parseColor(value: string): Color {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3
      ? [...hex[1]].map((channel) => `${channel}${channel}`).join("")
      : hex[1];
    return [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16),
      1,
    ];
  }

  const rgb = value.match(/^rgba?\(([^)]+)\)$/);
  const channels = rgb?.[1].match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) throw new Error(`Not a supported CSS color: ${value}`);
  return [channels[0], channels[1], channels[2], channels[3] ?? 1];
}

function composite(foreground: Color, background: Color): Color {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  return [
    (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
    alpha,
  ];
}

function luminance(color: Color) {
  const linear = color.slice(0, 3).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string, underlay?: string) {
  const parsedBackground = parseColor(background);
  const opaqueBackground = underlay
    ? composite(parsedBackground, parseColor(underlay))
    : parsedBackground;
  const effectiveForeground = composite(parseColor(foreground), opaqueBackground);
  const first = luminance(effectiveForeground);
  const second = luminance(opaqueBackground);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test("homepage hero and product preview fit supported viewport widths", async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await mockApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator(".hero-browser")).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "Diagnose any failure. Cite every fact.",
  })).toBeVisible();
  await expect(page.getByRole("region", {
    name: "Everything between your pod and the root cause.",
  })).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "From alert to answer in four steps.",
  })).toBeVisible();
  await expect(page.locator(".landing-workflow-card")).toHaveCount(4);
  await expect(page.getByRole("heading", {
    name: "Every live capability is free today.",
  })).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "Ready to make your next diagnosis easier to verify?",
  })).toBeVisible();
  await expect(page.locator(".landing-plan-card")).toHaveCount(3);
  await expect(page.locator(".landing-feature-photo")).toHaveAttribute("loading", "lazy");
  await expect(page.locator(".landing-workflow-photo")).toHaveAttribute("loading", "lazy");
  const heroBackground = await page.locator(".landing-hero-background").evaluate(
    (element) => element.getBoundingClientRect().toJSON(),
  );
  const heroHeading = await page.locator("#landing-hero-title").evaluate(
    (element) => element.getBoundingClientRect().toJSON(),
  );
  const heroStyles = await page.locator(".landing-mountain-image").evaluate((image) => ({
    opacity: Number.parseFloat(getComputedStyle(image).opacity),
    wordGap: Number.parseFloat(getComputedStyle(document.querySelector("#landing-hero-title")!).columnGap),
  }));
  expect(heroBackground.top).toBeLessThanOrEqual(heroHeading.top);
  expect(heroBackground.bottom).toBeGreaterThan(heroHeading.bottom);
  expect(heroStyles.opacity).toBeGreaterThan(0.5);
  expect(heroStyles.wordGap).toBeGreaterThan(5);
  expect(heroStyles.wordGap).toBeLessThan(16);

  for (const width of [1920, 1440, 1024, 768, 430, 390, 375]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      navBottom: document.querySelector(".landing-nav")?.getBoundingClientRect().bottom,
      heroTop: document.querySelector(".landing-hero")?.getBoundingClientRect().top,
      preview: document.querySelector(".hero-browser")?.getBoundingClientRect().toJSON(),
      contentWidth: document.documentElement.clientWidth,
      mainBackground: getComputedStyle(document.querySelector(".landing-page")!).backgroundColor,
    }));
    expect(layout.overflow).toBe(false);
    expect(layout.heroTop).toBeGreaterThanOrEqual(layout.navBottom ?? 0);
    expect(layout.preview?.width).toBeGreaterThan(300);
    expect(layout.preview?.left, `preview left edge at ${width}px`).toBeGreaterThanOrEqual(-1);
    expect((layout.preview?.left ?? 0) + (layout.preview?.width ?? 0))
      .toBeLessThanOrEqual(layout.contentWidth + 1);
    expect(layout.mainBackground).toBe("rgb(8, 8, 10)");
  }

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.locator("#landing-mobile-menu")).toBeVisible();
  await page.locator("#landing-mobile-menu").getByRole("link", { name: "Features" }).click();
  await expect(page).toHaveURL(/#features$/);
  expect(consoleErrors).toEqual([]);
});

test("Kubernetes setup options switch between documented configurations", async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const demoTab = page.getByRole("tab", { name: "Explore with fixtures" });
  const clusterTab = page.getByRole("tab", { name: "Use a local cluster" });
  await expect(demoTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#landing-kubernetes-config")).toContainText(
    "KUBERNETES_DEMO_MODE=true",
  );

  await clusterTab.click();
  await expect(clusterTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#landing-kubernetes-config")).toContainText(
    "KUBERNETES_DEMO_MODE=false",
  );
  await expect(page.locator("#landing-kubernetes-config")).toContainText(
    "KUBERNETES_CONTEXT=your-context",
  );
});

test("investigation tabs respond to input and pause autoplay for reduced motion", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const section = page.locator("#features");
  await section.scrollIntoViewIfNeeded();
  const diagnoseTab = page.getByRole("tab", { name: "Diagnose any pod" });
  const citedTab = page.getByRole("tab", { name: "Cited evidence" });
  const fastTriageTab = page.getByRole("tab", { name: "Fast triage" });
  await expect(diagnoseTab).toHaveAttribute("aria-selected", "true");

  await citedTab.click();
  await expect(citedTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", {
    name: "Trace findings back to their sources.",
  })).toBeVisible();
  await citedTab.press("ArrowRight");
  await expect(fastTriageTab).toHaveAttribute("aria-selected", "true");
  await expect(fastTriageTab).toBeFocused();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#features").scrollIntoViewIfNeeded();
  const initialTab = page.getByRole("tab", { name: "Diagnose any pod" });
  await expect(initialTab).toHaveAttribute("aria-selected", "true");
  await page.waitForTimeout(6500);
  await expect(initialTab).toHaveAttribute("aria-selected", "true");

  const completedSteps = page.locator(".landing-progress-card li[aria-current='step']");
  await expect(completedSteps).toHaveCount(1);
});

test("login and signup remain usable in desktop and mobile layouts", async ({ page }) => {
  for (const route of ["/login", "/sign-up"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".auth-packet")).toBeVisible();
    await expect(page.getByRole("heading", {
      name: route === "/login" ? "Welcome back" : "Create your Tarn account",
    })).toBeVisible();
    await expect(page.locator(".auth-form-panel form input").first()).toBeVisible();
    await expect(page.getByRole("button", {
      name: route === "/login" ? "Sign in" : "Create account",
    })).toBeVisible();
    const showPassword = page.getByRole("button", { name: "Show password" });
    await showPassword.click();
    await expect(page.locator("#password")).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
    if (route === "/sign-up") {
      await expect(page.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
      await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    }

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        cardWidth: Math.round(document.querySelector(".auth-packet")!.getBoundingClientRect().width),
      }));
      expect(layout.overflow).toBe(false);
      expect(layout.cardWidth).toBeLessThanOrEqual(width - 24);
    }
  }
});

test("workspace navigation, search, and profile menu remain available", async ({ page }) => {
  await mockApi(page);
  await openWorkspace(page);

  for (const group of ["Operations", "Intelligence", "Workspace"]) {
    await expect(
      page.getByRole("navigation", { name: "Workspace navigation" })
        .getByText(group, { exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Kubernetes diagnostics" })).toHaveAttribute("href", "/kubernetes");
  await expect(page.getByRole("link", { name: "Integrations", exact: true })).toHaveAttribute("href", "/settings#integrations");

  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeHidden();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.locator(".workspace-rail").first()).toHaveClass(/is-collapsed/);
  await page.getByRole("button", { name: "Expand sidebar" }).click();

  await page.getByRole("button", { name: "Open command palette" }).click();
  await expect(page.getByRole("dialog", { name: "Workspace command palette" })).toBeVisible();
  await page.keyboard.type("Metrics");
  await expect(page.getByRole("button", { name: /Metrics/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator(".workspace-profile > summary").click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "AI Assistant" })).toBeVisible();
  await page.getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "AI Assistant" }).click();
  await expect(page).toHaveURL(/\/assistant$/);
});

test("theme toggle follows system, persists, and has no first-paint mismatch", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await mockApi(page);
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    const probe = window as Window & {
      __firstPaintTheme?: string;
      __firstPaintBackground?: string;
    };
    probe.__firstPaintTheme = undefined;
    probe.__firstPaintBackground = undefined;
    new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => entry.name === "first-contentful-paint")) {
        probe.__firstPaintTheme = document.documentElement.dataset.theme;
        probe.__firstPaintBackground = getComputedStyle(document.documentElement).backgroundColor;
      }
    }).observe({ type: "paint", buffered: true });
  });

  await openWorkspace(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.waitForFunction(() => {
    const probe = window as Window & { __firstPaintTheme?: string };
    return probe.__firstPaintTheme !== undefined;
  });
  const firstPaint = await page.evaluate(() => {
    const probe = window as Window & {
      __firstPaintTheme?: string;
      __firstPaintBackground?: string;
    };
    return {
      theme: probe.__firstPaintTheme,
      background: probe.__firstPaintBackground,
    };
  });
  expect(firstPaint.theme).toBe("light");
  expect(firstPaint.background?.match(/\d+/g)?.map(Number)).toEqual([243, 245, 248]);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() =>
    page.evaluate(() => ({
      localStorage: localStorage.getItem("tarn-theme"),
      cookie: document.cookie.split("; ").find((value) => value.startsWith("tarn-theme=")),
    })),
  ).toEqual({ localStorage: "dark", cookie: "tarn-theme=dark" });

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await openWorkspace(page, "/settings");
  await page.getByRole("button", { name: "System", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("tarn-theme"))).toBe("system");
  expect(consoleErrors).toEqual([]);
});

test("theme text and status tokens meet WCAG AA contrast", async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ colorScheme: "light" });

  for (const theme of themes) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.evaluate((value) => {
      localStorage.setItem("tarn-theme", value);
      document.cookie = `tarn-theme=${value}; Path=/; SameSite=Lax`;
    }, theme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    const { colors, badges } = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const colors = Object.fromEntries(
        ["bg", "surface", "surface-raised", "text", "text-muted", "accent", "danger", "warning", "success", "info", "focus-ring"]
          .map((name) => [name, style.getPropertyValue(`--${name}`).trim()]),
      ) as Record<string, string>;
      const probe = document.createElement("div");
      probe.className = "workspace-shell";
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
      document.body.append(probe);
      const badges = ["good", "warn", "bad", "neutral"].map((tone) => {
        const badge = document.createElement("span");
        badge.className = `badge badge-${tone}`;
        probe.append(badge);
        const badgeStyle = getComputedStyle(badge);
        return {
          foreground: badgeStyle.color,
          background: badgeStyle.backgroundColor,
        };
      });
      probe.remove();
      return { colors, badges };
    });
    for (const [name, value] of Object.entries(colors)) {
      expect(value, `${name} token should be defined`).not.toBe("");
    }
    const background = colors.bg;
    const surfaces = [colors.bg, colors.surface, colors["surface-raised"]];

    for (const foreground of [
      colors.text,
      colors["text-muted"],
      colors.accent,
      colors.danger,
      colors.warning,
      colors.success,
      colors.info,
      colors["focus-ring"],
    ]) {
      for (const surface of surfaces) {
        expect(contrast(foreground, surface)).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast(colors.text, background)).toBeGreaterThanOrEqual(4.5);
    for (const badge of badges) {
      expect(contrast(badge.foreground, badge.background, colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("captures every dashboard route at mobile and desktop sizes in both themes", async ({ page }) => {
  test.setTimeout(300_000);
  await mockApi(page);
  const output = join(process.cwd(), "test-results", "theme-screenshots");

  for (const theme of themes) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openWorkspace(page);
    await page.evaluate((value) => {
      localStorage.setItem("tarn-theme", value);
      document.cookie = `tarn-theme=${value}; Path=/; SameSite=Lax`;
    }, theme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    for (const route of routes) {
      const slug = route.slice(1).replaceAll("/", "__");
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await openWorkspace(page, route);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(documentWidth, `${route} overflows at ${width}px in ${theme} theme`).toBeLessThanOrEqual(width);
        const directory = join(output, theme, String(width));
        await mkdir(directory, { recursive: true });
        await page.screenshot({
          path: join(directory, `${slug}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }

      if (route === "/dashboard") {
        await page.setViewportSize({ width: 1024, height: 768 });
        await openWorkspace(page, route);
        const directory = join(output, theme, "1024");
        await mkdir(directory, { recursive: true });
        await page.screenshot({
          path: join(directory, "dashboard.png"),
          fullPage: true,
          animations: "disabled",
        });
      }
    }
  }
});
