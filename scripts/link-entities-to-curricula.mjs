#!/usr/bin/env node
/**
 * link-entities-to-curricula.mjs — v2 improved entity↔curriculum linking
 *
 * Creates directional relationships between chemistry :Entity nodes
 * and curriculum nodes:
 *   - [:COVERS_TOPIC]         — entity covers a :SubTopic (by title match)
 *   - [:FULFILLS_OBJECTIVE]   — entity fulfills a :LearningObjective (text match)
 *
 * Improvements over v1:
 *   - German stemming (remove -e, -en, -em, -er, -es, -ung, -keit, -heit, -ion)
 *   - Chemical formula extraction and matching (H2O, NaCl, etc.)
 *   - Multi-word entity partial matching (match if key non-generic words match)
 *   - Reduced GENERIC_WORDS (only truly generic, not domain-specific concepts)
 *   - Bulk Cypher MERGE for performance (batch mode)
 *
 * Safety: MERGE only, no DELETE, no DETACH. Exits 0 on partial.
 *
 * Usage:
 *   node scripts/link-entities-to-curricula.mjs
 *   node scripts/link-entities-to-curricula.mjs --dry-run
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7688';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 200;

// ── Name normalization ────────────────────────────────────────────────
function normalize(name) {
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

// ── German stemming (basic: remove common inflectional suffixes) ───────
function stem(word) {
  if (word.length < 5) return word;
  // Remove suffixes from longest to shortest
  for (const sfx of ['keit', 'heit', 'ungen', 'ungen', 'ion', 'ieren', 'ung', 'chen', 'lein', 'isch', 'lich', 'lich', 'keit', 'heit', 'ung', 'ern', 'elt', 'nen', 'sen', 'ner', 'ern', 'ese', 'ene', 'ene', 'ige', 'ige', 'ich', 'ich', 'em', 'en', 'er', 'es', 'e']) {
    if (word.endsWith(sfx) && word.length - sfx.length >= 3) {
      let stem = word.slice(0, -sfx.length);
      // Don't stem if result is empty or too short
      if (stem.length >= 3) return stem;
    }
  }
  return word;
}

function stemmed(name) {
  return normalize(name)
    .split(' ')
    .map(stem)
    .filter(w => w.length >= 2)
    .join(' ');
}

// ── Chemical formula extraction ────────────────────────────────────────
function extractFormula(name) {
  // Match patterns like "(H2O)", "HCl", "(NaCl)", etc.
  const m = name.match(/\(([A-Za-z0-9()]+\d*)\)/);
  if (m) return m[1].toLowerCase();
  // Also try to match compound formulas like "CH3COOH" at end
  const m2 = name.match(/\b([A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)+)\b/);
  if (m2 && m2[1].length >= 2 && /[A-Z]/.test(m2[1]) && /\d|[a-z]/.test(m2[1])) {
    return m2[1].toLowerCase();
  }
  return null;
}

// ── Truly generic words (should never be matched as standalone entities) ─
const GENERIC_WORDS = new Set([
  'chemie', 'chemisch', 'chemische', 'chemischer', 'chemischen',
  'stoff', 'stoffe', 'verbindung', 'verbindungen',
  'energie', 'methode', 'methoden', 'verfahren',
  'element', 'elemente', 'prinzip', 'prinzipien',
  'konzept', 'konzepte', 'modell', 'modelle',
  'system', 'systeme', 'struktur', 'strukturen',
  'aufgabe', 'aufgaben', 'thema', 'themen',
  'bereich', 'bereiche', 'prozess', 'prozesse',
  'grund', 'gründe', 'basis', 'basen', 'basischen',
]);

// ── Entity name cleanup: strip parenthetical formulas, leading/trailing whitespace ─
function entityKey(name) {
  return name.replace(/\s*\(.*?\)\s*/g, '').trim();
}

// ── Matching functions ────────────────────────────────────────────────

function coversMatch(entityName, topicTitle) {
  const eNorm = normalize(entityName);
  const tNorm = normalize(topicTitle);
  // Minimum entity length: 4 chars (avoid false positives from short strings like "AES")
  if (eNorm.length < 4 || tNorm.length < 4) return false;
  const eStemmed = stemmed(entityName);
  const tStemmed = stemmed(topicTitle);

  // Direct exact match (normalized)
  if (eNorm === tNorm) return true;

  // Extract entity core name (without formula)
  const eKey = entityKey(entityName);
  const eKeyNorm = normalize(eKey);
  if (eKeyNorm.length < 4) return false;

  // Core name exact match
  if (eKeyNorm === tNorm) return true;

  // Word-boundary containment check for core name (avoid false positives like "aes" in "gemaess")
  const eKeyEscaped = eKeyNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${eKeyEscaped}\\b`).test(tNorm)) return true;

  // For entities >= 8 chars, allow substring match (reduces false positives)
  if (eKeyNorm.length >= 8 && tNorm.includes(eKeyNorm)) return true;

  // Stemmed word-boundary containment: e.g. "alkene" → stem "alken" matches "alken" in topic
  const eStemmedEscaped = eStemmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (eStemmed.length >= 5 && new RegExp(`\\b${eStemmedEscaped}\\b`).test(tStemmed)) return true;

  // Chemical formula match (only for entities with formulas)
  const formula = extractFormula(entityName);
  if (formula && formula.length >= 2) {
    const fNorm = formula.replace(/[^a-z0-9]/g, '');
    if (fNorm.length >= 2 && tNorm.includes(fNorm)) return true;
  }

  // Multi-word entity partial match: match if key non-generic words are found
  const eWords = eKeyNorm.split(' ').filter(w => w.length >= 4 && !GENERIC_WORDS.has(w));
  if (eWords.length >= 2) {
    const tWords = new Set(tStemmed.split(' '));
    const tNormWords = new Set(tNorm.split(' '));
    const matchCount = eWords.filter(w => {
      const s = stem(w);
      return tNormWords.has(w) || new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(tNorm) || tWords.has(s) || new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(tStemmed);
    }).length;
    if (matchCount >= 2 && matchCount >= Math.ceil(eWords.length * 0.6)) return true;
  }

  return false;
}

function fulfillsMatch(entityName, objectiveText) {
  const eNorm = normalize(entityName);
  const oNorm = normalize(objectiveText);
  if (eNorm.length < 4) return false;

  // Extract core name
  const eKey = entityKey(entityName);
  const eKeyNorm = normalize(eKey);
  if (eKeyNorm.length < 4) return false;

  // Check if GENERIC_WORDS blocks the match (only for short entity names)
  if (GENERIC_WORDS.has(eNorm) && oNorm.length > 40) return false;

  // Stemmed word-boundary match
  const eStemmed = stemmed(entityName);
  if (eStemmed.length >= 5) {
    const esc = eStemmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`).test(oNorm)) return true;
  }

  // Word-boundary containment (normalized core name)
  const esc2 = eKeyNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${esc2}\\b`).test(oNorm)) return true;

  // For entities >= 8 chars, allow substring match
  if (eKeyNorm.length >= 8 && oNorm.includes(eKeyNorm)) return true;

  // Chemical formula match
  const formula = extractFormula(entityName);
  if (formula && formula.length >= 2) {
    const fNorm = formula.replace(/[^a-z0-9]/g, '');
    if (fNorm.length >= 2 && oNorm.includes(fNorm)) return true;
  }

  return false;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== link-entities-to-curricula.mjs v2 ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN: ${DRY_RUN}\n`);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    const session = driver.session({ database: NEO4J_DATABASE });
    try {
      // Fetch chemistry entities (exclude code-analysis and non-chemistry)
      const CODE_LABELS = ['Variable', 'Parameter', 'Function', 'Class', 'File', 'Module',
        'Interface', 'Directory', 'Repository', 'Macro', 'Struct', 'Enum', 'Episodic',
        'Type', 'Method', 'Property'];
      const excludeKat = ['lehrplan', 'lernziel', 'didaktik', ...CODE_LABELS];
      const excludeKatStr = excludeKat.map(k => `'${k}'`).join(', ');

      const entityResult = await session.run(
        `MATCH (e:Entity)
         WHERE e.kategorie IS NOT NULL
           AND NOT e.kategorie IN [${excludeKatStr}]
         RETURN e.name AS name, e.kategorie AS kategorie
         ORDER BY e.name`
      );
      const entities = entityResult.records.map(r => ({
        name: r.get('name'),
        kategorie: r.get('kategorie'),
      }));
      console.log(`Entities: ${entities.length}`);

      // Fetch all SubTopics
      const subTopicResult = await session.run(
        `MATCH (st:SubTopic) RETURN st.slug AS slug, st.title AS title ORDER BY st.slug`
      );
      const subTopics = subTopicResult.records.map(r => ({
        slug: r.get('slug'),
        title: r.get('title'),
      }));
      console.log(`SubTopics: ${subTopics.length}`);

      // Fetch LearningObjectives (limit to avoid memory issues)
      const loResult = await session.run(
        `MATCH (lo:LearningObjective) RETURN lo.slug AS slug, lo.text AS text ORDER BY lo.slug LIMIT 5000`
      );
      const objectives = loResult.records.map(r => ({
        slug: r.get('slug'),
        text: r.get('text'),
      }));
      console.log(`LearningObjectives: ${objectives.length}\n`);

      // ── Phase 1: COVERS_TOPIC matching ───────────────────────
      console.log('=== Phase 1: COVERS_TOPIC (Entity → SubTopic) ===');

      // Pre-compute matches
      const coversPairs = [];
      for (const entity of entities) {
        for (const subtopic of subTopics) {
          if (coversMatch(entity.name, subtopic.title)) {
            coversPairs.push({ entityName: entity.name, subtopicSlug: subtopic.slug });
          }
        }
      }

      console.log(`  Found ${coversPairs.length} COVERS_TOPIC matches`);

      if (DRY_RUN) {
        console.log('  Sample matches:');
        coversPairs.slice(0, 20).forEach(p => console.log(`    ${p.entityName} → SubTopic ${p.subtopicSlug.slice(-60)}`));
      } else {
        // Bulk MERGE in batches
        for (let i = 0; i < coversPairs.length; i += BATCH_SIZE) {
          const batch = coversPairs.slice(i, i + BATCH_SIZE);
          const rows = batch.map(p => ({ name: p.entityName, slug: p.subtopicSlug }));
          await session.run(
            `UNWIND $rows AS row
             MATCH (e:Entity {name: row.name})
             MATCH (st:SubTopic {slug: row.slug})
             MERGE (e)-[:COVERS_TOPIC]->(st)`,
            { rows }
          );
          process.stdout.write(`\r  Created ${i + batch.length}/${coversPairs.length}...`);
        }
        console.log(`\n  Total COVERS_TOPIC created/merged: ${coversPairs.length}\n`);
      }

      // ── Phase 2: FULFILLS_OBJECTIVE matching ────────────────────
      console.log('=== Phase 2: FULFILLS_OBJECTIVE (Entity → LearningObjective) ===');

      const fulfillsPairs = [];
      for (const entity of entities) {
        for (const obj of objectives) {
          if (fulfillsMatch(entity.name, obj.text)) {
            fulfillsPairs.push({ entityName: entity.name, loSlug: obj.slug });
          }
        }
      }

      console.log(`  Found ${fulfillsPairs.length} FULFILLS_OBJECTIVE matches`);

      if (DRY_RUN) {
        console.log('  Sample matches:');
        fulfillsPairs.slice(0, 20).forEach(p => console.log(`    ${p.entityName} → LO ${p.loSlug.slice(-60)}`));
      } else {
        for (let i = 0; i < fulfillsPairs.length; i += BATCH_SIZE) {
          const batch = fulfillsPairs.slice(i, i + BATCH_SIZE);
          const rows = batch.map(p => ({ name: p.entityName, slug: p.loSlug }));
          await session.run(
            `UNWIND $rows AS row
             MATCH (e:Entity {name: row.name})
             MATCH (lo:LearningObjective {slug: row.slug})
             MERGE (e)-[:FULFILLS_OBJECTIVE]->(lo)`,
            { rows }
          );
          process.stdout.write(`\r  Created ${i + batch.length}/${fulfillsPairs.length}...`);
        }
        console.log(`\n  Total FULFILLS_OBJECTIVE created/merged: ${fulfillsPairs.length}\n`);
      }

      // ── Summary ────────────────────────────────────────────────
      console.log('=== Summary ===');
      console.log(`COVERS_TOPIC:   ${coversPairs.length} entity↔SubTopic links`);
      console.log(`FULFILLS_OBJECTIVE: ${fulfillsPairs.length} entity↔LO links`);

    } finally {
      await session.close();
    }
  } catch (err) {
    console.error('Link error (continuing to exit 0):', err.message);
  } finally {
    await driver.close();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
