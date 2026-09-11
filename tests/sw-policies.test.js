/**
 * Service-Worker-Cache-Policies (Quell-Kontrakte).
 *
 * Anlass 2026-09-11: CI war grün, aber Nutzer sahen wochenlang den alten
 * Quiz-Stand — /css/ lief cache-first und die Quiz-HTML-Seite
 * quizPageCacheFirst ohne Revalidate. Diese Tests frieren die korrigierten
 * Policies ein:
 *
 *   1. SW_VERSION wird bei Code-Änderungen gebumpt (vX-YYYY-MM, aktiviert
 *      den Cache-Purge in `activate`)
 *   2. JS **und** CSS laufen network-first (frischer Code/Styles statt
 *      eingefrorener)
 *   3. Quiz-Seite: Stale-While-Revalidate (offline-Fähig, online frisch)
 *
 * Live-Ende-zu-Ende: tests/e2e/sw-freshness.spec.js (verlangt, dass die
 * Live-Site exakt die Repo-Version serviert).
 */

const fs = require('fs');
const path = require('path');

const SW = fs.readFileSync(path.join(__dirname, '..', 'myhugoapp', 'static', 'sw.js'), 'utf8');

describe('SW-Policies nach dem 2026-09-11-Staleness-Vorfall', () => {
  test('SW_VERSION folgt vX-YYYY-MM und ist gebumpt (nicht mehr v9-2026-08)', () => {
    const m = SW.match(/const SW_VERSION = '([^']+)'/);
    expect(m).toBeTruthy();
    expect(m[1]).toMatch(/^v\d+-\d{4}-\d{2}$/);
    expect(m[1]).not.toBe('v9-2026-08');
  });

  test('CSS läuft wie JS network-first (kein cacheFirst mehr für /css/)', () => {
    expect(SW).toMatch(/\/\/ ── JS & CSS files: network-first/);
    expect(SW).toContain('if (isJavaScript(url) || isCss(url))');
    // isCss-Helfer existiert und matcht /css/*.css
    expect(SW).toMatch(
      /function isCss\(url\) \{[\s\S]*?startsWith\('\/css\/'\)[\s\S]*?endsWith\('\.css'\)/
    );
  });

  test('Quiz-Seite nutzt Stale-While-Revalidate (offline-Fallback + Refresh)', () => {
    expect(SW).toMatch(
      /function quizPageCacheFirst\(request\) \{[\s\S]*?staleWhileRevalidate\(request, STATIC_CACHE\)/
    );
  });

  test('activate-Purge ist versioniert (neue SW_VERSION räumt alte Caches weg)', () => {
    // Caches werden aus SW_VERSION abgeleitet → Bump genügt für Purge
    expect(SW).toMatch(/STATIC_CACHE = 'static-' \+ SW_VERSION/);
    expect(SW).toMatch(/ASSETS_CACHE = 'assets-' \+ SW_VERSION/);
    // Activate löscht fremde/veraltete Caches
    expect(SW).toContain("addEventListener('activate'");
    expect(SW).toContain('expectedCaches.indexOf(n) === -1');
    expect(SW).toContain('caches.delete(n)');
  });
});
