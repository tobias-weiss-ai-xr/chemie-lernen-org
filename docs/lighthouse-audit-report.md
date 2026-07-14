# Lighthouse Audit Report

**Date:** 2026-07-14  
**Auditor:** Sisyphus  
**Scope:** 5 key pages, PWA readiness, accessibility, performance

## PWA Score Estimate: ~85/100

| Criteria                  | Status  | Notes                                                      |
| ------------------------- | ------- | ---------------------------------------------------------- |
| Service Worker registered | Yes     | `sw.js` with cache-first for static, network-first for API |
| Web App Manifest          | Yes     | `manifest.json` + `site.webmanifest`                       |
| HTTPS                     | Yes     | Traefik + Let's Encrypt                                    |
| Offline fallback          | Partial | Static pages cached; quiz API caching added in Sprint 25   |
| Installable               | Yes     | Manifest + SW + HTTPS; install banner added Sprint 25      |
| Redirects HTTP to HTTPS   | Yes     | Traefik handles this                                       |
| Page load while offline   | Partial | Cached pages load; uncached show offline page              |

**Gap:** No dedicated offline fallback page for uncached routes. SW should serve a generic offline.html when both cache and network fail.

## Performance Analysis

### Estimated Scores by Page

| Page                    | Est. Score | Key Issue                                                                  |
| ----------------------- | ---------- | -------------------------------------------------------------------------- |
| `/` (home)              | 90-95      | Lightweight static Hugo page, minimal JS                                   |
| `/ki-assistent/` (chat) | 70-80      | Heavy JS (chat logic), LiteLLM streaming WebSocket                         |
| `/periodensystem/` (PT) | 55-70      | Three.js (37KB unminified), 4 orbital-viewer files (16KB) loaded on demand |
| `/quiz/`                | 80-90      | Moderate JS, lazy-loaded                                                   |
| `/lernkarten-review/`   | 85-90      | Lightweight card flip UI                                                   |
| `/uebungsverlauf/`      | 85-90      | Simple CSS charts, no heavy libs                                           |
| `/vergleich/`           | 75-85      | Element comparison with property bars                                      |

### Critical Performance Issues

1. **Three.js bundle size** (periodensystem page)
   - `three.module.js` not present as separate entry but `perioden-system-der-elemente.js` is 37KB unminified
   - `orbital-viewer.js` is 16KB
   - `molekuel-studio.js` is 57KB — largest single JS file
   - **Fix:** Code-split Three.js visualizations into dynamic imports or separate chunks. Use `type="module"` with async loading. Run `npm run minify` on these files.

2. **Unminified calculator JS**
   - 22+ calculator JS files not minified
   - `npm run minify` only targets 3 files (stoichiometry, practice-generators, lazy-loader)
   - **Fix:** Extend minify script to cover all calculator files or use build-time minification

3. **Render-blocking resources in head.html**
   - 3 preload/prefetch hints exist but more could help
   - CSS loaded synchronously
   - **Fix:** Add `rel="preload"` for critical JS (lazy-loader.js), defer non-critical scripts

4. **CLS potential**
   - Lazy-loaded images in content pages
   - Ad slots or dynamic content without reserved space
   - **Fix:** Add `width`/`height` or `aspect-ratio` to all images, use `loading="lazy"`

## Accessibility Estimate: ~75/100

| Issue                               | Severity | Location                                                                           |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| Color contrast on periodic table    | Medium   | `perioden-system-der-elemente.js` — many block colors may not meet WCAG AA (4.5:1) |
| ARIA labels on interactive elements | Medium   | Quiz radio buttons, FSRS score buttons, comparison tool                            |
| Focus management in quiz            | Medium   | After submitting quiz, focus should move to results                                |
| Keyboard navigation for card flip   | Low      | FSRS review — Space key handler exists but may conflict with page scroll           |
| Skip navigation link                | Low      | Missing from header.html                                                           |

**Fixes:**

- Audit periodic table colors for contrast (s/p/d/f blocks, category colors)
- Add `aria-label` to all interactive elements in quiz, FSRS, comparison tools
- Add `role="alert"` to dynamic result announcements
- Add skip-to-content link in header.html

## Best Practices Estimate: ~90/100

| Check                                | Status                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| HTTPS                                | Yes                                                                                              |
| No mixed content                     | Yes (all assets relative or HTTPS)                                                               |
| CSP headers                          | Yes (hardened Sprint 20, zero unsafe-inline)                                                     |
| CORS restricted                      | Yes (chemie-lernen.org + localhost)                                                              |
| No console errors in production      | Likely some — 77 console.\* converted to pino in server.js, but client-side JS may have leftover |
| Uses HTTPS for all external requests | Yes                                                                                              |
| No deprecated APIs                   | Unknown — would need runtime audit                                                               |

## SEO Estimate: ~85/100

| Check             | Status                                                    |
| ----------------- | --------------------------------------------------------- |
| Meta descriptions | Partial — some pages have Hugo `.Description` frontmatter |
| Open Graph tags   | Yes — Hugo theme provides `{{ .Summary }}` OG             |
| Twitter cards     | Unknown — check Hugo theme config                         |
| Canonical URLs    | Yes — Hugo generates `<link rel="canonical">`             |
| Structured data   | No — no JSON-LD markup found                              |
| Sitemap           | Yes — Hugo generates `sitemap.xml`                        |
| robots.txt        | Yes — Hugo generates `robots.txt`                         |
| Hreflang          | No — site is German-only, not needed                      |

**Gap:** No structured data (JSON-LD) for educational content, quiz pages, or calculator tools.

## Recommendations (Prioritized)

### P0 — High Impact

1. **Code-split Three.js periodic table** — largest performance win
   - Dynamic import Three.js only on `/periodensystem/` route
   - Use `type="module"` with top-level await
   - Target: reduce initial JS from ~100KB to <20KB for non-visualization pages

2. **Minify all calculator JS files**
   - Extend `scripts/minify-calculators.js` to cover all files in `static/js/calculators/`
   - Or integrate into Hugo build pipeline

3. **Add offline fallback page**
   - Create `offline.html` in static/
   - Serve it from SW when both cache and network fail

### P1 — Medium Impact

4. **Audit periodic table colors for WCAG AA contrast**
5. **Add JSON-LD structured data** for educational content
6. **Add preload hints** for critical JS (lazy-loader.js, chemistry-utils.js)
7. **Add ARIA labels** to all interactive quiz/FSRS elements

### P2 — Nice to Have

8. **WebP images** for all content images
9. **Skip-to-content link** in header
10. **Service Worker update notification** (toast when new SW available)

## Target: All pages above 95

Current estimated range: 55-95 across 7 pages.  
With P0 fixes alone: estimated 75-98.  
Full P0+P1: estimated 90-98 on all pages.
