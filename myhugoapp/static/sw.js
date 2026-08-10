// ============================================================
// chemie-lernen.org — Service Worker
// Strategies: cache-first for static assets, network-first for
// content pages, network-only for admin/auth API calls.
// Cache size limited to 50 MB with LRU eviction.
// ============================================================
const SW_VERSION = 'v8-2026-08';
const STATIC_CACHE = 'static-' + SW_VERSION;
const ASSETS_CACHE = 'assets-' + SW_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + SW_VERSION;
const QUIZ_CACHE = 'chemie-quiz-v1';

// ── Cache limits ──────────────────────────────────────────
const CACHE_LIMITS = {
  [STATIC_CACHE]: 10 * 1024 * 1024, // 10 MB pre-cached static
  [ASSETS_CACHE]: 25 * 1024 * 1024, // 25 MB CSS/images/fonts
  [DYNAMIC_CACHE]: 15 * 1024 * 1024, // 15 MB HTML/API responses
  [QUIZ_CACHE]: 50, // 50 entries max
};
const QUIZ_MAX_ENTRIES = 50;
const QUIZ_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOTAL_CACHE_LIMIT = 50 * 1024 * 1024; // 50 MB global

// ── Pre-cached files (installed on 'install') ────────────
const PRECACHE_FILES = [
  '/',
  '/offline/',
  '/manifest.json',
  '/site.webmanifest',
  '/favicons/favicon-16x16.png',
  '/favicons/favicon-32x32.png',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png',
  '/favicons/apple-touch-icon.png',
  '/icons/pwa-icon.svg',
  '/quiz/',
  '/lernkarten-review/',
  '/uebungsverlauf/',
  '/css/custom.css',
  '/css/dark-mode.css',
  '/css/green-theme.css',
  '/css/quiz-system.css',
  '/css/site-chrome.css',
  '/js/dark-mode.js',
  '/js/lazy-loader.js',
  '/js/utils/chemistry-utils.js',
  '/js/utils/error-handler.js',
];

// ── Auth / admin paths — NEVER cache ──────────────────────
function isAuthOrAdmin(url) {
  var path = url.pathname;
  return (
    path.startsWith('/api/auth') ||
    path.startsWith('/api/admin') ||
    path.startsWith('/auth/') ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/konto') ||
    path === '/login/' ||
    path === '/register/' ||
    path === '/konto/'
  );
}

// ── Is this a static asset? ───────────────────────────────
function isStaticAsset(url) {
  var path = url.pathname;
  return (
    path.startsWith('/css/') ||
    path.startsWith('/favicons/') ||
    path.startsWith('/icons/') ||
    path.startsWith('/images/') ||
    path.startsWith('/img/') ||
    path.startsWith('/fonts/') ||
    path.startsWith('/pagefind/') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.gif') ||
    path.endsWith('.svg') ||
    path.endsWith('.woff2') ||
    path.endsWith('.woff') ||
    path.endsWith('.ttf') ||
    path.endsWith('.webmanifest')
  );
}

// ── Is this a JS file? ────────────────────────────────────
function isJavaScript(url) {
  return url.pathname.startsWith('/js/') && url.pathname.endsWith('.js');
}

// ── Is this an API call? ──────────────────────────────────
function isApiCall(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.xml')
  );
}

// ── Is this a quiz API/exercise request? ──────────────────
function isQuizRequest(url) {
  return url.pathname.startsWith('/api/quiz/') || url.pathname.startsWith('/api/exercises/');
}

// ── Is this a quiz page HTML? ─────────────────────────────
function isQuizPage(url) {
  var path = url.pathname;
  return path === '/quiz/' || path.startsWith('/quiz/');
}

// ── Is this a content page? ───────────────────────────────
function isContentPage(url) {
  var path = url.pathname;
  return (
    path.endsWith('.html') ||
    path === '/' ||
    path === '/offline/' ||
    path === '/offline' ||
    path.startsWith('/posts/') ||
    path.startsWith('/themenbereiche/') ||
    path.startsWith('/klassenstufen/') ||
    path.startsWith('/pages/')
  );
}

// ═══════════════════════════════════════════════════════════
// LRU Cache Eviction — keep each cache under its size limit
// ═══════════════════════════════════════════════════════════
function lruEvictCache(cacheName, maxBytes) {
  return caches.open(cacheName).then(function (cache) {
    return cache.keys().then(function (requests) {
      return Promise.all(
        requests.map(function (req) {
          return cache.match(req).then(function (resp) {
            if (!resp) return { url: req.url, size: 0, time: 0 };
            var size = parseInt(resp.headers.get('content-length') || '0', 10);
            // Estimate from body if content-length missing
            return resp
              .clone()
              .text()
              .then(function (text) {
                return {
                  url: req.url,
                  size: size || text.length,
                  time: new Date(resp.headers.get('date') || Date.now()).getTime(),
                };
              });
          });
        })
      ).then(function (entries) {
        var total = entries.reduce(function (s, e) {
          return s + e.size;
        }, 0);
        if (total <= maxBytes) return;
        // Sort by age (oldest first, approximated by URL order in cache)
        entries.sort(function (a, b) {
          return a.time - b.time;
        });
        var deleteOps = [];
        for (var i = 0; i < entries.length && total > maxBytes; i++) {
          deleteOps.push(cache.delete(entries[i].url));
          total -= entries[i].size;
        }
        return Promise.all(deleteOps);
      });
    });
  });
}

// ── Global 50 MB limit check ──────────────────────────────
function enforceGlobalLimit() {
  return caches.keys().then(function (names) {
    return Promise.all(
      names.map(function (name) {
        return caches.open(name).then(function (cache) {
          return cache.keys().then(function (reqs) {
            return Promise.all(
              reqs.map(function (req) {
                return cache.match(req).then(function (resp) {
                  if (!resp) return 0;
                  var len = parseInt(resp.headers.get('content-length') || '0', 10);
                  return len || 1024; // fallback estimate
                });
              })
            ).then(function (sizes) {
              return sizes.reduce(function (a, b) {
                return a + b;
              }, 0);
            });
          });
        });
      })
    ).then(function (perCache) {
      var total = perCache.reduce(function (a, b) {
        return a + b;
      }, 0);
      if (total > TOTAL_CACHE_LIMIT) {
        // Evict the largest cache, starting with dynamic
        var ordered = [DYNAMIC_CACHE, ASSETS_CACHE, STATIC_CACHE];
        return Promise.all(
          ordered.map(function (name) {
            return lruEvictCache(name, CACHE_LIMITS[name] || 5 * 1024 * 1024);
          })
        );
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// INSTALL
// ═══════════════════════════════════════════════════════════
self.addEventListener('install', function (event) {
  console.log('[SW] Installing', SW_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(function (cache) {
        return cache.addAll(PRECACHE_FILES);
      })
      .then(function () {
        return self.skipWaiting();
      })
      .catch(function (err) {
        console.error('[SW] Install failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════
// ACTIVATE — clean old caches, claim clients
// ═══════════════════════════════════════════════════════════
self.addEventListener('activate', function (event) {
  console.log('[SW] Activating', SW_VERSION);
  var expectedCaches = [STATIC_CACHE, ASSETS_CACHE, DYNAMIC_CACHE, QUIZ_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (n) {
              return expectedCaches.indexOf(n) === -1;
            })
            .map(function (n) {
              console.log('[SW] Deleting old cache:', n);
              return caches.delete(n);
            })
        );
      })
      .then(function () {
        // Notify all clients of new version
        return self.clients.matchAll().then(function (clients) {
          clients.forEach(function (client) {
            client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
          });
        });
      })
      .then(function () {
        return self.clients.claim();
      })
      .catch(function (err) {
        console.error('[SW] Activate failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════
// FETCH
// ═══════════════════════════════════════════════════════════
self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // ── Guard: GET only ─────────────────────────────────────
  if (request.method !== 'GET') return;

  // ── Guard: same-origin (or allowed CDN) ─────────────────
  if (url.origin !== location.origin) {
    var allowedOrigins = [
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'unpkg.com',
      'code.jquery.com',
    ];
    if (allowedOrigins.indexOf(url.hostname) === -1) return;
    // For allowed CDNs: pass through, no caching
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match(request);
      })
    );
    return;
  }

  // ── NEVER cache auth/admin paths (network-only) ─────────
  if (isAuthOrAdmin(url)) {
    event.respondWith(
      fetch(request).catch(function () {
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // ── JS files: network-first (fresh code = fewer bugs) ───
  if (isJavaScript(url)) {
    event.respondWith(networkFirst(request, ASSETS_CACHE));
    return;
  }

  // ── Static assets: cache-first ──────────────────────────
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  // ── Content pages: network-first with offline fallback ──
  if (isContentPage(url)) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // ── Quiz API / exercise requests ────────────────────────
  if (isQuizRequest(url)) {
    if (request.method === 'GET') {
      event.respondWith(quizCacheFirst(request));
    } else {
      // POST submissions: network-first
      event.respondWith(quizNetworkFirst(request));
    }
    return;
  }

  // ── Quiz page HTML: cache-first for offline access ──────
  if (isQuizPage(url) && request.method === 'GET') {
    event.respondWith(quizPageCacheFirst(request));
    return;
  }

  // ── KG Data API: StaleWhileRevalidate for entity data ───
  if (
    url.pathname.startsWith('/api/kg-data') ||
    url.pathname.startsWith('/api/content') ||
    url.pathname.startsWith('/api/didaktik')
  ) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // ── Search index: CacheFirst (rarely changes) ───────────
  if (url.pathname === '/search/entity-index.json' || url.pathname.endsWith('/entity-index.json')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // ── API calls (non-auth): network-first with cache ──────
  if (isApiCall(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // ── Everything else: network-first, no cache ────────────
  event.respondWith(
    fetch(request).catch(function () {
      return caches.match(request).then(function (r) {
        return r || new Response('Offline', { status: 503 });
      });
    })
  );
});

// ═══════════════════════════════════════════════════════════
// STRATEGY: Cache-First
// ═══════════════════════════════════════════════════════════
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
          lruEvictCache(cacheName, CACHE_LIMITS[cacheName] || 10 * 1024 * 1024);
          enforceGlobalLimit();
        }
        return response;
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// STRATEGY: Stale-While-Revalidate (API data)
// ═══════════════════════════════════════════════════════════
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var fetchPromise = fetch(request)
        .then(function (response) {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
            lruEvictCache(cacheName, CACHE_LIMITS[cacheName] || 10 * 1024 * 1024);
            enforceGlobalLimit();
          }
          return response;
        })
        .catch(function () {
          return null;
        });
      return cached || fetchPromise;
    });
  });
}

// ═══════════════════════════════════════════════════════════
// STRATEGY: Network-First (generic)
// ═══════════════════════════════════════════════════════════
function networkFirst(request, cacheName) {
  return fetch(request)
    .then(function (response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(cacheName).then(function (cache) {
          cache.put(request, clone);
          lruEvictCache(cacheName, CACHE_LIMITS[cacheName] || 10 * 1024 * 1024);
          enforceGlobalLimit();
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) return cached;
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    });
}

// ═══════════════════════════════════════════════════════════
// STRATEGY: Network-First for HTML pages (with offline page)
// ═══════════════════════════════════════════════════════════
function networkFirstPage(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(function (cache) {
          cache.put(request, clone);
          lruEvictCache(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE]);
          enforceGlobalLimit();
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) return cached;
        // Serve offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline/').then(function (offlinePage) {
            return (
              offlinePage ||
              new Response(
                '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><meta name="theme-color" content="#2d6a4f"><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#fff;border-radius:12px;padding:2em;max-width:480px;margin:2em;box-shadow:0 2px 12px rgba(0,0,0,0.1);text-align:center}h1{color:#2d6a4f}</style></head><body><div class="card"><h1>Keine Internetverbindung</h1><p>Bitte überprüfe deine Internetverbindung und versuche es erneut.</p></div></body></html>',
                {
                  status: 503,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' },
                }
              )
            );
          });
        }
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    });
}

// ═══════════════════════════════════════════════════════════
// MESSAGE — handle version check from client
// ═══════════════════════════════════════════════════════════
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

// ═══════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-quiz-progress') {
    event.waitUntil(syncQuizProgress());
  }
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// ═══════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
self.addEventListener('push', function (event) {
  if (event.data) {
    var options = {
      body: event.data.text(),
      icon: '/icons/pwa-icon.svg',
      badge: '/favicons/favicon-32x32.png',
      vibrate: [100, 50, 100],
      data: { dateOfArrival: Date.now(), primaryKey: 1 },
      actions: [
        { action: 'explore', title: 'Erkunden', icon: '/icons/pwa-icon.svg' },
        { action: 'close', title: 'Schließen' },
      ],
    };
    event.waitUntil(self.registration.showNotification('Chemie Lernen', options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('https://chemie-lernen.org/themenbereiche/'));
  }
});

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function syncQuizProgress() {
  console.log('[SW] Syncing quiz progress');
  // Placeholder: sync IndexedDB queue with server on reconnect
  return Promise.resolve();
}

function syncUserData() {
  console.log('[SW] Syncing user data');
  return Promise.resolve();
}

// ═══════════════════════════════════════════════════════════
// QUIZ CACHE: Cache-First (GET /api/quiz/*, /api/exercises/*)
// ═══════════════════════════════════════════════════════════
function quizCacheFirst(request) {
  return caches.open(QUIZ_CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      if (cached) {
        // Check 7-day TTL
        var dateHeader = cached.headers.get('date');
        if (dateHeader) {
          var age = Date.now() - new Date(dateHeader).getTime();
          if (age > QUIZ_TTL_MS) {
            // Expired — fetch fresh, don't return stale
            return fetchAndCacheQuiz(request, cache);
          }
        }
        return cached;
      }
      // Cache miss — try network, then IndexedDB fallback
      return fetchAndCacheQuiz(request, cache).catch(function () {
        return quizIndexedDBFallback(request);
      });
    });
  });
}

function fetchAndCacheQuiz(request, cache) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
      lruEvictQuizCache();
    }
    return response;
  });
}

// ═══════════════════════════════════════════════════════════
// QUIZ CACHE: Network-First (POST submissions)
// ═══════════════════════════════════════════════════════════
function quizNetworkFirst(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.status === 200 && request.method === 'GET') {
        var clone = response.clone();
        caches.open(QUIZ_CACHE).then(function (cache) {
          cache.put(request, clone);
          lruEvictQuizCache();
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      });
    });
}

// ═══════════════════════════════════════════════════════════
// QUIZ PAGE: Cache-First for HTML pages
// ═══════════════════════════════════════════════════════════
function quizPageCacheFirst(request) {
  return caches.open(STATIC_CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// LRU Eviction for Quiz Cache (by entry count, max 50)
// ═══════════════════════════════════════════════════════════
function lruEvictQuizCache() {
  return caches.open(QUIZ_CACHE).then(function (cache) {
    return cache.keys().then(function (requests) {
      if (requests.length <= QUIZ_MAX_ENTRIES) return;
      var toDelete = requests.length - QUIZ_MAX_ENTRIES + 5;
      var ops = [];
      for (var i = 0; i < toDelete && i < requests.length; i++) {
        ops.push(cache.delete(requests[i]));
      }
      return Promise.all(ops);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// IndexedDB Fallback — try ProgressTracker DB on cache miss
// ═══════════════════════════════════════════════════════════
function quizIndexedDBFallback(request) {
  return new Promise(function (resolve, reject) {
    var openReq = indexedDB.open('ChemieLernenProgress', 1);
    openReq.onsuccess = function () {
      var db = openReq.result;
      var tx = db.transaction('exercises', 'readonly');
      var store = tx.objectStore('exercises');
      var urlKey = 'sw:' + request.url;
      var getReq = store.get(urlKey);
      getReq.onsuccess = function () {
        db.close();
        if (getReq.result && getReq.result.data) {
          resolve(
            new Response(JSON.stringify(getReq.result.data), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        } else {
          reject(new Error('Not found in IndexedDB'));
        }
      };
      getReq.onerror = function () {
        db.close();
        reject(getReq.error);
      };
    };
    openReq.onerror = function () {
      reject(openReq.error);
    };
  });
}
