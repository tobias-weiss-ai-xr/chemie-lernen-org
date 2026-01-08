# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-07 23:44:10
**Commit:** $(git rev-parse --short HEAD)
**Branch:** $(git rev-parse --abbrev-ref HEAD)

## OVERVIEW

chemie-lernen.org is a Hugo-based static site generator for interactive chemistry learning with JavaScript calculators, 3D visualizations, and VR experiences. The platform features 12 subject areas, interactive tools (pH calculator, molar mass calculator, periodic table), and immersive VR laboratories.

## STRUCTURE

```
.
├── myhugoapp/                 # Hugo site source
│   ├── content/               # Markdown content
│   ├── static/                # Static assets (js, css, images)
│   ├── layouts/               # Hugo templates
│   └── config.toml            # Hugo configuration
├── tests/                     # Playwright and unit tests
│   ├── test-*.spec.js        # Test files
│   └── playwright.config.js   # Playwright config
├── docs/                      # Documentation
├── .github/workflows/         # CI/CD workflows
├── scripts/                   # Build and optimization scripts
└── public/                    # Generated site output
```

## WHERE TO LOOK

| Task                        | Location                    | Notes                               |
| --------------------------- | --------------------------- | ----------------------------------- |
| **Main site content**       | myhugoapp/content/          | Markdown files for 12 subject areas |
| **Interactive calculators** | myhugoapp/static/js/        | Core JavaScript functionality       |
| **VR experiences**          | myhugoapp/static/pse-in-vr/ | Three.js and VR implementations     |
| **Tests**                   | tests/                      | Playwright and unit tests           |
| **Build scripts**           | scripts/                    | Minification and optimization       |
| **CI/CD**                   | .github/workflows/          | GitHub Actions                      |

## CODE MAP

| Symbol             | Type       | Location     | Refs | Role                    |
| ------------------ | ---------- | ------------ | ---- | ----------------------- |
| `hugo server`      | Command    | package.json | -    | Local development       |
| `npm test`         | Command    | package.json | -    | Test execution          |
| `@playwright/test` | Dependency | package.json | -    | E2E testing             |
| `terser`           | Dependency | package.json | -    | JavaScript minification |

## CONVENTIONS

- **Hugo**: Extended version with KaTeX for formula rendering
- **JavaScript**: Vanilla JS with jQuery, modular structure
- **Testing**: Jest for unit tests, Playwright for E2E
- **Build**: Hugo with minification, Docker support
- **Styling**: Bootstrap 3.3.7 + custom CSS, dark mode support

## ANTI-PATTERNS (THIS PROJECT)

- Avoid direct DOM manipulation in favor of event-driven architecture
- Never skip accessibility testing (contrast, keyboard navigation)
- Always run performance tests before production deployment
- Never commit unoptimized JavaScript to production
- Avoid hard-coded URLs; use Hugo's baseURL configuration

## UNIQUE STYLES

- **Dark mode**: Automatic and manual toggle support
- **Green color scheme**: Consistent branding throughout
- **3D visualizations**: Three.js for molecular and periodic table views
- **VR integration**: Mozilla Hubs compatibility
- **Responsive design**: Mobile-first approach

## COMMANDS

```bash
# Local development
cd myhugoapp && hugo server -D

# Run all tests
npm test

# Run specific test categories
npm run test:js      # JavaScript unit tests
npm run test:e2e     # Playwright E2E tests
npm run test:coverage  # Test coverage report

# Build optimized site
npm run build:optimized

# Minify calculators
npm run minify

# Performance analysis
npm run analyze:bundle
```

## NOTES

- The site uses Hugo's extended version for advanced features
- JavaScript calculators are optimized separately and loaded lazily
- VR experiences use Three.js with custom systems
- Tests cover accessibility, performance, security, and functionality
- CI/CD runs 255 tests across 3 browsers with 100% pass rate
