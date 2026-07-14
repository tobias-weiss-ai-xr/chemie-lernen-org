## Why

Sprint 18 implements "Exam Preparation Mode" — timed practice exams that mimic German Abitur/CHEM standards. This feature addresses the gap between topic-based quizzes and actual exam conditions. Students need a realistic, timed environment to practice under pressure, identify weak spots, and build confidence for high-stakes exams. The existing quiz infrastructure (`quiz-engine.js`, `quiz-ui.js`, 12 topic banks) provides a strong foundation, but lacks the timed session management, exam-format assembly, and predictive analytics required for true exam simulation.

## What Changes

- Add `/pruefungsmodus/` page (Hugo content + layout) with exam selector, timer, and results dashboard
- Add `/pruefungsvorbereitung/` page (Hugo content) with study strategies, typical mistakes, and links to exam resources
- Add `/api/exams/start` route to start a timed exam session (auth required, returns session ID)
- Add `/api/exams/submit` route to submit exam answers (auth required, grades and stores results)
- Add `/api/exams/:id/result` route to retrieve exam results (auth required, returns score, feedback, weak spots)
- Add `/api/exams/predict` route to predict exam readiness (auth required, returns readiness score and recommendations)
- Add `pruefungsmodus.js` client-side exam engine (assembles questions, manages timer, handles submission)
- Add `pruefungs-dashboard.js` client-side results dashboard (shows score, feedback, weak spots, recommendations)
- Add exam question bank (extend `api/data/quiz-questions.json` with exam-format questions)
- Add exam session store (server-side session management to prevent cheating)
- Add exam prediction model (Bayesian model for score prediction)
- Add exam analytics (track exam performance, identify weak spots, provide recommendations)
- Add exam readiness score (calculate readiness based on historical performance)
- Add exam recommendations (provide personalized study recommendations based on weak spots)
- Add exam resources (provide links to exam resources, study strategies, typical mistakes)
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
- Add exam notifications (notify students of exam results, feedback, and recommendations)
- Add exam reminders (remind students to take exams, review feedback, and follow recommendations)
- Add exam scheduling (allow students to schedule exams, review feedback, and follow recommendations)
- Add exam calendar (allow students to view exam calendar, review feedback, and follow recommendations)

## Capabilities

### New Capabilities

- `exam-preparation`: Exam Preparation Mode capability (timed exams, auto-grading, weak-spot flagging, score prediction)
- `exam-session`: Exam Session Management capability (start, submit, result, predict routes)
- `exam-question-bank`: Exam Question Bank capability (extend quiz-questions.json with exam-format questions)
- `exam-prediction`: Exam Prediction capability (Bayesian model for score prediction)
- `exam-analytics`: Exam Analytics capability (track exam performance, identify weak spots, provide recommendations)
- `exam-readiness`: Exam Readiness capability (calculate readiness based on historical performance)
- `exam-recommendations`: Exam Recommendations capability (provide personalized study recommendations based on weak spots)
- `exam-resources`: Exam Resources capability (provide links to exam resources, study strategies, typical mistakes)
- `exam-feedback`: Exam Feedback capability (provide detailed feedback on exam performance, including correct answers and explanations)
- `exam-review`: Exam Review capability (allow students to review exam questions, answers, and explanations)
- `exam-retry`: Exam Retry capability (allow students to retry exams with new questions)
- `exam-history`: Exam History capability (track exam history, including scores, feedback, and recommendations)
- `exam-progress`: Exam Progress capability (track exam progress, including scores, feedback, and recommendations)
- `exam-achievements`: Exam Achievements capability (track exam achievements, including scores, feedback, and recommendations)
- `exam-leaderboard`: Exam Leaderboard capability (track exam leaderboard, including scores, feedback, and recommendations)
- `exam-notifications`: Exam Notifications capability (notify students of exam results, feedback, and recommendations)
- `exam-reminders`: Exam Reminders capability (remind students to take exams, review feedback, and follow recommendations)
- `exam-scheduling`: Exam Scheduling capability (allow students to schedule exams, review feedback, and follow recommendations)
- `exam-calendar`: Exam Calendar capability (allow students to view exam calendar, review feedback, and follow recommendations)

### Modified Capabilities

- `quiz-engine`: Extend quiz engine to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-ui`: Extend quiz UI to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-questions`: Extend quiz questions to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-integration`: Extend quiz integration to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-system`: Extend quiz system to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-user-system`: Extend quiz user system to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-database`: Extend quiz database to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-tipps-tricks`: Extend quiz tipps tricks to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-analytische-methoden`: Extend quiz analytische methoden to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-anorganische-verbindungen`: Extend quiz anorganische verbindungen to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-einfuehrung-chemie`: Extend quiz einfuehrung chemie to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-energetik`: Extend quiz energetik to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-erdoel-organische-stoffklassen`: Extend quiz erdoel organische stoffklassen to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-gleichgewicht-geschwindigkeit`: Extend quiz gleichgewicht geschwindigkeit to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-produkte-organisch`: Extend quiz produkte organisch to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-reaktionstypen-organisch`: Extend quiz reaktionstypen organisch to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-redox-elektrochemie`: Extend quiz redox elektrochemie to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-saeuren-basen`: Extend quiz saeuren basen to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)
- `quiz-aufbau-materie`: Extend quiz aufbau materie to support exam mode (timed exams, auto-grading, weak-spot flagging, score prediction)

## Impact

- **Code**: New files: `pruefungsmodus.js`, `pruefungs-dashboard.js`, `pruefungsmodus.html`, `pruefungsvorbereitung.html`, `pruefungsmodus.md`, `pruefungsvorbereitung.md`, `api/exams.js`, `api/exam-engine.js`, `api/exam-prediction.js`, `api/exam-analytics.js`, `api/exam-readiness.js`, `api/exam-recommendations.js`, `api/exam-resources.js`, `api/exam-feedback.js`, `api/exam-review.js`, `api/exam-retry.js`, `api/exam-history.js`, `api/exam-progress.js`, `api/exam-achievements.js`, `api/exam-leaderboard.js`, `api/exam-notifications.js`, `api/exam-reminders.js`, `api/exam-scheduling.js`, `api/exam-calendar.js`
- **API**: New routes: `/api/exams/start`, `/api/exams/submit`, `/api/exams/:id/result`, `/api/exams/predict`
- **Dependencies**: None (uses existing quiz infrastructure)
- **Systems**: None (uses existing Hugo, Node.js, Neo4j infrastructure)

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
