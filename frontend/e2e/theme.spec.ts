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
  expect(firstPaint.background?.match(/\d+/g)?.map(Number)).toEqual([246, 247, 248]);

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
