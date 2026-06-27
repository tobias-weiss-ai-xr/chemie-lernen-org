/**
 * Verdünnungsrechner (Dilution Calculator)
 * Calculates missing variable using dilution law c1*V1 = c2*V2.
 */
(function () {
  'use strict';

  function calculateDilution() {
    const c1Input = document.getElementById('c1-input');
    const c2Input = document.getElementById('c2-input');
    const v1Input = document.getElementById('v1-input');
    const v2Input = document.getElementById('v2-input');

    const c1 = parseFloat(c1Input.value);
    const c2 = parseFloat(c2Input.value);
    const v1 = parseFloat(v1Input.value);
    const v2 = parseFloat(v2Input.value);

    document.getElementById('results-section').style.display = 'none';
    document.getElementById('error-section').style.display = 'none';

    const providedValues = [c1, c2, v1, v2].filter((v) => !isNaN(v)).length;

    if (providedValues < 3) {
      showError('Bitte geben Sie mindestens drei Werte ein.');
      return;
    }

    let result;
    let details;

    if (isNaN(v1)) {
      if (c1 === 0) {
        showError('c₁ darf nicht Null sein.');
        return;
      }
      result = ((c2 * v2) / c1).toFixed(2);
      details = `V₁ = c₂V₂ / c₁ = (${c2} × ${v2}) / ${c1} = ${result} mL`;
      document.getElementById('missing-variable-result').textContent = `V₁ = ${result} mL`;
    } else if (isNaN(v2)) {
      if (c2 === 0) {
        showError('c₂ darf nicht Null sein.');
        return;
      }
      result = ((c1 * v1) / c2).toFixed(2);
      details = `V₂ = c₁V₁ / c₂ = (${c1} × ${v1}) / ${c2} = ${result} mL`;
      document.getElementById('missing-variable-result').textContent = `V₂ = ${result} mL`;
    } else if (isNaN(c2)) {
      if (v2 === 0) {
        showError('V₂ darf nicht Null sein.');
        return;
      }
      result = ((c1 * v1) / v2).toFixed(4);
      details = `c₂ = c₁V₁ / V₂ = (${c1} × ${v1}) / ${v2} = ${result} mol/L`;
      document.getElementById('missing-variable-result').textContent = `c₂ = ${result} mol/L`;
    } else if (isNaN(c1)) {
      if (v1 === 0) {
        showError('V₁ darf nicht Null sein.');
        return;
      }
      result = ((c2 * v2) / v1).toFixed(4);
      details = `c₁ = c₂V₂ / V₁ = (${c2} × ${v2}) / ${v1} = ${result} mol/L`;
      document.getElementById('missing-variable-result').textContent = `c₁ = ${result} mol/L`;
    } else {
      const leftSide = c1 * v1;
      const rightSide = c2 * v2;
      const diff = Math.abs(leftSide - rightSide);
      const tolerance = 0.01;
      if (diff > tolerance) {
        details = `Abweichung: ${diff.toFixed(4)} (tolerierbar bis ${tolerance})`;
      } else {
        details = 'Verdünnungsgesetz bestätigt ✓';
      }
      document.getElementById('missing-variable-result').textContent =
        diff > tolerance ? 'Nicht konsistent' : 'Konsistent';
    }

    document.getElementById('calculation-details').innerHTML = details;
    document.getElementById('results-section').style.display = 'block';
    applyResultUpdatedAnimation();
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

  const inputs = ['c1-input', 'c2-input', 'v1-input', 'v2-input'];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          calculateDilution();
        }
      });
    }
  });
})();
