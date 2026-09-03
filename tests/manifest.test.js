/**
 * manifest.test.js — Jest unit tests for PWA + chemie-räume manifests.
 *
 * Covers:
 *   A. Hugo PWA manifest (myhugoapp/static/site.webmanifest) is valid + complete.
 *   B. generate-chemie-raeume-manifest.mjs produces a well-formed manifest
 *      that deep-links into the GitHub Pages periodic-table rooms (run
 *      against an isolated fixture manifest).
 *   C. The committed chemie-räume manifest (if present) matches the schema
 *      and contains no deprecated Hubs fields.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SITE_MANIFEST = path.join(REPO_ROOT, 'myhugoapp/static/site.webmanifest');
const RAEUME_MANIFEST = path.join(REPO_ROOT, 'myhugoapp/static/data/chemie-raeume-manifest.json');
const GENERATOR = path.join(REPO_ROOT, 'scripts/generate-chemie-raeume-manifest.mjs');

describe('Hugo PWA manifest (site.webmanifest)', () => {
  test('exists and is valid JSON with required PWA fields', () => {
    expect(fs.existsSync(SITE_MANIFEST)).toBe(true);
    const raw = fs.readFileSync(SITE_MANIFEST, 'utf8');
    let m;
    expect(() => {
      m = JSON.parse(raw);
    }).not.toThrow();

    for (const field of ['name', 'short_name', 'start_url', 'display', 'icons']) {
      expect(m).toHaveProperty(field);
    }
    expect(Array.isArray(m.icons)).toBe(true);
    expect(m.icons.length).toBeGreaterThanOrEqual(1);
    expect(m.icons[0]).toHaveProperty('src');
    expect(typeof m.lang === 'string' && m.lang.toLowerCase().startsWith('de')).toBe(true);
  });

  test('declares a German locale and standalone display', () => {
    const m = JSON.parse(fs.readFileSync(SITE_MANIFEST, 'utf8'));
    expect(m.display).toBe('standalone');
    expect(m.lang).toMatch(/de/i);
  });
});

describe('chemie-raeume manifest generator', () => {
  test('emits well-formed periodic-table room URLs from a fixture manifest', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'raeume-fixture-'));
    const inJson = path.join(tmp, 'in.json');
    const outJson = path.join(tmp, 'out.json');

    // Minimal shape of the committed manifest (metadata source).
    // 'Xx' is intentionally unknown to exercise the main-room fallback.
    fs.writeFileSync(
      inJson,
      JSON.stringify({
        generatedAt: '2026-01-01T00:00:00.000Z',
        count: 3,
        elements: [
          {
            symbol: 'He',
            name: 'Helium',
            group: 'nobleGas',
            period: 1,
            groupNumber: 18,
            theme: 'purple',
          },
          {
            symbol: 'Xx',
            name: 'Unbekannt',
            group: 'metal',
            period: null,
            groupNumber: null,
            theme: '',
          },
          {
            symbol: 'H',
            name: 'Wasserstoff',
            group: 'nonmetal',
            period: 1,
            groupNumber: 1,
            theme: 'green',
            // Legacy fields must be stripped by the generator.
            roomUrl: 'https://chemie-lernen.org/hello-webxr/?room=H',
            hubRoomUrl: 'https://hubs.chemie-lernen.org/abc/chemie-raum',
            hubId: 'abc123',
          },
        ],
      })
    );

    const env = {
      ...process.env,
      ROOMS_BASE_URL: 'https://tobias-weiss-ai-xr.github.io/periodic-table',
    };
    execFileSync('node', [GENERATOR, inJson, outJson], { env, stdio: 'pipe' });

    expect(fs.existsSync(outJson)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(outJson, 'utf8'));

    expect(manifest).toHaveProperty('elements');
    expect(Array.isArray(manifest.elements)).toBe(true);
    expect(manifest.elements).toHaveLength(3);
    expect(manifest.count).toBe(3);
    expect(manifest.roomsBaseUrl).toBe('https://tobias-weiss-ai-xr.github.io/periodic-table');

    const h = manifest.elements.find((e) => e.symbol === 'H');
    expect(h).toBeDefined();
    expect(h.name).toBe('Wasserstoff');
    expect(h.roomUrl).toBe(
      'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/001-hydrogen.html'
    );
    // Legacy Hubs fields are stripped
    expect(h).not.toHaveProperty('hubRoomUrl');
    expect(h).not.toHaveProperty('hubId');

    const he = manifest.elements.find((e) => e.symbol === 'He');
    expect(he.roomUrl).toBe(
      'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/002-helium.html'
    );

    // Unknown symbol falls back to the main room
    const xx = manifest.elements.find((e) => e.symbol === 'Xx');
    expect(xx.roomUrl).toBe('https://tobias-weiss-ai-xr.github.io/periodic-table/');

    // Deterministic, sorted output
    expect(manifest.elements.map((e) => e.symbol)).toEqual(['H', 'He', 'Xx']);

    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('committed chemie-raeume manifest (if present)', () => {
  test('matches the expected schema and carries no deprecated Hubs fields', () => {
    if (!fs.existsSync(RAEUME_MANIFEST)) {
      // Generated at build/deploy time; absence is non-fatal for unit tests.
      return;
    }
    const m = JSON.parse(fs.readFileSync(RAEUME_MANIFEST, 'utf8'));
    expect(m).toHaveProperty('elements');
    expect(Array.isArray(m.elements)).toBe(true);
    if (m.elements.length === 0) return;
    const e = m.elements[0];
    for (const f of ['symbol', 'name', 'roomUrl']) {
      expect(e).toHaveProperty(f);
    }
    // Hubs is no longer advertised — no element may link to it.
    expect(e).not.toHaveProperty('hubRoomUrl');
    expect(e).not.toHaveProperty('hubId');
    for (const el of m.elements) {
      expect(el.roomUrl || '').not.toContain('hubs.chemie-lernen.org');
    }
  });
});
