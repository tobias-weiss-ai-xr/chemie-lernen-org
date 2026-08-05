// ============================================================
// pwa-article-cache.js — IndexedDB article cache for offline
// Stores visited article content so users can re-read offline.
// Separate from the SW Cache API — user-facing "saved articles."
// Max 50 articles, LRU eviction on overflow.
// ============================================================
(function () {
  'use strict';

  var DB_NAME = 'chemie-article-cache';
  var DB_VERSION = 1;
  var STORE_NAME = 'articles';
  var MAX_ARTICLES = 50;

  var dbPromise = null;

  /**
   * Open / upgrade the IndexedDB database.
   * @returns {Promise<IDBDatabase>}
   */
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, {
            keyPath: 'url',
          });
          store.createIndex('visitedAt', 'visitedAt', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
      };

      request.onsuccess = function (e) {
        resolve(e.target.result);
      };

      request.onerror = function (e) {
        console.warn('[ArticleCache] DB open error:', e.target.error);
        dbPromise = null;
        reject(e.target.error);
      };
    });
    return dbPromise;
  }

  /**
   * Save the current article to IndexedDB.
   * Extracts title, content, and metadata from the page.
   */
  function saveCurrentArticle() {
    var title = document.querySelector('h1') || document.querySelector('title');
    var article =
      document.querySelector('article') ||
      document.querySelector('main') ||
      document.querySelector('.content');

    if (!title || !article) return;

    var textContent = article.textContent || '';
    // Limit stored body to 50KB to keep DB small
    if (textContent.length > 51200) {
      textContent = textContent.substring(0, 51200);
    }

    var entry = {
      url: window.location.pathname,
      title: (title.textContent || title.innerText || '').trim(),
      snippet: textContent.substring(0, 300).replace(/\s+/g, ' ').trim(),
      body: textContent,
      visitedAt: Date.now(),
    };

    openDB()
      .then(function (db) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);

        // Check if article already exists (update visitedAt)
        var getReq = store.get(entry.url);
        getReq.onsuccess = function () {
          if (getReq.result) {
            entry.body = getReq.result.body; // preserve existing body
            entry.snippet = getReq.result.snippet;
          }
          store.put(entry);
        };

        tx.oncomplete = function () {
          enforceLimit();
        };
      })
      .catch(function (err) {
        console.warn('[ArticleCache] Save error:', err);
      });
  }

  /**
   * Get all cached articles, sorted by most recent first.
   * @returns {Promise<Array>}
   */
  function getAllArticles() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var index = store.index('visitedAt');
        var results = [];

        var req = index.openCursor(null, 'prev'); // descending

        req.onsuccess = function (e) {
          var cursor = e.target.result;
          if (cursor) {
            var entry = cursor.value;
            // Omit body from listing (loaded on demand)
            results.push({
              url: entry.url,
              title: entry.title,
              snippet: entry.snippet,
              visitedAt: entry.visitedAt,
            });
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        req.onerror = function () {
          reject(req.error);
        };
      });
    });
  }

  /**
   * Get a single cached article by URL (with full body).
   * @param {string} url
   * @returns {Promise<Object|null>}
   */
  function getArticle(url) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(url);
        req.onsuccess = function () {
          resolve(req.result || null);
        };
        req.onerror = function () {
          reject(req.error);
        };
      });
    });
  }

  /**
   * Remove a single article from cache.
   * @param {string} url
   * @returns {Promise}
   */
  function removeArticle(url) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.delete(url);
        tx.oncomplete = resolve;
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  /**
   * Enforce MAX_ARTICLES limit — evict oldest on overflow.
   */
  function enforceLimit() {
    openDB().then(function (db) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var countReq = store.count();

      countReq.onsuccess = function () {
        var count = countReq.result;
        if (count <= MAX_ARTICLES) return;

        // Need to evict oldest entries
        var tx2 = db.transaction(STORE_NAME, 'readwrite');
        var store2 = tx2.objectStore(STORE_NAME);
        var index = store2.index('visitedAt');
        var cursorReq = index.openCursor(null, 'next'); // oldest first
        var toDelete = count - MAX_ARTICLES;
        var deleted = 0;

        cursorReq.onsuccess = function (e) {
          var cursor = e.target.result;
          if (cursor && deleted < toDelete) {
            store2.delete(cursor.value.url);
            deleted++;
            cursor.continue();
          }
        };
      };
    });
  }

  /**
   * Get total number of cached articles.
   * @returns {Promise<number>}
   */
  function getCacheSize() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.count();
        req.onsuccess = function () {
          resolve(req.result);
        };
        req.onerror = function () {
          reject(req.error);
        };
      });
    });
  }

  // ── Auto-save on page load (for content/article pages) ──
  var autoSavePaths = ['/themenbereiche/', '/klassenstufen/', '/pages/', '/posts/'];

  function shouldAutoSave() {
    var path = window.location.pathname;
    for (var i = 0; i < autoSavePaths.length; i++) {
      if (path.indexOf(autoSavePaths[i]) === 0) return true;
    }
    return false;
  }

  if (shouldAutoSave()) {
    // Delay save to not interfere with page rendering
    if (document.readyState === 'complete') {
      setTimeout(saveCurrentArticle, 2000);
    } else {
      window.addEventListener('load', function () {
        setTimeout(saveCurrentArticle, 2000);
      });
    }
  }

  // ── Export API ──────────────────────────────────────────
  window.ArticleCache = {
    saveCurrentArticle: saveCurrentArticle,
    getAllArticles: getAllArticles,
    getArticle: getArticle,
    removeArticle: removeArticle,
    getCacheSize: getCacheSize,
  };

  // ── Listen for manual save events (e.g. bookmark button) ──
  window.addEventListener('articleCacheSave', saveCurrentArticle);
})();
