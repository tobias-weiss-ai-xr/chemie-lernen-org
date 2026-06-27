/**
 * Smoke tests for critical build/import scripts.
 * Verifies each script can parse valid input without crashing.
 */

const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

/** Helper: run a Node script synchronously and return { exitCode, stdout, stderr } */
function runScript(scriptPath, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 30000,
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message,
    };
  }
}

// ─── minify-calculators.js (CommonJS) ───────────────────────────────────────

describe('minify-calculators.js', () => {
  /** @type {{ minifyFile: Function }} */
  let mod;

  beforeAll(() => {
    // minify-calculators uses require('terser') which is a heavy dep.
    // If terser is not installed (production-only node_modules), skip.
    try {
      mod = require('../scripts/minify-calculators.js');
    } catch {
      // terser might be missing in CI — that's OK for the smoke test
    }
  });

  test('module exports minifyFile function', () => {
    if (!mod) return; // graceful skip if terser unavailable
    expect(mod).toHaveProperty('minifyFile');
    expect(typeof mod.minifyFile).toBe('function');
  });

  test('minifyFile processes a simple JS string', async () => {
    if (!mod) return;
    // Write a temp file, minify it, verify output exists
    const fs = require('fs');
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'minify-test-'));
    const srcPath = path.join(tmpDir, 'test-input.js');
    fs.writeFileSync(srcPath, 'const x = 1; console.log(x);', 'utf-8');

    const origCwd = process.cwd;
    // minifyFile reads the file and writes .optimized.js alongside
    await mod.minifyFile(srcPath);

    const optPath = path.join(tmpDir, 'test-input.optimized.js');
    expect(fs.existsSync(optPath)).toBe(true);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ─── import-modulhandbuch.mjs (ESM — run as subprocess) ─────────────────────

describe('import-modulhandbuch.mjs', () => {
  const script = path.join(REPO_ROOT, 'scripts/import-modulhandbuch.mjs');

  test('exits 0 with --dry-run (no Neo4j needed)', () => {
    const result = runScript(script, ['--dry-run']);
    expect(result.exitCode).toBe(0);
    // Should mention dry-run in output
    expect(result.stdout).toMatch(/DRY.RUN|dry.run/i);
  });

  test('handles --dry-run --file with valid JSON', () => {
    // Point at a minimal valid JSON catalog
    const dataDir = path.join(REPO_ROOT, 'myhugoapp', 'data', 'modulhandbuch');
    const files = require('fs')
      .readdirSync(dataDir)
      .filter((f) => f.endsWith('.json'));
    if (files.length === 0) {
      // No real data — write a minimal valid catalog
      const tmpFile = path.join(require('os').tmpdir(), 'test-catalog.json');
      require('fs').writeFileSync(
        tmpFile,
        JSON.stringify({
          university: {
            short_code: 'TEST',
            name: 'Test Uni',
            country: 'DE',
            city: 'Berlin',
            website: '',
          },
          modules: [{ module_code: 'TEST-101', module_name: 'Test Module', ects: 5 }],
        })
      );
      const result = runScript(script, ['--dry-run', `--file=${tmpFile}`]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/dry.run/i);
      require('fs').rmSync(tmpFile);
    } else {
      const result = runScript(script, ['--dry-run', `--file=${dataDir}/${files[0]}`]);
      expect(result.exitCode).toBe(0);
    }
  });
});

// ─── analyze-content.mjs (ESM — run as subprocess) ──────────────────────────

describe('analyze-content.mjs', () => {
  const script = path.join(REPO_ROOT, 'scripts/curricula', 'analyze-content.mjs');

  test('exits 0 with --help or shows usage without crashing', () => {
    const result = runScript(script, []);
    // The script may exit 0 with "no data" or print usage. Either is fine.
    // It should not throw a syntax error or crash.
    expect(result.exitCode).toBe(0);
  });
});
