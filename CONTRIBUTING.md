# Contributing — chemie-lernen.org

## Setup

```bash
git clone <repo-url>
cd hugo-chemie-lernen-org
npm install
```

## Development Server

```bash
hugo server -D
# Or via Docker:
npm run hugo:build   # production build
```

## Project Structure

```
myhugoapp/
├── content/           # Hugo markdown pages
│   ├── themenbereiche/   # Subject areas (topic pages)
│   ├── klassenstufen/    # Grade-level organization
│   ├── pages/            # General pages (about, roadmap)
│   └── *.md              # Calculator/interactive tool landing pages
├── static/js/         # JavaScript
│   ├── calculators/      # Calculator logic
│   ├── utils/            # Shared utilities (chemistry-utils.js)
│   ├── i18n/             # i18n manager + locale files
│   └── visualization/    # 3D / periodic table
├── layouts/           # Hugo templates
│   ├── _default/         # One .html per calculator/page
│   └── partials/         # Shared partials (head, header, footer, quiz)
└── data/              # Curricula JSON per state
api/                   # Express API server (server.js, auth.js, auth-db.js)
tests/                 # Jest + Playwright tests
openspec/              # OpenSpec change tracking
scripts/               # Build, export, utility scripts
docs/                  # Documentation
```

## Content Workflow

1. Create content in `myhugoapp/content/` as Markdown with Hugo frontmatter
2. Add `last_reviewed: YYYY-MM-DD` to frontmatter for freshness tracking
3. Add cross-links to related topics using the `[related-topics]` badge partial
4. Link relevant calculators via the corresponding layout template
5. Run `npm test` before opening a PR

## Code Standards

- **JS**: Prefer browser globals pattern (not ESM except Three.js files)
- **Calculators**: Extend `ChemistryCalculator` class from `chemistry-calculator-framework.js`
- **API**: Express routes with auth middleware; use `requireAuth` / `requirePremium` for gated endpoints
- **Tests**: Jest for unit, Playwright for E2E; minimum 70% coverage
- **Formatting**: Prettier (100 char width, 2-space indent, single quotes)
- **Linting**: ESLint 9 flat config (`eslint.config.mjs`)

## Freshness Check

```bash
node scripts/audit-content-freshness.mjs
```

This identifies content with `last_reviewed` older than 180 days.

## Making Changes

1. Check `openspec/SPECS_INDEX.md` for active specs
2. Create an OpenSpec change: `openspec change new <name>`
3. Implement and test
4. Run `npm run validate` before committing
5. Commit with descriptive messages matching the change scope

## Questions?

Open an issue or check the docs/ directory.
