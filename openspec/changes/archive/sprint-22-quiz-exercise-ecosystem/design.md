## Quiz & Exercise Ecosystem Architecture

### FSRS Spaced Repetition

```
User answers quiz/exercise → score (0-1)
    → FSRS algorithm computes next interval
    → Card stored in auth-db users.json:
        {
          cardId: "uuid",
          topicId: "redoxreaktionen",
          question: "...",
          answer: "...",
          interval: 3,        // days
          ease: 2.5,
          dueDate: "2026-07-13",
          lapses: 0,
          lastReview: "2026-07-10"
        }
    → Review queue: cards with dueDate <= today, sorted by ease ascending
```

### Per-Topic Quiz Content

Each themenbereich/klassenstufe gets a `quizzes/` content file with YAML frontmatter:

```yaml
---
title: 'Redoxreaktionen Quiz'
topic: 'redoxreaktionen'
target: 'themenbereiche'
difficulty: 'mixed'
questions:
  - id: 'rr-001'
    type: 'multiple-choice' # | short-answer | true-false
    question: 'Was ist die Oxidationszahl von Sauerstoff in H₂O?'
    options: ['0', '-II', '+II', '-I']
    correctAnswer: '-II'
    explanation: 'Sauerstoff hat in den meisten Verbindungen die Oxidationszahl -II.'
  - id: 'rr-002'
    type: 'short-answer'
    question: 'Nenne das Reduktionsmittel in der Reaktion: Zn + CuSO₄ → ZnSO₄ + Cu'
    referenceAnswer: 'Zink (Zn)'
    gradingHint: 'Look for the element that gets oxidized'
```

### Exercise Difficulty Scaling

| Parameter           | Leicht            | Mittel        | Schwer               |
| ------------------- | ----------------- | ------------- | -------------------- |
| Question depth      | Definition recall | Apply concept | Multi-step synthesis |
| Distractors         | 2 obvious wrong   | 3 plausible   | 4 all plausible      |
| Hints provided      | 2 built-in        | 1 built-in    | No built-in          |
| Context             | Single concept    | 2-3 related   | Cross-topic          |
| FSRS interval floor | 7 days            | 3 days        | 1 day                |

### Auto-Grading Flow (Short Answer)

```
POST /api/exercises/grade { question, referenceAnswer, studentAnswer, topic }
  → LiteLLM prompt: "Compare the student's answer to the reference answer for
     this chemistry question. Topic: {topic}. Score 0-100. Explain your reasoning."
  → Response: { score: 85, feedback: "Good, but missing the electron transfer..." }
  → Score recorded in auth-db; learning profile updated
```

### Endpoint Summary

| Method | Route                        | Purpose                                      |
| ------ | ---------------------------- | -------------------------------------------- |
| `GET`  | `/api/quiz/:topicId`         | Fetch quiz questions for a topic             |
| `POST` | `/api/quiz/:topicId/submit`  | Submit quiz answers, get score + FSRS update |
| `GET`  | `/api/exercises/history`     | Exercise attempt history + accuracy trends   |
| `POST` | `/api/exercises/grade`       | Auto-grade short answer via LiteLLM          |
| `GET`  | `/api/fsrs/cards`            | Due cards for current user (review queue)    |
| `POST` | `/api/fsrs/cards/:id/review` | Submit card review score, get next interval  |
| `GET`  | `/api/quiz/topics`           | All topics with quiz availability            |
