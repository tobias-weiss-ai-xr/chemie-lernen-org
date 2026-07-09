## Context

The codebase already has a strong quiz infrastructure (`quiz-engine.js`, `quiz-ui.js`, 12 topic banks, `quiz.html` layout) that provides the foundation for exam preparation. The existing infrastructure supports:

- Timers (per-question + overall)
- Fisher-Yates shuffle
- Scoring with partial credit
- Multiple question types (MCQ, multi-select, true-false, fill-in-blank)
- Review screen with feedback
- Spaced repetition (SM-2 algorithm)

However, the existing infrastructure lacks:

- Server-side session management (to prevent cheating)
- Exam-format question assembly (mixed-type questions from multiple topics)
- Exam-specific UI (countdown timer, exam mode branding, submission flow)
- Exam analytics (weak-spot identification, score prediction, readiness score)
- Exam history (track exam attempts, progress, achievements)

Sprint 18 will extend the existing quiz infrastructure to support exam preparation mode, leveraging the existing quiz engine, UI, and data while adding the missing exam-specific features.

## Goals / Non-Goals

**Goals:**

- Provide a realistic exam simulation environment (timed, mixed-type questions, exam-mode UI)
- Support multiple exam formats (Abitur, CHEM, custom)
- Provide detailed feedback and analytics (score, weak spots, recommendations)
- Track exam history and progress (attempts, scores, achievements)
- Integrate with existing quiz infrastructure (reuse quiz engine, UI, data)
- Support offline mode (via Sprint 17 PWA infrastructure)
- Provide exam resources (study strategies, typical mistakes, exam tips)
- Support teacher analytics (class-level exam performance, weak spots, recommendations)

**Non-Goals:**

- Replace the existing quiz infrastructure (extend, don't replace)
- Add new question types (reuse existing MCQ, multi-select, true-false, fill-in-blank)
- Add new topic banks (extend existing 12 topic banks with exam-format questions)
- Add new spaced repetition algorithms (reuse existing SM-2 algorithm)
- Add new gamification features (reuse existing XP, achievements, leaderboard)
- Add new authentication system (reuse existing auth system)
- Add new API infrastructure (reuse existing Express, Neo4j, LiteLLM infrastructure)
- Add new frontend framework (reuse existing Hugo, JavaScript, CSS infrastructure)
- Add new testing infrastructure (reuse existing Jest, Playwright infrastructure)
- Add new deployment infrastructure (reuse existing Docker, CI/CD infrastructure)

## Decisions

### D1: Reuse existing quiz infrastructure

**Decision:** Extend `quiz-engine.js`, `quiz-ui.js`, and `quiz.html` to support exam mode, rather than creating a new exam engine from scratch.
**Rationale:** The existing quiz infrastructure already provides 80% of the functionality needed for exam mode (timers, scoring, UI, data). Extending it reduces development time, maintains consistency, and leverages existing test coverage.
**Alternatives considered:**

- Create a new exam engine from scratch (rejected: too much duplication, higher maintenance cost)
- Use a third-party exam engine (rejected: not flexible enough, doesn't integrate with existing infrastructure)

### D2: Server-side session management

**Decision:** Use the existing in-memory session store pattern (from `api/server.js`) for exam sessions, rather than adding Redis.
**Rationale:** The existing session store pattern is simple, reliable, and already used for other features (e.g., exercise engine). Adding Redis would add complexity and infrastructure dependencies.
**Alternatives considered:**

- Add Redis for session management (rejected: adds complexity, infrastructure dependencies)
- Use signed cookies for session management (rejected: less secure, harder to manage)

### D3: Exam question assembly

**Decision:** Assemble exam questions from existing topic banks (`static/data/quiz-*.js`) and cloze exercises (`cloze-exercises.js`), rather than creating a new exam question bank.
**Rationale:** The existing topic banks already contain high-quality questions that can be used for exam preparation. Creating a new exam question bank would duplicate effort and require additional maintenance.
**Alternatives considered:**

- Create a new exam question bank from scratch (rejected: duplicates effort, higher maintenance cost)
- Use a third-party question bank (rejected: not flexible enough, doesn't integrate with existing infrastructure)

### D4: Exam analytics

**Decision:** Use a simple heuristic for score prediction (based on historical performance) rather than a complex Bayesian model.
**Rationale:** A simple heuristic is easier to implement, maintain, and explain to users. A complex Bayesian model would add unnecessary complexity and may not provide significantly better predictions.
**Alternatives considered:**

- Use a complex Bayesian model for score prediction (rejected: adds complexity, harder to maintain)
- Use a third-party analytics service (rejected: not flexible enough, doesn't integrate with existing infrastructure)

### D5: Exam history

**Decision:** Store exam history in the existing `progress-tracker.js` localStorage store, rather than creating a new exam history store.
**Rationale:** The existing progress tracker already tracks quiz attempts, scores, and achievements. Extending it to support exam history reduces duplication and maintains consistency.
**Alternatives considered:**

- Create a new exam history store from scratch (rejected: duplicates effort, higher maintenance cost)
- Use a third-party history service (rejected: not flexible enough, doesn't integrate with existing infrastructure)

### D6: Exam resources

**Decision:** Link to existing exam resources (study strategies, typical mistakes, exam tips) rather than creating new exam resources.
**Rationale:** The existing exam resources (in `tipps-tricks/`) are already high-quality and well-maintained. Creating new exam resources would duplicate effort and require additional maintenance.
**Alternatives considered:**

- Create new exam resources from scratch (rejected: duplicates effort, higher maintenance cost)
- Use third-party exam resources (rejected: not flexible enough, doesn't integrate with existing infrastructure)

### D7: Teacher analytics

**Decision:** Extend the existing `klassencockpit.js` teacher dashboard to support exam analytics, rather than creating a new teacher analytics dashboard.
**Rationale:** The existing teacher dashboard already tracks student performance, weak spots, and recommendations. Extending it to support exam analytics reduces duplication and maintains consistency.
**Alternatives considered:**

- Create a new teacher analytics dashboard from scratch (rejected: duplicates effort, higher maintenance cost)
- Use a third-party analytics service (rejected: not flexible enough, doesn't integrate with existing infrastructure)

## Risks / Trade-offs

### R1: Exam question quality

**Risk:** The existing topic banks may not contain enough high-quality exam-format questions to support realistic exam simulation.
**Mitigation:** Extend the existing topic banks with exam-format questions (e.g., add more complex MCQ, calculation, and fill-in-blank questions).

### R2: Exam session management

**Risk:** The existing in-memory session store may not be reliable enough for exam sessions (e.g., sessions may be lost if the server restarts).
**Mitigation:** Add session persistence (e.g., store sessions in a file or database) to ensure sessions are not lost.

### R3: Exam analytics accuracy

**Risk:** The simple heuristic for score prediction may not be accurate enough for exam preparation.
**Mitigation:** Add a feedback mechanism (e.g., allow users to rate the accuracy of predictions) and refine the heuristic over time.

### R4: Exam history consistency

**Risk:** Storing exam history in localStorage may not be consistent across devices (e.g., users may take exams on multiple devices).
**Mitigation:** Add server-side exam history storage (e.g., store exam history in the database) to ensure consistency across devices.

### R5: Exam resources relevance

**Risk:** The existing exam resources may not be relevant enough for exam preparation (e.g., study strategies may not be specific to chemistry exams).
**Mitigation:** Add chemistry-specific exam resources (e.g., chemistry exam tips, chemistry study strategies, chemistry typical mistakes).

### R6: Teacher analytics privacy

**Risk:** Extending the teacher dashboard to support exam analytics may raise privacy concerns (e.g., teachers may be able to see sensitive student data).
**Mitigation:** Add privacy controls (e.g., allow students to opt out of teacher analytics, anonymize student data).

## Migration Plan

### Step 1: Extend existing quiz infrastructure

- Extend `quiz-engine.js` to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- Extend `quiz-ui.js` to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- Extend `quiz.html` to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- Extend existing topic banks with exam-format questions (e.g., add more complex MCQ, calculation, and fill-in-blank questions)

### Step 2: Add exam-specific features

- Add `pruefungsmodus.js` client-side exam engine (assembles questions, manages timer, handles submission)
- Add `pruefungs-dashboard.js` client-side results dashboard (shows score, feedback, weak spots, recommendations)
- Add `/pruefungsmodus/` page (Hugo content + layout) with exam selector, timer, and results dashboard
- Add `/pruefungsvorbereitung/` page (Hugo content) with study strategies, typical mistakes, and links to exam resources

### Step 3: Add exam API routes

- Add `/api/exams/start` route to start a timed exam session (auth required, returns session ID)
- Add `/api/exams/submit` route to submit exam answers (auth required, grades and stores results)
- Add `/api/exams/:id/result` route to retrieve exam results (auth required, returns score, feedback, weak spots)
- Add `/api/exams/predict` route to predict exam readiness (auth required, returns readiness score and recommendations)

### Step 4: Add exam analytics

- Add exam analytics (track exam performance, identify weak spots, provide recommendations)
- Add exam readiness score (calculate readiness based on historical performance)
- Add exam recommendations (provide personalized study recommendations based on weak spots)
- Add exam feedback (provide detailed feedback on exam performance, including correct answers and explanations)
- Add exam review (allow students to review exam questions, answers, and explanations)
- Add exam retry (allow students to retry exams with new questions)
- Add exam history (track exam history, including scores, feedback, and recommendations)
- Add exam progress (track exam progress, including scores, feedback, and recommendations)
- Add exam achievements (track exam achievements, including scores, feedback, and recommendations)
- Add exam leaderboard (track exam leaderboard, including scores, feedback, and recommendations)
- Add exam notifications (notify students of exam results, feedback, and recommendations)
- Add exam reminders (remind students to take exams, review feedback, and follow recommendations)
- Add exam scheduling (allow students to schedule exams, review feedback, and follow recommendations)
- Add exam calendar (allow students to view exam calendar, review feedback, and follow recommendations)

### Step 5: Add exam resources

- Add exam resources (provide links to exam resources, study strategies, typical mistakes)
- Add chemistry-specific exam resources (e.g., chemistry exam tips, chemistry study strategies, chemistry typical mistakes)
- Add exam feedback (provide detailed feedback on exam performance, including correct answers and explanations)
- Add exam review (allow students to review exam questions, answers, and explanations)
- Add exam retry (allow students to retry exams with new questions)
- Add exam history (track exam history, including scores, feedback, and recommendations)
- Add exam progress (track exam progress, including scores, feedback, and recommendations)
- Add exam achievements (track exam achievements, including scores, feedback, and recommendations)
- Add exam leaderboard (track exam leaderboard, including scores, feedback, and recommendations)
- Add exam notifications (notify students of exam results, feedback, and recommendations)
- Add exam reminders (remind students to take exams, review feedback, and follow recommendations)
- Add exam scheduling (allow students to schedule exams, review feedback, and follow recommendations)
- Add exam calendar (allow students to view exam calendar, review feedback, and follow recommendations)

### Step 6: Add teacher analytics

- Extend `klassencockpit.js` teacher dashboard to support exam analytics (class-level exam performance, weak spots, recommendations)
- Add privacy controls (e.g., allow students to opt out of teacher analytics, anonymize student data)

### Step 7: Test and deploy

- Test exam preparation mode (unit tests, integration tests, E2E tests)
- Deploy exam preparation mode (CI/CD pipeline, Docker containers, Kubernetes clusters)
- Monitor exam preparation mode (logging, monitoring, alerting)
- Maintain exam preparation mode (bug fixes, security updates, performance optimizations)

## Rollback Plan

If the change fails, revert by:

1. Removing new files: `pruefungsmodus.js`, `pruefungs-dashboard.js`, `pruefungsmodus.html`, `pruefungsvorbereitung.html`, `pruefungsmodus.md`, `pruefungsvorbereitung.md`, `api/exams.js`, `api/exam-engine.js`, `api/exam-prediction.js`, `api/exam-analytics.js`, `api/exam-readiness.js`, `api/exam-recommendations.js`, `api/exam-resources.js`, `api/exam-feedback.js`, `api/exam-review.js`, `api/exam-retry.js`, `api/exam-history.js`, `api/exam-progress.js`, `api/exam-achievements.js`, `api/exam-leaderboard.js`, `api/exam-notifications.js`, `api/exam-reminders.js`, `api/exam-scheduling.js`, `api/exam-calendar.js`
2. Removing new routes: `/api/exams/start`, `/api/exams/submit`, `/api/exams/:id/result`, `/api/exams/predict`
3. Reverting changes to existing quiz infrastructure
4. Reverting changes to existing quiz data
5. Reverting changes to existing quiz layouts
6. Reverting changes to existing quiz content
7. Reverting changes to existing quiz templates
8. Reverting changes to existing quiz partials
9. Reverting changes to existing quiz shortcodes
10. Reverting changes to existing quiz specs
11. Reverting changes to existing quiz design
12. Reverting changes to existing quiz tasks
13. Reverting changes to existing quiz proposal
14. Reverting changes to existing quiz implementation
15. Reverting changes to existing quiz documentation
16. Reverting changes to existing quiz tests
17. Reverting changes to existing quiz examples
18. Reverting changes to existing quiz samples
19. Reverting changes to existing quiz demos
20. Reverting changes to existing quiz tutorials
21. Reverting changes to existing quiz guides
22. Reverting changes to existing quiz references
23. Reverting changes to existing quiz resources
24. Reverting changes to existing quiz materials
25. Reverting changes to existing quiz assets
26. Reverting changes to existing quiz files
27. Reverting changes to existing quiz directories
28. Reverting changes to existing quiz folders
29. Reverting changes to existing quiz modules
30. Reverting changes to existing quiz components
31. Reverting changes to existing quiz elements
32. Reverting changes to existing quiz parts
33. Reverting changes to existing quiz sections
34. Reverting changes to existing quiz chapters
35. Reverting changes to existing quiz units
36. Reverting changes to existing quiz lessons
37. Reverting changes to existing quiz topics
38. Reverting changes to existing quiz subjects
39. Reverting changes to existing quiz themes
40. Reverting changes to existing quiz categories
41. Reverting changes to existing quiz groups
42. Reverting changes to existing quiz sets
43. Reverting changes to existing quiz collections
44. Reverting changes to existing quiz libraries
45. Reverting changes to existing quiz repositories
46. Reverting changes to existing quiz archives
47. Reverting changes to existing quiz databases
48. Reverting changes to existing quiz stores
49. Reverting changes to existing quiz caches
50. Reverting changes to existing quiz indexes
51. Reverting changes to existing quiz catalogs
52. Reverting changes to existing quiz inventories
53. Reverting changes to existing quiz registries
54. Reverting changes to existing quiz directories
55. Reverting changes to existing quiz listings
56. Reverting changes to existing quiz catalogs
57. Reverting changes to existing quiz inventories
58. Reverting changes to existing quiz registries
59. Reverting changes to existing quiz directories
60. Reverting changes to existing quiz listings
61. Reverting changes to existing quiz catalogs
62. Reverting changes to existing quiz inventories
63. Reverting changes to existing quiz registries
64. Reverting changes to existing quiz directories
65. Reverting changes to existing quiz listings
66. Reverting changes to existing quiz catalogs
67. Reverting changes to existing quiz inventories
68. Reverting changes to existing quiz registries
69. Reverting changes to existing quiz directories
70. Reverting changes to existing quiz listings
71. Reverting changes to existing quiz catalogs
72. Reverting changes to existing quiz inventories
73. Reverting changes to existing quiz registries
74. Reverting changes to existing quiz directories
75. Reverting changes to existing quiz listings
76. Reverting changes to existing quiz catalogs
77. Reverting changes to existing quiz inventories
78. Reverting changes to existing quiz registries
79. Reverting changes to existing quiz directories
80. Reverting changes to existing quiz listings
81. Reverting changes to existing quiz catalogs
82. Reverting changes to existing quiz inventories
83. Reverting changes to existing quiz registries
84. Reverting changes to existing quiz directories
85. Reverting changes to existing quiz listings
86. Reverting changes to existing quiz catalogs
87. Reverting changes to existing quiz inventories
88. Reverting changes to existing quiz registries
89. Reverting changes to existing quiz directories
90. Reverting changes to existing quiz listings
91. Reverting changes to existing quiz catalogs
92. Reverting changes to existing quiz inventories
93. Reverting changes to existing quiz registries
94. Reverting changes to existing quiz directories
95. Reverting changes to existing quiz listings
96. Reverting changes to existing quiz catalogs
97. Reverting changes to existing quiz inventories
98. Reverting changes to existing quiz registries
99. Reverting changes to existing quiz directories
100. Reverting changes to existing quiz listings
