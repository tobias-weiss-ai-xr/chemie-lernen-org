#!/usr/bin/env node
/**
 * link-entities-to-curricula.mjs
 *
 * Creates directional semantic relationships between chemie :Entity nodes and
 * curriculum entities (kategorie:'lehrplan', kategorie:'lernziel'):
 *
 *   - [:COVERS_TOPIC] — entity covers a curriculum topic
 *   - [:FULFILLS]     — entity fulfills a learning objective
 *
 * Uses the same name-normalization and matching logic as
 * scripts/import-curricula.mjs for consistency.
 *
 * Usage:
 *   node scripts/link-entities-to-curricula.mjs           # real import
 *   node scripts/link-entities-to-curricula.mjs --dry-run  # preview only
 *
 * Environment: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 * Safety: Uses MERGE only — no DELETE, no DETACH.
 */

// NOTE: All queries in this file use :Entity / kategorie labels — already subset-restricted.

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Name normalization (mirrors import-curricula.mjs) ────────────────
function normalizeForLinking(name) {
  return name
    .toLowerCase()
    .replace(/[-/\s]+/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Entity fetch ─────────────────────────────────────────────────────
async function fetchChemistryEntities(session) {
  const result = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IS NOT NULL
       AND e.kategorie <> 'lehrplan'
       AND e.kategorie <> 'lernziel'
       AND e.kategorie <> 'didaktik'
     RETURN e.name AS name, e.kategorie AS kategorie
     ORDER BY e.name`
  );
  return result.records.map((r) => ({
    name: r.get('name'),
    kategorie: r.get('kategorie'),
    norm: normalizeForLinking(r.get('name')),
  }));
}

async function fetchTopics(session) {
  const result = await session.run(
    `MATCH (e:Entity {kategorie: 'lehrplan'})
     RETURN e.name AS name
     ORDER BY e.name`
  );
  return result.records.map((r) => ({
    name: r.get('name'),
    norm: normalizeForLinking(r.get('name')),
  }));
}

async function fetchLearningObjectives(session) {
  const result = await session.run(
    `MATCH (e:Entity {kategorie: 'lernziel'})
     RETURN e.name AS name
     ORDER BY e.name`
  );
  return result.records.map((r) => ({
    name: r.get('name'),
    text: r.get('name'),
    norm: normalizeForLinking(r.get('name')),
  }));
}

// ── Generic chemistry terms (excluded from partial matching) ─────────
// These words are too generic to create meaningful COVERS_TOPIC/FULFILLS
// relationships via substring matching. They can only match exactly.
const GENERIC_WORDS = new Set([
  'stoff', 'stoffe', 'reaktion', 'reaktionen',
  'chemie', 'chemisch', 'chemische', 'chemischer', 'chemischen',
  'energie', 'verfahren',
  'verbindung', 'verbindungen', 'element', 'elemente',
  'methode', 'methoden', 'prozess', 'prozesse',
  'prinzip', 'prinzipien', 'konzept', 'konzepte',
  'modell', 'modelle', 'system', 'systeme',
  'struktur', 'strukturen', 'funktion', 'funktionen',
  'eigenschaft', 'eigenschaften', 'aufgabe', 'aufgaben',
  'loesung', 'loesungen', 'nachweis', 'nachweise',
  'trennung', 'trennungen', 'wert', 'werte',
  'zahl', 'zahlen', 'groesse', 'groessen',
  'bereich', 'bereiche', 'thema', 'themen',
  // Adjective forms
  'physikalisch', 'physikalische', 'physikalischer',
  'organisch', 'organische', 'organischer', 'organischen',
  'anorganisch', 'anorganische',
  'technisch', 'technische',
  'biologisch', 'biologische',
  'qualitativ', 'qualitative', 'quantitativ', 'quantitative',
  'energetisch', 'energetische',
]);

// ── Matching logic ────────────────────────────────────────────────────

/**
 * Check if an entity name matches a topic name for COVERS_TOPIC.
 *
 * Direction: entity name must be found WITHIN the topic name (entity is the
 * more specific concept, topic is the broader curriculum area).
 * NOT the reverse — prevents "bioanorganische chemie" covering "organische".
 *
 * Strategies by name length:
 *   - Length < 5: word-boundary regex only (avoids "chrom"→"chromatographie")
 *   - Length ≥ 5: includes + word-boundary for compound matching
 *   - GENERIC_WORDS: only exact match
 *
 * Examples:
 *   "saeure" → "saeuren und laugen"       ✓ (word boundary in "saeuren")
 *   "aktivierungsenergie" → "aktivierungsenergie. prozesse in der industrie" ✓
 *   "chrom" → "chromatographie"            ✗ (<5, boundaries don't align)
 *   "bioanorganische chemie" → "organische" ✗ (entity not in topic)
 */
function coversMatch(entityNorm, topicNorm) {
  if (entityNorm.length < 4 || topicNorm.length < 3) return false;

  // Entity name must be found IN the topic name (not vice versa)
  const needle = entityNorm;
  const haystack = topicNorm;

  // Exact match
  if (needle === haystack) return true;

  // Generic words only match exactly
  if (GENERIC_WORDS.has(needle)) return false;

  // Short names (< 6 chars): require word-boundary match at both ends
  // Avoids "chrom"→"chromatografie" (both 5+ but "chrom" is a false prefix)
  if (needle.length < 6) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(haystack);
  }

  // Names 6+ chars: uses includes + word-boundary prefix matching
  // e.g. "kunststoff" in "...kunststoffe...", "alkane" in "... alkane ..."
  if (haystack.includes(needle)) return true;

  // Word-boundary compound match: entity is the start of a word in topic
  // e.g. "additionsreaktion" in "... additionsreaktionen ..."
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${escaped}`).test(haystack)) return true;

  return false;
}

/**
 * Check if entity name appears as a meaningful word in a learning objective.
 * Uses word-boundary regex matching with GENERIC_WORDS exclusion.
 */
function fulfillsMatch(entityNorm, objectiveNorm) {
  if (entityNorm.length < 4) return false;

  // Skip generic words — they produce too many false positives
  if (GENERIC_WORDS.has(entityNorm) && objectiveNorm.length > 20) return false;

  // Escape regex special chars in entity name
  const escaped = entityNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Word-boundary match: entity name appears as a discrete word
  const wordRegex = new RegExp(`\\b${escaped}\\b`);
  if (wordRegex.test(objectiveNorm)) return true;

  return false;
}

// ── Dry run ──────────────────────────────────────────────────────────
function dryRunOutput(entities, topics, objectives) {
  const lines = [];
  lines.push('// === LINK ENTITIES TO CURRICULA — DRY RUN ===');
  lines.push(`// Entities (non-curriculum): ${entities.length}`);
  lines.push(`// Topics (lehrplan): ${topics.length}`);
  lines.push(`// Objectives (lernziel): ${objectives.length}`);
  lines.push('');

  let coversCount = 0;
  const coversSamples = [];
  for (const entity of entities) {
    for (const topic of topics) {
      if (coversMatch(entity.norm, topic.norm)) {
        if (coversSamples.length < 20) {
          coversSamples.push(`// COVERS_TOPIC: "${entity.name}" → "${topic.name}"`);
        }
        coversCount++;
      }
    }
  }

  // Sort samples to show better ones first (shorter → longer, more interesting patterns)
  lines.push(...coversSamples);

  let fulfillsCount = 0;
  const fulfillsSamples = [];
  for (const entity of entities) {
    for (const obj of objectives) {
      if (fulfillsMatch(entity.norm, obj.norm)) {
        if (fulfillsSamples.length < 20) {
          fulfillsSamples.push(`// FULFILLS: "${entity.name}" → "${obj.name.substring(0, 80)}..."`);
        }
        fulfillsCount++;
      }
    }
  }
  lines.push(...fulfillsSamples);

  lines.push('');
  lines.push(`// Estimated COVERS_TOPIC relationships: ${coversCount}`);
  lines.push(`// Estimated FULFILLS relationships: ${fulfillsCount}`);
  lines.push('// === DRY RUN COMPLETE ===');

  console.log(lines.join('\n'));
  return { coversCount, fulfillsCount };
}

// ── Neo4j import ──────────────────────────────────────────────────────
async function runImport(entities, topics, objectives) {
  let neo4jDriver;
  try {
    const neo4j = await import('neo4j-driver');
    neo4jDriver = neo4j.default.driver(
      NEO4J_URI,
      neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      { connectionTimeout: 10000 }
    );
    const session = neo4jDriver.session({ database: NEO4J_DATABASE });

    let coversCreated = 0;
    let fulfillsCreated = 0;

    // Phase 1: COVERS_TOPIC — entity → topic
    console.log('Phase 1: Creating COVERS_TOPIC relationships...');
    let entityIdx = 0;
    for (const entity of entities) {
      entityIdx++;
      if (entityIdx % 50 === 0 || entityIdx === entities.length) {
        process.stdout.write(`\r  Processing entity ${entityIdx}/${entities.length}...`);
      }

      for (const topic of topics) {
        if (coversMatch(entity.norm, topic.norm)) {
          await session.run(
            `MATCH (e:Entity {name: $entityName})
             MATCH (t:Entity {name: $topicName})
             MERGE (e)-[:COVERS_TOPIC]->(t)`,
            { entityName: entity.name, topicName: topic.name }
          );
          coversCreated++;
        }
      }
    }
    console.log(`\n  COVERS_TOPIC created: ${coversCreated}`);

    // Phase 2: FULFILLS — entity → learning objective
    console.log('Phase 2: Creating FULFILLS relationships...');
    entityIdx = 0;
    for (const entity of entities) {
      entityIdx++;
      if (entityIdx % 50 === 0 || entityIdx === entities.length) {
        process.stdout.write(`\r  Processing entity ${entityIdx}/${entities.length}...`);
      }

      for (const obj of objectives) {
        if (fulfillsMatch(entity.norm, obj.norm)) {
          await session.run(
            `MATCH (e:Entity {name: $entityName})
             MATCH (o:Entity {name: $objName})
             MERGE (e)-[:FULFILLS]->(o)`,
            { entityName: entity.name, objName: obj.name }
          );
          fulfillsCreated++;
        }
      }
    }
    console.log(`\n  FULFILLS created: ${fulfillsCreated}`);

    await session.close();
    await neo4jDriver.close();

    console.log(`\nImport complete.`);
    console.log(`  COVERS_TOPIC: ${coversCreated}`);
    console.log(`  FULFILLS:     ${fulfillsCreated}`);
    console.log(`\n✓ Success`);
  } catch (err) {
    if (neo4jDriver) {
      try { await neo4jDriver.close(); } catch { /* ignore */ }
    }
    console.error(`\nImport failed: ${err.message}`);
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Link Entities to Curricula ===\n');

  let entities, topics, objectives;
  let neo4jDriver;
  try {
    const neo4j = await import('neo4j-driver');
    neo4jDriver = neo4j.default.driver(
      NEO4J_URI,
      neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      { connectionTimeout: 10000 }
    );
    const session = neo4jDriver.session({ database: NEO4J_DATABASE });

    console.log('Fetching chemistry entities...');
    entities = await fetchChemistryEntities(session);
    console.log(`  ${entities.length} entities found`);

    console.log('Fetching curriculum topics...');
    topics = await fetchTopics(session);
    console.log(`  ${topics.length} topics found`);

    console.log('Fetching learning objectives...');
    objectives = await fetchLearningObjectives(session);
    console.log(`  ${objectives.length} learning objectives found\n`);

    await session.close();
    await neo4jDriver.close();
  } catch (err) {
    if (neo4jDriver) {
      try { await neo4jDriver.close(); } catch { /* ignore */ }
    }
    console.error(`Failed to connect: ${err.message}`);
    process.exit(1);
  }

  if (DRY_RUN) {
    dryRunOutput(entities, topics, objectives);
    process.exit(0);
  }

  await runImport(entities, topics, objectives);
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
