#!/usr/bin/env node
/**
 * curricula-quality-report.mjs
 *
 * Analyzes curricula JSON data quality per Bundesland and produces a report.
 * Flags states with incomplete/suspicious data for manual improvement.
 *
 * Run: node scripts/curricula-quality-report.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'myhugoapp', 'data', 'curricula');

const STATE_CODES = [
  'bb', 'be', 'bw', 'by', 'hb', 'he', 'hh',
  'mv', 'ni', 'nw', 'rp', 'sh', 'sl', 'sn', 'st', 'th',
];

const STATE_LABELS = {
  bb: 'Brandenburg', be: 'Berlin', bw: 'Baden-Württemberg',
  by: 'Bayern', hb: 'Bremen', he: 'Hessen',
  hh: 'Hamburg', mv: 'Mecklenburg-Vorpommern',
  ni: 'Niedersachsen', nw: 'Nordrhein-Westfalen',
  rp: 'Rheinland-Pfalz', sh: 'Schleswig-Holstein',
  sl: 'Saarland', sn: 'Sachsen', st: 'Sachsen-Anhalt',
  th: 'Thüringen',
};

function analyzeState(code) {
  try {
    const raw = readFileSync(join(DATA_DIR, `${code}.json`), 'utf-8');
    const data = JSON.parse(raw);
    const state = data.state || '?';
    const updated = data.last_updated || '?';
    const sources = data.source_urls || [];

    let schoolTypes = 0, totalTopics = 0, totalObjectives = 0;
    const grades = new Set();
    const topicNames = [];

    for (const sc of data.school_curricula || []) {
      schoolTypes++;
      for (const gl of sc.grade_levels || []) {
        grades.add(gl.grade);
        for (const t of gl.topics || []) {
          totalTopics++;
          totalObjectives += (t.learning_objectives || []).length;
          topicNames.push(t.title);
        }
      }
    }

    return {
      code, state, updated, sources, schoolTypes,
      totalTopics, totalObjectives, grades: [...grades].sort(),
      topicNames,
      hasData: true,
    };
  } catch {
    return { code, hasData: false, state: STATE_LABELS[code] || code };
  }
}

// ── Main ──────────────────────────────────────────
const results = STATE_CODES.map(analyzeState);

console.log('=== Curricula Data Quality Report ===\n');
console.log('Code  | State                | Topics | Objvs | Grades         | Types | Status');
console.log('------+----------------------+--------+-------+----------------+-------+-------');

const WARN_THRESHOLD = 10;
const FAIL_THRESHOLD = 3;
let warnings = [];
let errors = [];

for (const r of results) {
  if (!r.hasData) {
    console.log(`${r.code.toUpperCase().padEnd(5)}| ${(r.state||'').padEnd(20)} | ${'—'.padEnd(6)} | ${'—'.padEnd(5)} | ${'—'.padEnd(14)} | ${'—'.padEnd(5)} | ❌ KEINE DATEN`);
    errors.push(`${r.code.toUpperCase()}: Keine Daten vorhanden`);
    continue;
  }

  const topicsStr = String(r.totalTopics).padStart(6);
  const objsStr = String(r.totalObjectives).padStart(5);
  const gradesStr = (r.grades.join(', ') || '—').padEnd(14);
  const typesStr = String(r.schoolTypes).padStart(5);

  let status = '✅';
  if (r.totalTopics <= FAIL_THRESHOLD) {
    status = '❌ KRITISCH';
    errors.push(`${r.code.toUpperCase()}: Nur ${r.totalTopics} Themen (${r.state})`);
  } else if (r.totalTopics <= WARN_THRESHOLD) {
    status = '⚠️ WARNUNG';
    warnings.push(`${r.code.toUpperCase()}: Nur ${r.totalTopics} Themen (${r.state})`);
  }

  console.log(`${r.code.toUpperCase().padEnd(5)}| ${r.state.padEnd(20)} | ${topicsStr} | ${objsStr} | ${gradesStr} | ${typesStr} | ${status}`);
}

console.log('\n--- Zusammenfassung ---');
console.log(`Untersuchte Bundesländer: ${results.length}`);
const withData = results.filter(r => r.hasData).length;
console.log(`Mit Daten: ${withData}`);
console.log(`Ohne Daten: ${results.filter(r => !r.hasData).length}`);

if (errors.length > 0) {
  console.log(`\n❌ Kritische Probleme (${errors.length}):`);
  errors.forEach(e => console.log(`  - ${e}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnungen (${warnings.length}):`);
  warnings.forEach(w => console.log(`  - ${w}`));
}

const totalTopics = results.filter(r => r.hasData).reduce((s, r) => s + r.totalTopics, 0);
const totalObjectives = results.filter(r => r.hasData).reduce((s, r) => s + r.totalObjectives, 0);
console.log(`\nGesamt: ${totalTopics} Themen, ${totalObjectives} Lernziele`);

if (errors.length > 0 || warnings.length > 0) {
  console.log('\nEmpfehlung: Die offiziellen Lehrplandokumente für die betroffenen Bundesländer');
  console.log('liegen als PDF vor. Die Extraktion war unvollständig. Zur Verbesserung:');
  console.log('  1. PDF von source_urls manuell öffnen');
  console.log('  2. Themen/Kompetenzen je Jahrgangsstufe erfassen');
  console.log('  3. data/curricula/{code}.json im bestehenden Format aktualisieren');
}
