## 1. Quiz Widget Partial

- [x] 1.1 Create `myhugoapp/layouts/partials/quiz-widget.html` — embeddable quiz widget with topic selector, loads quiz-questions.js, shows score
- [x] 1.2 Wire quiz-widget.html into all 12 Themenbereich `_index.md` files

## 2. Entity-Cloud Partial

- [x] 2.1 Create `myhugoapp/layouts/partials/entity-cloud.html` — visual tag cloud of entity names linking to /entity/<slug>/
- [x] 2.2 Create `scripts/generate-themenbereich-entities.mjs` — maps entities to Themenbereiche via keyword matching, generates `myhugoapp/data/themenbereich-entities.json`
- [x] 2.3 Wire entity-cloud.html into all 12 Themenbereich `_index.md` files

## 3. Tests & Docs

- [x] 3.1 Write tests for entity-Themenbereich keyword mapping logic
- [x] 3.2 Add npm script `generate:themenbereich-entities` to package.json
