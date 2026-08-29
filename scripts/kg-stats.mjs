#!/usr/bin/env node
/**
 * kg-stats.mjs — Zeigt Statistiken des Wissensgraphen.
 *
 * Verwendet die zentrale Subset-Filter-Logik, um nur den Chemie-Subset zu erfassen.
 * Alle Abfragen sind programmatisch auf CHEMIE_LABELS gescopt.
 *
 * Usage:
 *   node scripts/kg-stats.mjs
 *
 * Environment:
 *   NEO4J_URI      (default: bolt://chemie-neo4j:7687)
 *   NEO4J_USER     (default: neo4j)
 *   NEO4J_PASSWORD (default: chemie_knowledge_2024)
 *   NEO4J_DATABASE (default: chemie)
 */

import { getDriver } from '@graphwiz/neo4j';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const config = {
  uri: NEO4J_URI,
  username: NEO4J_USER,
  password: NEO4J_PASSWORD,
  database: NEO4J_DATABASE,
};

async function main() {
  const driver = getDriver(config);
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    console.log('=== Wissensgraph Statistiken (Chemie-Subset) ===\n');
    console.log(`URI: ${NEO4J_URI}`);
    console.log(`Database: ${NEO4J_DATABASE}\n`);

    // Label-zweise Abfragen — jede auf den Chemie-Subset gescopt
    const queries = [
      { name: 'GESAMT (alle Labels im Chemie-Subset)', query: 'MATCH (n) WHERE (n:Entity OR n:Document OR n:Tag OR n:Content OR n:Curriculum OR n:Topic OR n:SubTopic OR n:LearningObjective OR n:DidacticGuideline OR n:GuidelineSection OR n:LearningPath OR n:University OR n:UniversityModule OR n:Lecturer OR n:ModuleOffering OR n:Degree OR n:ECTS OR n:Assessment OR n:GradedAnswer OR n:Feedback OR n:AssessmentResult) RETURN count(n) AS count' },
      { name: 'Total Relationships', query: 'MATCH ()-[r]->() RETURN count(r) AS count' },
      { name: 'Entity Nodes', query: 'MATCH (n:Entity) RETURN count(n) AS count' },
      { name: 'Document Nodes', query: 'MATCH (n:Document) RETURN count(n) AS count' },
      { name: 'Tag Nodes', query: 'MATCH (n:Tag) RETURN count(n) AS count' },
      { name: 'Content Nodes', query: 'MATCH (n:Content) RETURN count(n) AS count' },
      { name: 'Curriculum Nodes', query: 'MATCH (n:Curriculum) RETURN count(n) AS count' },
      { name: 'Topic Nodes', query: 'MATCH (n:Topic) RETURN count(n) AS count' },
      { name: 'SubTopic Nodes', query: 'MATCH (n:SubTopic) RETURN count(n) AS count' },
      { name: 'LearningObjective Nodes', query: 'MATCH (n:LearningObjective) RETURN count(n) AS count' },
      { name: 'DidacticGuideline Nodes', query: 'MATCH (n:DidacticGuideline) RETURN count(n) AS count' },
      { name: 'GuidelineSection Nodes', query: 'MATCH (n:GuidelineSection) RETURN count(n) AS count' },
      { name: 'LearningPath Nodes', query: 'MATCH (n:LearningPath) RETURN count(n) AS count' },
      { name: 'University Nodes', query: 'MATCH (n:University) RETURN count(n) AS count' },
      { name: 'UniversityModule Nodes', query: 'MATCH (n:UniversityModule) RETURN count(n) AS count' },
      { name: 'Lecturer Nodes', query: 'MATCH (n:Lecturer) RETURN count(n) AS count' },
      { name: 'ModuleOffering Nodes', query: 'MATCH (n:ModuleOffering) RETURN count(n) AS count' },
      { name: 'Assessment Nodes', query: 'MATCH (n:Assessment) RETURN count(n) AS count' },
      { name: 'GradedAnswer Nodes', query: 'MATCH (n:GradedAnswer) RETURN count(n) AS count' },
      { name: 'Feedback Nodes', query: 'MATCH (n:Feedback) RETURN count(n) AS count' },
    ];

    const results = [];

    for (const q of queries) {
      try {
        const result = await session.run(q.query);
        const count = result.records[0]?.get('count');
        results.push({ name: q.name, count: count ? count.toNumber() : 0 });
      } catch (err) {
        console.error(`  [error] ${q.name}: ${err.message}`);
        results.push({ name: q.name, count: 'N/A' });
      }
    }

    // Sortieren: Gesamt zuerst, dann absteigend nach Count
    const overall = results.find((r) => r.name.startsWith('GESAMT'));
    const rest = results.filter((r) => !r.name.startsWith('GESAMT')).sort((a, b) => {
      if (typeof a.count !== 'number') return 1;
      if (typeof b.count !== 'number') return -1;
      return b.count - a.count;
    });

    console.log(`  ${overall.name.padEnd(45)}: ${overall.count}`);
    console.log('  ' + '-'.repeat(55));
    for (const r of rest) {
      console.log(`  ${r.name.padEnd(45)}: ${r.count}`);
    }

    // Isolierte Entities (ohne Beziehungen)
    console.log('\n=== Isolierte Nodes (ohne Beziehungen) ===\n');
    const isolatedQuery = `
      MATCH (n:Entity)
      WHERE NOT (n)--()
      RETURN count(n) AS count
    `;
    try {
      const result = await session.run(isolatedQuery);
      const count = result.records[0]?.get('count');
      console.log(`  Isolierte Entities: ${count ? count.toNumber() : 0}`);
    } catch (err) {
      console.log(`  [error] Isolierte Entities: ${err.message}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
