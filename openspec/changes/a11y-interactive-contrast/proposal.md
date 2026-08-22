# Change Proposal: a11y-interactive-contrast

## Why

The Lighthouse a11y audit (~75/100) flagged remaining WCAG gaps beyond the
skip-link / theme-switcher work. Concretely:

- Periodic-table category colours (blue / purple / red) failed AA contrast
  against the fixed green / white / cyan tile text.
- FSRS spaced-repetition score buttons, the quiz answer options, and the
  element-comparison tool lacked explicit ARIA labels and/or focus management.

## What Changes

- **Periodic-table tiles** (`perioden-system-der-elemente.js`): auto-contrast
  text — `readableText()` picks black `#111` / white `#fff` by relative
  luminance (threshold L > 0.179), applied on tile creation and on every trend
  recolor. Guarantees ≥ 4.5:1 for all 18 group colours and the continuous
  trend palette.
- **FSRS review buttons** (`lernkarten-review.html`): `type="button"` +
  descriptive `aria-label` on all four score buttons.
- **Quiz** (`quiz-ui.js`): `aria-label` = option text on each answer button;
  focus moves to the results heading after submit.
- **Comparison tool** (`vergleich.html` / `vergleich.js`): autocomplete
  dropdown `role="listbox"` + `aria-label`; suggestions `role="option"` +
  `aria-label`; chip "remove" controls `role="button"`, `tabindex="0"`,
  `aria-label`, Enter/Space handler.

## Impact

- Pure front-end a11y hardening; no API / data / KG changes.
- Files touched: `perioden-system-der-elemente.js`, `quiz-ui.js`,
  `vergleich.js`, `lernkarten-review.html`, `vergleich.html`.
- Advances `REQ-A11Y-3` (contrast) and adds `REQ-A11Y-10` in the
  `a11y-compliance` capability.
