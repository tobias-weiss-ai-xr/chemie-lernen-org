## 1. Curriculum Data Repair

- [x] 1.1 Re-scrape Brandenburg (bb.json) — fix scraper, verify ≥150 topics, ≥2000 objectives
- [x] 1.2 Re-scrape Berlin (be.json) — fix scraper, verify ≥150 topics, ≥2000 objectives
- [x] 1.3 Run Saarland scraper (`scripts/scrape-saarland-curriculum.mjs`) — validate JSON, merge into `data/curricula/sl.json`
- [x] 1.4 Run `scripts/validate-curricula.mjs` — all 18 states pass (structure, min topics, min objectives)

## 2. Content Cross-Linking

- [x] 2.1 Create `scripts/cross-link-audit.mjs` — scan `content/themenbereiche/` articles, report which are missing entity cross-links in `content-cross-links.json`
- [x] 2.2 Add remaining unlinked themenbereiche articles to `content-cross-links.json`
- [x] 2.3 Run audit — verify ≥95% coverage

## 3. Klassenstufen Content

- [x] 3.1 Populate `content/klassenstufen/5/_index.md` — intro, curriculum links, related themenbereiche, practice links
- [x] 3.2 Populate `content/klassenstufen/6/_index.md`
- [x] 3.3 Populate `content/klassenstufen/7/_index.md`
- [x] 3.4 Populate `content/klassenstufen/8/_index.md`
- [x] 3.5 Populate `content/klassenstufen/9/_index.md`
- [x] 3.6 Populate `content/klassenstufen/10/_index.md`
- [x] 3.7 Populate `content/klassenstufen/11/_index.md`
- [x] 3.8 Populate `content/klassenstufen/12/_index.md`
- [x] 3.9 Populate `content/klassenstufen/13/_index.md`

## 4. CI & Didaktik

- [x] 4.1 Add `npm run validate:curricula` script — runs `scripts/validate-curricula.mjs`
- [x] 4.2 Add curriculum validation step to `deploy.yml` before Hugo build
- [x] 4.3 Write test for `/api/didaktik` endpoint in `tests/`
