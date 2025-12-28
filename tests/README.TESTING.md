# Visual Testing with Playwright

This directory contains automated visual tests for the Chemie Lernen website using Playwright.

## Quick Start

### Run Screenshot Tests

The easiest way to take screenshots of all pages:

```bash
# Using Docker
./run-visual-tests.sh

# Or with npx directly
npx playwright test screenshots.spec.js

# Or run all tests
npx playwright test
```

## Test Files

- `test-green-colors.spec.js` - Green color consistency tests across all pages
- `test-molecule-studio-visual.spec.js` - Comprehensive visual tests for Molekülstudio and Periodensystem
- `screenshots.spec.js` - Simple screenshot tests for all main pages

## Docker Setup

Build and run the Playwright Docker container:

```bash
# Build the image
docker build -f Dockerfile.playwright -t chemie-lernen-playwright .

# Run tests
docker run --rm -v $(pwd)/test-results:/app/test/results chemie-lernen-playwright

# Run specific test
docker run --rm -v $(pwd)/test-results:/app/test/results chemie-lernen-playwright test screenshots.spec.js
```

## Screenshots

Screenshots are saved to:
- `test-results/` - Full test reports with screenshots
- `screenshots/` - Individual screenshot files

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run visual tests
  run: |
    docker build -f Dockerfile.playwright -t chemie-lernen-playwright .
    docker run --rm -v $(pwd)/test-results:/app/test-results chemie-lernen-playwright
```

## Environment Variables

- `BASE_URL` - Base URL for testing (default: https://chemie-lernen.org)
- `SCREENSHOT_DIR` - Directory for screenshots (default: screenshots)

## Debugging

Run tests in debug mode:

```bash
npx playwright test --debug
npx playwright test --headed
```
