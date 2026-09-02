/**
 * tests/entity-links.test.js — UXF-011: Entity-Slug-Auflösung
 */
const { slugify, resolveEntityUrl } = require('../myhugoapp/static/js/utils/entity-links.js');

describe('entity-links.slugify (Fallback ohne globalThis.Slugs)', () => {
  test('Umlaute werden transliteriert', () => {
    expect(slugify('Essigsäure')).toBe('essigsaeure');
    expect(slugify('Ökologie')).toBe('oekologie');
    expect(slugify('Grüne Algen')).toBe('gruene-algen');
  });

  test('Sonderzeichen werden zu Bindestrichen', () => {
    expect(slugify('Natrium (Na+!)')).toBe('natrium-na');
    expect(slugify('  --Wasser--  ')).toBe('wasser');
  });

  test('leer/null-sicher', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('entity-links.resolveEntityUrl (UXF-011)', () => {
  const slugs = ['essigsaeure', 'wasser', 'aktivierungsenergie'];

  test('existierende Entity → /entity/-URL', () => {
    expect(resolveEntityUrl('Essigsäure', slugs)).toBe('/entity/essigsaeure/');
    expect(resolveEntityUrl('wasser', slugs)).toBe('/entity/wasser/');
  });

  test('nicht existierende Entity → Pagefind-Suche (kein 404-Risiko)', () => {
    const url = resolveEntityUrl('BW-gymnasium-343-saeure-base-gleichgewichte', slugs);
    expect(url).not.toContain('/entity/');
    expect(url).toContain('/pages/suche/?q=');
    expect(url).toContain(encodeURIComponent('BW-gymnasium-343-saeure-base-gleichgewichte'));
  });

  test('funktioniert auch mit Set', () => {
    expect(resolveEntityUrl('Wasser', new Set(slugs))).toBe('/entity/wasser/');
  });

  test('leeres Manifest (offline) → immer Suche', () => {
    expect(resolveEntityUrl('Wasser', [])).toContain('/pages/suche/?q=');
    expect(resolveEntityUrl('Wasser', undefined)).toContain('/pages/suche/?q=');
  });

  test('Umlaut-Name ohne Seiten → Suche mit Umlauten (Suche versteht sie)', () => {
    const url = resolveEntityUrl('Essigsäure', []);
    expect(url).toContain(encodeURIComponent('Essigsäure'));
  });
});
