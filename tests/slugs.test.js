/**
 * Unit tests for the canonical slug utility (myhugoapp/static/js/utils/slugs.js).
 * The IIFE assigns globalThis.Slugs when required in Node.
 */
const path = require('path');

const SLUGS_PATH = path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'utils', 'slugs.js');
require(SLUGS_PATH); // executes IIFE in Node context

const { slugify, entityUrl, rawSlug } = globalThis.Slugs;

describe('Slugs.slugify', () => {
  it('transliterates German umlauts the established way', () => {
    expect(slugify('Essigsäure')).toBe('essigsaeure');
    expect(slugify('Hämoglobin')).toBe('haemoglobin');
    expect(slugify('Größe')).toBe('groesse');
    expect(slugify('Übersäuerung')).toBe('uebersaeuerung');
    expect(slugify('Säure-Base-Reaktion')).toBe('saeure-base-reaktion');
  });

  it('strips general diacritics via NFD', () => {
    expect(slugify('Hall-Héroult-Prozess')).toBe('hall-heroult-prozess');
    expect(slugify('Déjà-vu')).toBe('deja-vu');
  });

  it('maps subscript digits to plain digits', () => {
    expect(slugify('Fe₂O₃')).toBe('fe2o3');
    expect(slugify('H₂O')).toBe('h2o');
  });

  it('normalizes punctuation, spaces and separators to single dashes', () => {
    expect(slugify('Gilbert N. Lewis')).toBe('gilbert-n-lewis');
    expect(slugify('Eisen (I)')).toBe('eisen-i');
    expect(slugify('pH-Wert')).toBe('ph-wert');
    expect(slugify('Säure + Base')).toBe('saeure-base');
    expect(slugify('  doppelt--Leerzeichen  ')).toBe('doppelt-leerzeichen');
  });

  it('matches the previous generator slugs for ASCII names (zero churn)', () => {
    // Corpus taken from the live API: names with plain ASCII digits, parens, dashes
    expect(slugify('Eisen(III)-oxid (Fe2O3)')).toBe('eisen-iii-oxid-fe2o3');
    expect(slugify('Kohlendioxid (CO2)')).toBe('kohlendioxid-co2');
    expect(slugify('Aluminiumoxid (Al2O3)')).toBe('aluminiumoxid-al2o3');
    expect(slugify('Kaliumdichromat (K2Cr2O7)')).toBe('kaliumdichromat-k2cr2o7');
  });

  it('is idempotent', () => {
    const names = [
      'Essigsäure',
      'Fe₂O₃',
      'Gilbert N. Lewis',
      'pH-Wert',
      'Größe',
      'Eisen(III)-oxid (Fe2O3)',
      'Hall-Héroult-Prozess',
    ];
    for (const n of names) expect(slugify(slugify(n))).toBe(slugify(n));
  });

  it('handles null/empty input without throwing', () => {
    expect(slugify(null)).toBe('');
    expect(slugify('')).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('Slugs.entityUrl', () => {
  it('builds canonical entity URLs', () => {
    expect(entityUrl('Essigsäure')).toBe('/entity/essigsaeure/');
    expect(entityUrl('Kohlendioxid (CO₂)')).toBe('/entity/kohlendioxid-co2/');
  });
});

describe('Slugs.rawSlug (legacy umlaut aliases)', () => {
  it('keeps umlauts, replaces only spaces/punctuation', () => {
    expect(rawSlug('Essigsäure')).toBe('essigsäure');
    expect(rawSlug('Hämoglobin')).toBe('hämoglobin');
    expect(rawSlug('Martin-Luther-Universität Halle-Wittenberg')).toBe(
      'martin-luther-universität-halle-wittenberg'
    );
  });
});
