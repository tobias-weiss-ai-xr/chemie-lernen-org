# PROJECT KNOWLEDGE BASE - Testing Infrastructure

**Generated:** 2026-01-07 23:44:10
**Commit:** $(git rev-parse --short HEAD)
**Branch:** $(git rev-parse --abbrev-ref HEAD)

## OVERVIEW

Comprehensive testing infrastructure for the chemistry learning platform including accessibility, performance, security, and functionality tests. Uses Jest for unit tests and Playwright for E2E testing.

## STRUCTURE

```
tests/
├── test-verbrennungsrechner.spec.js  # Combustion calculator tests
├── chemistry-utils.test.js          # Chemistry utility tests
├── visualization.test.js           # Visualization tests
├── analytics-manager.test.js       # Analytics tests
├── practice-generators.test.js     # Practice generator tests
├── test-language-switcher.spec.js   # Language switcher tests
├── test-quiz-system.spec.js        # Quiz system tests
├── test-titrations-simulator.spec.js # Titrations simulator tests
├── test-molecule-studio-visual.spec.js # Molecule studio tests
├── advanced-calculators.test.js    # Advanced calculator tests
├── test-gasgesetz-rechner.spec.js   # Gas law calculator tests
├── security-utils.test.js          # Security tests
├── complete-site-audit.test.js      # Full site audit
├── ph-rechner.test.js              # pH calculator tests
├── test-calculators.test.js        # Calculator tests
├── test-formula-rendering.spec.js   # Formula rendering tests
├── test-progress-tracker.spec.js   # Progress tracker tests
├── konzentrationsumrechner.test.js # Concentration calculator tests
├── interactive-experiments.test.js # Interactive experiments tests
└── playwright.config.js           # Playwright configuration
```

## WHERE TO LOOK

| Task                    | Location                | Notes                      |
| ----------------------- | ----------------------- | -------------------------- |
| **Calculator tests**    | \*.test.js              | Unit tests for calculators |
| **E2E tests**           | \*.spec.js              | End-to-end browser tests   |
| **Accessibility tests** | accessibility/          | A11y validation            |
| **Performance tests**   | performance/            | Performance benchmarking   |
| **Security tests**      | security/               | Security validation        |
| **SEO tests**           | seo/                    | Search engine optimization |
| **Layout tests**        | layout/                 | Layout validation          |
| **HTML validation**     | html-validation-test.js | HTML structure tests       |

## CONVENTIONS

- **Test organization**: Separate files for different functionality
- **Naming convention**: `test-*.spec.js` for E2E, `*.test.js` for unit
- **Coverage targets**: 70% minimum coverage
- **Error handling**: Comprehensive error case testing
- **Performance testing**: Bundle size and load time

## ANTI-PATTERNS

- Never skip edge case testing
- Avoid flaky tests (use proper waits)
- Never hard-code test data
- Avoid testing implementation details
- Never skip accessibility testing

## UNIQUE STYLES

- **Comprehensive coverage**: 255+ tests across browsers
- **Performance budgeting**: Bundle size optimization
- **Accessibility testing**: A11y validation
- **Security testing**: XSS and injection prevention
- **Mobile testing**: Responsive design validation

## COMMANDS

```bash
# Run all tests
npm test

# Run JavaScript unit tests
npm run test:js

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:contrast    # Accessibility
npm run test:performance # Performance
npm run test:security    # Security
npm run test:seo        # SEO
```

## NOTES

- Tests use Jest for unit testing and Playwright for E2E
- Coverage targets: 70% branches, functions, lines, statements
- Tests run in CI/CD on every push
- Performance tests include bundle size analysis
- Accessibility tests use Pa11y for validation
