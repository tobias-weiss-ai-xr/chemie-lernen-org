/**
 * entity-links.js — UXF-011: Smart Entity-URL-Auflösung (404-Falle schließen)
 *
 * Problem: Topic-/Vergleichs-Links zeigen auf /entity/{slug}/, aber nur 644
 * Entitäten existieren als Seiten — Curriculum-Themen fast nie → 404.
 *
 * Lösung: Beim Hugo-Build generiert scripts/generate-entity-slug-manifest.mjs
 * die Datei /js/entity-slugs.json (Liste aller existierenden Entity-Slugs).
 * Diese Utility lädt das Manifest einmalig, prüft Links gegen es und
 * schreibt href um: existiert → /entity/{slug}/, sonst → Pagefind-Suche
 * (/pages/suche/?q={name} — findet Artikel statt 404).
 *
 * Integration: Links bekommen data-entity-name="…"; nach dem Rendern ruft
 * der Seiten-Code window.CurriculaEntityLinks.rewriteWhenReady(container).
 * Fehlt das Manifest (offline/Fehler), bleiben die Fallback-hrefs stehen.
 */
(function () {
  'use strict';

  var manifestPromise = null;

  /**
   * Slugify mit Fallback (nutzt globalThis.Slugs wenn geladen).
   * @param {string} name
   * @returns {string}
   */
  function slugify(name) {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.Slugs &&
      typeof globalThis.Slugs.slugify === 'function'
    ) {
      return globalThis.Slugs.slugify(name);
    }
    return String(name == null ? '' : name)
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Lädt das Slug-Manifest genau einmal (Promise gecacht).
   * @param {string} [url]
   * @returns {Promise<string[]>}
   */
  function loadManifest(url) {
    if (manifestPromise) return manifestPromise;
    manifestPromise = fetch(url || '/js/entity-slugs.json', {
      signal: AbortSignal.timeout(5000),
    })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .catch(function () {
        return []; // offline/Fehler → Links bleiben beim Fallback
      });
    return manifestPromise;
  }

  /**
   * Rein: Name + Slug-Set → URL. Entity existiert → /entity/, sonst Suche.
   * @param {string} name
   * @param {string[]|Set<string>} slugs
   * @returns {string}
   */
  function resolveEntityUrl(name, slugs) {
    var slug = slugify(name);
    var set = slugs instanceof Set ? slugs : new Set(slugs || []);
    if (slug && set.has(slug)) return '/entity/' + slug + '/';
    return '/pages/suche/?q=' + encodeURIComponent(name);
  }

  /**
   * Setzt href aller a[data-entity-name] im Container.
   * @param {Element|Document} root
   * @param {string[]|Set<string>} slugs
   */
  function rewriteLinks(root, slugs) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('a[data-entity-name]').forEach(function (a) {
      a.href = resolveEntityUrl(a.getAttribute('data-entity-name'), slugs);
    });
  }

  /**
   * Manifest laden und dann alle Links im Container umschreiben.
   * @param {Element} [root]
   * @returns {Promise<void>}
   */
  function rewriteWhenReady(root) {
    return loadManifest().then(function (slugs) {
      rewriteLinks(root, slugs);
    });
  }

  var api = {
    slugify: slugify,
    loadManifest: loadManifest,
    resolveEntityUrl: resolveEntityUrl,
    rewriteWhenReady: rewriteWhenReady,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { slugify: slugify, resolveEntityUrl: resolveEntityUrl };
  }
  if (typeof window !== 'undefined') {
    window.CurriculaEntityLinks = api;
  }
})();
