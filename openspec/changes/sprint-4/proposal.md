# Sprint 4: Content Expansion

**Goal**: Expand chemistry content library to ensure every Themenbereich has at least 5 unique articles, resolve content duplicates, improve cross-linking, add content freshness tracking, and polish existing calculators.

## Scope

### New Articles (12 total)

- Write new articles for undersized areas (after dedup):
  - **Einführung Chemie** (4 → 6): Laborgeräte, Wissenschaftliche Methoden
  - **Aufbau der Materie** (4 → 6): Isotope und ihre Anwendungen, Periodische Trends
  - **Säuren & Basen** (4 → 5): Säurestärke und pKs-Werte
  - **Redox & Elektrochemie** (4 → 5): Elektrolyse und Galvanik
  - **Energetik** (4 → 5): Kalorimetrie und Enthalpiemessung
  - **Erdöl & organische Stoffklassen** (4 → 5): Funktionelle Gruppen
  - **Reaktionstypen organisch** (3 → 5): Nukleophile Substitution, Addition
  - **Produkte des Alltags** (3 → 5): Kunststoffe im Alltag (nach Tenside-Dedup)
  - **Anorganische Verbindungen** (4 → 5): Halogene und Edelgase (nach Dedup)
- Each article: 300-600 words, German, Hugo frontmatter with tags, teilgebiet, exercises

### Content Deduplication

- Merge: Produkte-organisch (waschmittel-tenside + tenside-waschmittel → 1 merged article)
- Cross-link: Anorganische Verbindungen (komplexchemie ↔ komplexverbindungen)
- Cross-link: Reaktionstypen organisch (eliminierung-umlagerung ↔ eliminierungsreaktionen)

### Calculator Polish (no new calculators)

- pH-Rechner: input validation, mobile UX, German error messages
- Molare-Masse-Rechner: formula parsing robustness, mobile layout
- Titrations-Simulator: curve rendering, mobile touch handling
- i18n audit: find hardcoded German strings across all calculators

### Cross-Linking Improvements

- Add `teilgebiet`-based cross-links to article footers
- Create cross-link badge partial (Hugo partial + template integration)
- Create cross-link quality endpoint (`GET /api/content/cross-link-stats`)

### Content Freshness

- Add `last_reviewed` frontmatter field to all content files
- Create `scripts/audit-content-freshness.mjs` — flag articles not reviewed in 6 months

## Success Criteria

- All 12 Themenbereiche have ≥ 5 unique articles
- Cross-link density ≥ 3 links per article
- Deduplication resolved (no overlapping articles on same topic)
- 3 calculators audited and polished
- Freshness audit script runs without errors
