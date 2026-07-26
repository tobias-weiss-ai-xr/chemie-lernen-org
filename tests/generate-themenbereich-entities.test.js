/**
 * Tests for generate-themenbereich-entities.mjs
 *
 * Covers the entity → Themenbereich keyword-mapping logic:
 *   - scoreEntity weighting (name 3 > relatedEntities 2 > description 1)
 *   - case-insensitive substring matching
 *   - inclusion threshold (score >= 2)
 *   - best-match assignment across all 13 Themenbereiche (12 + tipps-tricks)
 *   - keyword map integrity
 *
 * The script's main() is guarded (isMain) so importing it here does NOT
 * touch the filesystem or rewrite the output JSON.
 */
const { pathToFileURL } = require('url');
const path = require('path');

const SCRIPT_PATH = path.resolve(__dirname, '..', 'scripts/generate-themenbereich-entities.mjs');
const SCRIPT_URL = pathToFileURL(SCRIPT_PATH).href;

let _mod = null;
async function loadModule() {
  if (_mod) return _mod;
  _mod = await import(SCRIPT_URL);
  return _mod;
}

describe('generate-themenbereich-entities — scoreEntity weighting', () => {
  let scoreEntity;
  let THEMENBEREICHE_KEYWORDS;

  beforeAll(async () => {
    const mod = await loadModule();
    scoreEntity = mod.scoreEntity;
    THEMENBEREICHE_KEYWORDS = mod.THEMENBEREICHE_KEYWORDS;
  });

  test('name match contributes 3 points per keyword', () => {
    const kws = THEMENBEREICHE_KEYWORDS['saeuren-basen'].keywords;
    const score = scoreEntity({ title: 'Säure', description: '', relatedEntities: [] }, kws);
    expect(score).toBeGreaterThanOrEqual(3);
  });

  test('description match contributes 1 point per keyword (no name hit)', () => {
    const kws = THEMENBEREICHE_KEYWORDS['saeuren-basen'].keywords;
    const score = scoreEntity(
      { title: 'Sonstiges', description: 'Eine starke Säure', relatedEntities: [] },
      kws
    );
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThan(3);
  });

  test('relatedEntities match contributes 2 points per keyword', () => {
    const kws = THEMENBEREICHE_KEYWORDS['saeuren-basen'].keywords;
    const score = scoreEntity({ title: 'X', description: '', relatedEntities: ['Titration'] }, kws);
    expect(score).toBeGreaterThanOrEqual(2);
  });

  test('no keyword overlap scores 0', () => {
    const kws = THEMENBEREICHE_KEYWORDS['saeuren-basen'].keywords;
    const score = scoreEntity(
      { title: 'Ganz Anderes', description: 'nichts passendes hier', relatedEntities: ['xyz'] },
      kws
    );
    expect(score).toBe(0);
  });

  test('matching is case-insensitive', () => {
    const kws = THEMENBEREICHE_KEYWORDS['saeuren-basen'].keywords;
    const upper = scoreEntity({ title: 'SÄURE', description: '', relatedEntities: [] }, kws);
    const lower = scoreEntity({ title: 'säure', description: '', relatedEntities: [] }, kws);
    expect(upper).toBe(lower);
    expect(upper).toBeGreaterThanOrEqual(3);
  });
});

describe('generate-themenbereich-entities — entity→Themenbereich mapping', () => {
  let scoreEntity;
  let THEMENBEREICHE_KEYWORDS;

  beforeAll(async () => {
    const mod = await loadModule();
    scoreEntity = mod.scoreEntity;
    THEMENBEREICHE_KEYWORDS = mod.THEMENBEREICHE_KEYWORDS;
  });

  // Replicates the script's decision: an entity is included in a Themenbereich
  // when its score >= 2, and assigned to its single best-scoring area.
  function bestThemenbereich(entity) {
    let best = null;
    let bestScore = 0;
    for (const [slug, data] of Object.entries(THEMENBEREICHE_KEYWORDS)) {
      const s = scoreEntity(entity, data.keywords);
      if (s > bestScore) {
        bestScore = s;
        best = slug;
      }
    }
    return bestScore >= 2 ? best : null;
  }

  test('Säure-Base entity maps to saeuren-basen', () => {
    const e = {
      title: 'Säure-Base-Reaktion',
      description: 'Neutralisation und pH-Wert',
      relatedEntities: ['Titration', 'Puffer'],
    };
    expect(bestThemenbereich(e)).toBe('saeuren-basen');
  });

  test('atom/electron entity maps to aufbau-materie', () => {
    const e = {
      title: 'Atombau',
      description: 'Elektronen, Protonen, Orbital',
      relatedEntities: ['Elektronenkonfiguration'],
    };
    expect(bestThemenbereich(e)).toBe('aufbau-materie');
  });

  test('enzyme/protein entity maps to biochemie', () => {
    const e = {
      title: 'Enzyme',
      description: 'Biokatalyse durch Proteine',
      relatedEntities: ['DNA', 'Aminosäure'],
    };
    expect(bestThemenbereich(e)).toBe('biochemie');
  });

  test('alkane entity maps to erdoel-organische-stoffklassen', () => {
    const e = {
      title: 'Alkane',
      description: 'Gesättigte Kohlenwasserstoffe',
      relatedEntities: ['Benzol'],
    };
    expect(bestThemenbereich(e)).toBe('erdoel-organische-stoffklassen');
  });

  test('weak / no-match entity is excluded (best score < 2)', () => {
    const e = { title: 'Sonstiges', description: '', relatedEntities: [] };
    expect(bestThemenbereich(e)).toBeNull();
  });
});

describe('generate-themenbereich-entities — keyword map integrity', () => {
  let THEMENBEREICHE_KEYWORDS;

  beforeAll(async () => {
    const mod = await loadModule();
    THEMENBEREICHE_KEYWORDS = mod.THEMENBEREICHE_KEYWORDS;
  });

  test('covers all 13 Themenbereiche (12 + tipps-tricks)', () => {
    const slugs = Object.keys(THEMENBEREICHE_KEYWORDS);
    expect(slugs).toHaveLength(13);
    expect(slugs).toContain('einfuehrung-chemie');
    expect(slugs).toContain('biochemie');
    expect(slugs).toContain('tipps-tricks');
  });

  test('every Themenbereich has a display name and non-empty lowercase keywords', () => {
    for (const data of Object.values(THEMENBEREICHE_KEYWORDS)) {
      expect(typeof data.name).toBe('string');
      expect(data.name.length).toBeGreaterThan(0);
      expect(Array.isArray(data.keywords)).toBe(true);
      expect(data.keywords.length).toBeGreaterThan(0);
      // keywords must already be lowercase for the case-insensitive includes() to match
      for (const kw of data.keywords) {
        expect(kw).toBe(kw.toLowerCase());
      }
    }
  });
});
