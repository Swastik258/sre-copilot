import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Clerk middleware is only installed when the app is configured with Clerk keys.
 * Without them we install the local (self-hosted) auth guard so the demo app
 * boots with no third-party credentials.
 */
const enabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

/** Route prefixes that require a session. Must match the backend cookie name. */
const PROTECTED_PREFIXES = ["/dashboard"];
const SESSION_COOKIE = "sre_session";

/**
 * Redirect unauthenticated visitors away from protected pages.
 *
 * This only checks that the session cookie is *present*; the cookie's validity
 * is verified by the backend on every API call, so a forged cookie cannot read
 * data — it can only render an empty dashboard shell.
 */
function localAuthGuard(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // The login form always returns to the dashboard, so no `next` param.
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export default enabled ? clerkMiddleware() : localAuthGuard;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
