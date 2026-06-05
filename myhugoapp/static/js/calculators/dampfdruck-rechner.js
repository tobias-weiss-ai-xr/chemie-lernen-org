/**
 * Dampfdruck-Rechner
 * Berechnet Dampfdruck nach Clausius-Clapeyron-Gleichung
 */
(function() {
  'use strict';

  var form = document.getElementById('dampfdruck-form');
  var resultBox = document.getElementById('result');
  var pressureBarEl = document.getElementById('pressure-bar');
  var pressurePaEl = document.getElementById('pressure-pa');
  var pressureKpaEl = document.getElementById('pressure-kpa');
  var comparisonEl = document.getElementById('comparison');

  if (!form || !resultBox) {
    console.log('[dampfdruck-rechner] Form or result box not found');
    return;
  }

  function calculateVaporPressure(temperatureC, normalPressure, boilingPointC) {
    var temperatureK = temperatureC + 273.15;
    var boilingPointK = boilingPointC + 273.15;

    if (temperatureK <= 0 || boilingPointK <= 0) {
      throw new Error('Temperatur muss größer als 0 K sein');
    }

    var deltaT = 1 / temperatureK - 1 / boilingPointK;
    var pressure = normalPressure * Math.exp(-8860 * deltaT);

    pressure = Math.max(0, pressure);

    return pressure;
  }

  function formatNumber(num, decimals) {
    return Number(num).toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function getResultText(pressure, normalPressure) {
    var ratio = pressure / normalPressure;
    var text = '';

    if (ratio < 0.01) {
      text = 'Sehr niedrig (weniger als 1% des Normaldrucks) — Flüssigkeit siedet nicht';
    } else if (ratio < 0.1) {
      text = 'Niedrig (weniger als 10% des Normaldrucks)';
    } else if (ratio < 0.5) {
      text = 'Mittelmäßig (weniger als die Hälfte des Normaldrucks)';
    } else if (ratio < 0.9) {
      text = 'Hoch (nahe am Normaldruck)';
    } else if (ratio < 1.1) {
      text = 'Sehr hoch (um den Normaldruck)';
    } else {
      text = 'Überkritisch (höher als Normaldruck)';
    }

    return text;
  }

  function handleSubmit(e) {
    e.preventDefault();

    var temperatureC = parseFloat(document.getElementById('temperature').value);
    var normalPressure = parseFloat(document.getElementById('normal-pressure').value);
    var boilingPointC = parseFloat(document.getElementById('boiling-point').value);

    if (isNaN(temperatureC) || isNaN(normalPressure) || isNaN(boilingPointC)) {
      alert('Bitte geben Sie alle Werte ein.');
      return;
    }

    try {
      var pressure = calculateVaporPressure(temperatureC, normalPressure, boilingPointC);

      pressureBarEl.textContent = formatNumber(pressure, 3);
      pressurePaEl.textContent = formatNumber(pressure * 1e5, 0);
      pressureKpaEl.textContent = formatNumber(pressure * 100, 1);
      comparisonEl.textContent = getResultText(pressure, normalPressure);

      resultBox.classList.remove('hidden');
    } catch (error) {
      alert('Fehler bei der Berechnung: ' + error.message);
    }
  }

  form.addEventListener('submit', handleSubmit);
})();