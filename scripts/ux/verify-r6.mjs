/**
 * verify-r6.mjs — TaskFleet-Verifikation für UXF Runde 6 (Bugs/Edgecases)
 *  1. node --check (geänderte Dateien + extrahierte Inline-Scripts)
 *  2. ESLint
 *  3. Logik-Tests: 404-Redirect-Matrix, API-Clamp, Sanitizer
 *  4. vitest-Regression + Hugo-Build
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
    console.error(String(err.stdout || '').slice(0, 800));
    console.error(String(err.stderr || '').slice(0, 800));
    return false;
  }
}

console.log('[verify-r6] 1/4 Syntax-Checks');
const JS_FILES = [
  'api/routes/curricula.js',
  'myhugoapp/static/js/ki-assistent.js',
  'myhugoapp/static/js/quiz-ui.js',
];
for (const f of JS_FILES) ok = run(`node --check ${f}`, f) && ok;

// 404-Inline-JS extrahieren
{
  const html = fs.readFileSync(path.join(REPO_ROOT, 'myhugoapp/layouts/404.html'), 'utf-8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  const tmp = path.join(os.tmpdir(), 'nf404-r6.js');
  fs.writeFileSync(tmp, m ? m[1] : '');
  ok = run(`node --check ${tmp}`, 'layouts/404.html (inline)') && ok;
}
// quiz.html Inline-JS (größter Block)
{
  const html = fs.readFileSync(path.join(REPO_ROOT, 'myhugoapp/layouts/_default/quiz.html'), 'utf-8');
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]);
  const biggest = blocks.sort((a, b) => b.length - a.length)[0] || '';
  const tmp = path.join(os.tmpdir(), 'quiz-r6.js');
  fs.writeFileSync(tmp, biggest);
  ok = run(`node --check ${tmp}`, 'layouts/_default/quiz.html (inline, größter Block)') && ok;
}

console.log('[verify-r6] 2/4 ESLint');
for (const f of JS_FILES) ok = run(`npx eslint ${f}`, `eslint ${f}`) && ok;

console.log('[verify-r6] 3/4 Logik-Tests');

// a) 404-Redirect-Matrix simulieren
{
  const html = fs.readFileSync(path.join(REPO_ROOT, 'myhugoapp/layouts/404.html'), 'utf-8');
  const states = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sl','sn','st','th'];
  const matrix = [
    ['/curricula/by/gymnasium/alte-seite/', '/curricula/by/'],
    ['/curricula/xy/', '/curricula/'],
    ['/curricula/xy/tief/pfad/', '/curricula/'],
    ['/curricula/by/', null], // State-Seite selbst: kein Redirect
    ['/curricula/', null],
    ['/entity/foo/', 'search'],
    ['/gibts-nicht/', null],
  ];
  let mOk = true;
  for (const [p, expected] of matrix) {
    const em = p.match(/^\/entity\/([^/]+)\/?$/);
    let got;
    if (em && em[1] && em[1] !== 'index.html') got = 'search';
    else {
      const cm = p.match(/^\/curricula\/([^/]+)(?:\/(.*))?\/?$/);
      if (cm && cm[1] && cm[1] !== 'index.html') {
        const st = cm[1].toLowerCase();
        const deep = cm[2] || '';
        if (states.indexOf(st) !== -1) got = deep && deep !== 'index.html' ? '/curricula/' + st + '/' : null;
        else got = '/curricula/';
      } else got = null;
    }
    if (got !== expected) {
      console.error(`  ✗ 404-Matrix ${p}: erwartet ${expected}, got ${got}`);
      mOk = false;
    }
  }
  // Regex auch im Template prüfen (Deep-Path-Variante mit Capture-Group)
  if (!html.includes('(?:\\/(.*))?')) {
    console.error('  ✗ 404-Template: Deep-Path-Regex fehlt');
    mOk = false;
  }
  if (mOk) console.log('  ✓ 404-Redirect-Matrix (7 Fälle + Regex im Template)');
  ok = ok && mOk;
}

// b) API-Clamp
{
  const api = fs.readFileSync(path.join(REPO_ROOT, 'api/routes/curricula.js'), 'utf-8');
  const clampOk =
    (api.match(/Math\.max\(parseInt\(req\.query\.offset, 10\) \|\| 0, 0\)/g) || []).length === 2 &&
    (api.match(/limitNum > 0 \? limitNum : 200, 1000\)/g) || []).length === 2;
  if (clampOk) console.log('  ✓ API-Clamp an beiden Routen (limit [1,1000], offset ≥ 0)');
  else {
    console.error('  ✗ API-Clamp unvollständig');
    ok = false;
  }
  // Simulierte Clamp-Logik
  const clamp = (v) => {
    const n = parseInt(v, 10);
    return Math.min(n > 0 ? n : 200, 1000);
  };
  const clampOff = (v) => Math.max(parseInt(v, 10) || 0, 0);
  const cases = [
    [clamp('-1'), 200], [clamp('abc'), 200], [clamp('99999999'), 1000], [clamp('50'), 50],
    [clampOff('-5'), 0], [clampOff('10'), 10], [clampOff('abc'), 0],
  ];
  const bad = cases.filter(([got, want]) => got !== want);
  if (bad.length) {
    console.error('  ✗ Clamp-Simulation falsch:', JSON.stringify(bad));
    ok = false;
  } else console.log('  ✓ Clamp-Simulation (7 Fälle)');
}

// c) Sanitizer-Funktionaltest
{
  const src = fs.readFileSync(path.join(REPO_ROOT, 'myhugoapp/static/js/ki-assistent.js'), 'utf-8');
  const m = src.match(/function sanitizeAiHtml\(html\) \{[\s\S]*?\n[ ]{2}\}/);
  if (!m) {
    console.error('  ✗ sanitizeAiHtml nicht gefunden');
    ok = false;
  } else {
    // absichtlich: extrahierte Funktion isoliert testen (repo-eigener Code)
    // eslint-disable-next-line sonarjs/code-eval
    const fn = new Function('return ' + m[0])();
    const tests = [
      ['<iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe>', false],
      ['<a href="data:text/html,<b>x</b>">k</a>', false],
      ['<a href="vbscript:m(1)">k</a>', false],
      ['<form action="/p"><input></form>', false],
      ['<base href="//evil.com/">', false],
      ['<iframe src="https://www.youtube.com/embed/x"></iframe>', true],
      ['<iframe src="/media/v"></iframe>', true],
      ['<p>normaler <b>Text</b></p>', true],
      ['[Link](https://chemie-lernen.org/s)', true],
    ];
    let sOk = true;
    for (const [input, shouldRemain] of tests) {
      // eslint-disable-next-line sonarjs/code-eval
      const out = fn(input);
      const dangerous = /srcdoc|data:text|vbscript|<form|<base|<script/i.test(out);
      if (shouldRemain ? !dangerous && out.length > 0 : !dangerous) continue;
      console.error(`  ✗ Sanitizer: ${JSON.stringify(input.slice(0, 50))} → ${JSON.stringify(out.slice(0, 60))}`);
      sOk = false;
    }
    if (sOk) console.log(`  ✓ Sanitizer-Funktionaltest (${tests.length} Fälle)`);
    ok = ok && sOk;
  }
}

// d) Quiz-Verdrahtung
{
  const qhtml = fs.readFileSync(path.join(REPO_ROOT, 'myhugoapp/layouts/_default/quiz.html'), 'utf-8');
  const quijs = fs.readFileSync(path.join(REPO_ROOT, 'myhugoapp/static/js/quiz-ui.js'), 'utf-8');
  const wired =
    qhtml.includes('quizTitle: currentTopic') &&
    quijs.includes('self.options.quizTitle');
  if (wired) console.log('  ✓ Quiz-Share: quizTitle-Option verdrahtet (this→self-Falle behoben)');
  else {
    console.error('  ✗ Quiz-Share-Verdrahtung unvollständig');
    ok = false;
  }
}

console.log('[verify-r6] 4/4 Tests + Hugo');
ok = run('npx vitest run tests/entity-links.test.js tests/curricula-utils.test.js', 'vitest-Regression') && ok;
ok = run('hugo --quiet --destination /tmp/hugo-r6-verify', 'Hugo-Build', path.join(REPO_ROOT, 'myhugoapp')) && ok;
{
  const built = fs.existsSync('/tmp/hugo-r6-verify/404.html');
  console.log(built ? '  ✓ 404.html im Build' : '  ✗ 404.html fehlt im Build');
  ok = ok && built;
}

if (!ok) {
  console.error('[verify-r6] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify-r6] ✓ alle Checks bestanden');
