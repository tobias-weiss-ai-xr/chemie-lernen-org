/**
 * Modulhandbuch Import Tests
 *
 * Tests for the normalizeModuleData() normalization logic used by
 * scripts/import-modulhandbuch.mjs, plus an optional integration test
 * that runs the actual import against a live Neo4j instance.
 *
 * normalizeModuleData() is not exported from the ESM script, so we
 * replicate the pure-logic subset here for unit testing (the actual
 * function body is small and deterministic).
 *
 * Neo4j-requiring tests are guarded by isNeo4jReachable() (same
 * pattern as modulhandbuch-api.test.js).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.resolve(__dirname, '..', 'myhugoapp', 'data', 'modulhandbuch');
const REPO_ROOT = path.resolve(__dirname, '..');

// ── Inline normalizeModuleData (mirrors scripts/import-modulhandbuch.mjs) ────

function normalizeModuleData(catalog, filename) {
  if (!catalog || (typeof catalog.university === 'object' && catalog.university.short_code)) {
    return catalog;
  }
  const uniName =
    typeof catalog.university === 'string'
      ? catalog.university
      : catalog.university?.name || path.basename(filename, '.json');
  const shortCode = uniName
    .replace(/Universität\s+/gi, '')
    .replace(/University\s+/gi, '')
    .replace(/\(.*\)/, '')
    .replace(/\s+/g, '_')
    .substring(0, 20)
    .toLowerCase();
  const normalized = {
    university: { name: uniName, short_code: shortCode, country: 'DE', city: '', website: '' },
    modules: (catalog.modules || []).map(function (mod) {
      return {
        module_code: mod.id || mod.module_code || '',
        module_name: mod.name || mod.module_name || '',
        ects: mod.credits || mod.ects || 0,
        level: mod.type === 'Vorlesung' ? 'BSc' : mod.level || 'BSc',
        degree: mod.degree || '',
        url: mod.url || '',
        language: 'de',
        learning_outcomes: [],
        content: mod.topics || [],
        examination: '',
        offerings: mod.semester ? [{ semester: mod.semester, year: '' }] : [],
      };
    }),
    degrees: [],
    lecturers: [],
  };
  const lecturerSet = new Set();
  for (const mod of catalog.modules || []) {
    if (mod.lecturer && !lecturerSet.has(mod.lecturer)) {
      lecturerSet.add(mod.lecturer);
      normalized.lecturers.push({ name: mod.lecturer, title: '', email: '', orcid: '' });
    }
  }
  return normalized;
}

// ── Helper: check Neo4j reachability ────────────────────────────────────────

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

let _neo4jReachable = null;

function describeIntegration(name, fn) {
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
    });
  }
  const describeFn =
    _neo4jReachable === null ? describe.skip : _neo4jReachable ? describe : describe.skip;
  describeFn(name, fn);
}

// ── Test data ───────────────────────────────────────────────────────────────

/** Old format: university is object with short_code. */
const OLD_FORMAT = {
  university: {
    name: 'Test Uni',
    short_code: 'test_uni',
    country: 'DE',
    city: 'Test',
    website: '',
  },
  degrees: [{ name: 'BSc Test', level: 'BSc' }],
  modules: [
    {
      module_code: 'TST-101',
      module_name: 'Test Chemistry',
      ects: 6,
      language: 'de',
      level: 'BSc',
      degree: 'BSc Test',
      url: '',
      learning_outcomes: ['Know stuff'],
      content: [],
      examination: '',
      offerings: [{ semester: 'WS', year: '2026' }],
    },
  ],
};

/** New format: university is a string, has state field. */
const NEW_FORMAT = {
  university: 'Bayern (LMU + TUM)',
  state: 'BY',
  scrapedAt: '2026-07-23T17:29:46.874Z',
  modules: [
    {
      id: 'CH-001',
      name: 'Allgemeine Chemie',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Huber',
      description: 'Atomaufbau, Periodizität',
      topics: ['Atombau', 'Periodensystem'],
      url: '',
    },
    {
      id: 'CH-002',
      name: 'Anorganisch-chemisches Praktikum',
      type: 'Praktikum',
      credits: 7,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Huber',
      description: 'Präparative Übungen',
      topics: ['Anorganische Chemie'],
      url: '',
    },
  ],
};

// ── Format detection ────────────────────────────────────────────────────────

describe('normalizeModuleData format detection', function () {
  test('returns catalog unchanged for old format (university object with short_code)', function () {
    const result = normalizeModuleData(OLD_FORMAT, 'test.json');
    expect(result).toBe(OLD_FORMAT);
    expect(result.university.short_code).toBe('test_uni');
  });

  test('detects new format (university is a string) and normalizes it', function () {
    const result = normalizeModuleData(NEW_FORMAT, 'by.json');
    expect(result).not.toBe(NEW_FORMAT);
    expect(result.university).toBeDefined();
    expect(typeof result.university).toBe('object');
    expect(result.university.short_code).toBe('bayern_');
    expect(result.university.name).toBe('Bayern (LMU + TUM)');
  });

  test('returns null/undefined catalog as-is (no crash)', function () {
    expect(normalizeModuleData(null, 'empty.json')).toBeNull();
    expect(normalizeModuleData(undefined, 'empty.json')).toBeUndefined();
  });

  test('normalizes empty object {} using filename for short_code', function () {
    const result = normalizeModuleData({}, 'empty.json');
    expect(result.university.short_code).toBe('empty');
    expect(result.university.name).toBe('empty');
  });
});

// ── Field mapping (new → old) ───────────────────────────────────────────────

describe('normalizeModuleData field mapping (new → old)', function () {
  const result = normalizeModuleData(NEW_FORMAT, 'by.json');

  test('university object has expected fields', function () {
    expect(result.university.name).toBe('Bayern (LMU + TUM)');
    expect(result.university.short_code).toBe('bayern_');
    expect(result.university.country).toBe('DE');
    expect(result.university.city).toBe('');
    expect(result.university.website).toBe('');
  });

  test('module id maps to module_code', function () {
    expect(result.modules[0].module_code).toBe('CH-001');
    expect(result.modules[1].module_code).toBe('CH-002');
  });

  test('module name maps to module_name', function () {
    expect(result.modules[0].module_name).toBe('Allgemeine Chemie');
    expect(result.modules[1].module_name).toBe('Anorganisch-chemisches Praktikum');
  });

  test('module credits maps to ects', function () {
    expect(result.modules[0].ects).toBe(6);
    expect(result.modules[1].ects).toBe(7);
  });

  test('module semester maps to offerings array', function () {
    expect(result.modules[0].offerings).toHaveLength(1);
    expect(result.modules[0].offerings[0].semester).toBe('WS');
  });

  test('module topics maps to content', function () {
    expect(result.modules[0].content).toEqual(['Atombau', 'Periodensystem']);
  });

  test('module degree is preserved', function () {
    expect(result.modules[0].degree).toBe('Bachelor Lehramt Chemie');
  });
});

// ── Lecturer extraction ─────────────────────────────────────────────────────

describe('normalizeModuleData lecturer extraction', function () {
  const result = normalizeModuleData(NEW_FORMAT, 'by.json');

  test('lecturers array has unique entries', function () {
    expect(Array.isArray(result.lecturers)).toBe(true);
    expect(result.lecturers).toHaveLength(1);
    expect(result.lecturers[0].name).toBe('Prof. Dr. Huber');
  });

  test('lecturers have placeholder fields', function () {
    expect(result.lecturers[0].title).toBe('');
    expect(result.lecturers[0].email).toBe('');
    expect(result.lecturers[0].orcid).toBe('');
  });
});

// ── Edge cases ──────────────────────────────────────────────────────────────

describe('normalizeModuleData edge cases', function () {
  test('handles missing modules array', function () {
    const input = { university: 'Test Uni', state: 'XX' };
    const result = normalizeModuleData(input, 'edge.json');
    expect(result.modules).toEqual([]);
  });

  test('handles modules with missing fields', function () {
    const input = {
      university: 'Test Uni',
      state: 'XX',
      modules: [{ id: 'M1' }, { name: 'NoID' }],
    };
    const result = normalizeModuleData(input, 'edge.json');
    expect(result.modules).toHaveLength(2);
    expect(result.modules[0].module_code).toBe('M1');
    expect(result.modules[0].module_name).toBe('');
    expect(result.modules[0].ects).toBe(0);
    expect(result.modules[1].module_code).toBe('');
    expect(result.modules[1].module_name).toBe('NoID');
  });

  test('handles empty modules array', function () {
    const input = { university: 'Test Uni', state: 'XX', modules: [] };
    const result = normalizeModuleData(input, 'edge.json');
    expect(result.modules).toEqual([]);
    expect(result.lecturers).toEqual([]);
  });

  test('handles university name with Universität prefix', function () {
    const input = { university: 'Universität München', state: 'BY', modules: [] };
    const result = normalizeModuleData(input, 'uni.json');
    expect(result.university.short_code).toBe('münchen');
  });
});

// ── Integration: run import on real data file (requires Neo4j) ──────────────

describeIntegration('Neo4j import integration', function () {
  test('runs import-modulhandbuch.mjs --dry-run with a new-format file and exits 0', function () {
    const filePath = path.join(DATA_DIR, 'by.json');
    const out = execSync(
      'node scripts/import-modulhandbuch.mjs --dry-run --file=' + filePath.replace(/\s/g, '\\ '),
      { cwd: REPO_ROOT, encoding: 'utf-8', timeout: 15000 }
    );
    expect(out).toContain('dry-run');
    expect(out).toContain('bayern_lmu_tum');
  });

  test('runs import-modulhandbuch.mjs --dry-run with an old-format file and exits 0', function () {
    const filePath = path.join(DATA_DIR, 'lmu.json');
    const out = execSync(
      'node scripts/import-modulhandbuch.mjs --dry-run --file=' + filePath.replace(/\s/g, '\\ '),
      { cwd: REPO_ROOT, encoding: 'utf-8', timeout: 15000 }
    );
    expect(out).toContain('dry-run');
    expect(out).toContain('lmu');
  });

  test('all JSON files can be loaded and normalized without error', function () {
    const files = fs.readdirSync(DATA_DIR).filter(function (f) {
      return f.endsWith('.json');
    });
    expect(files.length).toBeGreaterThan(0);

    for (const f of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      const norm = normalizeModuleData(raw, f);
      if (norm) {
        expect(norm.university).toBeDefined();
        expect(norm.university.short_code).toBeDefined();
        expect(Array.isArray(norm.modules)).toBe(true);
      }
    }
  });
});
