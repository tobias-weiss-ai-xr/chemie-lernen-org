#!/usr/bin/env node
/**
 * kg-quality-audit.mjs — Zentrales Qualitäts-Audit für den Chemie-Wissensnetz-
 * Subset des Knowledge Graphs (chemie-kg).
 *
 * Prüft und meldet:
 *   - isolierte Entities (ohne semantische Verknüpfung)
 *   - Duplikat-Gruppen (Case-Varianten via toLower(trim(name)))
 *   - Entities ohne Description
 *   - Entities ohne Curriculum-Links (FULFILLS_OBJECTIVE/COVERS_TOPIC)
 *   - Entities ohne Artikel-Links (MENTIONS)
 *   - Content-Nodes ohne Text
 *
 * Exit-Code: 0 = OK, 1 = Fehler. Mit --fail-on <kategorie> schlägt das
 * Audit fehl, wenn die Kategorie über dem Schwellwert liegt (für CI).
 *
 * Läuft im chemie-chat-api-Container:
 *   cat scripts/kg-quality-audit.mjs | docker exec -i chemie-chat-api node - [--json] [--fail-on isolated]
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const CATS = ['konzept', 'stoff', 'reaktion', 'methode', 'person', 'quelle'];

const ARGS = process.argv.slice(2);
const AS_JSON = ARGS.includes('--json');
const FAIL_ON = {};
for (let i = 0; i < ARGS.length; i++) {
  if (ARGS[i] === '--fail-on' && ARGS[i + 1]) {
    const [k, v] = ARGS[i + 1].split('=');
    FAIL_ON[k] = v === undefined ? 1 : Number(v);
  }
}

const REL_TYPES =
  'RELATED_TO|AEHNLICH_ZU|BEINHALTET|BESTEHT_AUS|CONSISTS_OF|VERALLGEMEINERT|BESCHREIBT|' +
  'DEMONSTRIERT|ERZEUGT|ENTDECKT|VERGLEICHBAR|BETEILIGT_AN|WENDET_AN|QUELLE_VON|' +
  'COVERS_TOPIC|FULFILLS_OBJECTIVE|FULFILLS|PREREQUISITE|MENTIONS|IS_PART_OF|TEIL_VON';

async function audit(session) {
  const out = {};

  // 1. Gesamt
  const total = await session.run(
    `MATCH (e:Entity) WHERE e.kategorie IN $cats RETURN count(e) AS c`,
    { cats: CATS }
  );
  out.totalEntities = total.records[0].get('c').toNumber();

  // 2. Isolierte Entities
  const isolated = await session.run(
    `MATCH (e:Entity) WHERE e.kategorie IN $cats
     AND NOT (e)-[:${REL_TYPES}]-(:Entity)
     AND NOT (e)-[:FULFILLS_OBJECTIVE|COVERS_TOPIC|MENTIONS]-()
     RETURN collect(e.name) AS names`,
    { cats: CATS }
  );
  out.isolated = isolated.records[0].get('names').length;
  out.isolatedNames = isolated.records[0].get('names');

  // 3. Duplikate
  const dups = await session.run(
    `MATCH (e:Entity) WHERE e.kategorie IN $cats
     WITH toLower(trim(e.name)) AS norm, count(e) AS n
     WHERE n > 1 RETURN count(*) AS groups, sum(n) AS nodes`,
    { cats: CATS }
  );
  out.duplicateGroups = dups.records[0].get('groups').toNumber();
  out.duplicateNodes = dups.records[0].get('nodes').toNumber();

  // 4. Entities ohne Description
  const noDesc = await session.run(
    `MATCH (e:Entity) WHERE e.kategorie IN $cats AND coalesce(e.description,'') = ''
     RETURN count(e) AS c`,
    { cats: CATS }
  );
  out.noDescription = noDesc.records[0].get('c').toNumber();

  // 5. Entities ohne Curriculum-Links
  const noCurr = await session.run(
    `MATCH (e:Entity) WHERE e.kategorie IN $cats
     AND NOT (e)-[:FULFILLS_OBJECTIVE|COVERS_TOPIC]-()
     RETURN count(e) AS c`,
    { cats: CATS }
  );
  out.noCurriculumLink = noCurr.records[0].get('c').toNumber();

  // 6. Entities ohne Artikel-Links
  const noArt = await session.run(
    `MATCH (e:Entity) WHERE e.kategorie IN $cats
     AND NOT (e)-[:MENTIONS]-(:Content)
     AND NOT (e)-[:MENTIONS]-(:Document)
     RETURN count(e) AS c`,
    { cats: CATS }
  );
  out.noArticleLink = noArt.records[0].get('c').toNumber();

  // 7. Content ohne Text
  const content = await session.run(
    `MATCH (c:Content) RETURN count(c) AS n,
       sum(CASE WHEN coalesce(c.text,'') <> '' THEN 1 ELSE 0 END) AS withText`,
    {}
  );
  out.contentNodes = content.records[0].get('n').toNumber();
  out.contentWithText = content.records[0].get('withText').toNumber();

  // Prozente
  out.pctWithDesc =
    out.totalEntities > 0
      ? Math.round(((out.totalEntities - out.noDescription) / out.totalEntities) * 100)
      : 0;
  out.pctWithCurriculum =
    out.totalEntities > 0
      ? Math.round(((out.totalEntities - out.noCurriculumLink) / out.totalEntities) * 100)
      : 0;

  return out;
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const r = await audit(session);
    if (AS_JSON) {
      console.log(JSON.stringify(r, null, 2));
    } else {
      console.log(`=== KG Quality Audit (${NEO4J_URI}) ===`);
      console.log(`Entities: ${r.totalEntities}`);
      console.log(`Isoliert: ${r.isolated}${r.isolated ? ' → ' + r.isolatedNames.join(', ') : ''}`);
      console.log(`Duplikat-Gruppen: ${r.duplicateGroups} (Nodes: ${r.duplicateNodes})`);
      console.log(`Ohne Description: ${r.noDescription} (${100 - r.pctWithDesc}%)`);
      console.log(
        `Ohne Curriculum-Link: ${r.noCurriculumLink} (${100 - r.pctWithCurriculum}% fehlt)`
      );
      console.log(`Ohne Artikel-Link: ${r.noArticleLink}`);
      console.log(`Content-Nodes: ${r.contentNodes}, mit Text: ${r.contentWithText}`);
    }

    // CI-Fail-On
    const fails = [];
    if (FAIL_ON.isolated !== undefined && r.isolated > FAIL_ON.isolated)
      fails.push(`isolated=${r.isolated} > ${FAIL_ON.isolated}`);
    if (FAIL_ON.duplicateGroups !== undefined && r.duplicateGroups > FAIL_ON.duplicateGroups)
      fails.push(`duplicateGroups=${r.duplicateGroups} > ${FAIL_ON.duplicateGroups}`);
    if (FAIL_ON.noDescription !== undefined && r.noDescription > FAIL_ON.noDescription)
      fails.push(`noDescription=${r.noDescription} > ${FAIL_ON.noDescription}`);
    if (fails.length > 0) {
      console.error('AUDIT FAIL: ' + fails.join('; '));
      process.exit(1);
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
