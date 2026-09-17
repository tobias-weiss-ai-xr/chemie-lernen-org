# lehrende-hub Specification

## Purpose

Provide a lightweight, accessible landing hub for teachers on `/lehrende/`: a hero, short intro, and automatically generated card grids for teaching-methods sections and teaching tools, plus a split-dropdown main navigation that lets URLs navigate while a separate caret opens submenus. All cards must meet WCAG contrast requirements across Light, Dark, and Contrast themes.

## Requirements

### Requirement: LH-1 — Hub page `/lehrende/`

The page `/lehrende/` SHALL render a clean entry page with a hero, short intro, and automatic card grids for sections and tools.

#### Scenario: Hub contains all teaching content

- **WHEN** a teacher opens `/lehrende/` in the browser
- **THEN** the page is rendered in the browser
- **AND** it shows a hero with the title "Lehrende" and subtitle
- **AND** it shows a card list "Didaktische Grundlagen" containing all teaching sections and the Meyers-principles page
- **AND** it shows a card list "Werkzeuge für Lehrkräfte" with the 9 children of the Lehrende menu entry

### Requirement: LH-2 — Split-dropdown navigation

Main menu entries with children and a real URL SHALL render a label link to the section plus a separate caret that opens the submenu; `url="#"` entries SHALL keep the previous toggle behavior.

#### Scenario: Clicking the label navigates to the section

- **WHEN** a user clicks the "Lehrende" label in the navbar
- **THEN** the browser navigates to `/lehrende/`
- **AND** the submenu does not open

#### Scenario: Clicking the caret opens the submenu

- **WHEN** a user clicks the caret next to "Lehrende" in the navbar
- **THEN** the dropdown submenu with the tool links opens
- **AND** the browser does not navigate away from the current page

#### Scenario: Entries with `url="#"` stay unchanged

- **WHEN** a user taps the "Interaktiv" or "Mehr" menu entry
- **THEN** the previous single-toggle keeps working as a dropdown

### Requirement: LH-3 — Contrast of the Lehrende cards

The cards on `/lehrende/` SHALL satisfy WCAG contrast requirements in all themes.

#### Scenario: Contrast in Light/Dark/Contrast

- **WHEN** the page is loaded in the Light, Dark, and Contrast themes
- **THEN** titles and description text of the cards satisfy the WCAG contrast ratio (AA: normal ≥ 4.5:1, large ≥ 3:1)
- **AND** no text is unreadable (no "yellow on white" collision)
