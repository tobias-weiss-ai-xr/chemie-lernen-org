# Spec: pwa

**Capability:** Progressive Web App features for chemie-lernen.org
**Owners:** Sisyphus
**Status:** Active — main spec

---

## Purpose

chemie-lernen.org provides a Progressive Web App experience that
enables German secondary-school students to access chemistry learning
material offline, receive updates, and benefit from app-like behavior
on mobile devices. The PWA features include service worker caching,
offline page, web app manifest, background sync, and push notifications.

## Requirements

### REQ-PWA-1: Service worker registration

The service worker is registered from the main page:

- Registered in `myhugoapp/layouts/partials/head.html` via
  `navigator.serviceWorker.register('/sw.js')`
- Registration occurs on page load, not deferred
- Scope covers the entire origin
- Update flow notifies users of new versions

### REQ-PWA-2: Service worker architecture (sw.js)

The active service worker at `myhugoapp/static/sw.js` (v4, cache name
`chemie-lernen-v4`) implements three cache stores:

| Cache        | Prefix             | Contents                        |
| ------------ | ------------------ | ------------------------------- |
| Static cache | `static-v4`        | HTML pages, core CSS, app shell |
| Assets cache | `assets-v4`        | Images, favicons, fonts, CSS    |
| Default      | `chemie-lernen-v4` | Fallback cached responses       |

### REQ-PWA-3: Caching strategy — JavaScript (network first)

All `/js/` requests use network-first strategy:

1. Fetch from network
2. On success (200): clone response, store in assets cache, return
3. On failure: return cached response if available
4. If no cache: return `503 Network error`

### REQ-PWA-4: Caching strategy — static assets (cache first)

CSS, favicons, images, fonts use cache-first strategy:

1. Check cache for matching request
2. If found: return cached response immediately
3. If not found: fetch from network, cache on success (200), return
4. Cached: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webmanifest`,
   `.woff2`, `.woff`, `.ttf`, and `/css/`, `/favicons/`, `/images/`,
   `/img/`, `/pagefind/` paths

### REQ-PWA-5: Caching strategy — HTML pages (network first)

HTML pages and section pages use network-first:

1. Fetch from network
2. On success: cache in static cache, return
3. On failure: return cached version
4. If no cache: try `/offline/`, otherwise return `503 Service Unavailable`

Covered paths include: `/`, `/offline/`, `/posts/`, `/themenbereiche/`,
`/klassenstufen/`, `/pages/`, all calculator and tool routes, and
`/entity/` pages.

### REQ-PWA-6: Caching strategy — API and data (network first)

API calls and JSON/XML data use network-first:

1. Fetch from network
2. On success (200): clone, cache in static cache, return
3. On failure: return cached response

### REQ-PWA-7: Offline page

An offline page at `/offline/` provides:

- Friendly message: "Du bist offline"
- Link to try again when connectivity returns
- Cached content suggestions (recently viewed pages)
- Search functionality (if pagefind index is cached)
- Clean, minimal design with the site header/footer

### REQ-PWA-8: Web app manifest

- Manifest at `/site.webmanifest`
- App name: "Chemie Lernen"
- Short name: "ChemieLernen"
- Display mode: `standalone`
- Theme color: `#1a73e8`
- Background color: `#ffffff`
- Icons: 192x192, 512x512 PNG
- Start URL: `/`

### REQ-PWA-9: Install prompt

- `beforeinstallprompt` event listeners for promoting PWA install
- Install prompt deferred until user engagement signal
- Custom install button UI on supported browsers
- Analytics tracking for install events

### REQ-PWA-10: Cache management

On service worker activation, old caches are cleaned up:

- List all cache names
- Delete caches not matching current `STATIC_CACHE` or `ASSETS_CACHE`
- Pattern: old caches named `static-v3`, `assets-v3`, etc. are removed
- `self.clients.claim()` ensures all clients use the new SW immediately

### REQ-PWA-11: Background sync

The service worker handles background sync events:

- `sync-quiz-progress` — sync quiz completion data when online
- `sync-user-data` — sync user preferences and settings
- Sync handlers log to console (placeholder for future server sync)

### REQ-PWA-12: Push notifications

Push notification support:

- `push` event listener displays notifications with icon, badge, vibration
- Notification actions: "Explore" (opens Themenbereiche) and "Close"
- `notificationclick` handler navigates to relevant content
- Push requires service worker registration and user permission

### REQ-PWA-13: Cross-origin request handling

The service worker allows specific CDNs:

| Origin                 | Purpose       |
| ---------------------- | ------------- |
| `cdn.jsdelivr.net`     | KaTeX, Charts |
| `fonts.googleapis.com` | Google Fonts  |
| `fonts.gstatic.com`    | Google Fonts  |

Analytics origins (`googletagmanager.com`, `google-analytics.com`) are
allowed but not cached. All other cross-origin requests are skipped.

### REQ-PWA-14: PWA audit targets

The PWA implementation targets:

- Lighthouse PWA badge (pass all PWA-required audits)
- Offline-capable core functionality
- `< 2s` first meaningful paint on repeat visits (cache)
- Standalone display mode on mobile
- HTTPS required (enforced via Traefik in production)

## Scenarios

### S-PWA-1: Student accesses site offline

**Given** a student has previously visited `/themenbereiche/atombau/`
**When** they lose internet connectivity
**And** they navigate to `/themenbereiche/atombau/`
**Then** the cached HTML page is served from the static cache
**And** CSS and images are served from the assets cache
**And** JavaScript calculators attempt network-first, fall back to cache
**When** they navigate to a page they haven't visited
**Then** the offline page (`/offline/`) is shown

### S-PWA-2: Service worker update

**Given** a new version of the site is deployed
**When** the student visits the site
**Then** the new service worker installs in the background
**When** the old service worker is no longer controlling any clients
**Then** the new service worker activates
**And** old caches (`static-v3`, etc.) are cleaned up
**And** the student gets a "New version available" notification

### S-PWA-3: Install to home screen

**Given** a student visits chemie-lernen.org regularly on their phone
**When** they visit for the 3rd time within 2 weeks
**Then** a PWA install prompt appears
**When** they accept the prompt
**Then** the site is added to their home screen with the app icon
**And** opening it launches in standalone mode (no browser chrome)

### S-PWA-4: Background quiz sync

**Given** a student completes a quiz while offline
**When** they reconnect to the internet
**Then** the `sync-quiz-progress` event fires
**And** the service worker syncs the quiz data
**And** the student's progress is updated

### S-PWA-5: Push notification for new content

**Given** a student has granted notification permission
**When** new chemistry content is published
**Then** a push notification is sent: "Neuer Artikel: Katalyse in der Chemie"
**When** the student clicks the notification
**Then** the site opens to the new article

## References

- `myhugoapp/static/sw.js` — active service worker (v4, 379 lines)
- `myhugoapp/layouts/partials/head.html` — SW registration (line ~114)
- `myhugoapp/static/site.webmanifest` — web app manifest
- `myhugoapp/content/offline/` — offline page content
- `myhugoapp/static/i18n/locales/` — localized strings
