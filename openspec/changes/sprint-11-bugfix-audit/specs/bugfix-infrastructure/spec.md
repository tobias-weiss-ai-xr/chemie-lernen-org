## ADDED Requirements

### Requirement: Traefik routing covers all API path prefixes

The system SHALL route all chemie-chat-api path prefixes through Traefik's `chat` router so requests reach the correct backend container.

#### Scenario: Auth API requests reach chemie-chat-api

- **WHEN** a browser sends `GET /api/auth/me` with valid credentials
- **THEN** the request reaches `chemie-chat-api:3001` and returns the user profile

#### Scenario: Quiz API requests reach chemie-chat-api

- **WHEN** a browser sends `GET /api/quizzes/Allgemeine Chemie`
- **THEN** the request reaches `chemie-chat-api:3001` and returns quiz questions

#### Scenario: Quiz-results API requests reach chemie-chat-api

- **WHEN** a client sends `PUT /api/quiz-results` with a valid body
- **THEN** the request reaches `chemie-chat-api:3001` and persists the result

#### Scenario: Studienvergleich API requests reach chemie-chat-api

- **WHEN** a client sends `GET /api/studienvergleich/compare?u1=X&u2=Y`
- **THEN** the request reaches `chemie-chat-api:3001` and returns comparison data

### Requirement: Quiz API returns questions without 503

The system SHALL serve quiz questions from `GET /api/quizzes/:topic` without relying on a file that only exists in the hugo build context.

#### Scenario: GET /api/quizzes/alle returns 30 questions

- **WHEN** a client sends `GET /api/quizzes/alle`
- **THEN** the response is `200` with a JSON body containing `total: 30` and `questions` array

#### Scenario: GET /api/quizzes with valid topic returns filtered questions

- **WHEN** a client sends `GET /api/quizzes/Allgemeine Chemie`
- **THEN** the response is `200` with questions filtered to topic `Allgemeine Chemie`

#### Scenario: GET /api/quizzes with unknown topic returns 404

- **WHEN** a client sends `GET /api/quizzes/NonExistent`
- **THEN** the response is `404` with an error message

### Requirement: Quiz questions file is available at runtime in the chat-api container

The quiz question data SHALL be readable by the chat-api server without relying on files in the hugo build tree.

#### Scenario: Questions exist in a known path in the api container

- **WHEN** the chat-api server starts
- **THEN** quiz question data is readable from a path under `/app/`

#### Scenario: Data format is parseable without VM

- **WHEN** the server loads quiz question data
- **THEN** it parses as plain JSON without requiring `vm.runInNewContext`

### Requirement: Auth frontend can reach backend

The login, register, and account pages SHALL successfully call their respective API endpoints.

#### Scenario: Login form submits to API

- **WHEN** a user submits the login form on `/login/`
- **THEN** the `POST /api/auth/login` request reaches `chemie-chat-api` and returns a JWT

#### Scenario: Premium upgrade works end-to-end

- **WHEN** a logged-in user clicks "Premium werden"
- **THEN** `POST /api/auth/create-checkout-session` reaches `chemie-chat-api` and redirects to Stripe
