/**
 * Unit tests for the Wissensnetz hub (myhugoapp/static/js/wissennetz-hub.js).
 *
 * The module is a browser IIFE over `window`/`document`/`fetch`; we execute it
 * with stubs via `new Function` and assert on the pure helpers it exposes.
 * No DOM required (getElementById returns null → init() no-ops).
 */
/* eslint-disable sonarjs/code-eval */
const path = require('path');
const fs = require('fs');

const HUB_SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'wissennetz-hub.js'),
  'utf8'
);

function loadHub() {
  const fn = new Function(
    'window',
    'document',
    'fetch',
    HUB_SRC + '\nreturn window.WissennetzHub;'
  );
  return fn({ WissennetzHub: undefined }, { getElementById: () => null }, () =>
    Promise.reject(new Error('no fetch in tests'))
  );
}

const ASSIGN_DATA = {
  entities: [
    { name: 'Zink', category: 'stoff', relatedEntities: [], components: [], articleCount: 1 },
    {
      name: 'Esterbildung',
      category: 'reaktion',
      relatedEntities: [],
      components: [],
      articleCount: 0,
    },
    {
      name: 'Aktivierungsenergie',
      category: 'konzept',
      relatedEntities: [],
      components: [],
      articleCount: 0,
    },
    {
      name: 'Calvin-Zyklus',
      category: 'reaktion',
      relatedEntities: [],
      components: [],
      articleCount: 0,
    },
    {
      name: '  Zellspannung  ',
      category: 'konzept',
      relatedEntities: [],
      components: [],
      articleCount: 0,
    },
  ],
  articles: [
    {
      title: 'Spannungsreihe',
      url: 'https://chemie-lernen.org/themenbereiche/redox-elektrochemie/spannungsreihe/',
      entities: ['Zink', 'Zellspannung'],
    },
  ],
};

describe('WissennetzHub.sectionsFromArticles', () => {
  let hub;
  beforeAll(() => {
    hub = loadHub();
  });

  it('extracts entity → section from article URLs (first article wins)', () => {
    const map = hub.sectionsFromArticles(ASSIGN_DATA.articles);
    expect(map['Zink']).toBe('redox-elektrochemie');
    expect(map['Zellspannung']).toBe('redox-elektrochemie');
    expect(Object.keys(map)).toHaveLength(2);
  });

  it('ignores articles without a themenbereiche URL', () => {
    const map = hub.sectionsFromArticles([
      { title: 'X', url: 'https://chemie-lernen.org/artikel/x/', entities: ['Zink'] },
    ]);
    expect(map).toEqual({});
  });
});

describe('WissennetzHub.assignEntitiesToSections', () => {
  let hub;
  beforeAll(() => {
    hub = loadHub();
  });

  it('priority 1: article-URL sections win for their entities', () => {
    const articleSections = hub.sectionsFromArticles(ASSIGN_DATA.articles);
    const map = hub.assignEntitiesToSections(ASSIGN_DATA.entities, articleSections, {});
    expect(map['Zink']).toBe('redox-elektrochemie');
    expect(map['Zellspannung']).toBe('redox-elektrochemie');
  });

  it('priority 2: keyword overlap fills the rest (best score wins)', () => {
    const articleSections = hub.sectionsFromArticles(ASSIGN_DATA.articles);
    const keywords = {
      'erdoel-organische-stoffklassen': ['ester', 'fett'],
      'gleichgewicht-geschwindigkeit': ['energie', 'geschwindigkeit'],
      biochemie: ['zyklus', 'calvin'],
    };
    const map = hub.assignEntitiesToSections(ASSIGN_DATA.entities, articleSections, keywords);
    expect(map['Esterbildung']).toBe('erdoel-organische-stoffklassen');
    expect(map['Aktivierungsenergie']).toBe('gleichgewicht-geschwindigkeit');
  });

  it('priority 1.5: periodic-table elements route to Aufbau der Materie (exact match only)', () => {
    const map = hub.assignEntitiesToSections(
      [{ name: 'Schwefel' }, { name: 'Schwefelwasserstoff (H2S)' }],
      {},
      hub.SECTION_KEYWORDS
    );
    expect(map['Schwefel']).toBe('aufbau-materie');
    expect(map['Schwefelwasserstoff (H2S)']).toBe('anorganische-verbindungen');
  });

  it('normalizes accents (é→e) for keyword matching', () => {
    const map = hub.assignEntitiesToSections(
      [{ name: 'hall-héroult-prozess' }],
      {},
      hub.SECTION_KEYWORDS
    );
    expect(map['hall-héroult-prozess']).toBe('anorganische-verbindungen');
  });

  it('priority 3: unmatched entities land in the fallback bucket', () => {
    const map = hub.assignEntitiesToSections(ASSIGN_DATA.entities, {}, {});
    expect(map['Calvin-Zyklus']).toBe('weitere-begriffe');
  });

  it('does not mutate names and handles leading/trailing spaces', () => {
    const articleSections = { Zellspannung: 'redox-elektrochemie' };
    const map = hub.assignEntitiesToSections(ASSIGN_DATA.entities, articleSections, {});
    expect(Object.keys(map).includes('Zellspannung')).toBe(true);
    expect(Object.keys(map).includes('  Zellspannung  ')).toBe(false);
  });
});

describe('WissennetzHub.sectionCounts', () => {
  let hub;
  beforeAll(() => {
    hub = loadHub();
  });

  it('counts concepts per section and totals', () => {
    const map = {
      Zink: 'redox-elektrochemie',
      'Calvin-Zyklus': 'weitere-begriffe',
      Esterbildung: 'erdoel-organische-stoffklassen',
    };
    const counts = hub.sectionCounts(Object.keys(map), (name) => map[name]);
    expect(counts.total).toBe(3);
    expect(counts.bySection['redox-elektrochemie']).toBe(1);
    expect(counts.bySection['weitere-begriffe']).toBe(1);
  });
});

describe('WissennetzHub.buildPortalHtml', () => {
  let hub;
  beforeAll(() => {
    hub = loadHub();
  });

  it('renders cards in Lernpfad order with German label + concept count', () => {
    const bySection = { 'saeuren-basen': 4, 'redox-elektrochemie': 2 };
    const html = hub.buildPortalHtml(bySection, ['saeuren-basen', 'redox-elektrochemie']);
    expect(html.indexOf('saeuren-basen')).toBeLessThan(html.indexOf('redox-elektrochemie'));
    expect(html).toContain('Säuren und Basen');
    expect(html).toContain('data-count="4"');
    expect(html).toContain('/themenbereiche/saeuren-basen/');
  });

  it('renders the fallback bucket card last', () => {
    const bySection = { 'weitere-begriffe': 7 };
    const html = hub.buildPortalHtml(bySection, ['weitere-begriffe']);
    expect(html).toContain('Weitere Begriffe');
    expect(html).toContain('data-count="7"');
  });

  it('marks the active section', () => {
    const html = hub.buildPortalHtml({ energetik: 3 }, ['energetik'], 'energetik');
    expect(html).toContain('is-active');
  });
});

describe('WissennetzHub.buildSearchResults', () => {
  let hub;
  beforeAll(() => {
    hub = loadHub();
  });

  it('ranks prefix matches before substring matches (case-insensitive)', () => {
    const hits = hub.buildSearchResults('säure', [
      { name: 'Base' },
      { name: 'Essigsäure' },
      { name: 'Säure-Base-Reaktion' },
    ]);
    expect(hits[0]).toBe('Säure-Base-Reaktion');
    expect(hits).toContain('Essigsäure');
    expect(hits).not.toContain('Base');
  });

  it('trims names and matches across umlauts via simple lowercase', () => {
    const hits = hub.buildSearchResults('  SAEURE', [{ name: ' Säurexes ' }]);
    expect(hits).toEqual(['Säurexes']);
  });

  it('returns [] for empty query', () => {
    expect(hub.buildSearchResults('', [{ name: 'X' }])).toEqual([]);
    expect(hub.buildSearchResults('   ', [{ name: 'X' }])).toEqual([]);
  });
});
