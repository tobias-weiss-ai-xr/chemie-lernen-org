# Spec: quiz

**Capability:** Interactive chemistry quiz system for chemie-lernen.org
**Owners:** Sisyphus
**Status:** Active — main spec

---

## Purpose

The quiz system enables German secondary-school students (Klasse 8-13)
to test their chemistry knowledge through interactive quizzes embedded
in topic pages and dedicated practice areas. It supports multiple
question types, three difficulty levels, progress tracking, and
spaced repetition to reinforce learning.

## Requirements

### REQ-QUIZ-1: Quiz engine

`quiz-system.js` is the core quiz engine providing:

- Question rendering from structured data
- Answer validation and scoring
- Difficulty management (leicht/mittel/schwer)
- Feedback display (correct/incorrect with explanations)
- Progress tracking through a quiz session

### REQ-QUIZ-2: Question types

The quiz system supports these question types:

- **Multiple choice** — select one or more correct answers from options
- **Cloze (fill-in-the-blank)** — type the correct term or value
- **Ordering** — arrange items in correct sequence
- **Matching** — pair related items
- **True/false** — evaluate a statement
- **Formula input** — type a chemical formula as answer

### REQ-QUIZ-3: Difficulty levels

Three difficulty levels are supported:

| Level | Label  | Description                                       |
| ----- | ------ | ------------------------------------------------- |
| 1     | Leicht | Basic recall: element symbols, simple definitions |
| 2     | Mittel | Application: calculations, equation balancing     |
| 3     | Schwer | Transfer: multi-step problems, synthesis tasks    |

Difficulty determines question selection, scoring multipliers, and
time limits.

### REQ-QUIZ-4: Quiz data

Quiz questions are stored in structured data files:

- `myhugoapp/static/data/quiz-database.js` — main question bank
- Topic-specific quiz data in `myhugoapp/content/themenbereiche/`
- Each question has: `id`, `type`, `difficulty`, `question`, `options`,
  `correctAnswer`, `explanation`, `topic`

### REQ-QUIZ-5: User progress tracking

Progress is tracked via `quiz-user-system.js` and `progress-tracker.js`:

- Quiz scores stored in localStorage
- Completion status per topic
- Best score tracking with date
- Number of attempts per quiz
- Streak tracking for consecutive correct answers

### REQ-QUIZ-6: Spaced repetition

`spaced-repetition.js` implements the FSRS (Free Spaced Repetition
Scheduler) algorithm:

- Questions answered incorrectly are shown again sooner
- Correct answers increase the interval before the question reappears
- Review scheduling adapts to individual performance
- Algorithm parameters stored in localStorage

### REQ-QUIZ-7: Gamification

`gamification-engine.js` adds engagement mechanics:

- Points awarded for correct answers (base × difficulty multiplier)
- Streak bonuses for consecutive correct answers
- Achievement badges for milestones
- Level progression based on cumulative XP

### REQ-QUIZ-8: Quiz partial template

The quiz is rendered via the `quiz.html` partial:

- Embedded in topic pages and article pages
- `LazyLoader` integration for on-demand loading
- Responsive layout matching the theme
- Keyboard-navigable question options
- Screen-reader-friendly ARIA labels

### REQ-QUIZ-9: Quiz integration

`quiz-integration.js` connects quizzes with the rest of the platform:

- Topic pages show a quiz section linking to relevant questions
- Calculator results can trigger related quiz questions
- Entity pages link to quizzes covering that concept
- Practice generators produce quiz-style questions

### REQ-QUIZ-10: Admin features

Tools for quiz management:

- `practice-generators.js` creates randomized quiz sets from templates
- `aufgabensammlung.js` provides curated problem collections
- Filtering by topic, difficulty, and question type
- Export/print support for worksheets

### REQ-QUIZ-11: Testing

Quiz logic is tested via:

- Jest unit tests in `tests/` directory
- Question rendering tests in jsdom environment
- Scoring calculation tests
- localStorage mock tests for progress tracking
- Spaced repetition algorithm tests

### REQ-QUIZ-12: Accessibility

- All quiz interactions are keyboard-navigable
- Screen readers announce question text, options, and feedback
- Color is never the sole indicator of correct/incorrect
- Time limits can be extended (no hard cutoffs)
- Motion in feedback animations respects `prefers-reduced-motion`

## Scenarios

### S-QUIZ-1: Student completes topic quiz

**Given** a student reading the "Atombau" themenbereich
**When** they scroll to the quiz section
**Then** 5 questions about atomic structure are shown
**When** they answer all questions
**Then** the score (e.g., 4/5) is displayed
**And** each answer shows correct/incorrect with explanation
**And** the score is saved to localStorage
**And** spaced repetition schedules are updated

### S-QUIZ-2: Difficulty progression

**Given** a student scores 80%+ on "Leicht" level quizzes
**When** they start a new quiz in the same topic
**Then** "Mittel" level questions are included by default
**And** "Leicht" questions still appear as warm-up

### S-QUIZ-3: Spaced repetition review

**Given** a student answered "Welches Edelgas hat die Ordnungszahl 10?"
incorrectly 2 days ago
**When** they visit any page about Edelgase
**Then** a pop-quiz notification offers to re-test that question
**And** if answered correctly, the interval doubles

### S-QUIZ-4: Worksheet generation

**Given** a teacher selects "Stöchiometrie" with "Mittel" difficulty
**When** they click "Arbeitsblatt generieren"
**Then** `practice-generators.js` creates 10 unique problems
**And** a printable format is shown with answer key
**And** `aufgabensammlung.js` saves the worksheet to history

### S-QUIZ-5: Cross-platform progress

**Given** a student completes quizzes on mobile and desktop
**When** they return to a previously quizzed topic
**Then** their best score is shown from localStorage
**And** unanswered questions are prioritized
**And** the progress bar shows completion per difficulty level

## References

- `myhugoapp/static/js/quiz-system.js` — core quiz engine
- `myhugoapp/static/js/quiz-user-system.js` — user progress tracking
- `myhugoapp/static/js/quiz-integration.js` — platform integration
- `myhugoapp/static/js/spaced-repetition.js` — FSRS scheduler
- `myhugoapp/static/js/gamification-engine.js` — engagement mechanics
- `myhugoapp/static/js/progress-tracker.js` — progress state management
- `myhugoapp/static/js/practice-generators.js` — random quiz generation
- `myhugoapp/static/js/aufgabensammlung.js` — curated problem sets
- `myhugoapp/static/data/quiz-database.js` — question bank
- `myhugoapp/layouts/partials/quiz.html` — quiz partial template
- `myhugoapp/content/themenbereiche/` — topic content with embedded quizzes
