## 1. Backend Engine — learning-engine.js

- [ ] 1.1 Create `api/learning-engine.js` with learning path queries (LP-1, LP-2, LP-3)
- [ ] 1.2 Implement enrollment logic (LP-4) — idempotent, session store persistence
- [ ] 1.3 Implement progress tracking: mark objective complete, calculate percentage (LP-5)
- [ ] 1.4 Implement XP system: earn, history, total (GAM-1, GAM-2)
- [ ] 1.5 Implement achievement/badge definitions and evaluation (GAM-3)
- [ ] 1.6 Implement daily check-in with streak tracking (GAM-4)
- [ ] 1.7 Implement PDF certificate generation via PDFKit (LP-7)

## 2. Backend Routes — server.js

- [ ] 2.1 Add `import learningEngine from './learning-engine.js'` to server.js
- [ ] 2.2 Add `GET /api/learning-paths` route (LP-2)
- [ ] 2.3 Add `GET /api/learning-paths/:slug` route (LP-3)
- [ ] 2.4 Add `POST /api/learning-paths/:slug/enroll` route (LP-4)
- [ ] 2.5 Add `GET /api/learning-paths/progress` route (LP-6)
- [ ] 2.6 Add `GET /api/learning-paths/:slug/certificate` route (LP-7)
- [ ] 2.7 Add `POST /api/check-in` + `GET /api/check-in` routes (GAM-4, GAM-6)
- [ ] 2.8 Add `GET /api/achievements` route (GAM-5)
- [ ] 2.9 Add XP hooks to existing exercise/quiz routes (GAM-1)

## 3. Frontend — Learning Paths Page

- [ ] 3.1 Create `myhugoapp/content/lernpfade/_index.md` — landing page content
- [ ] 3.2 Create `myhugoapp/layouts/_default/lernpfade.html` — path overview with progress bars
- [ ] 3.3 Inline JS: fetch paths, render enrollment buttons, show progress
- [ ] 3.4 Create `myhugoapp/layouts/_default/lernpfad-single.html` — single path detail page

## 4. Frontend — Achievements & Check-in UI

- [ ] 4.1 Add badge display component to lernpfade page (earned badges grid)
- [ ] 4.2 Add daily check-in button with streak counter

## 5. Dependencies & Integration

- [ ] 5.1 Add `pdfkit` to `api/package.json`
- [ ] 5.2 Update `.openspec.yaml` with affected areas
- [ ] 5.3 Verify: ESLint clean on all new/changed files
- [ ] 5.4 Commit and push all Sprint 14 changes
