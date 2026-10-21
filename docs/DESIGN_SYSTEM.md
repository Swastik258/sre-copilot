# Design system: paper + ink

SRE Copilot has two visual modes built on one token set. The mode is selected by
the route group, not by the page. Pages do not branch on the theme.

## The two modes

| Mode | `data-theme` | Used by | Character |
| --- | --- | --- | --- |
| Paper | `paper` | Marketing, docs, auth | Warm off-white canvas, cool near-black text, burnt-orange accent, hairline borders |
| Ink | `ink` | Product consoles | Warm dark canvas, ivory text, the same burnt-orange accent, hairline borders |

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

### Paper palette

- `--bg-paper`
- `--bg-elevated-paper`
- `--bg-subtle-paper`
- `--text-paper`
- `--text-muted-paper`
- `--text-subtle-paper`
- `--border-paper`
- `--border-strong-paper`

### Ink palette

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
- `.bg-accent`
- `.bg-accent-soft`

Note: `border-hairline` is a custom utility that sets the border color. It is not
the old `border-hairline` palette class. When setting a border width, use
`border` or `border-t` and pair it with `border-[var(--border)]`.

### Buttons

- `.btn-accent`
- `.btn-ghost`

Buttons are square with a 4px radius. They have no gradients, glows, or shadows.

### Status

- `.dot`
- `.dot-good`
- `.dot-warn`
- `.dot-bad`
- `.dot-idle`
- `.ring-status`
- `.badge`
- `.badge-good`
- `.badge-warn`
- `.badge-bad`
- `.badge-neutral`
- `.tag-planned`
- `.tag-live`

### Cards

- `.card`
- `.card-soft`
- `.card-hover`
- `.tool-card`

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
5. **No gradients, glows, or shadows beyond a 1px border.** Hairlines are the
   primary separation device.
6. **Corners are 4px.** Use `.card`, `.btn-accent`, `.btn-ghost`, or
   `rounded-[4px]`.
7. **Display type is intentional.** Use `.heading-display` or `font-serif` for
   display headings, Geist for body copy, and `font-mono` / `.label-caps` for
   labels and data.
8. **Marketing pages stay static.** No live data fetching, API forms, or
   embedded tools in `(marketing)`.

## Typography

- **Instrument Serif** — display headings, large pull quotes, editorial page
  titles.
- **Geist** — body copy, UI labels, navigation, buttons.
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

## Known backlog

The product console pages still contain the legacy palette classes
(`bg-ink-*`, `text-paper-*`, amber utilities). They were moved under
`app/(product)` without a rewrite in this milestone. They inherit the ink
wrapper but their internal colors do not resolve. The next sweep should replace
those classes with the semantic utilities in this document and remove the
components that become unused.
