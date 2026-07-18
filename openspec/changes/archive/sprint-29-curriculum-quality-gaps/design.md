## Architecture

### Curriculum Quality Pipeline

```
myhugoapp/data/curricula/{state}.json
  → scripts/validate-curricula.mjs (NEW — CI step)
    → quality report (topics count, objectives count, parsing errors)
    → fail CI if grade < B or topic count drops >10%
```

### Klassenstufen Content Model

Currently: empty directories with only `_index.md`.

Target: each klassenstufe gets:

- `_index.md` with overview, linked curriculum topics, related themenbereiche
- Links to relevant quizzes and calculators
- Hugo template picks up curriculum data from KG API

### Didaktik Endpoint

```
GET /api/didaktik?topic=acid-base
→ {
    guidelines: [...],
    relatedObjectives: [...],
    teachingTips: [...]
  }
```

Sources from Neo4j DidacticGuideline + GuidelineSection nodes (if they exist) or generated from learning objectives context.

## Key Files

| File                                          | Change                           |
| --------------------------------------------- | -------------------------------- |
| `myhugoapp/data/curricula/bb.json`            | Re-scrape, fix parsing           |
| `myhugoapp/data/curricula/be.json`            | Re-scrape, fix parsing           |
| `myhugoapp/data/curricula/sl.json`            | NEW — Saarland data              |
| `scripts/validate-curricula.mjs`              | NEW — CI quality gate            |
| `scripts/audit-content-freshness.mjs`         | Update cross-link coverage check |
| `myhugoapp/data/content-cross-links.json`     | Add 8 missing cross-links        |
| `api/server.js`                               | Add GET /api/didaktik route      |
| `myhugoapp/content/klassenstufen/*/_index.md` | Populate 9 directories           |
| `.github/workflows/deploy.yml`                | Add curriculum validation step   |

## Verification

1. validate-curricula.mjs passes on all 18 states
2. Cross-link coverage ≥95%
3. /api/didaktik returns valid JSON
4. Klassenstufen pages render with content
5. Hugo build succeeds
