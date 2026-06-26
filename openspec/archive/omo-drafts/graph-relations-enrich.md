# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

---

slug: graph-relations-enrich
status: awaiting-approval
intent: clear
pending-action: write .omo/plans/graph-relations-enrich.md
approach: Cypher + APOC + graphwiz basierte Relationship-Typisierung und Cached View

---

# Draft: graph-relations-enrich

## Components

| id  | outcome                                                               | status   | evidence path                             |
| --- | --------------------------------------------------------------------- | -------- | ----------------------------------------- |
| C1  | Cypher-Typisierungsregeln ersetzen RELATED_TO durch semantische Typen | active   | neo4j console, upgrade-relation-types.mjs |
| C2  | kg-enrich.mjs Pre-computed Export (Cached View)                       | active   | scripts/                                  |
| C3  | Build-Pipeline Integration (npm run enrich + build)                   | active   | package.json                              |
| C4  | Entity-Detail Frontend für typisierte Relations                       | deferred | entity/single.html                        |

## Open assumptions

| assumption                                 | adopted default                 | rationale                        | reversible |
| ------------------------------------------ | ------------------------------- | -------------------------------- | ---------- |
| Kein GDS verfügbar                         | Reine Cypher + APOC + graphwiz  | Neo4j community edition ohne GDS | Nein       |
| kg_data.json muss zuerst exportiert werden | kg-enrich liest kg_data.json    | Export-Skript existiert bereits  | Ja         |
| Frontend-Farbe je Relationstyp             | deferred bis Cached View stabil | Vorher keine sinnvollen Daten    | Ja         |

## Findings

- **Neo4j 5.26-community in docker-compose** — KEIN GDS (Enterprise-only)
- **APOC verfügbar** für community, aber aktuell nicht in docker-compose eingerichtet
- **Aktuelle Relationstypen**: RELATED_TO (generic), ERFUELLT (didaktik↔lehrplan), MENTIONS (entity→content), BESTEHT_AUS (components)
- **Cypher-Queries** in export-kg-data.mjs: MATCH (e:Entity) OPTIONAL MATCH (e)-[r]->(target) RETURN relationships by type
- **upgrade-relation-types.mjs** existiert: ersetzt RELATED_TO→ERFUELLT für lehrplan↔didaktik
- **graphwiz builder** (`@graphwiz/builder`) lokal, `buildEntityGraph()` für Co-Occurrence
- **Kein kg:enrich Schritt** in Build-Pipeline (package.json)

## Decisions

1. **Kein GDS → Cypher + APOC + graphwiz**: Da GDS nicht verfügbar, werden Ähnlichkeiten via Co-Occurrence (graphwiz builder) berechnet. Typisierungsregeln via pure Cypher MATCH + CREATE.
2. **Pre-computed View statt Live-Abfrage**: kg_data.json wird als Cached View angereichert → kg_rich_data.json. Kein Live-Neo4j-Zugriff im Frontend.
3. **Build-Pipeline erweitern**: `npm run enrich` zwischen export und hugo-build.

## Scope IN

- Wave 1: Cypher-Typisierungsregeln für entity-to-entity Relations
- Wave 2: kg-enrich.mjs Export-Skript
- Wave 3: Build-Pipeline Integration

## Scope OUT

- GDS-basierte Algorithmen (nicht verfügbar)
- Echtzeit-Neo4j-Abfragen im Frontend
- Migration bestehender Daten (Wiederverwendbar, aber nicht Teil dieses Plans)

## Open questions

Keine — alle Fork-Punkte durch Research beantwortet.

## Approval gate

status: awaiting-approval
User hat Plan am 25.06.2026 genehmigt ("ja").
