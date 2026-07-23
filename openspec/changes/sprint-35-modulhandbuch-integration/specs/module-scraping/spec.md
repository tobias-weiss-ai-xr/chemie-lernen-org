## ADDED Requirements

### Requirement: Scrape module handbook for a state

The system SHALL provide a script to scrape module handbook data from university websites for a given federal state.

#### Scenario: Successful scrape

- **WHEN** the scraper runs for state "BY"
- **THEN** it SHALL output a valid JSON file at `myhugoapp/data/modulhandbuch/by.json`
- **AND** the JSON SHALL contain an array of module objects with fields: `id`, `name`, `type`, `credits`, `semester`, `degree`, `lecturer`, `description`, `topics`, `url`

#### Scenario: Rate limiting

- **WHEN** scraping multiple pages from the same domain
- **THEN** the scraper SHALL wait at least 1 second between requests

#### Scenario: Retry on failure

- **WHEN** an HTTP request fails (network error or 5xx)
- **THEN** the scraper SHALL retry up to 2 times before giving up

### Requirement: Import scraped data into Neo4j

The system SHALL provide a script to read scraped JSON files and insert them into Neo4j under the modulhandbuch labels (University, ModuleOffering, Lecturer, Degree, ECTS).

#### Scenario: Full import

- **WHEN** `scripts/import-modulhandbuch.mjs` runs
- **THEN** it SHALL create nodes: University, ModuleOffering, Lecturer, Degree
- **AND** relationships: OFFERED_BY (ModuleOffering→University), TAUGHT_BY (ModuleOffering→Lecturer), PART_OF (ModuleOffering→Degree)

#### Scenario: Idempotent re-import

- **WHEN** the import script runs twice with the same data
- **THEN** no duplicate nodes SHALL be created (MERGE on university+moduleId composite key)

### Requirement: Link modules to KG entities

The system SHALL link ModuleOffering nodes to relevant Entity nodes in the knowledge graph based on topic keywords.

#### Scenario: Topic matching

- **WHEN** a module has topics ["Atombau", "Periodensystem"]
- **THEN** the system SHALL create COVERS relationships from the ModuleOffering to Entity nodes matching those names

#### Scenario: No false positives

- **WHEN** a module topic matches multiple entity names
- **THEN** only unambiguous matches (exact name) SHALL be linked
