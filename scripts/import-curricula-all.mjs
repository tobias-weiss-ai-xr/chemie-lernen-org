#!/usr/bin/env node
/**
 * import-curricula-all.mjs — Import ALL 16 state chemistry curricula into Neo4j KG.
 *
 * SCHEMA B (Sprint 28+): Canonical import script.
 *
 * Chain:
 *   (:Curriculum {state_abbr, state, school_type})
 *     -[:HAS_SUBTOPIC]->
 *   (:SubTopic {title, topic, grade, curriculum_state})
 *     -[:FULFILLS]->
 *   (:LearningObjective {text, objective_id})
 *
 * Idempotent: MERGE everywhere + unique constraints.
 * No DETACH DELETE, no mass updates.
 * Exits 0 on partial success.
 *
 * Usage:
 *   node scripts/import-curricula-all.mjs
 *   node scripts/import-curricula-all.mjs --dry-run
 *   node scripts/import-curricula-all.mjs --state BY
 *
 * Environment:
 *   NEO4J_URI      (default: bolt://chemie-neo4j:7687)
 *   NEO4J_USER     (default: neo4j)
 *   NEO4J_PASSWORD (default: chemie_knowledge_2024)
 *   NEO4J_DATABASE (default: chemie)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import neo4j from 'neo4j-driver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(REPO_ROOT, 'myhugoapp', 'data', 'curricula');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const stateArg = args.find((a) => a.startsWith('--state='));
const SINGLE_STATE = stateArg ? stateArg.slice('--state='.length).toUpperCase() : null;

// All 16 German Bundesländer
const ALL_STATES = ['bb', 'be', 'bw', 'by', 'hb', 'he', 'hh', 'mv', 'ni', 'nw', 'rp', 'sh', 'sn', 'st', 'th'];

// ── Slugify ─────────────────────────────────────────────────────────────

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

// ── Constraint setup ────────────────────────────────────────────────────

async function ensureConstraints(session) {
  const constraints = [
    'CREATE CONSTRAINT IF NOT EXISTS FOR (c:Curriculum) REQUIRE (c.state_abbr, c.school_type) IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (s:SubTopic) REQUIRE s.slug IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (l:LearningObjective) REQUIRE l.slug IS UNIQUE',
  ];

  for (const cypher of constraints) {
    try {
      await session.run(cypher);
    } catch (err) {
      console.error(`  [constraint] Warning: ${err.message}`);
    }
  }
  console.log('  [constraint] Unique constraints ensured\n');
}

// ── Load curricula JSON files ──────────────────────────────────────────

function loadAllCurricula() {
  const results = [];
  const stateAbbrs = SINGLE_STATE ? [SINGLE_STATE.toLowerCase()] : ALL_STATES;

  for (const abbr of stateAbbrs) {
    const filePath = path.join(DATA_DIR, `${abbr}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  [warn] Missing curriculum file: ${filePath}`);
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      results.push(data);
    } catch (err) {
      console.error(`  [error] Failed to parse ${filePath}: ${err.message}`);
    }
  }

  return results;
}

// ── Collect curriculum data ────────────────────────────────────────────

/**
 * Flat list of all import operations, so main() can iterate and MERGE.
 */
function collectImportOps(stateData) {
  const ops = [];
  const stateAbbr = stateData.state_abbr || '';
  const stateName = stateData.state || '';
  const schoolCurricula = stateData.school_curricula || [];

  for (const sc of schoolCurricula) {
    const schoolType = sc.school_type || 'unknown';
    const cSlug = `${stateAbbr}-${slugify(schoolType)}`;
    const gradeLevels = sc.grade_levels || [];

    // Curriculum op
    ops.push({
      type: 'curriculum',
      slug: cSlug,
      stateAbbr,
      state: stateName,
      schoolType,
    });

    for (const gl of gradeLevels) {
      const grade = gl.grade || '';
      const topics = gl.topics || [];

      for (const topic of topics) {
        const topicName = topic.title || '';

        // Direct learning objectives on topic → generic SubTopic
        const directLOs = topic.learning_objectives || [];
        if (directLOs.length > 0) {
          const subSlug = `${cSlug}-${slugify(topicName).slice(0, 60)}-topic`;
          ops.push({
            type: 'subtopic',
            slug: subSlug,
            title: topicName,
            topic: topicName,
            grade,
            curriculumSlug: cSlug,
            curriculumState: cSlug,
          });
          for (const lo of directLOs) {
            const loText = lo.text || '';
            if (!loText) continue;
            const loSlug = `${subSlug}-lo-${slugify(loText).slice(0, 80)}`;
            ops.push({
              type: 'objective',
              slug: loSlug,
              text: loText,
              parentSlug: subSlug,
            });
          }
        }

        // Sub-topics
        for (const sub of topic.sub_topics || []) {
          const subSlug = `${cSlug}-${slugify(topicName).slice(0, 40)}-sub-${slugify(sub.title).slice(0, 60)}`;
          ops.push({
            type: 'subtopic',
            slug: subSlug,
            title: sub.title,
            topic: topicName,
            grade,
            curriculumSlug: cSlug,
            curriculumState: cSlug,
          });

          for (const lo of sub.learning_objectives || []) {
            const loText = lo.text || '';
            if (!loText) continue;
            const loSlug = `${subSlug}-lo-${slugify(loText).slice(0, 80)}`;
            ops.push({
              type: 'objective',
              slug: loSlug,
              text: loText,
              parentSlug: subSlug,
            });
          }

          // Nested sub-topics
          if (sub.sub_topics && sub.sub_topics.length > 0) {
            const nestedOps = collectNestedSubTopics(cSlug, topicName, grade, subSlug, sub.sub_topics);
            ops.push(...nestedOps);
          }
        }
      }
    }
  }

  return ops;
}

function collectNestedSubTopics(curriculumSlug, topicName, grade, parentSlug, subTopics) {
  const ops = [];
  for (const sub of subTopics) {
    const subSlug = `${parentSlug}-sub-${slugify(sub.title).slice(0, 60)}`;
    ops.push({
      type: 'subtopic',
      slug: subSlug,
      title: sub.title,
      topic: topicName,
      grade,
      curriculumSlug,
      curriculumState: curriculumSlug,
    });
    for (const lo of sub.learning_objectives || []) {
      const loText = lo.text || '';
      if (!loText) continue;
      const loSlug = `${subSlug}-lo-${slugify(loText).slice(0, 80)}`;
      ops.push({
        type: 'objective',
        slug: loSlug,
        text: loText,
        parentSlug: subSlug,
      });
    }
    if (sub.sub_topics && sub.sub_topics.length > 0) {
      const nested = collectNestedSubTopics(curriculumSlug, topicName, grade, subSlug, sub.sub_topics);
      ops.push(...nested);
    }
  }
  return ops;
}

// ── Batch Cypher execution ─────────────────────────────────────────────

async function executeOps(session, ops) {
  const counts = { curricula: 0, subTopics: 0, objectives: 0 };

  for (const op of ops) {
    try {
      switch (op.type) {
        case 'curriculum': {
          await session.run(
            `MERGE (c:Curriculum {slug: $slug})
             ON CREATE SET c.state_abbr = $stateAbbr,
                         c.state = $state,
                         c.school_type = $schoolType
             ON MATCH SET c.state_abbr = $stateAbbr,
                         c.state = $state,
                         c.school_type = $schoolType
             RETURN c.slug AS slug`,
            {
              slug: op.slug,
              stateAbbr: op.stateAbbr,
              state: op.state,
              schoolType: op.schoolType,
            }
          );
          counts.curricula++;
          break;
        }

        case 'subtopic': {
          await session.run(
            `MATCH (c:Curriculum {slug: $cSlug})
             MERGE (st:SubTopic {slug: $stSlug})
             ON CREATE SET st.title = $title,
                         st.topic = $topic,
                         st.grade = $grade,
                         st.curriculum_state = $curriculumState
             ON MATCH SET st.title = $title,
                         st.topic = $topic,
                         st.grade = $grade
             MERGE (c)-[:HAS_SUBTOPIC]->(st)
             RETURN st.slug AS slug`,
            {
              cSlug: op.curriculumSlug,
              stSlug: op.slug,
              title: op.title,
              topic: op.topic,
              grade: op.grade,
              curriculumState: op.curriculumState,
            }
          );
          counts.subTopics++;
          break;
        }

        case 'objective': {
          await session.run(
            `MATCH (st:SubTopic {slug: $stSlug})
             MERGE (lo:LearningObjective {slug: $loSlug})
             ON CREATE SET lo.text = $text,
                         lo.objective_id = $loSlug
             ON MATCH SET lo.text = $text
             MERGE (st)-[:FULFILLS]->(lo)
             RETURN lo.slug AS slug`,
            {
              stSlug: op.parentSlug,
              loSlug: op.slug,
              text: op.text,
            }
          );
          counts.objectives++;
          break;
        }
      }
    } catch (err) {
      console.error(`  [error] ${op.type} ${op.slug}: ${err.message}`);
    }
  }

  return counts;
}

// ── Dry run ────────────────────────────────────────────────────────────

function generateDryRun(allData) {
  console.log('=== DRY RUN (Schema B) ===\n');

  let curriculumCount = 0;
  let subTopicCount = 0;
  let objectiveCount = 0;

  for (const stateData of allData) {
    const stateName = stateData.state || stateData.state_abbr || 'unknown';
    const ops = collectImportOps(stateData);
    const curricula = ops.filter((o) => o.type === 'curriculum').length;
    const subs = ops.filter((o) => o.type === 'subtopic').length;
    const los = ops.filter((o) => o.type === 'objective').length;

    curriculumCount += curricula;
    subTopicCount += subs;
    objectiveCount += los;

    console.log(
      `  ${stateName}: ${curricula} :Curriculum, ${subs} :SubTopic, ${los} :LearningObjective`
    );
  }

  console.log(
    `\nTotal: ${curriculumCount} :Curriculum, ${subTopicCount} :SubTopic, ${objectiveCount} :LearningObjective\n`
  );
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('=== import-curricula-all.mjs (Schema B) ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);
  if (SINGLE_STATE) console.log(`SINGLE_STATE: ${SINGLE_STATE}`);
  console.log();

  const allData = loadAllCurricula();
  console.log(`Loaded ${allData.length} state curricula\n`);

  if (DRY_RUN) {
    generateDryRun(allData);
    return;
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    try {
      // Ensure constraints first
      console.log('=== Ensuring constraints ===');
      await ensureConstraints(session);

      // Import all states
      console.log('=== Importing all state curricula (Schema B) ===');
      console.log();

      let grandTotal = { curricula: 0, subTopics: 0, objectives: 0 };

      for (const stateData of allData) {
        const stateName = stateData.state || stateData.state_abbr || 'unknown';
        const ops = collectImportOps(stateData);
        const stateCounts = await executeOps(session, ops);

        grandTotal.curricula += stateCounts.curricula;
        grandTotal.subTopics += stateCounts.subTopics;
        grandTotal.objectives += stateCounts.objectives;

        const subCount = ops.filter((o) => o.type === 'subtopic').length;
        const objCount = ops.filter((o) => o.type === 'objective').length;
        console.log(
          `  [done] ${stateName}: ${stateCounts.curricula} curricula, ${subCount} subtopics, ${objCount} objectives`
        );
      }

      console.log('\n=== Import complete ===');
      console.log(`  :Curriculum: ${grandTotal.curricula}`);
      console.log(`  :SubTopic: ${grandTotal.subTopics}`);
      console.log(`  :LearningObjective: ${grandTotal.objectives}`);
    } finally {
      await session.close();
    }
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
