# Capability: a11y-compliance

WCAG 2.1 AA accessibility compliance for chemie-lernen.org.

## MODIFIED Requirements

### Requirement: REQ-A11Y-3: Color contrast

All text and meaningful UI elements MUST meet 4.5:1 (normal text) or 3:1
(large text) contrast against their background.

ADDED verified pairing:

- Periodic-table element tiles: text colour auto-selected black `#111` /
  white `#fff` by relative luminance via `readableText()` in
  `perioden-system-der-elemente.js`, applied on tile creation and on every
  trend recolor — guarantees ≥ 4.5:1 for all 18 group colours and the
  continuous trend palette.

#### Scenario: S-A11Y-3a: Periodic-table text stays readable on dark categories

- **GIVEN** a periodic-table tile with a dark category background (e.g. blue / purple / red)
- **WHEN** the tile is rendered
- **THEN** its text uses the high-contrast colour (white) so contrast ≥ 4.5:1

## ADDED Requirements

### Requirement: REQ-A11Y-10: Interactive control ARIA labels & focus management

All JS-generated interactive controls and custom button groups SHALL expose
an accessible name and, where they replace native controls, keyboard
operability.

- FSRS review score buttons (`lernkarten-review.html`) SHALL each carry
  `type="button"` and a descriptive `aria-label`
  (`Taste 1: Wiederholen, sehr schwer` … `Taste 4: Leicht, sofort gewusst`).
- Quiz (`quiz-ui.js`) answer-option buttons SHALL carry `aria-label` = the
  option text; after submitting, focus SHALL move to the results heading
  (`tabindex="-1"` + `.focus()`).
- Element comparison tool (`vergleich.html` / `vergleich.js`): the
  autocomplete dropdown SHALL be a `role="listbox"` with `aria-label`; each
  suggestion SHALL be `role="option"` + `aria-label`; chip "remove" controls
  SHALL be `role="button"`, `tabindex="0"`, `aria-label`, and respond to
  Enter/Space.

#### Scenario: S-A11Y-10a: Periodic-table text stays readable on dark categories

- **GIVEN** a periodic-table tile with a dark category background (e.g. blue / purple / red)
- **WHEN** the tile is rendered
- **THEN** its text uses the high-contrast colour (white) so contrast ≥ 4.5:1

#### Scenario: S-A11Y-10b: FSRS buttons are labelled

- **GIVEN** the spaced-repetition review screen
- **WHEN** a screen reader focuses a score button
- **THEN** it announces the key + meaning (e.g. "Taste 1: Wiederholen, sehr schwer")

#### Scenario: S-A11Y-10c: Quiz focus moves to results

- **GIVEN** a user submits a quiz
- **WHEN** results render
- **THEN** focus moves to the results heading
