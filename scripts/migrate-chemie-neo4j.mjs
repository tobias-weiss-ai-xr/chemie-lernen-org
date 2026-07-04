#!/usr/bin/env node
/**
 * migrate-chemie-neo4j.mjs — One-time migration: export the chemie subset
 * (Entity, Document, Tag, Content) from the shared chemie-neo4j instance
 * into the dedicated chemie-kg instance.
 *
 * This leaves the old instance intact with all 28 labels (including 683k
 * code-analysis nodes). The new chemie-kg contains ONLY chemie nodes and
 * their relationships — clean, no pollution.
 *
 * Usage:
 *   node scripts/migrate-chemie-neo4j.mjs
 *
 * Environment variables (all optional, defaults for docker-compose):
 *   OLD_NEO4J_URI      — source  (default: bolt://chemie-neo4j:7687)
 *   NEO4J_URI          — target  (default: bolt://chemie-kg:7687)
 *   NEO4J_USER         — user    (default: neo4j)
 *   NEO4J_PASSWORD     — pass    (default: chemie_knowledge_2024)
 *   NEO4J_DATABASE     — db name (default: chemie)
 *   BATCH_SIZE         — per-tx  (default: 500)
 *   DRY_RUN            — if set, print what would be done (no writes)
 *   SKIP_NODES         — if set, skip node migration (rels only)
 *   SKIP_RELS          — if set, skip relationship migration (nodes only)
 */

import neo4j from 'neo4j-driver';

const OLD_URI = process.env.OLD_NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEW_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const DATABASE = process.env.NEO4J_DATABASE || 'chemie';
const BATCH = parseInt(process.env.BATCH_SIZE || '500', 10);
const DRY_RUN = process.env.DRY_RUN !== undefined;

const CHEMIE_URL_PREFIX = 'https://chemie-lernen.org';

function driver(uri) {
  return neo4j.driver(uri, neo4j.auth.basic(USER, PASSWORD), {
    connectionTimeout: 10000,
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
  });
}

async function run() {
  console.log(`[migrate] Old: ${OLD_URI}`);
  console.log(`[migrate] New: ${NEW_URI}`);
  console.log(`[migrate] DB:  ${DATABASE}`);
  console.log(`[migrate] Batch: ${BATCH}${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('');

  const oldDrv = driver(OLD_URI);
  const newDrv = driver(NEW_URI);
  const oldSes = oldDrv.session({ database: DATABASE });
  const newSes = newDrv.session({ database: DATABASE });

  const entityCount = await countNodes(oldSes, 'Entity');
  const docCount   = await countNodes(oldSes, 'Document', `WHERE n.url STARTS WITH '${CHEMIE_URL_PREFIX}'`);
  const tagCount   = await countNodes(oldSes, 'Tag');
  const contentCount = await countNodes(oldSes, 'Content');
  console.log(`[migrate] Source counts: ${entityCount} Entity, ${docCount} Document, ${tagCount} Tag, ${contentCount} Content`);

  if (!DRY_RUN && !process.env.SKIP_NODES) {
    console.log('[migrate] Migrating Entity nodes...');
    await migrateLabeledNodes(oldSes, newSes, 'Entity', 'name', BATCH);
    console.log('[migrate] Migrating Document nodes (chemie URLs only)...');
    await migrateDocuments(oldSes, newSes, BATCH);
    console.log('[migrate] Migrating Tag nodes...');
    await migrateLabeledNodes(oldSes, newSes, 'Tag', 'name', BATCH);
    console.log('[migrate] Migrating Content nodes...');
    await migrateLabeledNodes(oldSes, newSes, 'Content', 'url', BATCH);
    console.log('[migrate] Node migration complete.');
  } else if (DRY_RUN) {
    console.log('[migrate] DRY RUN: skip node migration.');
  }

  if (!DRY_RUN && !process.env.SKIP_RELS) {
    console.log('[migrate] Migrating Entity<->Entity relationships...');
    await migrateEntityRelationships(oldSes, newSes, BATCH);
    console.log('[migrate] Migrating Document->Entity MENTIONS...');
    await migrateMentions(oldSes, newSes, BATCH);
    console.log('[migrate] Migrating Tag->Document HAS_TAG...');
    await migrateHasTag(oldSes, newSes, BATCH);
    console.log('[migrate] Relationship migration complete.');
  } else if (DRY_RUN) {
    console.log('[migrate] DRY RUN: skip relationship migration.');
  }

  console.log('[migrate] Verifying target counts...');
  const newEntityCount = await countNodes(newSes, 'Entity');
  const newDocCount    = await countNodes(newSes, 'Document');
  const newTagCount    = await countNodes(newSes, 'Tag');
  const newContentCount = await countNodes(newSes, 'Content');
  console.log(`[migrate] Target counts: ${newEntityCount} Entity, ${newDocCount} Document, ${newTagCount} Tag, ${newContentCount} Content`);

  const nodeMatch = entityCount === newEntityCount && tagCount === newTagCount && contentCount === newContentCount;
  console.log(`[migrate] Matching: ${nodeMatch ? 'YES' : 'Entity/Tag/Content COUNTS DIFFER (docs filtered, expected)'}`);

  await oldSes.close();
  await newSes.close();
  await oldDrv.close();
  await newDrv.close();
  console.log('[migrate] DONE.');
}

async function countNodes(session, label, extraWhere) {
  const query = extraWhere
    ? `MATCH (n:${label} ${extraWhere}) RETURN count(*) AS c`
    : `MATCH (n:${label}) RETURN count(*) AS c`;
  const result = await session.run(query);
  return result.records[0].get('c').toNumber();
}

async function migrateLabeledNodes(oldSes, newSes, label, mergeKey, batchSize) {
  const total = await countNodes(oldSes, label);
  console.log(`  Found ${total} ${label} nodes`);

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await oldSes.run(
      `MATCH (n:${label}) RETURN n, labels(n) AS lbls ORDER BY n.${mergeKey} SKIP ${offset} LIMIT ${batchSize}`
    );

    for (const record of result.records) {
      const node = record.get('n');
      const labels = record.get('lbls');
      const props = node.properties;

      // Build a sanitized properties object
      const cleanProps = {};
      for (const [k, v] of Object.entries(props)) {
        cleanProps[k] = v;
      }

      // Build MERGE key condition
      const keyVal = cleanProps[mergeKey];
      const mergeCondition = `{${mergeKey}: $keyVal}`;

      // Merge node with all its labels
      const labelsStr = labels.map(l => `\`${l}\``).join(':');
      await newSes.run(
        `MERGE (n:${labelsStr} ${mergeCondition}) SET n = $props`,
        { keyVal, props: cleanProps }
      );
    }

    const done = Math.min(offset + batchSize, total);
    console.log(`  ${label}: ${done}/${total}`);
  }
}

async function migrateDocuments(oldSes, newSes, batchSize) {
  const total = await countNodes(oldSes, 'Document', `WHERE n.url STARTS WITH '${CHEMIE_URL_PREFIX}'`);
  console.log(`  Found ${total} chemie Document nodes`);

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await oldSes.run(
      `MATCH (d:Document) WHERE d.url STARTS WITH '${CHEMIE_URL_PREFIX}' RETURN d, labels(d) AS lbls ORDER BY d.url SKIP ${offset} LIMIT ${batchSize}`
    );

    for (const record of result.records) {
      const node = record.get('d');
      const labels = record.get('lbls');
      const props = node.properties;
      const cleanProps = {};
      for (const [k, v] of Object.entries(props)) {
        cleanProps[k] = v;
      }

      const labelsStr = labels.map(l => `\`${l}\``).join(':');
      await newSes.run(
        `MERGE (n:${labelsStr} {url: $url}) SET n = $props`,
        { url: cleanProps.url, props: cleanProps }
      );
    }

    const done = Math.min(offset + batchSize, total);
    console.log(`  Document: ${done}/${total}`);
  }
}

async function migrateEntityRelationships(oldSes, newSes, batchSize) {
  // Get all distinct relationship types between Entity nodes
  const typeResult = await oldSes.run(
    `MATCH (a:Entity)-[r]-(b:Entity) RETURN DISTINCT type(r) AS t ORDER BY t`
  );
  const relTypes = typeResult.records.map(r => r.get('t'));
  console.log(`  Found ${relTypes.length} relationship types: ${relTypes.join(', ')}`);

  for (const relType of relTypes) {
    const countResult = await oldSes.run(
      `MATCH (a:Entity)-[r:${relType}]-(b:Entity) RETURN count(*) AS c`
    );
    const total = countResult.records[0].get('c').toNumber();
    console.log(`  Migrating ${total} :${relType} relationships`);

    for (let offset = 0; offset < total; offset += batchSize) {
      // Use startNode/endNode for correct relationship direction
      const result = await oldSes.run(
        `MATCH (a:Entity)-[r:${relType}]-(b:Entity) RETURN startNode(r).name AS srcName, endNode(r).name AS tgtName, properties(r) AS rprops SKIP ${offset} LIMIT ${batchSize}`
      );

      // Build batch data for UNWIND
      const batchData = result.records.map((rec) => ({
        src: rec.get('srcName'),
        tgt: rec.get('tgtName'),
        props: Object.keys(rec.get('rprops') || {}).length > 0
          ? Object.fromEntries(Object.entries(rec.get('rprops')).map(([k, v]) => [k, v]))
          : null,
      }));

      if (batchData.length > 0) {
        await newSes.run(
          `UNWIND $batch AS row
           MATCH (a:Entity {name: row.src})
           MATCH (b:Entity {name: row.tgt})
           MERGE (a)-[r:${relType}]->(b)
           FOREACH (_ IN CASE WHEN row.props IS NOT NULL THEN [1] ELSE [] END |
             SET r = row.props
           )`,
          { batch: batchData }
        );
      }

      const done = Math.min(offset + batchSize, total);
      console.log(`    :${relType} ${done}/${total}`);
    }
  }
}

async function migrateMentions(oldSes, newSes, batchSize) {
  const countResult = await oldSes.run(
    `MATCH (d:Document)-[r:MENTIONS]->(e:Entity) RETURN count(*) AS c`
  );
  const total = countResult.records[0].get('c').toNumber();
  console.log(`  Found ${total} MENTIONS relationships`);

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await oldSes.run(
      `MATCH (d:Document)-[r:MENTIONS]->(e:Entity)
       WHERE d.url STARTS WITH '${CHEMIE_URL_PREFIX}'
       RETURN d.url AS docUrl, e.name AS entityName, properties(r) AS rprops
       SKIP ${offset} LIMIT ${batchSize}`
    );

    const batchData = result.records.map((rec) => ({
      doc: rec.get('docUrl'),
      ent: rec.get('entityName'),
      props: Object.keys(rec.get('rprops') || {}).length > 0
        ? Object.fromEntries(Object.entries(rec.get('rprops')).map(([k, v]) => [k, v]))
        : null,
    }));

    if (batchData.length > 0) {
      await newSes.run(
        `UNWIND $batch AS row
         MATCH (d:Document {url: row.doc})
         MATCH (e:Entity {name: row.ent})
         MERGE (d)-[r:MENTIONS]->(e)
         FOREACH (_ IN CASE WHEN row.props IS NOT NULL THEN [1] ELSE [] END |
           SET r = row.props
         )`,
        { batch: batchData }
      );
    }

    const done = Math.min(offset + batchSize, total);
    console.log(`    MENTIONS ${done}/${total}`);
  }
}

async function migrateHasTag(oldSes, newSes, batchSize) {
  const countResult = await oldSes.run(
    `MATCH (t:Tag)-[r:HAS_TAG]->(d:Document) RETURN count(*) AS c`
  );
  const total = countResult.records[0].get('c').toNumber();
  console.log(`  Found ${total} HAS_TAG relationships`);

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await oldSes.run(
      `MATCH (t:Tag)-[r:HAS_TAG]->(d:Document)
       WHERE d.url STARTS WITH '${CHEMIE_URL_PREFIX}'
       RETURN t.name AS tagName, d.url AS docUrl, properties(r) AS rprops
       SKIP ${offset} LIMIT ${batchSize}`
    );

    const batchData = result.records.map((rec) => ({
      tag: rec.get('tagName'),
      doc: rec.get('docUrl'),
      props: Object.keys(rec.get('rprops') || {}).length > 0
        ? Object.fromEntries(Object.entries(rec.get('rprops')).map(([k, v]) => [k, v]))
        : null,
    }));

    if (batchData.length > 0) {
      await newSes.run(
        `UNWIND $batch AS row
         MATCH (t:Tag {name: row.tag})
         MATCH (d:Document {url: row.doc})
         MERGE (t)-[r:HAS_TAG]->(d)
         FOREACH (_ IN CASE WHEN row.props IS NOT NULL THEN [1] ELSE [] END |
           SET r = row.props
         )`,
        { batch: batchData }
      );
    }

    const done = Math.min(offset + batchSize, total);
    console.log(`    HAS_TAG ${done}/${total}`);
  }
}

run().catch((err) => {
  console.error('[migrate] FATAL:', err);
  process.exit(1);
});
