#!/usr/bin/env node
/**
 * generate-clean-mapping.mjs
 *
 * Generates a clean curriculum topic → content mapping using only topics
 * with clean (non-garbled) titles. The output keys are NORMALIZED topic names
 * that match Entity.name in Neo4j.
 *
 * Usage:
 *   node scripts/curricula/generate-clean-mapping.mjs
 *   node scripts/curricula/generate-clean-mapping.mjs --dry-run
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURRICULA_DIR = join(__dirname, '..', '..', 'myhugoapp', 'data', 'curricula');
const CONTENT_LINKS_PATH = join(CURRICULA_DIR, 'content-links.json');
const OUTPUT_PATH = join(CURRICULA_DIR, 'content-neo4j-mapping.json');
const isDryRun = process.argv.includes('--dry-run');

// Matches import-curricula.mjs normalization
function normalizeName(name) {
  let n = name.toLowerCase().trim();
  n = n.replace(/^lernbereich \d+:\s*/i, '');
  n = n.replace(/\(.*?\)/g, '').trim();
  const dashIdx = n.indexOf('–');
  if (dashIdx > 0) n = n.slice(0, dashIdx).trim();
  n = n.replace(/[.,;:!?]+$/, '');
  n = n.replace(/^das fach chemie.*?\.\.\.\.\./i, '').trim();
  return n;
}

function isGarbled(title) {
  return (
    title.length > 50 ||
    title.includes('') ||
    title.includes('...') ||
    title.includes('...') ||
    /^[a-z]{1,3}\s\d/i.test(title) || // "Ee □ wenden..."
    /\d\.\d\.\d/.test(title) // "3.4.1 Chemische Energetik"
  );
}

function loadArticles() {
  const articles = [];
  // Try to load from content-links.json source metadata
  const existing = existsSync(CONTENT_LINKS_PATH)
    ? JSON.parse(readFileSync(CONTENT_LINKS_PATH, 'utf-8'))
    : {};
  const seen = new Set();
  for (const [, items] of Object.entries(existing)) {
    for (const item of items) {
      const key = item.url;
      if (!seen.has(key)) {
        seen.add(key);
        articles.push({
          title: item.title,
          type: item.type,
          url: item.url,
          keywords: item.matchedKeywords || [],
          score: item.score || 0,
        });
      }
    }
  }
  return articles;
}

function loadCurriculaTopics() {
  const files = readdirSync(CURRICULA_DIR).filter(
    (f) =>
      f.endsWith('.json') &&
      ![
        'index.json',
        'checksums.json',
        'content-links.json',
        'content-neo4j-mapping.json',
      ].includes(f)
  );
  const topics = [];
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(CURRICULA_DIR, file), 'utf8'));
    if (!data.school_curricula) continue;
    for (const sc of data.school_curricula) {
      for (const gl of sc.grade_levels) {
        for (const t of gl.topics) {
          if (typeof t !== 'object' || !t.title) continue;
          if (isGarbled(t.title)) continue;
          const normalized = normalizeName(t.title);
          if (!normalized || normalized.length < 3) continue;
          topics.push({
            rawTitle: t.title,
            normalized,
            state: data.state,
            stateAbbr: data.state_abbr,
            schoolType: sc.school_type,
            grade: gl.grade,
          });
        }
      }
    }
  }
  return topics;
}

function tokenize(text) {
  const words = text
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return [...new Set(words)];
}

const STOP_WORDS = new Set([
  'der',
  'die',
  'das',
  'den',
  'dem',
  'des',
  'ein',
  'eine',
  'einen',
  'einer',
  'eines',
  'und',
  'oder',
  'aber',
  'mit',
  'von',
  'fur',
  'für',
  'auf',
  'bei',
  'nach',
  'vor',
  'aus',
  'durch',
  'uber',
  'über',
  'unter',
  'zum',
  'zur',
  'sich',
  'auch',
  'nicht',
  'werden',
  'wird',
  'sind',
  'ist',
  'hat',
  'haben',
  'wurde',
  'wurden',
  'kann',
  'konnen',
  'können',
  'mussen',
  'müssen',
  'soll',
  'sollen',
  'diese',
  'dieser',
  'dieses',
  'allen',
  'allem',
  'aller',
  'jeder',
  'jedes',
  'beide',
  'beiden',
  'ihre',
  'ihren',
  'ihrer',
  'seine',
  'seinen',
  'seiner',
  'chemie',
  'wichtig',
  'grundlegend',
  'kompetenzbereich',
  'kompetenzen',
  'verfügen',
  'anwenden',
  'erlautern',
  'erläutern',
  'beschreiben',
  'erklaren',
  'erklären',
  'nennen',
  'kennen',
  'zeigen',
  'untersuchen',
  'entwickeln',
  'uberprufen',
  'überprufen',
  'uberpruefen',
  'beurteilen',
  'bewerten',
  'ordnen',
  'zuordnen',
  'vergleichen',
  'darstellen',
  'verwenden',
  'nutzen',
  'begrunden',
  'begründen',
  'herstellen',
  'ermitteln',
  'erschließen',
  'erschliessen',
]);

function buildKeywordSet(article) {
  const tokens = tokenize(article.title + ' ' + article.title);
  const keywords = article.keywords.length > 0 ? article.keywords : tokens;
  return keywords.filter((kw) => kw.length >= 3 && !STOP_WORDS.has(kw));
}

function run() {
  console.log('[generate-clean-mapping] loading articles from content-links.json...');
  const articles = loadArticles();
  console.log(`  ${articles.length} unique content items found`);

  console.log('[generate-clean-mapping] loading clean curriculum topics...');
  const topics = loadCurriculaTopics();
  console.log(`  ${topics.length} clean curriculum topics`);

  // Build normalized → topic lookup
  const topicMap = new Map();
  for (const topic of topics) {
    if (!topicMap.has(topic.normalized)) {
      topicMap.set(topic.normalized, []);
    }
    topicMap.get(topic.normalized).push(topic);
  }

  // Match: for each article, find topics whose normalized name contains article keywords
  const mapping = {};

  for (const article of articles) {
    const keywords = buildKeywordSet(article);
    if (keywords.length === 0) continue;

    for (const [normName, topicInfos] of topicMap) {
      const matchedKeywords = [];
      for (const kw of keywords) {
        if (normName.includes(kw)) {
          matchedKeywords.push(kw);
        }
      }
      if (matchedKeywords.length > 0) {
        if (!mapping[normName]) {
          mapping[normName] = [];
        }
        // Avoid duplicates
        const existing = mapping[normName].find((m) => m.url === article.url);
        if (!existing) {
          mapping[normName].push({
            type: article.type,
            title: article.title,
            url: article.url,
            matchedKeywords,
            score: matchedKeywords.length,
            states: [...new Set(topicInfos.map((t) => t.stateAbbr))],
          });
        }
      }
    }
  }

  // Sort mapping: best scored content first for each topic
  const sorted = {};
  for (const [normName, items] of Object.entries(mapping)) {
    sorted[normName] = items.sort((a, b) => b.score - a.score);
  }

  // Stats
  const totalTopics = Object.keys(sorted).length;
  const totalLinks = Object.values(sorted).flat().length;

  console.log(`\n[generate-clean-mapping] RESULTS (dry-run: ${isDryRun}):`);
  console.log(
    `  Topics matched: ${totalTopics} / ${topics.length} (${((totalTopics / topics.length) * 100).toFixed(0)}%)`
  );
  console.log(`  Total links: ${totalLinks}`);
  console.log(`  Avg links/topic: ${(totalLinks / totalTopics).toFixed(1)}`);

  // Sample matches
  console.log('\n  Sample matches:');
  const sampleKeys = Object.keys(sorted).filter((k) =>
    [
      'redoxreaktion',
      'atombau',
      'saeure',
      'kunststoff',
      'metall',
      'bindung',
      'kohlenwasserstoff',
      'periodensystem',
    ].some((t) => k.includes(t))
  );
  for (const key of sampleKeys.slice(0, 10)) {
    const items = sorted[key];
    console.log(`    ${key} (${items.length} links):`);
    items
      .slice(0, 3)
      .forEach((item) => console.log(`      [${item.type}] ${item.title} (${item.url})`));
  }

  if (!isDryRun) {
    writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2), 'utf8');
    const kb = (JSON.stringify(sorted).length / 1024).toFixed(0);
    console.log(`\n  Written to ${OUTPUT_PATH} (${kb} KB)`);
  }
}

run();

run();
