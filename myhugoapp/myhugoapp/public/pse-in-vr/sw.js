const CACHE_NAME = 'hello-webxr-v1';
const STATIC_CACHE = 'static-v1';
const ASSETS_CACHE = 'assets-v1';

// Files to cache immediately
const STATIC_FILES = [
  './',
  './index.html',
  './bundle.js',
  './1.bundle.js',
  './2.bundle.js',
  './sw.js',
  './res/favicon-32x32.png',
  './res/favicon-16x16.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_FILES)),
      caches.open(ASSETS_CACHE).then((cache) => cache.addAll(['./assets/']))
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== ASSETS_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    if (url.hostname === 'www.googletagmanager.com') {
      // Allow analytics
      return;
    }
    return;
  }

  // Strategy: Cache First for static assets, Network First for HTML
  if (url.pathname.includes('/assets/') || url.pathname.includes('/res/')) {
    // Cache First for assets
    event.respondWith(
      caches.open(ASSETS_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Update cache in background
            fetch(request).then((freshResponse) => {
              if (freshResponse && freshResponse.status === 200) {
                cache.put(request, freshResponse.clone());
              }
            });
            return response;
          }
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
  } else if (url.pathname.endsWith('.html') || url.pathname === '/') {
    // Network First for HTML
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request);
      })
    );
  } else {
    // Network First for other files (bundle.js, etc.)
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request);
      })
    );
  }
});

// Background sync for failed requests (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-assets') {
    event.waitUntil(
      caches.open(ASSETS_CACHE).then((cache) => {
        // Pre-cache critical assets
        return cache.addAll(['./assets/angel.min.glb']);
      })
    );
  }
});
