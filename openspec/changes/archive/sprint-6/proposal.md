# Sprint 6: PWA + Offline

**Goal**: Transform the site into a Progressive Web App with offline access to core content, making chemistry learning available without internet connectivity.

## Scope

### Service Worker

- Create `static/sw.js` — service worker with cache-first strategy for static assets
- Cache Hugo-generated assets (CSS, JS, fonts, images) on install
- Network-first for dynamic content (API calls, calculator results)
- Offline fallback page `/offline/` for navigation requests
- Versioned cache (sw hash in cache name, auto-clean old caches on activate)

### Web App Manifest

- Create `static/site.webmanifest` — name, short_name, icons (192x192, 512x512), theme_color, background_color, display: standalone
- Link manifest in `<head>` via `baseof.html` partial
- Generate proper icon sizes from existing logo

### Offline Content Strategy

- Pre-cache core chemistry reference data (periodic table, constants, formula helpers)
- IndexedDB for storing recent RAG results (read-only offline KI-Assistent)
- Article content cached on read (users get offline access to articles they've visited)
- Cache size limit (50MB with LRU eviction)

### PWA Compliance

- Lighthouse PWA audit: all checkboxes green
- `registerSW()` in baseof.html — register service worker, handle updates
- Update prompt ("Neue Version verfügbar — Aktualisieren?")
- HTTPS requirement (already satisfied)

## Success Criteria

- Lighthouse PWA score ≥ 90
- Full offline access to cached articles
- Calculator pages work offline (if JS cached)
- Service worker caches properly invalidate on new deploy
- Manifest passes Google PWA checklist
