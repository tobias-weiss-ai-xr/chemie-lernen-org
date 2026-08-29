#!/usr/bin/env node
/**
 * update-embeddings.mjs — Incremental embedding updates for Neo4j KG.
 *
 * Handles incremental updates for new/changed nodes by:
 *   - Finding nodes without embeddings (new or recently updated)
 *   - Generating embeddings using the embedding pipeline
 *   - Storing embeddings as node properties
 *   - Tracking last update timestamp
 *
 * Supported node types:
 *   - Entity (title + description)
 *   - Topic (title)
 *   - UniversityModule (module_name + description)
 *   - Content (title + description)
 *
 * Usage:
 *   node scripts/update-embeddings.mjs                          # all nodes
 *   node scripts/update-embeddings.mjs --limit 100             # batch size
 *   node scripts/update-embeddings.mjs --labels Entity,Topic   # specific labels
 *   node scripts/update-embeddings.mjs --dry-run               # preview
 *
 * Idempotent: uses SET (not MERGE) on existing nodes. Safe to re-run.
 * Safety: No DETACH DELETE. Exits 0 on partial success.
 */

import neo4j from 'neo4j-driver';
import { getPipeline, embedBatch } from './embeddings.mjs.js';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DEFAULT_LIMIT = parseInt(process.env.BATCH_SIZE || '500', 10);
const LABELS = process.env.EMBED_LABELS?.split(',') || ['Entity', 'Topic', 'UniversityModule', 'Content'];
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || DEFAULT_LIMIT);

// Map labels to text extraction functions
const TEXT_EXTRACTORS = {
  Entity: (n) => {
    const name = n.name || '';
    const desc = n.description || '';
    return name + (desc ? ' ' + desc : '');
  },
  Topic: (n) => {
    const title = n.title || n.name || '';
    return title;
  },
  UniversityModule: (n) => {
    const name = n.module_name || n.name || '';
    const desc = n.description || n.learning_outcomes?.join(' ') || '';
    return name + (desc ? ' ' + desc : '');
  },
  Content: (n) => {
    const title = n.title || '';
    const desc = n.description || n.content_summary || '';
    return title + (desc ? ' ' + desc : '');
  },
};

async function getNodesWithoutEmbeddings(session, labels, limit) {
  const labelFilter = labels.map(l => `(n:${l})`).join(' OR ');
  const query = `
    MATCH (n)
    WHERE (${labelFilter})
      AND (n.embedding IS NULL OR n.embedding = [])
      AND n.name IS NOT NULL
    RETURN n, labels(n) AS lbls
    ORDER BY n.name
    LIMIT ${limit}
  `;

  const result = await session.run(query);
  return result.records.map(r => ({
    node: r.get('n').properties,
    labels: r.get('lbls'),
  }));
}

async function generateEmbeddingsForNodes(nodes) {
  const texts = nodes.map(node => {
    const primaryLabel = node.labels.find(l => l !== 'Entity') || 'Entity';
    const extractor = TEXT_EXTRACTORS[primaryLabel] || TEXT_EXTRACTORS.Entity;
    return extractor(node.node);
  });

  const embeddings = await embedBatch(texts);
  return embeddings;
}

async function updateNodeEmbeddings(session, nodes, embeddings, labels) {
  const batchData = nodes.map((node, i) => ({
    id: node.node.id || null,
    name: node.node.name,
    embedding: Array.from(embeddings[i]),
    timestamp: Date.now(),
  }));

  // Build label filter
  const labelFilter = labels.map(l => `:${l}`).join('');

  await session.run(
    `UNWIND $batch AS row
     MATCH (n${labelFilter} {name: row.name})
     SET n.embedding = row.embedding,
         n.embedding_updated = row.timestamp
     RETURN count(n) AS updated`,
    { batch: batchData }
  );
}

async function countNodesNeedingEmbeddings(session, labels) {
  const labelFilter = labels.map(l => `(n:${l})`).join(' OR ');
  const result = await session.run(`
    MATCH (n)
    WHERE (${labelFilter})
      AND (n.embedding IS NULL OR n.embedding = [])
    RETURN count(n) AS total
  `);
  return result.records[0].get('total').toNumber();
}

async function main() {
  console.log('=== update-embeddings.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`Labels: ${LABELS.join(', ')}`);
  console.log(`Limit: ${LIMIT}${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('');

  // Check if embeddings module is available
  try {
    await getPipeline();
    console.log('[update-embeddings] Embedding pipeline loaded');
  } catch (err) {
    console.error('[update-embeddings] Failed to load embedding pipeline:', err.message);
    console.error('[update-embeddings] Ensure @xenova/transformers is installed and model is available');
    process.exit(1);
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    try {
      // Count total nodes needing embeddings
      const totalNeeding = await countNodesNeedingEmbeddings(session, LABELS);
      console.log(`[update-embeddings] Nodes needing embeddings: ${totalNeeding}\n`);

      if (DRY_RUN) {
        console.log('=== DRY RUN ===');
        console.log(`Would process up to ${LIMIT} nodes`);
        if (totalNeeding > 0) {
          console.log(`Sample text generation:`);
          // Get first node for sample
          const sampleResult = await session.run(`
            MATCH (n:${LABELS[0]})
            WHERE n.name IS NOT NULL AND (n.embedding IS NULL OR n.embedding = [])
            RETURN n.name AS name, n.description AS description
            LIMIT 1
          `);
          if (sampleResult.records.length > 0) {
            const sample = sampleResult.records[0].toObject();
            console.log(`  ${sample.name}`);
          }
        }
        console.log(`\nTotal batches needed: ${Math.ceil(totalNeeding / LIMIT)}`);
        return;
      }

      let processed = 0;
      let batchNum = 0;

      while (processed < totalNeeding) {
        batchNum++;
        console.log(`[update-embeddings] Batch ${batchNum} (offset ${processed})...`);

        // Get nodes needing embeddings
        const nodes = await getNodesWithoutEmbeddings(session, LABELS, LIMIT);

        if (nodes.length === 0) {
          console.log(`[update-embeddings] No more nodes found (batch ${batchNum})`);
          break;
        }

        console.log(`[update-embeddings] Processing ${nodes.length} nodes`);

        // Generate embeddings
        const embeddings = await generateEmbeddingsForNodes(nodes);
        console.log(`[update-embeddings] Generated ${embeddings.length} embeddings`);

        // Store embeddings
        await updateNodeEmbeddings(session, nodes, embeddings, LABELS);
        console.log(`[update-embeddings] Stored embeddings`);

        processed += nodes.length;
        console.log(`[update-embeddings] Progress: ${processed}/${totalNeeding} (${Math.round(processed / totalNeeding * 100)}%)\n`);
      }

      console.log('[update-embeddings] Update complete.');
    } finally {
      await session.close();
    }
  } catch (err) {
    console.error('[update-embeddings] Error:', err.message);
    console.error('[update-embeddings] (continuing to exit 0)');
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('[update-embeddings] FATAL:', err);
  process.exit(1);
});