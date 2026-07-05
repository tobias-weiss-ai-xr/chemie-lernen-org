# Spec: a11y-compliance

**Capability:** WCAG 2.1 AA accessibility compliance
**Owners:** Sisyphus (Sprint 7)
**Status:** Active — main spec; deltas via `openspec/changes/`

---

## Purpose

chemie-lernen.org is legally required to comply with the EU
Accessibility Act (in force since 2025-06-28), BITV 2.0, and BFSG.
The site claims WCAG 2.1 AA + BITV 2.0 in `pages/barrierefreiheit.md`.

This spec is the source of truth for the _technical_ accessibility
implementation. The legal/policy page tracks the certification status.

## Requirements

### REQ-A11Y-1: Skip-link

Every page has exactly one skip-link as the first focusable element.
`<a href="#main-content" class="sr-only sr-only-focusable">Zum Hauptinhalt springen</a>`
lives in `_default/baseof.html` (line 16), before `{{ partial "header.html" . }}`.
This uses Bootstrap 3's `sr-only`/`sr-only-focusable` utility classes which
implement the standard screen-reader-only pattern. The skip-link is
rendered on every page through the base template.

### REQ-A11Y-2: Focus indicators

All focusable elements show a 3px solid `#ffc107` focus ring on
keyboard focus. Implemented in `myhugoapp/static/css/green-theme.css`
via `:focus-visible`. This is the canonical "Klare sichtbare
Fokus-Indikatoren" requirement from `barrierefreiheit.md`.

### REQ-A11Y-3: Color contrast

All text and meaningful UI elements must meet 4.5:1 (normal text) or
3:1 (large text) contrast against their background.

Verified color pairings:

- Difficulty badge green: `#1e7e34` on white (4.94:1, was `#28a745` at 3.32:1)
- Difficulty badge red: `#a71d2a` on white (6.21:1, was `#dc3545` at 4.49:1)
- Default body text: `#212529` on white (16.78:1)
- Link blue: `#0066cc` on white (6.44:1)
- Source chip text: `#333` on `#f0f4f8` (12.4:1)

### REQ-A11Y-4: prefers-reduced-motion

`myhugoapp/static/css/a11y-reduced-motion.css` is loaded on every page.
When `@media (prefers-reduced-motion: reduce)` matches:

- All `transition` and `animation` durations become 0
- D3 force simulations freeze (no node movement)
- 3D molecule rotations stop
- Periodic table auto-rotation stops
- Particle effects in the KI-assistent are disabled

The 3D visualization files (`molekuel-studio.js`, `3d-visualizer.js`,
`molekuelorbitale.js`) all check `matchMedia('(prefers-reduced-motion:
reduce)').matches` before starting any animation loop.

### REQ-A11Y-5: ARIA live regions

The quiz system uses `aria-live="polite"` on the result container so
screen readers announce correctness without interrupting the user.
Implemented in `myhugoapp/layouts/partials/quiz.html`.

### REQ-A11Y-6: Canvas a11y

The Molekül-Studio 3D canvas updates its `aria-label` dynamically when
the molecule changes (from generic "3D Molekül-Visualisierung" to
"Ammoniak-Molekül, NH3, 3D-Visualisierung" etc.).

### REQ-A11Y-7: D3 ego-graph a11y

The D3 force-graph in `myhugoapp/static/js/visualization/d3-ego-graph.js`:

- The SVG has `role="img"` and `aria-label="Wissensgraph für {entity}"`
- Inside the SVG: `<title>` and `<desc>` for native screen-reader
  tooltips
- Each node circle has `tabindex="0"` and accepts focus
- A `<ul>` fallback list (sr-only class) is rendered below the SVG
  with `entity name + link` for each node
- Keyboard: `Enter` or `Space` on a focused node triggers the same
  click handler as a mouse click

### REQ-A11Y-8: pa11y CI

`.pa11yci.json` configures the pa11y-ci runner:

```json
{
  "standard": "WCAG2AA",
  "level": "AA",
  "urls": [
    "https://chemie-lernen.org/",
    "https://chemie-lernen.org/ki-assistent/",
    "https://chemie-lernen.org/wissennetz/",
    "https://chemie-lernen.org/entity/ammoniak/",
    "https://chemie-lernen.org/entity/glucose/",
    "https://chemie-lernen.org/molekuel-studio/",
    "https://chemie-lernen.org/perioden-system-der-elemente/",
    "https://chemie-lernen.org/rechner/molmasse/"
  ]
}
```

Runs as a scheduled GitHub Action (not on every push — the live site is
audited once per week).

### REQ-A11Y-9: Local accessibility tests

`tests/accessibility-validation.test.js` runs locally (no live site
required) and verifies:

- Each page has a single skip-link
- Focus rings are 3px solid #ffc107
- No `prefers-reduced-motion` media query absent
- Quiz page has `aria-live` regions
- All `*.min.js` and `*.optimized.js` are excluded from axe-core scans
- All `<canvas>` elements have a non-empty `aria-label`
- The D3 ego-graph module exposes `role="img"` and `<ul>` fallback

## Scenarios

### S-A11Y-1: Screen reader user opens entity page

**Given** the user has a screen reader (NVDA / VoiceOver) and visits
`/entity/ammoniak/`
**When** the page loads
**Then**:

- The skip-link is announced as "Zum Hauptinhalt springen, link"
- Pressing Enter skips to main content
- The ego-graph SVG is announced as "Wissensgraph für Ammoniak, image"
- Each node can be navigated to with Tab, announced with its name
- Pressing Enter on a node navigates to that entity

### S-A11Y-2: User with motion-sensitivity visits Molekül-Studio

**Given** the user has `prefers-reduced-motion: reduce` set
**When** they visit `/molekuel-studio/` and load a molecule
**Then** the molecule is shown static (no rotation)
**And** `transition` and `animation` CSS rules have 0 duration
**And** the user can still interact with the model (zoom, rotate manually)

### S-A11Y-3: Lighthouse a11y audit on entity page

**Given** Lighthouse runs in headless Chromium against
`https://chemie-lernen.org/entity/ammoniak/`
**When** the audit completes
**Then** the a11y score is ≥ 95 (ideally 100)
**And** there are no color-contrast violations
**And** the page passes axe-core, pa11y, and Lighthouse simultaneously

## References

- `myhugoapp/static/css/a11y-reduced-motion.css` — new file
- `myhugoapp/static/css/green-theme.css` — focus indicator
- `myhugoapp/layouts/_default/baseof.html` — skip-link
- `myhugoapp/layouts/partials/quiz.html` — aria-live
- `myhugoapp/static/js/visualization/d3-ego-graph.js` — D3 a11y
- `myhugoapp/static/js/{molekuel-studio,3d-visualizer,molekuelorbitale}.js` — motion
- `tests/accessibility-validation.test.js` — local tests
- `.pa11yci.json` — CI config
- `myhugoapp/content/pages/barrierefreiheit.md` — policy page
