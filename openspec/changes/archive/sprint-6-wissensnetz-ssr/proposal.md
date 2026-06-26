# Change: sprint-6-wissensnetz-ssr (ARCHIVED)

**Status:** Archived (shipped 2026-06-26)
**Commits:** `dea14d91`, `e9ad62be`
**Implemented by:** Sisyphus
**Spec impact:** `specs/entity-knowledge-graph/spec.md` REQ-EKG-4 (SSR)

## Why

The entity pages (`/entity/{slug}/`) were entirely client-side rendered.
Google indexed zero entity content (no title, no description, no
structured data), social previews were generic, and users saw a loading
skeleton before content.

## What changed

- `myhugoapp/layouts/entity/single.html` — added SSR from
  `.Site.Data.kg_data`
- `myhugoapp/layouts/partials/head.html` — entity-specific meta tags
- `scripts/generate-entity-pages.mjs` — emits richer frontmatter
- `.github/workflows/deploy.yml` — wires `export-kg-data` and
  `generate-entity-pages` into the pre-build phase
- `tests/test-entity-knowledge-graph.spec.js` — E2E tests for SSR
  content, JSON-LD, sitemap, ego-graph

## Capabilities added

- Entity pages are now indexed by Google (title, description, JSON-LD
  visible in the HTML source)
- Social media previews (OG, Twitter) are entity-specific
- No loading skeleton needed — content is in the initial HTML
- 55+ entity URLs in `public/sitemap.xml`

## Deferred to later sprints

- Better ego-graph (8a)
- More entities + better data quality (8b)
- AI assistant uses the SSR data (8c)
