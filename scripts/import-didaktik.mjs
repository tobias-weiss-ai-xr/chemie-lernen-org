#!/usr/bin/env node
/**
 * Import KMK didactic guidelines into Neo4j as typed labels.
 *
 * Reads myhugoapp/data/didaktik/didaktik.json and creates:
 *   - :DidacticGuideline nodes (5 KMK guidelines per REQ-LP-5)
 *   - :GuidelineSection nodes with :HAS_SECTION relationships
 *   - :RELATED_TO links to curriculum topics (keyword-based)
 *
 * Schema per openspec/specs/lehrplan-curriculum/spec.md REQ-LP-2/3:
 *   :DidacticGuideline {title, source_type, institution, url}
 *   :GuidelineSection {title, order}
 *   -[:HAS_SECTION]-> from guideline to section
 *   -[:RELATED_TO {weight, auto}]-> to curriculum topics
 *
 * Idempotent: uses MERGE only. Never DETACH DELETE.
 * Exits 0 on partial success.
 *
 * Usage:
 *   node scripts/import-didaktik.mjs
 *   NEO4J_PASSWORD=... node scripts/import-didaktik.mjs
 *   node scripts/import-didaktik.mjs --dry-run
 *   node scripts/import-didaktik.mjs --file path/to/didaktik.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import neo4j from 'neo4j-driver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_JSON = path.join(REPO_ROOT, 'myhugoapp/data/didaktik/didaktik.json');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const fileArg = args.find((a) => a.startsWith('--file='));
const DIDAKTIK_JSON = fileArg ? fileArg.slice('--file='.length) : DEFAULT_JSON;

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Slugify a title for use as a merge key.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[–—/\s-]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

/**
 * Load didaktik data from JSON file.
 */
function loadDidaktik(filepath) {
  const raw = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  return raw.guidelines || [];
}

/**
 * Recursively flatten sections into a flat list with order indices.
 */
function flattenSections(sections, baseOrder) {
  const result = [];
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const order = baseOrder !== undefined ? `${baseOrder}.${i + 1}` : `${i + 1}`;
    result.push({ title: sec.title || '', content: sec.content || [], order });
    if (sec.subsections && sec.subsections.length > 0) {
      result.push(...flattenSections(sec.subsections, order));
    }
  }
  return result;
}

// ── Phase 1: MERGE :DidacticGuideline + :GuidelineSection ────────────

async function importGuidelines(session, guidelines) {
  let guidelineCount = 0;
  let sectionCount = 0;

  for (const g of guidelines) {
    const name = slugify(g.title);
    const sections = g.sections || [];
    const flatSections = flattenSections(sections);

    // MERGE the guideline node with typed label
    await session.run(
      `MERGE (dg:DidacticGuideline {name: $name})
       ON CREATE SET dg.title = $title,
                   dg.source_type = $sourceType,
                   dg.institution = $institution,
                   dg.url = $url,
                   dg.section_count = $sectionCount,
                   dg.last_checked = $lastChecked
       ON MATCH SET dg.title = $title,
                   dg.source_type = $sourceType,
                   dg.institution = $institution,
                   dg.url = $url,
                   dg.section_count = $sectionCount,
                   dg.last_checked = $lastChecked
       RETURN dg.name AS name`,
      {
        name,
        title: g.title,
        sourceType: g.source_type || 'KMK',
        institution: g.institution || 'Kultusministerkonferenz (KMK)',
        url: g.url || '',
        sectionCount: flatSections.length,
        lastChecked: g.last_checked || new Date().toISOString().slice(0, 10),
      }
    );
    guidelineCount++;
    console.log(`  MERGE :DidacticGuideline {name:'${name}'} (${g.title.slice(0, 60)}...)`);

    // MERGE sections with :HAS_SECTION relationship
    for (const sec of flatSections) {
      const secName = slugify(`${g.title}--${sec.order}--${sec.title}`);
      await session.run(
        `MATCH (dg:DidacticGuideline {name: $gName})
         MERGE (gs:GuidelineSection {name: $secName})
         ON CREATE SET gs.title = $secTitle,
                     gs.order = $order,
                     gs.guideline = $gName
         ON MATCH SET gs.title = $secTitle,
                     gs.order = $order,
                     gs.guideline = $gName
         WITH dg, gs
         MERGE (dg)-[:HAS_SECTION]->(gs)
         RETURN gs.name AS name`,
        {
          gName: name,
          secName,
          secTitle: sec.title,
          order: sec.order,
        }
      );
      sectionCount++;
    }
    if (flatSections.length > 0) {
      console.log(`    → ${flatSections.length} :GuidelineSection nodes`);
    }
  }

  return { guidelineCount, sectionCount };
}

// ── Phase 2: Link guidelines to curriculum topics ─────────────────────

const LINKING_RULES = [
  {
    name: 'bildungsstandards-im-fach-chemie-fuer-den-mittleren-schulabschluss-2004',
    keywords: [
      'chemische reaktion',
      'stoff',
      'element',
      'salz',
      'ion',
      'säure',
      'base',
      'metall',
      'chemie',
    ],
  },
  {
    name: 'weiterentwickelte-bildungsstandards-chemie-msa-2024',
    keywords: [
      'chemische reaktion',
      'stoff',
      'element',
      'salz',
      'ion',
      'säure',
      'base',
      'metall',
      'chemie',
    ],
  },
  {
    name: 'bildungsstandards-im-fach-chemie-fuer-die-allgemeine-hochschulreife-2020',
    keywords: [
      'gleichgewicht',
      'säure',
      'base',
      'elektro',
      'redox',
      'organisch',
      'kunststoff',
      'aromaten',
      'chemie',
    ],
  },
  {
    name: 'kerncurriculum-chemie-fuer-die-gymnasiale-oberstufe-deutsche-schulen-im-ausland',
    keywords: ['gleichgewicht', 'säure', 'base', 'elektro', 'redox', 'organisch', 'chemie'],
  },
  {
    name: 'implementation-der-weiterentwickelten-bildungsstandards-naturwissenschaften-2024',
    keywords: [
      'chemische reaktion',
      'stoff',
      'element',
      'säure',
      'base',
      'gleichgewicht',
      'redox',
      'metall',
      'salz',
      'chemie',
    ],
  },
];

async function linkToCurriculumTopics(session) {
  let linkCount = 0;

  for (const rule of LINKING_RULES) {
    for (const keyword of rule.keywords) {
      // Primary keyword search (hyphenated)
      const result = await session.run(
        `MATCH (t:Entity)
         WHERE t.kategorie = 'lehrplan' AND toLower(t.name) CONTAINS $keyword
         RETURN t.name AS name LIMIT 10`,
        { keyword }
      );
      let topics = result.records.map((r) => r.get('name'));

      // Also try spaced variant
      const keywordSpaced = keyword.replace(/-/g, ' ');
      if (keywordSpaced !== keyword) {
        const result2 = await session.run(
          `MATCH (t:Entity)
           WHERE t.kategorie = 'lehrplan' AND toLower(t.name) CONTAINS $keyword
           RETURN t.name AS name LIMIT 10`,
          { keyword: keywordSpaced }
        );
        topics = [...topics, ...result2.records.map((r) => r.get('name'))];
      }

      const uniqueTopics = [...new Set(topics)];
      for (const topic of uniqueTopics) {
        await session.run(
          `MATCH (dg:DidacticGuideline {name: $guideline})
           MATCH (t:Entity {name: $topic})
           MERGE (dg)-[:RELATED_TO {weight: 1, auto: true}]->(t)
           MERGE (t)-[:RELATED_TO {weight: 1, auto: true}]->(dg)`,
          { guideline: rule.name, topic }
        );
        linkCount++;
        console.log(`  LINK: ${rule.name} <-> ${topic} (via '${keyword}')`);
      }
    }
  }

  return linkCount;
}

// ── Dry run ──────────────────────────────────────────────────────────

function generateDryRun(guidelines) {
  console.log('=== DRY RUN ===\n');
  let totalSections = 0;
  for (const g of guidelines) {
    const name = slugify(g.title);
    const flatSections = flattenSections(g.sections || []);
    totalSections += flatSections.length;

    console.log(`MERGE :DidacticGuideline {name:'${name}'}`);
    console.log(`  title: ${g.title}`);
    console.log(`  source_type: ${g.source_type}, institution: ${g.institution}`);
    console.log(`  sections: ${flatSections.length}`);
    for (const sec of flatSections.slice(0, 3)) {
      console.log(`    [${sec.order}] ${sec.title}`);
    }
    if (flatSections.length > 3) {
      console.log(`    ... and ${flatSections.length - 3} more`);
    }
    console.log();
  }

  console.log(
    `Total: ${guidelines.length} :DidacticGuideline + ${totalSections} :GuidelineSection nodes\n`
  );
  console.log(
    `Linking rules: ${LINKING_RULES.length} guideline → curriculum topic keyword mappings`
  );
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== import-didaktik.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DIDAKTIK_JSON: ${DIDAKTIK_JSON}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);
  console.log();

  const guidelines = loadDidaktik(DIDAKTIK_JSON);
  console.log(`Loaded ${guidelines.length} didaktik guidelines\n`);

  if (DRY_RUN) {
    generateDryRun(guidelines);
    return;
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    // Phase 1: Import guidelines + sections
    console.log('=== Phase 1: Import :DidacticGuideline + :GuidelineSection ===');
    const session = driver.session({ database: NEO4J_DATABASE });
    try {
      const { guidelineCount, sectionCount } = await importGuidelines(session, guidelines);
      console.log(`  ${guidelineCount} guideline(s), ${sectionCount} section(s)\n`);
    } finally {
      await session.close();
    }

    // Phase 2: Link to curriculum topics
    console.log('=== Phase 2: Link to curriculum topics ===');
    const session2 = driver.session({ database: NEO4J_DATABASE });
    try {
      const linkCount = await linkToCurriculumTopics(session2);
      console.log(`  ${linkCount} link(s) created\n`);
    } finally {
      await session2.close();
    }

    console.log('Done.');
  } catch (err) {
    console.error('Import error (continuing to exit 0):', err.message);
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
