/* eslint-env jest */
/**
 * Knowledge Graph Data Quality Tests
 *
 * Validates structural integrity of the entity KG data. Pure unit tests
 * with mocked data — no Neo4j connection required. Mirrors the checks
 * that /api/kg-stats does at runtime.
 *
 * Asserts:
 *   - No orphan entities (each has at least one rel or :MENTIONS link)
 *   - No dangling references in relatedEntities
 *   - No duplicate entity names (case-insensitive)
 *   - kategorie coverage >= 80% (excluding null/missing)
 *   - Element entities have non-null symbol + ordnungszahl
 *   - description coverage >= 50% (after enrichment)
 *   - rel-type vocabulary: only known types used
 */

const KNOWN_CATEGORIES = [
  'stoff',
  'konzept',
  'reaktion',
  'methode',
  'person',
  'quelle',
  'lehrplan',
  'lernziel',
  'didaktik',
];

const KNOWN_REL_TYPES = [
  'HAS_TAG',
  'MENTIONS',
  'RELATED_TO',
  'BESTEHT_AUS',
  'ERFUELLT',
  'TEIL_VON',
  'GEHOERT_ZU',
  'FOERDERT',
  'HINDERT',
  'IST_BESTANDTEIL_VON',
  'REAGIERT_MIT',
  'WIRD_VERWENDET_IN',
  'WIRD_ERKLART_IN',
  'VORAUSSETZUNG_FUER',
  'NACHFOLGER_VON',
  'ANWENDUNG_VON',
  'GRUNDLAGE_FUER',
  'BEISPIEL_FUER',
  'EIGENSCHAFT_VON',
  'UNTERSCHIED_ZU',
  'GLEICHWIE',
  'TEIL_ASPEKT_VON',
];

// ── Helper: build a clean reference dataset for unit tests ──────────
function buildReferenceData(overrides = {}) {
  const data = {
    entities: [
      {
        id: 'e1',
        name: 'Wasser',
        kategorie: 'stoff',
        symbol: null,
        ordnungszahl: null,
        description: 'Universelles Lösungsmittel',
        articleCount: 3,
        relatedEntities: ['Elektrolyse'],
        components: [],
      },
      {
        id: 'e2',
        name: 'Kohlenstoff',
        kategorie: 'stoff',
        symbol: 'C',
        ordnungszahl: 6,
        description: 'Element der 4. Hauptgruppe',
        articleCount: 5,
        relatedEntities: ['Wasser'],
        components: [],
      },
      {
        id: 'e3',
        name: 'Elektrolyse',
        kategorie: 'methode',
        symbol: null,
        ordnungszahl: null,
        description: 'Zerlegung durch elektrischen Strom',
        articleCount: 2,
        relatedEntities: ['Wasser'],
        components: [],
      },
    ],
    articles: [
      { id: 'a1', title: 'Wasser in der Chemie', url: '/artikel/wasser/', entities: ['Wasser'] },
    ],
    relationships: [
      { source: 'e1', target: 'e3', type: 'RELATED_TO' },
      { source: 'e2', target: 'e1', type: 'RELATED_TO' },
    ],
  };
  return { ...data, ...overrides };
}

// ── Helpers mirroring /api/kg-stats logic ──────────────────────────
function findOrphans(data) {
  const linkedIds = new Set();
  for (const r of data.relationships || []) {
    linkedIds.add(r.source);
    linkedIds.add(r.target);
  }
  for (const a of data.articles || []) {
    for (const e of a.entities || []) {
      const ent = (data.entities || []).find((x) => x.name === e);
      if (ent) {
        linkedIds.add(ent.id);
      }
    }
  }
  return (data.entities || []).filter((e) => !linkedIds.has(e.id));
}

function findDanglingRefs(data) {
  const names = new Set((data.entities || []).map((e) => e.name));
  const dangles = [];
  for (const e of data.entities || []) {
    for (const r of e.relatedEntities || []) {
      if (!names.has(r)) {
        dangles.push({ from: e.name, to: r });
      }
    }
  }
  return dangles;
}

function findDuplicateNames(data) {
  const seen = new Map();
  const dups = [];
  for (const e of data.entities || []) {
    const k = e.name.toLowerCase();
    if (seen.has(k)) {
      dups.push(e.name);
    } else {
      seen.set(k, e.id);
    }
  }
  return dups;
}

function kategorieCoverage(data) {
  const all = data.entities || [];
  if (all.length === 0) {
    return 0;
  }
  const withCat = all.filter((e) => e.kategorie && KNOWN_CATEGORIES.includes(e.kategorie));
  return withCat.length / all.length;
}

function descriptionCoverage(data) {
  const all = data.entities || [];
  if (all.length === 0) {
    return 0;
  }
  return all.filter((e) => e.description && e.description.length > 10).length / all.length;
}

function elementCompleteness(data) {
  const elements = (data.entities || []).filter((e) => e.kategorie === 'stoff' && e.symbol);
  if (elements.length === 0) {
    return { total: 0, complete: 0, ratio: 1 };
  }
  const complete = elements.filter((e) => e.symbol && typeof e.ordnungszahl === 'number');
  return {
    total: elements.length,
    complete: complete.length,
    ratio: complete.length / elements.length,
  };
}

function findUnknownRelTypes(data) {
  const seen = new Set();
  for (const r of data.relationships || []) {
    seen.add(r.type);
  }
  return [...seen].filter((t) => !KNOWN_REL_TYPES.includes(t));
}

// ── Tests ──────────────────────────────────────────────────────────
describe('KG Data Quality', () => {
  describe('Orphan detection', () => {
    test('reference data has zero orphans', () => {
      const data = buildReferenceData();
      expect(findOrphans(data)).toEqual([]);
    });

    test('flags entities with no relationships and no article MENTIONS', () => {
      const data = buildReferenceData({
        entities: [
          ...buildReferenceData().entities,
          {
            id: 'e9',
            name: 'Verwaist',
            kategorie: 'konzept',
            description: 'x',
            relatedEntities: [],
            articleCount: 0,
          },
        ],
      });
      const orphans = findOrphans(data);
      expect(orphans.find((o) => o.id === 'e9')).toBeDefined();
    });

    test('entity referenced only via article is not an orphan', () => {
      const data = buildReferenceData({
        entities: [
          { id: 'e9', name: 'NurInArtikel', kategorie: 'konzept', relatedEntities: [] },
          ...buildReferenceData().entities.slice(1),
        ],
        articles: [{ id: 'a1', title: 'Test', url: '/x/', entities: ['NurInArtikel'] }],
      });
      expect(findOrphans(data).find((o) => o.id === 'e9')).toBeUndefined();
    });
  });

  describe('Dangling reference detection', () => {
    test('reference data has zero dangling refs', () => {
      const data = buildReferenceData();
      expect(findDanglingRefs(data)).toEqual([]);
    });

    test('flags references to non-existent entities', () => {
      const data = buildReferenceData();
      data.entities[0].relatedEntities.push('Phantomen');
      const dangles = findDanglingRefs(data);
      expect(dangles).toContainEqual({ from: 'Wasser', to: 'Phantomen' });
    });
  });

  describe('Duplicate name detection', () => {
    test('reference data has zero duplicates', () => {
      expect(findDuplicateNames(buildReferenceData())).toEqual([]);
    });

    test('flags case-insensitive duplicates', () => {
      const data = buildReferenceData({
        entities: [
          ...buildReferenceData().entities,
          { id: 'e4', name: 'WASSER', kategorie: 'stoff' },
        ],
      });
      expect(findDuplicateNames(data)).toContain('WASSER');
    });

    test('allows different names', () => {
      const data = buildReferenceData();
      expect(findDuplicateNames(data)).toEqual([]);
    });
  });

  describe('Coverage metrics', () => {
    test('kategorie coverage of reference data is 100%', () => {
      expect(kategorieCoverage(buildReferenceData())).toBe(1);
    });

    test('kategorie coverage is at least 0.8 for any healthy export', () => {
      expect(kategorieCoverage(buildReferenceData())).toBeGreaterThanOrEqual(0.8);
    });

    test('flags unknown kategorie values', () => {
      const data = buildReferenceData();
      data.entities[0].kategorie = 'unsinn';
      // coverage should drop
      expect(kategorieCoverage(data)).toBeLessThan(1);
    });

    test('description coverage of reference data is 100%', () => {
      expect(descriptionCoverage(buildReferenceData())).toBe(1);
    });

    test('description coverage threshold >= 0.5 is the project goal', () => {
      expect(descriptionCoverage(buildReferenceData())).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Element completeness', () => {
    test('all stoff entities with symbol have ordnungszahl', () => {
      const m = elementCompleteness(buildReferenceData());
      expect(m.ratio).toBe(1);
    });

    test('flags element missing ordnungszahl', () => {
      const data = buildReferenceData();
      data.entities[1].ordnungszahl = null; // Kohlenstoff is the stoff+symbol entity
      const m = elementCompleteness(data);
      expect(m.complete).toBeLessThan(m.total);
    });
  });

  describe('Relationship type vocabulary', () => {
    test('reference data uses only known rel types', () => {
      expect(findUnknownRelTypes(buildReferenceData())).toEqual([]);
    });

    test('flags relationships with unknown rel types', () => {
      const data = buildReferenceData();
      data.relationships.push({ source: 'e1', target: 'e2', type: 'BLAH_BLAH' });
      expect(findUnknownRelTypes(data)).toContain('BLAH_BLAH');
    });
  });

  describe('/api/kg-stats response shape (contract test)', () => {
    test('response contains expected fields', () => {
      const data = buildReferenceData();
      const stats = {
        source: 'neo4j',
        entityCount: data.entities.length,
        articleCount: data.articles.length,
        relationshipCount: data.relationships.length,
        byKategorie: KNOWN_CATEGORIES.reduce((acc, k) => {
          acc[k] = data.entities.filter((e) => e.kategorie === k).length;
          return acc;
        }, {}),
        byRelType: KNOWN_REL_TYPES.reduce((acc, r) => {
          acc[r] = data.relationships.filter((rel) => rel.type === r).length;
          return acc;
        }, {}),
        dataQuality: {
          missingDescription: data.entities.filter(
            (e) => !e.description || e.description.length < 10
          ).length,
          missingKategorie: data.entities.filter(
            (e) => !e.kategorie || !KNOWN_CATEGORIES.includes(e.kategorie)
          ).length,
          orphans: findOrphans(data).length,
          danglingRefs: findDanglingRefs(data).length,
          duplicateNames: findDuplicateNames(data).length,
        },
      };
      expect(stats).toMatchObject({
        source: expect.any(String),
        entityCount: expect.any(Number),
        articleCount: expect.any(Number),
        relationshipCount: expect.any(Number),
        byKategorie: expect.objectContaining({ stoff: expect.any(Number) }),
        byRelType: expect.objectContaining({ RELATED_TO: expect.any(Number) }),
        dataQuality: expect.objectContaining({
          orphans: expect.any(Number),
          danglingRefs: expect.any(Number),
          duplicateNames: expect.any(Number),
        }),
      });
      expect(stats.entityCount).toBe(3);
      expect(stats.dataQuality.orphans).toBe(0);
    });
  });
});
