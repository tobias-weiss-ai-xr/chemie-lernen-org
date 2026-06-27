#!/usr/bin/env node
/**
 * import-curricula.mjs — Import state chemistry curricula into Neo4j knowledge graph.
 *
 * Reads all 15 state JSON files from myhugoapp/data/curricula/??.json and
 * creates :Entity nodes for (1) curriculum topics (kategorie:'lehrplan') and
 * (2) learning objectives (kategorie:'lernziel'), linked via [:TEIL_VON].
 *
 * Curriculum topics are auto-linked to existing matching Entity nodes via
 * [:RELATED_TO {weight: 1, auto: true}].
 *
 * Usage:
 *   node scripts/import-curricula.mjs           # import (requires Neo4j)
 *   node scripts/import-curricula.mjs --dry-run  # print MERGE statements only
 *
 * Environment: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 * Safety: ALL writes use MERGE — no DETACH DELETE, no MATCH (n) DELETE n.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// NOTE: All queries in this file use :Entity / kategorie labels — already subset-restricted.

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'myhugoapp', 'data', 'curricula');

// ── Config ────────────────────────────────────────────────────────────
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Name normalization ────────────────────────────────────────────────
function normalizeTopicName(title) {
  let name = title.toLowerCase().trim();

  // Remove "lernbereich N:" prefix
  name = name.replace(/^lernbereich\s+\d+\s*:\s*/, '');

  // Remove "thema N:" prefix
  name = name.replace(/^thema\s+\d+\s*:\s*/, '');

  // Remove "bereich N:" prefix
  name = name.replace(/^bereich\s+\d+\s*:\s*/, '');

  // Remove parenthetical time estimates: (ca. 9 Std.), (ca. 45 Minuten), (ca. 2 Wo.)
  name = name.replace(/\s*\(ca\.\s*[\d\s]+(?:std|min|wochen?|doppelstd)[^)]*\)/gi, '');

  // Remove trailing "(ca. X Std.)" etc without parentheses
  name = name.replace(/\s*ca\.\s*[\d\s]+\s*(?:std\.?|min\.?|wochen?|doppelstunden?)\s*$/i, '');

  // Remove empty parentheses
  name = name.replace(/\s*\(\s*\)/g, '');

  // Split on " – " (en-dash with spaces) and take first meaningful part
  const parts = name.split(/\s*–\s*/);
  if (parts.length > 1 && parts[0].length > 2) {
    name = parts[0];
  }

  // Split on " - " (hyphen with spaces) and take first part
  const hyphenParts = name.split(/\s+-\s+/);
  if (hyphenParts.length > 1 && hyphenParts[0].length > 2 && !hyphenParts[0].match(/^(und|oder|bzw)$/)) {
    // Only take first part if second part looks like an enumeration or topic extension
    if (hyphenParts[1].length > 5) {
      name = hyphenParts[0];
    }
  }

  // Clean up: collapse whitespace, trim
  name = name.replace(/\s+/g, ' ').trim();

  // Remove trailing punctuation
  name = name.replace(/[\s,;.:!?]+$/, '');

  return name;
}

function normalizeLearningObjective(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[\s,;.:!?]+$/, '');
}

/**
 * Normalize a name for entity linking comparison.
 * Handles umlauts (ä→ae, ö→oe, ü→ue, ß→ss), hyphens→spaces,
 * and strips non-alphanumeric characters (except spaces).
 */
function normalizeForLinking(name) {
  return name
    .toLowerCase()
    .replace(/[-/\s]+/g, ' ')      // hyphens/slashes → space
    .replace(/[_-]+/g, ' ')        // underscores too
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, '')   // strip remaining non-alpha
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

// ── Curriculum JSON reader ────────────────────────────────────────────
function readAllCurricula() {
  if (!existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  // Match only 2-letter state abbreviation files (e.g. by.json, nw.json).
  // This excludes metadata files (index.json, checksums.json, etc.) and
  // any 3-letter variants (e.g. nrw.json is a stub; real NW data is nw.json).
  // Saarland (SL) is expected as sl.json when data becomes available.
  const STATE_RE = /^[a-z]{2}\.json$/;
  const files = readdirSync(DATA_DIR)
    .filter((f) => STATE_RE.test(f))
    .sort();

  if (files.length === 0) {
    console.error(`No state JSON files found in ${DATA_DIR}`);
    process.exit(1);
  }

  const curricula = [];
  for (const file of files) {
    const path = join(DATA_DIR, file);
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw);
    curricula.push(data);
  }

  return curricula;
}

// ── Collect all topics with metadata ──────────────────────────────────
function extractTopics(curricula) {
  const topics = [];

  for (const state of curricula) {
    const stateAbbr = state.state_abbr;
    const stateName = state.state;

    for (const sc of (state.school_curricula || [])) {
      const schoolType = sc.school_type;

      for (const gl of (sc.grade_levels || [])) {
        const grade = gl.grade;

        for (const topic of (gl.topics || [])) {
          const normalized = normalizeTopicName(topic.title);
          if (!normalized) continue;

          // Count learning objectives at all nesting levels
          const objectives = extractObjectives(topic);
          const uniqueObjectives = [...new Set(objectives.map((o) => normalizeLearningObjective(o.text)))];

          topics.push({
            originalTitle: topic.title,
            normalizedName: normalized,
            stateAbbr,
            stateName,
            schoolType,
            grade,
            objectives: uniqueObjectives,
          });
        }
      }
    }
  }

  return topics;
}

function extractObjectives(topic) {
  // Direct learning_objectives array
  if (topic.learning_objectives && Array.isArray(topic.learning_objectives)) {
    return topic.learning_objectives.map((o) => ({
      text: o.text || '',
    }));
  }

  // Nested sub_topics with learning_objectives
  if (topic.sub_topics && Array.isArray(topic.sub_topics)) {
    const objectives = [];
    for (const sub of topic.sub_topics) {
      if (sub.learning_objectives && Array.isArray(sub.learning_objectives)) {
        for (const o of sub.learning_objectives) {
          objectives.push({ text: o.text || '' });
        }
      }
      // Recurse deeper
      if (sub.sub_topics) {
        objectives.push(...extractObjectives(sub));
      }
    }
    return objectives;
  }

  return [];
}

// ── Cypher generation ────────────────────────────────────────────────
function generateDryRun(topics) {
  const lines = [];
  lines.push('// === IMPORT CURRICULA — DRY RUN ===');
  lines.push(`// Input: ${topics.length} topics from ${new Set(topics.map((t) => t.stateAbbr)).size} states`);
  lines.push(`// Estimated objectives: ${topics.reduce((s, t) => s + t.objectives.length, 0)}`);
  lines.push('');

  const seenTopics = new Set();
  const seenObjectives = new Set();

  for (const topic of topics) {
    const key = topic.normalizedName;
    if (!seenTopics.has(key)) {
      seenTopics.add(key);
      lines.push(`// Topic: ${topic.originalTitle} → "${topic.normalizedName}"`);
      lines.push(`//   State: ${topic.stateName} (${topic.stateAbbr}), School: ${topic.schoolType}, Grade: ${topic.grade}`);
      lines.push(`//   Objectives: ${topic.objectives.length}`);
      lines.push(`MERGE (e:Entity {name: "${topic.normalizedName}"})`);
      lines.push(`  ON CREATE SET e.kategorie = 'lehrplan', e.display_name = "${topic.originalTitle}", e.state = "${topic.stateAbbr}", e.state_name = "${topic.stateName}", e.school_type = "${topic.schoolType}", e.grade = "${topic.grade}", e.objective_count = ${topic.objectives.length}, e.seeded = true`);
      lines.push('');

      for (const obj of topic.objectives) {
        const objKey = normalizeLearningObjective(obj);
        if (!seenObjectives.has(objKey)) {
          seenObjectives.add(objKey);
          const escaped = obj.replace(/"/g, '\\"');
          const normEscaped = objKey.replace(/"/g, '\\"');
          lines.push(`  // Objective: ${escaped.substring(0, 100)}`);
          lines.push(`  MERGE (lo:Entity {name: "${normEscaped}"})`);
          lines.push(`    ON CREATE SET lo.kategorie = 'lernziel', lo.display_name = "${escaped.substring(0, 200)}", lo.parent_topic = "${topic.normalizedName}", lo.seeded = true`);
          lines.push(`  MERGE (lo)-[:TEIL_VON]->(e)`);
        }
      }
      lines.push('');
    }
  }

  // Entity linking pass (node-side matching with normalization)
  const uniqueTopics = [...new Set(topics.map((t) => t.normalizedName))];
  lines.push('// === Entity linking pass ===');
  lines.push('// For each lehrplan topic, find matching existing Entity by');
  lines.push('// node-side name normalization (umlaut→ae, hyphen→space, CONTAINS).');
  lines.push(`// Unique topics to match: ${uniqueTopics.length}`);
  lines.push('// NOTE: Dry-run cannot show individual match candidates without Neo4j access.');
  lines.push('// In real import, queries all existing entities and iterates node-side.');
  lines.push(`// Estimated topics to attempt linking: ${uniqueTopics.length}`);
  lines.push('');

  return lines.join('\n');
}

async function runImport(topics) {
  let neo4jDriver;
  try {
    const neo4j = await import('neo4j-driver');
    neo4jDriver = neo4j.default.driver(
      NEO4J_URI,
      neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      { connectionTimeout: 10000 }
    );
    const session = neo4jDriver.session({ database: NEO4J_DATABASE });

    let topicCount = 0;
    let objectiveCount = 0;
    let linkCount = 0;
    const seenTopics = new Set();
    const seenObjectives = new Set();

    // Phase 1: Create topic entities
    for (const topic of topics) {
      const key = topic.normalizedName;
      if (seenTopics.has(key)) continue;
      seenTopics.add(key);

      await session.run(
        `MERGE (e:Entity {name: $name})
         ON CREATE SET
           e.kategorie = 'lehrplan',
           e.display_name = $displayName,
           e.state = $state,
           e.state_name = $stateName,
           e.school_type = $schoolType,
           e.grade = $grade,
           e.objective_count = $objectiveCount,
           e.seeded = true
         ON MATCH SET
           e.display_name = $displayName,
           e.objective_count = $objectiveCount`,
        {
          name: topic.normalizedName,
          displayName: topic.originalTitle,
          state: topic.stateAbbr,
          stateName: topic.stateName,
          schoolType: topic.schoolType,
          grade: topic.grade,
          objectiveCount: topic.objectives.length,
        }
      );
      topicCount++;

      // Phase 1b: Create learning objective entities linked via TEIL_VON
      for (const obj of topic.objectives) {
        const objKey = normalizeLearningObjective(obj);
        if (seenObjectives.has(objKey)) continue;
        seenObjectives.add(objKey);

        await session.run(
          `MERGE (lo:Entity {name: $objName})
           ON CREATE SET
             lo.kategorie = 'lernziel',
             lo.display_name = $objDisplay,
             lo.parent_topic = $topicName,
             lo.seeded = true
           WITH lo
           MATCH (e:Entity {name: $topicName})
           MERGE (lo)-[:TEIL_VON]->(e)`,
          {
            objName: objKey,
            objDisplay: obj,
            topicName: topic.normalizedName,
          }
        );
        objectiveCount++;
      }
    }

    // Phase 2: Link curriculum topics to existing entities (node-side matching)
    const existingEntities = await session.run(
      `MATCH (e:Entity)
       WHERE e.kategorie IS NOT NULL
         AND e.kategorie <> 'lehrplan'
         AND e.kategorie <> 'lernziel'
       RETURN e.name as name`
    );
    const entityNames = existingEntities.records.map((r) => r.get('name'));
    const entityNamesNorm = entityNames.map((n) => normalizeForLinking(n));

    const uniqueTopicNames = [...new Set(topics.map((t) => t.normalizedName))];

    for (const topicName of uniqueTopicNames) {
      const normTopic = normalizeForLinking(topicName);
      if (normTopic.length < 3) continue;

      for (let ei = 0; ei < entityNames.length; ei++) {
        const normEntity = entityNamesNorm[ei];
        if (normEntity.length < 3) continue;

        // Match if one normalized name CONTAINS the other
        // (handles "redoxreaktionen" ↔ "redoxreaktion", "atombau" ↔ "atombau und periodensystem")
        const matched =
          normTopic.includes(normEntity) || normEntity.includes(normTopic);

        if (matched) {
          await session.run(
            `MATCH (t:Entity {name: $topicName})
             MATCH (e:Entity {name: $entityName})
             MERGE (t)-[r:RELATED_TO {weight: 1, auto: true}]-(e)
             RETURN count(r) AS created`,
            { topicName, entityName: entityNames[ei] }
          );
          linkCount++;
        }
      }
    }

    // Summary
    const totalResult = await session.run(
      `MATCH (e:Entity {kategorie: 'lehrplan'}) RETURN count(e) AS c`
    );
    const totalTopics = totalResult.records[0].get('c').toNumber();

    const totalObjs = await session.run(
      `MATCH (e:Entity {kategorie: 'lernziel'}) RETURN count(e) AS c`
    );
    const totalObjectives = totalObjs.records[0].get('c').toNumber();

    await session.close();
    await neo4jDriver.close();

    console.log(`\nImport complete.`);
    console.log(`  Topics created/updated: ${topicCount} (total in DB: ${totalTopics})`);
    console.log(`  Objectives created: ${objectiveCount} (total in DB: ${totalObjectives})`);
    console.log(`  Auto-links created: ${linkCount}`);
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
  console.log('=== Import Curricula to Knowledge Graph ===\n');

  const curricula = readAllCurricula();
  console.log(`Found ${curricula.length} state curriculum file(s)`);

  const topics = extractTopics(curricula);
  console.log(`Extracted ${topics.length} unique topic title(s)`);

  const totalObjectives = topics.reduce((s, t) => s + t.objectives.length, 0);
  console.log(`Total learning objectives: ${totalObjectives}`);

  const states = [...new Set(topics.map((t) => t.stateAbbr))];
  console.log(`States: ${states.join(', ')}`);

  if (DRY_RUN) {
    const cypher = generateDryRun(topics);
    console.log('\n' + cypher);
    console.log('=== DRY RUN COMPLETE ===');
    process.exit(0);
  }

  await runImport(topics);
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
