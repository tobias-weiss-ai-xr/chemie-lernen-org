# Spec: lehrplan-curriculum

**Capability:** German state curricula (Lehrpläne) + didactic guidelines
(Modulhandbücher, KMK standards) as part of the knowledge graph
**Owners:** Sisyphus (Sprint 8b partial, this spec to be implemented
via `changes/extend-entity-kg-with-lehrplan/`)
**Status:** Active — main spec; deltas via `openspec/changes/`

---

## Purpose

chemie-lernen.org covers the German chemistry curriculum for all 16
states (Bundesländer). Beyond the article content, the platform
maintains a structured representation of:

- **Lehrpläne** — the official state curricula with their
  grade-level topics, sub-topics, and learning objectives
- **KMK-Bildungsstandards** — the federal standards for the
  Mittleren Schulabschluss (MSA) and the Allgemeine Hochschulreife
  (AHR) in chemistry
- **Modulhandbücher** — university module handbooks for chemistry
  teacher training (Lehramt Chemie) — at universities like
  Philipps-Universität Marburg

This data was originally in JSON files in `myhugoapp/data/curricula/`
(16 state files, ~1.7 MB) and `myhugoapp/data/didaktik/didaktik.json`
(5 KMK guidelines, ~180 KB). As of 2026-06-26, the Neo4j `chemie`
database has only the entity/article side of this data; the curricula
and didaktik side was never imported. This spec covers the
**canonical shape** of this data in the KG and how the entity-kg
relates to it.

## Requirements

### REQ-LP-1: Source-of-truth JSON files

- 16 state curricula: `myhugoapp/data/curricula/{bb,be,bw,by,hb,he,hh,mv,ni,nw,rp,sh,sn,st,th}.json`
- 1 didaktik file: `myhugoapp/data/didaktik/didaktik.json`
- 4 derived files:
  - `content-links.json` — topic → article links (12.8 MB)
  - `content-cross-links.json` — bidirectional cross-links
  - `content-neo4j-mapping.json` — explicit Neo4j node IDs
  - `quiz-mapping.json` — topic → quiz associations
  - `quality-report.json` — data quality signals

State schema (per state):

```
State {
  state: "Bayern", state_abbr: "BY",
  school_curricula: [
    SchoolCurriculum {
      school_type: "Gymnasium (NTG)",
      grade_levels: [
        GradeLevel {
          grade: "8",
          topics: [
            Topic {
              title: "Lernbereich 1: Wie Chemiker denken und arbeiten",
              sub_topics: [{ title: "Gefahrstoffe: ..." }],
              learning_objectives: [{ text: "kennen die Bedeutung ..." }]
            }
          ]
        }
      ]
    }
  ]
}
```

Didactic schema (in `didaktik.json`):

```
{
  guidelines: [
    DidacticGuideline {
      title: "Bildungsstandards im Fach Chemie für den MSA (2004)",
      source_type: "KMK",  // or "Modulhandbuch", "Prüfungsordnung"
      institution: "Kultusministerkonferenz (KMK)" or "Philipps-Universität Marburg",
      url: "https://...",
      sections: [GuidelineSection { title, content, subsections }]
    }
  ],
  last_updated: "2026-06-23"
}
```

### REQ-LP-2: Neo4j schema (target)

| Label                | Purpose                                   | Key properties                               |
| -------------------- | ----------------------------------------- | -------------------------------------------- |
| `:Curriculum`        | One per state+school_type combination     | `state_abbr`, `state`, `school_type`         |
| `:Topic`             | A Lernbereich / topic within a curriculum | `title`, `grade`, `slug`                     |
| `:SubTopic`          | A sub-topic within a topic                | `title`, `slug`                              |
| `:LearningObjective` | A learning objective (Kompetenzerwartung) | `text`, `verb`, `blooms_level`               |
| `:DidacticGuideline` | A KMK standard or Modulhandbuch           | `title`, `source_type`, `institution`, `url` |
| `:GuidelineSection`  | A section within a guideline              | `title`, `order`                             |

### REQ-LP-3: Relationships

| Type                      | From                            | To                   | Notes                    |
| ------------------------- | ------------------------------- | -------------------- | ------------------------ |
| `:HAS_TOPIC`              | `:Curriculum`                   | `:Topic`             | per grade                |
| `:HAS_SUBTOPIC`           | `:Topic`                        | `:SubTopic`          | hierarchical             |
| `:HAS_LEARNING_OBJECTIVE` | `:Topic`                        | `:LearningObjective` | per Lernbereich          |
| `:COVERS_TOPIC`           | `:Article` / `:Document`        | `:Topic`             | article-to-topic         |
| `:TEACHES_OBJECTIVE`      | `:Article` / `:Document`        | `:LearningObjective` | article-to-LO            |
| `:FULFILLS` (existing)    | `:LearningObjective`            | `:Entity`            | LO-to-concept            |
| `:FROM_GUIDELINE`         | `:LearningObjective` / `:Topic` | `:DidacticGuideline` | reference back to source |
| `:ALIGNS_WITH`            | `:Curriculum`                   | `:DidacticGuideline` | state ↔ KMK alignment    |

### REQ-LP-4: State coverage

- 16/16 German Bundesländer must have a `:Curriculum` node (or explicit
  "data not available" marker — at minimum BY, BW, NW, HE, NI, RP must
  have full data because they are the largest states by population)
- All topics within a curriculum must have at least one
  `:LearningObjective` (or be explicitly marked `objectives: pending`)

### REQ-LP-5: Didaktik coverage

- `:DidacticGuideline` nodes must exist for:
  - KMK Bildungsstandards Chemie MSA 2004
  - KMK Bildungsstandards Chemie MSA 2024 (Weiterentwicklung)
  - KMK Bildungsstandards Chemie AHR 2020
  - KMK Implementation Brochure 2024
  - KMK Kerncurriculum Ausland 2024
- For Modulhandbücher: at least 1 (Marburg, even if the scraper is a
  stub) once the scraper is implemented; goal is 5+ universities by
  end of 2026

### REQ-LP-6: API surface

- `GET /api/curriculum/{state_abbr}` — full curriculum for a state
  (returns the State JSON shape)
- `GET /api/curriculum/{state_abbr}/grade/{n}` — topics for a specific
  grade
- `GET /api/curriculum/topic/{slug}/articles` — articles that cover
  a topic
- `GET /api/curriculum/objective/{id}/articles` — articles that teach
  a specific learning objective
- `GET /api/didaktik` — all guidelines, filterable by `source_type` and
  `institution`

### REQ-LP-7: Front-end integration

- **Entity pages** (`/entity/{slug}/`): show a "Lehrplan-Bezug" section
  if the entity is referenced by any `:LearningObjective` via
  `:FULFILLS`
- **Article pages** (`/themenbereiche/.../{slug}/`): show "Gehört zu
  Lernbereich: {topic.title}" + "Vermittelt Kompetenz: {objective.text}"
- **Wissensnetz** (`/wissennetz/`): add a "Lehrplan" filter chip that
  highlights nodes that are referenced by learning objectives
- **New page** `/lehrplaene/` — index of all 16 state curricula with
  per-state article counts and a download link for the JSON

### REQ-LP-8: Data quality

- No `:Curriculum` with a null `state_abbr`
- All `:LearningObjective.text` non-empty
- No duplicate `:Topic` per curriculum (slug uniqueness)
- 95% of `:Curriculum` topics must have at least one
  `:LearningObjective`
- All `:FULFILLS` from LO must point to existing `:Entity`

## Scenarios

### S-LP-1: User browses the curriculum for their state

**Given** the user visits `/lehrplaene/by/` (Bayern)
**When** the page loads
**Then** the page renders the Bayern curriculum with all 13 grades
(Gymnasium: 8-12, plus other school types) as a tree
**And** each topic shows its sub-topics and learning objectives
**And** each topic links to articles that cover it
**And** each learning objective links to the articles that teach it

### S-LP-2: User sees entity in curriculum context

**Given** the user is on `/entity/ammoniak/`
**When** the page loads
**Then** the "Lehrplan-Bezug" section shows the learning objectives
that reference Ammoniak (e.g. "Lernziel 8.2.3: SuS beschreiben die
Eigenschaften von Ammoniak als Beispiel für eine Base")
**And** each learning objective links to its topic and the full
curriculum

### S-LP-3: KI-Assistent uses curriculum data

**Given** the user asks the AI "Was lernen SuS in BY Gymnasium Klasse
9 zu Säuren?"
**When** the chat sends `POST /api/chat`
**Then** `getRAGContext` includes the BY Gymnasium Klasse 9 acid-base
topic + its learning objectives
**And** the answer references the specific Lernbereich and Kompetenz

### S-LP-4: New state curriculum is added

**Given** a new state is added (or a state curriculum is updated)
**When** `scripts/import-curricula.mjs` runs with the new file
**Then** the Neo4j is updated idempotently (no duplicates)
**And** the front-end `/lehrplaene/{state}/` page shows the new data
within the same deploy

## References

- `myhugoapp/data/curricula/*.json` — source-of-truth state data
- `myhugoapp/data/didaktik/didaktik.json` — source-of-truth didaktik data
- `scripts/curricula/scraper.py` — orchestrator for state scraping
- `scripts/curricula_didaktik/scraper.py` — orchestrator for didaktik
- `scripts/curricula_didaktik/sources/{kmk,marburg_modulhandbuch}.py` —
  individual source scrapers
- `scripts/import-curricula.mjs` — Neo4j import (to be created/extended)
- `docs/KNOWLEDGE_GRAPH_SCHEMA.md` — schema overview (to be extended
  with the new labels and rel types)
