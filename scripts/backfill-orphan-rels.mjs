#!/usr/bin/env node
/**
 * backfill-orphan-rels.mjs — backfill :BESTEHT_AUS and :GEHOERT_ZU
 * relationship types.
 *
 * The KG schema declares these rel types, but the article-ingest pipeline
 * (scripts/knowledge-graph.mjs) only ever writes :RELATED_TO. Two rel
 * types are therefore "orphan READ" — queryable but never populated.
 * This script closes the gap.
 *
 * :BESTEHT_AUS — entity composition (e.g. H2SO4 :BESTEHT_AUS {H, S, O})
 *   For entities where `components` is a list on the :Entity node, we
 *   connect it to each component entity by name. Idempotent: skips if
 *   the rel already exists.
 *
 * :GEHOERT_ZU — categorized membership. For :Entity nodes with
 *   `kategorie` set, connect to a sentinel :Category node representing
 *   that kategorie value. This makes category a first-class traversable
 *   relationship.
 *
 * Usage:  node scripts/backfill-orphan-rels.mjs [--dry-run] [--wipe]
 * Env:    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 *
 *   --dry-run   show what would change, don't write
 *   --wipe      remove existing :BESTEHT_AUS and :GEHOERT_ZU first
 *               (useful for a clean re-backfill)
 */

import neo4j from 'neo4j-driver';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const WIPE = args.has('--wipe');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const log = (msg) => console.log(`[backfill-orphan-rels] ${msg}`);

async function runWithRetry(session, cypher, params, label, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await session.run(cypher, params || {});
    } catch (err) {
      if (attempt < retries && err.code === 'SessionExpired') {
        log(`${label}: session expired, retrying (${attempt}/${retries})…`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  log(`Connecting to Neo4j: ${NEO4J_URI}`);
  if (DRY_RUN) log('DRY-RUN mode — no writes');
  if (WIPE) log('WIPE mode — will delete existing :BESTEHT_AUS and :GEHOERT_ZU');

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 10000,
  });
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.WRITE,
  });

  try {
    // ── 0. Optional wipe ────────────────────────────────────────────
    if (WIPE && !DRY_RUN) {
      const wiped = await runWithRetry(
        session,
        `MATCH ()-[r:BESTEHT_AUS|ERFUELLT_VIA_GEHOERT_ZU]->() DELETE r RETURN count(r) AS n`,
        {},
        'wipe'
      );
      log(`Wiped ${wiped.records[0].get('n').toNumber()} existing :BESTEHT_AUS / :GEHOERT_ZU rels`);
    }

    // ── 1. :BESTEHT_AUS from components list ────────────────────────
    // Some ingest paths store components as a property array on :Entity.
    // If your data model is different (separate :Component nodes), the
    // query below will simply find nothing and write nothing.
    if (!DRY_RUN) {
      const componentResult = await runWithRetry(
        session,
        `
        MATCH (e:Entity)
        WHERE e.components IS NOT NULL AND size(e.components) > 0
        UNWIND e.components AS compName
        MATCH (c:Entity) WHERE c.name = compName
        MERGE (e)-[r:BESTEHT_AUS]->(c)
        ON CREATE SET r.createdAt = datetime()
        RETURN count(DISTINCT r) AS created
        `,
        {},
        'BESTEHT_AUS'
      );
      const created = componentResult.records[0]?.get('created')?.toNumber?.() || 0;
      log(`:BESTEHT_AUS — ${created} relationships ${DRY_RUN ? 'would be' : 'created/ensured'}`);
    } else {
      const dryResult = await runWithRetry(
        session,
        `
        MATCH (e:Entity)
        WHERE e.components IS NOT NULL AND size(e.components) > 0
        UNWIND e.components AS compName
        MATCH (c:Entity) WHERE c.name = compName
        RETURN count(*) AS n
        `,
        {},
        'BESTEHT_AUS-dry'
      );
      const n = dryResult.records[0]?.get('n')?.toNumber?.() || 0;
      log(`:BESTEHT_AUS — ${n} would be created (dry-run)`);
    }

    // ── 2. :GEHOERT_ZU category membership ─────────────────────────
    // Create a :Category node per unique kategorie value, then connect
    // each :Entity to its category. Idempotent.
    if (!DRY_RUN) {
      const catResult = await runWithRetry(
        session,
        `
        MATCH (e:Entity)
        WHERE e.kategorie IS NOT NULL AND e.kategorie <> ''
        WITH DISTINCT e.kategorie AS katName
        MERGE (cat:Category {name: katName})
        ON CREATE SET cat.createdAt = datetime()
        WITH cat
        MATCH (e2:Entity {kategorie: cat.name})
        MERGE (e2)-[r:GEHOERT_ZU]->(cat)
        ON CREATE SET r.createdAt = datetime()
        RETURN count(DISTINCT r) AS created
        `,
        {},
        'GEHOERT_ZU'
      );
      const created = catResult.records[0]?.get('created')?.toNumber?.() || 0;
      log(`:GEHOERT_ZU — ${created} relationships ${DRY_RUN ? 'would be' : 'created/ensured'}`);
    } else {
      const dryResult = await runWithRetry(
        session,
        `
        MATCH (e:Entity)
        WHERE e.kategorie IS NOT NULL AND e.kategorie <> ''
        WITH DISTINCT e.kategorie AS katName
        MATCH (e2:Entity {kategorie: katName})
        RETURN count(*) AS n
        `,
        {},
        'GEHOERT_ZU-dry'
      );
      const n = dryResult.records[0]?.get('n')?.toNumber?.() || 0;
      log(`:GEHOERT_ZU — ${n} would be created (dry-run)`);
    }

    // ── 3. Stats ───────────────────────────────────────────────────
    const stats = await runWithRetry(
      session,
      `
      MATCH ()-[r:BESTEHT_AUS]->() WITH count(r) AS bc
      MATCH ()-[r2:GEHOERT_ZU]->() WITH bc, count(r2) AS gc
      MATCH (c:Category) WITH bc, gc, count(c) AS catCount
      RETURN bc, gc, catCount
      `,
      {},
      'stats'
    );
    const s = stats.records[0];
    log(
      `Final: :BESTEHT_AUS=${s.get('bc').toNumber()}, :GEHOERT_ZU=${s.get('gc').toNumber()}, :Category nodes=${s.get('catCount').toNumber()}`
    );
  } catch (err) {
    console.error('[backfill-orphan-rels] ERROR:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }

  log('Done.');
}

main();
