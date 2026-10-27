# Tarn design system

Shared tokens are defined in [`frontend/app/theme.css`](../frontend/app/theme.css);
shared components and layout rules live in `frontend/app/globals.css`.

## Foundations

- Surfaces: `#050505` base and `#0A0A0A` elevated.
- Text: `#EDEDED` primary and `#8A8A8F` muted.
- Border: `rgba(255, 255, 255, 0.08)`.
- Accent: glacial `#8FD3D9`; amber and brick are reserved for status meaning.
- Type: Inter Tight for interface and display text; JetBrains Mono for code
  and evidence references. The serif token aliases the sans font.
- Type tokens: 12, 14, 16, 20, and 28 px, plus a responsive display size.
- Spacing tokens use 8 px increments; the shared radius is 12 px.
- Content uses a centered 1200 px maximum container with consistent gutters.

## Shared patterns

The public shell has four plain navigation links, sign-in, one primary action,
and a footer sitemap. The product workspace keeps its own sidebar and a back
link. Marketing pages reuse the hero, product-shot, bento, reading, table, FAQ,
CTA, and footer patterns instead of creating a unique card treatment per page.

The fixed visual vocabulary is Button, Link, Card, Badge, CodeBlock, Table,
Section, Nav, and Footer. Product data tables and investigation details can
remain information-dense, but share the same tokens and surfaces.

## Motion

Entrance and scroll reveals use short opacity/transform transitions; hover
states are brief. Reduced-motion preferences disable looping decoration and
transforms. The assistant entry screen has no moving grid backdrop.

## Product truth

Dashboard integration and investigation states are read from the configured
backend. The available built-in adapters are Kubernetes, GitHub Actions, and
Prometheus. Public copy must not invent customers, testimonials, prices, or
metrics. The homepage visual is a real empty-workspace screenshot; it is not a
diagnosis capture from a live kind cluster.
