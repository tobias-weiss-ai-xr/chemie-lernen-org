/* global lunr */
/**
 * search.js — Client-side full-text search engine using Lunr.js.
 *
 * Requires: Lunr.js loaded via <script src="https://unpkg.com/lunr@2.3.9/lunr.min.js">
 *
 * Exposes: window.__search = {
 *   ready: Promise,           // resolves when index is built
 *   search(query): Array,     // returns [{type, name, slug, category, categoryLabel, url, ...}]
 *   isReady: Boolean,
 * }
 */
(function () {
  var SEARCH = {
    ready: null,
    isReady: false,
    _resolveReady: null,
    _idx: null,
    _docs: [],
  };

  SEARCH.ready = new Promise(function (resolve) {
    SEARCH._resolveReady = resolve;
  });

  var catLabels = {
    stoff: 'Stoff',
    konzept: 'Konzept',
    reaktion: 'Reaktion',
    methode: 'Methode',
    person: 'Person',
    quelle: 'Quelle',
    lehrplan: 'Lehrplan',
    didaktik: 'KMK-Standard',
  };

  var catColors = {
    stoff: '#667eea',
    konzept: '#45b7d1',
    reaktion: '#4ecdc4',
    methode: '#f093fb',
    person: '#ff9a76',
    quelle: '#a8a8a8',
    lehrplan: '#9b59b6',
    didaktik: '#2e7d32',
  };

  function toSlug(name) {
    return name
      .toLowerCase()
      .replace(/[üÜ]/g, 'ue')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[äÄ]/g, 'ae')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function buildIndex(data) {
    if (typeof lunr === 'undefined') {
      console.warn('[search] Lunr.js not loaded');
      SEARCH.isReady = true;
      if (SEARCH._resolveReady) SEARCH._resolveReady();
      return;
    }

    var entities = data.entities || [];
    var articles = data.articles || [];
    var curricula = data.curricula || [];
    var docId = 0;

    SEARCH._idx = lunr(function () {
      this.ref('id');
      this.field('name', { boost: 2 });
      this.field('category');
      this.field('title', { boost: 1.5 });
      this.field('state');

      // Index entities
      entities.forEach(function (e) {
        var slug = toSlug(e.name);
        var doc = {
          id: 'e' + docId++,
          name: e.name,
          category: e.category || 'konzept',
          _type: 'entity',
          _slug: slug,
          _articleCount: (e.articleCount && e.articleCount.low) || e.articles.length || 0,
        };
        SEARCH._docs.push(doc);
        this.add(doc);
      }, this);

      // Index articles
      articles.forEach(function (a) {
        var doc = {
          id: 'a' + docId++,
          title: a.title,
          _type: 'article',
          _url: a.url || '/',
          _articleDate: a.date || '',
        };
        SEARCH._docs.push(doc);
        this.add(doc);
      }, this);

      // Index curricula
      curricula.forEach(function (c) {
        var slug = toSlug(c.name);
        var meta = c.curriculumMeta || {};
        var doc = {
          id: 'c' + docId++,
          name: c.name,
          state: meta.state || '',
          _type: 'curricula',
          _slug: slug,
          _meta: meta,
        };
        SEARCH._docs.push(doc);
        this.add(doc);
      }, this);
    });

    SEARCH.isReady = true;
    console.log('[search] Index built: ' + docId + ' documents');
    if (SEARCH._resolveReady) SEARCH._resolveReady();
  }

  SEARCH.search = function (query) {
    if (!SEARCH._idx || !query || query.trim().length < 2) return [];
    try {
      var results = SEARCH._idx.search(query.trim());
      var output = [];
      var seen = {};

      for (var i = 0; i < Math.min(results.length, 20); i++) {
        var match = results[i];
        var doc = SEARCH._docs[parseInt(match.ref.replace(/^[a-z]/, ''))];
        if (!doc || seen[match.ref]) continue;
        seen[match.ref] = true;

        if (doc._type === 'entity') {
          output.push({
            type: 'entity',
            name: doc.name,
            slug: doc._slug,
            category: doc.category,
            categoryLabel: catLabels[doc.category] || doc.category,
            categoryColor: catColors[doc.category] || '#888',
            articleCount: doc._articleCount,
            url: '/entity/' + doc._slug + '/',
          });
        } else if (doc._type === 'article') {
          output.push({
            type: 'article',
            name: doc.title,
            slug: toSlug(doc.title),
            url: doc._url,
            date: doc._articleDate,
          });
        } else if (doc._type === 'curricula') {
          output.push({
            type: 'curricula',
            name: doc.name,
            slug: doc._slug,
            category: 'lehrplan',
            categoryLabel: 'Lehrplan',
            categoryColor: '#9b59b6',
            url: '/entity/' + doc._slug + '/',
            state: doc.state,
          });
        }
      }
      return output;
    } catch (e) {
      console.warn('[search] Search error:', e);
      return [];
    }
  };

  // Fetch data and build index
  SEARCH.ready = new Promise(function (resolve) {
    SEARCH._resolveReady = resolve;
  });

  fetch('/api/kg-data', { signal: AbortSignal.timeout(15000) })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      buildIndex(data);
    })
    .catch(function (err) {
      console.warn('[search] Failed to load kg-data:', err);
      SEARCH.isReady = true;
      if (SEARCH._resolveReady) SEARCH._resolveReady();
    });

  window.__search = SEARCH;
})();
