/**
 * Part B Task 4 — curricula mapper: query builder + pure record mapper.
 */
const {
  buildByStateQuery,
  mapCurriculumTopics,
  OBJECTIVES_CAP,
  ENTITIES_CAP,
} = require('../api/curricula-mapper.cjs');

function rec(values) {
  return { get: (k) => values[k] };
}

describe('buildByStateQuery (Part B Task 4)', () => {
  test('matches both COVERS_TOPIC directions', () => {
    const q = buildByStateQuery();
    expect(q).toMatch(/COVERS_TOPIC.*e:Entity/);
    expect(q).toMatch(/\(t\)<-\[:COVERS_TOPIC\]/);
    expect(q).toMatch(/\(t\)-\[:COVERS_TOPIC\]->/);
  });

  test('collects objectives and entities distinctly, filters nulls', () => {
    const q = buildByStateQuery();
    expect(q).toMatch(/collect\(DISTINCT lo\.text\) AS objectives/);
    expect(q).toMatch(/collect\(DISTINCT e\.name\)/);
    expect(q).toMatch(/WHERE ob IS NOT NULL/);
    expect(q).toMatch(/WHERE en IS NOT NULL/);
  });
});

describe('mapCurriculumTopics (Part B Task 4)', () => {
  const rows = [
    rec({
      slug: 'saeure-base-grundlagen',
      title: 'Säure-Base-Grundlagen',
      grade: 10,
      schoolType: 'Gymnasium',
      objectiveCount: 12,
      objectives: Array.from({ length: 12 }, (_, i) => 'Lernziel ' + i),
      entities: ['Säure', 'Base', 'pH-Wert', 'Säure', 'Indikator', 'Wasser', 'Base'],
    }),
    rec({
      slug: 'leer-thema',
      title: 'Leeres Thema',
      grade: 11,
      schoolType: 'Gymnasium',
      objectiveCount: 0,
      objectives: [],
      entities: null,
    }),
  ];

  test('caps objectives at 8 (didactic pass)', () => {
    const [first] = mapCurriculumTopics(rows);
    expect(first.objectives).toHaveLength(8);
    expect(first.objectiveCount).toBe(12); // full count stays available
  });

  test('caps entities at 12 and de-duplicates names', () => {
    const [first] = mapCurriculumTopics(rows);
    expect(first.entityCount).toBe(5);
    expect(first.entities).toHaveLength(5); // Säure, Base, pH-Wert, Indikator, Wasser (deduped)
    expect(first.entities).toEqual(['Säure', 'Base', 'pH-Wert', 'Indikator', 'Wasser']);
    expect(first.entities.length).toBeLessThanOrEqual(ENTITIES_CAP);
  });

  test('handles null/empty entity lists gracefully', () => {
    const [, second] = mapCurriculumTopics(rows);
    expect(second.entityCount).toBe(0);
    expect(second.entities).toEqual([]);
    expect(second.objectives).toEqual([]);
  });

  test('accepts plain objects without .get()', () => {
    const mapped = mapCurriculumTopics([
      {
        slug: 'x',
        title: 'X',
        grade: 9,
        schoolType: 'S',
        objectiveCount: 1,
        objectives: ['a'],
        entities: ['E'],
      },
    ]);
    expect(mapped[0].entities).toEqual(['E']);
  });

  test('handles neo4j Integer objectiveCount via .toNumber()', () => {
    const mapped = mapCurriculumTopics([
      rec({
        slug: 'y',
        title: 'Y',
        grade: 9,
        schoolType: 'S',
        objectiveCount: { toNumber: () => 42 },
        objectives: [],
        entities: [],
      }),
    ]);
    expect(mapped[0].objectiveCount).toBe(42);
  });

  test('keeps topic order and shape stable', () => {
    const mapped = mapCurriculumTopics(rows);
    expect(mapped).toHaveLength(2);
    expect(Object.keys(mapped[0])).toEqual([
      'slug',
      'title',
      'grade',
      'schoolType',
      'objectiveCount',
      'objectives',
      'entityCount',
      'entities',
    ]);
  });
});

describe('isTextMatchCandidate — stopword/abbreviation filter', () => {
  const { isTextMatchCandidate } = require('../api/curricula-mapper.cjs');

  test('keeps meaningful concept names (word-boundary candidates)', () => {
    expect(isTextMatchCandidate('Zink')).toBe(true);
    expect(isTextMatchCandidate('TEM')).toBe(true);
    expect(isTextMatchCandidate('Polyethylen (PE)')).toBe(true);
  });

  test('rejects function words and empty/short names', () => {
    expect(isTextMatchCandidate('mit')).toBe(false);
    expect(isTextMatchCandidate('MIT')).toBe(false);
    expect(isTextMatchCandidate('und')).toBe(false);
    expect(isTextMatchCandidate('Fe')).toBe(false);
    expect(isTextMatchCandidate('  ')).toBe(false);
    expect(isTextMatchCandidate('')).toBe(false);
    expect(isTextMatchCandidate(null)).toBe(false);
  });
});
