/**
 * Vitest setup — polyfills and globals that Jest provided by default.
 *
 * Key issue: Vitest's jsdom creates an isolated VM context (via vm.runInContext)
 * for <script> elements. The VM context's global is dom.window, NOT globalThis.
 *
 * Problem 1: fetch/Response/Request set on globalThis are NOT visible to scripts
 *   executed via <script> elements. We must set them on window (dom.window).
 *
 * Problem 2: In Vitest's jsdom, document.createElement('script') + appendChild
 *   does NOT execute scripts synchronously (jsdom queues execution). Many tests
 *   rely on synchronous script execution (IIFE pattern that sets window.X).
 *   Fix: patch Element.prototype.appendChild to detect <script> elements with
 *   textContent and execute them synchronously via window.eval.
 *
 * Problem 3: vi.stubGlobal auto-restores after each test, so we re-inject fetch
 *   in beforeEach.
 */

import { vi, beforeEach, afterAll } from 'vitest';

// ── fetch polyfill ──
const defaultFetch = async (url, opts = {}) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    headers: new Map(),
    clone: function () { return this; },
  };
};

// Response polyfill
class MockResponse {
  constructor(body, opts = {}) {
    this.body = body;
    this.status = opts.status || 200;
    this.ok = this.status < 400;
    this.headers = opts.headers || new Map();
  }
  async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body; }
  async text() { return typeof this.body === 'string' ? this.body : JSON.stringify(this.body); }
  clone() { return new MockResponse(this.body, { status: this.status, headers: this.headers }); }
}

// Request polyfill
class MockRequest {
  constructor(url, opts = {}) {
    this.url = url;
    this.method = opts.method || 'GET';
    this.headers = opts.headers || new Map();
    this.body = opts.body;
  }
  clone() { return new MockRequest(this.url, { method: this.method, headers: this.headers, body: this.body }); }
}

// Set on global/globalThis (Node.js context — for eval'd code and direct calls)
// Only set if not already available (Node.js 18+ has built-in fetch).
// Tests that make real HTTP requests to a test server need the real fetch,
// not a mock. The mock fetch always returns 200, which breaks HTTP tests.
if (typeof global !== 'undefined') {
  if (typeof global.fetch === 'undefined') global.fetch = defaultFetch;
  if (typeof global.Response === 'undefined') global.Response = MockResponse;
  if (typeof global.Request === 'undefined') global.Request = MockRequest;
}
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.fetch === 'undefined') globalThis.fetch = defaultFetch;
  if (typeof globalThis.Response === 'undefined') globalThis.Response = MockResponse;
  if (typeof globalThis.Request === 'undefined') globalThis.Request = MockRequest;
}

// Set on window (jsdom VM context — for <script> elements executed via vm.runInContext)
// In jsdom, fetch is not available by default, so we always set it here.
if (typeof window !== 'undefined') {
  window.fetch = defaultFetch;
  window.Response = MockResponse;
  window.Request = MockRequest;
}

// ── Patch appendChild for synchronous <script> execution ──
// In Vitest's jsdom, document.createElement('script') + appendChild does NOT
// execute scripts synchronously. Many test files use this pattern to load IIFE
// modules that set window globals. We patch appendChild to detect <script>
// elements with textContent and execute them immediately via window.eval, then
// clear textContent to prevent jsdom's internal async re-execution (which runs
// in a VM context where fetch/Response etc. may not be defined).
//
// This is a compatibility shim, not a full HTML script execution implementation.
// It handles the common pattern: script.textContent = src; document.body.appendChild(script);
//
// Only patch when Element is available (jsdom environment). In Node environment
// (@vitest-environment node), Element is not defined.
const _originalAppendChild = typeof Element !== 'undefined' ? Element.prototype.appendChild : null;
if (_originalAppendChild) {
  Element.prototype.appendChild = function patchedAppendChild(child) {
    // Detect script elements with inline text content
    if (
      child &&
      child.tagName === 'SCRIPT' &&
      child.textContent &&
      child.textContent.length > 0 &&
      !child.hasAttribute('src')
    ) {
      const code = child.textContent;
      // Clear textContent to prevent jsdom's internal async re-execution
      // (which runs in a VM context where fetch may not be defined)
      child.textContent = '';
      try {
        // Execute the script synchronously in the jsdom VM context via window.eval
        window.eval(code);
      } catch (e) {
        console.error('[setup.mjs] Script execution error:', e.message);
      }
    }
    // Call the original appendChild to maintain DOM structure
    return _originalAppendChild.call(this, child);
  };
}

// Re-inject fetch/Response/Request onto window before each test.
// vi.stubGlobal auto-restores after each test, and jsdom may reset window.
beforeEach(() => {
  if (typeof window !== 'undefined') {
    if (typeof window.fetch === 'undefined') {
      window.fetch = defaultFetch;
    }
    if (typeof window.Response === 'undefined') {
      window.Response = MockResponse;
    }
    if (typeof window.Request === 'undefined') {
      window.Request = MockRequest;
    }
  }
});

// Restore original appendChild after all tests (only if we patched it)
afterAll(() => {
  if (_originalAppendChild && typeof Element !== 'undefined') {
    Element.prototype.appendChild = _originalAppendChild;
  }
});
