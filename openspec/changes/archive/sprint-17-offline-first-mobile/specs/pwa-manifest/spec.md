## ADDED Requirements

### Requirement: Web App Manifest

The system SHALL provide a web app manifest file that enables PWA installation.

#### Scenario: Manifest includes required fields

- **WHEN** browser reads manifest.json
- **THEN** manifest contains name, short_name, icons, theme_color, background_color, display

#### Scenario: Manifest icons meet PWA requirements

- **WHEN** browser evaluates manifest
- **THEN** icons include 192x192 and 512x512 sizes

### Requirement: Install Prompt

The system SHALL trigger install prompt when PWA criteria are met.

#### Scenario: Install prompt appears on second visit

- **WHEN** user visits site twice with 5 minutes between visits
- **THEN** browser shows install prompt

#### Scenario: Install prompt includes app name and icon

- **WHEN** install prompt is shown
- **THEN** prompt displays "chemie-lernen.org" and app icon

### Requirement: Splash Screen

The system SHALL display splash screen during PWA launch.

#### Scenario: Splash screen shows on app launch

- **WHEN** user launches installed PWA
- **THEN** splash screen with app icon and theme color is displayed

#### Scenario: Splash screen matches manifest colors

- **WHEN** splash screen is shown
- **THEN** background color matches manifest background_color
