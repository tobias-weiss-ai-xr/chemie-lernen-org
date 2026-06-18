/**
 * Dampfdruck-Rechner
 * Berechnet Dampfdruck nach Clausius-Clapeyron-Gleichung
 */

function calculateVaporPressure(temperatureC, normalPressure, boilingPointC) {
  const temperatureK = temperatureC + 273.15;
  const boilingPointK = boilingPointC + 273.15;

  if (temperatureK <= 0 || boilingPointK <= 0) {
    throw new Error('Temperatur muss größer als 0 K sein');
  }

  const deltaT = 1 / temperatureK - 1 / boilingPointK;
  let pressure = normalPressure * Math.exp(-8860 * deltaT);

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
  const ratio = pressure / normalPressure;
  let text = '';

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateVaporPressure, formatNumber, getResultText };
}

(function() {
  'use strict';

  const form = document.getElementById('dampfdruck-form');
  const resultBox = document.getElementById('result');
  const pressureBarEl = document.getElementById('pressure-bar');
  const pressurePaEl = document.getElementById('pressure-pa');
  const pressureKpaEl = document.getElementById('pressure-kpa');
  const comparisonEl = document.getElementById('comparison');

  if (!form || !resultBox) {
    return;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const temperatureC = parseFloat(document.getElementById('temperature').value);
    const normalPressure = parseFloat(document.getElementById('normal-pressure').value);
    const boilingPointC = parseFloat(document.getElementById('boiling-point').value);

    if (isNaN(temperatureC) || isNaN(normalPressure) || isNaN(boilingPointC)) {
      showToast('Bitte geben Sie alle Werte ein.', 'error');
      return;
    }

    try {
      const pressure = calculateVaporPressure(temperatureC, normalPressure, boilingPointC);

      pressureBarEl.textContent = formatNumber(pressure, 3);
      pressurePaEl.textContent = formatNumber(pressure * 1e5, 0);
      pressureKpaEl.textContent = formatNumber(pressure * 100, 1);
      comparisonEl.textContent = getResultText(pressure, normalPressure);

      resultBox.classList.remove('hidden');
    } catch (error) {
      showToast('Fehler bei der Berechnung: ' + error.message, 'error');
    }
  }

  form.addEventListener('submit', handleSubmit);
})();
