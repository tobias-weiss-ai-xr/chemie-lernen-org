// pH Calculator JavaScript

// Constants
const _KW_25C = 1e-14; // Water ion product at 25°C

// DOM element cache for performance
let domCache = null;

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
    phDescription: document.getElementById('ph-description')
  };
}

// Calculate pH from H+ concentration
function calculateFromHPlus() {
  const input = domCache.hplusInput.value;
  const hplus = parseFloat(input);

  if (isNaN(hplus) || hplus <= 0) {
    alert('Bitte geben Sie eine positive Zahl ein.');
    return;
  }

  // Calculate pH: pH = -log10[H+]
  const ph = -Math.log10(hplus);

  // Clamp pH to reasonable range (0-14)
  const clampedPH = Math.max(0, Math.min(14, ph));

  // Display result
  const phDisplay = clampedPH.toFixed(2);
  domCache.hplusPH.textContent = phDisplay;
  domCache.hplusResult.style.display = 'block';

  // Update scale visualization
  updatePHScale(clampedPH);
}

// Calculate pH from OH- concentration
function calculateFromOHMinus() {
  const input = domCache.ohminusInput.value;
  const ohminus = parseFloat(input);

  if (isNaN(ohminus) || ohminus <= 0) {
    alert('Bitte geben Sie eine positive Zahl ein.');
    return;
  }

  // First calculate pOH: pOH = -log10[OH-]
  const poh = -Math.log10(ohminus);

  // Then calculate pH: pH = 14 - pOH (at 25°C)
  const ph = 14 - poh;

  // Clamp pH to reasonable range (0-14)
  const clampedPH = Math.max(0, Math.min(14, ph));

  // Display result
  const phDisplay = clampedPH.toFixed(2);
  domCache.ohminusPH.textContent = phDisplay;
  domCache.ohminusResult.style.display = 'block';

  // Update scale visualization
  updatePHScale(clampedPH);
}

// Calculate pH from pOH
function calculateFromPOH() {
  const input = domCache.pohInput.value;
  const poh = parseFloat(input);

  if (isNaN(poh) || poh < 0 || poh > 14) {
    alert('Bitte geben Sie einen pOH-Wert zwischen 0 und 14 ein.');
    return;
  }

  // Calculate pH: pH = 14 - pOH
  const ph = 14 - poh;

  // Display result
  const phDisplay = ph.toFixed(2);
  domCache.pohPH.textContent = phDisplay;
  domCache.pohResult.style.display = 'block';

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
document.addEventListener('DOMContentLoaded', function() {
  initDOMCache();
  updatePHScale(7);

  // Add enter key support for inputs
  domCache.hplusInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateFromHPlus();
  });

  domCache.ohminusInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateFromOHMinus();
  });

  domCache.pohInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateFromPOH();
  });
});

