---
name: Tarn Homepage, Marketing Chrome & Account Access
description: A source-linked evidence packet in cobalt stock, warm paper, and signal accents.
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
  auth-story-border: "#c7c1b2"
  auth-rule: "#b5b1a7"
  auth-field-border: "#969ca5"
  auth-text-subtle: "#657189"
  auth-action-hover: "#e6ff73"
  auth-error-border: "#bd6a60"
  auth-error-background: "#fff4ed"
  auth-error-text: "#842d25"
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
    fontSize: "clamp(2rem, 3.3vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.02
  auth-story-display:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.15rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 0.99
    letterSpacing: "-0.045em"
  auth-label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    letterSpacing: "0.065em"
rounded:
  nav-cta: "12px"
  auth-square: "0"
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
    backgroundColor: "{colors.packet-tab}"
    textColor: "{colors.packet-ink}"
    rounded: "{rounded.auth-square}"
    height: "3.25rem"
  auth-field:
    backgroundColor: "{colors.packet-insert}"
    textColor: "{colors.packet-ink}"
    rounded: "{rounded.auth-square}"
    height: "3.25rem"
  auth-story-panel:
    backgroundColor: "{colors.packet-holder}"
    textColor: "{colors.packet-ink}"
    padding: "clamp(1.5rem, 4vw, 3.5rem)"
  auth-packet:
    backgroundColor: "{colors.packet-paper}"
    textColor: "{colors.packet-ink}"
  auth-navigation:
    backgroundColor: "{colors.packet-blue}"
    textColor: "{colors.packet-insert}"
    height: "4rem"
---

# Design System: Tarn Homepage, Marketing Chrome & Account Access

## Overview

**Creative North Star: "The Evidence Packet"**

The public homepage and its shared marketing chrome turn provenance into a physical-feeling packet: cobalt is the outer stock, warm paper is the envelope, and pale inserts carry the ordered evidence trail. The homepage's blue surround, cut-paper corner, punched-looking numbered slips, transfer line, and bright seal are not a generic product-preview frame; they make the source-to-finding sequence the organizing structure. The completed `/login` and `/sign-up` routes extend that same material language into a focused account task: a square-edged two-part paper packet, with the working form on pale insert stock and a factual evidence sequence on the adjacent holder panel.

Inter Tight gives the promise, section headings, and account forms a confident, compact voice. JetBrains Mono is reserved for machine-readable labels and identifiers, including the small numbered account evidence list. The named Tarn wordmark remains the brand mark. This documentation covers the shipped homepage and shared marketing navigation/footer treatment, plus the `/login` and `/sign-up` account-access routes and their shared header. It does not define the dashboard, recovery pages, or other app surfaces.

**Key Characteristics:**
- Cobalt envelope stock and warm, layered paper.
- Acid yellow-green action/seal with a restrained coral transfer mark.
- Oversized tight-grotesk promise paired with compact monospaced labels.
- Source records, observed facts, and ranked hypotheses remain visibly distinct.
- Account access uses the same cobalt surround, warm holder, pale insert, and signal-tab action in a task-first responsive packet.

## Colors

Across the homepage and account routes, the palette is a high-contrast packet of cobalt, warm paper, dark ink, and two functional signal accents; the account form adds restrained field and validation tones without changing the shared materials.

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
- **Account Field, Rule, and Story Borders**: Fine, quiet strokes separating the auth form, holder panel, input fields, and evidence rows.
- **Account Subtle Text**: Placeholder and supporting UI text on the pale form insert.

### Account Feedback
- **Account Action Hover**: A lighter yellow-green hover state for the sign-in and create-account actions.
- **Account Error Border, Background, and Text**: Muted coral-red tones reserved for form validation and error feedback.

### Named Rules
**The Packet Contrast Rule.** Keep ink on paper and readable light text on the blue navigation/closing surfaces; reserve the saturated accents for controls and packet marks. In account forms, use the red feedback colors only for errors and reserve coral for the visible input focus outline and the read-only marker.

## Typography

**Display Font:** Inter Tight (with `ui-sans-serif`, system-ui, sans-serif fallbacks)  
**Body Font:** Inter Tight (with `ui-sans-serif`, system-ui, sans-serif fallbacks)  
**Label/Mono Font:** JetBrains Mono (with `ui-monospace`, monospace fallbacks)

**Character:** Tight, weighty grotesk headlines make the promise decisive without changing voice between display and body. On account access, the form title remains compact while the adjacent evidence heading expands into the editorial statement. Monospaced uppercase labels provide the packet's compact indexing language; they identify actual steps and adapters rather than decorate the headline.

### Hierarchy
- **Display** (600, responsive 2.65–5rem, 0.98 line-height): The homepage hero statement; tight tracking keeps the large multiline headline cohesive.
- **Headline** (600, responsive 1.9–2.8rem, 1.08 line-height): Trust, integrations, FAQ, and close-section headings.
- **Title** (600, 1.25rem): Short verbs naming each evidence slip.
- **Body** (regular, 1rem, 1.65 line-height): Supporting section copy; hero lead grows responsively from 1.0625rem to 1.25rem.
- **Label** (regular, 0.6875rem, 0.065em tracking, uppercase where used): Mono packet addresses, evidence categories, adapter captions, and numbered slip metadata.
- **Account title** (600, responsive 2–2.75rem, 1.02 line-height): The login or account-creation heading on the form insert.
- **Account story heading** (600, responsive 2.15–3.5rem desktop; 1.9–2.4rem mobile, approximately 0.99 line-height): The evidence-panel statement. The panel uses Inter Tight rather than a serif display face.
- **Account labels** (0.6875rem, 0.065em tracking): Compact field labels, retaining the mono face and uppercase label treatment.

### Named Rules
**The Label Has a Job Rule.** Use the mono face for compact identifiers and category labels; keep explanatory sentences in the sans-serif body face.

**The Task Title Rule.** Keep the account form heading direct and the evidence-panel statement more editorial in character; field labels remain compact and functional.

## Layout

The desktop hero sits as one large paper envelope within a cobalt field. Its address panel and calls to action occupy the left column; a nested insert stack sits at the right; the adapter list and seal close the sheet along a full-width lower edge. The hero container is capped at 75rem, with fluid column proportions and a responsive gap. Later paper sections use a 12-column grid, with copy and content separated across columns.

Account access uses a centered paper packet capped at 72rem, with a two-column desktop grid (story panel 0.9fr, form insert 1.1fr). The standard 4rem-high header remains above the centered work area. At 767px and below, the packet becomes one column with the form first and the evidence panel second; the main area aligns to the top with narrower page gutters. Signup shares the same structure and grows naturally for its additional fields. Preserve the form's primary-action and account-switch visibility in the first task surface.

At widths up to 767px, the hero becomes a single column in the same story order: promise and actions, evidence inserts, then adapters. The numbered slips become full-width and their source mark moves below the text. Later section grids also collapse to one column, and the final action stacks below its heading. Page gutters narrow from 1.5rem to 0.75rem.

The reusable base spacing steps are 0.5, 1, 1.5, 2, 3, and 4rem. Homepage-specific padding and section gaps use fluid `clamp()` values around that rhythm rather than forcing every paper component into identical spacing. Account panels also use fluid clamp-based padding, while evidence rows retain compact vertical insets.

## Elevation & Depth

Depth is mostly structural: nested paper tones, thin borders, overlapping slips, dashed transfer lines, the clipped envelope corner, and a single coral tab. The homepage outer envelope has one broad, subdued shadow; each slip has only a faint short shadow. The account packet reuses the same restrained envelope lift while its two flush panels and their dividing stroke supply the internal hierarchy. Do not extend these shadows into a general floating-card vocabulary.

### Shadow Vocabulary
- **Envelope lift** (`0 28px 56px -32px rgba(4, 17, 61, 0.62)`): Separates the main sheet from the cobalt field.
- **Insert edge** (`0 5px 12px -10px rgba(23, 35, 60, 0.4)`): A subtle edge under individual evidence slips.

### Named Rules
**The Paper Does the Layering Rule.** Prefer contrast, overlap, and fine strokes to stronger shadows; the page's depth belongs to its paper construction.

## Shapes

The envelope and evidence slips use square corners, fine borders, asymmetrical widths, and restrained polygon clipping for fold/seal forms. Dashed lines work as transfer paths and separators. The shared marketing navigation CTA retains the wider 12px radius from the shared control style; do not generalize that rounded treatment to packet paper. The account packet, form fields, and account actions are square-edged with one-pixel strokes; the evidence rows use horizontal rules rather than individual cards.

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
Three numbered slips communicate Source records → Observed facts → Ranked hypotheses. Their slight width offsets and ordered indexes make the evidence trail legible without depending on animation. The native disclosure below them opens a short trace explanation; when open, its transfer path and index borders switch to coral.

### FAQ
The FAQ is a text-first accordion on a muted paper section: thin horizontal rules, transparent question buttons, and a blue chevron. One answer is open at a time; the state is exposed through `aria-expanded`.

### Account Access
The `/login` and `/sign-up` routes share a 4rem cobalt header with the preserved Tarn wordmark and a home link. Their square-edged paper packet pairs a warm holder/story panel with a pale form insert, separated by a fine stroke. The form remains the task surface: labels sit directly above bordered fields, the primary action spans the available form width, and an underlined account-switch link closes the form. Signup adds optional name and password-confirmation fields without changing the shared hierarchy.

- **Primary action:** Signal-tab fill, packet-ink text, square corners, and a 3.25rem minimum height. Hover changes only to the established lighter tab color; disabled state reduces opacity and blocks the pointer.
- **Fields:** Pale insert fill, quiet one-pixel border, square corners, and a 3.25rem minimum height. Keyboard focus shifts the border to packet blue and adds a 2px coral outline with 2px offset.
- **Feedback:** Status and error messages use bordered paper notices; error treatment uses coral-red rather than the brand transfer coral.
- **Evidence panel:** Three numbered, ruled rows distinguish source records, observed facts, and ranked hypotheses. A small coral square marks the factual read-only note.
- **Responsive order:** Desktop places the story at left and form at right. Mobile places the entire form first and the evidence panel beneath it; don't infer this order for other surfaces.

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
