# Design system: dark operations UI

Tarn uses a unified near-black palette across route groups. Route groups
continue to set the semantic theme wrapper, while both wrappers resolve to the
same dark surfaces and contrast tokens.

## The two modes

| Mode | `data-theme` | Used by | Character |
| --- | --- | --- | --- |
| Marketing/auth | `paper` | Marketing, docs, auth | Near-black canvas, near-white text, bright blue accent, soft borders |
| Product | `ink` | Product consoles | Near-black canvas, near-white text, the same blue accent, soft borders |

Both modes use the same semantic utilities. A component that uses `bg-[var(--bg)]`,
`text-[var(--text)]`, and `border-[var(--border)]` works in both modes without
conditional logic.

## How the theme is applied

The root layout (`app/layout.tsx`) does three things only:

1. Loads Geist, Geist Mono, and Instrument Serif through `next/font/google`.
2. Imports `globals.css`.
3. Wraps `{children}` with the local `AuthProvider`.

The root layout does **not** set `data-theme`, and `data-theme` is never placed on
`<html>` or `<body>`. Each route group supplies its own wrapper:

```tsx
// app/(marketing)/layout.tsx
<div data-theme="paper">...</div>

// app/(product)/layout.tsx
<div data-theme="ink">...</div>

// app/(auth)/layout.tsx
<div data-theme="paper">...</div>
```

The `[data-theme="paper"]` and `[data-theme="ink"]` blocks in `globals.css` map
the semantic roles (`--bg`, `--text`, `--border`, and so on) to raw palette
values. Because the group wrapper sits above every page, the page inherits the
correct mode without knowing which mode it is in.

## Tokens

Raw palette values live in the Tailwind v4 `@theme` block. They are the only
place in the codebase where literal color values are allowed.

### Shared

- `--accent`
- `--accent-hover`
- `--accent-soft`
- `--signal-good`
- `--signal-warn`
- `--signal-bad`
- `--signal-idle`
- `--signal-info`
- Ink-mode variants `--signal-*-ink` for legibility on the dark canvas

### Marketing/auth dark palette

- `--bg-paper`
- `--bg-elevated-paper`
- `--bg-subtle-paper`
- `--text-paper`
- `--text-muted-paper`
- `--text-subtle-paper`
- `--border-paper`
- `--border-strong-paper`

### Product dark palette

- `--bg-ink`
- `--bg-elevated-ink`
- `--bg-subtle-ink`
- `--text-ink`
- `--text-muted-ink`
- `--text-subtle-ink`
- `--border-ink`
- `--border-strong-ink`

### Semantic roles

These are the names pages should use. They resolve to the active mode.

- `--bg`
- `--bg-elevated`
- `--bg-subtle`
- `--text`
- `--text-muted`
- `--text-subtle`
- `--border`
- `--border-strong`

### Layout, type, and motion

- `--container-wide`
- `--container-content`
- `--font-sans`
- `--font-serif`
- `--font-mono`
- `--text-display-sm`
- `--text-display`
- `--text-display-lg`
- `--text-display-xl`
- `--text-dense`
- `--text-dense-lg`
- `--text-label`
- `--animate-fade-in`
- `--animate-fade-up`
- `.animate-scale-in`, `.delay-1` through `.delay-6`
- `<Reveal>` for scroll-triggered entrances (uses the existing `framer-motion` dependency)

## Semantic utilities

Prefer these classes over raw color utilities:

### Surfaces and structure

- `.surface`
- `.surface-elevated`
- `.surface-subtle`
- `.hairline`
- `.shell`
- `.rule`
- `.rule-v`
- `.tick`

### Text

- `.text-primary`
- `.text-secondary`
- `.text-tertiary`
- `.text-accent`
- `.text-accent-hover`
- `.label-caps`
- `.heading-display`
- `.eyebrow`
- `.link-editorial`
- `.prose-copilot`

### Borders and accent

- `.border-hairline`
- `.border-strong`
- `.border-accent-soft`
- `.bg-accent`
- `.bg-accent-soft`

Note: `border-hairline` is a custom utility that sets the border color. It is not
the old `border-hairline` palette class. When setting a border width, use
`border` or `border-t` and pair it with `border-[var(--border)]`.

### Buttons

- `.btn-accent`
- `.btn-primary`
- `.btn-ghost`
- `.btn-light`
- `.btn-glass`

Buttons use rounded 10px corners, clear hover states, and a restrained accent
shadow for primary actions.

### Status

- `.dot`
- `.dot-good`
- `.dot-warn`
- `.dot-bad`
- `.dot-idle`
- `.ring-status`
- `.status-beacon` for live/read-only indicators
- `.badge`
- `.badge-good`
- `.badge-warn`
- `.badge-bad`
- `.badge-neutral`
- `.tag-planned`
- `.tag-live`
- `.text-good`, `.text-warn`, `.text-bad`, `.text-info`
- `.bg-good-soft`, `.bg-warn-soft`, `.bg-bad-soft`, `.bg-info-soft`
- `.border-good`, `.border-warn`, `.border-bad`, `.border-info`

### Cards

- `.card`
- `.card-soft`
- `.card-hover`
- `.tool-card`
- `.icon-tile`
- `.surface-grid` for staggered surface-card entrances

## Rules

1. **No literal colors outside `globals.css`.** Do not write hex values,
   `rgb(...)`, `rgba(...)`, `hsl(...)`, or named colors in components or pages.
2. **Use semantic utilities or CSS-variable arbitrary values.** Examples:
   `text-[var(--text)]`, `bg-[var(--bg-subtle)]`,
   `border-[var(--border)]`, `text-[var(--accent)]`.
3. **Do not use `data-theme` on `<html>` or `<body>`.** The route group layout
   owns the theme.
4. **Do not branch components on the active theme.** A shared component reads
   the CSS variables and works in both modes.
5. **Hairlines are the primary separation device.** Ambient `.glow` and
   `.grid-overlay` decoration, and the `.auth-card-lift` / `.preview-lift`
   shadows, must stay defined in `globals.css`; do not add gradient, glow, or
   shadow utilities inline in components.
6. **Use consistent rounded surfaces.** Buttons use 10px corners; cards use
   16px corners; smaller controls and chips use pill or 10px corners.
7. **Display type is intentional.** Use `.heading-display` for modern Geist
   display headings, Geist for body copy, and `font-mono` / `.label-caps` for
   labels and data.
8. **Marketing pages stay static.** No live data fetching, API forms, or
   embedded tools in `(marketing)`.

## Typography

- **Geist** — display headings, body copy, UI labels, navigation, and buttons.
- **Geist Mono** — eyebrows, data, status labels, IDs, and terminal-like blocks.

## Choosing a mode

Use **paper** for anything that is primarily read, evaluated, or signed into:

- Landing and product marketing
- Pricing
- Docs and resources
- Solutions and customers
- Blog and changelog
- Support, security, privacy, terms
- Login and sign-up

Use **ink** for anything that is primarily operated:

- Dashboard
- Kubernetes console
- Assistant
- Logs
- CI/CD
- Terraform
- Infrastructure code
- Audit
- Settings

## Adding a route

1. Put the page under `app/(marketing)`, `app/(product)`, or `app/(auth)`.
2. Do not create a new `<html>` or `<body>`.
3. Use the group layout for chrome and theme.
4. Build the page from `.shell`, `.card`, `.label-caps`, `.heading-display`, and
   the semantic utilities above.
5. If the page needs client state, add `"use client"` to the page or a small
   client component; keep the route group layout server-rendered.

## Motion

Motion is decorative and must never block information. Use the shared CSS
animations and the existing `Reveal` component; do not add another motion
dependency.

- Reach for `.animate-fade-up` or `.animate-fade-in` for page-load entrances.
- Wrap below-the-fold sections in `<Reveal>` for a scroll-triggered entrance.
- Use `.surface-grid` for staggered cards; `.delay-1`–`.delay-6` stagger
  individual elements.
- Hover motion belongs on `.card-hover`, `.icon-tile`, and `.link-arrow`.
- The landing hero's animated product preview is a CSS illustration, not a
  recording of a live investigation.
- Customer logos, testimonials, and outcome metrics require approved real
  content and a source. The incident terminal is explicitly labelled sample
  data. The walkthrough section renders only when a real
  `public/media/sre-copilot-walkthrough.mp4` exists at build time.
- Every animation collapses under `prefers-reduced-motion: reduce`.

## Legacy sweep

Product console pages previously used unresolved legacy palette classes
(`bg-ink-*`, `text-paper-*`, amber utilities). Those have been replaced with the
semantic utilities above. If you find one, treat it as a regression and replace
it rather than adding an alias.
