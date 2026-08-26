/**
 * Curricula mapper — Part B Task 4 (+ live-schema fix).
 *
 * CentralQuery-Builder + pure record mapper for GET /api/curricula/by-state/:state.
 * Adds a per-topic `entities` list so the Curricula-Landkarte UI can chip-link
 * from every KMK topic to its Wissensnetz concepts. The KG links Topics to
 * Entities in two ways; BOTH are unioned (and additionally a text-based fallback
 * covers the observed live-data gap where neither direct relation exists):
 *   1. direct  (t)-[:COVERS_TOPIC]-(e:Entity)   (either direction, historically
 *      ambiguous — matched defensively both ways)
 *   2. indirect (t)-[:HAS_LEARNING_OBJECTIVE]->(lo)<-[:FULFILLS|FULFILLS_OBJECTIVE]
 *      -(e:Entity) — observed LIVE on Zink (COVERS_TOPIC was empty there while
 *      FULFILLS produced the curricular objectives).
 *   3. text    entity whose name occurs in one of the topic's LO texts
 *      (EXISTS subquery; didactic: Lehrplantexte nennen die geforderten Konzepte).
 * All are de-duplicated (didactic caps: Lernziele ≤ 8, entities ≤ 12).
 */
'use strict';

const OBJECTIVES_CAP = 8;
const ENTITIES_CAP = 12;

/** Cypher for the by-state tree — direct COVERS_TOPIC (both directions) UNION
 *  FULFILLS via learning objectives UNION name-mentions in LO texts. */
function buildByStateQuery() {
  return `
MATCH (c:Curriculum {state_abbr: $state})
OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
OPTIONAL MATCH (t)<-[:COVERS_TOPIC]-(e:Entity)
OPTIONAL MATCH (t)-[:COVERS_TOPIC]->(e2:Entity)
OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo2:LearningObjective)<-[:FULFILLS|FULFILLS_OBJECTIVE]-(e3:Entity)
OPTIONAL MATCH (e4:Entity)
WHERE EXISTS {
  MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo4:LearningObjective)
  WHERE lo4.text IS NOT NULL AND toLower(lo4.text) CONTAINS toLower(e4.name)
}
WITH c, t,
     collect(DISTINCT lo.text) AS objectives,
     collect(DISTINCT e.name) + collect(DISTINCT e2.name) + collect(DISTINCT e3.name) + collect(DISTINCT e4.name) AS entities
RETURN c.slug AS curriculumSlug, c.school_type AS schoolType,
       t.slug AS slug, t.title AS title, t.grade AS grade,
       size([ob IN objectives WHERE ob IS NOT NULL]) AS objectiveCount,
       [ob IN objectives WHERE ob IS NOT NULL] AS objectives,
       [en IN entities WHERE en IS NOT NULL AND en <> ''] AS entities
ORDER BY t.grade, t.title`;
}

/**
 * Pure mapper from Cypher records (objects exposing .get(name)) to the public
 * JSON shape. Caps applied here — never in the UI.
 */
function mapCurriculumTopics(records) {
  return records.map(function (record) {
    const get = (k) => (record && typeof record.get === 'function' ? record.get(k) : record[k]);
    const rawCount = get('objectiveCount');
    const count =
      rawCount && typeof rawCount.toNumber === 'function'
        ? rawCount.toNumber()
        : Number(rawCount) || 0;
    const objectives = (get('objectives') || []).slice(0, OBJECTIVES_CAP);
    const entities = Array.from(new Set(get('entities') || [])).slice(0, ENTITIES_CAP);
    return {
      slug: get('slug'),
      title: get('title'),
      grade: get('grade'),
      schoolType: get('schoolType'),
      objectiveCount: count,
      objectives,
      entityCount: entities.length,
      entities,
    };
  });
}

module.exports = {
  buildByStateQuery,
  mapCurriculumTopics,
  OBJECTIVES_CAP,
  ENTITIES_CAP,
};
