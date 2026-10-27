import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const PUBLIC_ROUTES = [
  "/",
  "/product",
  "/solutions",
  "/solutions/platform",
  "/solutions/sre",
  "/solutions/devops",
  "/pricing",
  "/security",
  "/docs",
  "/resources",
  "/blog",
  "/changelog",
  "/customers",
  "/customers/case-studies",
  "/customers/testimonials",
  "/support",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
