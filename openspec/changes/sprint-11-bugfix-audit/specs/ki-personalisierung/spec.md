## ADDED Requirements

### Requirement: User can set and retrieve learning profile

The system SHALL allow authenticated users to set their learning preferences and retrieve their profile with inferred weak areas.

#### Scenario: PUT learning profile saves preferences

- **WHEN** an authenticated user sends `PUT /api/auth/profile` with `{learning_level: "advanced", interests: ["Organische Chemie"], preferred_explanation_style: "visual"}`
- **THEN** the profile is persisted and subsequent `GET /api/auth/profile` returns the saved values

#### Scenario: GET profile returns inferred weak areas

- **WHEN** an authenticated user sends `GET /api/auth/profile`
- **THEN** the response includes `weak_areas` inferred from quiz results and chat topics

### Requirement: User can browse chat history

The system SHALL persist chat sessions and allow users to browse past conversations.

#### Scenario: List past sessions

- **WHEN** an authenticated user sends `GET /api/chat/history`
- **THEN** the response lists past sessions with `date`, `topic_summary` (auto-generated from first user message), and `message_count`

#### Scenario: Retrieve full conversation

- **WHEN** an authenticated user sends `GET /api/chat/history/:sessionId`
- **THEN** the response contains the full message array for that session

#### Scenario: Session retention respects plan tier

- **WHEN** a free-tier user has sessions older than 90 days
- **THEN** those sessions are not returned in history

- **WHEN** a premium user has sessions older than 1 year
- **THEN** those sessions are not returned in history

### Requirement: Assistant responses adapt to user level

The system SHALL modify the assistant's system prompt to include the user's learning level and weak areas.

#### Scenario: Beginner user gets simpler explanations

- **WHEN** a user with `learning_level: "beginner"` sends a chat message
- **THEN** the system prompt includes instructions to use simpler language and more examples

#### Scenario: RAG results are boosted by user interests

- **WHEN** a user whose interests include "Organische Chemie" sends a chemistry question
- **THEN** RAG results matching organic chemistry topics are weighted higher in the final context

### Requirement: User can rate assistant responses

The system SHALL allow users to provide feedback on individual assistant messages.

#### Scenario: Thumb up/down on a response

- **WHEN** a user clicks "thumbs up" or "thumbs down" on an assistant message
- **THEN** `POST /api/chat/feedback` stores the rating with the message ID

#### Scenario: "War das hilfreich?" prompt after 3 exchanges

- **WHEN** there have been 3 or more exchanges in a chat session
- **THEN** the assistant appends a "War das hilfreich?" prompt after its response
