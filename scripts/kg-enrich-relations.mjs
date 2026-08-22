#!/usr/bin/env node
/**
 * kg-enrich-relations.mjs — Generate semantic relationships in the KG.
 *
 * Three phases:
 *   1. Typing:  Map existing RELATED_TO → semantic types (AEHNLICH_ZU, BEINHALTET, etc.)
 *   2. Name:    Generate AEHNLICH_ZU between entities with similar names (top 1000 entities)
 *   3. Comp:    Generate BEINHALTET from existing BESTEHT_AUS/component relationships
 *
 * Phases 2+3 run independently of existing RELATED_TO relationships.
 * All operations capped at 1000 entities to keep runtime reasonable.
 *
 * Usage:  node scripts/kg-enrich-relations.mjs [--dry-run]
 * Env:    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 */

import neo4j from 'neo4j-driver';

// ── Config ──
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_ENTITIES = 1000;

// ── Name normalization for comparison ─────────────────────────────────

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[-/\s]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// ── Typisierungsmatrix ──
// Quelle | Ziel | Neuer Typ | Bedeutung
const TYPISIERUNGS_MATRIX = [
  ['stoff', 'stoff', 'AEHNLICH_ZU'],
  ['stoff', 'konzept', 'BEINHALTET'],
  ['stoff', 'reaktion', 'BETEILIGT_AN'],
  ['stoff', 'methode', 'WIRD_VERWENDET_IN'],
  ['konzept', 'konzept', 'VERALLGEMEINERT'],
  ['konzept', 'stoff', 'BESCHREIBT'],
  ['konzept', 'reaktion', 'BESCHREIBT'],
  ['reaktion', 'reaktion', 'VERGLEICHBAR'],
  ['reaktion', 'stoff', 'ERZEUGT'],
  ['reaktion', 'konzept', 'DEMONSTRIERT'],
  ['methode', 'stoff', 'VERWENDET'],
  ['methode', 'konzept', 'WENDET_AN'],
  ['person', 'stoff', 'ENTDECKT'],
  ['person', 'konzept', 'ENTDECKT'],
  ['person', 'reaktion', 'ENTDECKT'],
  ['quelle', 'stoff', 'QUELLE_VON'],
  ['quelle', 'konzept', 'QUELLE_VON'],
  ['quelle', 'reaktion', 'QUELLE_VON'],
  ['quelle', 'methode', 'QUELLE_VON'],
  ['quelle', 'person', 'QUELLE_VON'],
];

function getNewType(srcCat, tgtCat) {
  for (const [s, t, type] of TYPISIERUNGS_MATRIX) {
    if (s === srcCat && t === tgtCat) return type;
  }
  return null;
}

// ── Jaccard similarity for entity names ───────────────────────────────

function wordJaccard(a, b) {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ── Phase 1: Type existing RELATED_TO ─────────────────────────────────

async function phaseTypeRels(session) {
  console.log('[kg-enrich] Phase 1: Typing existing RELATED_TO...');

  const result = await session.run(`
    MATCH (e:Entity)-[r:RELATED_TO]->(e2:Entity)
    WHERE e.kategorie IN ['stoff','konzept','reaktion','methode','person','quelle']
      AND e2.kategorie IN ['stoff','konzept','reaktion','methode','person','quelle']
    RETURN e.name as srcName, e.kategorie as srcCat,
           e2.name as tgtName, e2.kategorie as tgtCat,
           id(e) as srcId, id(e2) as tgtId
  `);

  console.log(`  RELATED_TO pairs found: ${result.records.length}`);

  const toCreate = [];
  for (const rec of result.records) {
    const srcCat = rec.get('srcCat');
    const tgtCat = rec.get('tgtCat');
    const newType = getNewType(srcCat, tgtCat);
    if (newType) {
      toCreate.push({
        srcId: rec.get('srcId'),
        tgtId: rec.get('tgtId'),
        srcName: rec.get('srcName'),
        tgtName: rec.get('tgtName'),
        newType,
        srcCat,
        tgtCat,
      });
    }
  }

  console.log(`  To create: ${toCreate.length} typed relationships`);

  if (DRY_RUN) {
    const byType = {};
    for (const c of toCreate) {
      byType[c.newType] = (byType[c.newType] || 0) + 1;
    }
    for (const [type, cnt] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${type}: ${cnt}`);
    }
    return 0;
  }

  let created = 0;
  let errors = 0;
  for (const c of toCreate) {
    try {
      const check = await session.run(
        `MATCH (e:Entity)-[r:${c.newType}]->(e2:Entity)
         WHERE id(e) = $srcId AND id(e2) = $tgtId
         RETURN count(r) as cnt`,
        { srcId: c.srcId, tgtId: c.tgtId }
      );
      if (check.records[0].get('cnt').toNumber() > 0) continue;

      await session.run(
        `MATCH (e:Entity) WHERE id(e) = $srcId
         MATCH (e2:Entity) WHERE id(e2) = $tgtId
         CREATE (e)-[r:${c.newType}]->(e2)`,
        { srcId: c.srcId, tgtId: c.tgtId }
      );
      created++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error ${c.newType} ${c.srcName}→${c.tgtName}: ${err.message}`);
      }
    }
  }
  console.log(`  Created: ${created}, Errors: ${errors}`);
  return created;
}

// ── Phase 2: AEHNLICH_ZU by name similarity ───────────────────────────

async function phaseNameSimilarity(session) {
  console.log('[kg-enrich] Phase 2: AEHNLICH_ZU by name similarity...');

  const result = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN ['stoff','konzept','reaktion']
     RETURN e.name AS name, id(e) AS id
     ORDER BY e.name
     LIMIT ${MAX_ENTITIES}`
  );
  console.log(`  Entities loaded: ${result.records.length}`);

  const entities = result.records.map((r) => ({
    id: r.get('id'),
    name: r.get('name'),
    norm: normalize(r.get('name')),
  }));

  const pairs = [];
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const sim = wordJaccard(entities[i].norm, entities[j].norm);
      if (sim >= 0.4 && entities[i].norm !== entities[j].norm) {
        pairs.push({ a: entities[i], b: entities[j], sim });
      }
    }
  }

  // Cap pairs at 1000
  if (pairs.length > 1000) {
    pairs.sort((a, b) => b.sim - a.sim);
    pairs.length = 1000;
  }

  console.log(`  Similar name pairs: ${pairs.length}`);

  if (DRY_RUN) {
    for (const p of pairs.slice(0, 10)) {
      console.log(`    AEHNLICH_ZU: "${p.a.name}" ↔ "${p.b.name}" (sim=${p.sim.toFixed(2)})`);
    }
    if (pairs.length > 10) console.log(`    ... and ${pairs.length - 10} more`);
    return 0;
  }

  let created = 0;
  let errors = 0;
  for (const p of pairs) {
    try {
      // Use MERGE for both directions (bidirectional similarity)
      await session.run(
        `MATCH (a:Entity) WHERE id(a) = $aId
         MATCH (b:Entity) WHERE id(b) = $bId
         MERGE (a)-[:AEHNLICH_ZU]->(b)
         MERGE (b)-[:AEHNLICH_ZU]->(a)`,
        { aId: p.a.id, bId: p.b.id }
      );
      created++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error AEHNLICH_ZU ${p.a.name}↔${p.b.name}: ${err.message}`);
      }
    }
  }
  console.log(`  Created: ${created} bidirectional pairs, Errors: ${errors}`);
  return created;
}

// ── Phase 3: BEINHALTET from component relationships ──────────────────

async function phaseComponentBeinhaltet(session) {
  console.log('[kg-enrich] Phase 3: BEINHALTET from component relationships...');

  const result = await session.run(
    `MATCH (e:Entity)-[r:BESTEHT_AUS]->(comp:Entity)
     WHERE e.kategorie IN ['stoff', 'konzept']
     RETURN e.name AS srcName, id(e) AS srcId,
            comp.name AS tgtName, id(comp) AS tgtId,
            e.kategorie AS srcCat, comp.kategorie AS tgtCat
     LIMIT ${MAX_ENTITIES}`
  );
  console.log(`  BESTEHT_AUS pairs found: ${result.records.length}`);

  const toCreate = [];
  for (const rec of result.records) {
    const srcCat = rec.get('srcCat');
    const tgtCat = rec.get('tgtCat');
    // BEINHALTET: stoff→konzept or konzept→stoff
    if (
      (srcCat === 'stoff' && tgtCat === 'konzept') ||
      (srcCat === 'konzept' && tgtCat === 'stoff') ||
      (srcCat === 'stoff' && tgtCat === 'stoff')
    ) {
      toCreate.push({
        srcId: rec.get('srcId'),
        tgtId: rec.get('tgtId'),
        srcName: rec.get('srcName'),
        tgtName: rec.get('tgtName'),
      });
    }
  }
  console.log(`  BEINHALTET candidates: ${toCreate.length}`);

  if (DRY_RUN) {
    for (const c of toCreate.slice(0, 10)) {
      console.log(`    BEINHALTET: "${c.srcName}" → "${c.tgtName}"`);
    }
    if (toCreate.length > 10) console.log(`    ... and ${toCreate.length - 10} more`);
    return 0;
  }

  let created = 0;
  let errors = 0;
  for (const c of toCreate) {
    try {
      await session.run(
        `MATCH (e:Entity) WHERE id(e) = $srcId
         MATCH (e2:Entity) WHERE id(e2) = $tgtId
         MERGE (e)-[:BEINHALTET]->(e2)`,
        { srcId: c.srcId, tgtId: c.tgtId }
      );
      created++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error BEINHALTET ${c.srcName}→${c.tgtName}: ${err.message}`);
      }
    }
  }
  console.log(`  Created: ${created}, Errors: ${errors}`);
  return created;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('[kg-enrich-relations] ' + (DRY_RUN ? 'DRY RUN' : 'LIVE') + ' — ' + NEO4J_URI);
  console.log();

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  const mode = DRY_RUN ? neo4j.session.READ : neo4j.session.WRITE;
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: mode,
    fetchSize: 1000,
  });

  try {
    const p1 = await phaseTypeRels(session);
    console.log(`  [Phase 1] Created: ${p1}\n`);

    const p2 = await phaseNameSimilarity(session);
    console.log(`  [Phase 2] Created: ${p2}\n`);

    const p3 = await phaseComponentBeinhaltet(session);
    console.log(`  [Phase 3] Created: ${p3}\n`);

    const total = p1 + p2 + p3;
    console.log(`[kg-enrich-relations] Done. Total relationships created/estimated: ${total}`);
  } catch (err) {
    console.error('[kg-enrich-relations] ERROR:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
