/**
 * Verduennungsreihen-Rechner
 * Berechnet Konzentrationen in 1:2-Verduennungsreihe
 */

function formatConcentration(conc, unit) {
  let value;
  switch (unit) {
    case 'mol/L':
      value = conc;
      break;
    case 'mM':
      value = conc * 1000;
      break;
    case 'μM':
      value = conc * 1000000;
      break;
    case 'g/L':
      value = conc;
      break;
    case 'mg/mL':
      value = conc;
      break;
    default:
      value = conc;
  }

  if (value >= 0.001 || value <= -0.001) {
    return value.toExponential(2);
  } else {
    return value.toFixed(2);
  }
}

function calculateDilutionSeries(initialConc, numSteps) {
  const series = [];
  for (let n = 0; n <= numSteps; n++) {
    const conc = initialConc * Math.pow(0.5, n);
    const dilutionFactor = Math.pow(2, n);

    series.push({
      step: n,
      dilutionRatio: '1:' + dilutionFactor,
      concentration: conc,
      dilutionFactor: dilutionFactor
    });
  }
  return series;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateDilutionSeries, formatConcentration };
}

(function() {
  'use strict';

  const form = document.getElementById('verduennungsreihen-form');
  const resultBox = document.getElementById('result');
  const dilutionTable = document.getElementById('dilution-table');

  if (!form || !resultBox) {
    return;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const initialConc = parseFloat(document.getElementById('initial-concentration').value);
    const numSteps = parseInt(document.getElementById('num-steps').value, 10);
    const unit = document.getElementById('unit').value;

    if (isNaN(initialConc) || isNaN(numSteps) || numSteps < 1 || numSteps > 20) {
      showToast('Bitte geben Sie gltige Werte ein.', 'error');
      return;
    }

    const series = calculateDilutionSeries(initialConc, numSteps);

    let html = '';
    for (let i = 0; i < series.length; i++) {
      const step = series[i];
      html += '<tr>';
      html += '<td>' + step.step + '</td>';
      html += '<td>' + step.dilutionRatio + '</td>';
      html += '<td>' + formatConcentration(step.concentration, unit) + ' ' + unit + '</td>';
      html += '<td>' + step.dilutionFactor + 'x</td>';
      html += '</tr>';
    }

    dilutionTable.innerHTML = html;
    resultBox.classList.remove('hidden');
  }

  form.addEventListener('submit', handleSubmit);
})();
