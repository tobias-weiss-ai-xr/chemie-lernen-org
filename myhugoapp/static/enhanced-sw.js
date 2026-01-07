const CACHE_VERSION = 'chemie-lernen-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_CACHE = `${CACHE_VERSION}-offline`;

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

const CRITICAL_FILES = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicons/favicon-16x16.png',
  '/favicons/favicon-32x32.png',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png',
  '/favicons/apple-touch-icon.png',
];

const STATIC_RESOURCES = [
  '/css/custom.css',
  '/css/dark-mode.css',
  '/css/green-theme.css',
  '/css/quiz-system.css',
  '/js/chemistry-calculator-framework.optimized.js',
  '/js/dark-mode.optimized.js',
  '/js/enhanced-bundle-loader.js',
];

const CALCULATOR_RESOURCES = [
  '/js/ph-rechner-framework.optimized.js',
  '/js/druck-flaechen-rechner-framework.optimized.js',
  '/js/molare-masse-rechner.optimized.js',
  '/js/konzentrationsumrechner.optimized.js',
  '/js/gasgesetz-rechner.optimized.js',
];

const EXTERNAL_RESOURCES = [
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://code.jquery.com/jquery-3.6.0.min.js',
];

class ServiceWorkerManager {
  constructor() {
    this.caches = new Map();
    this.offlineMode = false;
    this.syncQueue = [];
  }

  async init() {
    this.setupEventListeners();
    this.cleanupOldCaches();
    console.log('[SW] Enhanced Service Worker initialized');
  }

  setupEventListeners() {
    self.addEventListener('install', this.handleInstall.bind(this));
    self.addEventListener('activate', this.handleActivate.bind(this));
    self.addEventListener('fetch', this.handleFetch.bind(this));
    self.addEventListener('message', this.handleMessage.bind(this));
    self.addEventListener('push', this.handlePush.bind(this));
    self.addEventListener('sync', this.handleSync.bind(this));
  }

  async handleInstall(event) {
    console.log('[SW] Installing enhanced service worker');

    event.waitUntil(
      Promise.all([
        this.cacheCriticalFiles(),
        this.cacheStaticResources(),
        this.createOfflinePage(),
      ])
        .then(() => {
          console.log('[SW] Installation complete');
          return self.skipWaiting();
        })
        .catch((error) => {
          console.error('[SW] Installation failed:', error);
        })
    );
  }

  async cacheCriticalFiles() {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CRITICAL_FILES);
    console.log(`[SW] Cached ${CRITICAL_FILES.length} critical files`);
  }

  async cacheStaticResources() {
    const cache = await caches.open(ASSETS_CACHE);
    await cache.addAll(STATIC_RESOURCES);
    console.log(`[SW] Cached ${STATIC_RESOURCES.length} static resources`);
  }

  async createOfflinePage() {
    const offlineHTML = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline - Chemie Lernen</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center; 
      min-height: 100vh; margin: 0; background: #f8f9fa;
      text-align: center; padding: 20px;
    }
    .offline-container { 
      max-width: 500px; padding: 40px; 
      background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .offline-icon { font-size: 4rem; color: #6c757d; margin-bottom: 20px; }
    .offline-title { color: #343a40; margin-bottom: 10px; }
    .offline-message { color: #6c757d; margin-bottom: 20px; line-height: 1.6; }
    .retry-button { 
      background: #007bff; color: white; border: none; padding: 12px 24px; 
      border-radius: 5px; cursor: pointer; font-size: 16px;
    }
    .retry-button:hover { background: #0056b3; }
    .cache-info { 
      margin-top: 30px; padding: 20px; background: #e9ecef; 
      border-radius: 5px; font-size: 14px; color: #495057;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="offline-icon">📚</div>
    <h1 class="offline-title">Sie sind offline</h1>
    <p class="offline-message">
      Keine Internetverbindung verfügbar. Einige Funktionen sind möglicherweise eingeschränkt.
      Gespeicherte Inhalte stehen weiterhin zur Verfügung.
    </p>
    <button class="retry-button" onclick="window.location.reload()">
      Erneut versuchen
    </button>
    <div class="cache-info">
      <strong>Offline verfügbare Inhalte:</strong><br>
      • Periodensystem der Elemente<br>
      • pH-Rechner<br>
      • Molekülstudio<br>
      • Gelernte Fortschritte
    </div>
  </div>
  <script>
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 5000);
  </script>
</body>
</html>
    `;

    const cache = await caches.open(OFFLINE_CACHE);
    const response = new Response(offlineHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
    await cache.put('/offline.html', response);
  }

  async handleActivate(event) {
    console.log('[SW] Activating enhanced service worker');

    event.waitUntil(
      Promise.all([this.cleanupOldCaches(), this.takeControl()]).then(() => {
        console.log('[SW] Activation complete');
      })
    );
  }

  async cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(
      (name) => !name.includes(CACHE_VERSION) && !name.startsWith('chemie-lernen-v')
    );

    await Promise.all(oldCaches.map((name) => caches.delete(name)));

    console.log(`[SW] Cleaned up ${oldCaches.length} old caches`);
  }

  async takeControl() {
    return self.clients.claim();
  }

  async handleFetch(event) {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin !== location.origin) {
      return this.handleExternalRequest(event, request);
    }

    if (request.method !== 'GET') {
      return fetch(request);
    }

    const strategy = this.determineCacheStrategy(url.pathname);
    const response = await this.executeStrategy(strategy, request);

    if (response) {
      return event.respondWith(response);
    }
  }

  determineCacheStrategy(pathname) {
    if (CRITICAL_FILES.some((file) => pathname === file)) {
      return CACHE_STRATEGIES.CACHE_FIRST;
    }

    if (pathname.includes('/css/') || pathname.includes('/js/') || pathname.includes('/images/')) {
      return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    if (pathname.includes('/ph-rechner') || pathname.includes('/molekuel-studio')) {
      return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  async executeStrategy(strategy, request) {
    try {
      switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
          return await this.cacheFirst(request);

        case CACHE_STRATEGIES.NETWORK_FIRST:
          return await this.networkFirst(request);

        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
          return await this.staleWhileRevalidate(request);

        default:
          return await this.networkFirst(request);
      }
    } catch (error) {
      console.error('[SW] Strategy execution failed:', error);
      return this.getOfflineResponse(request);
    }
  }

  async cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Cache hit:', request.url);
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.warn('[SW] Network request failed:', request.url);
      return null;
    }
  }

  async networkFirst(request) {
    try {
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        console.log('[SW] Network response cached:', request.url);
      }

      return response;
    } catch (error) {
      console.warn('[SW] Network request failed, trying cache:', request.url);
      const cache = await caches.open(DYNAMIC_CACHE);
      return await cache.match(request);
    }
  }

  async staleWhileRevalidate(request) {
    const cache = await caches.open(ASSETS_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
            console.log('[SW] Asset revalidated:', request.url);
          }
          return response;
        })
        .catch(() => null);

      fetchPromise.catch(() => {});
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return null;
    }
  }

  async handleExternalRequest(event, request) {
    const trustedCDNs = [
      'maxcdn.bootstrapcdn.com',
      'stackpath.bootstrapcdn.com',
      'code.jquery.com',
      'cdn.jsdelivr.net',
    ];

    const url = new URL(request.url);
    if (trustedCDNs.includes(url.hostname)) {
      return this.networkFirst(request);
    }

    return fetch(request);
  }

  async getOfflineResponse(request) {
    const pathname = new URL(request.url).pathname;

    if (pathname.endsWith('.html')) {
      const cache = await caches.open(OFFLINE_CACHE);
      return await cache.match('/offline.html');
    }

    return new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }

  async handleMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'SKIP_WAITING':
        return self.skipWaiting();

      case 'GET_CACHE_STATUS':
        return this.getCacheStatus();

      case 'CLEAR_CACHE':
        return this.clearCache(data?.cacheName);

      case 'UPDATE_CACHE':
        return this.updateCache(data?.files);
    }
  }

  async getCacheStatus() {
    const caches_list = await caches.keys();
    const status = {};

    for (const cacheName of caches_list) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }

    return status;
  }

  async clearCache(cacheName) {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log(`[SW] Cleared cache: ${cacheName}`);
    } else {
      const allCaches = await caches.keys();
      await Promise.all(allCaches.map((name) => caches.delete(name)));
      console.log('[SW] Cleared all caches');
    }
  }

  async updateCache(files) {
    if (files && files.length > 0) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await Promise.all(files.map((url) => cache.add(url)));
      console.log(`[SW] Updated cache with ${files.length} files`);
    }
  }

  async handlePush(event) {
    if (!event.data) return;

    const { title, body, icon, tag } = event.data.json ? event.data.json() : event.data;

    const options = {
      body: body,
      icon: icon || '/favicons/android-chrome-192x192.png',
      badge: '/favicons/favicon-32x32.png',
      tag: tag || 'chemie-lernen',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Öffnen',
        },
        {
          action: 'dismiss',
          title: 'Schließen',
        },
      ],
    };

    await self.registration.showNotification(title, options);
  }

  async handleSync(event) {
    if (event.tag === 'background-sync') {
      console.log('[SW] Background sync triggered');

      for (const syncItem of this.syncQueue) {
        try {
          await this.processSyncItem(syncItem);
        } catch (error) {
          console.error('[SW] Sync item failed:', error);
        }
      }

      this.syncQueue = [];
    }
  }

  async processSyncItem(item) {
    switch (item.type) {
      case 'quiz-result':
        await this.syncQuizResult(item.data);
        break;
      case 'progress-update':
        await this.syncProgressUpdate(item.data);
        break;
    }
  }

  async syncQuizResult(data) {
    const response = await fetch('/api/quiz/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('[SW] Quiz result synced');
    }
  }

  async syncProgressUpdate(data) {
    const response = await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('[SW] Progress synced');
    }
  }
}

const swManager = new ServiceWorkerManager();
swManager.init();
