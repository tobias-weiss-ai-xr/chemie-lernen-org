## Why

Hugo build time has degraded with 700+ entity pages (was ~5s, now ~45s). The site has no full-text search for entities — users must scroll the card grid. PWA offline mode is partial (caches pages but no search or calculator support offline). Mobile UX has never been systematically audited. This sprint addresses platform maturity.

## What Changes

- Optimize Hugo build: paginate entity pages, lazy-load D3 assets, parallelize page generation
- Add full-text search on /entity/: Fuse.js client-side or Lunr index built at compile time
- PWA: add offline-search index, cache API responses via service worker, calculator offline fallback page
- Run Lighthouse mobile audit, fix top issues (tap targets, font-size, CLS)
- Add `npm run build:perf` that measures and reports build time

## Capabilities

### New Capabilities

- `entity-fulltext-search`: Client-side full-text search across all 700+ entities
- `pwa/spec.md`: Enhanced offline requirements (search, calculators, API caching)

### Modified Capabilities

- `pwa/spec.md`: Enhanced offline requirements — add offline search and calculator support
- `calculators/spec.md`: Document offline fallback behavior

## Impact

- **Build time**: ~45s → ~15s target (pagination + lazy loading)
- **UX**: Entity search available offline; calculators degrade gracefully without network
- **Mobile**: Lighthouse ≥ 75 on mobile (was unknown)
- **Dependencies**: Fuse.js or Lunr added to package.json (client-side only)
