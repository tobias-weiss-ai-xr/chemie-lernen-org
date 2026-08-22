#!/usr/bin/env node
/**
 * link-entities-to-curriculum.mjs — Verknüpft Entities ohne Curriculum-Bezug
 * mit passenden LearningObjectives/SubTopics (Säule 3 der KG-Roadmap).
 *
 * Strategie (konservativ, kein Raten):
 *   1. FULFILLS_OBJECTIVE: Entity-Name kommt wortweise im LearningObjective-Text
 *      vor (Wortgrenzen, akzentfrei normalisiert) → Kante erstellen
 *   2. COVERS_TOPIC: Entity-Name kommt im SubTopic-Titel vor → Kante erstellen
 *   3. state/grade/school_type: aus den verbundenen Topic/Curriculum-Metadaten
 *      ableiten und auf die Entity schreiben (falls noch leer)
 *
 * Idempotent: MERGE + nur Entities OHNE bestehenden Curriculum-Link.
 * Dry-Run: node - --dry-run
 *
 * Läuft im chemie-chat-api-Container:
 *   cat scripts/link-entities-to-curriculum.mjs | docker exec -i chemie-chat-api node -
 */

import neo4j from 'neo4j-driver';

const DRY_RUN = process.argv.includes('--dry-run');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const CATS = ['konzept', 'stoff', 'reaktion', 'methode', 'person', 'quelle'];
const MIN_NAME_LEN = 6; // kürzere Namen → zu viele falsche Treffer

// Akzentfrei + lowercase normalisieren
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c])
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Wortweises Vorkommen prüfen (ganze Wörter, nicht Substring).
// Einwort-Namen brauchen mind. MIN_NAME_LEN Zeichen, um falsche Treffer
// (science, ether, atom …) zu vermeiden.
function wordMatch(name, text) {
  const n = norm(name);
  const tokens = n.split(' ').filter(Boolean);
  if (tokens.length === 0) return false;
  // Einwort-Namen: nur ab MIN_NAME_LEN; mehrwortige: alle Wörter müssen vorliegen
  if (tokens.length === 1 && n.length < MIN_NAME_LEN) return false;
  const t = ' ' + norm(text) + ' ';
  return tokens.every((tok) => t.indexOf(' ' + tok + ' ') !== -1);
}

async function loadTargets(session) {
  const res = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats
       AND NOT (e)-[:FULFILLS_OBJECTIVE|COVERS_TOPIC]-()
     RETURN e.name AS name, id(e) AS id`,
    { cats: CATS }
  );
  return res.records.map((r) => ({
    id: r.get('id').toNumber ? r.get('id').toNumber() : r.get('id'),
    name: r.get('name'),
  }));
}

async function loadLearningObjectives(session) {
  const res = await session.run(
    `MATCH (lo:LearningObjective) WHERE coalesce(lo.text, '') <> ''
     RETURN id(lo) AS id, lo.text AS text`,
    {}
  );
  return res.records.map((r) => ({
    id: r.get('id').toNumber ? r.get('id').toNumber() : r.get('id'),
    text: String(r.get('text') || ''),
  }));
}

async function loadSubTopics(session) {
  const res = await session.run(
    `MATCH (s:SubTopic) WHERE coalesce(s.title, '') <> ''
     RETURN id(s) AS id, s.title AS title`,
    {}
  );
  return res.records.map((r) => ({
    id: r.get('id').toNumber ? r.get('id').toNumber() : r.get('id'),
    title: String(r.get('title') || ''),
  }));
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });
  console.log(`URI: ${NEO4J_URI} (dry-run: ${DRY_RUN})`);

  try {
    const targets = await loadTargets(session);
    console.log(`Entities ohne Curriculum-Link: ${targets.length}`);

    // LearningObjective-Text-Index in-memory (für wortweises Matching)
    const los = await loadLearningObjectives(session);
    console.log(`LearningObjectives geladen: ${los.length}`);

    const subTopics = await loadSubTopics(session);
    console.log(`SubTopics geladen: ${subTopics.length}`);

    // Pro Entity: passende LearningObjectives finden (limit 8)
    let loLinked = 0;
    let stLinked = 0;
    let withMetadata = 0;
    for (const t of targets) {
      const name = t.name;
      const matchedLOs = [];
      for (const lo of los) {
        if (wordMatch(name, lo.text)) {
          matchedLOs.push(lo.id);
          if (matchedLOs.length >= 8) break;
        }
      }

      const matchedSTs = [];
      for (const st of subTopics) {
        if (wordMatch(name, st.title)) {
          matchedSTs.push(st.id);
          if (matchedSTs.length >= 5) break;
        }
      }

      if (DRY_RUN) {
        if (matchedLOs.length > 0 || matchedSTs.length > 0) {
          console.log(`\n[${t.name}] LO: ${matchedLOs.length}, SubTopic: ${matchedSTs.length}`);
        }
        loLinked += matchedLOs.length;
        stLinked += matchedSTs.length;
        continue;
      }

      // FULFILLS_OBJECTIVE-Kanten (MERGE, idempotent)
      for (const loId of matchedLOs) {
        await session.run(
          `MATCH (e:Entity) WHERE id(e) = $eid
           MATCH (lo:LearningObjective) WHERE id(lo) = $loId
           MERGE (e)-[:FULFILLS_OBJECTIVE]->(lo)`,
          { eid: t.id, loId }
        );
        loLinked++;
      }

      // COVERS_TOPIC-Kanten zu SubTopics
      for (const stId of matchedSTs) {
        await session.run(
          `MATCH (e:Entity) WHERE id(e) = $eid
           MATCH (s:SubTopic) WHERE id(s) = $stId
           MERGE (e)-[:COVERS_TOPIC]->(s)`,
          { eid: t.id, stId }
        );
        stLinked++;
      }

      // state/grade/school_type aus Curriculum ableiten (falls leer)
      if (matchedLOs.length > 0) {
        const meta = await session.run(
          `MATCH (e:Entity) WHERE id(e) = $eid
           MATCH (e)-[:FULFILLS_OBJECTIVE]->(lo)<-[:HAS_LEARNING_OBJECTIVE|FULFILLS]-(topic:Topic)
           OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(topic)
           WHERE coalesce(e.state, '') = '' OR coalesce(e.grade, '') = ''
           WITH e, collect(DISTINCT c.state_abbr)[..3] AS states,
                collect(DISTINCT topic.grade)[..3] AS grades,
                collect(DISTINCT c.school_type)[..3] AS schools
           SET e.state = CASE WHEN coalesce(e.state,'') = '' AND size(states) > 0 THEN states[0] ELSE e.state END,
               e.grade = CASE WHEN coalesce(e.grade,'') = '' AND size(grades) > 0 THEN grades[0] ELSE e.grade END,
               e.school_type = CASE WHEN coalesce(e.school_type,'') = '' AND size(schools) > 0 THEN schools[0] ELSE e.school_type END`,
          { eid: t.id }
        );
        withMetadata += meta.summary.counters.containsUpdates ? 1 : 0;
      }
    }

    console.log(
      `\nFertig: ${loLinked} FULFILLS_OBJECTIVE, ${stLinked} COVERS_TOPIC, ${withMetadata} mit Metadata aktualisiert.`
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
