# Tasks — learning-research-gaps

## 1. Fix learning-paths.js Neo4j queries (FULFILLS + Schema A/B)

- [ ] Replace `-[:COVERS]->` with `-[:FULFILLS]->` in all 3 queries
- [ ] Combine Schema A (Curriculum→HAS_SUBTOPIC→SubTopic→FULFILLS→LO) and Schema B (Curriculum→HAS_TOPIC→Topic→HAS_SUBTOPIC→SubTopic→FULFILLS→LO) via OPTIONAL MATCH
- [ ] Deduplicate objectives across paths (same LO reachable via both schemas)
- [ ] Update tests for learning-paths

## 2. PREREQUISITE relationships in Neo4j

- [ ] Create scripts/create-prerequisites.mjs
- [ ] Map curriculum ordering → PREREQUISITE between LearningObjectives
- [ ] Run against chemie-kg (bolt://chemie-kg:7687)
- [ ] Verify count in Neo4j

## 3. Adaptive difficulty recommendations

- [ ] GET /api/adaptive/recommendations endpoint (per-topic, based on quiz history)
- [ ] Target 70-80% success rate logic
- [ ] quiz.html displays recommendation, sets default difficulty
- [ ] Tests

## 4. Cognitive-load session chunking

- [ ] lernpfad.js: group steps into ~5-7 min sessions
- [ ] Show session plan with pause reminders
- [ ] lernpfade.html UI updates

## 5. Quiz challenges in collaboration

- [ ] collab-engine.js: postQuizChallenge function
- [ ] collab.js routes: POST /api/collab/sessions/:id/quiz-challenge
- [ ] kollaboration.html: UI for challenge + display
- [ ] Tests

## 6. Verify & deploy

- [ ] npm test green
- [ ] Push, CI green
- [ ] Update SPECS_INDEX.md
- [ ] Memory store
