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
const http = require('http');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'myhugoapp', 'data', 'modulhandbuch');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Known university short_codes from the scraper registry
// (old-format files — new-format files use combined state-based naming: by, nw, bw)
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

// Sprint-35 scraper files use the new format (university as string, state field, id/name/credits)
const NEW_FORMAT_FILES = new Set([
  'bw-freiburg.json',
  'bw-heidelberg.json',
  'bw.json',
  'by-lmu.json',
  'by-tum.json',
  'by.json',
  'nw-koeln.json',
  'nw-muenster.json',
  'nw.json',
]);

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

  test('has expected number of JSON files (old + new format)', () => {
    // 15 old-format + 9 new-format Sprint-35 scraper files = 24
    expect(files).toHaveLength(24);
  });

  test('each known university has a JSON file', () => {
    const basenames = files.map((f) => path.basename(f, '.json'));
    for (const uni of KNOWN_UNIVERSITIES) {
      expect(basenames).toContain(uni);
    }
  });

  /**
   * Detect whether a catalog uses the new Sprint-35 format
   * (university is a string, has a state field).
   */
  function isNewFormat(catalog) {
    return typeof catalog.university === 'string' || catalog.state;
  }

  describe.each(files)('schema: %s', (file) => {
    let catalog;
    let newFmt;

    beforeAll(() => {
      catalog = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      newFmt = isNewFormat(catalog);
    });

    test('has university defined (object or string)', () => {
      expect(catalog.university).toBeDefined();
      if (newFmt) {
        expect(typeof catalog.university).toBe('string');
        expect(catalog.university.length).toBeGreaterThan(0);
      } else {
        expect(typeof catalog.university.short_code).toBe('string');
        expect(catalog.university.short_code.length).toBeGreaterThan(0);
        expect(typeof catalog.university.name).toBe('string');
        expect(catalog.university.name.length).toBeGreaterThan(0);
      }
    });

    test('has degrees array with correct shape (old format) or absent (new format)', () => {
      if (newFmt) {
        // New format scraper files may not have degrees at the top level
        expect(catalog.degrees).toBeUndefined();
      } else {
        expect(Array.isArray(catalog.degrees)).toBe(true);
        if (catalog.degrees.length > 0) {
          for (const deg of catalog.degrees) {
            expect(typeof deg.name).toBe('string');
            expect(deg.name.length).toBeGreaterThan(0);
            expect(['BSc', 'MSc', 'PhD', '', undefined]).toContain(deg.level);
          }
        }
      }
    });

    test('has modules array with required fields (old or new format)', () => {
      expect(Array.isArray(catalog.modules)).toBe(true);
      for (const mod of catalog.modules) {
        if (newFmt) {
          // New format: id, name, credits
          expect(typeof (mod.id || mod.module_code)).toBe('string');
          expect((mod.id || mod.module_code).length).toBeGreaterThan(0);
          expect(typeof (mod.name || mod.module_name)).toBe('string');
          expect((mod.name || mod.module_name).length).toBeGreaterThan(0);
          expect(typeof (mod.credits || mod.ects)).toBe('number');
          expect(mod.credits || mod.ects).toBeGreaterThanOrEqual(0);
        } else {
          // Old format: module_code, module_name, ects
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
      }
    });

    test('modules have valid level values (old format) or optional type (new format)', () => {
      const validLevels = ['BSc', 'MSc', 'PhD', 'BSc/MSc', 'MSc/PhD'];
      for (const mod of catalog.modules) {
        if (newFmt) {
          // New format uses 'type' field (e.g. 'Vorlesung', 'Praktikum') instead of 'level'
          if (mod.type) {
            expect(typeof mod.type).toBe('string');
          }
        } else if (mod.level) {
          expect(validLevels).toContain(mod.level);
        }
      }
    });

    test('module fields have correct types', () => {
      if (catalog.modules.length === 0) return;
      const m = catalog.modules[0];
      if (newFmt) {
        if (m.topics) expect(Array.isArray(m.topics)).toBe(true);
        if (m.description) expect(typeof m.description).toBe('string');
      } else {
        if (m.learning_outcomes) {
          expect(Array.isArray(m.learning_outcomes)).toBe(true);
        }
        if (m.content) {
          expect(Array.isArray(m.content)).toBe(true);
        }
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
  const runIf = process.env.API_RUNNING === '1';
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

// ── Helper: verify the API server is responding at the base URL ─────────────

function isApiReachable() {
  return new Promise(function (resolve) {
    const url = new URL('/api/modulhandbuch/universities', API_BASE_URL);
    const req = http.get(url, function (res) {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', function () {
      resolve(false);
    });
    req.setTimeout(3000, function () {
      req.destroy();
      resolve(false);
    });
  });
}

let _apiReachable = null;

/**
 * Guard: only runs the describe block when the API server is reachable
 * (either explicitly via API_RUNNING=1, CI=true, or by probing the
 * /api/modulhandbuch/universities endpoint). This wraps describe()
 * so that tests that hit the HTTP API are skipped when the server
 * is not running.
 */
function describeApiEndpoint(name, fn) {
  const runIf = process.env.API_RUNNING === '1';
  if (runIf) {
    // eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
    describe(name, fn);
    return;
  }
  if (_apiReachable === null) {
    _apiReachable = false;
    beforeAll(async function () {
      _apiReachable = await isApiReachable();
    });
  }
  const describeFn =
    _apiReachable === null ? describe.skip : _apiReachable ? describe : describe.skip;
  describeFn(name, fn);
}

// ── HTTP helper for GET requests ────────────────────────────────────────────

function getJson(url) {
  return new Promise(function (resolve, reject) {
    http
      .get(url, function (res) {
        let data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (err) {
            resolve({ status: res.statusCode, data: null, raw: data });
          }
        });
      })
      .on('error', reject);
  });
}

// ── /api/studienvergleich/compare endpoint tests ────────────────────────────

describeApiEndpoint('GET /api/studienvergleich/compare', function () {
  const COMPARE_URL = API_BASE_URL + '/api/studienvergleich/compare';

  test('returns 400 when u1 or u2 params are missing', async function () {
    const r1 = await getJson(COMPARE_URL + '?u1=LMU');
    expect(r1.status).toBe(400);
    expect(r1.data).toHaveProperty('error');
    expect(typeof r1.data.error).toBe('string');

    const r2 = await getJson(COMPARE_URL + '?u2=TUM');
    expect(r2.status).toBe(400);

    const r3 = await getJson(COMPARE_URL);
    expect(r3.status).toBe(400);
  });

  test('returns expected JSON structure for valid universities', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM');
    expect(r.status).toBe(200);
    expect(r.data).toHaveProperty('source', 'neo4j');
    expect(r.data).toHaveProperty('university1', 'LMU');
    expect(r.data).toHaveProperty('university2', 'TUM');
    expect(r.data).toHaveProperty('stats');
    expect(r.data).toHaveProperty('matrix');
    expect(r.data).toHaveProperty('universities');
  });

  test('stats object has all expected keys', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM');
    expect(r.status).toBe(200);
    const stats = r.data.stats;
    expect(stats).toHaveProperty('total1');
    expect(stats).toHaveProperty('total2');
    expect(stats).toHaveProperty('common');
    expect(stats).toHaveProperty('unique1');
    expect(stats).toHaveProperty('unique2');
    expect(typeof stats.total1).toBe('number');
    expect(typeof stats.total2).toBe('number');
    expect(stats.total1).toBeGreaterThanOrEqual(0);
    expect(stats.total2).toBeGreaterThanOrEqual(0);
  });

  test('matrix has commonTopics, unique1, unique2 arrays', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM');
    expect(r.status).toBe(200);
    const matrix = r.data.matrix;
    expect(Array.isArray(matrix.commonTopics)).toBe(true);
    expect(Array.isArray(matrix.unique1)).toBe(true);
    expect(Array.isArray(matrix.unique2)).toBe(true);
  });

  test('universities object contains arrays for both universities', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM');
    expect(r.status).toBe(200);
    const unis = r.data.universities;
    expect(Array.isArray(unis.LMU)).toBe(true);
    expect(Array.isArray(unis.TUM)).toBe(true);
    if (unis.LMU.length > 0) {
      expect(unis.LMU[0]).toHaveProperty('code');
      expect(unis.LMU[0]).toHaveProperty('name');
    }
  });

  test('accepts level filter parameter', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM&level=BSc');
    expect(r.status).toBe(200);
    expect(r.data.level).toBe('BSc');
  });

  test('accepts topic (keyword) filter parameter', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM&topic=Chemie');
    expect(r.status).toBe(200);
    expect(r.data.topic).toBe('Chemie');
  });

  test('combines level + topic filters', async function () {
    const r = await getJson(COMPARE_URL + '?u1=LMU&u2=TUM&level=MSc&topic=organic');
    expect(r.status).toBe(200);
    expect(r.data.level).toBe('MSc');
    expect(r.data.topic).toBe('organic');
  });

  test('handles unknown universities with empty stats', async function () {
    const r = await getJson(COMPARE_URL + '?u1=NONEXIST&u2=ALSONO');
    // Should still return 200 with zeroed stats, not 400
    expect(r.status).toBe(200);
    expect(r.data.stats.total1).toBe(0);
    expect(r.data.stats.total2).toBe(0);
    expect(r.data.stats.common).toBe(0);
    expect(r.data.matrix.commonTopics).toHaveLength(0);
  });
});
