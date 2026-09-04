# Change Proposal: research-entity-coverage

## Why

Die Chemie-Forschung-Pipeline (`chemierecherche-runner`) wählt via
`getHotChemistryTopics` immer die gleichen Top-Degree-Entitäten und erzeugt
mit `--index 1..N` jede Woche dieselben ~Top-4 Knoten neu. Der lange Schwanz
der KG wird nie abgedeckt → die **Entitäts-Abdeckung** stagniert (Lücke S44.1).

## What Changes

- Kandidaten werden um bereits veröffentlichte Entitäten gefiltert (gelesen aus
  dem Ziel-`OUT_DIR` über das kanonische `entity:`-Feld bzw. den Titel).
- `getHotChemistryTopics`-Fenster 25 → 100, damit tieferliegende Entitäten
  überhaupt erreichbar werden.
- Jeder Artikel erhält ein `entity:`-Feld (KG-Entitätsname) für exaktes
  Coverage-Matching (Generator `article-generator.ts`).
- `--index` bezieht sich auf die gefilterte (uncovered) Liste, sodass jeder
  Schleifendurchlauf eine neue Entität trifft.

## Impact

- Betrifft `chemierecherche-runner` (`scripts/generate-chemistry-article.ts`,
  `src/lib/article-generator.ts`).
- Neue Capability `chemie-forschung-pipeline` (Delta-Spec).
- Kein Breaking Change für lesende Komponenten (Hugo, KI-Assistent, Graph).
