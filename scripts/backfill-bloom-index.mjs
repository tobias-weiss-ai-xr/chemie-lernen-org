#!/usr/bin/env node
/**
 * backfill-bloom-index.mjs — populate `blooms_index` (1–6) on every
 * :LearningObjective from its `blooms_level` string.
 *
 * Idempotent: re-running only fixes missing/incorrect values. Scoped to the
 * chemie subset. Dry-run by default; pass --apply to write.
 *
 * Usage:
 *   node scripts/backfill-bloom-index.mjs            # dry run
 *   node scripts/backfill-bloom-index.mjs --apply    # write
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const BLOOM_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
const toIndex = (level) => {
  if (typeof level === 'number') return level;
  if (!level) return null;
  const i = BLOOM_ORDER.indexOf(String(level).toLowerCase());
  return i >= 0 ? i + 1 : null;
};

const APPLY = process.argv.includes('--apply');
console.log(`backfill-bloom-index: ${APPLY ? 'APPLY mode' : 'DRY RUN'}`);

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: neo4j.session.READ });

try {
  const result = await session.run(
    `MATCH (lo:LearningObjective)
     RETURN lo.slug AS slug, lo.blooms_level AS level, lo.blooms_index AS idx`
  );

  let changed = 0;
  const writeSession = APPLY
    ? driver.session({ database: NEO4J_DATABASE })
    : null;

  for (const rec of result.records) {
    const slug = rec.get('slug');
    const level = rec.get('level');
    const idx = rec.get('idx');
    const target = toIndex(level);
    if (target == null) {
      console.warn(`  skip ${slug}: unknown blooms_level="${level}"`);
      continue;
    }
    if (idx === target) continue; // already correct
    changed++;
    console.log(`  ${slug}: ${idx ?? '∅'} -> ${target} (from "${level}")`);
    if (APPLY && writeSession) {
      await writeSession.run(
        `MATCH (lo:LearningObjective {slug: $slug}) SET lo.blooms_index = $idx`,
        { slug, idx: neo4j.int(target) }
      );
    }
  }

  if (writeSession) await writeSession.close();
  console.log(`\nDone. ${changed} objective(s) ${APPLY ? 'updated' : 'would be updated'}.`);
} finally {
  await session.close();
  await driver.close();
}
