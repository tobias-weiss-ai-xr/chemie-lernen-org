# Spec: themenbereiche

**Capability:** Subject area (Themenbereich) content architecture for chemie-lernen.org
**Owners:** Sisyphus
**Status:** Active — main spec

---

## Purpose

Themenbereiche (subject areas) are the primary content organization
system for chemie-lernen.org. The platform organizes chemistry content
into 12 subject areas that map to the German secondary-school chemistry
curriculum (Klasse 8-13). Each Themenbereich contains articles,
calculators, quizzes, and entity cross-references.

## Requirements

### REQ-TB-1: 12 subject areas

The platform defines exactly 12 subject areas:

1. **Stoffe** — substances, elements, compounds, mixtures
2. **Reaktionen** — chemical reactions, types of reactions
3. **Atombau** — atomic structure, subatomic particles
4. **Chemische Bindung** — chemical bonding (ionic, covalent, metallic)
5. **Säuren und Basen** — acids, bases, pH, neutralization
6. **Redoxreaktionen** — oxidation, reduction, electrochemistry
7. **Organische Chemie** — organic chemistry, hydrocarbons, functional groups
8. **Thermodynamik** — energy, enthalpy, entropy
9. **Kinetik** — reaction rates, collision theory, catalysis
10. **Analytik** — analytical methods, spectroscopy, chromatography
11. **Physikalische Chemie** — gas laws, phase transitions, solutions
12. **Umwelt und Nachhaltigkeit** — environmental chemistry, sustainability

### REQ-TB-2: Content hierarchy

Each Themenbereich has:

- A **landing page** at `/themenbereiche/<slug>/` with overview and
  navigation to sub-topics
- **Articles** (3-5 per area) covering specific concepts
- **Calculator links** to relevant interactive tools
- **Quiz sections** for self-assessment
- **Entity cross-links** to the knowledge graph

### REQ-TB-3: Article taxonomy

Articles within Themenbereiche use:

- Frontmatter tags: `themenbereich`, `kategorie`, `klassenstufe`,
  `schwierigkeit`
- Cross-links to related articles in other Themenbereiche
- Prerequisite relationships (e.g., Atombau before Chemische Bindung)
- Metadata: `author`, `last_reviewed`, `reading_time`

### REQ-TB-4: Cross-linking

Themenbereiche are cross-linked with:

- **Calculators:** each Themenbereich links to 2-5 relevant calculators
- **Entities:** key concepts link to entity pages (`/entity/<slug>/`)
- **Quizzes:** topic-specific quiz sets linked from the landing page
- **Klassenstufen:** grade-level filter shows relevant Themenbereiche
- **External resources:** curated links to reliable chemistry sources

### REQ-TB-5: Navigation

Navigation follows these patterns:

- Main navigation includes Themenbereiche dropdown or grid
- Breadcrumbs show: `Themenbereiche > Atombau > Atommodelle`
- Sidebar on article pages shows related Themenbereiche
- Search index (`pagefind`) indexes all Themenbereich content
- Mobile navigation uses collapsible accordion

### REQ-TB-6: Content format

Articles within Themenbereiche are:

- Written in Markdown with Hugo shortcodes
- Include: definition, explanation, examples, diagrams, formulas
- Use LaTeX math via KaTeX for chemical equations and formulas
- Include interactivity via embedded calculator or quiz shortcodes
- Regular review cycle for accuracy

### REQ-TB-7: Coverage target

Minimum content coverage per Themenbereich:

| Metric            | Target |
| ----------------- | ------ |
| Articles per area | 3-5    |
| Calculator links  | 2-5    |
| Quiz questions    | 10-20  |
| Entity links      | 5-15   |
| Diagrams/figures  | 2-5    |

### REQ-TB-8: Grade-level alignment

Content is tagged with Klassenstufen (8-13):

- Klasse 8-10: basic concepts (Stoffe, Atombau, Reaktionen basics)
- Klasse 11-13: advanced topics (Organische Chemie, Thermodynamik, Kinetik)
- Cross-grade content is marked with multiple grade levels
- Curriculum alignment verified against 16 German state curricula

### REQ-TB-9: SEO and discoverability

Each Themenbereich page includes:

- Unique `<title>` and `<meta description>`
- Open Graph and Twitter Card meta tags
- Structured data (JSON-LD with `DefinedTermSet` schema)
- Breadcrumb structured data
- Sitemap inclusion

### REQ-TB-10: Maintenance

Content maintenance procedures:

- `last_reviewed` date in every article frontmatter
- Quarterly review cycle for accuracy
- Stale content flagging (no review in 12+ months)
- Version history tracked via git

## Scenarios

### S-TB-1: Student browses subject areas

**Given** a student visits `/themenbereiche/`
**Then** all 12 subject areas are shown as cards
**When** they click "Atombau"
**Then** the Atombau landing page shows:

- 4 articles with brief descriptions
- 3 linked calculators (Atomenergieniveaus, Molekülorbitale)
- "Zugehörige Quizze" section with 3 difficulty levels
- Entity cloud with Atom, Proton, Neutron, Elektron, Isotop

### S-TB-2: Cross-subject navigation

**Given** a student reads an article about Ionenbindung in "Chemische Bindung"
**When** the article mentions "Edelgaskonfiguration"
**Then** "Edelgaskonfiguration" links to the Atombau themenbereich
**And** there is a "Voraussetzung: Atombau" note
**When** they click the link
**Then** they are taken to the Edelgase article in Atombau

### S-TB-3: Grade-level content filter

**Given** a student in Klasse 9 visits `/themenbereiche/`
**When** they select "Klasse 9" in the grade filter
**Then** only Themenbereiche relevant to Klasse 9 are shown
**And** articles are filtered to age-appropriate content
**And** advanced topics (Organische Chemie, Thermodynamik) are
shown as "coming in higher grades"

### S-TB-4: Teacher uses content for lesson planning

**Given** a teacher preparing a unit on Redoxreaktionen
**When** they visit `/themenbereiche/redoxreaktionen/`
**Then** they see:

- 4 articles covering oxidation numbers, galvanic cells,
  electrolysis, and corrosion
- 3 calculators (Redox-Potenzial-Rechner, Elektrochemie
  Teilchenebene, Redox-Titrationen)
- Quiz sets for each difficulty level
- Links to relevant curricula from the 16 state standards

### S-TB-5: Cross-linking to entity pages

**Given** a student reads "Katalyse" in the Kinetik themenbereich
**When** the article mentions "Platin als Katalysator"
**Then** "Platin" links to `/entity/platin/`
**And** the Platin entity page shows it is taught in the
Kinetik themenbereich
**And** the entity page also links back to the catalysis article

## References

- `myhugoapp/content/themenbereiche/` — content directory
- `myhugoapp/layouts/_default/` — page templates
- `myhugoapp/layouts/partials/` — shared components
- `myhugoapp/content/klassenstufen/` — grade-level organization
- `myhugoapp/content/entity/` — entity pages cross-linked
- `myhugoapp/static/js/quiz-integration.js` — quiz linking
- `myhugoapp/static/js/lazy-loader.js` — calculator loading
