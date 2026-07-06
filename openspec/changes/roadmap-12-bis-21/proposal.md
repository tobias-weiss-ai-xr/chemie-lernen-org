## Why

The platform now has a solid foundation: content (10 article series), calculators (15+ tools), quiz engine with SM2, PWA offline support, AI tutor with personalized RAG, and production-grade infrastructure. The next phase transforms it from a content site into a comprehensive, interactive chemistry learning ecosystem.

## What Changes

### Sprint 12: Virtual Lab Simulator

Browser-based chemistry lab with virtual equipment (Bunsen burner, beakers, titration stand, measuring devices). Run reactions, observe color changes, gas evolution, and precipitation — with safety annotations. Uses Three.js/WebGL for 3D equipment.

### Sprint 13: Exercise Generator Engine

AI-powered exercise generation from the knowledge graph. Auto-generates multiple-choice, fill-in-the-blank, and calculation problems with dynamic difficulty scaling. Each exercise links to specific learning objectives.

### Sprint 14: Learning Paths & Achievements

Structured curriculum-based learning paths with progress bars, XP/level system, badges for milestones, streaks for daily use, and printable certificates on path completion.

### Sprint 15: Advanced Periodic Table

Interactive 3D periodic table with: element property visualization (electronegativity, radius, ionization energy), orbital viewer, isotope explorer, element comparison tool, and electron configuration builder.

### Sprint 16: Collaborative Learning

Study groups, shared notes per page, peer tutoring queue, and teacher dashboard (class management, assignment creation, progress monitoring).

### Sprint 17: Offline-First Mobile Experience

Full offline support: local question generation from cached templates, offline knowledge graph browsing, sync-on-reconnect, push notifications for streaks/reminders, app-like install experience.

### Sprint 18: Exam Preparation Mode

Timed practice exams matching German Abitur/CHEM standards. Auto-grading with detailed feedback, score prediction based on historical performance, personalized weak-spot drilling, and exam readiness score.

### Sprint 19: Content Authoring Platform

Admin UI for educators: article editor (Markdown + mhchem/KaTeX preview), exercise/quiz builder with KG entity linking, media manager, and draft/publish workflow.

### Sprint 20: API v2 & Public SDK

Public REST API with API key authentication, rate limiting (1000 req/day free tier), interactive docs portal (Stoplight/Scalar), and TypeScript/Python client SDKs.

### Sprint 21: Internationalization (EN/FR)

Full i18n: UI strings in German/English/French, content articles translated, calculator labels locale-aware, AI tutor language detection + response in user's language, locale-specific curriculum data.

## Capabilities

- `virtual-lab` — WebGL browser chemistry lab
- `exercise-generator` — AI-powered exercise creation from KG
- `learning-paths` — Structured paths with gamification
- `advanced-periodic-table` — 3D element explorer
- `collaborative-learning` — Groups, notes, teacher dashboard
- `offline-first` — Full offline PWA with sync
- `exam-preparation` — Timed exams with auto-grading
- `content-authoring` — Admin UI for educators
- `public-api` — v2 API with SDKs
- `internationalization` — Multi-language (DE/EN/FR)

## Impact

- **Frontend**: New pages for lab, periodic table, admin, exam mode, learning paths. i18n refactor across all templates
- **Backend**: Exercise generator service, collaborative features (WebSockets?), public API gateway with rate limiting
- **Infrastructure**: CDN for i18n assets, WebSocket support, increased storage for user-generated content
- **Dependencies**: Three.js (upgrade), WebSocket library, i18n framework (i18next), KaTeX/mhchem

## Rollback Plan

Each sprint is independently implementable and revertible. Sprints do not depend on each other — they can be shipped in any order based on priority.
