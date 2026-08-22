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

export const BLOOM_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

/**
 * Convert a Bloom's level (string or number) to its numeric index (1–6).
 * Returns null for unknown or missing levels.
 */
export const toIndex = (level) => {
  if (typeof level === 'number') return level;
  if (!level) return null;
  const i = BLOOM_ORDER.indexOf(String(level).toLowerCase());
  return i >= 0 ? i + 1 : null;
};

/**
 * Core backfill logic — DB-free when mocked, idempotent by design.
 *
 * @param {{ run: Function }} readSession  - session with READ access
 * @param {{ run: Function, close: Function } | null} writeSession - writable session (null for dry-run)
 * @param {object} [options]
 * @param {Function} [options.logger]      - override console.log (default: console.log)
 * @param {Function} [options.warn]        - override console.warn (default: console.warn)
 * @returns {Promise<{ changed: number, skipped: number }>}
 */
export async function backfillBloomIndex(readSession, writeSession, options = {}) {
  const log = options.logger ?? console.log.bind(console);
  const warn = options.warn ?? console.warn.bind(console);

  const result = await readSession.run(
    `MATCH (lo:LearningObjective)
     RETURN lo.slug AS slug, lo.blooms_level AS level, lo.blooms_index AS idx`,
  );

  let changed = 0;
  let skipped = 0;

  for (const rec of result.records) {
    const slug = rec.get('slug');
    const level = rec.get('level');
    const idx = rec.get('idx');
    const target = toIndex(level);
    if (target == null) {
      warn(`  skip ${slug}: unknown blooms_level="${level}"`);
      skipped++;
      continue;
    }
    if (idx === target) continue; // already correct — idempotent
    changed++;
    log(`  ${slug}: ${idx ?? '∅'} -> ${target} (from "${level}")`);
    if (writeSession) {
      await writeSession.run(
        `MATCH (lo:LearningObjective {slug: $slug}) SET lo.blooms_index = $idx`,
        { slug, idx: neo4j.int(target) },
      );
    }
  }

  return { changed, skipped };
}

/**
 * CLI entry point — connects to Neo4j, runs backfill, prints summary.
 */
export async function main() {
  const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
  const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
  const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
  const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

  const APPLY = process.argv.includes('--apply');
  console.log(`backfill-bloom-index: ${APPLY ? 'APPLY mode' : 'DRY RUN'}`);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: neo4j.session.READ });

  try {
    const writeSession = APPLY
      ? driver.session({ database: NEO4J_DATABASE })
      : null;

    const { changed, skipped } = await backfillBloomIndex(session, writeSession);

    if (writeSession) await writeSession.close();
    console.log(
      `\nDone. ${changed} objective(s) ${APPLY ? 'updated' : 'would be updated'}.` +
        (skipped > 0 ? ` ${skipped} skipped.` : ''),
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run CLI when executed directly (not when imported as a module)
const isDirectRun = process.argv[1] && process.argv[1].endsWith('backfill-bloom-index.mjs');
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
