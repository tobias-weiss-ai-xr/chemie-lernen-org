# AGENTS.md — chemie-lernen.org

Hugo-based static site for interactive chemistry education (German, `de-de`). Theme: `hugo-cards`.

## 🧠 Central Knowledge Graph architecture (CRITICAL — memorize)

The Neo4j `chemie` database (`bolt://chemie-neo4j:7687`, database name
`chemie`) is **the user's central knowledge graph for everything** —
NOT a chemie-specific database. The chemie data is one of many
subsets living in the same DB. The ~683k code-analysis nodes
(Variables, Parameters, Functions, Classes, etc.) are not pollution;
they are another legitimate subset of the central KG.

**All queries MUST scope to a subset via labels or properties.**
Never assume "this database is for X". Never propose to delete nodes
from the central KG without explicit user consent AND a backup plan.

Current subsets (by label):

- **Chemie subset**: `Entity`, `Document`, `Tag`, `Content` (existing)
  - `Curriculum`, `Topic`, `SubTopic`, `LearningObjective` (planned)
  - `DidacticGuideline`, `GuidelineSection` (planned)
- **Code-analysis subset**: `Variable`, `Parameter`, `Function`,
  `Class`, `File`, `Module`, `Interface`, `Directory`, `Repository`,
  `Macro`, `Struct`, `Enum`, `Episodic` (~683k nodes)
- **Modulhandbuch subset (planned)**: `University`, `Module`,
  `ModuleOffering`, `ECTS`, etc.

Subset selectors are centralized in
`scripts/_neo4j-subset-filter.mjs` (formerly `_neo4j-chemie-filter.mjs`)
and used by all consumers (api/server.js, scripts/, tests/).

## 🔒 Proprietary core (private `chemie-core` repo) — CRITICAL

The **API crown jewels are NOT in this public repo**. They live in the
private GitHub repo `tobias-weiss-ai-xr/chemie-core` (read-only deploy
key: `~/.ssh/chemie_core_deploy`, CI secret `CORE_DEPLOY_KEY`):

- `api/prompts/` — LLM prompts (exercise generation/grading)
- `api/services/{auto-grader,exercise-generator,feedback-engine,rag,badges}.js`
- `api/{learning-engine,collab-engine,assessment-store,auth,auth-db,session-store,embeddings}.js`
- `api/_rag-helpers.cjs`, `api/calc-rag-index.json`

`scripts/vendor-core.sh` clones the private repo into `.core/`
(gitignored) and copies those files into place. **Run it before any
test/build** — `npm run pretest` does this automatically. CI does the
same in both deploy jobs. The private repo mirrors relative paths under
`api/`; top-level files (README.md etc.) are never overwritten.

Pipeline scripts (`scripts/import-*.mjs`, `link-*.mjs`, `enrich-*.mjs`,
`generate-*.mjs`, `backfill-*.mjs`, `scripts/curricula*`) stay public —
the CI scrape workflows depend on them. Only the API AI/engine/auth
files are private.

If `.core/` is missing (fresh clone without network), the API will fail
imports — always run `scripts/vendor-core.sh` first.

## OpenSpec workflow (canonical for planning)

This repo uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for
specifications and change tracking. The canonical workflow is:

- **Main specs** live in `openspec/specs/<capability>/spec.md`
- **Active changes** live in `openspec/changes/<change-name>/`
- **Archived changes** live in `openspec/changes/archive/<change-name>/`
- **Index** in `openspec/SPECS_INDEX.md`

Before starting any non-trivial work, check the index and either:

- Create a new change: `openspec change new <name>`
- Or update the relevant spec directly (then make a change to document it)

The legacy `.omo/`, `.opencode/`, `.hermes/`, `.sisyphus/` planning
directories are **archived** under `openspec/archive/` and should not
be used for new planning.

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

# Build (Docker-based)
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

| Directory                            | Purpose                                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| `myhugoapp/static/js/`               | All JavaScript (calculators, utils, visualizations, i18n, analytics) |
| `myhugoapp/static/js/calculators/`   | Core calculator logic (stoichiometry, practice generators)           |
| `myhugoapp/static/js/utils/`         | Shared chemistry utilities                                           |
| `myhugoapp/static/js/i18n/`          | Internationalization                                                 |
| `myhugoapp/static/js/visualization/` | 3D/periodic table visualizations                                     |
| `myhugoapp/layouts/_default/`        | Hugo templates — one `.html` per calculator/page                     |
| `myhugoapp/layouts/partials/`        | Shared template partials (head, header, footer, quiz)                |
| `tests/`                             | Jest unit tests (`*.test.js`) + Playwright E2E tests (`*.spec.js`)   |

## Testing

### Playwright config

`tests/playwright.config.js` — the canonical config. Tests against the **live production site** (`BASE_URL` defaults to `https://chemie-lernen.org`). There is no local webServer config — E2E tests require the site to be deployed.

### Test file naming

- `*.test.js` → Jest unit tests (jsdom environment, match `**/tests/**/*.test.js`)
- `*.spec.js` → Playwright E2E tests (match `**/*.spec.js`)

### CI

Self-hosted systemd timer triggers pull, build, and deploy on push to master.

## Conventions

### Formatting (Prettier)

100 char width, 2-space indent, single quotes, semicolons, trailing commas (es5), LF line endings. HTML: 120 char width, `ignore` whitespace sensitivity.

### Linting (ESLint 9 flat config)

`eslint.config.mjs` has extensive per-directory overrides. Key rules for calculator files: `curly`, `eqeqeq`, `no-eval`, `prefer-const`, `prefer-arrow-callback`. Ignored paths: `*.min.js`, `*.optimized.js`, `myhugoapp/themes/**`, `myhugoapp/public/**`, vendor/third-party.

### Pre-commit hook

Husky runs `npx lint-staged` — eslint + prettier on staged JS, JSON, MD, HTML, CSS files.

### Minification gotcha

`npm run minify` (via `scripts/minify-calculators.js`) runs terser on the scripts listed in that file and writes an `X.optimized.js` **sidecar next to each source** (sources stay untouched; templates/loaders reference the `.optimized.js` copies — see `enhanced-bundle-loader.js`). The `LazyLoader` name is preserved during mangling. Not every sidecar is loaded: `ki-assistent.js`, `dark-mode.js` and `lazy-loader.js` are served from source by templates, and their `.optimized.js` twins were deleted as unreferenced (the minify script recreates them on demand — delete again if a future sweep finds them unused). (Removed dead-code targets: `practice-generators.js` was deleted because nothing loads it — the live practice generator is `practice-generator.js`, singular.)

## Safety Rules

### Neo4j — NEVER mass-delete

The Neo4j knowledge graph at `knowledge-neo4j:7687` stores a **general knowledge base** — not only chemistry content. The following Cypher patterns are **blacklisted** and must NEVER be executed:

```
DETACH DELETE         — mass-deletes nodes and all their relationships
MATCH (d:Document) DELETE d — deletes documents
MATCH (d:Document) DETACH DELETE d — deletes documents with relationships
```

These commands caused irreversible data loss (~22,979 documents deleted). If cleanup is needed, always ask the user first and use targeted, scoped queries (e.g., with `WHERE d.url CONTAINS "specific-domain"`).

## Deployment

- **Production**: `docker-compose.yml` serves `myhugoapp/public/` via nginx behind Traefik (HTTPS via Let's Encrypt)
