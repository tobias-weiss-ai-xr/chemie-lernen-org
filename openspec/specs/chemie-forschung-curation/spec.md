# chemie-forschung-curation Specification

## Purpose

TBD - created by archiving change kg-curation-gate. Update Purpose after archive.

## Requirements

### Requirement: REQ-CF-1: Draft-by-default generation

The article generator (`chemierecherche-runner`) SHALL write new
Chemie-Forschung articles with `draft: true` and `review_status: draft`.

- Because Hugo excludes drafts from production builds, generated articles
  SHALL NOT be rendered publicly until a human publishes them.
- The generator SHALL also emit empty `reviewer: ""` and
  `review_date: ""` fields.

#### Scenario: New article is invisible until reviewed

- **GIVEN** the research pipeline generated a new article
- **WHEN** its front matter is inspected
- **THEN** it contains `draft: true`, `review_status: draft`,
  `reviewer: ""` and `review_date: ""`
- **AND** the article is not rendered on the production site (Hugo
  excludes drafts)

### Requirement: REQ-CF-2: Publish action stamps provenance

A publish action (`scripts/curation/publish-article.mjs`) SHALL, for a
chosen draft article:

- set `review_status: published`
- set `draft: false`
- set `reviewer` to the acting reviewer's name
- set `review_date` to the publication date

#### Scenario: S-CF-2a: Reviewer publishes a draft

- **WHEN** a reviewer runs the publish tool on a `review_status: draft`
  article that passes all heuristics
- **THEN** the article becomes `draft: false` + `review_status: published`
- **AND** `reviewer` and `review_date` are populated
- **AND** the change is committed

### Requirement: REQ-CF-3: Publish heuristics

The publish action SHALL abort and reject the article when:

- `review_status` is not `draft`
- the body is shorter than the configured minimum length
- a required frontmatter field (`title`, `description`, `date`, `tags`)
  is missing
- placeholder text (e.g. `TODO`, `Lorem`) is present

#### Scenario: S-CF-3a: Publish blocked on short body

- **WHEN** a reviewer runs the publish tool on an article below the
  minimum body length
- **THEN** the tool exits non-zero and leaves the file unchanged

### Requirement: REQ-CF-4: Deploy safety check

A check script (`scripts/curation/check-reviewed.mjs`) SHALL scan all
Chemie-Forschung articles and exit non-zero if any article has
`draft: false` while `review_status` is not `published` or `reviewer` is
empty.

#### Scenario: S-CF-4a: Unreviewed published article is caught

- **WHEN** an article has `draft: false` but no `reviewer`
- **THEN** the check script reports it and exits with a failure code

### Requirement: REQ-CF-5: Documented gate

`docs/chemie-forschung-pipeline.md` SHALL document the curation gate,
including the draft-by-default behaviour and the publish command.

#### Scenario: Editor looks up how to publish a reviewed article

- **GIVEN** an editor wants to publish a reviewed research article
- **WHEN** they open `docs/chemie-forschung-pipeline.md`
- **THEN** they find the draft-by-default behaviour explained and the
  exact publish command to run
