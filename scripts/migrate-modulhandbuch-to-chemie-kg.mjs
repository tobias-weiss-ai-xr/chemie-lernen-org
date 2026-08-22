#!/usr/bin/env node
/**
 * migrate-modulhandbuch-to-chemie-kg.mjs
 *
 * One-time migration: copy the Modulhandbuch subset (University,
 * UniversityModule, ECTS, ModuleOffering, Degree, Lecturer + their
 * relationships incl. the cross-subset bridges TEACHES/COVERS to
 * Entity and Content) from the shared chemie-neo4j instance into the
 * dedicated chemie-kg instance (the DB the API reads).
 *
 * The chemie-kg instance never received this subset: /api/modulhandbuch/*
 * returned 0 universities and the curricula graph had no university
 * nodes. This script backfills it idempotently (MERGE, no DELETE).
 *
 * Usage (run inside a container on the docker network):
 *   node scripts/migrate-modulhandbuch-to-chemie-kg.mjs
 *
 * Env (defaults match docker-compose):
 *   OLD_NEO4J_URI  bolt://chemie-neo4j:7687
 *   NEO4J_URI      bolt://chemie-kg:7687
 *   NEO4J_USER     neo4j
 *   NEO4J_PASSWORD chemie_knowledge_2024
 *   NEO4J_DATABASE chemie
 *   DRY_RUN        set → verify-only, no writes
 */

import neo4j from 'neo4j-driver';

const OLD_URI = process.env.OLD_NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEW_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const DATABASE = process.env.NEO4J_DATABASE || 'chemie';
const DRY_RUN = process.env.DRY_RUN !== undefined;

const LABELS = [
  'University',
  'UniversityModule',
  'ECTS',
  'ModuleOffering',
  'Degree',
  'Lecturer',
];

function driver(uri) {
  return neo4j.driver(uri, neo4j.auth.basic(USER, PASSWORD), {
    connectionTimeout: 10000,
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
  });
}

async function countLabel(session, label) {
  const r = await session.run(`MATCH (n:${label}) RETURN count(*) AS c`);
  return r.records[0].get('c').toNumber();
}

async function migrateNodes(oldSes, newSes, label) {
  const result = await oldSes.run(`MATCH (n:${label}) RETURN n`);
  let done = 0;
  for (const rec of result.records) {
    const node = rec.get('n');
    const props = node.properties;
    const match = nodeMergeMap(label, props);
    if (!match) {
      console.warn(`  [skip] ${label} node without key props`);
      continue;
    }
    // MERGE on the natural key, then set all props.
    await newSes.run(
      `MERGE (n:${label} {${match}})
       SET n = $props`,
      { props }
    );
    done++;
  }
  console.log(`  ${label}: ${done} nodes migrated`);
  return done;
}

async function migrateRelationships(oldSes, newSes, type) {
  const result = await oldSes.run(
    `MATCH (a)-[r:${type}]->(b)
     WHERE ANY(la IN labels(a) WHERE la IN $labels)
     RETURN a, b, type(r) AS t, labels(a)[0] AS la, labels(b)[0] AS lb`,
    { labels: LABELS }
  );
  let done = 0;
  for (const rec of result.records) {
    const a = rec.get('a');
    const b = rec.get('b');
    const la = rec.get('la');
    const lb = rec.get('lb');
    if (!a || !b) continue;

    const aMatch = nodeWhere(la, a.properties, "a");
    const bMatch = nodeWhere(lb, b.properties, "b");
    if (!aMatch || !bMatch) {
      console.warn(`  [skip] ${type}: missing key props (${la}->${lb})`);
      continue;
    }
    await newSes.run(
      `MATCH (a:${la}) WHERE ${aMatch}
       MATCH (b:${lb}) WHERE ${bMatch}
       MERGE (a)-[:${type}]->(b)`
    );
    done++;
  }
  console.log(`  ${type}: ${done} relationships migrated`);
  return done;
}

/** Key properties used to identify a node of a given label. */
function keyWhere(label, props) {
  switch (label) {
    case 'University':
      return props.short_code ? { short_code: props.short_code } : null;
    case 'UniversityModule':
    case 'ECTS':
      return props.module_code && props.university
        ? { module_code: props.module_code, university: props.university }
        : null;
    case 'ModuleOffering':
      return props.module_code && props.university && props.semester !== undefined
        ? {
            module_code: props.module_code,
            university: props.university,
            semester: props.semester,
            year: props.year || '',
          }
        : null;
    case 'Degree':
      return props.name && props.university ? { name: props.name, university: props.university } : null;
    case 'Lecturer':
      return props.name && props.university ? { name: props.name, university: props.university } : null;
    case 'Entity':
      return props.name ? { name: props.name } : null;
    case 'Content':
      return props.url ? { url: props.url } : null;
    default:
      return null;
  }
}

/** Identify a node by its label (with composite key) — Cypher map syntax for MERGE. */
function nodeMergeMap(label, props) {
  const k = keyWhere(label, props);
  return k
    ? Object.entries(k)
        .map(([p, v]) => `${p}: '${String(v).replace(/'/g, "\\'")}'`)
        .join(', ')
    : null;
}

/** WHERE clause for MATCH on the composite key. */
function nodeWhere(label, props, alias) {
  const k = keyWhere(label, props);
  return k
    ? Object.entries(k)
        .map(([p, v]) => `${alias}.${p} = '${String(v).replace(/'/g, "\\'")}'`)
        .join(' AND ')
    : null;
}

async function run() {
  console.log('[migrate-modulhandbuch] source:', OLD_URI);
  console.log('[migrate-modulhandbuch] target:', NEW_URI);
  console.log(`[migrate-modulhandbuch] DB: ${DATABASE}${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('');

  const oldDrv = driver(OLD_URI);
  const newDrv = driver(NEW_URI);
  const oldSes = oldDrv.session({ database: DATABASE });
  const newSes = newDrv.session({ database: DATABASE });

  // Source counts
  console.log('[migrate] source counts:');
  for (const label of LABELS) {
    console.log(`  ${label}: ${await countLabel(oldSes, label)}`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] no writes performed.');
    await oldSes.close();
    await newSes.close();
    await oldDrv.close();
    await newDrv.close();
    return;
  }

  // Nodes (with composite key matchers)
  await migrateNodes(oldSes, newSes, 'University');
  await migrateNodes(oldSes, newSes, 'UniversityModule');
  await migrateNodes(oldSes, newSes, 'ECTS');
  await migrateNodes(oldSes, newSes, 'ModuleOffering');
  await migrateNodes(oldSes, newSes, 'Degree');
  await migrateNodes(oldSes, newSes, 'Lecturer');

  // Relationships (both directions of the subset + cross bridges)
  for (const rel of [
    'OFFERS',
    'OFFERS_DEGREE',
    'AFFILIATED_WITH',
    'CARRIES',
    'OFFERED_IN',
    'TEACHES',
    'COVERS',
  ]) {
    await migrateRelationships(oldSes, newSes, rel);
  }

  // Verify target counts
  console.log('\n[migrate] target counts after migration:');
  for (const label of LABELS) {
    console.log(`  ${label}: ${await countLabel(newSes, label)}`);
  }

  await oldSes.close();
  await newSes.close();
  await oldDrv.close();
  await newDrv.close();
  console.log('[migrate-modulhandbuch] DONE.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
