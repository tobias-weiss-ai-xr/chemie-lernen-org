// pH Calculator JavaScript

// Constants
const _KW_25C = 1e-14; // Water ion product at 25°C

// Calculate pH from H+ concentration
function calculateFromHPlus() {
  const input = document.getElementById('hplus-input').value;
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
  document.getElementById('hplus-ph').textContent = phDisplay;
  document.getElementById('hplus-result').style.display = 'block';

  // Update scale visualization
  updatePHScale(clampedPH);
}

// Calculate pH from OH- concentration
function calculateFromOHMinus() {
  const input = document.getElementById('ohminus-input').value;
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
  document.getElementById('ohminus-ph').textContent = phDisplay;
  document.getElementById('ohminus-result').style.display = 'block';

  // Update scale visualization
  updatePHScale(clampedPH);
}

// Calculate pH from pOH
function calculateFromPOH() {
  const input = document.getElementById('poh-input').value;
  const poh = parseFloat(input);

  if (isNaN(poh) || poh < 0 || poh > 14) {
    alert('Bitte geben Sie einen pOH-Wert zwischen 0 und 14 ein.');
    return;
  }

  // Calculate pH: pH = 14 - pOH
  const ph = 14 - poh;

  // Display result
  const phDisplay = ph.toFixed(2);
  document.getElementById('poh-ph').textContent = phDisplay;
  document.getElementById('poh-result').style.display = 'block';

  // Update scale visualization
  updatePHScale(ph);
}

// Update pH scale visualization
function updatePHScale(ph) {
  const indicator = document.getElementById('ph-indicator');
  const currentPHDisplay = document.getElementById('current-ph');
  const phValueSpan = document.getElementById('current-ph');
  const phDescription = document.getElementById('ph-description');

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
  updatePHScale(7);

  // Add enter key support for inputs
  document.getElementById('hplus-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateFromHPlus();
  });

  document.getElementById('ohminus-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateFromOHMinus();
  });

  document.getElementById('poh-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateFromPOH();
  });
});
