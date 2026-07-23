## ADDED Requirements

### Requirement: Browse module offerings by state

The system SHALL provide a web page at `/studienvergleich/` that displays module offerings filtered by federal state.

#### Scenario: Page renders

- **WHEN** a user visits `/studienvergleich/`
- **THEN** the page SHALL load and display a state filter dropdown

#### Scenario: Filter by state

- **WHEN** a user selects "Bayern" from the state filter
- **THEN** the page SHALL display module offerings from Bavarian universities only

#### Scenario: Filter by topic

- **WHEN** a user selects "Anorganische Chemie" from the topic filter
- **THEN** the page SHALL display modules matching that topic

#### Scenario: Shareable URL

- **WHEN** a user applies filters
- **THEN** the URL SHALL update with query parameters (e.g., `?state=BY&topic=Anorganische`)
- **AND** loading that URL SHALL restore the same filter state

### Requirement: Compare modules across states

The system SHALL allow side-by-side comparison of module offerings for the same topic across different states.

#### Scenario: Side-by-side display

- **WHEN** a user selects "Vergleichen" mode with states BY and NW
- **THEN** modules for the selected topic SHALL be displayed in side-by-side columns grouped by state

#### Scenario: Empty state

- **WHEN** no data is available for the selected state/topic combination
- **THEN** the page SHALL display "Keine Daten verfügbar" with a suggestion to try another filter
