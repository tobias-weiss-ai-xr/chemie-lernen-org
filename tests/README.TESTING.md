# Testing Guide — chemie-lernen.org

This is the **umbrella testing guide** for the project. It covers all three test
layers, how to run them (including by domain), environment requirements, how to
add tests, and CI/flaky-test handling.

For the original visual-testing notes, see [Visual Testing](#visual-testing-with-playwright) at the bottom.

---

## 1. Test layers at a glance

| Layer       | Files        | Runner     | Environment                          | Needs external services?        |
| ----------- | ------------ | ---------- | ------------------------------------ | ------------------------------- |
| Unit (ESM)  | `*.test.js`  | Jest       | jsdom (per-file `@jest-environment`) | No                              |
| Unit (Node) | `*.test.mjs` | Jest       | node (`--experimental-vm-modules`)   | Some: vendored API core + Neo4j |
| E2E         | `*.spec.js`  | Playwright | Real browser                         | Live site (default prod)        |

Jest's default `testMatch` picks up **both** `*.test.js` and `*.test.mjs`
(`**/?(*.)+(spec|test).[jt]s?(x)`); Playwright only runs `*.spec.{js,ts}`
(`tests/playwright.config.js` → `testMatch: '**/*.spec.{js,ts}'`).

> ⚠️ The `.mjs` unit tests that import `api/**` require the **proprietary API
> core**, which is vendored by `npm run pretest` (clones a private repo via a
> deploy key into `.core/` and copies it into place). They also frequently need a
> running **Neo4j** instance. In CI, `pretest` runs automatically before
> `npm test`, and Neo4j is part of the stack — so these pass there. Locally,
> run `npm run pretest` first, or run the hermetic subset (see below).

---

## 2. Prerequisites

```bash
npm install                 # install devDependencies (jest, playwright, …)
npm run pretest             # vendor private API core into .core/ (REQUIRED for *.mjs API tests)
npx playwright install      # download browser binaries for E2E
```

Optional: a running Neo4j (e.g. the `chemie-neo4j` / `leads-neo4j` container)
for the DB-backed `.mjs` tests. The KG subset is scoped via
`scripts/_neo4j-subset-filter.mjs` — see that file before any KG query.

---

## 3. Running tests

### Jest (unit / integration)

```bash
npm test                              # all Jest tests, excludes heavy audit suites
npm run test:unit                     # explicit unit-only (same as npm test)
npm run test:hermetic                 # FAST + offline: .test.js only, no .mjs/integration
npm run test:watch                    # watch mode
npm run test:verbose                  # verbose output
npm run test:coverage                 # coverage report + baseline threshold gate
npx jest tests/stoichiometry.test.js  # single file
```

**Domain subsets** (handy for TDD on one area):

```bash
npm run test:calculators   # all calculator logic
npm run test:chemistry     # chemistry-utils (parseFormula, getMolarMass, …)
npm run test:kg            # knowledge-graph / curricula / modulhandbuch scripts
npm run test:api           # API services (auto-grader, exercise-gen, learning-engine, …)
npm run test:ui            # UI/utils (ui-utils, error-handler, quiz, export-manager, …)
```

> The `.mjs` integration tests are **not** part of `test:calculators` /
> `test:chemistry` / `test:ui` (those target `*.test.js`). They are grouped under
> `test:kg` and `test:api` because they exercise the KG/API surface.

### Playwright (E2E)

E2E runs against the **live site** (`BASE_URL`, default
`https://chemie-lernen.org`) — there is no local web server in the Playwright
config. The site must be deployed.

```bash
npx playwright test                              # all E2E, all browsers
npx playwright test --project=chromium           # single browser
npx playwright test --project="Mobile Chrome"    # mobile viewport
npx playwright test --headed / --debug           # visible / debug
```

**E2E subsets:**

```bash
npm run test:e2e:hubs     # Hubs rooms (manifest + console-error guards)
npm run test:e2e:pwa      # PWA manifest + service worker
npm run test:e2e:visual   # Molecule Studio + green-theme visual checks
npm run test:e2e:smoke    # core page functionality smoke
```

---

## 4. Test inventory (by domain)

### Calculators & chemistry (`*.test.js`)

`stoichiometry`, `calc-*` (gaslaw, limiting, massmass, molmol, multistep, yield,
presets, presets-element-lookup, stoichiometry-sub, history), `advanced-calculators`,
`molare-masse-rechner`, `ph-rechner`, `dampfdruck-rechner`, `verduennungsrechner`,
`verduennungsreihen-rechner`, `konzentrationsumrechner`, `dichte-rechner`,
`druck-flaechen-rechner`, `loeslichkeitsprodukt-rechner`, `chemisches-gleichgewicht`,
`hess-gesetz`, `reaktionskinetik-simulator`, `redox-potenzial-rechner`,
`atmosphaerendruck-alltag`, `bindungspotential`, `chemistry-utils`.

### Knowledge graph / scripts (`*.test.mjs` + some `*.test.js`)

`neo4j-subset-filter`, `knowledge-graph`, `kg-data-quality`, `curricula-graph`,
`entity-index`, `generate-themenbereich-entities`, `blooms-index-import`,
`api-import-scope`, `malformed-uri`, `modulhandbuch-*`, `neo4j-service`.

### API / services (`*.test.mjs`)

`auto-grader`, `exercise-generator`, `exercise-api-integration`,
`exercise-route-security`, `feedback-engine`, `learning-engine`,
`learning-paths-next`, `session-store`, `assessment-store`, `assessment-dashboard`,
`rag-context`, `zpd-engine*`, `didaktik-api`, `modulhandbuch-api`, `premium-*`,
`security-utils`, `theme-overrides*`, `stripe-*`, `scoped-quota`, `collab-challenges`,
`adaptive-difficulty`, `fsrs-cards`, `spaced-repetition`.

### UI / utils (`*.test.js`)

`ui-utils`, `debug-logger`, `error-handler`, `dropdown-init`, `export-manager`,
`quiz-system`, `quiz-integration`, `practice-quiz`, `lesson-plan`, `session-plan`,
`offline-calculator`, `ki-assistent`, `d3-ego-graph`, `tutorials`, `progress-tracker`,
`interactive-experiments`.

### E2E (`*.spec.js`)

`test-calculators`, `test-quiz-system`, `test-pages.features`,
`test-formula-rendering`, `test-language-switcher`, `test-dark-mode`,
`test-molekuel-studio`, `test-molecule-studio-visual`, `test-titrations-simulator`,
`test-gasgesetz-rechner`, `test-verbrennungsrechner`, `test-visualizations`,
`test-entity-knowledge-graph`, `test-progress-tracker`, `test-pwa-manifest`,
`test-green-colors`, `test-curricula-modulhandbuch`, `interactive-experiments`,
`test-hubs-integration`, plus audit suites `complete-site-audit`,
`site-accessibility-audit`, `mobile-responsiveness`, `accessibility-validation`,
`screenshots`.

---

## 5. Coverage

`npm run test:coverage` collects coverage from the shipped client code
(`myhugoapp/static/js/calculators`, `myhugoapp/static/js/utils`) — configured in
`the `jest`key in`package.json``. The proprietary API core (`.core/`) is excluded.

**Current baseline (measured 2026-08-24, hermetic unit run):**
`Statements 37.4% · Branches 42.8% · Functions 39.0% · Lines 38.6%`.

> ⚠️ Earlier docs claimed a _70% threshold_. That is an **aspirational target**,
> not currently met and not previously enforced. `the `jest`key in`package.json``now enforces a
**baseline threshold** a few points below the measured values, so`test:coverage`
> passes today and acts as a regression floor. Raise the threshold gradually
> toward 70% as coverage improves — do not jump to 70% at once or CI will fail.

Run a focused coverage check:

```bash
NODE_OPTIONS="--experimental-vm-modules" npx jest --coverage \
  --testPathPatterns='calc-|chemistry-utils' \
  --collectCoverageFrom='myhugoapp/static/js/calculators/**/*.js' \
  --collectCoverageFrom='myhugoapp/static/js/utils/**/*.js'
```

> The `coverageThreshold` is a **global** gate and is only meaningful on a full
> run (`npm run test:coverage`), which exercises all of `collectCoverageFrom`.
> Running a _narrow_ `--testPathPatterns` subset with `--coverage` naturally
> reports lower coverage of the whole scope and may not satisfy the threshold —
> that is expected, not a regression.

---

## 6. CI behavior & flaky-test handling

- `npm test` is run on every push by `.github/workflows/deploy.yml`; `pretest`
  (vendoring the private core) runs automatically first.
- Playwright config: `retries: 2` and `workers: 1` on CI (`forbidOnly` enabled so
  a stray `test.only` fails the build).
- **Quarantine:** move a flaky/slow suite into `tests/__flaky__/` to keep it out
  of the default run (it is in `testPathIgnorePatterns`). Investigate and
  re-enable rather than leaving it quarantined indefinitely.
- **Hermetic CI:** for a fast, offline gate use `npm run test:hermetic` (excludes
  `.mjs` integration tests + audit suites). Run the `.mjs`/integration layer
  separately where Neo4j + vendored core are available.

---

## 7. Adding a test

**Jest unit test (`*.test.js`, jsdom):**

```js
/**
 * @jest-environment jsdom
 */
import { parseFormula } from '../../myhugoapp/static/js/utils/chemistry-utils.js';

describe('parseFormula', () => {
  test('parses H2O', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 });
  });
});
```

**Jest ESM test (`*.test.mjs`, node):** import globals explicitly and use the
node environment docblock:

```js
/**
 * @jest-environment node
 */
import { jest, describe, test, expect } from '@jest/globals';
```

**Playwright E2E (`*.spec.js`):** use `test()` / `expect()` from
`@playwright/test`; assert against the live site or a route. Keep console-error
guards (see `test-hubs-integration.spec.js`) for regression protection.

Conventions: shared browser globals (e.g. `parseFormula`, `getMolarMass`) are
declared in `eslint.config.mjs` for calculator files; calculator code uses
`sourceType: 'script'` (global scope), while Three.js / `*.module.js` files use
ES modules.

---

## Visual Testing with Playwright

This directory contains automated visual tests for the Chemie Lernen website using Playwright.

### Quick Start

```bash
# Using Docker
./run-visual-tests.sh

# Or with npx directly
npx playwright test screenshots.spec.js

# Or run all tests
npx playwright test
```

### Test Files

- `test-green-colors.spec.js` - Green color consistency tests across all pages
- `test-molecule-studio-visual.spec.js` - Comprehensive visual tests for Molekülstudio and Periodensystem
- `screenshots.spec.js` - Simple screenshot tests for all main pages

### Docker Setup

Build and run the Playwright Docker container:

```bash
docker build -f Dockerfile.playwright -t chemie-lernen-playwright .
docker run --rm -v $(pwd)/test-results:/app/test/results chemie-lernen-playwright
docker run --rm -v $(pwd)/test-results:/app/test/results chemie-lernen-playwright test screenshots.spec.js
```

### Screenshots

Saved to `test-results/` (full reports) and `screenshots/`.

### Environment Variables

- `BASE_URL` - Base URL for testing (default: https://chemie-lernen.org)
- `SCREENSHOT_DIR` - Directory for screenshots (default: screenshots)

### Debugging

```bash
npx playwright test --debug
npx playwright test --headed
```
