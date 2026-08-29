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
 *   3. text    entity whose name occurs word-boundary in one of the topic's LO
 *      texts (EXISTS subquery; didactic: Lehrplantexte nennen die geforderten
 *      Konzepte). Text matches are filtered by a stopword list + word bounds so
 *      abbreviations/function words (e.g. "MIT") don't become graph chips.
 * All are de-duplicated (didactic caps: Lernziele ≤ 8, entities ≤ 12).
 */
'use strict';

const OBJECTIVES_CAP = 8;
const ENTITIES_CAP = 12;

/** Short function words that could false-positive as entity names in LO texts. */
const TEXT_MATCH_STOPWORDS = new Set([
  'mit', 'und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'einer', 'für',
  'von', 'auf', 'bei', 'zu', 'ist', 'sind', 'soll', 'können', 'werden',
  'nicht', 'auch', 'als', 'dass', 'es', 'im', 'am', 'in', 'den', 'dem',
]);

/** True if the entity is a meaningful text-mention candidate. */
function isTextMatchCandidate(name) {
  const n = String(name || '').trim();
  if (!n) return false;
  if (n.length < 3) return false;
  if (n.length > 80) return false;
  return !TEXT_MATCH_STOPWORDS.has(n.toLowerCase());
}

/** Cypher for the by-state tree — direct COVERS_TOPIC (both directions) UNION
 *  FULFILLS via learning objectives UNION word-boundary name mentions in LO
 *  texts. */
function buildByStateQuery() {
  return `
MATCH (c:Curriculum {state_abbr: $state})
OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
OPTIONAL MATCH (t)<-[:COVERS_TOPIC]-(e:Entity)
OPTIONAL MATCH (t)-[:COVERS_TOPIC]->(e2:Entity)
OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo2:LearningObjective)<-[:FULFILLS|FULFILLS_OBJECTIVE]-(e3:Entity)
OPTIONAL MATCH (e4:Entity)
WHERE size(e4.name) >= 3 AND size(e4.name) <= 80 AND EXISTS {
  MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo4:LearningObjective)
  WHERE lo4.text IS NOT NULL
    AND toLower(lo4.text) =~ '(?i)(^|[^a-zäöüß])\\Q' + toLower(e4.name) + '\\E($|[^a-zäöüß])'
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
  isTextMatchCandidate,
  OBJECTIVES_CAP,
  ENTITIES_CAP,
};
