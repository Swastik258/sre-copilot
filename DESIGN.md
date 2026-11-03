---
name: Tarn Marketing, Product & Account Access
description: A source-linked evidence packet across marketing and product information, with a quiet dark split layout for account access.
colors:
  packet-blue: "#2347b8"
  packet-blue-deep: "#142a72"
  packet-paper: "#f3efe3"
  packet-holder: "#e8e2d3"
  packet-faq: "#e7e2d5"
  packet-insert: "#fffdf6"
  packet-ink: "#17233c"
  packet-muted: "#48566f"
  packet-tab: "#d7f44a"
  packet-orange: "#f2764c"
  auth-bg: "#080a0d"
  auth-surface: "#0e1218"
  auth-accent: "#a9c5ff"
  auth-story-border: "rgba(240, 245, 252, 0.17)"
  auth-rule: "rgba(235, 241, 250, 0.12)"
  auth-field-border: "rgba(235, 241, 250, 0.1)"
  auth-text-subtle: "#a5afbd"
  auth-action: "#f4f6f8"
  auth-action-hover: "#dce5f3"
  auth-error-border: "rgba(239, 143, 138, 0.35)"
  auth-error-background: "rgba(112, 39, 43, 0.18)"
  auth-error-text: "#ffaaa5"
typography:
  display:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.65rem, 5.1vw, 5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 3.2vw, 2.8rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.65
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    letterSpacing: "0.065em"
  auth-display:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 620
    lineHeight: 1.16
    letterSpacing: "-0.04em"
  auth-story-display:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 4.4vw, 4rem)"
    fontWeight: 580
    lineHeight: 1.02
    letterSpacing: "-0.055em"
  auth-label:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
rounded:
  nav-cta: "12px"
  auth-control: "8px"
  auth-panel: "24px"
spacing:
  1: "0.5rem"
  2: "1rem"
  3: "1.5rem"
  4: "2rem"
  5: "3rem"
  6: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.packet-tab}"
    textColor: "{colors.packet-ink}"
    padding: "0.8rem 1.15rem"
  button-primary-hover:
    backgroundColor: "#e6ff73"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.packet-ink}"
  navigation-marketing:
    backgroundColor: "{colors.packet-blue}"
    textColor: "{colors.packet-insert}"
    height: "4.5rem"
  evidence-slip:
    backgroundColor: "{colors.packet-insert}"
    textColor: "{colors.packet-ink}"
    padding: "1rem 1rem 1rem 0.8rem"
  packet-trace:
    backgroundColor: "transparent"
    textColor: "{colors.packet-ink}"
  faq-row:
    backgroundColor: "transparent"
    textColor: "{colors.packet-ink}"
  auth-action:
    backgroundColor: "{colors.auth-action}"
    textColor: "{colors.auth-bg}"
    rounded: "{rounded.auth-control}"
    height: "2.75rem"
  auth-field:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "#f3f5f8"
    rounded: "{rounded.auth-control}"
    height: "2.75rem"
  auth-story-panel:
    backgroundColor: "{colors.auth-surface}"
    textColor: "#f7f8fb"
    rounded: "{rounded.auth-panel}"
    padding: "1rem"
  auth-packet:
    backgroundColor: "{colors.auth-bg}"
    textColor: "#f3f5f8"
  auth-navigation:
    backgroundColor: "{colors.packet-blue}"
    textColor: "{colors.packet-insert}"
    height: "4rem"
---

# Design System: Tarn Homepage, Marketing Chrome & Account Access

## Overview

**Creative North Star: "The Evidence Packet"**

The public homepage and its shared marketing chrome turn provenance into a physical-feeling packet: cobalt is the outer stock, warm paper is the envelope, and pale inserts carry the ordered evidence trail. The homepage's blue surround, cut-paper corner, punched-looking numbered slips, transfer line, and bright seal are not a generic product-preview frame; they make the source-to-finding sequence the organizing structure. The `/login` and `/sign-up` routes use a separate, quiet dark account-access treatment: a centered form on graphite with a mountain image panel for product truth and source-linked evidence.

Inter Tight gives the promise, section headings, and account forms a confident, compact voice. JetBrains Mono is reserved for machine-readable labels and identifiers in the evidence packet. The named Tarn wordmark remains the brand mark. This documentation covers the shipped homepage and shared marketing navigation/footer treatment, plus the `/login` and `/sign-up` account-access routes. It does not define the dashboard, recovery pages, or other app surfaces.

**Key Characteristics:**
- Cobalt envelope stock and warm, layered paper.
- Acid yellow-green action/seal with a restrained coral transfer mark.
- Oversized tight-grotesk promise paired with compact monospaced labels.
- Source records, observed facts, and ranked hypotheses remain visibly distinct.
- Account access uses a dark, responsive split layout, a focused pale-text form, and an inset mountain image panel.

## Colors

The marketing and product-information surfaces use a high-contrast packet of cobalt, warm paper, dark ink, and two functional signal accents. Account access instead uses graphite, near-white copy, a cool blue focus accent, and restrained red validation feedback.

### Primary
- **Packet Cobalt**: The surrounding homepage field, account-access field, marketing navigation, and account header.
- **Deep Packet Blue**: The scrolled/mobile navigation surface and closing call-to-action band.

### Secondary
- **Signal Tab**: The primary action, pull tab, trust band, and seal-adjacent highlight; use as a small, high-salience signal against paper or blue.

### Tertiary
- **Transfer Coral**: The envelope's transfer mark, packet seal, and focus outline on this surface; it is a smaller signal than the yellow-green tab.

### Neutral
- **Envelope Paper**: The main homepage sheet.
- **Holder Paper** and **FAQ Paper**: Slightly deeper warm papers for the insert holder and accordion section.
- **Insert Paper**: The individual evidence slips.
- **Packet Ink**: Main headings and foreground copy on paper.
- **Muted Blue-Gray**: Supporting copy and secondary packet labels.
- **Account Field and Story Borders**: Low-contrast strokes around inputs and the image-panel preview.
- **Account Subtle Text**: Muted supporting copy and placeholders on the dark surface.

### Account Feedback
- **Account Action Hover**: A cool, slightly darker white hover state for the primary action.
- **Account Error Border, Background, and Text**: Restrained red tones reserved for form validation and API feedback.

### Named Rules
**The Packet Contrast Rule.** Keep ink on paper and readable light text on the blue navigation/closing surfaces; reserve the saturated accents for controls and packet marks. Account access uses its own dark contrast system and keeps red feedback colors reserved for errors.

## Typography

**Display Font:** Inter Tight (with `ui-sans-serif`, system-ui, sans-serif fallbacks)  
**Body Font:** Inter Tight (with `ui-sans-serif`, system-ui, sans-serif fallbacks)  
**Label/Mono Font:** JetBrains Mono (with `ui-monospace`, monospace fallbacks)

**Character:** Tight, weighty grotesk headlines make the promise decisive without changing voice between display and body. Account access uses compact form headings and larger image-panel statements. Functional field labels stay in the sans-serif body face.

### Hierarchy
- **Display** (600, responsive 2.65–5rem, 0.98 line-height): The homepage hero statement; tight tracking keeps the large multiline headline cohesive.
- **Headline** (600, responsive 1.9–2.8rem, 1.08 line-height): Trust, integrations, FAQ, and close-section headings.
- **Title** (600, 1.25rem): Short verbs naming each evidence slip.
- **Body** (regular, 1rem, 1.65 line-height): Supporting section copy; hero lead grows responsively from 1.0625rem to 1.25rem.
- **Label** (regular, 0.6875rem, 0.065em tracking, uppercase where used): Mono packet addresses, evidence categories, adapter captions, and numbered slip metadata.
- **Account title** (620, 1.75rem, 1.16 line-height): The login or account-creation heading.
- **Account story heading** (580, responsive 2.75–4rem desktop, 1.02 line-height): The signup evidence statement or login feature card.
- **Account labels** (0.8125rem): Sentence-case labels set close to each field.

### Named Rules
**The Label Has a Job Rule.** Use the mono face for compact identifiers and category labels; keep explanatory sentences in the sans-serif body face.

**The Task Title Rule.** Keep the account form heading direct and the evidence-panel statement more editorial in character; field labels remain compact and functional.

## Layout

The desktop hero sits as one large paper envelope within a cobalt field. Its address panel and calls to action occupy the left column; a nested insert stack sits at the right; the adapter list and seal close the sheet along a full-width lower edge. The hero container is capped at 75rem, with fluid column proportions and a responsive gap. Later paper sections use a 12-column grid, with copy and content separated across columns.

Account access fills the viewport with a 48/52 desktop split: the left form column is centered around a 25rem measure, and the right mountain panel is inset 1rem from the viewport edges with a 24px radius. The Tarn wordmark links home at the top-left, and support links to the real support route. Below 1024px the image panel is hidden and the form remains a single-column task. Signup includes one password field, an optional name, and linked terms.

At widths up to 767px, the hero becomes a single column in the same story order: promise and actions, evidence inserts, then adapters. The numbered slips become full-width and their source mark moves below the text. Later section grids also collapse to one column, and the final action stacks below its heading. Page gutters narrow from 1.5rem to 0.75rem.

The reusable base spacing steps are 0.5, 1, 1.5, 2, 3, and 4rem. Homepage-specific padding and section gaps use fluid `clamp()` values around that rhythm rather than forcing every paper component into identical spacing. Account panels also use fluid clamp-based padding, while evidence rows retain compact vertical insets.

## Elevation & Depth

Depth on marketing pages is mostly structural: nested paper tones, thin borders, overlapping slips, dashed transfer lines, the clipped envelope corner, and a single coral tab. The account form stays flat against graphite, while the inset mountain panel carries a dark image overlay and a small, legible diagnosis preview.

### Shadow Vocabulary
- **Envelope lift** (`0 28px 56px -32px rgba(4, 17, 61, 0.62)`): Separates the main sheet from the cobalt field.
- **Insert edge** (`0 5px 12px -10px rgba(23, 35, 60, 0.4)`): A subtle edge under individual evidence slips.

### Named Rules
**The Paper Does the Layering Rule.** Prefer contrast, overlap, and fine strokes to stronger shadows; the page's depth belongs to its paper construction.

## Shapes

The envelope and evidence slips use square corners, fine borders, asymmetrical widths, and restrained polygon clipping for fold/seal forms. Dashed lines work as transfer paths and separators. The shared marketing navigation CTA retains the wider 12px radius from the shared control style; do not generalize that rounded treatment to packet paper. Account controls use 8px corners, and the inset image panel uses a 24px radius.

## Components

### Buttons
The primary action is a square-cornered signal tab with an arrow that advances on hover.
- **Shape:** Square corners on the homepage action; the shared navigation CTA uses the shared 12px radius.
- **Primary:** Signal-tab fill, packet-ink text, compact horizontal padding (0.8rem 1.15rem), and a minimum height of 3.25rem.
- **Hover / Focus:** Hover brightens the tab and lifts the action by 2px; its arrow shifts 3px. Keyboard focus uses a visible 2px outline with offset, colored coral on the homepage.
- **Secondary:** The documentation action is unfilled packet ink with an underline; hover shifts its text toward packet blue.

### Cards / Containers
The evidence packet is a bordered warm-gray paper holder for three off-white inserts.
- **Corner Style:** Square; thin one-pixel strokes.
- **Background:** Warm envelope paper for the page sheet and insert-holder; pale insert paper for the individual slips.
- **Shadow Strategy:** Reference Elevation & Depth; only a restrained envelope lift and faint slip edges.
- **Border:** Muted warm-gray hairlines; numbered squares and transfer marks use packet blue or coral.
- **Internal Padding:** Holder uses roughly 1.25rem desktop and 1rem mobile; slips use roughly 1rem desktop and slightly tighter mobile padding.

### Navigation
The shared public navigation uses the preserved Tarn wordmark, a 4.5rem-high horizontal row, centered public links, and a high-visibility action. On this homepage it sits on cobalt stock; the scrolled state deepens the blue without introducing a blurred glass panel. At mobile widths the link row is replaced by a bordered menu control and a deep-blue sheet. Hover/active links use a short underline, and keyboard focus remains visible.

### Evidence Inserts
Three numbered slips communicate Source records → Observed facts → Ranked hypotheses. Their slight width offsets and ordered indexes make the evidence trail legible without depending on animation. The keyboard-accessible native disclosure below them traces the source-to-finding path: its transfer line draws downward, then each index briefly highlights in sequence. When open, the path and index borders remain coral. Reduced-motion preferences shorten the sequence to an immediate state change.

### Product Index
The product directory extends the evidence packet to a full-page listing: a cobalt field surrounds a single warm-paper packet, and the nine supported surfaces appear as ruled insert rows rather than a grid of cards. Status stays attached to each row, and the product-status note distinguishes implemented surfaces from the read-only credentials required for live data. The rows file into the index in order; reduced-motion preferences remove their spatial entrance.

### Pricing
Pricing keeps the shared paper and cobalt materials while preserving a semantic comparison table. The available Free plan is marked with the signal tab; Pro and Team remain explicitly planned and not for sale. Billing status is stated alongside the table. On narrow screens the table becomes labeled plan inserts without changing its content or availability.

### FAQ
The FAQ is a text-first accordion on a muted paper section: thin horizontal rules, transparent question buttons, and a blue chevron. One answer is open at a time; the state is exposed through `aria-expanded`.

### Account Access
The `/login` and `/sign-up` routes use a two-column dark layout on large screens and a single form column on smaller screens. The left column carries the home-linked Tarn wordmark, the complete form, and a small read-only note. The right panel uses the approved mountain hero image, a restrained gradient and ripple treatment, a support link, and a compact diagnosis preview with an evidence-reference chip. Login rotates among three factual product capabilities; signup leads with “Evidence, not guesses.”

- **Primary action:** Full-width near-white button, dark text, 2.75rem height, arrow icon, and a pressed scale of 0.98. Loading replaces the arrow with a spinner.
- **OAuth:** Show circular, labeled-by-accessibility provider links below the form only for providers reported by the configured-provider endpoint; use GitHub, Google, and Microsoft order and hide the block and divider when none are configured.
- **Fields:** Dark translucent fill, fine white border, 8px corners, 2.75rem height, visible blue focus ring, and sentence-case labels.
- **Feedback:** Signup password length validation appears beneath its single password field; API errors remain visible in an alert.
- **Motion:** The left column enters in a reduced-motion-aware stagger. The mountain image has subtle pointer parallax, ripples pulse, and the login feature carousel can be paused.
- **Responsive order:** Below 1024px the visual panel is hidden and the form remains centered in one column.

## Do's and Don'ts

### Do:
- **Do** keep the homepage's ordered evidence sequence visibly distinct and source-oriented.
- **Do** use the mono face for the small functional labels shown on packet parts and adapter names.
- **Do** preserve the Tarn wordmark and its contrast against the blue navigation.
- **Do** retain the one-column mobile reading order and keep the action near the promise.
- **Do** keep login and signup within the evidenced packet materials and preserve their form-first mobile order.
- **Do** use the account routes' square corners and visible blue-border/coral-outline input focus treatment.

### Don't:
- **Don't** apply this homepage's envelope palette and geometry as an assumed dashboard theme.
- **Don't** add unsupported product proof, customer claims, prices, or metrics to the visual system.
- **Don't** turn the two signal accents into large competing color fields; their use is concentrated in controls and packet marks.
- **Don't** extend this account layout or its account-specific feedback colors to recovery pages, dashboards, or other app surfaces without evidence from those surfaces.
- **Don't** use the error palette for ordinary decoration or imply account behavior beyond what the implemented forms establish.
