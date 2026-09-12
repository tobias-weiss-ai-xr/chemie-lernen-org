#!/usr/bin/env node
/**
 * seed-objective-states.mjs — seed `:ObjectiveState` nodes (BZ-1.4) from
 * existing graded answers: (:GradedAnswer)-[:PART_OF]->(:Assessment)
 * -[:TESTS]->(:LearningObjective).
 *
 * Per (userId, LearningObjective):
 *   mastery          = avg(score) / 100   (scores are 0–100)
 *   bloomsMaxReached = max(lo.blooms_index)
 *   source           = 'seed:graded-answers'
 *
 * Idempotent: existing states are only raised (mastery/bloomsMaxReached are
 * monotone maxima). Scoped to the chemie subset via subsetMatch('lo').
 * Dry-run by default; pass --apply to write.
 *
 * Usage:
 *   node scripts/seed-objective-states.mjs            # dry run
 *   node scripts/seed-objective-states.mjs --apply    # write
 */

import neo4j from 'neo4j-driver';
import { subsetWhere, subsetMatch } from './_neo4j-subset-filter.mjs';

export const READ_QUERY = `
  MATCH (g:GradedAnswer)-[:PART_OF]->(:Assessment)-[:TESTS]->(lo:LearningObjective)
  WHERE ${subsetWhere('lo')} AND g.userId IS NOT NULL
  WITH g.userId AS userId, lo, avg(g.score) AS avgScore, count(g) AS attempts
  RETURN userId, lo.slug AS slug, avgScore, attempts, lo.blooms_index AS bloomIdx
  ORDER BY userId, slug
`;

const UPSERT_QUERY = `
  MATCH (lo:LearningObjective {slug: $slug})
  ${subsetMatch('lo')}
  MERGE (s:ObjectiveState {userId: $userId, objectiveSlug: $slug})-[:FOR]->(lo)
  ON CREATE SET
    s.mastery = $mastery,
    s.bloomsMaxReached = $bloomIdx,
    s.lastSeen = datetime(),
    s.updatedAt = datetime(),
    s.source = 'seed:graded-answers'
  ON MATCH SET
    s.mastery = CASE WHEN s.mastery >= $mastery THEN s.mastery ELSE $mastery END,
    s.bloomsMaxReached = CASE WHEN s.bloomsMaxReached >= $bloomIdx THEN s.bloomsMaxReached ELSE $bloomIdx END,
    s.updatedAt = datetime()
`;

/** Clamp score (0–100) to mastery (0–1). */
export const toMastery = (avgScore) => Math.max(0, Math.min(1, (Number(avgScore) || 0) / 100));

/**
 * Core seeding logic — DB-free when mocked.
 *
 * @param {{ run: Function }} readSession  - session with READ access
 * @param {{ run: Function, close: Function } | null} writeSession - writable session (null for dry-run)
 * @param {object} [options]
 * @param {Function} [options.logger] - override console.log
 * @returns {Promise<{ seeded: number, skipped: number, users: Set<string> }>}
 */
export async function seedObjectiveStates(readSession, writeSession, options = {}) {
  const log = options.logger ?? console.log.bind(console);

  const result = await readSession.run(READ_QUERY);

  let seeded = 0;
  let skipped = 0;
  const users = new Set();

  for (const rec of result.records) {
    const userId = rec.get('userId');
    const slug = rec.get('slug');
    const mastery = toMastery(rec.get('avgScore'));
    const bloomIdx = rec.get('bloomIdx') ?? 0;
    const attempts = rec.get('attempts');

    if (!userId || !slug) {
      skipped++;
      continue;
    }
    users.add(String(userId));
    log(
      `  ${userId} × ${slug}: mastery=${mastery.toFixed(2)} bloomsMax=${bloomIdx} (${attempts} answers)`
    );
    seeded++;

    if (writeSession) {
      await writeSession.run(UPSERT_QUERY, {
        userId: String(userId),
        slug: String(slug),
        mastery, // JS float → Neo4j FLOAT property
        bloomIdx: neo4j.int(bloomIdx),
      });
    }
  }

  return { seeded, skipped, users };
}

/**
 * CLI entry point — connects to Neo4j, seeds ObjectiveStates, prints summary.
 */
export async function main() {
  const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
  const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
  const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
  const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

  const APPLY = process.argv.includes('--apply');
  console.log(`seed-objective-states: ${APPLY ? 'APPLY mode' : 'DRY RUN'}`);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
  });

  try {
    const writeSession = APPLY ? driver.session({ database: NEO4J_DATABASE }) : null;

    const { seeded, skipped, users } = await seedObjectiveStates(session, writeSession);

    if (writeSession) await writeSession.close();
    console.log(
      `\nDone. ${seeded} ObjectiveState(s) ${APPLY ? 'seeded' : 'would be seeded'} ` +
        `for ${users.size} user(s).` +
        (skipped > 0 ? ` ${skipped} skipped.` : '')
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run CLI when executed directly (not when imported as a module)
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed-objective-states.mjs');
if (isDirectRun) {
  main().catch((err) => {
    console.error('seed-objective-states failed:', err.message);
    process.exit(1);
  });
}
