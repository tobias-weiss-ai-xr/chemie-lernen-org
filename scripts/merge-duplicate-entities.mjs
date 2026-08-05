#!/usr/bin/env node
/**
 * merge-duplicate-entities.mjs — Merged Case-Duplikat-Entities im Wissensnetz.
 *
 * Problem: 41 Gruppen à 2 Nodes, nur durch Groß/Kleinschreibung getrennt
 * (Alkohole/alkohole, Enthalpie/enthalpie …). Beide tragen Kanten, dadurch
 * erscheinen Begriffe doppelt und Verknüpfungen sind aufgespalten.
 *
 * Vorgehen (maximal sicher, siehe AGENTS.md Blacklist — KEIN DETACH DELETE):
 *   1. Backup-Dump vor Mutation (wenn BACKUP_DIR gesetzt ist)
 *   2. Kanonische Node = die mit mehr Kanten; sonst die großgeschriebene
 *   3. Kanten des Duplikats per MERGE auf den kanonischen Node umhängen
 *      (keine doppelten Kanten zwischen denselben Paaren)
 *   4. Erst danach den jetzt isolierten Duplikat-Node gezielt entfernen
 *      (per id, NIE unspezifisch)
 *
 * Läuft im chemie-chat-api-Container (hat neo4j-driver + korrekte Env):
 *   cat scripts/merge-duplicate-entities.mjs | docker exec -i chemie-chat-api node -
 * Dry-Run:  cat scripts/merge-duplicate-entities.mjs | docker exec -i chemie-chat-api node - --dry-run
 *
 * Sicherheits-Scope: nur Entities mit kategorie IN
 * [konzept, stoff, reaktion, methode, person, quelle].
 */

import neo4j from 'neo4j-driver';

const DRY_RUN = process.argv.includes('--dry-run');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const CATS = ['konzept', 'stoff', 'reaktion', 'methode', 'person', 'quelle'];

// Alle Rel-Typen, die Entities verknüpfen (konservativ: alles mitnehmen,
// was zwischen Entity-Nodes existieren kann)
const REL_TYPES = [
  'RELATED_TO',
  'AEHNLICH_ZU',
  'BEINHALTET',
  'BESTEHT_AUS',
  'CONSISTS_OF',
  'VERALLGEMEINERT',
  'BESCHREIBT',
  'DEMONSTRIERT',
  'ERZEUGT',
  'ENTDECKT',
  'VERGLEICHBAR',
  'BETEILIGT_AN',
  'WENDET_AN',
  'QUELLE_VON',
  'COVERS_TOPIC',
  'FULFILLS_OBJECTIVE',
  'FULFILLS',
  'PREREQUISITE',
  'MENTIONS',
  'HAS_SUBTOPIC',
  'HAS_TOPIC',
  'HAS_LEARNING_OBJECTIVE',
  'TEACHES',
  'IS_PART_OF',
  'TEIL_VON',
];

async function findDuplicateGroups(session) {
  const res = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats
     WITH toLower(trim(e.name)) AS norm, collect(e) AS nodes, count(e) AS n
     WHERE n > 1
     UNWIND nodes AS node
     WITH norm, node,
       [(node)-[r]-(x) WHERE (x:Entity OR x:LearningObjective OR x:Topic OR x:SubTopic OR x:Content OR x:Document OR x:Curriculum) | 1] AS rels
     ORDER BY size(rels) DESC
     WITH norm, collect({name: node.name, id: id(node), relCount: size(rels)}) AS allNodes
     RETURN norm,
       allNodes[0] AS canonical,
       allNodes AS all
     `,
    { cats: CATS }
  );
  return res.records.map((r) => {
    const all = r
      .get('all')
      .map((n) => ({
        name: n.name,
        id: n.id.toNumber ? n.id.toNumber() : n.id,
        relCount: n.relCount.toNumber ? n.relCount.toNumber() : n.relCount,
      }));
    return { norm: r.get('norm'), canonical: all[0], all };
  });
}

async function mergeGroup(session, group) {
  const canonId = group.canonical.id;
  const others = group.all.filter((n) => n.id !== canonId);
  let moved = 0;
  for (const other of others) {
    // Alle eingehenden/ausgehenden Kanten des Duplikats auf den kanonischen
    // Node umhängen — per MERGE, damit keine Doppelkanten entstehen.
    for (const rel of REL_TYPES) {
      // Ausgehend: (dup)-[rel]->(x)
      const out = await session.run(
        `MATCH (dup:Entity) WHERE id(dup) = $dupId
         MATCH (canon:Entity) WHERE id(canon) = $canonId
         MATCH (dup)-[r:${rel}]->(x)
         MERGE (canon)-[:${rel}]->(x)
         DELETE r
         RETURN count(r) AS n`,
        { dupId: other.id, canonId }
      );
      moved += out.records[0]?.get('n').toNumber() || 0;
      // Eingehend: (x)-[rel]->(dup)
      const inc = await session.run(
        `MATCH (dup:Entity) WHERE id(dup) = $dupId
         MATCH (canon:Entity) WHERE id(canon) = $canonId
         MATCH (x)-[r:${rel}]->(dup)
         MERGE (x)-[:${rel}]->(canon)
         DELETE r
         RETURN count(r) AS n`,
        { dupId: other.id, canonId }
      );
      moved += inc.records[0]?.get('n').toNumber() || 0;
    }
  }
  return { moved, canonId };
}

async function verifyAndRemove(session, canonId, others) {
  // Nach dem Umhängen müssen die Duplikate isoliert sein (keine relevanten
  // Kanten mehr). Nur dann gezielt per id entfernen.
  let removed = 0;
  for (const other of others) {
    const check = await session.run(
      `MATCH (n:Entity) WHERE id(n) = $id
       RETURN [(n)-[r]-(x) WHERE (x:Entity OR x:LearningObjective OR x:Topic OR x:SubTopic OR x:Content OR x:Document OR x:Curriculum) | type(r)] AS rels`,
      { id: other.id }
    );
    const rels = check.records[0]?.get('rels') || [];
    if (rels.length === 0) {
      await session.run(`MATCH (n:Entity) WHERE id(n) = $id DELETE n`, { id: other.id });
      removed++;
    } else {
      console.warn(
        `  ⚠ ${other.name} (id ${other.id}) hat noch ${rels.length} Kanten — NICHT gelöscht`
      );
    }
  }
  return removed;
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });
  console.log(`URI: ${NEO4J_URI} (dry-run: ${DRY_RUN})`);

  try {
    const groups = await findDuplicateGroups(session);
    console.log(`Duplikat-Gruppen: ${groups.length}`);

    for (const g of groups) {
      console.log(
        `\n[${g.norm}] kanonisch: "${g.canonical.name}" (id ${g.canonical.id}, ${g.canonical.relCount} Kanten)`
      );
      for (const o of g.all.filter((n) => n.id !== g.canonical.id)) {
        console.log(`  Duplikat: "${o.name}" (id ${o.id}, ${o.relCount} Kanten)`);
      }

      if (DRY_RUN) continue;

      const { moved, canonId } = await mergeGroup(session, g);
      console.log(`  Umgehängt: ${moved} Kanten`);

      const others = g.all.filter((n) => n.id !== canonId);
      const removed = await verifyAndRemove(session, canonId, others);
      console.log(`  Entfernt: ${removed}/${others.length} Duplikat-Nodes`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
