// pH Calculator JavaScript with Step-by-Step Solver Integration
/* global StepByStepSolver */
(function () {
  'use strict';

  // Constants
  const _KW_25C = 1e-14; // Water ion product at 25°C

  // DOM element cache for performance
  let domCache = null;

  // StepByStepSolver instance for calculation steps
  let stepSolver = null;

  // Initialize DOM cache
  function initDOMCache() {
    if (domCache) return;

    domCache = {
      hplusInput: document.getElementById('hplus-input'),
      hplusPH: document.getElementById('hplus-ph'),
      hplusResult: document.getElementById('hplus-result'),
      ohminusInput: document.getElementById('ohminus-input'),
      ohminusPH: document.getElementById('ohminus-ph'),
      ohminusResult: document.getElementById('ohminus-result'),
      pohInput: document.getElementById('poh-input'),
      pohPH: document.getElementById('poh-ph'),
      pohResult: document.getElementById('poh-result'),
      phIndicator: document.getElementById('ph-indicator'),
      currentPHDisplay: document.getElementById('current-ph'),
      phValue: document.getElementById('current-ph'),
      phDescription: document.getElementById('ph-description'),
      // Step-by-step solver display container
      stepsContainer: document.getElementById('steps-container'),
      // Error display container
      errorContainer: document.getElementById('error-message'),
    };

    // Initialize StepByStepSolver
    stepSolver = new StepByStepSolver();
  }

  // Show error message in-page (replaces alert)
  function showError(message) {
    if (!domCache) initDOMCache();

    if (domCache.errorContainer) {
      domCache.errorContainer.textContent = message;
      domCache.errorContainer.style.display = 'block';

      // Scroll error into view
      domCache.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        domCache.errorContainer.style.display = 'none';
      }, 5000);
    } else {
      // Fallback to console if container not found
      console.error('pH Calculator Error:', message);
    }
  }

  // Hide error message
  function hideError() {
    if (domCache && domCache.errorContainer) {
      domCache.errorContainer.style.display = 'none';
    }
  }

  // Calculate pH from H+ concentration
  function calculateFromHPlus() {
    hideError();

    if (!domCache) initDOMCache();

    const input = domCache.hplusInput.value;
    const hplus = parseFloat(input);

    if (isNaN(hplus) || hplus <= 0) {
      showError('Bitte geben Sie eine positive Zahl ein.');
      return;
    }

    // Initialize solver with fresh steps for this calculation
    if (!stepSolver) stepSolver = new StepByStepSolver();
    stepSolver.clear();

    // Add step 1: Formula explanation
    stepSolver.addStep('Schritt 1: pH aus H⁺-Konzentration berechnen', {
      formula: 'pH = -log₁₀[H⁺]',
      inputs: { '[H⁺]': hplus },
      result: null,
    });

    // Step 2: Do the calculation
    const ph = -Math.log10(hplus);

    // Add step 2: Calculation
    stepSolver.addStep('pH berechnen', {
      formula: 'pH = -log₁₀(' + hplus.toExponential(2) + ')',
      inputs: { '-log₁₀([H⁺])': ph },
      result: ph,
      unit: 'pH',
    });

    // Step 3: Clamp to valid range
    const clampedPH = Math.max(0, Math.min(14, ph));
    if (clampedPH !== ph) {
      stepSolver.addStep('Ergebnis auf gültigen Bereich anpassen', {
        formula: 'pH_clamped = max(0, min(14, ' + ph.toFixed(4) + '))',
        inputs: { pH: ph, pH_clamped: clampedPH },
        result: clampedPH,
        unit: 'pH',
      });
    }

    // Display result
    const phDisplay = clampedPH.toFixed(2);
    domCache.hplusPH.textContent = phDisplay;
    domCache.hplusResult.style.display = 'block';

    // Display step-by-step solution
    if (domCache.stepsContainer) {
      domCache.stepsContainer.innerHTML = stepSolver.renderHTML();
    }

    // Update scale visualization
    updatePHScale(clampedPH);
  }

  // Calculate pH from OH- concentration
  function calculateFromOHMinus() {
    hideError();

    if (!domCache) initDOMCache();

    const input = domCache.ohminusInput.value;
    const ohminus = parseFloat(input);

    if (isNaN(ohminus) || ohminus <= 0) {
      showError('Bitte geben Sie eine positive Zahl ein.');
      return;
    }

    // Initialize solver with fresh steps for this calculation
    if (!stepSolver) stepSolver = new StepByStepSolver();
    stepSolver.clear();

    // Add step 1: Formula explanation and pOH calculation
    stepSolver.addStep('Schritt 1: pOH aus OH⁻-Konzentration berechnen', {
      formula: 'pOH = -log₁₀[OH⁻]',
      inputs: { '[OH⁻]': ohminus },
      result: null,
    });

    // Step 2: Calculate pOH intermediate
    const poh = -Math.log10(ohminus);

    stepSolver.addStep('pOH berechnen', {
      formula: 'pOH = -log₁₀(' + ohminus.toExponential(2) + ')',
      inputs: { '-log₁₀([OH⁻])': poh },
      result: poh,
      unit: 'pOH',
    });

    // Add step 3: Calculate pH from pOH
    stepSolver.addStep('Schritt 2: pH aus pOH berechnen', {
      formula: 'pH + pOH = 14 → pH = 14 - pOH',
      inputs: { pOH: poh },
      result: null,
    });

    // Step 4: Do the pH calculation
    const ph = 14 - poh;

    stepSolver.addStep('pH berechnen', {
      formula: 'pH = 14 - ' + poh.toFixed(4) + '',
      inputs: { '14 - pOH': ph },
      result: ph,
      unit: 'pH',
    });

    // Step 5: Clamp to valid range
    const clampedPH = Math.max(0, Math.min(14, ph));
    if (clampedPH !== ph) {
      stepSolver.addStep('Ergebnis auf gültigen Bereich anpassen', {
        formula: 'pH_clamped = max(0, min(14, ' + ph.toFixed(4) + '))',
        inputs: { pH: ph, pH_clamped: clampedPH },
        result: clampedPH,
        unit: 'pH',
      });
    }

    // Display result
    const phDisplay = clampedPH.toFixed(2);
    domCache.ohminusPH.textContent = phDisplay;
    domCache.ohminusResult.style.display = 'block';

    // Display step-by-step solution
    if (domCache.stepsContainer) {
      domCache.stepsContainer.innerHTML = stepSolver.renderHTML();
    }

    // Update scale visualization
    updatePHScale(clampedPH);
  }

  // Calculate pH from pOH
  function calculateFromPOH() {
    hideError();

    if (!domCache) initDOMCache();

    const input = domCache.pohInput.value;
    const poh = parseFloat(input);

    if (isNaN(poh) || poh < 0 || poh > 14) {
      showError('Bitte geben Sie einen pOH-Wert zwischen 0 und 14 ein.');
      return;
    }

    // Initialize solver with fresh steps for this calculation
    if (!stepSolver) stepSolver = new StepByStepSolver();
    stepSolver.clear();

    // Add step 1: Formula explanation
    stepSolver.addStep('Schritt 1: pH aus pOH berechnen', {
      formula: 'pH + pOH = 14 → pH = 14 - pOH',
      inputs: { pOH: poh },
      result: null,
    });

    // Step 2: Do the calculation
    const ph = 14 - poh;

    stepSolver.addStep('pH berechnen', {
      formula: 'pH = 14 - ' + poh.toFixed(2) + '',
      inputs: { '14 - pOH': ph },
      result: ph,
      unit: 'pH',
    });

    // Display result
    const phDisplay = ph.toFixed(2);
    domCache.pohPH.textContent = phDisplay;
    domCache.pohResult.style.display = 'block';

    // Display step-by-step solution
    if (domCache.stepsContainer) {
      domCache.stepsContainer.innerHTML = stepSolver.renderHTML();
    }

    // Update scale visualization
    updatePHScale(ph);
  }

  // Update pH scale visualization
  function updatePHScale(ph) {
    const indicator = domCache.phIndicator;
    const currentPHDisplay = domCache.currentPHDisplay;
    const phValueSpan = domCache.phValue;
    const phDescription = domCache.phDescription;

    // Update indicator position (0-14 scale)
    const percentage = (ph / 14) * 100;
    indicator.style.left = `calc(${percentage}% - 10px)`;

    // Update current pH display
    phValueSpan.textContent = ph.toFixed(2);

    // Update description based on pH value
    let description = '';
    let colorClass = '';

    if (ph < 2) {
      description = 'Sehr stark sauer 🔴';
      colorClass = 'very-acidic';
    } else if (ph < 4) {
      description = 'Stark sauer 🟠';
      colorClass = 'acidic';
    } else if (ph < 6) {
      description = 'Sauer 🟡';
      colorClass = 'weakly-acidic';
    } else if (ph === 7) {
      description = 'Neutral ⚪';
      colorClass = 'neutral';
    } else if (ph < 8) {
      description = 'Fast neutral 🔵';
      colorClass = 'nearly-neutral';
    } else if (ph < 11) {
      description = 'Basisch 🔷';
      colorClass = 'basic';
    } else {
      description = 'Stark basisch 🟣';
      colorClass = 'strongly-basic';
    }

    phDescription.textContent = description;

    // Update indicator color
    indicator.className = 'ph-indicator ' + colorClass;

    // Animate the display
    currentPHDisplay.classList.add('pulse');
    setTimeout(() => {
      currentPHDisplay.classList.remove('pulse');
    }, 500);
  }

  // Initialize: Set indicator to neutral (pH 7)
  document.addEventListener('DOMContentLoaded', function () {
    initDOMCache();
    updatePHScale(7);

    // Add enter key support for inputs
    domCache.hplusInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') calculateFromHPlus();
    });

    domCache.ohminusInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') calculateFromOHMinus();
    });

    domCache.pohInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') calculateFromPOH();
    });
  });

  // Export calculator functions for HTML onclick handlers
  window.calculateFromHPlus = calculateFromHPlus;
  window.calculateFromOHMinus = calculateFromOHMinus;
  window.calculateFromPOH = calculateFromPOH;
})();
