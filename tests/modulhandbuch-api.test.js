/**
 * Modulhandbuch API and Data Integrity Tests
 *
 * Validates that the modulhandbuch subset of the Neo4j KG is internally
 * consistent: required labels exist, key relationships are wired,
 * no orphaned nodes, and the JSON data files conform to schema.
 *
 * Neo4j-requiring tests are guarded by describe('integration', ...)
 * so they can be skipped with --testPathIgnorePatterns if Neo4j is
 * unavailable.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'myhugoapp', 'data', 'modulhandbuch');

// Known university short_codes from the scraper registry
const KNOWN_UNIVERSITIES = [
  'caltech',
  'cam',
  'eth',
  'fu_berlin',
  'heid',
  'icl',
  'kth',
  'lmu',
  'mit',
  'oxf',
  'rwth',
  'stanf',
  'tu_wien',
  'tum',
  'utokyo',
];

// Module fields required by spec REQ-MH-5
const REQUIRED_MODULE_FIELDS = ['module_code', 'module_name', 'ects', 'language', 'level'];

const OPTIONAL_MODULE_FIELDS = [
  'degree',
  'url',
  'learning_outcomes',
  'content',
  'examination',
  'offerings',
  'last_checked',
];

describe('JSON data file schema validation', () => {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));

  test('has expected number of JSON files', () => {
    // Each of 15 universities should have a JSON file
    // (all except didaktik which lives in data/didaktik/)
    expect(files).toHaveLength(15);
  });

  test('each known university has a JSON file', () => {
    const basenames = files.map((f) => path.basename(f, '.json'));
    for (const uni of KNOWN_UNIVERSITIES) {
      expect(basenames).toContain(uni);
    }
  });

  describe.each(files)('schema: %s', (file) => {
    let catalog;

    beforeAll(() => {
      catalog = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    });

    test('has university object with short_code and name', () => {
      expect(catalog.university).toBeDefined();
      expect(typeof catalog.university.short_code).toBe('string');
      expect(catalog.university.short_code.length).toBeGreaterThan(0);
      expect(typeof catalog.university.name).toBe('string');
      expect(catalog.university.name.length).toBeGreaterThan(0);
    });

    test('has degrees array with correct shape', () => {
      expect(Array.isArray(catalog.degrees)).toBe(true);
      if (catalog.degrees.length > 0) {
        for (const deg of catalog.degrees) {
          expect(typeof deg.name).toBe('string');
          expect(deg.name.length).toBeGreaterThan(0);
          expect(['BSc', 'MSc', 'PhD', '', undefined]).toContain(deg.level);
        }
      }
    });

    test('has modules array with required fields', () => {
      expect(Array.isArray(catalog.modules)).toBe(true);
      for (const mod of catalog.modules) {
        for (const field of REQUIRED_MODULE_FIELDS) {
          expect(mod[field]).toBeDefined();
        }
        expect(typeof mod.module_code).toBe('string');
        expect(mod.module_code.length).toBeGreaterThan(0);
        expect(typeof mod.module_name).toBe('string');
        expect(mod.module_name.length).toBeGreaterThan(0);
        expect(typeof mod.ects).toBe('number');
        expect(mod.ects).toBeGreaterThanOrEqual(0);
      }
    });

    test('modules have valid level values', () => {
      const validLevels = ['BSc', 'MSc', 'PhD', 'BSc/MSc', 'MSc/PhD'];
      for (const mod of catalog.modules) {
        if (mod.level) {
          expect(validLevels).toContain(mod.level);
        }
      }
    });

    test('module fields have correct types', () => {
      if (catalog.modules.length === 0) return;
      const m = catalog.modules[0];
      if (m.learning_outcomes) {
        expect(Array.isArray(m.learning_outcomes)).toBe(true);
      }
      if (m.content) {
        expect(Array.isArray(m.content)).toBe(true);
      }
    });
  });
});

/**
 * Check if Neo4j is reachable by trying to open a brief connection.
 * Allows the describeApi guard below to skip integration tests when
 * the database is not running (CI / local dev without Docker).
 */
function isNeo4jReachable() {
  try {
    const neo4j = require('neo4j-driver');
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
    const d = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 3000,
      maxConnectionLifetime: 5000,
    });
    return d
      .verifyConnectivity()
      .then(function () {
        return d.close().then(function () {
          return true;
        });
      })
      .catch(function () {
        return d
          .close()
          .then(function () {
            return false;
          })
          .catch(function () {
            return false;
          });
      });
  } catch (_e) {
    return Promise.resolve(false);
  }
}

const NEO4J_REACHABLE = 'NEO4J_REACHABLE';
let _neo4jReachable = null;

/**
 * Wraps a describe block so it only runs when Neo4j is reachable.
 * Usage: describeApi('name', () => { ... }) in place of describe.
 */
function describeApi(name, fn) {
  const runIf = process.env.API_RUNNING === '1' || process.env.CI === 'true';
  if (runIf) {
    // eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
    describe(name, fn);
    return;
  }
  if (_neo4jReachable === null) {
    _neo4jReachable = false;
    beforeAll(async function () {
      _neo4jReachable = await isNeo4jReachable();
      if (_neo4jReachable) process.env[NEO4J_REACHABLE] = '1';
    });
  }
  const describeFn =
    _neo4jReachable === null ? describe.skip : _neo4jReachable ? describe : describe.skip;
  describeFn(name, fn);
}

describeApi('Neo4j data integrity (integration)', () => {
  let driver;

  beforeAll(() => {
    const neo4j = require('neo4j-driver');
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 10000,
      maxConnectionLifetime: 60000,
    });
  });

  afterAll(async () => {
    if (driver) await driver.close();
  });

  test('University nodes exist for known short_codes (case-insensitive)', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run('MATCH (u:University) RETURN toLower(u.short_code) AS code');
      const found = r.records.map((rec) => rec.get('code'));
      for (const code of KNOWN_UNIVERSITIES) {
        expect(found).toContain(code);
      }
      expect(found.length).toBeGreaterThanOrEqual(KNOWN_UNIVERSITIES.length - 2);
    } finally {
      await s.close();
    }
  });

  test('UniversityModule nodes linked to University via :OFFERS', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (u:University)-[:OFFERS]->(m:UniversityModule)
         RETURN u.short_code AS uni, count(m) AS cnt
         ORDER BY cnt DESC`
      );
      expect(r.records.length).toBeGreaterThanOrEqual(10);
      const total = r.records.reduce((sum, rec) => sum + Number(rec.get('cnt')), 0);
      expect(total).toBeGreaterThanOrEqual(450);
    } finally {
      await s.close();
    }
  });

  test('UniversityModule has :CARRIES → :ECTS relationship', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run('MATCH (m:UniversityModule)-[:CARRIES]->(e:ECTS) RETURN count(*) AS c');
      const count = Number(r.records[0].get('c'));
      expect(count).toBeGreaterThanOrEqual(450);
    } finally {
      await s.close();
    }
  });

  test('Degree nodes exist with valid levels', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(`MATCH (d:Degree) RETURN d.level AS level, count(*) AS cnt`);
      const levels = r.records.map((rec) => rec.get('level'));
      // Should have at least BSc and MSc level degrees
      expect(levels).toContain('BSc');
      expect(levels).toContain('MSc');
    } finally {
      await s.close();
    }
  });

  test(':TEACHES relationships exist from modules to entities', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        'MATCH (m:UniversityModule)-[:TEACHES]->(e:Entity) RETURN count(*) AS c'
      );
      const count = Number(r.records[0].get('c'));
      expect(count).toBeGreaterThanOrEqual(50);
    } finally {
      await s.close();
    }
  });

  test(':TEACHES targets are real Entity nodes (no dangling refs)', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (m:UniversityModule)-[t:TEACHES]->(e:Entity)
         WITH e, count(m) AS mods
         WHERE e.name IS NULL
         RETURN count(*) AS c`
      );
      expect(Number(r.records[0].get('c'))).toBe(0);
    } finally {
      await s.close();
    }
  });

  test('University response shape — short_code, name, country present', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (u:University) RETURN u.short_code AS short_code,
         u.name AS name, u.country AS country LIMIT 1`
      );
      expect(r.records).toHaveLength(1);
      const u = r.records[0].toObject();
      expect(typeof u.short_code).toBe('string');
      expect(u.short_code.length).toBeGreaterThan(0);
      expect(typeof u.name).toBe('string');
      expect(u.name.length).toBeGreaterThan(0);
      expect(typeof u.country).toBe('string');
    } finally {
      await s.close();
    }
  });

  test('Module search response shape — module_code, university present', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (m:UniversityModule)
         WHERE toLower(m.module_name) CONTAINS 'chemie'
         RETURN m.module_code AS module_code, m.university AS university
         LIMIT 5`
      );
      expect(r.records.length).toBeGreaterThan(0);
      for (const rec of r.records) {
        const obj = rec.toObject();
        expect(typeof obj.module_code).toBe('string');
        expect(typeof obj.university).toBe('string');
      }
    } finally {
      await s.close();
    }
  });

  test('All UniversityModules have a non-empty module_name', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (m:UniversityModule)
         WHERE m.module_name IS NULL OR m.module_name = ''
         RETURN count(*) AS c`
      );
      expect(Number(r.records[0].get('c'))).toBe(0);
    } finally {
      await s.close();
    }
  });

  test('All UniversityModules have positive or zero ECTS', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (m:UniversityModule)
         WHERE m.ects < 0
         RETURN count(*) AS c`
      );
      expect(Number(r.records[0].get('c'))).toBe(0);
    } finally {
      await s.close();
    }
  });

  test('All University nodes have non-empty city and country', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (u:University)
         WHERE u.city IS NULL OR u.city = '' OR u.country IS NULL OR u.country = ''
         RETURN count(*) AS c`
      );
      expect(Number(r.records[0].get('c'))).toBe(0);
    } finally {
      await s.close();
    }
  });

  test('TEACHES coverage — at least 10% of UniversityModules link to an Entity', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (m:UniversityModule)
         OPTIONAL MATCH (m)-[:TEACHES]->(e:Entity)
         WITH m, count(e) AS links
         RETURN
           count(m) AS total,
           sum(CASE WHEN links > 0 THEN 1 ELSE 0 END) AS linked
        `
      );
      const total = Number(r.records[0].get('total'));
      const linked = Number(r.records[0].get('linked'));
      expect(linked / total).toBeGreaterThanOrEqual(0.1);
    } finally {
      await s.close();
    }
  });

  test('TEACHES audit — report linked vs total modules per university', async () => {
    const s = driver.session({ database: 'chemie' });
    try {
      const r = await s.run(
        `MATCH (u:University)-[:OFFERS]->(m:UniversityModule)
         OPTIONAL MATCH (m)-[t:TEACHES]->(e:Entity)
         WITH u, count(DISTINCT m) AS totalMods, count(DISTINCT t) AS totalTeaches, count(DISTINCT e) AS distinctEntities
         RETURN u.short_code AS uni, u.name AS name,
                totalMods, totalTeaches, distinctEntities
         ORDER BY totalTeaches DESC`
      );
      console.log('\n=== TEACHES Audit Report ===');
      let totalMods = 0,
        totalTeaches = 0;
      for (const rec of r.records) {
        const tm = Number(rec.get('totalMods'));
        const tt = Number(rec.get('totalTeaches'));
        const de = Number(rec.get('distinctEntities'));
        totalMods += tm;
        totalTeaches += tt;
        console.log(
          `  ${String(rec.get('uni')).padEnd(10)} ${String(rec.get('name')).padEnd(35)} ` +
            `${String(tm).padStart(4)} modules, ${String(tt).padStart(4)} teaches → ${String(de).padStart(2)} entities`
        );
      }
      console.log(`  ${'─'.repeat(80)}`);
      console.log(`  TOTAL: ${totalMods} modules, ${totalTeaches} TEACHES links`);
      expect(totalMods).toBeGreaterThanOrEqual(450);
      expect(totalTeaches).toBeGreaterThanOrEqual(50);
    } finally {
      await s.close();
    }
  });
});
