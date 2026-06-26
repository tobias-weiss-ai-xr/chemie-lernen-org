# Cleanup: Stale Infrastructure, Test Suite, ESLint Warnings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up stale project infrastructure, fix the unreliable test suite, and eliminate all 289 ESLint warnings.

**Architecture:** Three independent workstreams: (A) remove orphaned files/configs, (B) separate production-dependent tests from unit tests, (C) auto-fix + config-adjust ESLint to zero warnings.

**Tech Stack:** ESLint 9 flat config, Jest, Node.js, Hugo, git

---

## File Structure Changes

### Deletions

| File                                           | Reason                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `ci-deploy/` (dir)                             | GitLab CI + Bitbucket configs — project uses self-hosted systemd timer    |
| `playwright.config.js` (root)                  | Exact duplicate of `tests/playwright.config.js`                           |
| `Dockerfile`                                   | Hugo 0.57.0 — unused; `npm run build` uses `hugomods/hugo:exts` (0.154.x) |
| 29× `*.optimized.js` in `myhugoapp/static/js/` | Build artifacts tracked in git                                            |
| `myhugoapp/tests/` (dir)                       | Orphaned custom Node test scripts; root `jest` suite is the active one    |
| `myhugoapp/static/js/AGENTS.md`                | Stale structure listing referencing deleted files                         |

### Modifications

| File                            | Change                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `eslint.config.mjs`             | Add `no-unused-vars: 'off'` override for calculator onclick globals              |
| `package.json` (root)           | Add `test:unit` / `test:integration` scripts                                     |
| `scripts/minify-calculators.js` | Remove comment reference to deleted `stoichiometry-calculator-page.js`           |
| `AGENTS.md` (root)              | Remove stale references to Dockerfile, ci-deploy, two Playwright configs, old CI |
| `.gitignore`                    | Add `*.optimized.js`                                                             |

### Test file reorganization

| Change                                                              | Reason                                            |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| Move 18 production-dependent test/spec files to `tests/production/` | Clear separation: `npm test` runs unit tests only |

---

### Task A1: Delete `ci-deploy/` directory

- [ ] **Step 1: Remove stale CI configs**

```bash
cd /opt/git/hugo-chemie-lernen-org && git rm -r ci-deploy/
```

Expected: `ci-deploy/.gitlab-ci.yml` and `ci-deploy/bitbucket-pipelines.yml` staged for deletion.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove stale GitLab CI and Bitbucket deploy configs"
```

---

### Task A2: Delete duplicate root `playwright.config.js`

- [ ] **Step 1: Delete root duplicate**

```bash
cd /opt/git/hugo-chemie-lernen-org && git rm playwright.config.js
```

Expected: Staged for deletion.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove duplicate root playwright.config.js (tests/playwright.config.js is canonical)"
```

---

### Task A3: Delete unused `Dockerfile`

- [ ] **Step 1: Verify it's unused**

```bash
grep -r 'Dockerfile' package.json docker-compose.yml
```

Expected: `Dockerfile` is not referenced. `npm run build` in `package.json` uses `docker run hugomods/hugo:exts`.

- [ ] **Step 2: Delete**

```bash
cd /opt/git/hugo-chemie-lernen-org && git rm Dockerfile
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove unused Dockerfile (Hugo 0.57.0) — npm run build uses hugomods/hugo:exts"
```

---

### Task A4: Remove `.optimized.js` build artifacts from git

- [ ] **Step 1: Untrack all `.optimized.js` files**

```bash
cd /opt/git/hugo-chemie-lernen-org && find myhugoapp/static/js -name '*.optimized.js' -exec git rm --cached {} \; | wc -l
```

Expected: 29 files staged for removal.

- [ ] **Step 2: Add `*.optimized.js` to `.gitignore`**

Edit `.gitignore` at root, append:

```gitignore
# Build artifacts
*.optimized.js
```

- [ ] **Step 3: Verify files remain on disk**

```bash
find myhugoapp/static/js -name '*.optimized.js' | wc -l
```

Expected: 29 files still exist. The `optimize` npm script still works.

- [ ] **Step 4: Commit**

```bash
git add .gitignore && git commit -m "chore: untrack .optimized.js build artifacts, add to gitignore"
```

---

### Task A5: Delete orphaned `myhugoapp/tests/` directory

- [ ] **Step 1: Delete**

```bash
cd /opt/git/hugo-chemie-lernen-org && git rm -r myhugoapp/tests/
```

Expected: ~13 files removed (enhance-coverage.js + 11 subdir scripts).

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove orphaned myhugoapp/tests/ directory — root jest suite is the active test runner"
```

---

### Task A6: Delete stale `myhugoapp/static/js/AGENTS.md`

- [ ] **Step 1: Delete**

```bash
cd /opt/git/hugo-chemie-lernen-org && git rm myhugoapp/static/js/AGENTS.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove stale JS AGENTS.md — outdated structure listing"
```

---

### Task A7: Update `scripts/minify-calculators.js`

- [ ] **Step 1: Read the comment with stale reference**

```bash
head -15 scripts/minify-calculators.js
```

Find the line: `// Note: stoichiometry-calculator-page.js contains HTML templates and is skipped`

- [ ] **Step 2: Remove the comment line**

Edit `scripts/minify-calculators.js` to remove the line referencing `stoichiometry-calculator-page.js`.

- [ ] **Step 3: Commit**

```bash
git add scripts/minify-calculators.js && git commit -m "chore: update minify script comment — deleted file no longer exists"
```

---

### Task A8: Update root `AGENTS.md`

- [ ] **Step 1: Fix build section, testing section, CI section, deployment section**

Edit `AGENTS.md`:

**Build** (line ~28): Change comment to remove "Hugo extended 0.57.0" — just `# Build (Docker-based)`.

**Testing** (lines ~79-84): Remove "Two separate Playwright configs" paragraph. Replace with:

```
### Playwright config

`tests/playwright.config.js` — the canonical config. Tests against the live production site (`BASE_URL` defaults to `https://chemie-lernen.org`). There is no local webServer config — E2E tests require the site to be deployed.
```

**CI** (lines ~91-94): Remove GitHub Actions CI subsection. Replace with:

```
### CI

Self-hosted systemd timer triggers pull, build, and deploy on push to master.
```

**Deployment** (lines ~114-119): Remove "Docker build" and "Alternative CI" bullet points. Keep only:

```
- **Production**: `docker-compose.yml` serves `myhugoapp/public/` via nginx behind Traefik (HTTPS via Let's Encrypt)
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md && git commit -m "docs: update AGENTS.md — remove stale CI, Dockerfile, duplicate config refs"
```

---

### Task B1: Add test:unit and test:integration npm scripts

- [ ] **Step 1: Read current `package.json` scripts**

```bash
cat package.json | grep -A 10 '"scripts"'
```

- [ ] **Step 2: Add `test:unit` and `test:integration` scripts**

Edit `package.json`. Insert after the `test` script:

```json
    "test:unit": "jest --forceExit --testPathIgnorePatterns='(production/)'",
    "test:integration": "jest --forceExit --testPathPattern='(production/)'",
```

- [ ] **Step 3: Create `tests/production/` directory**

Move production-dependent test files there:

```bash
mkdir -p tests/production
cd tests
# Move spec files that need the live site
mv screenshots.spec.js test-calculators.spec.js test-dark-mode.spec.js test-formula-rendering.spec.js test-gasgesetz-rechner.spec.js test-green-colors.spec.js test-language-switcher.spec.js test-molecule-studio-visual.spec.js test-molekuel-studio.spec.js test-progress-tracker.spec.js test-quiz-system.spec.js test-titrations-simulator.spec.js test-verbrennungsrechner.spec.js test-visualizations.spec.js production/
# Move test files that need the live site
mv accessibility-validation.test.js complete-site-audit.test.js mobile-responsiveness.test.js site-accessibility-audit.test.js production/
```

- [ ] **Step 4: Verify the split**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx jest --listTests
```

Expected: Lists only the unit tests (89 tests from `*.test.js` in `tests/` root, not in `tests/production/`).

```bash
npx jest --listTests --testPathPattern='production/'
```

Expected: Lists exactly the 18 production-dependent files.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/production/ && git commit -m "fix: add test:unit and test:integration scripts, isolate production-dependent tests"
```

---

### Task C1: Run ESLint auto-fix on all JS files

- [ ] **Step 1: Run `--fix`**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/ --fix 2>&1 | tail -5
```

Expected: Auto-fixes 198 warnings (`no-var` → `let`/`const`, `prefer-const`, `prefer-arrow-callback`, etc.)

- [ ] **Step 2: Count remaining warnings**

```bash
npx eslint myhugoapp/static/js/ 2>&1 | grep -c 'warning'
```

Expected: ~91 remaining (down from 289). Mostly `no-unused-vars` for legitimate onclick handlers.

---

### Task C2: Add `no-unused-vars` exemption for onclick globals

- [ ] **Step 1: Analyze remaining `no-unused-vars` warnings**

```bash
npx eslint myhugoapp/static/js/ 2>&1 | grep 'no-unused-vars' | sed 's/.*warning  //' | sed 's/ .*//' | sort | uniq -c | sort -rn
```

This shows each variable name and count. Most should be functions called from `onclick="..."` in HTML templates.

- [ ] **Step 2: Add globals override to `eslint.config.mjs`**

Insert a new override in `eslint.config.mjs` (before the general calculator block at line 146):

```javascript
  // Calculator onclick globals — functions called from HTML onclick attributes
  {
    files: ['myhugoapp/static/js/calculators/**/*.js'],
    languageOptions: {
      globals: {
        // calc-presets.js
        loadPreset: 'readonly',
        loadMassPreset: 'readonly',
        // calc-equation-parser.js
        parseEquation: 'readonly',
        displayParsedCoefficients: 'readonly',
        applyCoefficientsToMolMol: 'readonly',
        applyCoefficientsToMassMass: 'readonly',
        // calc-element-lookup.js
        applyMolarMass: 'readonly',
        showElementInfo: 'readonly',
        // calc-history.js
        saveToHistory: 'readonly',
        loadHistory: 'readonly',
        displayHistory: 'readonly',
        toggleHistory: 'readonly',
        clearHistory: 'readonly',
        updateHistoryCount: 'readonly',
        checkForBalancedEquation: 'readonly',
        // calc-molmol.js
        calcMolMol: 'readonly',
        toggleMolMolExplanation: 'readonly',
        exportMolMolToPDF: 'readonly',
        // calc-massmass.js
        calcMassMass: 'readonly',
        toggleMassMassExplanation: 'readonly',
        exportMassMassToPDF: 'readonly',
        // calc-limiting.js
        calcLimiting: 'readonly',
        toggleLimitingExplanation: 'readonly',
        exportLimitingToPDF: 'readonly',
        // calc-yield.js
        calcYield: 'readonly',
        toggleYieldExplanation: 'readonly',
        exportYieldToPDF: 'readonly',
        // calc-multistep.js
        addReactionStep: 'readonly',
        removeStep: 'readonly',
        clearAllSteps: 'readonly',
        loadMultiStepExample: 'readonly',
        updateInitialMass: 'readonly',
        calculateMultiStep: 'readonly',
        exportMultiStepToPDF: 'readonly',
        // calc-gaslaw.js
        loadSTP: 'readonly',
        loadSATP: 'readonly',
        loadGasExample: 'readonly',
        convertTemperatureToKelvin: 'readonly',
        updateGasInputs: 'readonly',
        calculateGasLaw: 'readonly',
        exportGasToPDF: 'readonly',
        // practice-quiz.js
        startPractice: 'readonly',
        checkAnswer: 'readonly',
        skipProblem: 'readonly',
        resetPractice: 'readonly',
        // tutorials.js
        startTutorial: 'readonly',
        nextStep: 'readonly',
        previousStep: 'readonly',
        closeTutorial: 'readonly',
        initializeTutorials: 'readonly',
      },
    },
  },
```

- [ ] **Step 3: Verify warning count**

```bash
npx eslint myhugoapp/static/js/ 2>&1 | grep -c 'warning'
```

Expected: 0 or near-0. If some remain, iterate on step C3.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs && git commit -m "style: add ESLint globals for calculator onclick handlers, eliminate no-unused-vars warnings"
```

---

### Task C3: Handle remaining non-auto-fixable warnings

- [ ] **Step 1: List remaining**

```bash
npx eslint myhugoapp/static/js/ 2>&1 | grep 'warning'
```

- [ ] **Step 2: Fix each remaining category**

**`eqeqeq` warnings** (`'warn'` level at line 159): If codebase intentionally uses `==` for null checks, set `eqeqeq: 'off'`. Otherwise, fix individual cases with `===`.

**Other `no-unused-vars`**: For true dead code, either remove or add `// eslint-disable-next-line` comments.

**`no-var` stragglers**: The `--fix` pass should have handled these. If any remain, run `--fix` again.

- [ ] **Step 3: Final verification**

```bash
npx eslint myhugoapp/static/js/ 2>&1
```

Target: **0 errors, 0 warnings**.

---

### Task D: Final verification and commit

- [ ] **Step 1: Run lint**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/ 2>&1
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 2: Run unit tests**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm run test:unit
```

Expected: 89 tests pass, completes in <1s.

- [ ] **Step 3: Build site**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm run build 2>&1 | tail -10
```

Expected: ~242 pages, build succeeds.

- [ ] **Step 4: Final commit of lint fixes**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add -A && git commit -m "style: batch ESLint fixes — auto-fix warnings, add globals override for onclick handlers"
```

- [ ] **Step 5: Push**

```bash
git push
```
