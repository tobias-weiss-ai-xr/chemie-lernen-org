## Context

Current state: Static Hugo site with client-side JavaScript. No offline support. Mobile users experience broken pages on unreliable networks. Need to implement service worker caching, PWA manifest, and offline UI.

Constraints: Must work with existing Hugo build process. No server-side changes. Minimal impact on existing JavaScript.

Stakeholders: Mobile learners, teachers in classrooms with spotty connectivity.

## Goals / Non-Goals

**Goals:**

- Implement service worker for caching static assets and API responses
- Add PWA manifest for installable web app experience
- Provide offline detection and user-friendly fallback UI
- Cache learning paths, exercises, and periodic table data for offline use
- Implement background sync for completed exercises when connectivity returns

**Non-Goals:**

- Offline database (IndexedDB) for complex data - use cache API only
- Push notifications - out of scope for this sprint
- App store distribution - web-only PWA

## Decisions

### D1: Service Worker Library - Workbox

**Decision**: Use Workbox (Google's service worker library) for caching and routing.
**Rationale**: Workbox provides battle-tested caching strategies, precaching, and runtime caching with minimal boilerplate. Custom service worker would require significant development time for equivalent functionality.
**Alternatives considered**: Custom service worker (rejected due to complexity), no library (rejected due to reinventing wheel).

### D2: Caching Strategy - Stale-While-Revalidate

**Decision**: Use stale-while-revalidate strategy for API responses, cache-first for static assets.
**Rationale**: Stale-while-revalidate provides best of both worlds - immediate response from cache while updating in background. Cache-first for static assets ensures instant page loads.
**Alternatives considered**: Network-first (rejected - slow on unreliable networks), cache-only (rejected - stale data).

### D3: PWA Manifest - Standard Web App Manifest

**Decision**: Implement standard web app manifest with 192x192 and 512x512 icons.
**Rationale**: Standard manifest provides install prompt and splash screen. Icon sizes match PWA requirements.
**Alternatives considered**: None - standard is well-established.

### D4: Offline Detection - Online/Offline Events

**Decision**: Use window.online/window.offline events with navigator.onLine check.
**Rationale**: Simple, reliable, and widely supported. No external dependencies.
**Alternatives considered**: Custom ping (rejected - unnecessary complexity).

### D5: Background Sync - Workbox Background Sync

**Decision**: Use Workbox background sync for queuing actions when offline.
**Rationale**: Built into Workbox, handles retry logic and connectivity detection.
**Alternatives considered**: Custom queue (rejected - reinventing wheel).

## Risks / Trade-offs

**[Risk] Service worker registration fails on some browsers** → Mitigation: Feature detection and graceful degradation. Site works without service worker.

**[Risk] Cached data becomes stale** → Mitigation: Stale-while-revalidate updates cache in background. Cache expiration headers on critical data.

**[Risk] Offline UI confusing for users** → Mitigation: Clear messaging with "You're offline" banner and retry button.

**[Risk] Background sync drains battery** → Mitigation: Only sync when on WiFi (navigator.connection.effectiveType check).

## Migration Plan

1. Add service worker registration script to base template
2. Create workbox-config.js for asset precaching
3. Add PWA manifest.json and icons
4. Implement offline detection and UI
5. Add background sync for exercise completion
6. Test on mobile devices with airplane mode
7. Deploy with feature flag for gradual rollout

## Open Questions

- Should we cache calculator results for offline use? (Complexity vs benefit)
- How to handle large periodic table 3D assets? (Cache vs lazy-load)
- Should offline mode be opt-in or always-on?
