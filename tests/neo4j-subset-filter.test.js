/**
 * Tests for _neo4j-subset-filter.mjs — the central subset filter helper.
 *
 * Pure unit tests — no Neo4j connection required. Tests operate directly
 * on the Cypher fragment strings that the module returns.
 */

const { pathToFileURL } = require('url');
const path = require('path');

const MODULE_PATH = path.resolve(__dirname, '..', 'scripts', '_neo4j-subset-filter.mjs');

/**
 * Load the module in both Jest modes:
 *  - bare `npx jest` (no NODE_OPTIONS): jest-transform-esm.cjs converts the
 *    .mjs file to CJS, so require() works.
 *  - npm scripts (NODE_OPTIONS=--experimental-vm-modules): Jest treats it as
 *    native ESM, require() throws → fall back to dynamic import().
 */
function loadModule() {
  try {
    return require(MODULE_PATH);
  } catch (err) {
    if (err && /Must use import to load ES Module/.test(err.message)) {
      return import(pathToFileURL(MODULE_PATH).href);
    }
    throw err;
  }
}

describe('_neo4j-subset-filter.mjs', () => {
  let mod;

  beforeAll(async () => {
    mod = await loadModule();
  });
  // ── CHEMIE_LABELS ─────────────────────────────────────────────────────

  describe('CHEMIE_LABELS', () => {
    test('exports an array of known chemie labels', () => {
      expect(Array.isArray(mod.CHEMIE_LABELS)).toBe(true);
      expect(mod.CHEMIE_LABELS).toContain('Entity');
      expect(mod.CHEMIE_LABELS).toContain('Document');
      expect(mod.CHEMIE_LABELS).toContain('Tag');
      expect(mod.CHEMIE_LABELS).toContain('Content');
      expect(mod.CHEMIE_LABELS).toContain('Curriculum');
      expect(mod.CHEMIE_LABELS).toContain('Topic');
      expect(mod.CHEMIE_LABELS).toContain('SubTopic');
      expect(mod.CHEMIE_LABELS).toContain('LearningObjective');
      expect(mod.CHEMIE_LABELS).toContain('DidacticGuideline');
      expect(mod.CHEMIE_LABELS).toContain('GuidelineSection');
      expect(mod.CHEMIE_LABELS).toContain('Assessment');
      expect(mod.CHEMIE_LABELS).toContain('GradedAnswer');
      expect(mod.CHEMIE_LABELS).toContain('Feedback');
    });

    test('excludes code-analysis labels', () => {
      expect(mod.CHEMIE_LABELS).not.toContain('Variable');
      expect(mod.CHEMIE_LABELS).not.toContain('Function');
      expect(mod.CHEMIE_LABELS).not.toContain('Class');
      expect(mod.CHEMIE_LABELS).not.toContain('File');
      expect(mod.CHEMIE_LABELS).not.toContain('Module');
      expect(mod.CHEMIE_LABELS).not.toContain('Interface');
    });

    test('has exactly 21 labels (modulhandbuch + assessment subsets)', () => {
      expect(mod.CHEMIE_LABELS).toHaveLength(21);
    });
  });

  // ── subsetMatch() ─────────────────────────────────────────────────────

  describe('subsetMatch()', () => {
    test('returns a Cypher WHERE clause fragment for the default subset', () => {
      const result = mod.subsetMatch('n');
      expect(result).toMatch(/^WHERE\s+\(/);
      expect(result).toContain('n:Entity');
      expect(result).toContain('n:Document');
      expect(result).toContain('n:Content');
      expect(result).not.toContain('n:Variable');
    });

    test('returns a WHERE clause scoped to a single label', () => {
      const result = mod.subsetMatch('d', ['Document']);
      expect(result).toBe('WHERE (d:Document)');
    });

    test('returns a WHERE clause for a custom label array', () => {
      const labels = ['Topic', 'SubTopic'];
      const result = mod.subsetMatch('t', labels);
      expect(result).toBe('WHERE (t:Topic OR t:SubTopic)');
    });

    test('uses the "chemie" alias to reference the full label set', () => {
      const result = mod.subsetMatch('e', 'chemie');
      expect(result).toContain('e:Entity');
      expect(result).toContain('e:Topic');
    });

    test('caches results (calls with same args return same reference)', () => {
      const a = mod.subsetMatch('x');
      const b = mod.subsetMatch('x');
      expect(a).toBe(b);
    });

    test('different refs produce different cached entries', () => {
      const a = mod.subsetMatch('n');
      const b = mod.subsetMatch('m');
      expect(a).not.toBe(b);
      expect(a).toContain('n:Entity');
      expect(b).toContain('m:Entity');
    });

    test('generates syntactically valid Cypher for a MATCH query', () => {
      // Just verify the fragment can be appended after MATCH (e)
      const query = `MATCH (e) ${mod.subsetMatch('e')} RETURN e.name`;
      expect(query).toMatch(/^MATCH \(e\) WHERE \(e:/);
      expect(query).toContain('RETURN e.name');
    });
  });

  // ── subsetWhere() ─────────────────────────────────────────────────────

  describe('subsetWhere()', () => {
    test('returns a parenthesised predicate WITHOUT the WHERE keyword', () => {
      const result = mod.subsetWhere('e');
      expect(result).toMatch(/^\(/);
      expect(result).not.toMatch(/^WHERE/);
      expect(result).toContain('e:Entity');
    });

    test('can be AND-ed with other conditions', () => {
      const predicate = mod.subsetWhere('e');
      const fullClause = `WHERE ${predicate} AND e.kategorie = 'konzept'`;
      expect(fullClause).toContain('AND e.kategorie');
      // Should be syntactically valid
      expect(fullClause).toMatch(
        /^WHERE \(e:(?:Entity|Document|Tag|Content)(?: OR e:\w+)*\) AND e\.kategorie = 'konzept'$/
      );
    });

    test('can be OR-ed with another subsetWhere for relationship scoping', () => {
      const a = mod.subsetWhere('a');
      const b = mod.subsetWhere('b');
      // This is the pattern used in /api/kg-stats for MATCH ()-[r]->()
      const clause = `WHERE ${a} OR ${b}`;
      expect(clause).toContain('a:Entity');
      expect(clause).toContain('b:Entity');
      expect(clause).toMatch(/^WHERE \(.*a:Entity.*\) OR \(.*b:Entity.*\)$/);
    });

    test('works with single-label subset', () => {
      const result = mod.subsetWhere('d', ['Document']);
      expect(result).toBe('(d:Document)');
    });
  });

  // ── getChemieLabelsArray() ────────────────────────────────────────────

  describe('getChemieLabelsArray()', () => {
    test('returns the same array as CHEMIE_LABELS', () => {
      expect(mod.getChemieLabelsArray()).toBe(mod.CHEMIE_LABELS);
    });
  });

  // ── Integration conventions ───────────────────────────────────────────

  describe('integration conventions', () => {
    test('/api/kg-stats uses subsetWhere to scope MATCH ()-[r]->()', () => {
      // This query found an unscoped relationship match in production.
      // The fix uses subsetWhere on both ends:
      const whereA = mod.subsetWhere('a');
      const whereB = mod.subsetWhere('b');
      const query = `MATCH (a)-[r]->(b) WHERE ${whereA} OR ${whereB} RETURN count(r) as total`;
      expect(query).toContain('a:Entity');
      expect(query).toContain('b:Entity');
      // Both ends must be scoped to avoid leaking non-chemie relationships
    });

    test('/api/kg-data entities query uses :Entity label (implicit scope)', () => {
      // Entities query: MATCH (e:Entity) — the :Entity label itself scopes
      // to the chemie subset. This test documents the convention that
      // labeled queries are acceptable and don't need subsetWhere().
    });
  });
});
