/**
 * Dichte-Rechner (Density Calculator)
 * Calculates density from mass and volume, or finds missing variable.
 */
(function () {
  'use strict';

  function calculateDensity() {
    const massInput = document.getElementById('mass-input');
    const volumeInput = document.getElementById('volume-input');
    const mass = parseFloat(massInput.value);
    const volume = parseFloat(volumeInput.value);

    // Hide previous results/errors
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('error-section').style.display = 'none';

    // Check if both inputs are empty
    if (isNaN(mass) && isNaN(volume)) {
      showError('Bitte geben Sie mindestens Masse oder Volumen ein.');
      return;
    }

    // Calculate density if both mass and volume are provided
    if (!isNaN(mass) && !isNaN(volume)) {
      if (volume === 0) {
        showError('Volumen darf nicht Null sein.');
        return;
      }

      const density = mass / volume;
      const densityFixed = density.toFixed(3);

      const details = `
        <div class="calculation-step">
          <strong>Formel:</strong> ρ = m / V
        </div>
        <div class="calculation-step">
          <strong>Eingabe:</strong> m = ${mass} g, V = ${volume} mL
        </div>
        <div class="calculation-step">
          <strong>Berechnung:</strong> ρ = ${mass} / ${volume}
        </div>
        <div class="calculation-step">
          <strong>Ergebnis:</strong> ρ = ${densityFixed} g/mL
        </div>
      `;

      document.getElementById('density-value').textContent = densityFixed;
      document.getElementById('calculation-details').innerHTML = details;
      document.getElementById('results-section').style.display = 'block';
      applyResultUpdatedAnimation();
    }
    // Find missing variable if one is provided
    else if (!isNaN(mass)) {
      showError('Bitte geben Sie das Volumen ein, um die Dichte zu berechnen.');
    } else if (!isNaN(volume)) {
      showError('Bitte geben Sie die Masse ein, um die Dichte zu berechnen.');
    }
  }

  function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-section').style.display = 'block';
  }

  function applyResultUpdatedAnimation() {
    const resultsSection = document.getElementById('results-section');
    resultsSection.classList.add('result-updated');
    setTimeout(() => {
      resultsSection.classList.remove('result-updated');
    }, 1000);
  }

  // Initialize
  if (document.getElementById('mass-input')) {
    document.getElementById('mass-input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        calculateDensity();
      }
    });

    document.getElementById('volume-input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        calculateDensity();
      }
    });
  }
})();