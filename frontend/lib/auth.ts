/**
 * Optional authentication configuration.
 *
 * Clerk is only active when a publishable key is present at build time. When it
 * is absent the application runs in demo mode with no sign-in, so local
 * development never requires third-party credentials.
 *
 * NOTE: this gates the *UI* only. The backend does not yet enforce
 * authentication — see docs/SECURITY.md before exposing the API publicly.
 */

export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
