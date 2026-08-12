#!/usr/bin/env node
/**
 * export-graph-backup.mjs — full chunked JSON export of the chemie-kg
 * knowledge graph for the dedicated backup repository.
 *
 * Exports EVERY node and EVERY relationship (no caps, no kategorie
 * filtering) so the backup is a complete restore source. Files are
 * chunked so no single file exceeds a safe git size (no LFS needed).
 *
 * Output layout (TARGET_DIR):
 *   meta.json                       — counts, generatedAt, env info
 *   nodes/<Label>/<Label>_<n>.json  — node properties, chunked
 *   edges/<TYPE>/<TYPE>_<n>.json    — {sourceLabel, sourceKey, sourceProps,
 *                                     targetLabel, targetKey, targetProps,
 *                                     type, props} per edge, chunked
 *
 * Node identity: nodes carry their primary-key props so a restore can
 * MERGE them back. All props are JSON-safe (Neo4j Integer → number).
 *
 * Usage:
 *   node scripts/export-graph-backup.mjs [target-dir]
 * Env: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE,
 *      CHUNK_NODES (default 5000), CHUNK_EDGES (default 20000)
 */

import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';
const CHUNK_NODES = parseInt(process.env.CHUNK_NODES || '5000', 10);
const CHUNK_EDGES = parseInt(process.env.CHUNK_EDGES || '20000', 10);

const TARGET = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', 'graph-backup');

/** Convert Neo4j values (Integer, Date, arrays, objects) to JSON-safe. */
function toJson(v) {
  if (v == null) return v;
  if (neo4j.isInt(v)) return v.toNumber();
  if (Array.isArray(v)) return v.map(toJson);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if (v.toString && v.toString() !== '[object Object]') {
      const s = v.toString();
      // Neo4j temporal/spatial types stringify usefully.
      if (!s.startsWith('{') && !s.startsWith('[')) return s;
    }
    const out = {};
    for (const k of Object.keys(v)) out[k] = toJson(v[k]);
    return out;
  }
  return v;
}

function propsOf(node) {
  const out = {};
  for (const k of Object.keys(node.properties || {})) {
    out[k] = toJson(node.properties[k]);
  }
  return out;
}

async function writeChunks(baseDir, prefix, rows, chunkSize) {
  fs.mkdirSync(baseDir, { recursive: true });
  let n = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const file = path.join(baseDir, `${prefix}_${n}.json`);
    fs.writeFileSync(file, JSON.stringify(slice));
    n++;
  }
  return n;
}

async function run() {
  console.log(`[export-graph-backup] ${NEO4J_URI} → ${TARGET}`);
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 15000,
  });
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
    fetchSize: 5000,
  });

  const meta = {
    source: NEO4J_URI,
    database: NEO4J_DATABASE,
    generatedAt: new Date().toISOString(),
    chunkNodes: CHUNK_NODES,
    chunkEdges: CHUNK_EDGES,
    labels: {},
    relTypes: {},
  };

  try {
    // Safety: the central chemie-neo4j instance holds ~683k code-analysis
    // nodes. This backup targets chemie-kg (the site graph). If the source
    // reports a vastly larger node count, refuse before writing anything.
    const sanity = await session.run('MATCH (n) RETURN count(n) AS c');
    const sanityCount = sanity.records[0].get('c').toNumber();
    if (sanityCount > 300000) {
      throw new Error(
        `source has ${sanityCount} nodes — looks like the central chemie-neo4j ` +
          'instance, not chemie-kg. Set NEO4J_URI to bolt://localhost:7688 (chemie-kg).'
      );
    }

    // ── Nodes, grouped by label ────────────────────────────────────
    const labelResult = await session.run(
      'MATCH (n) UNWIND labels(n) AS l RETURN DISTINCT l ORDER BY l'
    );
    const labels = labelResult.records.map((r) => r.get('l'));
    let totalNodes = 0;
    for (const label of labels) {
      const r = await session.run(
        `MATCH (n:${label}) RETURN n ORDER BY n.name, n.url, n.slug LIMIT 1000000`
      );
      const rows = r.records.map((rec) => {
        const p = propsOf(rec.get('n'));
        // include labels for multi-label nodes
        return { labels: [label], ...p };
      });
      const dir = path.join(TARGET, 'nodes', label);
      const files = await writeChunks(dir, label, rows, CHUNK_NODES);
      meta.labels[label] = { count: rows.length, files };
      totalNodes += rows.length;
      console.log(`  nodes ${label}: ${rows.length} (${files} file${files === 1 ? '' : 's'})`);
    }

    // ── Edges, grouped by type ────────────────────────────────────
    const typeResult = await session.run(
      'MATCH ()-[rel]->() RETURN DISTINCT type(rel) AS t ORDER BY t'
    );
    const relTypes = typeResult.records.map((r) => r.get('t'));
    let totalEdges = 0;
    for (const type of relTypes) {
      const r = await session.run(
        `MATCH (a)-[rel:${type}]->(b) RETURN a, rel, b LIMIT 1000000`
      );
      const rows = r.records.map((rec) => {
        const a = rec.get('a');
        const b = rec.get('b');
        const rel = rec.get('rel');
        return {
          source: { labels: a.labels, props: propsOf(a) },
          target: { labels: b.labels, props: propsOf(b) },
          type,
          props: propsOf(rel),
        };
      });
      const dir = path.join(TARGET, 'edges', type);
      const files = await writeChunks(dir, type, rows, CHUNK_EDGES);
      meta.relTypes[type] = { count: rows.length, files };
      totalEdges += rows.length;
      console.log(`  edges ${type}: ${rows.length} (${files} file${files === 1 ? '' : 's'})`);
    }

    meta.totals = { nodes: totalNodes, edges: totalEdges };
    fs.mkdirSync(TARGET, { recursive: true });
    fs.writeFileSync(path.join(TARGET, 'meta.json'), JSON.stringify(meta, null, 2));
    console.log(`[export-graph-backup] DONE: ${totalNodes} nodes, ${totalEdges} edges → ${TARGET}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

run().catch((e) => {
  console.error('[export-graph-backup] FAILED:', e.message || e);
  process.exit(1);
});
