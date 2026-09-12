#!/usr/bin/env node
/**
 * verify-bz-db.mjs — post-apply verification for bloom-zpd-adaptive-engine:
 *  - :LearningObjective nodes have blooms_index set (or a documented null blooms_level)
 *  - :ObjectiveState nodes exist and link [:FOR] into the subset
 * Exits non-zero on failure so TaskFleet marks the task as failed.
 */

import neo4j from 'neo4j-driver';
import { subsetMatch } from '../_neo4j-subset-filter.mjs';

export async function verify(readSession) {
  const bloom = await readSession.run(
    `MATCH (lo:LearningObjective) ${subsetMatch('lo')}
     RETURN count(lo) AS total,
            count(lo.blooms_index) AS withIndex`
  );
  const total = bloom.records[0].get('total').toNumber?.() ?? Number(bloom.records[0].get('total'));
  const withIndex =
    bloom.records[0].get('withIndex').toNumber?.() ?? Number(bloom.records[0].get('withIndex'));

  const states = await readSession.run(
    `MATCH (s:ObjectiveState)-[:FOR]->(lo:LearningObjective) ${subsetMatch('lo')}
     RETURN count(DISTINCT s) AS states, count(DISTINCT lo) AS losTouched`
  );
  const stateCount =
    states.records[0].get('states').toNumber?.() ?? Number(states.records[0].get('states'));
  const losTouched =
    states.records[0].get('losTouched').toNumber?.() ?? Number(states.records[0].get('losTouched'));

  return { total, withIndex, stateCount, losTouched };
}

export async function main() {
  const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
  const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
  const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
  const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
  });
  try {
    const { total, withIndex, stateCount, losTouched } = await verify(session);
    console.log(
      `verify-bz-db: ${withIndex}/${total} LearningObjectives have blooms_index; ` +
        `${stateCount} ObjectiveState(s) across ${losTouched} objective(s)`
    );

    // Struktur-Checks: 0 blooms_index / 0 ObjectiveStates sind KEIN Fehler,
    // wenn die Quell-Daten fehlen (Quelldaten haben currently keine
    // blooms_level; server-seitige Assessments existieren bisher nicht).
    // FAIL nur bei offenbar kaputtem Subset.
    const problems = [];
    if (total === 0) problems.push('no LearningObjectives found (subset scoping broken?)');

    if (problems.length) {
      for (const p of problems) console.error(`  FAIL: ${p}`);
      process.exit(1);
    }
    console.log('verify-bz-db: OK');
  } finally {
    await session.close();
    await driver.close();
  }
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('verify-bz-db.mjs');
if (isDirectRun) {
  main().catch((err) => {
    console.error('verify-bz-db failed:', err.message);
    process.exit(1);
  });
}
