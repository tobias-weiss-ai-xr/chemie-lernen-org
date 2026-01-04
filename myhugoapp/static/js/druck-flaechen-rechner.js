/**
 * Druck und Fläche Rechner
 * Berechnet Zusammenhänge zwischen Druck, Kraft und Fläche
 */

// Conversion factors to Pascal (SI unit)
const DRUCK_EINHEITEN = {
  Pa: 1,
  kPa: 1000,
  MPa: 1000000,
  bar: 100000,
  mbar: 100,
};

const KRAFT_EINHEITEN = {
  N: 1,
  kN: 1000,
  MN: 1000000,
};

const FLAECHE_EINHEITEN = {
  m2: 1,
  cm2: 0.0001,
  mm2: 0.000001,
};

// Store calculated values for unit conversion
let aktuellerDruckPa = 0;
let aktuelleKraftN = 0;
let aktuelleFlaecheM2 = 0;

// ===== Druck berechnen (p = F / A) =====
function berechneDruck() {
  const kraft = parseFloat(document.getElementById('druck-kraft').value);
  const kraftEinheit = document.getElementById('druck-kraft-einheit').value;
  const flaeche = parseFloat(document.getElementById('druck-flaeche').value);
  const flaecheEinheit = document.getElementById('druck-flaeche-einheit').value;

  if (isNaN(kraft) || isNaN(flaeche) || kraft < 0 || flaeche <= 0) {
    alert('Bitte geben Sie gültige Werte ein (Kraft ≥ 0, Fläche > 0).');
    return;
  }

  // Convert to SI units
  const kraftN = kraft * KRAFT_EINHEITEN[kraftEinheit];
  const flaecheM2 = flaeche * FLAECHE_EINHEITEN[flaecheEinheit];

  // Calculate pressure
  const druckPa = kraftN / flaecheM2;

  // Store for unit conversion
  aktuellerDruckPa = druckPa;

  // Display result
  zeigeDruckErgebnis(druckPa);
}

function zeigeDruckErgebnis(druckPa) {
  const ergebnisEinheit = document.getElementById('druck-ergebnis-einheit').value;
  const druckKonvertiert = druckPa / DRUCK_EINHEITEN[ergebnisEinheit];

  document.getElementById('druck-wert').textContent = formatiereZahl(druckKonvertiert);
  document.getElementById('druck-result').style.display = 'block';

  // Show comparison
  const vergleich = getDruckVergleich(druckPa);
  document.getElementById('druck-vergleich').innerHTML = vergleich;
}

function konvertiereDruck() {
  if (aktuellerDruckPa === 0) return;

  const ergebnisEinheit = document.getElementById('druck-ergebnis-einheit').value;
  const druckKonvertiert = aktuellerDruckPa / DRUCK_EINHEITEN[ergebnisEinheit];

  document.getElementById('druck-wert').textContent = formatiereZahl(druckKonvertiert);
}

// ===== Kraft berechnen (F = p × A) =====
function berechneKraft() {
  const druck = parseFloat(document.getElementById('kraft-druck').value);
  const druckEinheit = document.getElementById('kraft-druck-einheit').value;
  const flaeche = parseFloat(document.getElementById('kraft-flaeche').value);
  const flaecheEinheit = document.getElementById('kraft-flaeche-einheit').value;

  if (isNaN(druck) || isNaN(flaeche) || druck < 0 || flaeche < 0) {
    alert('Bitte geben Sie gültige Werte ein (Druck ≥ 0, Fläche ≥ 0).');
    return;
  }

  // Convert to SI units
  const druckPa = druck * DRUCK_EINHEITEN[druckEinheit];
  const flaecheM2 = flaeche * FLAECHE_EINHEITEN[flaecheEinheit];

  // Calculate force
  const kraftN = druckPa * flaecheM2;

  // Store for unit conversion
  aktuelleKraftN = kraftN;

  // Display result
  zeigeKraftErgebnis(kraftN);
}

function zeigeKraftErgebnis(kraftN) {
  const ergebnisEinheit = document.getElementById('kraft-ergebnis-einheit').value;
  const kraftKonvertiert = kraftN / KRAFT_EINHEITEN[ergebnisEinheit];

  document.getElementById('kraft-wert').textContent = formatiereZahl(kraftKonvertiert);
  document.getElementById('kraft-result').style.display = 'block';

  // Show comparison
  const vergleich = getKraftVergleich(kraftN);
  document.getElementById('kraft-vergleich').innerHTML = vergleich;
}

function konvertiereKraft() {
  if (aktuelleKraftN === 0) return;

  const ergebnisEinheit = document.getElementById('kraft-ergebnis-einheit').value;
  const kraftKonvertiert = aktuelleKraftN / KRAFT_EINHEITEN[ergebnisEinheit];

  document.getElementById('kraft-wert').textContent = formatiereZahl(kraftKonvertiert);
}

// ===== Fläche berechnen (A = F / p) =====
function berechneFlaeche() {
  const kraft = parseFloat(document.getElementById('flaeche-kraft').value);
  const kraftEinheit = document.getElementById('flaeche-kraft-einheit').value;
  const druck = parseFloat(document.getElementById('flaeche-druck').value);
  const druckEinheit = document.getElementById('flaeche-druck-einheit').value;

  if (isNaN(kraft) || isNaN(druck) || kraft < 0 || druck <= 0) {
    alert('Bitte geben Sie gültige Werte ein (Kraft ≥ 0, Druck > 0).');
    return;
  }

  // Convert to SI units
  const kraftN = kraft * KRAFT_EINHEITEN[kraftEinheit];
  const druckPa = druck * DRUCK_EINHEITEN[druckEinheit];

  // Calculate area
  const flaecheM2 = kraftN / druckPa;

  // Store for unit conversion
  aktuelleFlaecheM2 = flaecheM2;

  // Display result
  zeigeFlaecheErgebnis(flaecheM2);
}

function zeigeFlaecheErgebnis(flaecheM2) {
  const ergebnisEinheit = document.getElementById('flaeche-ergebnis-einheit').value;
  const flaecheKonvertiert = flaecheM2 / FLAECHE_EINHEITEN[ergebnisEinheit];

  document.getElementById('flaeche-wert').textContent = formatiereZahl(flaecheKonvertiert);
  document.getElementById('flaeche-result').style.display = 'block';

  // Show area visualization
  visualisiereFlaeche(flaecheM2);
}

function konvertiereFlaeche() {
  if (aktuelleFlaecheM2 === 0) return;

  const ergebnisEinheit = document.getElementById('flaeche-ergebnis-einheit').value;
  const flaecheKonvertiert = aktuelleFlaecheM2 / FLAECHE_EINHEITEN[ergebnisEinheit];

  document.getElementById('flaeche-wert').textContent = formatiereZahl(flaecheKonvertiert);

  // Update visualization
  visualisiereFlaeche(aktuelleFlaecheM2);
}

// ===== Visual Piston Demonstration =====
function initPistonDemo() {
  updatePiston();
}

function updatePiston() {
  const kraft = parseInt(document.getElementById('kraft-slider').value);
  const flaeche = parseInt(document.getElementById('flaeche-slider').value);

  document.getElementById('kraft-display').textContent = `${kraft} N`;
  document.getElementById('flaeche-display').textContent = `${flaeche} cm²`;

  // Calculate pressure
  const flaecheM2 = flaeche * FLAECHE_EINHEITEN.cm2;
  const druckPa = kraft / flaecheM2;
  const druckKPa = druckPa / 1000;

  document.getElementById('visual-pressure').textContent = formatiereZahl(druckKPa);

  // Update pressure bar (max 1000 kPa for visualization)
  const prozent = Math.min((druckKPa / 1000) * 100, 100);
  document.getElementById('pressure-fill').style.width = `${prozent}%`;

  // Draw piston
  drawPiston(kraft, flaeche, druckKPa);
}

function drawPiston(kraft, flaeche, druckKPa) {
  const canvas = document.getElementById('piston-canvas');
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cylinder dimensions
  const cylX = 100;
  const cylY = 100;
  const cylWidth = 200;
  const cylHeight = 150;

  // Piston head width (proportional to area, but scaled for visibility)
  const pistonWidth = 50 + (flaeche / 100) * 100;
  const pistonHeight = 30;

  // Pressure color (green to red gradient)
  const pressureProzent = Math.min(druckKPa / 1000, 1);
  const rot = Math.floor(pressureProzent * 255);
  const gruen = Math.floor((1 - pressureProzent) * 255);
  const farbe = `rgb(${rot}, ${gruen}, 0)`;

  // Draw cylinder
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.strokeRect(cylX, cylY, cylWidth, cylHeight);

  // Draw fluid
  ctx.fillStyle = `rgba(0, 100, 255, 0.3)`;
  ctx.fillRect(cylX + 2, cylY + pistonHeight + 20, cylWidth - 4, cylHeight - pistonHeight - 22);

  // Draw piston
  const pistonX = cylX + (cylWidth - pistonWidth) / 2;
  ctx.fillStyle = farbe;
  ctx.fillRect(pistonX, cylY + 20, pistonWidth, pistonHeight);

  // Draw force arrow
  const arrowX = cylX + cylWidth / 2;
  const arrowY = cylY + 10;
  const arrowSize = 20 + (kraft / 10000) * 30;

  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX, arrowY - arrowSize);
  ctx.lineTo(arrowX - 10, arrowY - arrowSize + 15);
  ctx.moveTo(arrowX, arrowY - arrowSize);
  ctx.lineTo(arrowX + 10, arrowY - arrowSize + 15);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`F = ${kraft} N`, arrowX + 40, arrowY - arrowSize / 2);
  ctx.fillText(`A = ${flaeche} cm²`, cylX + cylWidth / 2, cylY + cylHeight + 20);
  ctx.fillText(`p = ${formatiereZahl(druckKPa)} kPa`, cylX + cylWidth / 2, cylY + cylHeight + 40);
}

// ===== Area Visualization =====
function visualisiereFlaeche(flaecheM2) {
  const container = document.getElementById('area-visualization');

  // Calculate dimensions for a square with that area
  const seitenlaengeM = Math.sqrt(flaecheM2);

  // Convert to appropriate units
  let seitenlaenge, einheit;
  if (seitenlaengeM >= 1) {
    seitenlaenge = seitenlaengeM;
    einheit = 'm';
  } else if (seitenlaengeM >= 0.01) {
    seitenlaenge = seitenlaengeM * 100;
    einheit = 'cm';
  } else {
    seitenlaenge = seitenlaengeM * 1000;
    einheit = 'mm';
  }

  container.innerHTML = `
    <div class="area-visual">
      <h4>Quadratische Fläche mit gleicher Größe:</h4>
      <div class="square-demo" style="width: ${Math.min(seitenlaenge * 50, 150)}px; height: ${Math.min(seitenlaenge * 50, 150)}px;">
      </div>
      <p>Seitenlänge: ${formatiereZahl(seitenlaenge)} ${einheit}</p>
      <p>Fläche: ${formatiereZahl(flaecheM2)} m²</p>
    </div>
  `;
}

// ===== Comparison Functions =====
function getDruckVergleich(druckPa) {
  if (druckPa < 1000) {
    return (
      '<p><i class="fa fa-info-circle"></i> Das entspricht etwa <strong>' +
      formatiereZahl(druckPa * 0.01) +
      ' mbar</strong> - sehr niedriger Druck (Vakuumbereich)</p>'
    );
  } else if (druckPa < 100000) {
    return (
      '<p><i class="fa fa-info-circle"></i> Das entspricht etwa <strong>' +
      formatiereZahl(druckPa / 1000) +
      ' kPa</strong> - im Bereich von leichten Überdruck</p>'
    );
  } else if (druckPa < 500000) {
    return '<p><i class="fa fa-car"></i> Das ist vergleichbar mit dem Druck in einem <strong>Autoreifen</strong> (~2-3 bar)</p>';
  } else if (druckPa < 1000000) {
    return '<p><i class="fa fa-tint"></i> Das ist vergleichbar mit dem Druck in einer <strong>Flaschenöffnung</strong> (~3-5 bar)</p>';
  } else {
    return '<p><i class="fa fa-wrench"></i> Das ist Bereich einer <strong>hydraulischen Presse</strong> (>10 bar)</p>';
  }
}

function getKraftVergleich(kraftN) {
  const gewichtKg = kraftN / 9.81;

  if (kraftN < 10) {
    return '<p><i class="fa fa-hand-paper-o"></i> Das ist etwa die Kraft zum <strong>Heben eines Taschentuchs</strong></p>';
  } else if (kraftN < 100) {
    return (
      '<p><i class="fa fa-shopping-basket"></i> Das entspricht dem Gewicht von etwa <strong>' +
      formatiereZahl(gewichtKg) +
      ' kg</strong> (leichte Einkaufstasche)</p>'
    );
  } else if (kraftN < 1000) {
    return (
      '<p><i class="fa fa-child"></i> Das entspricht dem Gewicht von etwa <strong>' +
      formatiereZahl(gewichtKg) +
      ' kg</strong> (Kind oder schwerer Einkauf)</p>'
    );
  } else if (kraftN < 10000) {
    return (
      '<p><i class="fa fa-car"></i> Das entspricht dem Gewicht von etwa <strong>' +
      formatiereZahl(gewichtKg) +
      ' kg</strong> (Kleinwagen)</p>'
    );
  } else {
    return (
      '<p><i class="fa fa-truck"></i> Das entspricht dem Gewicht von etwa <strong>' +
      formatiereZahl(gewichtKg) +
      ' kg</strong> (LKW oder schwereres Fahrzeug)</p>'
    );
  }
}

// ===== Utility Functions =====
function formatiereZahl(zahl) {
  if (isNaN(zahl)) return '0';

  if (zahl === 0) return '0';

  // Use German locale formatting
  if (Math.abs(zahl) >= 0.01 && Math.abs(zahl) < 10000) {
    return zahl.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  } else if (Math.abs(zahl) < 0.01) {
    return zahl.toExponential(2);
  } else {
    return zahl.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  initPistonDemo();
});
