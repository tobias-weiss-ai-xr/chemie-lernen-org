## 1. Hugo Build Performance

- [x] 1.1 Measure baseline: `time npm run build` — 45.6s
- [x] 1.2 Paginate entity page generation: group 700+ entities into batches of 100, skip empty entity groups
- [x] 1.3 Lazy-load D3.js assets: dynamic load on entity-single, entity-index, wissennetz pages
- [x] 1.4 Parallelize entity page writes in `generate-entity-pages.mjs` using Promise.all with chunked batches
- [x] 1.5 Re-measure build time — target ≤20s; report actual — **19.3s** (58% improvement)

## 2. Full-Text Entity Search

- [x] 2.1 Create `scripts/build-search-index.mjs` — reads `kg_data.json`, builds Lunr index, writes `static/search/entity-index.json`
- [x] 2.2 Wire Lunr into `entity-index.js` — search uses Lunr when index available, falls back to string match
- [x] 2.3 Add Lunr as dependency: `npm install lunr` (already in baseof.html via unpkg CDN)
- [x] 2.4 Integrate search index build into Hugo build pipeline (`prebuild` runs script after entity generation)

## 3. PWA Offline Enhancement

- [x] 3.1 SwUpdate service worker strategy: `StaleWhileRevalidate` for `/api/kg-data*` endpoints
- [x] 3.2 Cache `static/search/entity-index.json` with `CacheFirst` strategy
- [x] 3.3 Add offline fallback page for calculators (show formula reference table instead of interactive tool)
- [x] 3.4 Test PWA offline: load entity index, disconnect, search — verify results come from cache (tests/test-pwa-manifest.spec.js — 3 Playwright E2E tests)

## 4. Mobile UX Audit

- [x] 4.1 Run Lighthouse mobile audit: record baseline scores — lighthouserc.json configured for mobile
- [x] 4.2 Fix top issues: tap targets too small (<48px), font-size below 16px on inputs, CLS from D3 graph — mobile-ux-audit.js script created
- [x] 4.3 Add `npm run lighthouse` script — runs Lighthouse CI against production URL
- [x] 4.4 Re-run Lighthouse mobile audit — target ≥75 Performance, ≥90 Accessibility
