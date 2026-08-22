# Lighthouse PWA Audit — chemie-lernen.org

> **Date:** 2026-07-09
> **Scope:** PWA readiness audit for chemie-lernen.org

## Current Status

The site has a mature PWA implementation with service worker, manifest, and offline support. The following summarizes the current state against Lighthouse PWA checks.

## ✅ Already Implemented

| Category               | Item                                                               | Status     |
| ---------------------- | ------------------------------------------------------------------ | ---------- |
| **HTTPS**              | Site served over HTTPS (Traefik + Let's Encrypt)                   | ✅ Pass    |
| **Service Worker**     | Custom SW (`sw.js` v6-2026-07) with full lifecycle                 | ✅ Pass    |
| **Offline Fallback**   | Offline page served for navigation requests when offline           | ✅ Pass    |
| **Cache Strategies**   | Cache-first (assets), network-first (content), network-only (auth) | ✅ Pass    |
| **LRU Eviction**       | Per-cache size limits (10/25/15 MB) + 50 MB global limit           | ✅ Pass    |
| **Web App Manifest**   | `manifest.json` and `site.webmanifest` with icons                  | ✅ Pass    |
| **Icons**              | Multiple sizes (16, 32, 192, 512 px) + SVG + apple-touch-icon      | ✅ Pass    |
| **Theme Color**        | `theme-color` meta tag (`#2d6a4f`)                                 | ✅ Pass    |
| **Background Sync**    | Placeholder handlers for sync events                               | ✅ Partial |
| **Push Notifications** | Notification handler + click handler                               | ✅ Pass    |
| **SW Versioning**      | Versioned caches, auto-cleanup on activate                         | ✅ Pass    |
| **IndexedDB Cache**    | `pwa-article-cache.js` — visited article store (50 article limit)  | ✅ New     |
| **Viewport**           | `<meta name="viewport">` present                                   | ✅ Pass    |

## ⚠️ Improvement Areas

### 1. Screenshot for PWA Install Prompt

- **Issue:** No screenshots defined in `manifest.json` for the "Install" prompt on supported browsers
- **Fix:** Add `screenshots` array to `manifest.json` with at least one 1280x720 or 1080x1920 image
- **Priority:** Low

### 2. Background Sync Implementation

- **Issue:** `syncQuizProgress()` and `syncUserData()` are placeholders
- **Fix:** Implement actual IndexedDB-backed queue for quiz result uploads when reconnecting
- **Priority:** Medium

### 3. Offline Article Access (User-Facing)

- **Issue:** SW caches visited pages automatically (network-first), but there's no user-facing "Saved articles" UI
- **Fix:** The new `pwa-article-cache.js` stores articles; build a UI to list saved articles (e.g., `/offline/` page or a panel)
- **Priority:** Low

### 4. Service Worker Registration in Head

- **Issue:** Verify SW registration happens in `<head>` or early `<body>` for optimal install timing
- **Check:** `baseof.html` or `head.html` partial
- **Priority:** Low

### 5. `apple-mobile-web-app-capable` Meta Tag

- **Issue:** iOS-specific standalone mode meta tag may be missing
- **Check:** Add `<meta name="apple-mobile-web-app-capable" content="yes">` if absent
- **Priority:** Low

### 6. Preload Key Requests

- **Issue:** No `<link rel="preload">` for critical CSS/JS used by the app shell
- **Benefit:** Improves LCP and perceived load time on cold cache
- **Priority:** Medium

## Performance Notes

- Pre-cached files include core CSS, JS utilities, and icons (~20 files)
- JS files use network-first strategy (fresh code preferred over cached)
- Static assets use cache-first with LRU eviction
- Content pages use network-first with offline fallback
- Cache limits prevent unbounded storage growth

## Recommendations

1. **Implement background sync** — Replace placeholder sync handlers with actual IndexedDB-backed upload queue for quiz results
2. **Add install screenshots** — Add 1280x720 and 1080x1920 screenshots to manifest.json for richer install prompt
3. **Build saved-articles UI** — Expose the new IndexedDB article cache through a user-visible page (e.g., enhanced `/offline/` page)
4. **Run Lighthouse CI** — Add Lighthouse CI to the deployment pipeline to track PWA score over time
