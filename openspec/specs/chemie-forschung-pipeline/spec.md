# chemie-forschung-pipeline Specification

## Purpose

TBD - created by archiving change research-entity-coverage. Update Purpose after archive.

## Requirements

### Requirement: REQ-CF-6: Progressive entity coverage

The generator (`chemierecherche-runner`) SHALL exclude already-published
entities from candidate selection so that repeated runs cover new (long-tail)
entities.

- The candidate window SHALL query at least 100 entities
  (`getHotChemistryTopics(100)`).
- Each generated article SHALL carry a canonical `entity:` frontmatter field
  equal to the KG entity name (`topic.name`).
- Selection SHALL skip any candidate whose name matches an already-published
  entity (by `entity:` field or by title/base), applying `--index` to the
  remaining (uncovered) list.

#### Scenario: S-CF-6a: Already-covered entity is skipped

- **GIVEN** an article with `entity: Redoxreaktionen` exists in `OUT_DIR`
- **WHEN** the pipeline selects candidates for a run
- **THEN** `Redoxreaktionen` is excluded from the candidate list

#### Scenario: S-CF-6b: Long-tail entity gets covered over time

- **GIVEN** the top-N entities are already published
- **WHEN** the pipeline runs again
- **THEN** it selects the next uncovered entity rather than regenerating a
  published one
