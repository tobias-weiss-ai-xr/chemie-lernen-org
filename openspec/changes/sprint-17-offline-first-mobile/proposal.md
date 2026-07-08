## Why

Mobile users on unreliable networks (schools, public transit, rural areas) experience poor performance and broken pages. Offline-first architecture ensures core content remains accessible without connectivity, improving reliability and user experience for mobile learners.

## What Changes

- Add Service Worker for caching static assets and API responses
- Implement PWA manifest for installable web app experience
- Add offline detection and fallback UI
- Cache learning paths, exercises, and periodic table data for offline use
- Implement background sync for completed exercises when connectivity returns

## Capabilities

### New Capabilities

- `offline-cache`: Service Worker caching strategy for static assets and API data
- `pwa-manifest`: Web App Manifest for installable PWA experience
- `offline-ui`: Offline detection and user-friendly fallback interface
- `background-sync`: Queue and sync user actions when connectivity returns

### Modified Capabilities

- None (new functionality, no existing capability requirements change)

## Impact

- Hugo templates: Add service worker registration and offline UI
- JavaScript: New service worker file, offline detection logic
- Static files: New manifest.json, icons for PWA
- API: No changes (offline mode uses cached data)
- Dependencies: Workbox for service worker tooling

## Rollback Plan

If offline functionality causes issues, disable service worker registration via feature flag. Users can clear cache to restore online-only behavior.
