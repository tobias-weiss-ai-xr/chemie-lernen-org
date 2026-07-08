#!/usr/bin/env node
/**
 * import-curricula.mjs — Import state chemistry curricula into Neo4j KG.
 *
 * Reads all 16 state JSON files from myhugoapp/data/curricula/??.json and
 * creates spec-compliant typed nodes:
 *   - :Curriculum {state_abbr, state, school_type}
 *   - :Topic {title, grade, slug} — linked via :HAS_TOPIC
 *   - :SubTopic {title, slug} — linked via :HAS_SUBTOPIC
 *   - :LearningObjective {text} — linked via :HAS_LEARNING_OBJECTIVE
 *
 * Also creates :RELATED_TO links between topics and existing Entity nodes.
 *
 * Schema: openspec/specs/lehrplan-curriculum/spec.md REQ-LP-2/3
 * Safety: MERGE-only, no DETACH DELETE.
 * Exits 0 on partial success.
 *
 * Usage:
 *   node scripts/import-curricula.mjs
 *   node scripts/import-curricula.mjs --dry-run
 *   node scripts/import-curricula.mjs --state by          # single state
 *   node scripts/import-curricula.mjs --file path/to/by.json
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
const fileArg = args.find((a) => a.startsWith('--file='));
const SINGLE_FILE = fileArg ? fileArg.slice('--file='.length) : null;

// ── Slugify ───────────────────────────────────────────────────────────

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

// ── Data loading ───────────────────────────────────────────────────────

function loadCurricula() {
  // Match 2-letter state files: by.json, nw.json, etc.
  const STATE_RE = /^[a-z]{2}\.json$/;

  if (SINGLE_FILE) {
    const raw = JSON.parse(fs.readFileSync(SINGLE_FILE, 'utf-8'));
    return [raw];
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => STATE_RE.test(f))
    .sort();

  return files.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
    if (SINGLE_STATE && data.state_abbr !== SINGLE_STATE) return null;
    return data;
  }).filter(Boolean);
}

// ── Phase 1: Import :Curriculum + :Topic + :SubTopic + :LearningObjective ─

async function importCurricula(session, curricula) {
  const counts = { curricula: 0, topics: 0, subTopics: 0, objectives: 0 };

  for (const state of curricula) {
    for (const sc of state.school_curricula || []) {
      const curriculumSlug = `${state.state_abbr}-${slugify(sc.school_type)}`;

      // MERGE :Curriculum
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
          slug: curriculumSlug,
          stateAbbr: state.state_abbr,
          state: state.state,
          schoolType: sc.school_type,
        }
      );
      counts.curricula++;

      for (const gl of sc.grade_levels || []) {
        for (const topic of gl.topics || []) {
          const topicSlug = `${curriculumSlug}-${slugify(topic.title)}`;

          // MERGE :Topic
          await session.run(
            `MATCH (c:Curriculum {slug: $cSlug})
             MERGE (t:Topic {slug: $tSlug})
             ON CREATE SET t.title = $title,
                         t.grade = $grade,
                         t.curriculum = $cSlug
             ON MATCH SET t.title = $title,
                         t.grade = $grade,
                         t.curriculum = $cSlug
             MERGE (c)-[:HAS_TOPIC]->(t)
             RETURN t.slug AS slug`,
            {
              cSlug: curriculumSlug,
              tSlug: topicSlug,
              title: topic.title,
              grade: gl.grade,
            }
          );
          counts.topics++;

          // MERGE direct learning objectives
          for (const obj of topic.learning_objectives || []) {
            const objText = obj.text || '';
            if (!objText) continue;
            const objSlug = `${topicSlug}-lo-${slugify(objText).slice(0, 80)}`;
            await session.run(
              `MATCH (t:Topic {slug: $tSlug})
               MERGE (lo:LearningObjective {slug: $loSlug})
               ON CREATE SET lo.text = $text,
                           lo.parent_topic = $tSlug
               ON MATCH SET lo.text = $text,
                           lo.parent_topic = $tSlug
               MERGE (t)-[:HAS_LEARNING_OBJECTIVE]->(lo)
               RETURN lo.slug AS slug`,
              { tSlug: topicSlug, loSlug: objSlug, text: objText }
            );
            counts.objectives++;
          }

          // MERGE sub-topics + their objectives
          for (const sub of topic.sub_topics || []) {
            const subSlug = `${topicSlug}-sub-${slugify(sub.title)}`;
            await session.run(
              `MATCH (t:Topic {slug: $tSlug})
               MERGE (st:SubTopic {slug: $stSlug})
               ON CREATE SET st.title = $title,
                           st.parent_topic = $tSlug
               ON MATCH SET st.title = $title,
                           st.parent_topic = $tSlug
               MERGE (t)-[:HAS_SUBTOPIC]->(st)
               RETURN st.slug AS slug`,
              { tSlug: topicSlug, stSlug: subSlug, title: sub.title }
            );
            counts.subTopics++;

            for (const obj of sub.learning_objectives || []) {
              const objText = obj.text || '';
              if (!objText) continue;
              const objSlug = `${subSlug}-lo-${slugify(objText).slice(0, 80)}`;
              await session.run(
                `MATCH (t:Topic {slug: $tSlug})
                 MERGE (lo:LearningObjective {slug: $loSlug})
                 ON CREATE SET lo.text = $text,
                             lo.parent_topic = $tSlug
                 ON MATCH SET lo.text = $text,
                             lo.parent_topic = $tSlug
                 MERGE (t)-[:HAS_LEARNING_OBJECTIVE]->(lo)
                 RETURN lo.slug AS slug`,
                { tSlug: topicSlug, loSlug: objSlug, text: objText }
              );
              counts.objectives++;
            }

            // Recurse for nested sub_topics
            if (sub.sub_topics && sub.sub_topics.length > 0) {
              const nestedCounts = await importSubTopics(session, topicSlug, subSlug, sub.sub_topics);
              counts.subTopics += nestedCounts.subTopics;
              counts.objectives += nestedCounts.objectives;
            }
          }
        }
      }
    }
  }

  return counts;
}

async function importSubTopics(session, topicSlug, parentSlug, subTopics) {
  const counts = { subTopics: 0, objectives: 0 };

  for (const sub of subTopics) {
    const subSlug = `${parentSlug}-sub-${slugify(sub.title)}`;
    await session.run(
      `MATCH (t:Topic {slug: $tSlug})
       MERGE (st:SubTopic {slug: $stSlug})
       ON CREATE SET st.title = $title,
                   st.parent_topic = $tSlug
       ON MATCH SET st.title = $title,
                   st.parent_topic = $tSlug
       MERGE (t)-[:HAS_SUBTOPIC]->(st)
       RETURN st.slug AS slug`,
      { tSlug: topicSlug, stSlug: subSlug, title: sub.title }
    );
    counts.subTopics++;

    for (const obj of sub.learning_objectives || []) {
      const objText = obj.text || '';
      if (!objText) continue;
      const objSlug = `${subSlug}-lo-${slugify(objText).slice(0, 80)}`;
      await session.run(
        `MATCH (t:Topic {slug: $tSlug})
         MERGE (lo:LearningObjective {slug: $loSlug})
         ON CREATE SET lo.text = $text,
                     lo.parent_topic = $tSlug
         ON MATCH SET lo.text = $text,
                     lo.parent_topic = $tSlug
         MERGE (t)-[:HAS_LEARNING_OBJECTIVE]->(lo)
         RETURN lo.slug AS slug`,
        { tSlug: topicSlug, loSlug: objSlug, text: objText }
      );
      counts.objectives++;
    }

    if (sub.sub_topics && sub.sub_topics.length > 0) {
      const nested = await importSubTopics(session, topicSlug, subSlug, sub.sub_topics);
      counts.subTopics += nested.subTopics;
      counts.objectives += nested.objectives;
    }
  }

  return counts;
}

// ── Phase 2: Auto-link topics to existing Entity nodes ───────────────

async function linkTopicsToEntities(session, curricula) {
  let linkCount = 0;

  // Collect all topic titles for matching
  const topicTitles = new Set();
  for (const state of curricula) {
    for (const sc of state.school_curricula || []) {
      for (const gl of sc.grade_levels || []) {
        for (const topic of gl.topics || []) {
          topicTitles.add(topic.title);
        }
      }
    }
  }

  // Fetch all non-curriculum Entity names
  const existingResult = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IS NOT NULL
       AND e.kategorie <> 'lehrplan'
       AND e.kategorie <> 'lernziel'
     RETURN e.name AS name`
  );
  const entityNames = existingResult.records.map((r) => r.get('name'));

  // Node-side matching
  for (const title of topicTitles) {
    const normTitle = normalizeForLinking(title);
    if (normTitle.length < 4) continue;

    for (const entityName of entityNames) {
      const normEntity = normalizeForLinking(entityName);
      if (normEntity.length < 4) continue;

      if (normTitle.includes(normEntity) || normEntity.includes(normTitle)) {
        await session.run(
          `MATCH (t:Topic)
           WHERE t.title = $title
           MATCH (e:Entity {name: $entityName})
           MERGE (t)-[:RELATED_TO {weight: 1, auto: true}]->(e)
           MERGE (e)-[:RELATED_TO {weight: 1, auto: true}]->(t)`,
          { title, entityName }
        );
        linkCount++;
      }
    }
  }

  return linkCount;
}

// ── Dry run ───────────────────────────────────────────────────────────

function generateDryRun(curricula) {
  console.log('=== DRY RUN ===\n');

  let curriculumCount = 0;
  let topicCount = 0;
  let subTopicCount = 0;
  let objectiveCount = 0;

  for (const state of curricula) {
    console.log(`State: ${state.state} (${state.state_abbr})`);
    for (const sc of state.school_curricula || []) {
      const slug = `${state.state_abbr}-${slugify(sc.school_type)}`;
      console.log(`  :Curriculum {slug:'${slug}'} — ${sc.school_type}`);
      curriculumCount++;

      for (const gl of sc.grade_levels || []) {
        for (const topic of gl.topics || []) {
          const tSlug = `${slug}-${slugify(topic.title).slice(0, 60)}`;
          console.log(`    :Topic {slug:'${tSlug}'} — Grade ${gl.grade}: ${topic.title.slice(0, 50)}...`);
          topicCount++;

          objectiveCount += (topic.learning_objectives || []).length;

          for (const sub of topic.sub_topics || []) {
            subTopicCount++;
            objectiveCount += (sub.learning_objectives || []).length;
          }
        }
      }
    }
    console.log();
  }

  console.log(`Total: ${curriculumCount} :Curriculum, ${topicCount} :Topic, ${subTopicCount} :SubTopic, ${objectiveCount} :LearningObjective\n`);
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== import-curricula.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);
  if (SINGLE_STATE) console.log(`SINGLE_STATE: ${SINGLE_STATE}`);
  console.log();

  const curricula = loadCurricula();
  console.log(`Loaded ${curricula.length} state curricula\n`);

  if (DRY_RUN) {
    generateDryRun(curricula);
    return;
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    // Phase 1: Import curricula structure
    console.log('=== Phase 1: Import :Curriculum + :Topic + :SubTopic + :LearningObjective ===');
    const session = driver.session({ database: NEO4J_DATABASE });
    try {
      const counts = await importCurricula(session, curricula);
      console.log(`  :Curriculum: ${counts.curricula}`);
      console.log(`  :Topic: ${counts.topics}`);
      console.log(`  :SubTopic: ${counts.subTopics}`);
      console.log(`  :LearningObjective: ${counts.objectives}\n`);
    } finally {
      await session.close();
    }

    // Phase 2: Auto-link to entities
    console.log('=== Phase 2: Link topics to existing entities ===');
    const session2 = driver.session({ database: NEO4J_DATABASE });
    try {
      const linkCount = await linkTopicsToEntities(session2, curricula);
      console.log(`  ${linkCount} auto-link(s) created\n`);
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
