# Tasks: a11y-interactive-contrast

## 1. Periodic-table auto-contrast

- [x] Add `readableText()` helper to `perioden-system-der-elemente.js`
- [x] Apply on tile creation + `updateElementColors()`

## 2. FSRS score-button labels

- [x] `type="button"` + `aria-label` on the 4 buttons in `lernkarten-review.html`

## 3. Quiz a11y

- [x] `aria-label` on answer options in `quiz-ui.js`
- [x] Move focus to results heading after submit

## 4. Comparison-tool a11y

- [x] `role="listbox"` + `aria-label` on dropdown (`vergleich.html`)
- [x] `role="option"` + `aria-label` on suggestions (`vergleich.js`)
- [x] Chip remove as `role="button"` + keyboard handler (`vergleich.js`)

## 5. Spec & validation

- [x] Update `a11y-compliance` spec (REQ-A11Y-3, REQ-A11Y-10)
- [x] Lint + Hugo build green
