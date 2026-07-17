#!/usr/bin/env node
/**
 * link-entities-to-curricula.mjs — Schema B (Sprint 28+)
 *
 * Creates directional semantic relationships between chemistry :Entity nodes
 * and curriculum nodes:
 *
 *   - [:COVERS_TOPIC]         — entity covers a :SubTopic (by title match)
 *   - [:FULFILLS_OBJECTIVE]   — entity fulfills a :LearningObjective (text-similarity)
 *
 * Schema: openspec/specs/lehrplan-curriculum/spec.md REQ-LP-3 (Schema B)
 * Safety: MERGE only, no DELETE, no DETACH. Exits 0 on partial.
 *
 * Usage:
 *   node scripts/link-entities-to-curricula.mjs
 *   node scripts/link-entities-to-curricula.mjs --dry-run
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Name normalization ────────────────────────────────────────────────
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

// ── Generic chemistry terms (excluded from partial matching) ────────────
const GENERIC_WORDS = new Set([
  'stoff',
  'stoffe',
  'reaktion',
  'reaktionen',
  'chemie',
  'chemisch',
  'chemische',
  'chemischer',
  'chemischen',
  'energie',
  'verfahren',
  'verbindung',
  'verbindungen',
  'element',
  'elemente',
  'methode',
  'methoden',
  'prozess',
  'prozesse',
  'prinzip',
  'prinzipien',
  'konzept',
  'konzepte',
  'modell',
  'modelle',
  'system',
  'systeme',
  'struktur',
  'strukturen',
  'funktion',
  'funktionen',
  'eigenschaft',
  'eigenschaften',
  'aufgabe',
  'aufgaben',
  'loesung',
  'loesungen',
  'nachweis',
  'nachweise',
  'trennung',
  'trennungen',
  'wert',
  'werte',
  'zahl',
  'zahlen',
  'groesse',
  'groessen',
  'bereich',
  'bereiche',
  'thema',
  'themen',
  'physikalisch',
  'physikalische',
  'physikalischer',
  'organisch',
  'organische',
  'organischer',
  'organischen',
  'anorganisch',
  'anorganische',
  'technisch',
  'technische',
  'biologisch',
  'biologische',
  'qualitativ',
  'qualitative',
  'quantitativ',
  'quantitative',
  'energetisch',
  'energetische',
]);

// ── Matching logic ────────────────────────────────────────────────────────

function coversMatch(entityNorm, topicNorm) {
  if (entityNorm.length < 4 || topicNorm.length < 3) return false;
  const needle = entityNorm;
  const haystack = topicNorm;
  if (needle === haystack) return true;
  if (GENERIC_WORDS.has(needle)) return false;
  if (needle.length < 6) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(haystack);
  }
  if (haystack.includes(needle)) return true;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${escaped}`).test(haystack)) return true;
  return false;
}

function fulfillsMatch(entityNorm, objectiveNorm) {
  if (entityNorm.length < 4) return false;
  if (GENERIC_WORDS.has(entityNorm) && objectiveNorm.length > 20) return false;
  const escaped = entityNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(objectiveNorm);
}

// ── Dry run ──────────────────────────────────────────────────────────

function dryRunOutput(entities, subTopics, objectives) {
  let coversCount = 0;
  let fulfillsCount = 0;

  console.log('=== LINK ENTITIES TO CURRICULA — DRY RUN ===');
  console.log(
    `Entities: ${entities.length}, SubTopics: ${subTopics.length}, LOs: ${objectives.length}\n`
  );

  const coversSamples = [];
  for (const entity of entities) {
    for (const subtopic of subTopics) {
      if (coversMatch(entity.norm, subtopic.norm)) {
        if (coversSamples.length < 15) {
          coversSamples.push(`COVERS_TOPIC: "${entity.name}" → SubTopic "${subtopic.title}"`);
        }
        coversCount++;
      }
    }
  }

  const fulfillsSamples = [];
  for (const entity of entities) {
    for (const obj of objectives) {
      if (fulfillsMatch(entity.norm, obj.norm)) {
        if (fulfillsSamples.length < 15) {
          fulfillsSamples.push(
            `FULFILLS_OBJECTIVE: "${entity.name}" → LO "${obj.text.slice(0, 60)}..."`
          );
        }
        fulfillsCount++;
      }
    }
  }

  console.log('Sample COVERS_TOPIC:');
  coversSamples.forEach((s) => console.log(`  ${s}`));
  console.log(`\nSample FULFILLS_OBJECTIVE:`);
  fulfillsSamples.forEach((s) => console.log(`  ${s}`));
  console.log(`\nEstimated: ${coversCount} COVERS_TOPIC, ${fulfillsCount} FULFILLS_OBJECTIVE`);
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== link-entities-to-curricula.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN: ${DRY_RUN}\n`);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    // Fetch all node types
    const session = driver.session({ database: NEO4J_DATABASE });
    try {
      const entityResult = await session.run(
        `MATCH (e:Entity)
         WHERE e.kategorie IS NOT NULL
           AND e.kategorie <> 'lehrplan'
           AND e.kategorie <> 'lernziel'
           AND e.kategorie <> 'didaktik'
         RETURN e.name AS name, e.kategorie AS kategorie
         ORDER BY e.name`
      );
      const entities = entityResult.records.map((r) => ({
        name: r.get('name'),
        kategorie: r.get('kategorie'),
        norm: normalizeForLinking(r.get('name')),
      }));
      console.log(`Entities: ${entities.length}`);

      const subTopicResult = await session.run(
        `MATCH (st:SubTopic) RETURN st.slug AS slug, st.title AS title ORDER BY st.slug`
      );
      const subTopics = subTopicResult.records.map((r) => ({
        slug: r.get('slug'),
        title: r.get('title'),
        norm: normalizeForLinking(r.get('title')),
      }));
      console.log(`SubTopics: ${subTopics.length}`);

      const loResult = await session.run(
        `MATCH (lo:LearningObjective) RETURN lo.slug AS slug, lo.text AS text ORDER BY lo.slug LIMIT 5000`
      );
      const objectives = loResult.records.map((r) => ({
        slug: r.get('slug'),
        text: r.get('text'),
        norm: normalizeForLinking(r.get('text')),
      }));
      console.log(`LearningObjectives: ${objectives.length}\n`);

      if (DRY_RUN) {
        dryRunOutput(entities, subTopics, objectives);
        return;
      }

      // Phase 1: COVERS_TOPIC — entity → subtopic (Schema B)
      console.log('=== Phase 1: COVERS_TOPIC (Entity → SubTopic) ===');
      let coversCreated = 0;
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (i % 100 === 0 || i === entities.length - 1) {
          process.stdout.write(`\r  Entity ${i + 1}/${entities.length}...`);
        }
        for (const subtopic of subTopics) {
          if (coversMatch(entity.norm, subtopic.norm)) {
            await session.run(
              `MATCH (e:Entity {name: $entityName})
               MATCH (st:SubTopic {slug: $subtopicSlug})
               MERGE (e)-[:COVERS_TOPIC]->(st)`,
              { entityName: entity.name, subtopicSlug: subtopic.slug }
            );
            coversCreated++;
          }
        }
      }
      console.log(`\n  COVERS_TOPIC (Entity→SubTopic): ${coversCreated}\n`);

      // Phase 2: FULFILLS_OBJECTIVE — entity → learning objective (Schema B)
      console.log('=== Phase 2: FULFILLS_OBJECTIVE (Entity → LearningObjective) ===');
      let fulfillsCreated = 0;
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (i % 100 === 0 || i === entities.length - 1) {
          process.stdout.write(`\r  Entity ${i + 1}/${entities.length}...`);
        }
        for (const obj of objectives) {
          if (fulfillsMatch(entity.norm, obj.norm)) {
            await session.run(
              `MATCH (e:Entity {name: $entityName})
               MATCH (lo:LearningObjective {slug: $loSlug})
               MERGE (e)-[:FULFILLS_OBJECTIVE]->(lo)`,
              { entityName: entity.name, loSlug: obj.slug }
            );
            fulfillsCreated++;
          }
        }
      }
      console.log(`\n  FULFILLS_OBJECTIVE: ${fulfillsCreated}\n`);

      console.log('Done (Schema B).');
    } finally {
      await session.close();
    }
  } catch (err) {
    console.error('Link error (continuing to exit 0):', err.message);
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
