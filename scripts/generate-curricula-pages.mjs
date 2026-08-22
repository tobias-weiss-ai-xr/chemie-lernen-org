#!/usr/bin/env node
/**
 * generate-curricula-pages.mjs
 *
 * Generates Hugo content pages for each Bundesland's curriculum at
 * content/curricula/{abbr}/_index.md so they have unique URLs for SEO and
 * social sharing (e.g. chemie-lernen.org/curricula/bb/).
 *
 * Run: node scripts/generate-curricula-pages.mjs
 * Data source: myhugoapp/data/curricula/{abbr}.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'myhugoapp', 'data', 'curricula');
const CONTENT_DIR = join(ROOT, 'myhugoapp', 'content', 'curricula');

// States to generate (2-letter abbreviations matching data file names)
const STATE_CODES = [
  'bb',
  'be',
  'bw',
  'by',
  'hb',
  'he',
  'hh',
  'mv',
  'ni',
  'nw',
  'rp',
  'sh',
  'sl',
  'sn',
  'st',
  'th',
];

const STATE_LABELS = {
  bb: 'Brandenburg',
  be: 'Berlin',
  bw: 'Baden-Württemberg',
  by: 'Bayern',
  hb: 'Bremen',
  he: 'Hessen',
  hh: 'Hamburg',
  mv: 'Mecklenburg-Vorpommern',
  ni: 'Niedersachsen',
  nw: 'Nordrhein-Westfalen',
  rp: 'Rheinland-Pfalz',
  sh: 'Schleswig-Holstein',
  sl: 'Saarland',
  sn: 'Sachsen',
  st: 'Sachsen-Anhalt',
  th: 'Thüringen',
};

function loadStateJSON(code) {
  const fp = join(DATA_DIR, `${code}.json`);
  try {
    return JSON.parse(readFileSync(fp, 'utf-8'));
  } catch {
    return null;
  }
}

function countTopics(data) {
  if (!data || !data.school_curricula) return 0;
  let count = 0;
  for (const sc of data.school_curricula) {
    if (sc.grade_levels) {
      for (const gl of sc.grade_levels) {
        if (gl.topics) count += gl.topics.length;
      }
    }
  }
  return count;
}

function countObjectives(data) {
  if (!data || !data.school_curricula) return 0;
  let count = 0;
  for (const sc of data.school_curricula) {
    if (sc.grade_levels) {
      for (const gl of sc.grade_levels) {
        if (gl.topics) {
          for (const t of gl.topics) {
            if (t.learning_objectives) count += t.learning_objectives.length;
          }
        }
      }
    }
  }
  return count;
}

function generatePage(code, data) {
  const name = STATE_LABELS[code] || code.toUpperCase();
  const topicCount = countTopics(data);
  const objectiveCount = countObjectives(data);
  const desc =
    topicCount > 0
      ? `Chemie-Lehrplan für ${name} — ${topicCount} Themen, ${objectiveCount} Lernziele, aufbereitet aus den amtlichen Kernlehrplänen.`
      : `Chemie-Lehrplan für ${name} — mit Themen, Lernzielen und verknüpften Inhalten.`;

  const dir = join(CONTENT_DIR, code);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const content = `---
title: 'Lehrplan ${name}'
description: '${desc}'
layout: curricula-state
params:
  state: '${code}'
  stateName: '${name}'
  topicCount: ${topicCount}
  objectiveCount: ${objectiveCount}
outputs:
  - html
menu:
  main:
    parent: 'lehrende'
    weight: 110
---

Der Chemie-Lehrplan für **${name}** mit ${topicCount} Themen und ${objectiveCount} Lernzielen.
`;

  const fp = join(dir, '_index.md');
  writeFileSync(fp, content, 'utf-8');
  console.log(
    `  ✓ ${code.toUpperCase()} → ${fp} (${topicCount} topics, ${objectiveCount} objectives)`
  );
  return true;
}

// ── Main ─────────────────────────────────────────────
let generated = 0;
let skipped = 0;

for (const code of STATE_CODES) {
  const data = loadStateJSON(code);
  if (!data) {
    console.log(`  - ${code.toUpperCase()}: no JSON data, skipping`);
    skipped++;
    continue;
  }
  generatePage(code, data);
  generated++;
}

console.log(`\nDone: ${generated} pages generated, ${skipped} skipped.`);
console.log('Next: rebuild site with `hugo` to see changes.');
