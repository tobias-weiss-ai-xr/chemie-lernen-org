# Sprint 4: Content Expansion

**Goal**: Expand chemistry content library to ensure every Themenbereich has at least 5 articles, improve cross-linking quality, and introduce content freshness tracking.

## Scope

### New Articles (15 total)

- Audit current counts per Themenbereich
- Create articles for undersized areas:
  - **Anorganische Verbindungen** (3 → 5): Komplexchemie, Industrielle anorganische Chemie
  - **Redox & Elektrochemie** (4 → 5): Korrosion und Korrosionsschutz
  - **Analytische Methoden** (3 → 5): Massenspektrometrie, Thermische Analyse
  - **Erdöl & organische Stoffklassen** (3 → 5): Kunststoffe und Polymerisation
  - **Reaktionstypen organisch** (3 → 5): Eliminierungsreaktionen
  - **Produkte des Alltags organisch** (3 → 5): Tenside und Waschmittel
  - **Tipps & Tricks** (3 → 5): Lernstrategien Chemie, Typische Fehler vermeiden
- Each article: 300-800 words, German, Hugo frontmatter with tags, teilgebiet, curriculum mapping

### Cross-Linking Improvements

- Add `teilgebiet`-based cross-links to `content-links.json` (already extracted but verify completeness)
- Add cross-link badges to article footers ("Verwandte Themen", "Geeignete Rechner")
- Create cross-link quality dashboard (`/api/content/cross-link-stats`)

### Content Freshness

- Add `last_reviewed` frontmatter field to all content files
- Create `scripts/audit-content-freshness.mjs` — flag articles not reviewed in 6 months
- Content update workflow documented in `CONTRIBUTING.md`

## Success Criteria

- All 12 Themenbereiche have ≥ 5 articles
- Cross-link density ≥ 3 links per article (currently may be lower)
- Cross-link quality dashboard shows coverage metrics
- Freshness audit script runs without errors
