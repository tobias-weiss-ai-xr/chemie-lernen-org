# Tests

## Overview

This directory contains the complete test suite for chemie-lernen.org, using **Jest** for unit tests and **Playwright** for end-to-end browser tests.

## Quick Start

```bash
# Install dependencies
npm install

# Run all unit tests
npm test

# Run tests with coverage (70% threshold)
npm run test:coverage

# Run a single test file
npx jest tests/stoichiometry.test.js

# Run all E2E tests (against production)
npx playwright test

# Run E2E tests in a specific browser
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

## Test File Naming

| Pattern     | Framework  | Environment |
| ----------- | ---------- | ----------- |
| `*.test.js` | Jest       | jsdom       |
| `*.spec.js` | Playwright | Browser     |

Jest config (`package.json`) matches `**/tests/**/*.test.js`. Playwright config (`tests/playwright.config.js`) matches `**/*.spec.js`.

## Jest (Unit Tests)

Run unit tests against calculator logic, chemistry utilities, and other JavaScript modules in a jsdom environment. No browser or server needed.

### Commands

```bash
npm test                    # Run all unit tests (excludes slow integration tests)
npm run test:watch          # Watch mode
npm run test:verbose        # Verbose output
npm run test:coverage       # With coverage report (target: 70% branches, functions, lines, statements)
npm run test:unit           # Explicit unit-only run (same as npm test)
npm run test:integration    # Run integration tests (visualization, accessibility, mobile)
npx jest path/to/file.test.js  # Single file
```

### Coverage Targets

```json
{
  "branches": 70,
  "functions": 70,
  "lines": 70,
  "statements": 70
}
```

Coverage collected from: `myhugoapp/static/js/calculators/**/*.js`, `myhugoapp/static/js/utils/**/*.js`

### Key Test Files

| File                                   | Tests                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `stoichiometry.test.js`                | `parseFormula`, `calcMolToMol`, `calcMassToMass`, `calcLimitingReactant`, `calcPercentYield`, `calcGasLaw` |
| `chemistry-utils.test.js`              | `getMolarMass`, `parseScientificNotation`, `getElementCount`, `validateFormula`                            |
| `advanced-calculators.test.js`         | Serial dilution and titration calculators                                                                  |
| `calc-equation-parser.test.js`         | Chemical equation parsing                                                                                  |
| `calc-gaslaw.test.js`                  | Gas law calculations                                                                                       |
| `calc-limiting.test.js`                | Limiting reactant calculations                                                                             |
| `calc-massmass.test.js`                | Mass-to-mass conversions                                                                                   |
| `calc-molmol.test.js`                  | Mole-to-mole conversions                                                                                   |
| `calc-multistep.test.js`               | Multi-step reaction calculations                                                                           |
| `calc-presets.test.js`                 | Preset reaction scenarios                                                                                  |
| `calc-presets-element-lookup.test.js`  | Element lookup related presets                                                                             |
| `calc-yield.test.js`                   | Percent yield calculations                                                                                 |
| `calc-history.test.js`                 | Calculation history management                                                                             |
| `dampfdruck-rechner.test.js`           | Vapor pressure (Clausius-Clapeyron)                                                                        |
| `verduennungsrechner.test.js`          | Dilution calculator                                                                                        |
| `verduennungsreihen-rechner.test.js`   | Serial dilution series                                                                                     |
| `konzentrationsumrechner.test.js`      | Concentration unit conversion                                                                              |
| `ph-rechner.test.js`                   | pH calculator                                                                                              |
| `export-manager.test.js`               | PDF/CSV export                                                                                             |
| `practice-quiz.test.js`                | Practice quiz mode                                                                                         |
| `security-utils.test.js`               | XSS prevention, input sanitization                                                                         |
| `ui-utils.test.js`                     | UI utility functions                                                                                       |
| `debug-logger.test.js`                 | Debug logging                                                                                              |
| `interactive-experiments.test.js`      | Interactive experiment logic                                                                               |
| `knowledge-graph.test.js`              | Neo4j KG integration                                                                                       |
| `kg-data-quality.test.js`              | KG data integrity checks                                                                                   |
| `neo4j-subset-filter.test.js`          | Neo4j subset filter logic                                                                                  |
| `rag-context.test.js`                  | RAG context assembling                                                                                     |
| `spaced-repetition.test.js`            | Spaced repetition algorithm                                                                                |
| `error-handler.test.js`                | Error handling utilities                                                                                   |
| `d3-ego-graph.test.js`                 | D3 ego graph rendering                                                                                     |
| `molare-masse-rechner.test.js`         | Molar mass calculator                                                                                      |
| `dichte-rechner.test.js`               | Density calculator                                                                                         |
| `druck-flaechen-rechner.test.js`       | Pressure/area calculator                                                                                   |
| `loeslichkeitsprodukt-rechner.test.js` | Solubility product calculator                                                                              |
| `chemisches-gleichgewicht.test.js`     | Chemical equilibrium                                                                                       |
| `hess-gesetz.test.js`                  | Hess's law                                                                                                 |
| `reaktionskinetik-simulator.test.js`   | Reaction kinetics simulator                                                                                |
| `redox-potenzial-rechner.test.js`      | Redox potential calculator                                                                                 |
| `atmosphaerendruck-alltag.test.js`     | Atmospheric pressure in daily life                                                                         |
| `bindungspotential.test.js`            | Bonding potential                                                                                          |
| `phase7-11-features.test.js`           | Phase 7-11 feature tests                                                                                   |
| `calc-stoichiometry-sub.test.js`       | Supplementary stoichiometry tests                                                                          |

## Playwright (E2E Tests)

E2E tests run against the **live production site** (`BASE_URL` defaults to `https://chemie-lernen.org`). There is no local web server configuration — tests require the site to be deployed.

### Commands

```bash
npx playwright test                        # All E2E tests, all browsers
npx playwright test --project=chromium     # Single browser
npx playwright test --project="Mobile Chrome"  # Mobile viewport
npx playwright test --headed               # Visible browser
npx playwright test --debug                # Debug mode
npx playwright test screenshots.spec.js    # Single file
```

### Playwright Configuration

```javascript
// tests/playwright.config.js
{
  testDir: '.',
  testMatch: '**/*.spec.{js,ts}',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.BASE_URL || 'https://chemie-lernen.org',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] },
  ],
}
```

### Key E2E Test Files

| File                                   | Tests                                    |
| -------------------------------------- | ---------------------------------------- |
| `screenshots.spec.js`                  | Screenshot comparison for all main pages |
| `test-calculators.spec.js`             | Calculator UI interactions               |
| `test-quiz-system.spec.js`             | Quiz system end-to-end flow              |
| `test-pages.features.spec.js`          | Core page functionality                  |
| `test-formula-rendering.spec.js`       | KaTeX/mhchem formula rendering           |
| `test-language-switcher.spec.js`       | Language switching (DE/EN)               |
| `test-dark-mode.spec.js`               | Dark mode toggle                         |
| `test-molecule-studio-visual.spec.js`  | Molekuel Studio (Three.js) visual tests  |
| `test-molekuel-studio.spec.js`         | Molecule Studio functionality            |
| `test-titrations-simulator.spec.js`    | Titration simulator                      |
| `test-gasgesetz-rechner.spec.js`       | Gas law calculator UI                    |
| `test-verbrennungsrechner.spec.js`     | Combustion calculator                    |
| `test-visualizations.spec.js`          | D3 visualization rendering               |
| `test-entity-knowledge-graph.spec.js`  | Entity knowledge graph page              |
| `test-progress-tracker.spec.js`        | Progress tracking UI                     |
| `test-pwa-manifest.spec.js`            | PWA manifest and service worker          |
| `test-green-colors.spec.js`            | Green color theme consistency            |
| `test-curricula-modulhandbuch.spec.js` | Curricula and modulhandbuch pages        |
| `interactive-experiments.spec.js`      | Interactive experiment pages             |
| `complete-site-audit.test.js`          | Full site crawl and audit                |
| `site-accessibility-audit.test.js`     | Accessibility audit                      |
| `mobile-responsiveness.test.js`        | Mobile responsive layout checks          |
| `accessibility-validation.test.js`     | Accessibility validation                 |
| `modulhandbuch-api.test.js`            | Modulhandbuch API endpoint tests         |
| `smoke-scripts.test.js`                | Production smoke tests                   |

## CI/CD Integration

The deploy workflow (`.github/workflows/deploy.yml`) runs unit tests on every push to master:

```yaml
- name: Run unit tests
  run: npm test
```

After deployment, smoke tests run on the production server before healthchecks.io is pinged. E2E tests are run manually or on demand.
