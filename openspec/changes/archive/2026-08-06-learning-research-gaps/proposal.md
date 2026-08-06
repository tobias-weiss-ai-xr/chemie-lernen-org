## Why

Die Gap-Analyse gegen das learning-research-Repo (13.204 Papers) hat 4 verbleibende Lücken identifiziert:

1. **Adaptive Personalization** (4.495 Papers): Lernpfade haben statische Schwierigkeit. Zusätzlich sind die Neo4j-Queries in `learning-paths.js` kaputt — sie nutzen `-[:COVERS]->`, aber der reale Relationship-Typ ist `-[:FULFILLS]->` (20.506 Vorkommen, `COVERS` existiert 0×). Die Lernpfad-Detailansicht liefert daher leere Topics. Außerdem fehlt Schema A (Curriculum→HAS_SUBTOPIC→SubTopic, 1.790 Links) im Query — nur Schema B (Topic→HAS_SUBTOPIC, 303 Links, nur BY) wird berücksichtigt.

2. **Cognitive Load** (162 Papers): Keine explizite Chunking-Unterstützung — Lernpfad-Schritte haben keine Session-Planung (5-7 Min Segmente).

3. **Social Learning** (562 Papers): Kollaboration existiert (Chat, geteilte Übungen), aber es fehlt ein **Quiz-Herausforderungs-Mechanismus** — die evidenzstärkste soziale Lerninteraktion ist Peer-Vergleich/Wettbewerb bei aktiver Abfrage.

4. **Prerequisite Mapping** (Wissensnetz): `PREREQUISITE`-Beziehungen existieren nicht in Neo4j (0 Vorkommen), obwohl die learning-paths-Detailquery `(lo)-[:PREREQUISITE]->(pre:LearningObjective)` referenziert. Das curriculare Ordnungswissen (SubTopic-Reihenfolge pro Curriculum) kann daraus abgeleitet werden.

## What Changes

- **Fix learning-paths.js**: `COVERS` → `FULFILLS`, beide Schema-Pfade (A: Curriculum→HAS_SUBTOPIC→SubTopic→FULFILLS→LO, B: Curriculum→HAS_TOPIC→Topic→HAS_SUBTOPIC→SubTopic→FULFILLS→LO) per `OPTIONAL MATCH` kombinieren. Betrifft die Queries in `GET /api/learning-paths`, `GET /api/learning-paths/:slug` und `POST /api/learning-paths/:slug/certificate`.
- **PREREQUISITE-Mapping-Skript**: `scripts/create-prerequisites.mjs` — erstellt PREREQUISITE-Beziehungen zwischen LearningObjectives basierend auf der curricularen Reihenfolge (innerhalb eines Curriculums: LOs früherer SubTopics sind Voraussetzung für spätere; Reihenfolge über `curriculum_state` + SubTopic-Reihenfolge).
- **Adaptive Difficulty API**: `GET /api/adaptive/recommendations` — basierend auf letzten Quiz-Ergebnissen des Users wird pro Topic eine Schwierigkeits-Empfehlung berechnet (Zielbereich 70-80% Erfolgsquote). Frontend: quiz.html zeigt Empfehlung und setzt default Difficulty.
- **Cognitive-Load-Chunking**: lernpfad.js gruppiert Schritte in Sessions à ~5-7 Min und zeigt eine Session-Planung (wann Pause machen).
- **Social Learning: Quiz-Challenge**: collab-engine.js + kollaboration.html erhalten die Möglichkeit, ein Quiz-Ergebnis als Challenge in einen Lernraum zu posten (Peer-Vergleich).

## Capabilities

### Modified Capabilities

- `learning-paths/spec.md` — FULFILLS statt COVERS, beide Schema-Pfade, PREREQUISITE
- `adaptive-learning/spec.md` — neu: adaptive Schwierigkeits-Empfehlungen
- `collaboration/spec.md` — Quiz-Challenges

## Impact

- **API**: `/api/learning-paths` liefert wieder echte Topic-Bäume mit Objectives (war leer)
- **Neo4j**: ~20.000 neue PREREQUISITE-Beziehungen zwischen LearningObjectives
- **Frontend**: Lernpfad zeigt Session-Planung, Quiz zeigt adaptive Empfehlung, Kollaboration bekommt Quiz-Challenge
- **Tests**: Neue Unit-Tests für adaptive-recommendations, prerequisites, collab challenge
