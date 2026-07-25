## 1. Lesson Plan API

- [ ] 1.1 Create `api/routes/premium-content.js` — Router with requirePremium middleware
- [ ] 1.2 Implement `POST /api/premium/lesson-plan` — accepts {topic, klassenstufe, duration, difficulty}, fetches KG context, calls LiteLLM, returns structured JSON (title, objectives, materials, activities, assessment, homework)
- [ ] 1.3 Implement `POST /api/premium/worksheet` — accepts {topic, exerciseCount, types[]}, generates exercises (multiple choice, fill-blank, calculation) via LiteLLM, returns JSON
- [ ] 1.4 Mount router in `api/server.js`
- [ ] 1.5 Write unit tests for prompt building, response parsing, validation (tests/lesson-plan.test.js)

## 2. Lesson Plan Generator Page

- [ ] 2.1 Create `myhugoapp/content/premium/lehrplaene.md` — layout: premium-lehrplaene
- [ ] 2.2 Create `myhugoapp/layouts/_default/premium-lehrplaene.html` — form (topic dropdown, grade selector, duration, difficulty), loading state, rendered plan sections, export button
- [ ] 2.3 Create `myhugoapp/static/js/premium-lehrplaene.js` — form handling, API calls, render structured plan as formatted HTML, PDF export via window.print(), save to session history
- [ ] 2.4 Create `myhugoapp/static/css/premium-lehrplaene.css` — lesson plan styles (sections, objectives list, materials card, activity timeline, assessment rubric)

## 3. Documentation

- [ ] 3.1 Update API.md with lesson-plan and worksheet endpoint docs
- [ ] 3.2 Update SPECS_INDEX with both sprint entries
