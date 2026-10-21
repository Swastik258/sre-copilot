/**
 * Legacy compatibility shim.
 *
 * Clerk is intentionally unused: there are no `@clerk/nextjs` imports, no
 * provider, and no UI. Authentication is self-hosted in `lib/auth-client.tsx`
 * and the backend `/api/v1/auth/*` routes. This export remains false so any
 * stale caller cannot accidentally re-enable a third-party path.
 */
export const clerkEnabled = false;
