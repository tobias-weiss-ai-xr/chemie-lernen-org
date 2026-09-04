# Design: a11y-interactive-contrast

## Periodic-table contrast

Added `readableText(bg)` returning `#111` / `#fff` by relative luminance
(threshold L > 0.179, the WCAG AA cross-over for black vs white text).
Applied to `.element` and its `.number` / `.symbol` / `.details` /
`.emoji-link` children on creation and inside `updateElementColors()`, so
trend recolours keep contrast. Inline `style.color` overrides the fixed
CSS colours (which had `!important` only on hover states).

## FSRS / quiz / comparison ARIA

- **FSRS** (`lernkarten-review.html`): static `aria-label` + `type="button"`
  on the four score buttons (was `title`-only).
- **Quiz** (`quiz-ui.js`): `aria-label` = option text on each answer button;
  after results render, the results heading gets `tabindex="-1"` and
  `.focus()` so screen-reader / keyboard users land on the outcome.
- **Comparison** (`vergleich.html` + `vergleich.js`): dropdown container
  `role="listbox"` + `aria-label`; suggestions `role="option"` +
  `aria-label`; chip remove span becomes `role="button"`, `tabindex="0"`,
  `aria-label`, with an Enter/Space keydown handler mirroring the click.

## Verification

- `node --check` on the two edited JS files.
- Repo `eslint . --ext .js` → 0 errors.
- `hugo --minify` build OK; `role="listbox"` and the four FSRS `aria-label`s
  confirmed present in the built HTML.
