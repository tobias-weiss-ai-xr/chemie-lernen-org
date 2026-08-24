/**
 * manifest.test.js — Jest unit tests for PWA + chemie-räume manifests.
 *
 * Covers:
 *   A. Hugo PWA manifest (myhugoapp/static/site.webmanifest) is valid + complete.
 *   B. generate-chemie-raeume-manifest.mjs produces a well-formed manifest
 *      (run against an isolated fixture so the test does not depend on the
 *      external hello-webxr ELEMENTS_SRC being present).
 *   C. The committed chemie-räume manifest (if present) matches the schema.
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
  test('emits a well-formed manifest from a fixture ELEMENTS source', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'raeume-fixture-'));
    const elementsSrc = path.join(tmp, 'elements.ts');
    const outJson = path.join(tmp, 'out.json');

    // Minimal shape matching hello-webxr's data/elements.ts parser contract.
    fs.writeFileSync(
      elementsSrc,
      `export const ELEMENTS = [
  {
    symbol: 'H',
    name: 'Wasserstoff',
    group: 'nonmetal',
    period: 1,
    groupNumber: 1,
    theme: 'green',
  },
  {
    symbol: 'He',
    name: 'Helium',
    group: 'nobleGas',
    period: 1,
    groupNumber: 18,
    theme: 'purple',
  },
];
export const EXPERIMENTAL_ROOMS = [];
`
    );

    const env = { ...process.env, APP_BASE_URL: 'https://chemie-lernen.org/hello-webxr' };
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- running the local generator via node is intentional
    execFileSync('node', [GENERATOR, elementsSrc, outJson], { env, stdio: 'pipe' });

    expect(fs.existsSync(outJson)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(outJson, 'utf8'));

    expect(manifest).toHaveProperty('elements');
    expect(Array.isArray(manifest.elements)).toBe(true);
    expect(manifest.elements).toHaveLength(2);
    expect(manifest.count).toBe(2);

    const h = manifest.elements.find((e) => e.symbol === 'H');
    expect(h).toBeDefined();
    expect(h.name).toBe('Wasserstoff');
    expect(h.roomUrl).toBe('https://chemie-lernen.org/hello-webxr/?room=H');
    expect(h.hubRoomUrl).toBeNull();

    // Deterministic, sorted output
    expect(manifest.elements.map((e) => e.symbol)).toEqual(['H', 'He']);

    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('committed chemie-raeume manifest (if present)', () => {
  test('matches the expected schema', () => {
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
  });
});
