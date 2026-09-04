# Tasks: kg-curation-gate

## 1. Generator-Default (chemierecherche-runner)

- [x] 1.1 `src/lib/article-generator.ts`: `draft: false` → `draft: true`
- [x] 1.2 Frontmatter um `review_status: draft`, `reviewer: ""`,
      `review_date: ""` ergänzen (nach `tags`, vor `draft`)
- [x] 1.3 Commit im `chemierecherche-runner`-Repo (verified 2026-09-04: 9a955d4)

## 2. Publish-Tool (dieses Repo)

- [x] 2.1 `scripts/curation/publish-article.mjs` anlegen:
      Frontmatter parsen, Heuristiken, Felder setzen, committen
- [x] 2.2 Manuelle Smoke-Tests mit einem Draft-Artikel

## 3. Check-Tool (dieses Repo)

- [x] 3.1 `scripts/curation/check-reviewed.mjs` anlegen:
      scannt `chemie-forschung/*.md`, exit 1 bei Regelverstoß
- [ ] 3.2 Optional: als CI-Schritt vor Deploy dokumentieren/einhängen

## 4. Backfill & Doku (dieses Repo)

- [x] 4.1 Bestehende `draft: false`-Artikel mit `review_status: published` + `reviewer`/`review_date` versehen
- [x] 4.2 `docs/chemie-forschung-pipeline.md`: Kapitel „Curation Gate“

## 5. Spec & Archive

- [x] 5.1 Delta-Spec `chemie-forschung-curation` pflegen
- [x] 5.2 Nach Implementierung: Spec in `openspec/specs/` syncen + archivieren
