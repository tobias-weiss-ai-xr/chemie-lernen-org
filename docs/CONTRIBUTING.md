# Contributing

## Setup

```bash
git clone https://github.com/your-org/hugo-chemie-lernen-org.git
cd hugo-chemie-lernen-org

# Install JS dependencies (for tests, linting)
cd api && npm install && cd ..
npm install
```

## Development Workflow

### Static Site

```bash
# Start Hugo dev server (requires Hugo extended)
cd myhugoapp && hugo server -D
# → http://localhost:1313
```

### API Server

```bash
cd api
# Ensure Neo4j and LiteLLM are running (or use Docker)
node server.js
# → http://localhost:3001
```

## Adding Content

### New Article

Create a Markdown file in the appropriate directory:

```bash
hugo new content themenbereiche/mein-thema/mein-artikel.md
```

Frontmatter structure:

```yaml
---
title: 'Mein Artikel'
date: 2026-07-06
description: 'Kurze Beschreibung'
tags: ['Chemie', 'Thema']
themenbereiche: ['mein-thema']
klassenstufen: ['10']
---
```

Images go in `static/images/` and are referenced as `/images/filename.png`.

### New Calculator

1. Create the calculator JS file in `myhugoapp/static/js/calculators/`
2. Use the `ChemistryCalculator` framework pattern (see existing calculators for reference)
3. Create a Hugo layout in `myhugoapp/layouts/_default/<name>.html`
4. Create content in `myhugoapp/content/<name>.md`
5. Add to `lazy-loader.js` if the calculator should load on-demand

Calculator JS pattern:

```javascript
class MyCalculator extends ChemistryCalculator {
  constructor() {
    super('my-calculator', {
      description: 'My calculator description',
      type: 'generic',
    });
  }

  calculate(values) {
    // Your calculation logic
    return { result: 42, unit: 'mol' };
  }
}

// Register for lazy loading
ChemistryCalculator.register('my-calculator', MyCalculator);
```

### New Quiz Questions

Quiz questions live in two places:

- **Browser**: `myhugoapp/static/js/quiz-questions.js` (IIFE, loaded via `<script>`)
- **API**: `api/data/quiz-questions.json` (JSON, loaded by the API server)

Both must be kept in sync. The format:

```json
{
  "id": 31,
  "topic": "Allgemeine Chemie",
  "question": "Was ist ein Mol?",
  "options": ["6,022·10²³ Teilchen", "1 g Stoff", "1 L Gas", "1 molare Masse"],
  "correct": 0,
  "explanation": "Ein Mol entspricht 6,022·10²³ Teilchen (Avogadro-Konstante)."
}
```

## Adding API Routes

Edit `api/server.js` or `api/auth.js`.

- All routes are mounted under `/api/`
- Auth middleware (`authMiddleware`) runs on all `/api/*` routes automatically
- Use `requireAuth` for routes that need a logged-in user
- Add the new path prefix to the Traefik router rule in `docker-compose.yml`

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Single file
npx jest tests/chemistry-utils.test.js

# Coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
npx playwright test
npx playwright test --project=chromium
```

E2E tests run against the **live production site** (`BASE_URL` defaults to `https://chemie-lernen.org`). No local web server.

## Code Quality

```bash
# Lint
npm run lint
npm run lint:fix  # Auto-fix

# Format
npm run format

# Full validation (lint + format:check + test)
npm run validate
```

### Linting Rules

- ESLint 9 flat config (`eslint.config.mjs`)
- Prettier 100 char width, 2-space indent, single quotes
- Calculator files: `curly`, `eqeqeq`, `no-eval`, `prefer-const`
- Pre-commit: husky runs `lint-staged` on staged files

## Minification

⚠️ **Overwrites source files in-place!**

```bash
# Minify calculator files (terser)
npm run minify

# Full optimization
npm run optimize
```

Target files: `stoichiometry.js`, `practice-generators.js`, `lazy-loader.js`.

## Committing

- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Pre-commit hooks run lint-staged automatically
- Never force-push to master
- Keep commits atomic (one logical change per commit)

## OpenSpec Workflow

This repo uses OpenSpec for planning and change tracking.

```bash
# List active changes
openspec list

# Create a new change
openspec new change "<kebab-case-name>"

# Mark tasks during implementation
# Edit openspec/changes/<name>/tasks.md and change `- [ ]` to `- [x]`

# Archive a completed change
# Run /opsx-archive
```

See `openspec/SPECS_INDEX.md` for the full spec index.

## Architecture Overview

```
myhugoapp/              → Hugo static site (Go templates, Markdown)
├── content/            → 1,200+ articles
├── layouts/            → HTML templates
├── static/js/          → All JavaScript
│   ├── calculators/    → 20+ calculator modules
│   ├── visualization/  → Three.js, 3D, periodic table
│   └── utils/          → Shared utilities
api/                    → Express.js API server
├── server.js           → Main server (~4100 lines)
├── auth-db.js          → File-based user store
└── data/               → Runtime data files
tests/                  → Jest + Playwright tests
docs/                   → Documentation
openspec/               → Specifications & changes
```
