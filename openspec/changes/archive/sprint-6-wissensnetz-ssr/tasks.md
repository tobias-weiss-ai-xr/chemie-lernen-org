# Tasks: sprint-6-wissensnetz-ssr (ARCHIVED)

- [x] **6.1** Add `data-kg_data.json` export step in deploy workflow
      — `.github/workflows/deploy.yml` — `dea14d91`
- [x] **6.2** `scripts/generate-entity-pages.mjs` — emit richer
      frontmatter (kategorie, articleCount, relatedCount) — `dea14d91`
- [x] **6.3** `myhugoapp/layouts/entity/single.html` — SSR entity
      content from `.Site.Data.kg_data` — `dea14d91`
- [x] **6.4** JSON-LD `DefinedTerm` structured data on entity pages —
      `dea14d91`
- [x] **6.5** Entity-specific OG/Twitter meta tags in
      `partials/head.html` — `dea14d91`
- [x] **6.6** Sitemap config: ensure entity pages appear in
      `public/sitemap.xml` — `dea14d91`
- [x] **6.7** E2E tests in
      `tests/test-entity-knowledge-graph.spec.js` — `dea14d91`
- [x] **6.8** Move ego-graph into shared module
      `static/js/visualization/d3-ego-graph.js` with a11y + responsive +
      click-to-navigate (later done in 8a, here only inline skeleton) —
      `e9ad62be` (8a)
