# AGENTS.md — chemie-lernen.org

Hugo-based static site for interactive chemistry education (German, `de-de`). Theme: `hugo-cards`.

## Commands

```bash
# Dev server (requires Hugo extended locally)
cd myhugoapp && hugo server -D

# Unit tests (Jest, jsdom environment)
npm test
npm run test:coverage          # with coverage (70% threshold)
npm run test:unit              # skip slow integration tests
npx jest tests/chemistry-utils.test.js  # single file

# E2E tests (Playwright — runs against live production site, NOT local dev)
npx playwright test
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"

# Lint & format (pre-commit hook runs lint-staged automatically)
npm run lint
npm run lint:fix
npm run format
npm run validate              # lint + format:check + test

# Build (Docker-based, uses Hugo extended 0.57.0)
npm run build                  # docker run hugo --minify

# Optimize (⚠️ minify OVERWRITES source files in-place)
npm run minify                 # terser on select calculator files
npm run optimize               # minify + performance check

# Performance budgets
npm run analyze:bundle
```

## Architecture

### JavaScript is NOT ESM

Most JS files use `sourceType: 'script'` (global scope, `<script>` tags). Only Three.js visualization files (`perioden-system-der-elemente.js`, `molekuel-studio.js`, `three/**/*.js`, `*.module.js`) use ES modules. Calculator files use `module.exports` / `require` pattern.

### Shared globals pattern

`myhugoapp/static/js/utils/chemistry-utils.js` exposes functions as **browser globals**: `parseFormula`, `getMolarMass`, `parseScientificNotation`, `formatScientificNotation`, `getElementCount`, `validateFormula`. Calculator files depend on these being loaded first. The ESLint config declares these globals for calculator files.

### Calculator framework

`chemistry-calculator-framework.js` defines the `ChemistryCalculator` class. Individual calculators (pH, molar mass, titration, etc.) follow this pattern. Each calculator page has a corresponding layout in `myhugoapp/layouts/_default/<name>.html` and content in `myhugoapp/content/<name>.md`.

### Lazy loading

`lazy-loader.js` manages on-demand calculator loading. Hugo templates wire this via `LazyLoader.loadCalculator()` in `baseof.html` — calculators load only on their specific routes, not on every page.

### Content structure

- `myhugoapp/content/themenbereiche/` — 12 subject areas (topic pages)
- `myhugoapp/content/*.md` — calculator/interactive tool landing pages
- `myhugoapp/content/pages/` — general pages (about, roadmap, contact)
- `myhugoapp/content/klassenstufen/` — grade-level organization

### Key directories

| Directory | Purpose |
|-----------|---------|
| `myhugoapp/static/js/` | All JavaScript (calculators, utils, visualizations, i18n, analytics) |
| `myhugoapp/static/js/calculators/` | Core calculator logic (stoichiometry, practice generators) |
| `myhugoapp/static/js/utils/` | Shared chemistry utilities |
| `myhugoapp/static/js/i18n/` | Internationalization |
| `myhugoapp/static/js/visualization/` | 3D/periodic table visualizations |
| `myhugoapp/layouts/_default/` | Hugo templates — one `.html` per calculator/page |
| `myhugoapp/layouts/partials/` | Shared template partials (head, header, footer, quiz) |
| `tests/` | Jest unit tests (`*.test.js`) + Playwright E2E tests (`*.spec.js`) |

## Testing

### Two separate Playwright configs

- `playwright.config.js` (root) — used by CI GitHub Actions workflow
- `tests/playwright.config.js` (tests dir) — used for local/manual runs; includes mobile projects

Both test against the **live production site** (`BASE_URL` defaults to `https://chemie-lernen.org`). There is no local webServer config — E2E tests require the site to be deployed.

### Test file naming

- `*.test.js` → Jest unit tests (jsdom environment, match `**/tests/**/*.test.js`)
- `*.spec.js` → Playwright E2E tests (match `**/*.spec.js`)

### CI (GitHub Actions)

- `jest-tests.yml` — Node 20, `npm ci`, `npx jest --coverage`
- `playwright-tests.yml` — matrix: chromium/firefox/webkit + Mobile Chrome/Mobile Safari; scheduled weekly (Monday 06:00); 2 retries on CI; artifacts retained 30 days

## Conventions

### Formatting (Prettier)

100 char width, 2-space indent, single quotes, semicolons, trailing commas (es5), LF line endings. HTML: 120 char width, `ignore` whitespace sensitivity.

### Linting (ESLint 9 flat config)

`eslint.config.mjs` has extensive per-directory overrides. Key rules for calculator files: `curly`, `eqeqeq`, `no-eval`, `prefer-const`, `prefer-arrow-callback`. Ignored paths: `*.min.js`, `*.optimized.js`, `myhugoapp/themes/**`, `myhugoapp/public/**`, vendor/third-party.

### Pre-commit hook

Husky runs `npx lint-staged` — eslint + prettier on staged JS, JSON, MD, HTML, CSS files.

### Minification gotcha

`npm run minify` (via `scripts/minify-calculators.js`) **overwrites source files in-place** with terser output. Only targets: `stoichiometry.js`, `practice-generators.js`, `lazy-loader.js`. The `LazyLoader` name is preserved during mangling.

## Deployment

- **Production**: `docker-compose.yml` serves `myhugoapp/public/` via nginx behind Traefik (HTTPS via Let's Encrypt)
- **Docker build**: Hugo extended 0.57.0 + minify tool (Alpine-based `Dockerfile`)
- **Alternative CI**: GitLab CI and Bitbucket Pipelines configs in `ci-deploy/` (rsync-based deploy)
- **Dependabot**: Weekly npm + GitHub Actions updates (config in `.github/dependabot.yml`)
