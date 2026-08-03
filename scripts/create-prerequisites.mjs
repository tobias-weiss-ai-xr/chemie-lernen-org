/**
 * create-prerequisites.mjs — Create PREREQUISITE relationships between
 * LearningObjectives based on the curricular ordering encoded in the
 * scraped JSON files (myhugoapp/data/curricula/*.json).
 *
 * Rationale (evidence-based): curricula order topics/subtopics in a
 * deliberate didactic sequence. Learning objectives of earlier
 * subtopics are prerequisites for objectives of later subtopics within
 * the same curriculum. These PREREQUISITE edges power the learning-paths
 * detail view (`(lo)-[:PREREQUISITE]->(pre:LearningObjective)`) and
 * prerequisite-aware learning recommendations.
 *
 * Design:
 *   - Reconstructs LO slugs exactly like import-curricula-all.mjs
 *     (same slugify + slug construction rules) so existing nodes match.
 *   - For each curriculum and grade level, walks topics → (direct LOs,
 *     sub_topics → LOs, nested sub_topics → LOs) in JSON order.
 *   - Creates PREREQUISITE edges from each LO to the NEXT LO in that
 *     ordering (chain), plus first LO → all following LOs within the
 *     same subtopic (small complete graph for intra-subtopic deps).
 *   - Idempotent: MERGE on (slug_from, slug_to) pairs.
 *
 * Usage:
 *   NEO4J_URI=bolt://chemie-kg:7687 node scripts/create-prerequisites.mjs
 *   (default URI: bolt://localhost:7687)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'myhugoapp', 'data', 'curricula');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

/** Mirrors scripts/import-curricula-all.mjs slugify() exactly. */
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

function curriculumSlug(stateAbbr, schoolType) {
  // IMPORTANT: must match import-curricula-all.mjs exactly — the state
  // abbreviation stays UPPERCASE (e.g. 'BB-sek-i-...'), Neo4j slugs are
  // case-sensitive.
  return `${stateAbbr}-${slugify(schoolType)}`.slice(0, 120);
}

function subTopicSlug(cSlug, topicName, subTitle, nested) {
  if (nested) {
    return `${cSlug}-${slugify(topicName).slice(0, 40)}-sub-${slugify(subTitle).slice(0, 60)}`;
  }
  return `${cSlug}-${slugify(topicName).slice(0, 60)}-topic`;
}

function loSlug(parentSlug, text) {
  return `${parentSlug}-lo-${slugify(text).slice(0, 80)}`;
}

/** Walk one level of topics and collect [parentSlug, loSlug, text] in order. */
function collectLevel(cSlug, topics) {
  const out = [];
  for (const topic of topics || []) {
    const topicName = topic.title || '';
    for (const lo of topic.learning_objectives || []) {
      const text = (lo.text || '').trim();
      if (!text) continue;
      const parent = subTopicSlug(cSlug, topicName, null, false);
      out.push({ parent, lo: loSlug(parent, text), text });
    }
    for (const sub of topic.sub_topics || []) {
      const subSlug = subTopicSlug(cSlug, topicName, sub.title, true);
      for (const lo of sub.learning_objectives || []) {
        const text = (lo.text || '').trim();
        if (!text) continue;
        out.push({ parent: subSlug, lo: loSlug(subSlug, text), text });
      }
      if (sub.sub_topics && sub.sub_topics.length > 0) {
        for (const nested of sub.sub_topics) {
          const nestedSlug = subTopicSlug(cSlug, topicName, nested.title, true);
          for (const lo of nested.learning_objectives || []) {
            const text = (lo.text || '').trim();
            if (!text) continue;
            out.push({ parent: nestedSlug, lo: loSlug(nestedSlug, text), text });
          }
          // depth-3 recursion (rare)
          if (nested.sub_topics) {
            for (const d3 of nested.sub_topics) {
              const d3Slug = subTopicSlug(cSlug, topicName, d3.title, true);
              for (const lo of d3.learning_objectives || []) {
                const text = (lo.text || '').trim();
                if (!text) continue;
                out.push({ parent: d3Slug, lo: loSlug(d3Slug, text), text });
              }
            }
          }
        }
      }
    }
  }
  return out;
}

/** Collect ordered LO list for one school_curriculum entry. */
function collectCurriculum(entry) {
  const cSlug = curriculumSlug(entry.stateAbbr, entry.schoolType);
  const out = [];
  for (const gl of entry.gradeLevels || []) {
    out.push(...collectLevel(cSlug, gl.topics || []));
  }
  return { cSlug, items: out };
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.WRITE,
  });

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort();

  console.log(`Reading curricula JSON from ${DATA_DIR}`);
  console.log(`NEO4J_URI: ${NEO4J_URI} database: ${NEO4J_DATABASE}\n`);

  let totalLOs = 0;
  let totalEdges = 0;
  const missing = new Set();

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    const stateAbbr = (raw.state_abbr || file.replace('.json', '')).toUpperCase();

    for (const school of raw.school_curricula || []) {
      const schoolType = school.school_type || '';
      if (!schoolType) continue;

      const entry = {
        stateAbbr,
        schoolType,
        gradeLevels: school.grade_levels || [],
      };
      const { cSlug, items } = collectCurriculum(entry);
      if (items.length === 0) continue;

      console.log(`${cSlug}: ${items.length} LOs in didactic order`);

      // Build edges:
      //   1. intra-subtopic chain: LO[i] → LO[i+1] within the same parent
      //   2. cross-subtopic: last LO of subtopic → first LO of next subtopic
      // This yields a linear didactic chain per curriculum (O(n) pairs).
      const pairs = [];
      const seen = new Set();
      const firstIdxByParent = new Map();
      const lastIdxByParent = new Map();
      items.forEach((it, idx) => {
        if (!firstIdxByParent.has(it.parent)) firstIdxByParent.set(it.parent, idx);
        lastIdxByParent.set(it.parent, idx);
      });
      // For each parent, the first item of the NEXT parent (pre-computed)
      const parentOrder = Array.from(firstIdxByParent.keys());
      const nextParentFirst = new Map();
      for (let p = 0; p < parentOrder.length - 1; p++) {
        nextParentFirst.set(parentOrder[p], items[firstIdxByParent.get(parentOrder[p + 1])]);
      }

      for (let i = 0; i < items.length; i++) {
        const cur = items[i];
        // intra-subtopic: next LO in the same subtopic
        if (i + 1 < items.length && items[i + 1].parent === cur.parent) {
          const key = `${cur.lo}->${items[i + 1].lo}`;
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({ from: cur.lo, to: items[i + 1].lo });
          }
        }
        // cross-subtopic: first of this subtopic → first of next subtopic
        if (firstIdxByParent.get(cur.parent) === i) {
          const nextFirst = nextParentFirst.get(cur.parent);
          if (nextFirst) {
            const key = `${cur.lo}->${nextFirst.lo}`;
            if (!seen.has(key)) {
              seen.add(key);
              pairs.push({ from: cur.lo, to: nextFirst.lo });
            }
          }
        }
      }

      // Report missing LO slugs (where either endpoint doesn't exist) — sample first 200
      const probe = await session.run(
        `UNWIND $pairs AS p
         OPTIONAL MATCH (f:LearningObjective {slug: p.from})
         OPTIONAL MATCH (t:LearningObjective {slug: p.to})
         WITH p, f, t
         WHERE f IS NULL OR t IS NULL
         RETURN collect(DISTINCT CASE WHEN f IS NULL THEN p.from ELSE p.to END) AS missingSlugs
         LIMIT 1`,
        { pairs: pairs.slice(0, 200) }
      );
      for (const rec of probe.records) {
        for (const m of rec.get('missingSlugs') || []) {
          missing.add(m);
        }
      }

      // Execute in batches
      for (let b = 0; b < pairs.length; b += 200) {
        const batch = pairs.slice(b, b + 200);
        const result = await session.run(
          `UNWIND $pairs AS p
           MATCH (from:LearningObjective {slug: p.from})
           MATCH (to:LearningObjective {slug: p.to})
           MERGE (from)-[:PREREQUISITE]->(to)
           RETURN count(*) AS created`,
          { pairs: batch }
        );
        const created = result.records[0].get('created').toNumber();
        totalEdges += created;
      }

      totalLOs += items.length;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  LOs in didactic order: ${totalLOs}`);
  console.log(`  PREREQUISITE edges created: ${totalEdges}`);
  if (missing.size > 0) {
    console.log(`  Sample missing LO slugs (${missing.size} total):`);
    for (const m of Array.from(missing).slice(0, 5)) {
      console.log('    ', m);
    }
  }

  await session.close();
  await driver.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
