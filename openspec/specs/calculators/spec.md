# Spec: calculators

**Capability:** Interactive chemistry calculators and tools for chemie-lernen.org
**Owners:** Sisyphus
**Status:** Active — main spec

---

## Purpose

chemie-lernen.org offers 30+ interactive chemistry calculators and tools
covering stoichiometry, gas laws, pH, redox potentials, spectroscopy,
and more. These calculators are the platform's most interactive feature
and are used by German secondary-school students (Klasse 8-13) to:

- Solve chemistry problems step by step
- Visualize chemical concepts through interactive computation
- Practice with generated exercises and quizzes
- Verify homework results

The calculators follow a standardized framework that ensures consistent
input validation, result display, error handling, and accessibility
across all tools.

## Requirements

### REQ-CALC-1: Calculator framework

All calculators are built on the `ChemistryCalculator` base class
defined in `chemistry-calculator-framework.js`. This class provides:

- Input field configuration and DOM caching
- Number/select/checkbox/text input validation with type-specific rules
- Result display with animation
- Validation error display with auto-hide (5 second timeout)
- Calculation error handling with dedicated error container

### REQ-CALC-2: Calculator inventory

The platform provides at least 30 calculator/tool pages across these
categories:

**Phase 1-2 calculators:** druck-flaechen-rechner, atmosphaerendruck-alltag,
bindungspotential, hess-gesetz, reaktionskinetik-simulator,
chemisches-gleichgewicht, gasgesetz-rechner, verbrennungsrechner,
loeslichkeitsprodukt-rechner, redox-potenzial-rechner,
konzentrationsumrechner, titrations-simulator, atomenergieniveaus,
periodische-trends, molekuelorbitale, elektrochemie-teilchenebene,
redox-titrationen, saeuren-basen-gleichgewicht, waermeleitung,
konvektion, temperatur-teilchenbewegung, torricelli-versuch,
enhanced-ph-visualization

**Stoichiometry suite:** stoechiometrie-rechner via lazy-loaded
sub-calculators (calc-presets, calc-equation-parser, calc-element-lookup,
calc-history, calc-molmol, calc-massmass, calc-limiting, calc-yield,
calc-multistep, calc-gaslaw)

**Core tools:** molare-masse-rechner, reaktionsgleichungen-ausgleichen,
einheitenumrechner, loesungsrechner, dampfdruck-rechner,
verduennungsreihen-rechner, dichte-rechner

### REQ-CALC-3: Shared chemistry utilities

Calculator functions rely on browser globals exposed by
`chemistry-utils.js`:

- `parseFormula(formula)` — parse chemical formula into element counts
- `getMolarMass(formula)` — calculate molar mass from formula
- `getElementCount(formula, element)` — count occurrences of an element
- `validateFormula(formula)` — validate formula format
- `formatScientificNotation(value)` — format numbers in scientific notation
- `parseScientificNotation(str)` — parse scientific notation strings

These are loaded as `<script>` tag globals before calculator-specific
scripts.

### REQ-CALC-4: Lazy loading

Calculators are loaded on demand via `LazyLoader.loadCalculator()`:

- `stoichiometry` type loads 10 sub-calculator scripts sequentially
- `werkzeuge` type loads 3 utility scripts
- `uebungen` type loads practice-quiz.js
- `tutorien` type loads tutorials.optimized.js
- IntersectionObserver triggers loading when calculator enters viewport
  with 50px rootMargin
- Fallback to preloadCritical() for browsers without IntersectionObserver

### REQ-CALC-5: Input validation

Every calculator validates input before computation:

- Number fields check `Number.isFinite(parsed)` and reject NaN
- Configurable min/max value constraints
- Custom validation functions per field
- Regex pattern validation
- Validation errors shown inline with red styling, auto-hide after 5s
- Enter key triggers calculation

### REQ-CALC-6: Result display

Calculation results are:

- Displayed in configured result fields with textContent assignment
- Animated with `.result-updated` CSS class (300ms)
- Shown only after successful validation
- Error messages shown in `.calculator-error` container with red styling

### REQ-CALC-7: i18n integration

Calculator UI text uses the I18nManager singleton for German localization:

- Labels, placeholders, and error messages in German
- Unit display follows German conventions (K instead of C for Kelvin,
  comma as decimal separator)
- Language switcher (`language-switcher.js`) updates calculator UI

### REQ-CALC-8: Performance optimization

- Minified versions (`*.optimized.js`) are served in production
  via Terser (configured in `scripts/minify-calculators.js`)
- Stoichiometry calculators are lazy-loaded, not loaded on every page
- `LazyLoader` name is preserved during mangling for correct references

### REQ-CALC-9: Accessibility

- All inputs have associated `<label>` elements
- Validation errors use visible text (not just color changes)
- Error messages are announced to screen readers via aria-live regions
- Results are textContent (not innerHTML) to prevent XSS
- Keyboard navigation: Enter triggers calculation, Tab navigates fields

### REQ-CALC-10: Testing

Calculator logic is covered by Jest unit tests:

- `tests/chemistry-utils.test.js` — formula parsing, molar mass,
  validation edge cases
- Stoichiometry calculator tests
- Framework integration tests
- Tests run in jsdom environment for DOM-dependent features

### REQ-CALC-11: Responsive design

Calculator layouts adapt to screen sizes:

- Single-column layout on mobile (<768px)
- Two-column input/result layout on desktop
- Touch-friendly input sizing on mobile
- Prevent zoom on iOS input focus via `font-size: 16px`

### REQ-CALC-12: Calculator page template

Each calculator page has:

- Hugo content file at `myhugoapp/content/<name>.md`
- Hugo layout at `myhugoapp/layouts/_default/<name>.html`
- JS file at `myhugoapp/static/js/<name>.js` (or in `calculators/`)
- Registration in `lazy-loader.js` if lazy-loaded
- Cross-links from relevant Themenbereiche and entity pages

## Scenarios

### S-CALC-1: Student calculates molar mass

**Given** a student visits `/molare-masse-rechner/`
**When** they enter the formula "H2SO4"
**And** click "Berechnen"
**Then** the calculator displays:

- H: 2 × 1.008 = 2.016 g/mol
- S: 1 × 32.065 = 32.065 g/mol
- O: 4 × 15.999 = 63.996 g/mol
- Total: 98.077 g/mol

### S-CALC-2: Invalid formula handling

**Given** a student enters an invalid formula "X2Y"
**When** they click "Berechnen"
**Then** an error message "Unbekanntes Element: X" is shown in red
**And** the error auto-hides after 5 seconds

### S-CALC-3: Stoichiometry calculator lazy loading

**Given** a student visits `/stoechiometrie-rechner/`
**When** the page loads
**Then** only the HTML shell and framework are loaded
**When** the student scrolls to the calculator container
**Then** IntersectionObserver triggers lazy loading
**And** 10 sub-calculator scripts are loaded sequentially
**And** calculation inputs become interactive

### S-CALC-4: Mobile pH calculation

**Given** a student on a mobile device visits `/ph-rechner/`
**When** they enter H3O+ concentration "0,001" (German decimal comma)
**Then** the calculator parses the value correctly
**And** displays pH = 3.00 on a single-column layout
**And** the input field does not auto-zoom on focus

### S-CALC-5: Practice generator

**Given** a student visits `/uebungsgenerator/`
**When** they select "Stöchiometrie" and "Mittelschwer"
**Then** `practice-generators.js` generates 5 random stoichiometry problems
**And** each problem has input fields for the answer
**And** answers are validated against computed correct values
**And** a score is displayed after submission

## References

- `myhugoapp/static/js/chemistry-calculator-framework.js` — base class
- `myhugoapp/static/js/utils/chemistry-utils.js` — shared utilities
- `myhugoapp/static/js/lazy-loader.js` — on-demand script loading
- `myhugoapp/static/js/calculators/` — 22 calculator sub-modules
- `myhugoapp/static/js/practice-generators.js` — exercise generation
- `myhugoapp/static/js/i18n/i18n-manager.js` — localization
- `scripts/minify-calculators.js` — Terser minification pipeline
- `tests/chemistry-utils.test.js` — unit tests
- `myhugoapp/layouts/_default/` — calculator HTML templates
