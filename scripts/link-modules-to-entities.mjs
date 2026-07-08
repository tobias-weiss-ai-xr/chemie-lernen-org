#!/usr/bin/env node
/**
 * link-modules-to-entities.mjs
 *
 * Creates cross-subset [:TEACHES] relationships between UniversityModule
 * nodes and chemistry Entity nodes.
 *
 * For each module, tokenizes learning_outcomes and content, then looks
 * up matching Entity names in the chemie subset. This follows
 * REQ-MH-8 in openspec/specs/modulhandbuch-university/spec.md.
 *
 * Usage:
 *   node scripts/link-modules-to-entities.mjs
 *   node scripts/link-modules-to-entities.mjs --dry-run
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');
// ── Normalization ────────────────────────────────────────────────────

function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[-/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generic chemistry-adjacent words to exclude from entity matching
const GENERIC_WORDS = new Set([
  'chemie', 'chemistry', 'chemical', 'chemisch', 'chemische',
  'organisch', 'organic', 'inorganic', 'anorganisch',
  'physikalisch', 'physical', 'physic',
  'biochemie', 'biochemistry',
  'analytisch', 'analytical', 'analytic',
  'theoretisch', 'theoretical',
  'technisch', 'technical',
  'allgemein', 'general', 'basic',
  'advanced', 'vertiefung',
  'labor', 'lab', 'praktikum',
  'seminar', 'lecture', 'vorlesung',
  'uebung', 'exercise', 'tutorial',
  'experiment', 'experimental',
  'molekular', 'molecular',
  'quantum', 'quanten',
  'struktur', 'structure',
  'reaktion', 'reaction',
  'synthese', 'synthesis',
  'katalyse', 'catalysis',
  'spektroskopie', 'spectroscopy',
  'thermodynamik', 'thermodynamics',
  'kinetik', 'kinetics',
  'verfahren', 'process', 'method',
  'modul', 'module', 'course', 'kurs',
  'einfuehrung', 'introduction', 'intro', 'grundlagen', 'foundation',
  'prinzipien', 'principles', 'konzepte', 'concepts',
  'biologisch', 'biological',
  'makromolekular', 'macromolecular',
  'polymer', 'polymere',
]);

// ── Matching logic ───────────────────────────────────────────────────


/**
 * Check if an entity name appears in module text (learning_outcomes, content, or module_name).
 *
 * - 3-5 char entity names: require whole-word boundary (prevents "Mol" matching "Molecular")
 * - 6+ char entity names: require word-boundary at start (prevents "Anorganische" matching "organische")
 */
function entityMatchesModuleText(entityName, moduleTexts) {
  const en = normalize(entityName);
  if (en.length < 3) return false;
  if (GENERIC_WORDS.has(en)) return false;

  const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (const txt of moduleTexts) {
    const tn = normalize(txt);
    if (!tn) continue;

    if (en.length <= 5) {
      // Short entity names: word boundary both sides (prevents "mol" in "molecular")
      const re = new RegExp(`\\b${escaped}\\b`);
      if (re.test(tn)) return true;
      continue;
    }

    // Longer names: require word boundary at start (prevents "organische" in "anorganische")
    const re = new RegExp(`(^|\\s)${escaped}`);
    if (re.test(tn)) return true;
  }
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('=== link-modules-to-entities.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN: ${DRY_RUN}\n`);

  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    { connectionTimeout: 30000, maxConnectionLifetime: 300000 }
  );

  try {
    // ── Load entities ──────────────────────────────────────────────
    console.log('Loading Entity nodes...');
    let entityRecords;
    {
      const s = driver.session({ database: NEO4J_DATABASE });
      try {
        const r = await s.run(
          `MATCH (e:Entity)
           WHERE e.kategorie IS NOT NULL
             AND e.kategorie <> 'lehrplan'
             AND e.kategorie <> 'lernziel'
             AND e.kategorie <> 'didaktik'
           RETURN e.name AS name
           ORDER BY e.name`
        );
        entityRecords = r.records.map((rec) => ({
          name: rec.get('name'),
          norm: normalize(rec.get('name')),
        }));
      } finally {
        await s.close();
      }
    }
    console.log(`Entities: ${entityRecords.length}\n`);

    // ── Load modules ───────────────────────────────────────────────
    console.log('Loading UniversityModule nodes...');
    let moduleRecords;
    {
      const s = driver.session({ database: NEO4J_DATABASE });
      try {
        const r = await s.run(
          `MATCH (m:UniversityModule)
           RETURN m.module_code AS code,
                  m.university AS uni,
                  m.module_name AS name,
                  m.learning_outcomes AS outcomes,
                  m.content AS content
           ORDER BY m.university, m.module_code`
        );
        moduleRecords = r.records.map((rec) => ({
          code: rec.get('code'),
          uni: rec.get('uni'),
          name: rec.get('name'),
          outcomes: rec.get('outcomes') || [],
          content: rec.get('content') || [],
        }));
      } finally {
        await s.close();
      }
    }
    console.log(`Modules: ${moduleRecords.length}\n`);

    // ── Dry run ────────────────────────────────────────────────────
    if (DRY_RUN) {
      console.log('=== DRY RUN — Scanning for TEACHES candidates ===\n');
      let totalLinks = 0;
      const samples = [];

      for (const mod of moduleRecords) {
        const texts = [mod.name, ...mod.outcomes, ...mod.content];
        const matchedEntities = [];

        for (const entity of entityRecords) {
          if (entityMatchesModuleText(entity.name, texts)) {
            matchedEntities.push(entity.name);
          }
        }

        if (matchedEntities.length > 0) {
          totalLinks += matchedEntities.length;
          if (samples.length < 20) {
            samples.push(
              `${mod.uni}/${mod.code} (${mod.name}) → ${matchedEntities.length} entities: ${matchedEntities.slice(0, 5).join(', ')}${matchedEntities.length > 5 ? '...' : ''}`
            );
          }
        }
      }

      console.log('Sample TEACHES links (module → entity):');
      samples.forEach((s) => console.log(`  ${s}`));
      console.log(`\nEstimated TEACHES relationships: ${totalLinks}`);
      console.log(`Note: Many modules won't have TEACHES (English modules → German entity names)`);
      return;
    }

    // ── Create TEACHES relationships ───────────────────────────────
    console.log('=== Creating TEACHES relationships ===');
    let created = 0;
    let skippedModules = 0;

    for (let i = 0; i < moduleRecords.length; i++) {
      const mod = moduleRecords[i];
      const texts = [mod.name, ...mod.outcomes, ...mod.content];
      const matchedEntities = [];

      for (const entity of entityRecords) {
        if (entityMatchesModuleText(entity.name, texts)) {
          matchedEntities.push(entity.name);
        }
      }

      if (matchedEntities.length === 0) {
        skippedModules++;
        if (i % 50 === 0 || i === moduleRecords.length - 1) {
          process.stdout.write(`\r  Module ${i + 1}/${moduleRecords.length}... (${created} links, ${skippedModules} skipped)`);
        }
        continue;
      }

      const s = driver.session({ database: NEO4J_DATABASE });
      try {
        for (const entityName of matchedEntities) {
          await s.run(
            `MATCH (m:UniversityModule {module_code: $code, university: $uni})
             MATCH (e:Entity {name: $entityName})
             MERGE (m)-[:TEACHES]->(e)`,
            { code: mod.code, uni: mod.uni, entityName }
          );
          created++;
        }
      } catch (err) {
        console.error(`\n  Error linking ${mod.uni}/${mod.code}: ${err.message}`);
      } finally {
        await s.close();
      }

      if (i % 10 === 0 || i === moduleRecords.length - 1) {
        process.stdout.write(`\r  Module ${i + 1}/${moduleRecords.length}... (${created} links, ${skippedModules} skipped)`);
      }
    }

    console.log(`\n\nTEACHES created: ${created}`);
    console.log(`Modules with no match: ${skippedModules}`);
    console.log('Done.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
