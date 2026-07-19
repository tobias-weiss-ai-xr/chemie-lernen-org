## Context

Hugo build for ~700 entity pages takes ~45s (was ~5s with 54 pages). The entity index page loads all 700+ cards at once — no pagination. No search exists for entities. PWA service worker caches pages but not API responses or search index. Mobile Lighthouse scores have never been measured.

## Goals / Non-Goals

**Goals:**

- Hugo build time: ~45s → ≤15s
- Entity pagination: 50 per page with client-side "load more"
- Full-text search: client-side via Lunr index (built at compile time, ~100KB gzipped)
- PWA: cache API responses, Lunr search index, calculator offline page
- Lighthouse mobile score ≥ 75 for Performance, ≥ 90 for Accessibility

**Non-Goals:**

- SSR search (Hugo pre-renders pages; search is client-side)
- Image optimization pipeline (already handled by Hugo)
- Bundle splitting (JS size is already <200KB total)

## Decisions

| Decision                                   | Rationale                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Lunr over Fuse.js**                      | Smaller bundle (12KB vs 35KB), pre-built index is faster at query time                         |
| **Index built at compile time**            | `scripts/build-search-index.mjs` generates `static/search/entity-index.json` during Hugo build |
| **Pagination via JS (not Hugo paginator)** | Hugo paginator generates separate pages (bad for UX); JS "load 50 more" keeps single URL       |
| **PWA: Workbox strategy**                  | Use `StaleWhileRevalidate` for API, `CacheFirst` for search index, `NetworkFirst` for pages    |
| **Lighthouse CI via `npm run lighthouse`** | Runs against deployed site; not part of build pipeline (no headless Chrome in Docker)          |

## Risks / Trade-offs

- [Lunr index size] → 700 entities × ~200 chars = ~140KB raw, ~40KB gzipped; acceptable
- [Pagination JS doubles entity rendering] → Load 50 initially, fetch 50 more; API already supports limit/offset
- [PWA offline calculator] → Only works if calculator was visited while online; acceptable trade-off
- [Build perf may not hit 15s] → Entity generation is I/O-bound (writing 700 files); 20-25s may be realistic
