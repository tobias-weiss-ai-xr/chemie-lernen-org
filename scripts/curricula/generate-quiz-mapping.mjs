#!/usr/bin/env node
/**
 * generate-quiz-mapping.mjs
 * Maps cloze exercise categories to curriculum topics.
 * This allows showing "Passende Übungen" on entity detail pages.
 *
 * Usage: node scripts/curricula/generate-quiz-mapping.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../myhugoapp/data/curricula');

// Cloze categories → normalized topic keywords
const QUIZ_MAP = [
  { category: 'atom', label: 'Atommodelle und Kernchemie', keywords: ['atom', 'kernchemie', 'radioaktivität', 'kern', 'isotop'] },
  { category: 'bindungen', label: 'Chemische Bindungen', keywords: ['bindung', 'bindungen', 'molekül', 'orbital', 'hybridisierung'] },
  { category: 'saeuren-basen', label: 'Säuren und Basen', keywords: ['säure', 'base', 'ph-wert', 'neutralisation', 'saeure', 'titration'] },
  { category: 'redox', label: 'Redoxreaktionen', keywords: ['redox', 'oxidation', 'reduktion', 'elektrochemie', 'spannungsreihe', 'elektrolyse'] },
  { category: 'stoechiometrie', label: 'Stöchiometrie', keywords: ['stöchiometrie', 'stoechiometrie', 'mol', 'molar', 'stoffmenge'] },
  { category: 'organik', label: 'Organische Chemie', keywords: ['organisch', 'kohlenwasserstoff', 'alkohol', 'aldehyd', 'carbonsäure', 'polymer', 'kunststoff'] },
  { category: 'pse', label: 'Periodensystem', keywords: ['periodensystem', 'pse', 'element', 'hauptgruppe', 'periode'] },
];

// Load content-links.json to find matching curriculum topics
const linksPath = resolve(DATA_DIR, 'content-links.json');
const raw = readFileSync(linksPath, 'utf-8');
const topicLinks = JSON.parse(raw);

// For each quiz category, find matching curriculum topics
const result = [];

for (const quiz of QUIZ_MAP) {
  const matchingTopics = [];

  for (const [topicName] of Object.entries(topicLinks)) {
    const t = topicName.toLowerCase();
    for (const kw of quiz.keywords) {
      if (t.includes(kw)) {
        matchingTopics.push(topicName);
        break;
      }
    }
  }

  result.push({
    category: quiz.category,
    label: quiz.label,
    url: '/lueckentexte/',
    topicCount: matchingTopics.length,
    exampleTopics: matchingTopics.slice(0, 5),
  });
}

const outPath = resolve(DATA_DIR, 'quiz-mapping.json');
writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Quiz mapping generated: ${result.length} categories`);
for (const q of result) {
  console.log(`  ${q.category} (${q.label}): ${q.topicCount} topics → ${q.exampleTopics.join(', ')}`);
}
