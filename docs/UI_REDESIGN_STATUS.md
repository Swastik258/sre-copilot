# UI redesign status

Branch: `feat/tarn-clear-water`  
Baseline commit: `691f232` (`new-ui`)  
Audit date: 2026-10-26

This document tracks the move from the mixed paper/ink baseline to the
**Clear water** identity. A page is only marked complete when it has been
checked at 1440, 1024, and 390 px, and the shared gates pass.

## Baseline gates

Run from the repository root on `691f232` before any redesign work:

| Gate | Result |
| --- | --- |
| `backend/.venv/bin/pytest -q` | Passed (267 tests; deprecation warnings only) |
| `backend/.venv/bin/ruff check .` | Passed |
| `frontend/npm run lint` | Passed |
| `frontend/npm run build` | Passed (53 static pages/prerenders) |

The baseline screenshots are in
`/tmp/opencode/sre-copilot-artifacts/before` (public pages) and
`/tmp/opencode/sre-copilot-artifacts/before-auth` (signed-in product pages).
They are audit artifacts and are not committed.

## Page-by-page audit

“Legacy” means a page still depends on the old layered marketing CSS,
generic cards, decorative labels, or template-style section formulas.
“Mixed” means the content is already honest and specific, but the composition
or component styling is inconsistent with Clear water.

| Route | Current state | Still template-like / legacy | Effort |
| --- | --- | --- | --- |
| `/` | Custom hero plus a long appendix of old homepage sections | Two-column hero with a framed demo panel; customers, three-item trust checklist, duplicate integration grids, pricing teaser, FAQ accordion, and final CTA repeat the old formula; reveal wrapper can leave blank gaps | L |
| `/demo` | Good interactive fixture; five failures on three fixtures | Demo still reads like a tool card; evidence marks are accent-coloured instead of quiet footnotes; needs one clear demo-data statement and stronger depth composition | M |
| `/product` | Editorial reference list | Flat page header; statuses are unqualified “Live”; no differentiation between configured and fixture-backed surfaces | S |
| `/product/assistant` | Honest product detail | Duplicated breadcrumb label; generic hero + three-point list; no evidence artifact | M |
| `/product/kubernetes` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/logs` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/metrics` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/runbooks` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/cicd` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/terraform` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/infra-code` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/product/audit` | Honest product detail | Same duplicated breadcrumb and generic detail layout | M |
| `/solutions` | Three equal audience cards | Eyebrow + heading + subline + three cards; should be a comparison/reference composition | M |
| `/solutions/platform` | Two generic cards | Card-inside-page formula; no margin notes or evidence example | M |
| `/solutions/sre` | Two generic cards | Same card formula; status and read-only contract buried in copy | M |
| `/solutions/devops` | Two generic cards | Same card formula | M |
| `/customers` | Honest empty state | Strong content, but still uses small label + heading + link-list template | S |
| `/customers/case-studies` | Honest empty state | Generic card; stale “SRE Copilot” brand | S |
| `/customers/testimonials` | Honest empty state | Generic card; “share feedback” destination should be explicit | S |
| `/blog` | Honest empty state | Sparse but acceptable; needs consistent editorial shell | S |
| `/changelog` | Real entries with honest deployment state | Needs Clear water redesign entry, release status cleanup, and typography alignment | S |
| `/docs` | Genuine reference content | Two different index patterns; section labels still echo the old eyebrow pattern; no stable margin-note rhythm | M |
| `/resources` | Four generic cards | Eyebrow + heading + four-card grid | M |
| `/pricing` | Honest Free/Planned table | Mobile table overflows; generic question card; headings still use old uppercase-free labels inconsistently | M |
| `/security` | Strong controls/gaps ledger | Mostly complete; needs status wording and type/spacing alignment | S |
| `/support` | Honest support ledger | Button styling is inconsistent; “no public support address configured” is correct but visually buried | S |
| `/privacy` | Honest privacy note | Three-column card-like sections; needs long-form editorial treatment | S |
| `/terms` | Honest terms | Two generic cards | S |
| `/login` | Functional auth form | Floating card in a large empty paper field; “Local” dot badge and dark inputs break the light editorial rhythm | M |
| `/sign-up` | Functional auth form | Same auth shell issues | M |
| `/forgot-password` | Functional auth form | Same auth shell issues | M |
| `/reset-password` | Functional auth form | Same auth shell issues | M |
| `/verify-email` | Functional auth form | Same auth shell issues | M |
| `/not-found` | Clear 404 | Centred button cluster is generic | S |
| `/error` | Functional error boundary | Hard-coded navy/blue legacy palette | S |
| `/dashboard` | Real workspace overview | “LIVE” dots on every rail item, even when Kubernetes is disabled; three generic status cards; cyan “Free · full access” pill | M |
| `/assistant` | Real evidence-bound assistant | Generic empty panel; rail status noise | M |
| `/audit` | Real audit table and retention controls | Dense admin-table styling; needs clearer hierarchy and status honesty | S |
| `/cicd` | Real workflow diagnosis form | Large tool form and output panels still use the pre-redesign input/button treatment | M |
| `/history` | Real saved investigations | Generic list/empty state | S |
| `/infra-code` | Real proposal generator | Generic form + empty panel; cyan primary action | M |
| `/kubernetes` | Real read-only cluster diagnostics | Configuration state panel is the main visual; needs a stronger state and clearer read-only framing | M |
| `/logs` | Real log analysis | Huge empty textarea + empty output panel; needs better input/output rhythm | M |
| `/metrics` | Real Prometheus query | Generic query form + side notes; correlation wording already honest | S |
| `/runbooks` | Real triage sequences | Generic list states | S |
| `/settings` | Real account/security/integration settings | Large undifferentiated form; cyan buttons; connection actions still look operative even when integrations are disabled | M |
| `/terraform` | Real plan review | Generic form + output; sample-data label is honest | S |
| `/admin/settings` | Real admin surface | Same console form treatment; status semantics need a pass | S |
| `/dashboard/coming-soon` | Legacy stopgap page | Says “Logs and Terraform are live” in a feature-availability panel; no longer a coming-soon state | S |
| `/dashboard/upgrade` | Legacy plan-gate copy | “Unlock …” implies a paid gate that does not exist; billing is disabled | S |

## Shared components to build or update

### Build

- `TarnMark` / refreshed SVG wordmark and favicon using irregular contour rings.
- `EditorialPage` header: breadcrumb-free route label, display headline, lead, optional
  margin actions.
- `ReferenceTable`: responsive, semantic table/list for product, pricing, surfaces,
  and solution comparisons.
- `MarginNote`: long-form prose with a narrow evidence/annotation column.
- `DepthScale`: the 0 m / 1 m / 2 m observed → evidence → hypothesis rail.
- `ContourField`: one reusable topographic background layer with a reduced-motion
  fallback.
- `EvidenceRef`: quiet mono footnote mark, not a coloured pill.
- `EmptyState`: one editorial empty-state pattern for customers, blog, history,
  and unconfigured integrations.
- `AuthShell`: split editorial shell for all five auth routes.
- `ConsoleHeader` / `ConsoleOutput`: shared product-page header and output region.
- `StatusText`: plain-language Live / Demo / Disabled / Planned labels with accurate
  qualifiers and no green pills.

### Update

- `TopNav`: solid dropdown panel, explicit z-index, full-page backdrop, keyboard
  focus handling, and a calmer mobile sheet.
- `MarketingFooter`: asymmetric brand block, active links, honest self-hosted note.
- `DiagnosisDemo`: unobtrusive evidence footnotes, clearer depth relationship,
  one small demo-data note.
- `Reveal`: no late empty space; reveal only short content blocks, force visible
  for reduced motion and no-JS.
- `WorkspaceLayout`: remove “LIVE” from every rail item; show actual integration
  state only where it is known.
- `AuthForm` / `AccountRecovery`: keep all auth logic, restyle inputs, statuses, and
  error/notice surfaces.
- `StatusStrip` / `HealthPill` if reused: remove green signal semantics and map
  connected/disabled to plain text.
- `Pricing` / `FAQ` / `HowItWorks`: either bring into the new system or stop
  rendering them. Do not keep numbered 01/02/03 cards.
- `app/error.tsx`: replace hard-coded navy/blue values with theme tokens.
- `CHANGELOG.md` (repository root): start an honest Unreleased entry.
- `README.md` / `BUILD_STATUS.md`: remove the stale “visual baseline is `master`
  at `85ef4d9`” note once this branch is complete.

## Proposed order of work

1. **Foundation** — consolidate tokens in `app/theme.css`; replace the layered
   legacy CSS with the Clear water system; rebuild the Tarn mark; fix nav,
   backdrop, focus, error, and 404 states.
2. **Shared marketing primitives** — editorial page header, table, margin notes,
   contour field, footer, buttons, evidence refs, empty states.
3. **Home and demo** — one editorial hero with the live diagnosis artifact
   bleeding off the page; remove the customers/trust/integrations/pricing/FAQ
   appendix; rebuild the demo as the primary product artifact.
4. **Marketing reference pages** — product index and surfaces, solutions index
   and three audience pages, resources, pricing, terms, privacy.
5. **Trust and editorial pages** — docs, security, support, customers, blog,
   changelog; correct stale brand text and deployment-status copy.
6. **Auth** — one split auth shell applied to all five routes without changing
   submit, validation, recovery, or OAuth behavior.
7. **Product console** — shared console header/output; rail status cleanup;
   dashboard, Kubernetes, logs, CI/CD, Terraform, metrics, runbooks, assistant,
   audit, history, infra-code, settings, admin, coming-soon, upgrade.
8. **Verification** — all four gates; 1440/1024/390 screenshots; reduced-motion
   and keyboard checks; mobile table and overflow audit; update this document,
   the marketing changelog, root `CHANGELOG.md`, and README/BUILD_STATUS.
