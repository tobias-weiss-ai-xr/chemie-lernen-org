# PROJECT KNOWLEDGE BASE - JavaScript Calculators

**Generated:** 2026-01-07 23:44:10
**Commit:** $(git rev-parse --short HEAD)
**Branch:** $(git rev-parse --abbrev-ref HEAD)

## OVERVIEW

Interactive JavaScript calculators for chemistry education including stoichiometry, pH calculation, molar mass, and other chemical computations. These calculators are optimized for performance and loaded lazily.

## STRUCTURE

```
myhugoapp/static/js/
├── calculators/          # Core calculator implementations
│   ├── stoichiometry.js  # Stoichiometry calculations
│   ├── practice-generators.js  # Practice problem generators
│   └── lazy-loader.js   # Lazy loading system
├── interactive-experiments.js  # Interactive chemistry experiments
├── molekuel-studio.js   # 3D molecule visualization
├── ph-rechner.js        # pH calculator
├── molare-masse-rechner.js  # Molar mass calculator
├── quiz-user-system.js  # Quiz system
└── progress-tracker.js  # Learning progress tracking
```

## WHERE TO LOOK

| Task                            | Location                           | Notes                         |
| ------------------------------- | ---------------------------------- | ----------------------------- |
| **Stoichiometry calculations**  | calculators/stoichiometry.js       | Core stoichiometry functions  |
| **Practice problem generation** | calculators/practice-generators.js | Random problem generators     |
| **Lazy loading**                | lazy-loader.js                     | Performance optimization      |
| **pH calculations**             | ph-rechner.js                      | Acid-base calculations        |
| **Molar mass**                  | molare-masse-rechner.js            | Molecular weight calculations |
| **3D visualization**            | molekuel-studio.js                 | Three.js molecule viewer      |
| **Quiz system**                 | quiz-user-system.js                | User quiz functionality       |
| **Progress tracking**           | progress-tracker.js                | Learning analytics            |

## CONVENTIONS

- **Modular design**: Each calculator is a separate module
- **Lazy loading**: Calculators load on demand for performance
- **Optimized for web**: Minified versions for production
- **Accessibility**: Keyboard navigation and ARIA support
- **Responsive**: Mobile-first design approach

## ANTI-PATTERNS

- Avoid global namespace pollution
- Never skip input validation
- Always handle edge cases (zero, negative values)
- Never hard-code chemical constants
- Avoid synchronous operations in UI

## UNIQUE STYLES

- **Mathematical precision**: High-precision calculations
- **Interactive visualizations**: Real-time result updates
- **Educational feedback**: Step-by-step explanations
- **Performance optimization**: Code splitting and minification
- **Accessibility**: Screen reader support

## COMMANDS

```bash
# Minify calculators
npm run minify

# Run calculator tests
npm run test:js

# Check code coverage
npm run test:coverage
```

## NOTES

- Calculators use custom mathematical functions
- Practice generators create reproducible problems
- Lazy loader manages on-demand loading
- All calculators are tested for accuracy
- Production builds include optimized versions
