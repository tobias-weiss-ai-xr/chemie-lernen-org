/**
 * Verduennungsreihen-Rechner
 * Berechnet Konzentrationen in 1:2-Verduennungsreihe
 */
(function() {
  'use strict';

  var form = document.getElementById('verduennungsreihen-form');
  var resultBox = document.getElementById('result');
  var dilutionTable = document.getElementById('dilution-table');

  if (!form || !resultBox) {
    return;
  }

  function formatConcentration(conc, unit) {
    var value;
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
    var series = [];
    for (var n = 0; n <= numSteps; n++) {
      var conc = initialConc * Math.pow(0.5, n);
      var dilutionFactor = Math.pow(2, n);

      series.push({
        step: n,
        dilutionRatio: '1:' + dilutionFactor,
        concentration: conc,
        dilutionFactor: dilutionFactor
      });
    }
    return series;
  }

  function handleSubmit(e) {
    e.preventDefault();

    var initialConc = parseFloat(document.getElementById('initial-concentration').value);
    var numSteps = parseInt(document.getElementById('num-steps').value, 10);
    var unit = document.getElementById('unit').value;

    if (isNaN(initialConc) || isNaN(numSteps) || numSteps < 1 || numSteps > 20) {
      alert('Bitte geben Sie gltige Werte ein.');
      return;
    }

    var series = calculateDilutionSeries(initialConc, numSteps);

    var html = '';
    for (var i = 0; i < series.length; i++) {
      var step = series[i];
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