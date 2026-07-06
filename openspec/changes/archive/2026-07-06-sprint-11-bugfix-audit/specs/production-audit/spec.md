## ADDED Requirements

### Requirement: Security audit covers OWASP Top 10

The system SHALL undergo a security audit covering the OWASP Top 10 categories relevant to the tech stack (Express.js REST API, JWT auth, Neo4j).

#### Scenario: All API endpoints are tested for common vulnerabilities

- **WHEN** the security audit runs
- **THEN** each API endpoint is tested for injection, broken auth, XSS, and rate-limit bypass
- **THEN** all findings ≥ medium severity are remediated or documented as accepted risk

#### Scenario: Dependency vulnerabilities are scanned

- **WHEN** `npm audit` or `grype` runs against the project
- **THEN** no vulnerabilities ≥ medium severity remain unfixed

#### Scenario: Secrets are scanned in git history

- **WHEN** `truffleHog` or similar scans the repository
- **THEN** no committed secrets (API keys, passwords, tokens) are found

### Requirement: Performance meets Lighthouse 95+ target

The system SHALL achieve Lighthouse scores of 95+ in all categories (Performance, Accessibility, Best Practices, SEO).

#### Scenario: Lighthouse audit passes all categories

- **WHEN** Lighthouse runs against the production URL
- **THEN** all scores are ≥ 95

#### Scenario: Bundle size is under 50kB gzipped

- **WHEN** the total transmitted JS is measured
- **THEN** it is < 50 kB gzipped

#### Scenario: Top 3 performance bottlenecks are fixed

- **WHEN** a Lighthouse or WebPageTest audit identifies bottlenecks
- **THEN** the top 3 by estimated impact are remediated

### Requirement: API latency is profiled

The system SHALL measure p50/p95/p99 latency for the top 10 most-used API endpoints.

#### Scenario: Latency data is collected

- **WHEN** the profiling tool runs against production
- **THEN** p50/p95/p99 latency is reported for each of the top 10 endpoints

#### Scenario: Slow queries are analyzed

- **WHEN** a Cypher query takes > 500ms
- **THEN** it is logged with an EXPLAIN plan for optimization

### Requirement: Architecture and API documentation is complete

The system SHALL have comprehensive documentation covering architecture, API, deployment, and security.

#### Scenario: ARCHITECTURE.md exists

- **WHEN** a developer reads `docs/ARCHITECTURE.md`
- **THEN** they find system architecture with Mermaid diagrams, data flows, and component descriptions

#### Scenario: API.md documents all routes

- **WHEN** a developer reads `docs/API.md`
- **THEN** every API route has a documented request/response example

#### Scenario: DEPLOYMENT.md covers setup

- **WHEN** a developer reads `docs/DEPLOYMENT.md`
- **THEN** they find Docker setup, environment variables, and backup/restore procedures

#### Scenario: SECURITY.md describes auth model

- **WHEN** a developer reads `docs/SECURITY.md`
- **THEN** they find the auth flow, JWT token handling, and responsible disclosure contact

#### Scenario: OpenAPI 3.0 spec exists

- **WHEN** a developer opens `docs/openapi.yaml`
- **THEN** all API routes are described in OpenAPI 3.0 format

### Requirement: Monitoring and alerting are configured

The system SHALL have uptime monitoring, error tracking, and alert rules.

#### Scenario: Health endpoint is monitored

- **WHEN** the uptime monitor (e.g., healthchecks.io) pings `GET /api/health`
- **THEN** a failed check triggers an alert

#### Scenario: Error tracking is active

- **WHEN** an unhandled exception occurs in the API
- **THEN** it is captured by the error tracker (e.g., Sentry)

#### Scenario: Alert rules exist for key metrics

- **WHEN** 5xx rate exceeds 1% or p95 latency exceeds 2s
- **THEN** an alert fires to the operations channel
