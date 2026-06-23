#!/usr/bin/env node
/**
 * Import KMK didactic guidelines into Neo4j as :Entity {kategorie: 'didaktik'}.
 *
 * Reads myhugoapp/data/didaktik/didaktik.json and creates entities for each
 * KMK guideline. Links guidelines to matching curriculum topics (lehrplan entities)
 * by keyword overlap.
 *
 * Usage:
 *   node scripts/import-didaktik.mjs                  # real run
 *   NEO4J_PASSWORD=... node scripts/import-didaktik.mjs
 *   node scripts/import-didaktik.mjs --dry-run         # print only
 *
 * Safety: uses MERGE only, no DETACH DELETE.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import neo4j from 'neo4j-driver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DIDAKTIK_JSON = path.join(REPO_ROOT, 'myhugoapp/data/didaktik/didaktik.json');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';

const CLAIMED_TITLES = [
  'Bildungsstandards im Fach Chemie für den Mittleren Schulabschluss (2004)',
  'Weiterentwickelte Bildungsstandards Chemie MSA (2024)',
  'Bildungsstandards im Fach Chemie für die Allgemeine Hochschulreife (2020)',
  'Kerncurriculum Chemie für die gymnasiale Oberstufe \u2014 Deutsche Schulen im Ausland',
  'Implementation der weiterentwickelten Bildungsstandards Naturwissenschaften (2024)',
];

/**
 * Slugify a name for entity.name storage.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[–—\-/\s]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

/**
 * Extract salient keywords from a title for matching to curriculum topics.
 */
function extractKeywords(title) {
  const stopwords = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines',
    'im', 'am', 'zum', 'zur', 'für', 'auf', 'bei', 'mit', 'von', 'und', 'oder',
    'als', 'in', 'an', 'aus', 'nach', 'vor', 'durch', 'über', 'unter', 'zwischen',
    'nicht', 'sich', 'auch', 'ist', 'wird', 'werden', 'wurde', 'haben', 'hat',
    'sowie', 'naturwissenschaften', 'naturwissenschaftlicher', 'naturwissenschaftliche',
    'chemie', 'kompetenzen', 'kompetenzbereiche', 'unterricht',
  ]);
  // Remove parenthetical year info
  const cleaned = title
    .replace(/\(\d{4}\)|\(\d{4},\s*[^)]+\)/g, '')
    .replace(/[–—\-/\s]+/g, ' ')
    .replace(/[.,;:!?()]/g, '');
  const words = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.has(w))
    .map((w) => w.replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/[ß]/g, 'ss'));
  return [...new Set(words)];
}

// Linking rules: for each guideline, specify curriculum topic keywords to match
const LINKING_RULES = [
  {
    name: 'bildungsstandards-im-fach-chemie-fuer-den-mittleren-schulabschluss-2004',
    // MSA (Sek I) standards → match broad topics
    keywords: ['chemische reaktion', 'stoff', 'element', 'salz', 'ion', 'saeure', 'base', 'metall'],
    curriculumFilter: null,
  },
  {
    name: 'weiterentwickelte-bildungsstandards-chemie-msa-2024',
    keywords: ['chemische reaktion', 'stoff', 'element', 'salz', 'ion', 'saeure', 'base', 'metall'],
    curriculumFilter: null,
  },
  {
    name: 'bildungsstandards-im-fach-chemie-fuer-die-allgemeine-hochschulreife-2020',
    // AHR (Sek II) → match upper-level topics
    keywords: ['gleichgewicht', 'saeure', 'base', 'elektro', 'redox', 'organisch', 'kunststoff', 'aromaten'],
    curriculumFilter: null,
  },
  {
    name: 'kerncurriculum-chemie-fuer-die-gymnasiale-oberstufe-deutsche-schulen-im-ausland',
    keywords: ['gleichgewicht', 'saeure', 'base', 'elektro', 'redox', 'organisch'],
    curriculumFilter: null,
  },
  {
    name: 'implementation-der-weiterentwickelten-bildungsstandards-naturwissenschaften-2024',
    // Implementation brochure → links broadly
    keywords: ['chemische reaktion', 'stoff', 'element', 'saeure', 'base', 'gleichgewicht', 'redox', 'metall', 'salz'],
    curriculumFilter: null,
  },
];

// ── Load didaktik data ────────────────────────────────────────────────
function loadDidaktik() {
  const raw = JSON.parse(fs.readFileSync(DIDAKTIK_JSON, 'utf8'));
  return raw.guidelines || [];
}

// ── Cypher queries ────────────────────────────────────────────────────
const MERGE_GUIDELINE = `
  MERGE (e:Entity {name: $name})
  SET e.kategorie = 'didaktik',
      e.didaktik_type = $didaktikType,
      e.didaktik_source = $didaktikSource,
      e.didaktik_url = $didaktikUrl,
      e.didaktik_section_count = $sectionCount
  RETURN e.name AS name
`;

const MATCH_LEHRPLAN_BY_KEYWORD = `
  MATCH (t:Entity {kategorie: 'lehrplan'})
  WHERE toLower(t.name) CONTAINS $keyword
  RETURN t.name AS name
  LIMIT 10
`;

const MERGE_RELATED = `
  MATCH (a:Entity {name: $guideline, kategorie: 'didaktik'})
  MATCH (b:Entity {name: $topic, kategorie: 'lehrplan'})
  MERGE (a)-[:RELATED_TO {weight: $weight, auto: true}]->(b)
  MERGE (b)-[:RELATED_TO {weight: $weight, auto: true}]->(a)
  RETURN a.name, b.name
`;

function generateDryRun(guidelines) {
  console.log('=== DRY RUN ===\n');
  const statements = [];
  for (const g of guidelines) {
    const name = slugify(g.title);
    const keywords = extractKeywords(g.title);
    console.log(`MERGE :Entity {kategorie:'didaktik', name:'${name}'}`);
    console.log(`  Title: ${g.title}`);
    console.log(`  Type: ${g.source_type}, Institution: ${g.institution}`);
    console.log(`  Sections: ${g.sections.length}`);
    console.log(`  Keywords: ${keywords.join(', ')}`);
    console.log();
    statements.push({ name, type: 'didaktik' });
  }
  console.log(`Total: ${statements.length} didaktik entities to MERGE\n`);
  return statements;
}

function slugifyName(name) {
  return name
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[–—\-/\s]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const guidelines = loadDidaktik();
  console.log(`Loaded ${guidelines.length} didaktik guidelines from ${DIDAKTIK_JSON}\n`);

  if (isDryRun) {
    generateDryRun(guidelines);
    return;
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });
  const session = driver.session();
  let createdCount = 0;

  try {
    // Phase 1: MERGE guideline entities
    console.log('=== Phase 1: Import guidelines ===');
    for (const g of guidelines) {
      const name = slugify(g.title);
      const params = {
        name,
        didaktikType: g.source_type || 'KMK',
        didaktikSource: g.institution || 'KMK',
        didaktikUrl: g.url || '',
        sectionCount: g.sections ? g.sections.length : 0,
      };
      const result = await session.run(MERGE_GUIDELINE, params);
      console.log(`  MERGE: ${name} (${g.title.slice(0, 60)}...)`);
      createdCount++;
    }
    console.log(`  ${createdCount} guideline(s) created\n`);

    // Phase 2: Link to curriculum topics
    console.log('=== Phase 2: Link to curriculum topics ===');
    let linkCount = 0;
    for (const rule of LINKING_RULES) {
      for (const keyword of rule.keywords) {
        const result = await session.run(MATCH_LEHRPLAN_BY_KEYWORD, { keyword });
        const topics = result.records.map((r) => r.get('name'));
        if (topics.length === 0) continue;
        // Try normalizing keyword too: replace hyphens with spaces
        const keywordSpaced = keyword.replace(/-/g, ' ');
        let result2 = [];
        if (keywordSpaced !== keyword) {
          result2 = (await session.run(MATCH_LEHRPLAN_BY_KEYWORD, { keyword: keywordSpaced })).records.map((r) => r.get('name'));
        }
        const allTopics = [...new Set([...topics, ...result2])];
        for (const topic of allTopics) {
          await session.run(MERGE_RELATED, {
            guideline: rule.name,
            topic,
            weight: 1,
          });
          linkCount++;
          console.log(`  LINK: ${rule.name} <-> ${topic} (via keyword '${keyword}')`);
        }
      }
    }
    console.log(`  ${linkCount} link(s) created\n`);
    console.log('Done.');
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
