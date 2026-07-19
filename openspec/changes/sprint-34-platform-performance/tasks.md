## 1. Hugo Build Performance

- [ ] 1.1 Measure baseline: `time npm run build` — record output
- [ ] 1.2 Paginate entity page generation: group 700+ entities into batches of 100, skip empty entity groups
- [ ] 1.3 Lazy-load D3.js assets: move `d3-ego-graph.js` to load only on entity detail page (not globally)
- [ ] 1.4 Parallelize entity page writes in `generate-entity-pages.mjs` using Promise.all with chunked batches
- [ ] 1.5 Re-measure build time — target ≤20s; report actual

## 2. Full-Text Entity Search

- [ ] 2.1 Create `scripts/build-search-index.mjs` — reads `kg_data.json`, builds Lunr index, writes `static/search/entity-index.json`
- [ ] 2.2 Wire Lunr into `entity-index.js` — search input shows results as user types, highlights matches
- [ ] 2.3 Add Lunr as dependency: `npm install lunr` (or use CDN)
- [ ] 2.4 Integrate search index build into Hugo build pipeline (`npm run build` runs script before Hugo)

## 3. PWA Offline Enhancement

- [ ] 3.1 SwUpdate service worker strategy: `StaleWhileRevalidate` for `/api/kg-data*` endpoints
- [ ] 3.2 Cache `static/search/entity-index.json` with `CacheFirst` strategy
- [ ] 3.3 Add offline fallback page for calculators (show formula reference table instead of interactive tool)
- [ ] 3.4 Test PWA offline: load entity index, disconnect, search — verify results come from cache

## 4. Mobile UX Audit

- [ ] 4.1 Run Lighthouse mobile audit: record baseline scores
- [ ] 4.2 Fix top issues: tap targets too small (<48px), font-size below 16px on inputs, CLS from D3 graph
- [ ] 4.3 Add `npm run lighthouse` script — runs Lighthouse CI against production URL
- [ ] 4.4 Re-run Lighthouse mobile audit — target ≥75 Performance, ≥90 Accessibility
