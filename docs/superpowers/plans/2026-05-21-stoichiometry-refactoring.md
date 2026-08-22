# Stoichiometry Calculator Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the overloaded stoichiometry calculator page (1 page, 1 JS file) into 4 focused pages with per-module JS files.

**Architecture:** 4 Hugo pages sharing extracted JS modules. The 1860-line `stoichiometry-calculator-page.js` is split into 6 per-calculator modules + 4 shared utility modules + 2 page-specific modules. The LazyLoader is updated to support loading multiple scripts per calculator type. Each page loads only what it needs.

**Tech Stack:** Vanilla JS (global scope, no ES modules), Hugo templates, Bootstrap 3

---

## File Structure (After)

### Templates

- `myhugoapp/layouts/_default/stoechiometrie-rechner.html` — **MODIFY** (strip to calculator tabs only)
- `myhugoapp/layouts/_default/stoechiometrie-werkzeuge.html` — **CREATE** (equation parser, element lookup, history)
- `myhugoapp/layouts/_default/stoechiometrie-uebungen.html` — **CREATE** (practice quiz)
- `myhugoapp/layouts/_default/stoechiometrie-tutorien.html` — **CREATE** (tutorials)

### Content

- `myhugoapp/content/stoechiometrie-rechner/_index.md` — **MOVE** (from `stoechiometrie-rechner.md`, convert to branch bundle)
- `myhugoapp/content/stoechiometrie-rechner/werkzeuge.md` — **CREATE**
- `myhugoapp/content/stoechiometrie-rechner/uebungen.md` — **CREATE**
- `myhugoapp/content/stoechiometrie-rechner/tutorien.md` — **CREATE**

Note: The URL for `werkzeuge.md` becomes `/stoechiometrie-rechner/werkzeuge/` because it's inside the `stoechiometrie-rechner/` branch bundle directory.

### JS Modules (all in `myhugoapp/static/js/calculators/`)

| File                      | Responsibility                                                                                                                                                     | Page(s)               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `calc-presets.js`         | presets data, `loadPreset()`, `loadMassPreset()`                                                                                                                   | rechner               |
| `calc-equation-parser.js` | `parseEquation()`, `parseChemicalEquation()`, `displayParsedCoefficients()`, `applyCoefficientsToMolMol()`, `applyCoefficientsToMassMass()`                        | rechner, werkzeuge    |
| `calc-element-lookup.js`  | `elementDatabase`, `applyMolarMass()`, `showElementInfo()`, `applyMolarMassToCalculator()`                                                                         | rechner, werkzeuge    |
| `calc-history.js`         | `saveToHistory()`, `displayHistory()`, `toggleHistory()`, `clearHistory()`, `checkForBalancedEquation()`                                                           | rechner, werkzeuge    |
| `calc-molmol.js`          | `calcMolMol()`, `toggleMolMolExplanation()`, `exportMolMolToPDF()`                                                                                                 | rechner               |
| `calc-massmass.js`        | `calcMassMass()`, `toggleMassMassExplanation()`, `exportMassMassToPDF()`                                                                                           | rechner               |
| `calc-limiting.js`        | `calcLimiting()`, `toggleLimitingExplanation()`, `exportLimitingToPDF()`                                                                                           | rechner               |
| `calc-yield.js`           | `calcYield()`, `toggleYieldExplanation()`, `exportYieldToPDF()`                                                                                                    | rechner               |
| `calc-multistep.js`       | `addReactionStep()`, `removeStep()`, `calculateMultiStep()`, `exportMultiStepToPDF()`, `updateInitialMass()`, etc.                                                 | rechner               |
| `calc-gaslaw.js`          | `calculateGasLaw()`, `loadSTP()`, `loadSATP()`, `loadGasExample()`, `convertTemperatureToKelvin()`, `updateGasInputs()`, `exportGasToPDF()`, `convertFromKelvin()` | rechner               |
| `practice-quiz.js`        | `practiceState`, `startPractice()`, `generateProblem()`, local generators, `checkAnswer()`, `showFeedback()`, `updateScore()`, `skipProblem()`, `resetPractice()`  | uebungen              |
| `tutorials.js`            | `tutorialState`, `tutorials` data (full content), `startTutorial()`, `nextStep()`, `previousStep()`, `closeTutorial()`, `initializeTutorials()`, `renderStep()`    | tutorien              |
| `practice-generators.js`  | (existing, unchanged)                                                                                                                                              | uebungen (tests only) |
| `stoichiometry.js`        | (existing, unchanged) core math                                                                                                                                    | tests only            |

### Infrastructure

- `myhugoapp/static/js/lazy-loader.js` — **MODIFY** to support multiple scripts per calculator type

### Source for extraction

- `myhugoapp/static/js/calculators/stoichiometry-calculator-page.js` — **DELETE** after all modules are extracted

---

### Task 1: Create shared utility modules

**Files:**

- Create: `myhugoapp/static/js/calculators/calc-presets.js`
- Create: `myhugoapp/static/js/calculators/calc-equation-parser.js`
- Create: `myhugoapp/static/js/calculators/calc-element-lookup.js`
- Create: `myhugoapp/static/js/calculators/calc-history.js`
- Source: `myhugoapp/static/js/calculators/stoichiometry-calculator-page.js` lines 1-571

- [ ] **Step 1.1: Create `calc-presets.js`**

Extract lines 2-81 from `stoichiometry-calculator-page.js` (presets + massPresets objects + loadPreset() + loadMassPreset() functions):

```js
// Preset reactions data for Mol-Mol calculator
// eslint-disable-next-line no-unused-vars
var presets = {
  water: {
    name: 'Wasserbildung',
    equation: '2H2 + O2 -> 2H2O',
    v1: 2,
    v2: 2,
    example: 4,
  },
  methane: {
    name: 'Methan-Verbrennung',
    equation: 'CH4 + 2O2 -> CO2 + 2H2O',
    v1: 1,
    v2: 1,
    example: 2,
  },
  ammonia: {
    name: 'Haber-Verfahren (Ammoniak)',
    equation: 'N2 + 3H2 -> 2NH3',
    v1: 1,
    v2: 2,
    example: 3,
  },
  sodium: {
    name: 'Natrium + Wasser',
    equation: '2Na + 2H2O -> 2NaOH + H2',
    v1: 2,
    v2: 2,
    example: 4,
  },
  photosynthesis: {
    name: 'Fotosynthese',
    equation: '6CO2 + 6H2O -> C6H12O6 + 6O2',
    v1: 6,
    v2: 1,
    example: 6,
  },
};

// Preset reactions data for Mass-Mass calculator
// eslint-disable-next-line no-unused-vars
var massPresets = {
  water: {
    name: 'Wasserbildung',
    v1: 2,
    v2: 2,
    m1: 4,
    M1: 2,
    M2: 18,
  },
  methane: {
    name: 'Methan-Verbrennung',
    v1: 1,
    v2: 1,
    m1: 16,
    M1: 16,
    M2: 44,
  },
  ammonia: {
    name: 'Haber-Verfahren',
    v1: 1,
    v2: 2,
    m1: 28,
    M1: 28,
    M2: 17,
  },
  sodium: {
    name: 'Natrium + Wasser',
    v1: 2,
    v2: 2,
    m1: 46,
    M1: 23,
    M2: 40,
  },
  photosynthesis: {
    name: 'Fotosynthese',
    v1: 6,
    v2: 1,
    m1: 264,
    M1: 44,
    M2: 180,
  },
};

// eslint-disable-next-line no-unused-vars
function loadPreset(presetKey) {
  var preset = presets[presetKey];
  if (!preset) return;
  document.getElementById('reaction-1').value = preset.equation;
  document.getElementById('mol-coeff-r').value = preset.v1;
  document.getElementById('mol-coeff-p').value = preset.v2;
  document.getElementById('mol-reactant').value = preset.example;
  document.getElementById('mol-reactant').placeholder = preset.example;
  document.getElementById('mol-result').style.display = 'none';
}

// eslint-disable-next-line no-unused-vars
function loadMassPreset(presetKey) {
  var preset = massPresets[presetKey];
  if (!preset) return;
  document.getElementById('mass-coeff-r').value = preset.v1;
  document.getElementById('mass-coeff-p').value = preset.v2;
  document.getElementById('mass-r').value = preset.m1;
  document.getElementById('mm-r').value = preset.M1;
  document.getElementById('mm-p').value = preset.M2;
  document.getElementById('mass-result').style.display = 'none';
  document.getElementById('mass-preview').innerHTML =
    '<p style="font-size:2em; color:#007bff;">--</p><p>Gramm</p>';
}
```

- [ ] **Step 1.2: Create `calc-equation-parser.js`**

Extract lines 116-295 from `stoichiometry-calculator-page.js`. Content is the `parseEquation()`, `parseChemicalEquation()`, `parseSide()`, `parseCompound()`, `displayParsedCoefficients()`, `applyCoefficientsToMolMol()`, `applyCoefficientsToMassMass()` functions. Copy exactly as-is from the source file.

- [ ] **Step 1.3: Create `calc-element-lookup.js`**

Extract lines 297-416 from `stoichiometry-calculator-page.js`. Content is the `elementDatabase`, `applyMolarMass()`, `showElementInfo()`, `applyMolarMassToCalculator()`. Copy exactly as-is.

- [ ] **Step 1.4: Create `calc-history.js`**

Extract lines 418-616 from `stoichiometry-calculator-page.js`. Content is `saveToHistory()`, `loadHistory()`, `displayHistory()`, `toggleHistory()`, `clearHistory()`, `updateHistoryCount()`, `checkForBalancedEquation()`, `showImportNotification()`. Copy exactly as-is.

- [ ] **Step 1.5: Verify no syntax errors**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/calculators/calc-presets.js myhugoapp/static/js/calculators/calc-equation-parser.js myhugoapp/static/js/calculators/calc-element-lookup.js myhugoapp/static/js/calculators/calc-history.js
```

Expected: No errors. (Note: some `no-unused-vars` warnings may appear — these are expected for the `loadPreset`/`loadMassPreset` globals, and the eslint config has `no-unused-vars: off` in some overrides.)

- [ ] **Step 1.6: Commit**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add myhugoapp/static/js/calculators/calc-presets.js myhugoapp/static/js/calculators/calc-equation-parser.js myhugoapp/static/js/calculators/calc-element-lookup.js myhugoapp/static/js/calculators/calc-history.js && git commit -m "refactor: extract shared utility modules from stoichiometry calculator"
```

---

### Task 2: Create per-calculator modules

**Files:**

- Create: `myhugoapp/static/js/calculators/calc-molmol.js`
- Create: `myhugoapp/static/js/calculators/calc-massmass.js`
- Create: `myhugoapp/static/js/calculators/calc-limiting.js`
- Create: `myhugoapp/static/js/calculators/calc-yield.js`
- Create: `myhugoapp/static/js/calculators/calc-multistep.js`
- Create: `myhugoapp/static/js/calculators/calc-gaslaw.js`
- Source: `myhugoapp/static/js/calculators/stoichiometry-calculator-page.js` lines 618-1858

- [ ] **Step 2.1: Create `calc-molmol.js`**

Extract lines 618-711 from source: `calcMolMol()`, `toggleMolMolExplanation()` (the full explanation HTML blobs are included). Copy exactly as-is.

- [ ] **Step 2.2: Create `calc-massmass.js`**

Extract lines 713-831 from source: `calcMassMass()`, `toggleMassMassExplanation()`. Copy exactly as-is.

- [ ] **Step 2.3: Create `calc-limiting.js`**

Extract lines 833-930 from source: `calcLimiting()`, `toggleLimitingExplanation()`. Copy exactly as-is.

- [ ] **Step 2.4: Create `calc-yield.js`**

Extract lines 932-1037 from source: `calcYield()`, `toggleYieldExplanation()`. Copy exactly as-is.

- [ ] **Step 2.5: Create `calc-multistep.js`**

Extract lines 1039-1456 from source: `stepCounter`, `addReactionStep()`, `removeStep()`, `updateStepNumbers()`, `clearAllSteps()`, `loadMultiStepExample()`, `updateInitialMass()`, `calculateMultiStep()`, `displayMultiStepResults()`, `exportMultiStepToPDF()`, plus the DOMContentLoaded event listener for initial mass inputs. Copy exactly as-is.

- [ ] **Step 2.6: Create `calc-gaslaw.js`**

Extract lines 1458-1858 from source: `loadSTP()`, `loadSATP()`, `loadGasExample()`, `convertTemperatureToKelvin()`, `updateGasInputs()`, `convertPressureToAtm()`, `convertVolumeToLiters()`, `convertAmountToMoles()`, `convertToKelvin()`, `calculateGasLaw()`, `displayGasResult()`, `convertFromKelvin()`, `exportGasToPDF()`, plus the DOMContentLoaded event listener for gas inputs. Copy exactly as-is.

- [ ] **Step 2.7: Lint all new files**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/calculators/calc-molmol.js myhugoapp/static/js/calculators/calc-massmass.js myhugoapp/static/js/calculators/calc-limiting.js myhugoapp/static/js/calculators/calc-yield.js myhugoapp/static/js/calculators/calc-multistep.js myhugoapp/static/js/calculators/calc-gaslaw.js
```

Expected: No errors.

- [ ] **Step 2.8: Run unit tests**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm test 2>&1 | tail -20
```

Expected: Tests pass (the core math functions in `stoichiometry.js` are unchanged — we only extracted UI functions).

- [ ] **Step 2.9: Commit**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add myhugoapp/static/js/calculators/calc-molmol.js myhugoapp/static/js/calculators/calc-massmass.js myhugoapp/static/js/calculators/calc-limiting.js myhugoapp/static/js/calculators/calc-yield.js myhugoapp/static/js/calculators/calc-multistep.js myhugoapp/static/js/calculators/calc-gaslaw.js && git commit -m "refactor: extract per-calculator modules from stoichiometry calculator"
```

---

### Task 3: Update LazyLoader to support multi-script loading

**Files:**

- Modify: `myhugoapp/static/js/lazy-loader.js` (full file)
- Source: existing 50-line file

- [ ] **Step 3.1: Modify `lazy-loader.js`**

The current `loadCalculator()` maps each calculator type to a single script URL. Change it to support arrays of scripts and new calculator types for the 4 new pages:

```js
const LazyLoader = {
  loadedScripts: new Set(),
  loadingScripts: new Map(),

  loadScript(t, e) {
    if (this.loadingScripts.has(t)) return this.loadingScripts.get(t);
    if (this.loadedScripts.has(e)) return Promise.resolve();
    const r = new Promise((resolve, reject) => {
      const i = document.createElement('script');
      i.src = t;
      i.id = e;
      i.async = !0;
      i.onload = () => {
        this.loadedScripts.add(e);
        this.loadingScripts.delete(t);
        resolve();
      };
      i.onerror = () => {
        this.loadingScripts.delete(t);
        reject(new Error('Failed to load script: ' + t));
      };
      document.head.appendChild(i);
    });
    this.loadingScripts.set(t, r);
    return r;
  },

  loadCalculator(t) {
    const calculators = {
      stoichiometry: [
        '/js/calculators/calc-presets.js',
        '/js/calculators/calc-equation-parser.js',
        '/js/calculators/calc-element-lookup.js',
        '/js/calculators/calc-history.js',
        '/js/calculators/calc-molmol.js',
        '/js/calculators/calc-massmass.js',
        '/js/calculators/calc-limiting.js',
        '/js/calculators/calc-yield.js',
        '/js/calculators/calc-multistep.js',
        '/js/calculators/calc-gaslaw.js',
      ],
      werkzeuge: [
        '/js/calculators/calc-equation-parser.js',
        '/js/calculators/calc-element-lookup.js',
        '/js/calculators/calc-history.js',
      ],
      uebungen: ['/js/calculators/practice-quiz.js'],
      tutorien: ['/js/calculators/tutorials.js'],
    };

    var scripts = calculators[t];
    if (!scripts) return Promise.reject(new Error('Unknown calculator type: ' + t));

    // Load scripts sequentially to preserve dependency order
    return scripts.reduce(function (promise, script) {
      var scriptId = script.replace(/[\/\.]/g, '-');
      return promise.then(function () {
        return LazyLoader.loadScript(script, scriptId);
      });
    }, Promise.resolve());
  },

  preloadCritical() {
    if (document.querySelector('.stoichiometry-calculator-container')) {
      this.loadCalculator('stoichiometry');
    }
  },

  init() {
    var container = document.querySelector('.stoichiometry-calculator-container');
    if (container && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              LazyLoader.loadCalculator('stoichiometry');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );
      observer.observe(container);
    } else if (container) {
      this.preloadCritical();
    }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}
```

- [ ] **Step 3.2: Lint and verify**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/lazy-loader.js
```

Expected: No errors.

- [ ] **Step 3.3: Run minification (if applicable)**

lazy-loader.js is in the minify target list. The updated code should still minify correctly:

```bash
cd /opt/git/hugo-chemie-lernen-org && npm run minify 2>&1
```

Expected: Runs without error.

- [ ] **Step 3.4: Commit**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add myhugoapp/static/js/lazy-loader.js && git commit -m "feat: update LazyLoader to support multi-script loading per calculator type"
```

---

### Task 4: Create practice quiz and tutorials modules

**Files:**

- Create: `myhugoapp/static/js/calculators/practice-quiz.js`
- Create: `myhugoapp/static/js/calculators/tutorials.js`
- Source: `stoichiometry-calculator-page.js` lines 1860-2291 (practice) and 2293-end (tutorials)

- [ ] **Step 4.1: Create `practice-quiz.js`**

Extract lines 1860-2291 from source: `practiceState`, `startPractice()`, `generateProblem()`, `generateMolMolProblem()`, `generateMassMassProblem()`, `generateLimitingProblem()`, `generateYieldProblem()`, `checkAnswer()`, `showFeedback()`, `problemDetailHTML()`, `updateScore()`, `skipProblem()`, `resetPractice()`. Copy exactly as-is.

- [ ] **Step 4.2: Create `tutorials.js`**

Extract lines 2293-end from source: `tutorialState`, `tutorials` object (all 5 tutorials with all steps and full content HTML), `startTutorial()`, `nextStep()`, `previousStep()`, `closeTutorial()`, `initializeTutorials()`, `renderStep()`. Copy exactly as-is. Note: this includes the large inline tutorial content HTML blobs. They are copied verbatim.

- [ ] **Step 4.3: Lint**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/calculators/practice-quiz.js myhugoapp/static/js/calculators/tutorials.js
```

Expected: No errors.

- [ ] **Step 4.4: Commit**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add myhugoapp/static/js/calculators/practice-quiz.js myhugoapp/static/js/calculators/tutorials.js && git commit -m "refactor: extract practice quiz and tutorials modules from stoichiometry calculator"
```

---

### Task 5: Restructure HTML templates

**Files:**

- Modify: `myhugoapp/layouts/_default/stoechiometrie-rechner.html` (strip to calculator tabs only)
- Create: `myhugoapp/layouts/_default/stoechiometrie-werkzeuge.html`
- Create: `myhugoapp/layouts/_default/stoechiometrie-uebungen.html`
- Create: `myhugoapp/layouts/_default/stoechiometrie-tutorien.html`

- [ ] **Step 5.1: Strip `stoechiometrie-rechner.html`**

Remove these sections from the template (lines 20-503):

- Equation Parser section (lines 20-46)
- Periodic Table / Molar Mass Lookup (lines 48-115)
- Practice Mode Section (lines 117-196)
- Interactive Tutorials (lines 198-326)
- Student Progress Tracking (lines 328-479)
- Calculation History (lines 481-503)

Also update the `{{ define "js" }}` block at the end to load only calculator modules:

```html
{{ define "js" }}
<script src="/js/lazy-loader.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof LazyLoader !== 'undefined') {
      LazyLoader.loadCalculator('stoichiometry').catch(function (err) {
        console.error('Failed to load calculator:', err);
      });
    } else {
      console.error('LazyLoader not available');
    }
  });
</script>
{{ end }}
```

- [ ] **Step 5.2: Create `stoechiometrie-werkzeuge.html`**

```html
{{ define "main" }}

<script src="/js/lazy-loader.js"></script>

<div class="stoichiometry-calculator-container">
  <div class="row">
    <div class="col-md-12">
      <h1 class="text-center">{{ .Title }}</h1>
      <p class="lead text-center">{{ .Description }}</p>
    </div>
  </div>

  <hr class="featurette-divider" />

  <!-- Equation Parser -->
  <div class="row">
    <div class="col-md-12">
      <div
        class="parser-section"
        style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #2196F3;"
      >
        <h3 style="color: #1976D2; margin-top: 0;">
          <i class="fa fa-flask"></i> Reaktionsgleichung automatisch analysieren
        </h3>
        <p>
          Geben Sie eine Reaktionsgleichung ein, um die Koeffizienten automatisch zu extrahieren:
        </p>
        <div class="form-group">
          <input
            type="text"
            id="equation-parser-input"
            class="form-control"
            placeholder="z.B. 2H2 + O2 -> 2H2O oder CH4 + 2O2 -> CO2 + 2H2O"
            style="font-size: 16px; padding: 12px;"
            aria-label="Reaktionsgleichung eingeben"
          />
        </div>
        <button class="btn btn-primary" onclick="parseEquation()">
          <i class="fa fa-cogs"></i> Gleichung analysieren
        </button>
        <div id="parser-result" style="display:none; margin-top: 15px;">
          <div class="result-box">
            <h4>Erkannte Koeffizienten:</h4>
            <div id="parsed-coefficients"></div>
            <div id="apply-buttons" style="margin-top: 15px;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Periodic Table / Molar Mass Lookup -->
  <div class="row">
    <div class="col-md-12">
      <div
        class="periodic-table-section"
        style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #9C27B0;"
      >
        <h3 style="color: #7B1FA2; margin-top: 0;">
          <i class="fa fa-table"></i> Molare Massen nachschlagen
        </h3>
        <p>Suchen Sie nach einem Element, um die molare Masse anzuzeigen:</p>

        <div class="form-group">
          <div class="row">
            <div class="col-md-8">
              <select
                id="element-selector"
                class="form-control"
                style="font-size: 16px; padding: 12px;"
                aria-label="Element auswählen"
              >
                <option value="">-- Element auswählen --</option>
                <optgroup label="Nichtmetalle">
                  <option value="H:1.008">H - Wasserstoff (1.008 g/mol)</option>
                  <option value="C:12.011">C - Kohlenstoff (12.011 g/mol)</option>
                  <option value="N:14.007">N - Stickstoff (14.007 g/mol)</option>
                  <option value="O:15.999">O - Sauerstoff (15.999 g/mol)</option>
                  <option value="F:18.998">F - Fluor (18.998 g/mol)</option>
                  <option value="P:30.974">P - Phosphor (30.974 g/mol)</option>
                  <option value="S:32.06">S - Schwefel (32.06 g/mol)</option>
                  <option value="Cl:35.45">Cl - Chlor (35.45 g/mol)</option>
                  <option value="I:126.90">I - Iod (126.90 g/mol)</option>
                </optgroup>
                <optgroup label="Metalle (Hauptgruppe)">
                  <option value="Li:6.941">Li - Lithium (6.941 g/mol)</option>
                  <option value="Na:22.990">Na - Natrium (22.990 g/mol)</option>
                  <option value="K:39.098">K - Kalium (39.098 g/mol)</option>
                  <option value="Be:9.012">Be - Beryllium (9.012 g/mol)</option>
                  <option value="Mg:24.305">Mg - Magnesium (24.305 g/mol)</option>
                  <option value="Ca:40.078">Ca - Calcium (40.078 g/mol)</option>
                  <option value="Al:26.982">Al - Aluminium (26.982 g/mol)</option>
                  <option value="Fe:55.845">Fe - Eisen (55.845 g/mol)</option>
                  <option value="Cu:63.546">Cu - Kupfer (63.546 g/mol)</option>
                  <option value="Zn:65.38">Zn - Zink (65.38 g/mol)</option>
                  <option value="Ag:107.87">Ag - Silber (107.87 g/mol)</option>
                  <option value="Au:196.97">Au - Gold (196.97 g/mol)</option>
                </optgroup>
                <optgroup label="Übergangsmetalle">
                  <option value="Cr:51.996">Cr - Chrom (51.996 g/mol)</option>
                  <option value="Mn:54.938">Mn - Mangan (54.938 g/mol)</option>
                  <option value="Ni:58.693">Ni - Nickel (58.693 g/mol)</option>
                  <option value="Pt:195.08">Pt - Platin (195.08 g/mol)</option>
                </optgroup>
                <optgroup label="Edelgase">
                  <option value="He:4.0026">He - Helium (4.0026 g/mol)</option>
                  <option value="Ne:20.180">Ne - Neon (20.180 g/mol)</option>
                  <option value="Ar:39.948">Ar - Argon (39.948 g/mol)</option>
                </optgroup>
              </select>
            </div>
            <div class="col-md-4">
              <p class="text-muted" style="margin-top: 25px;">
                Wählen Sie ein Element, um die molare Masse anzuzeigen
              </p>
            </div>
          </div>
        </div>

        <div id="molar-mass-info" style="display:none; margin-top: 15px;">
          <div class="alert alert-info">
            <div id="molar-mass-details"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Calculation History -->
  <div class="row">
    <div class="col-md-12">
      <div class="history-section">
        <button class="btn btn-info btn-sm" onclick="toggleHistory()" type="button">
          <i class="fa fa-history"></i> Berechnungsverlauf
          <span id="history-count" class="badge">(0)</span>
        </button>
        <button
          class="btn btn-default btn-sm"
          onclick="clearHistory()"
          type="button"
          style="margin-left: 10px;"
        >
          <i class="fa fa-trash"></i> Verlauf löschen
        </button>

        <div id="history-panel" style="display:none; margin-top: 15px;">
          <div class="well">
            <h4>Letzte Berechnungen</h4>
            <div id="history-list" class="history-list">
              <p class="text-muted"><small>Noch keine Berechnungen durchgeführt.</small></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{{ end }} {{ define "css" }}
<style>
  .stoichiometry-calculator-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
  }
  .result-box {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    padding: 20px;
  }
  .result-box h3 {
    color: #155724;
    margin-top: 0;
  }
  .history-section {
    margin-bottom: 20px;
  }
  .history-list {
    max-height: 400px;
    overflow-y: auto;
  }
  .history-item {
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .badge {
    background-color: #2196f3;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 12px;
    margin-left: 5px;
  }
</style>
{{ end }} {{ define "js" }}
<script src="/js/lazy-loader.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof LazyLoader !== 'undefined') {
      LazyLoader.loadCalculator('werkzeuge').catch(function (err) {
        console.error('Failed to load tools:', err);
      });
    } else {
      console.error('LazyLoader not available');
    }
  });
</script>
{{ end }}
```

- [ ] **Step 5.3: Create `stoechiometrie-uebungen.html`**

The uebungen (practice quiz) template includes the practice mode section from the original page (lines 117-196) plus its own LazyLoader loading:

```html
{{ define "main" }}

<script src="/js/lazy-loader.js"></script>

<div class="stoichiometry-calculator-container">
  <div class="row">
    <div class="col-md-12">
      <h1 class="text-center">{{ .Title }}</h1>
      <p class="lead text-center">{{ .Description }}</p>
    </div>
  </div>

  <hr class="featurette-divider" />

  <!-- Practice Mode Section -->
  <div class="row">
    <div class="col-md-12">
      <div
        class="practice-section"
        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-bottom: 20px;"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="color: white; margin-top: 0;">
              <i class="fa fa-graduation-cap"></i> Übungsmodus
            </h3>
            <p style="color: rgba(255,255,255,0.9); margin-bottom: 0;">
              Teste dein Wissen mit zufälligen Stöchiometrie-Aufgaben!
            </p>
          </div>
          <div style="text-align: right; color: white;">
            <p style="font-size: 14px; margin-bottom: 5px;">
              Punkte: <strong id="practice-score" style="font-size: 24px;">0</strong>
            </p>
            <p style="font-size: 14px; margin: 0;">
              Richtig: <span id="correct-count">0</span> | Falsch:
              <span id="incorrect-count">0</span>
            </p>
          </div>
        </div>

        <div
          id="practice-setup"
          style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px;"
        >
          <div class="row">
            <div class="col-md-4">
              <label>Aufgabentyp:</label>
              <select id="practice-type" class="form-control" aria-label="Aufgabentyp wählen">
                <option value="mol-mol">Mol-Mol Umrechnung</option>
                <option value="mass-mass">Masse-Masse Umrechnung</option>
                <option value="limiting">Limitierendes Reagenz</option>
                <option value="yield">Ausbeute berechnen</option>
                <option value="random">Zufällig</option>
              </select>
            </div>
            <div class="col-md-4">
              <label>Schwierigkeit:</label>
              <select
                id="practice-difficulty"
                class="form-control"
                aria-label="Schwierigkeit wählen"
              >
                <option value="easy">Einfach (ganze Zahlen)</option>
                <option value="medium">Mittel (Dezimalzahlen)</option>
                <option value="hard">Schwer (komplexe Reaktionen)</option>
              </select>
            </div>
            <div class="col-md-4">
              <label>&nbsp;</label>
              <button class="btn btn-success btn-block" onclick="startPractice()">
                <i class="fa fa-play"></i> Aufgabe starten
              </button>
            </div>
          </div>
        </div>

        <div
          id="practice-problem"
          style="display:none; background: white; padding: 20px; border-radius: 8px; margin-top: 15px;"
        >
          <h4 style="color: #667eea; margin-top: 0;">Aufgabe <span id="problem-number">1</span></h4>
          <div id="problem-content"></div>

          <div id="answer-section" style="margin-top: 20px;">
            <label>Deine Antwort:</label>
            <div class="row">
              <div class="col-md-8">
                <input
                  type="number"
                  id="practice-answer"
                  class="form-control"
                  step="any"
                  placeholder="Ergebnis eingeben..."
                  aria-label="Deine Antwort eingeben"
                />
              </div>
              <div class="col-md-4">
                <button class="btn btn-primary btn-block" onclick="checkAnswer()">
                  <i class="fa fa-check"></i> Prüfen
                </button>
              </div>
            </div>
          </div>

          <div id="feedback-section" style="display:none; margin-top: 20px;"></div>

          <div style="margin-top: 20px; text-align: center;">
            <button class="btn btn-default" onclick="skipProblem()">
              <i class="fa fa-forward"></i> Überspringen
            </button>
            <button class="btn btn-warning" onclick="resetPractice()" style="margin-left: 10px;">
              <i class="fa fa-refresh"></i> Neustart
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{{ end }} {{ define "css" }}
<style>
  .stoichiometry-calculator-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
  }
</style>
{{ end }} {{ define "js" }}
<script src="/js/lazy-loader.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof LazyLoader !== 'undefined') {
      LazyLoader.loadCalculator('uebungen').catch(function (err) {
        console.error('Failed to load practice:', err);
      });
    } else {
      console.error('LazyLoader not available');
    }
  });
</script>
{{ end }}
```

- [ ] **Step 5.4: Create `stoechiometrie-tutorien.html`**

Create the file from `myhugoapp/layouts/_default/stoechiometrie-rechner.html` lines 198-323 (the tutorial section), wrapped in `{{ define "main" }}` / `{{ end }}` blocks with corrected LazyLoader loading.

Structure:

- `{{ define "main" }}` block contains `myhugoapp/layouts/_default/stoechiometrie-rechner.html` lines 198-326 verbatim (tutorial section div, tutorial menu grid with 5 cards, tutorial viewer)
- `{{ define "css" }}` block with `.stoichiometry-calculator-container` style rule
- `{{ define "js" }}` block: same LazyLoader pattern as other new templates but calling `loadCalculator('tutorien')`

The source HTML for tutorial cards is `myhugoapp/layouts/_default/stoechiometrie-rechner.html` lines 220-296 (5 `.tutorial-card` divs). The viewer is lines 299-323. Both are copied verbatim — no changes to IDs, classes, or onclick handlers.

- [ ] **Step 5.5: Commit template changes**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add myhugoapp/layouts/_default/stoechiometrie-rechner.html myhugoapp/layouts/_default/stoechiometrie-werkzeuge.html myhugoapp/layouts/_default/stoechiometrie-uebungen.html myhugoapp/layouts/_default/stoechiometrie-tutorien.html && git commit -m "refactor: create 3 new stoichiometry page templates, strip main page to calculator tabs only"
```

---

### Task 6: Create content files and verify build

**Files:**

- Create: `myhugoapp/content/stoichiometrie/werkzeuge.md`
- Create: `myhugoapp/content/stoichiometrie/uebungen.md`
- Create: `myhugoapp/content/stoichiometrie/tutorien.md`
- Modify: `myhugoapp/static/js/calculators/stoichiometry-calculator-page.js` (DELETE)
- Verify: `myhugoapp/layouts/_default/stoechiometrie-rechner.html` (the LazyLoader `init()` and `preloadCritical` reference the stoichiometry calculator container class. The stripped template still has it. Verify build.)

- [ ] **Step 6.1: Convert to branch bundle and create sub-pages**

First, convert the existing page to a branch bundle:

```bash
mkdir -p myhugoapp/content/stoechiometrie-rechner
mv myhugoapp/content/stoechiometrie-rechner.md myhugoapp/content/stoechiometrie-rechner/_index.md
```

The `_index.md` retains its original front matter including `layout: "stoechiometrie-rechner"`.

Then create the sub-page content files:

Create `myhugoapp/content/stoechiometrie-rechner/werkzeuge.md`:

```markdown
---
title: 'Stöchiometrie-Werkzeuge'
description: 'Hilfreiche Werkzeuge für stöchiometrische Berechnungen - Reaktionsgleichungen analysieren, molare Massen nachschlagen'
layout: 'stoechiometrie-werkzeuge'
---
```

Create `myhugoapp/content/stoechiometrie-rechner/uebungen.md`:

```markdown
---
title: 'Stöchiometrie-Übungen'
description: 'Teste dein Wissen mit interaktiven Stöchiometrie-Aufgaben - Mol-Mol, Masse-Masse, Ausbeute und mehr'
layout: 'stoechiometrie-uebungen'
---
```

Create `myhugoapp/content/stoechiometrie-rechner/tutorien.md`:

```markdown
---
title: 'Stöchiometrie-Tutorials'
description: 'Lerne Stöchiometrie Schritt für Schritt - von Grundlagen bis zu fortgeschrittenen Berechnungen'
layout: 'stoechiometrie-tutorien'
---
```

- [ ] **Step 6.2: Build site to verify**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm run build
```

Expected: Build succeeds. Check output for "238 pages" (or similar count). Verify the new pages appear by checking the built HTML:

```bash
ls myhugoapp/public/stoechiometrie-rechner/werkzeuge/index.html 2>/dev/null && echo "werkzeuge OK" || echo "werkzeuge MISSING"
ls myhugoapp/public/stoechiometrie-rechner/uebungen/index.html 2>/dev/null && echo "uebungen OK" || echo "uebungen MISSING"
ls myhugoapp/public/stoechiometrie-rechner/tutorien/index.html 2>/dev/null && echo "tutorien OK" || echo "tutorien MISSING"
```

All three should exist.

- [ ] **Step 6.3: Verify stale page still loads**

```bash
ls myhugoapp/public/stoechiometrie-rechner/index.html 2>/dev/null && echo "main page OK" || echo "main page MISSING"
```

Expected: Main page still exists with calculator tabs only.

- [ ] **Step 6.4: Commit content changes**

```bash
cd /opt/git/hugo-chemie-lernen-org && git add myhugoapp/content/stoechiometrie-rechner/_index.md myhugoapp/content/stoechiometrie-rechner/werkzeuge.md myhugoapp/content/stoechiometrie-rechner/uebungen.md myhugoapp/content/stoechiometrie-rechner/tutorien.md && git commit -m "feat: convert stoichiometry page to branch bundle, add tools/practice/tutorials sub-pages"
```

---

### Task 7: Delete the old monolithic file

**Files:**

- Delete: `myhugoapp/static/js/calculators/stoichiometry-calculator-page.js`

- [ ] **Step 7.1: Delete old file**

```bash
cd /opt/git/hugo-chemie-lernen-org && git rm myhugoapp/static/js/calculators/stoichiometry-calculator-page.js
```

- [ ] **Step 7.2: Run lint**

```bash
cd /opt/git/hugo-chemie-lernen-org && npx eslint myhugoapp/static/js/
```

Expected: No errors referencing the deleted file.

- [ ] **Step 7.3: Run tests**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm test 2>&1 | tail -20
```

Expected: All tests pass. (Tests use `stoichiometry.js` and `practice-generators.js` directly.)

- [ ] **Step 7.4: Build**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm run build
```

Expected: Build succeeds.

- [ ] **Step 7.5: Commit**

```bash
cd /opt/git/hugo-chemie-lernen-org && git commit -m "refactor: remove old monolithic stoichiometry-calculator-page.js"
```

---

### Task 8: (Optional) Fix the quiz progress bug

- [ ] **Step 8.1: Identify the bug**

The practice state (`practiceState` in `practice-quiz.js`) is in-memory only — refreshing the page resets score to 0. The tutorial state (`tutorialState`) uses `localStorage` for `completedTutorials` but the practice score is not persisted. Consider adding localStorage persistence for practice score.

If the user confirmed this is the bug they mentioned, fix it by adding localStorage persistence:

- Add `loadPracticeScore()` and `savePracticeScore()` functions
- Call `loadPracticeScore()` at startup in `startPractice()`
- Call `savePracticeScore()` after each `updateScore()` call

This is optional — only do if the user confirms this is the bug they referenced.

---

### Task 9: Deploy

- [ ] **Step 9.1: Commit all remaining changes**

```bash
cd /opt/git/hugo-chemie-lernen-org && git push origin master
```

- [ ] **Step 9.2: Rebuild and restart containers**

```bash
cd /opt/git/hugo-chemie-lernen-org && npm run build && docker compose down && docker compose up -d
```
