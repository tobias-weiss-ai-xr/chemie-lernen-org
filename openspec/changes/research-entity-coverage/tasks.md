# Tasks: research-entity-coverage

## 1. Generator: entity-Feld (chemierecherche-runner)

- [x] 1.1 `ChemistryArticle` um `name: string` erweitern
- [x] 1.2 `generateArticle` setzt `name: topic.name`
- [x] 1.3 `saveArticle` schreibt `entity: ${article.name}` ins Frontmatter

## 2. Pipeline: Coverage-Filter (chemierecherche-runner)

- [x] 2.1 `getHotChemistryTopics(25)` → `getHotChemistryTopics(100)`
- [x] 2.2 `readCoveredEntities` + `isCovered` (entity/title/base, Präfix)
- [x] 2.3 Kandidaten vor `--index`-Selektion um gecoverte Entitäten filtern
- [x] 2.4 `tsc --noEmit` grün; Logik-Test gegen echtes `content/`-Verzeichnis

## 3. Doku & Spec (dieses Repo)

- [x] 3.1 `docs/chemie-forschung-pipeline.md`: `entity:` im Frontmatter-Beispiel + Abschnitt „Entitäts-Abdeckung (S44.1)“
- [x] 3.2 Delta-Spec `chemie-forschung-pipeline` (REQ-CF-6)

## 4. Archive

- [ ] 4.1 Nach Validierung durch echten Pipeline-Lauf: Spec syncen + archivieren
