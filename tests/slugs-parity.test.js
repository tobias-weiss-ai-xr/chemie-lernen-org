/**
 * Parity: the Node ESM mirror must expose the exact same functions as the
 * browser module (same underlying implementation, same references).
 */
const path = require('path');

const BROWSER_PATH = path.resolve(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'js',
  'utils',
  'slugs.js'
);
require(BROWSER_PATH);

const CORPUS = [
  'Essigsäure',
  'Hämoglobin',
  'Größe',
  'Übersäuerung',
  'Hall-Héroult-Prozess',
  'Fe₂O₃',
  'H₂O',
  'Gilbert N. Lewis',
  'Eisen (I)',
  'pH-Wert',
  'Martin-Luther-Universität Halle-Wittenberg',
  'Kohlendioxid (CO₂)',
  'Aminosäuren',
  'Benzoesäure',
  'Weinsäure',
  'Hydrathülle',
  'Luftstabilität',
  'Eisen(III)-oxid (Fe2O3)',
  'Kaliumdichromat (K2Cr2O7)',
  'Säure-Base-Reaktion',
];

describe('Slugs parity (browser ⇄ Node mirror)', () => {
  it('mirror exposes the identical function references', async () => {
    const mirror = await import('../scripts/lib/slugs.mjs');
    expect(mirror.slugify).toBe(globalThis.Slugs.slugify);
    expect(mirror.entityUrl).toBe(globalThis.Slugs.entityUrl);
    expect(mirror.rawSlug).toBe(globalThis.Slugs.rawSlug);
    expect(typeof mirror.Slugs).toBe('object');
  });

  it('mirror output matches browser module over real-name corpus', async () => {
    const mirror = await import('../scripts/lib/slugs.mjs');
    for (const name of CORPUS) {
      expect(mirror.slugify(name)).toBe(globalThis.Slugs.slugify(name));
      expect(mirror.rawSlug(name)).toBe(globalThis.Slugs.rawSlug(name));
      expect(mirror.entityUrl(name)).toBe(globalThis.Slugs.entityUrl(name));
    }
  });

  it('parity corpus canonical slugs match the previously dead links', async () => {
    const mirror = await import('../scripts/lib/slugs.mjs');
    // The 17 umlaut + 3 special-character legacy URLs, canonicalized:
    expect(mirror.slugify('Aminosäuren')).toBe('aminosaeuren');
    expect(mirror.slugify('Hydrathülle')).toBe('hydrathuelle');
    expect(mirror.slugify('Gilbert N. Lewis')).toBe('gilbert-n-lewis');
    expect(mirror.slugify('Eisen(III)-oxid (Fe2O3)')).toBe('eisen-iii-oxid-fe2o3');
  });
});
