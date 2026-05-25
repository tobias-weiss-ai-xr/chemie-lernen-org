# Stoichiometry Calculator Refactoring

**Date:** 2026-05-21
**Status:** Design approved, awaiting implementation plan

## Goal

Split the overloaded stoichiometry calculator page into four focused pages and extract the 1860-line `stoichiometry-calculator-page.js` into per-module files.

## Page Structure

| Route | Template | Purpose |
|---|---|---|
| `/stoechiometrie-rechner/` | `stoechiometrie-rechner.html` | 6 calculator tabs only |
| `/stoechiometrie-rechner/werkzeuge/` | `stoechiometrie-werkzeuge.html` | Equation parser, element lookup, history |
| `/stoechiometrie-rechner/uebungen/` | `stoechiometrie-uebungen.html` | Practice quiz with scoring |
| `/stoechiometrie-rechner/tutorien/` | `stoechiometrie-tutorien.html` | 5-step tutorials with progress locking |

## JS Module Split

All files go in `myhugoapp/static/js/calculators/`.

### Calculator Modules (retain existing UI)

- `calc-molmol.js` — `calcMolMol()`, `toggleMolMolExplanation()`, `exportMolMolToPDF()`
- `calc-massmass.js` — `calcMassMass()`, `toggleMassMassExplanation()`, `exportMassMassToPDF()`
- `calc-limiting.js` — `calcLimiting()`, `toggleLimitingExplanation()`, `exportLimitingToPDF()`
- `calc-yield.js` — `calcYield()`, `toggleYieldExplanation()`, `exportYieldToPDF()`
- `calc-multistep.js` — `addReactionStep()`, `removeStep()`, `calculateMultiStep()`, `exportMultiStepToPDF()`, etc.
- `calc-gaslaw.js` — `calculateGasLaw()`, `loadSTP()`, `loadSATP()`, `exportGasToPDF()`, etc.

### Shared Modules (loaded by multiple pages)

- `calc-presets.js` — `presets` and `massPresets` data objects, `loadPreset()`, `loadMassPreset()`
- `calc-equation-parser.js` — `parseEquation()`, `parseChemicalEquation()`, `parseSide()`, `parseCompound()`, `displayParsedCoefficients()`, `applyCoefficientsToMolMol()`, `applyCoefficientsToMassMass()`
- `calc-element-lookup.js` — `elementDatabase`, `applyMolarMass()`, `showElementInfo()`, `applyMolarMassToCalculator()`
- `calc-history.js` — `saveToHistory()`, `loadHistory()`, `displayHistory()`, `toggleHistory()`, `clearHistory()`, `updateHistoryCount()`, `checkForBalancedEquation()`
- `practice-generators.js` — (existing, unchanged) `generateMolMolProblem()`, `generateMassMassProblem()`, `generateLimitingProblem()`, `generateYieldProblem()`, `checkAnswerTolerance()`

### Practice Quiz Module (uebungen page only)

- `practice-quiz.js` — `practiceState`, `startPractice()`, `generateProblem()`, `generateMolMolProblem()`, `generateMassMassProblem()`, `generateLimitingProblem()`, `generateYieldProblem()`, `checkAnswer()`, `showFeedback()`, `problemDetailHTML()`, `updateScore()`, `skipProblem()`, `resetPractice()`

Note: The local `generateXXXProblem()` functions in practice-quiz.js (lines 1912-2136 of original) duplicate the problem generators in `practice-generators.js` with different UI (inline HTML). The local versions must stay because they render problem-specific HTML.

### Tutorial Module (tutorien page only)

- `tutorials.js` — `tutorialState`, `tutorials` (full content data), `startTutorial()`, `nextStep()`, `previousStep()`, `closeTutorial()`, `initializeTutorials()`, `renderStep()`

### Progress Tracking (already extracted)

- `progress-tracker.js` — (existing, referenced by the original page but already separate)

## New Templates

### `stoechiometrie-rechner.html` (reuse existing template)

Remove from existing 1107-line HTML:
- Lines 20-46: Equation Parser section
- Lines 48-115: Periodic Table / Molar Mass Lookup  
- Lines 117-196: Practice Mode Section
- Lines 198-326: Interactive Tutorials
- Lines 328-479: Student Progress Tracking
- Lines 481-503: Calculation History

Keep:
- Lines 505-994: Calculator Tabs (unchanged)
- Preset buttons within each calculator tab (they stay with the calculator)
- jsPDF library import
- LazyLoader init for stoichiometry calculators

### `stoechiometrie-werkzeuge.html` (new)

Contains:
- Equation Parser (moved from lines 20-46 with improved styling)
- Element Selector Molar Mass Lookup (moved from lines 48-115)
- Calculation History (moved from lines 481-503)
- Preset reaction reference library

### `stoechiometrie-uebungen.html` (new)

Contains:
- Practice Mode (moved from lines 117-196)
- Score display, problem generation, answer checking
- Difficulty and problem type selection

### `stoechiometrie-tutorien.html` (new)

Contains:
- Tutorial Selection Grid (moved from lines 198-326)
- Tutorial Content Viewer
- Progress indicator

## Content Files to Create

`myhugoapp/content/stoichiometrie/`
- `werkzeuge.md`
- `uebungen.md`
- `tutorien.md`

## CI / Testing

- All unit tests should still pass (calculator functions remain unchanged)
- No new test files needed at this stage
- No visual/UI changes — only code organization changes
