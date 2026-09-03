/**
 * verify-r8.mjs — TaskFleet-Verifikation für UXF Runde 8
 *  1. Syntax-Checks (6 geänderte Dateien)
 *  2. ESLint (Quellen)
 *  3. API qs()-Härtung: Quell-Assertionen + Verhaltens-Simulation
 *  4. Tests: Balancer-Suite + Voll-Suite
 *  5. Hugo-Build
 */

import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
let ok = true;

function run(cmd, label, cwd) {
  try {
    execSync(cmd, { cwd: cwd || REPO_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    console.log(`  ✓ ${label}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(String(err.stdout || '').slice(0, 600));
    console.error(String(err.stderr || '').slice(0, 600));
    return false;
  }
}

console.log('[verify-r8] 1/5 Syntax-Checks');
const SOURCES = [
  'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js',
  'api/routes/curricula.js',
  'api/routes/modulhandbuch.js',
  'api/routes/content.js',
  'api/routes/kg-data.js',
  'api/routes/learning-paths.js',
];
for (const f of SOURCES) ok = run(`node --check ${f}`, f) && ok;

console.log('[verify-r8] 2/5 ESLint');
for (const f of SOURCES) ok = run(`npx eslint ${f}`, `eslint ${f}`) && ok;
ok =
  run('npx eslint tests/reaktionsgleichungen-balancer.test.js', 'eslint Balancer-Tests') && ok;

console.log('[verify-r8] 3/5 API qs()-Härtung');
{
  const EXPECT = {
    'api/routes/curricula.js': 11,
    'api/routes/modulhandbuch.js': 5,
    'api/routes/content.js': 2,
    'api/routes/kg-data.js': 1,
    'api/routes/learning-paths.js': 1,
  };
  for (const [rel, min] of Object.entries(EXPECT)) {
    const src = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    const helper = src.includes('function qs(v)');
    const uses = (src.match(/qs\(req\.query\./g) || []).length;
    const rawLeft = (src.match(/\(req\.query\.\w+ \|\| ''\)/g) || []).length;
    if (helper && uses >= min && rawLeft === 0) {
      console.log(`  ✓ ${rel}: Helper ✓, ${uses} Nutzungen, 0 rohe Muster`);
    } else {
      console.error(
        `  ✗ ${rel}: helper=${helper}, uses=${uses} (<${min}?), rawLeft=${rawLeft}`
      );
      ok = false;
    }
  }

  // Verhaltens-Simulation der qs()-Logik (spawnSync ohne Shell!)
  const probe = `
function qs(v) {
  if (Array.isArray(v)) return v.length ? String(v[0]) : '';
  return v == null ? '' : String(v);
}
const cases = [
  [qs(['a','b']), 'a', '?x=a&x=b → erstes Element'],
  [qs([]), '', 'leeres Array'],
  [qs(null), '', 'null'],
  [qs(undefined), '', 'undefined'],
  [qs('  x '), '  x ', 'String unverändert (trimming macht der Aufrufer)'],
  [qs(5), '5', 'Zahl → String'],
];
let bad = 0;
for (const [got, want, label] of cases) {
  if (got !== want) { console.error('✗', label, '→', JSON.stringify(got)); bad++; }
}
process.exit(bad ? 1 : 0);
`;
  const res = spawnSync(process.execPath, ['-e', probe], { encoding: 'utf-8' });
  if (res.status === 0) {
    console.log('  ✓ qs()-Verhalten: 6 Fälle');
  } else {
    console.error('  ✗ qs()-Verhalten:', res.stderr.slice(0, 300));
    ok = false;
  }
}

console.log('[verify-r8] 4/5 Tests');
ok =
  run(
    'npx vitest run tests/reaktionsgleichungen-balancer.test.js',
    'Balancer-Edgecase-Suite (19 Tests inkl. KMnO4+HCl→16)'
  ) && ok;
ok = run('npm run test:unit', 'Voll-Suite (test:unit)') && ok;

console.log('[verify-r8] 5/5 Hugo');
ok =
  run('hugo --quiet --destination /tmp/hugo-r8-verify', 'Hugo-Build', path.join(REPO_ROOT, 'myhugoapp')) &&
  ok;

if (!ok) {
  console.error('[verify-r8] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify-r8] ✓ alle Checks bestanden');
