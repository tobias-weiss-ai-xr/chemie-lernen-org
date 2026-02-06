const CACHE_NAME = 'chemie-lernen-v1';
const STATIC_CACHE = 'static-v1';
const ASSETS_CACHE = 'assets-v1';

// Files to cache immediately for the chemistry learning platform
const STATIC_FILES = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicons/favicon-16x16.png',
  '/favicons/favicon-32x32.png',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png',
  '/favicons/apple-touch-icon.png',
  '/css/custom.css',
  '/css/dark-mode.css',
  '/css/green-theme.css',
  '/css/quiz-system.css',
  '/js/dark-mode.js',
  '/js/chemistry-calculator-framework.js',
  '/js/advanced-lazy-loader.js'
];

const PERFORMANCE_CRITICAL = [
  '/js/chemistry-calculator-framework.js',
  '/css/chemistry-calculator-framework.css'
];

const LAZY_LOADED = [
  '/js/ph-rechner-framework.js',
  '/js/druck-flaechen-rechner-framework.js',
  '/js/molare-masse-rechner.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static files');
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== ASSETS_CACHE)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    }).catch((error) => {
      console.error('[SW] Activation failed:', error);
    })
  );
});

// Fetch event - serve from cache with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for trusted CDNs
  if (url.origin !== location.origin) {
    // Allow specific external resources (CDNs, APIs)
    const allowedOrigins = [
      'cdn.jsdelivr.net',  // KaTeX
      'maxcdn.bootstrapcdn.com',  // Bootstrap
      'stackpath.bootstrapcdn.com',  // Font Awesome
      'fonts.googleapis.com',  // Google Fonts
      'fonts.gstatic.com'  // Google Fonts
    ];

    if (allowedOrigins.includes(url.hostname)) {
      return; // Let these pass through
    }

    // Allow analytics but don't cache
    if (url.hostname.includes('googletagmanager.com') || url.hostname.includes('google-analytics.com')) {
      return;
    }

    return; // Skip other cross-origin requests
  }

  // Cache First strategy for static assets
  if (url.pathname.includes('/css/') ||
      url.pathname.includes('/js/') ||
      url.pathname.includes('/favicons/') ||
      url.pathname.includes('/img/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.gif') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.webmanifest')) {

    event.respondWith(
      caches.open(ASSETS_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Network First strategy for HTML pages
  if (url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.includes('/themenbereiche/') ||
      url.pathname.includes('/pages/') ||
      url.pathname.includes('/perioden-system-der-elemente/') ||
      url.pathname.includes('/molekuel-studio/') ||
      url.pathname.includes('/ph-rechner/') ||
      url.pathname.includes('/molare-masse-rechner/') ||
      url.pathname.includes('/reaktionsgleichungen-ausgleichen/') ||
      url.pathname.includes('/einheitenumrechner/') ||
      url.pathname.includes('/loesungsrechner/') ||
      url.pathname.includes('/stoechiometrie-rechner/')) {

    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        // If network fails, try cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // Return offline page if available
          return caches.match('/') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
    return;
  }

  // Stale While Revalidate for API calls and dynamic content
  if (url.pathname.includes('/api/') ||
      url.pathname.includes('.json') ||
      url.pathname.includes('.xml')) {

    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });

          // Return cached response immediately if available
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: Network First for everything else
  event.respondWith(
    fetch(request).then((response) => {
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-quiz-progress') {
    event.waitUntil(syncQuizProgress());
  }

  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/favicons/android-chrome-192x192.png',
      badge: '/favicons/favicon-32x32.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Explore',
          icon: '/favicons/android-chrome-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/favicons/android-chrome-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('Chemie Lernen', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://chemie-lernen.org/themenbereiche/')
    );
  }
});

// Helper functions for background sync
async function syncQuizProgress() {
  // Sync quiz progress when back online
  console.log('[SW] Syncing quiz progress');
  // Implementation would sync local storage data with server
}

async function syncUserData() {
  // Sync user preferences and settings
  console.log('[SW] Syncing user data');
  // Implementation would sync user settings with server
}