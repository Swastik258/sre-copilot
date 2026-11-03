---
version: 1
slug: "frontend-app-auth-pages"
primary_target: "frontend/app/(auth)/login/page.tsx"
related_targets:
  - "frontend/app/(auth)/sign-up/page.tsx"
  - "frontend/components/AuthForm.tsx"
  - "frontend/components/AuthPacket.tsx"
---

# Tarn account access

## Scope and visitor mode
Redesign the sign-in and account-creation routes as focused account tasks. Operate.

## Audience, job, action, proof, constraints
Returning and prospective Tarn users need to sign in or create an account. Their primary action is to complete the existing authentication flow. Preserve password authentication, provider discovery, password visibility, account recovery, navigation, and submission states. Signup intentionally has no confirmation-password field. Do not imply account features, security guarantees, or authentication providers that are not implemented.

## Direction contract
### THESIS
Account access should feel like a quiet, confident entry point to Tarn: direct about the form, unmistakable in its wordmark, and grounded in the evidence-focused product.

### OWN-WORLD
Use a dark graphite canvas, near-white type, soft white field borders, a cool blue focus accent, and restrained rounded controls. Preserve the Tarn ring-mark wordmark. Use the existing mountain hero image in an inset, rounded image panel with a dark overlay and faint animated ripples.

### STORY
Keep account access primary. The image panel communicates only real product capabilities: read-only diagnosis, cited evidence, and the distinction between facts and hypotheses. Retain the read-only principle without adding unsupported product or security claims.

### FIRST VIEWPORT
Use a full-viewport 48/52 split at 1024px and wider. Keep the home-linked Tarn wordmark at the top-left and a centered form capped at 400px on the left. Inset the mountain panel by 16px, with support at top-right and a small source-evidence preview at the bottom. Hide the image panel below 1024px.

### FORM
Place circular OAuth provider links beneath the form, rendering only configured providers in the order GitHub, Google, Microsoft. Signup has optional full name, email, one password field, linked terms, and no confirm-password field. Login retains email, password visibility, and password recovery. Keep labels, keyboard focus, inline validation, loading, and API error states usable with reduced motion.

### FINISH
Preserve password authentication, provider discovery, and OAuth start URLs. Confirm both routes at 375px, 768px, and 1280px; respect prefers-reduced-motion and keep all controls keyboard and screen-reader accessible.

## Unresolved decisions
None.
