#!/usr/bin/env node
/**
 * migrate-content-labels.mjs — ELP-10
 *
 * One-time migration: adds sub-labels to existing :Content nodes based on
 * their `type` property so type-specific queries are cleaner:
 *
 *   :Content {type:'article'}   → + :Article
 *   :Content {type:'calculator'} → + :Calculator
 *
 * Also creates INDEX on each sub-label for fast lookups.
 *
 * Usage:
 *   node scripts/curricula/migrate-content-labels.mjs           # run
 *   node scripts/curricula/migrate-content-labels.mjs --dry-run # preview
 */

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = 'chemie';

const TYPE_LABEL_MAP = {
  article: 'Article',
  calculator: 'Calculator',
  exercise: 'Exercise',
};

const isDryRun = process.argv.includes('--dry-run');

async function run() {
  if (!NEO4J_PASSWORD) {
    console.log('[migrate-content-labels] NEO4J_PASSWORD not set');
    process.exit(1);
  }

  const neo4j = await import('neo4j-driver');
  const driver = neo4j.default.driver(
    NEO4J_URI,
    neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  );

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    // Count existing Content nodes by type
    const countResult = await session.run(
      'MATCH (c:Content) RETURN c.type AS type, count(*) AS cnt ORDER BY cnt DESC',
    );
    console.log('[migrate-content-labels] Current Content nodes by type:');
    const totals = {};
    for (const rec of countResult.records) {
      const type = rec.get('type') || 'null';
      const cnt = rec.get('cnt').toNumber();
      totals[type] = cnt;
      console.log(`  ${type}: ${cnt}`);
    }
    const totalNodes = countResult.records.reduce((s, r) => s + r.get('cnt').toNumber(), 0);
    console.log(`  TOTAL: ${totalNodes}`);

    if (isDryRun) {
      const wouldAdd = {};
      for (const [type, label] of Object.entries(TYPE_LABEL_MAP)) {
        if (totals[type]) wouldAdd[label] = totals[type];
      }
      console.log('\n[migrate-content-labels] DRY RUN — would add labels:');
      for (const [label, count] of Object.entries(wouldAdd)) {
        console.log(`  :${label} → ${count} nodes`);
      }
      console.log('  (no changes made)');
      process.exit(0);
    }

    // Add sub-labels per type
    for (const [type, label] of Object.entries(TYPE_LABEL_MAP)) {
      if (!totals[type]) {
        console.log(`\n[migrate-content-labels] No nodes with type='${type}' — skipping :${label}`);
        continue;
      }
      console.log(`\n[migrate-content-labels] Adding :${label} label to ${totals[type]} nodes...`);

      const result = await session.run(
        `MATCH (c:Content {type: $type}) SET c:${label} RETURN count(*) AS cnt`,
        { type },
      );
      const updated = result.records[0].get('cnt').toNumber();
      console.log(`  Updated ${updated} nodes with :${label}`);

      // Create index for this sub-label
      await session.run(`CREATE INDEX content_${label.toLowerCase()}_url IF NOT EXISTS FOR (c:${label}) ON (c.url)`);
      console.log(`  INDEX created for :${label}(url)`);
    }

    // Verify
    const verify = await session.run(
      'MATCH (c:Content) RETURN labels(c) AS labels, count(*) AS cnt ORDER BY cnt DESC',
    );
    console.log('\n[migrate-content-labels] Verification — label combinations:');
    for (const rec of verify.records) {
      const labels = rec.get('labels');
      const cnt = rec.get('cnt').toNumber();
      console.log(`  ${JSON.stringify(labels)}: ${cnt}`);
    }

    await session.close();
    console.log('\n[migrate-content-labels] Migration complete.');
  } finally {
    await driver.close();
  }
}

run().catch((err) => {
  console.error('[migrate-content-labels] FATAL:', err);
  process.exit(1);
});
