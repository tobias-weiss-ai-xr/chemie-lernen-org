/**
 * Curricula mapper — Part B Task 4.
 *
 * CentralQuery-Builder + pure record mapper for GET /api/curricula/by-state/:state.
 * Adds a per-topic `entities` list (concepts that COVERS_TOPIC a topic) so the
 * Curricula-Landkarte UI can chip-link from every KMK topic to its Wissensnetz
 * entities. Both COVERS_TOPIC directions are matched defensively (the relation
 * direction was historically ambiguous) and names are de-duplicated.
 *
 * Capped (didactic pass): Lernziele ≤ 8, entities ≤ 12 per topic.
 */
'use strict';

const OBJECTIVES_CAP = 8;
const ENTITIES_CAP = 12;

/** Cypher for the by-state tree. Both COVERS_TOPIC directions are matched:
 *  (t)<-[:COVERS_TOPIC]-(e:Entity) and (t)-[:COVERS_TOPIC]->(e2:Entity). */
function buildByStateQuery() {
  return `
MATCH (c:Curriculum {state_abbr: $state})
OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
OPTIONAL MATCH (t)<-[:COVERS_TOPIC]-(e:Entity)
OPTIONAL MATCH (t)-[:COVERS_TOPIC]->(e2:Entity)
WITH c, t,
     collect(DISTINCT lo.text) AS objectives,
     collect(DISTINCT e.name) + collect(DISTINCT e2.name) AS entities
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
