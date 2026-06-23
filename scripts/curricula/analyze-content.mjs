#!/usr/bin/env node
/**
 * analyze-content.mjs — Sprint C1: Gap-Analyse für Curriculum-Content-Linking.
 *
 * Analysiert:
 *  1. Welche sauberen Curriculum-Topics haben keine/zu wenige Content-Links?
 *  2. Welche Themenbereiche haben wie viele Artikel?
 *  3. Content-Coverage pro State/Schulform/Klasse
 *  4. Generiert data/curricula/content-gaps.json
 *
 * Usage:
 *   node scripts/curricula/analyze-content.mjs         # normale Ausgabe
 *   node scripts/curricula/analyze-content.mjs --json  # nur JSON schreiben
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(ROOT, 'myhugoapp/data/curricula');
const CONTENT_DIR = path.join(ROOT, 'myhugoapp/content');
// --- Hilfsfunktionen ---

function loadJSON(relPath) {
  const p = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function hasGarbage(text) {
  if (!text || text.length < 3) return true;
  if (/[\uF0B7]/.test(text)) return true;
  if (/Schüler/.test(text) || /Bildungsstandards/.test(text)) return true;
  if (/Lernbereich \d/.test(text)) return true;
  if (/ca\. \d+ Std/.test(text)) return true;
  if (text.length > 60) return true;
  if (/Experimente/.test(text)) return true;
  if (/nutzen sie/.test(text)) return true;
  return false;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] || c)
    .replace(/[-–—]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- 1. Content-Links laden ---

const contentLinks = loadJSON('content-links.json');
const topics = contentLinks ? Object.keys(contentLinks) : [];

// --- 2. Curriculum-JSONs laden (alle States) ---

const curriculumFiles = fs.readdirSync(DATA_DIR).filter((f) => /^[a-z]{2}\.json$/.test(f));
const allTopics = []; // {name, state, school_type, grade, isGarbage}

for (const file of curriculumFiles) {
  const stateData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  const state =
    stateData.state_abbr ||
    stateData.state?.slice(0, 2).toUpperCase() ||
    file.slice(0, 2).toUpperCase();
  if (!stateData.school_curricula) continue;

  for (const sc of stateData.school_curricula) {
    for (const gl of sc.grade_levels || []) {
      for (const topic of gl.topics || []) {
        allTopics.push({
          name: topic.title,
          state,
          school_type: sc.school_type,
          grade: gl.grade,
          isGarbage: hasGarbage(topic.title),
          objectiveCount: (topic.learning_objectives || []).length,
        });
      }
    }
  }
}

// --- 3. Artikel aus Content-Verzeichnis ---

const articles = [];
function scanContent(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name === '.DS_Store') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanContent(fullPath, depth + 1);
      } else if (entry.name.endsWith('.md')) {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const titleMatch = raw.match(/^title:\s*"(.+)"\s*$/m);
        const descMatch = raw.match(/^description:\s*"(.+)"\s*$/m);
        const teilgebietMatch = raw.match(/^teilgebiet:\s*(.+)\s*$/m);
        articles.push({
          file: path.relative(CONTENT_DIR, fullPath),
          title: titleMatch ? titleMatch[1] : path.basename(entry.name, '.md'),
          description: descMatch ? descMatch[1] : '',
          teilgebiet: teilgebietMatch ? teilgebietMatch[1].trim() : '',
          url:
            '/' +
            path
              .relative(CONTENT_DIR, fullPath)
              .replace(/\/?index\.md$/, '/')
              .replace(/\.md$/, '/'),
        });
      }
    }
  } catch {
    /* ignore directory errors */
  }
}
scanContent(CONTENT_DIR);

// --- 4. Gap-Analyse ---

const cleanTopics = allTopics.filter((t) => !t.isGarbage);
const garbageTopics = allTopics.filter((t) => t.isGarbage);

// Topics with links
const linkedTopics = new Set(topics.filter((t) => !hasGarbage(t)).map((t) => normalizeName(t)));

// Clean topics without links
const noLinkTopics = cleanTopics.filter((t) => {
  const norm = normalizeName(t.name);
  return !linkedTopics.has(norm);
});

// Themenbereiche coverage
const teilgebiete = {};
for (const a of articles) {
  const tg = a.teilgebiet || 'allgemein';
  if (!teilgebiete[tg]) teilgebiete[tg] = [];
  teilgebiete[tg].push(a.title);
}

// Content link counts per topic
const linkCounts = {};
for (const [topicName, links] of Object.entries(contentLinks || {})) {
  const norm = normalizeName(topicName);
  linkCounts[norm] = links.length;
}

// Coverage per state
const stateCoverage = {};
for (const t of cleanTopics) {
  if (!stateCoverage[t.state]) stateCoverage[t.state] = { total: 0, linked: 0 };
  stateCoverage[t.state].total++;
  if (linkedTopics.has(normalizeName(t.name))) {
    stateCoverage[t.state].linked++;
  }
}

// --- 5. Output ---

const gapReport = {
  generated: new Date().toISOString().slice(0, 10),
  summary: {
    totalTopicsInNeo4j: allTopics.length,
    cleanTopics: cleanTopics.length,
    garbageTopics: garbageTopics.length,
    topicsWithLinks: linkedTopics.size,
    topicsWithoutLinks: noLinkTopics.length,
    uniqueArticles: articles.length,
    uniqueCalculators: 48, // aus content-links.json known
    linkedTopicsPct: Math.round((linkedTopics.size / cleanTopics.length) * 100),
  },
  coverageByState: stateCoverage,
  thinTopics: noLinkTopics.slice(0, 100).map((t) => ({
    name: t.name,
    state: t.state,
    school_type: t.school_type,
    grade: t.grade,
  })),
  themenbereiche: teilgebiete,
  recommendations: [
    noLinkTopics.length > 0
      ? `${noLinkTopics.length} saubere Topics haben keine Content-Links — manuelles Mapping nötig`
      : 'Alle sauberen Topics haben Content-Links',
    ...Object.entries(teilgebiete)
      .filter(([, arts]) => arts.length < 3)
      .map(([tg, arts]) => `Themenbereich "${tg}" hat nur ${arts.length} Artikel — ausbauen`),
  ],
  gapTopics: noLinkTopics
    .filter((t) => t.grade !== undefined)
    .reduce((acc, t) => {
      const key = `${t.state}-${t.grade}`;
      if (!acc[key]) acc[key] = { state: t.state, grade: t.grade, count: 0 };
      acc[key].count++;
      return acc;
    }, {}),
};

if (process.argv.includes('--json')) {
  fs.writeFileSync(
    path.join(DATA_DIR, 'content-gaps.json'),
    JSON.stringify(gapReport, null, 2),
    'utf8'
  );
  console.log('Written:', path.join(DATA_DIR, 'content-gaps.json'));
} else {
  console.log(JSON.stringify(gapReport, null, 2));
}
