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

let aktuellerDruckPa = 0;
let aktuelleKraftN = 0;
let aktuelleFlaecheM2 = 0;

function formatiereZahl(zahl) {
  if (isNaN(zahl)) return '0';
  if (zahl === 0) return '0';

  if (Math.abs(zahl) >= 0.01 && Math.abs(zahl) < 10000) {
    return zahl.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  } else if (Math.abs(zahl) < 0.01) {
    return zahl.toExponential(2);
  } else {
    return zahl.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  }
}

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

function visualisiereFlaeche(flaecheM2) {
  const container = document.getElementById('area-visualization');
  if (!container) return;

  const seitenlaengeM = Math.sqrt(flaecheM2);

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

const druckCalculatorConfig = {
  title: 'Druck Rechner',
  inputFields: [
    {
      id: 'druck-kraft',
      type: 'number',
      label: 'Kraft',
      placeholder: 'z.B. 100'
    },
    {
      id: 'druck-kraft-einheit',
      type: 'select',
      label: 'Krafteinheit'
    },
    {
      id: 'druck-flaeche',
      type: 'number',
      label: 'Fläche',
      placeholder: 'z.B. 0.01'
    },
    {
      id: 'druck-flaeche-einheit',
      type: 'select',
      label: 'Flächeneinheit'
    }
  ],
  resultFields: [
    { id: 'druck-wert', label: 'Druck' },
    { id: 'druck-vergleich', label: 'Vergleich' }
  ],
  validation: {
    'druck-kraft': {
      type: 'number',
      min: 0,
      errorMessage: 'Bitte geben Sie eine gültige Kraft ≥ 0 ein.'
    },
    'druck-flaeche': {
      type: 'number',
      min: 0.000001,
      errorMessage: 'Bitte geben Sie eine gültige Fläche > 0 ein.'
    }
  },
  calculations: {
    calculate: function(inputs) {
      const kraft = inputs['druck-kraft'];
      const kraftEinheit = inputs['druck-kraft-einheit'];
      const flaeche = inputs['druck-flaeche'];
      const flaecheEinheit = inputs['druck-flaeche-einheit'];
      const ergebnisEinheit = document.getElementById('druck-ergebnis-einheit')?.value || 'Pa';

      const kraftN = kraft * KRAFT_EINHEITEN[kraftEinheit];
      const flaecheM2 = flaeche * FLAECHE_EINHEITEN[flaecheEinheit];

      const druckPa = kraftN / flaecheM2;
      aktuellerDruckPa = druckPa;

      const druckKonvertiert = druckPa / DRUCK_EINHEITEN[ergebnisEinheit];

      return {
        'druck-wert': `${formatiereZahl(druckKonvertiert)} ${ergebnisEinheit}`,
        'druck-vergleich': getDruckVergleich(druckPa)
      };
    }
  }
};

const kraftCalculatorConfig = {
  title: 'Kraft Rechner',
  inputFields: [
    {
      id: 'kraft-druck',
      type: 'number',
      label: 'Druck',
      placeholder: 'z.B. 100000'
    },
    {
      id: 'kraft-druck-einheit',
      type: 'select',
      label: 'Druckeinheit'
    },
    {
      id: 'kraft-flaeche',
      type: 'number',
      label: 'Fläche',
      placeholder: 'z.B. 0.01'
    },
    {
      id: 'kraft-flaeche-einheit',
      type: 'select',
      label: 'Flächeneinheit'
    }
  ],
  resultFields: [
    { id: 'kraft-wert', label: 'Kraft' },
    { id: 'kraft-vergleich', label: 'Vergleich' }
  ],
  validation: {
    'kraft-druck': {
      type: 'number',
      min: 0,
      errorMessage: 'Bitte geben Sie einen gültigen Druck ≥ 0 ein.'
    },
    'kraft-flaeche': {
      type: 'number',
      min: 0.000001,
      errorMessage: 'Bitte geben Sie eine gültige Fläche ≥ 0 ein.'
    }
  },
  calculations: {
    calculate: function(inputs) {
      const druck = inputs['kraft-druck'];
      const druckEinheit = inputs['kraft-druck-einheit'];
      const flaeche = inputs['kraft-flaeche'];
      const flaecheEinheit = inputs['kraft-flaeche-einheit'];
      const ergebnisEinheit = document.getElementById('kraft-ergebnis-einheit')?.value || 'N';

      const druckPa = druck * DRUCK_EINHEITEN[druckEinheit];
      const flaecheM2 = flaeche * FLAECHE_EINHEITEN[flaecheEinheit];

      const kraftN = druckPa * flaecheM2;
      aktuelleKraftN = kraftN;

      const kraftKonvertiert = kraftN / KRAFT_EINHEITEN[ergebnisEinheit];

      return {
        'kraft-wert': `${formatiereZahl(kraftKonvertiert)} ${ergebnisEinheit}`,
        'kraft-vergleich': getKraftVergleich(kraftN)
      };
    }
  }
};

const flaecheCalculatorConfig = {
  title: 'Fläche Rechner',
  inputFields: [
    {
      id: 'flaeche-kraft',
      type: 'number',
      label: 'Kraft',
      placeholder: 'z.B. 100'
    },
    {
      id: 'flaeche-kraft-einheit',
      type: 'select',
      label: 'Krafteinheit'
    },
    {
      id: 'flaeche-druck',
      type: 'number',
      label: 'Druck',
      placeholder: 'z.B. 100000'
    },
    {
      id: 'flaeche-druck-einheit',
      type: 'select',
      label: 'Druckeinheit'
    }
  ],
  resultFields: [
    { id: 'flaeche-wert', label: 'Fläche' }
  ],
  validation: {
    'flaeche-kraft': {
      type: 'number',
      min: 0,
      errorMessage: 'Bitte geben Sie eine gültige Kraft ≥ 0 ein.'
    },
    'flaeche-druck': {
      type: 'number',
      min: 0.000001,
      errorMessage: 'Bitte geben Sie einen gültigen Druck > 0 ein.'
    }
  },
  calculations: {
    calculate: function(inputs) {
      const kraft = inputs['flaeche-kraft'];
      const kraftEinheit = inputs['flaeche-kraft-einheit'];
      const druck = inputs['flaeche-druck'];
      const druckEinheit = inputs['flaeche-druck-einheit'];
      const ergebnisEinheit = document.getElementById('flaeche-ergebnis-einheit')?.value || 'm2';

      const kraftN = kraft * KRAFT_EINHEITEN[kraftEinheit];
      const druckPa = druck * DRUCK_EINHEITEN[druckEinheit];

      const flaecheM2 = kraftN / druckPa;
      aktuelleFlaecheM2 = flaecheM2;

      const flaecheKonvertiert = flaecheM2 / FLAECHE_EINHEITEN[ergebnisEinheit];

      visualisiereFlaeche(flaecheM2);

      return {
        'flaeche-wert': `${formatiereZahl(flaecheKonvertiert)} ${ergebnisEinheit}`
      };
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  let druckCalculator, kraftCalculator, flaecheCalculator;
  
  try {
    druckCalculator = new ChemistryCalculator(druckCalculatorConfig);
    kraftCalculator = new ChemistryCalculator(kraftCalculatorConfig);
    flaecheCalculator = new ChemistryCalculator(flaecheCalculatorConfig);
  } catch (error) {
    console.error('Error initializing calculators:', error);
  }

  function handleDruckEinheitChange() {
    if (aktuellerDruckPa > 0) {
      const ergebnisEinheit = document.getElementById('druck-ergebnis-einheit')?.value;
      if (ergebnisEinheit) {
        const druckKonvertiert = aktuellerDruckPa / DRUCK_EINHEITEN[ergebnisEinheit];
        const wertElement = document.getElementById('druck-wert');
        if (wertElement) {
          wertElement.textContent = `${formatiereZahl(druckKonvertiert)} ${ergebnisEinheit}`;
        }
      }
    }
  }

  function handleKraftEinheitChange() {
    if (aktuelleKraftN > 0) {
      const ergebnisEinheit = document.getElementById('kraft-ergebnis-einheit')?.value;
      if (ergebnisEinheit) {
        const kraftKonvertiert = aktuelleKraftN / KRAFT_EINHEITEN[ergebnisEinheit];
        const wertElement = document.getElementById('kraft-wert');
        if (wertElement) {
          wertElement.textContent = `${formatiereZahl(kraftKonvertiert)} ${ergebnisEinheit}`;
        }
      }
    }
  }

  function handleFlaecheEinheitChange() {
    if (aktuelleFlaecheM2 > 0) {
      const ergebnisEinheit = document.getElementById('flaeche-ergebnis-einheit')?.value;
      if (ergebnisEinheit) {
        const flaecheKonvertiert = aktuelleFlaecheM2 / FLAECHE_EINHEITEN[ergebnisEinheit];
        const wertElement = document.getElementById('flaeche-wert');
        if (wertElement) {
          wertElement.textContent = `${formatiereZahl(flaecheKonvertiert)} ${ergebnisEinheit}`;
        }
        visualisiereFlaeche(aktuelleFlaecheM2);
      }
    }
  }

  const druckErgebnisEinheit = document.getElementById('druck-ergebnis-einheit');
  if (druckErgebnisEinheit) {
    druckErgebnisEinheit.addEventListener('change', handleDruckEinheitChange);
  }

  const kraftErgebnisEinheit = document.getElementById('kraft-ergebnis-einheit');
  if (kraftErgebnisEinheit) {
    kraftErgebnisEinheit.addEventListener('change', handleKraftEinheitChange);
  }

  const flaecheErgebnisEinheit = document.getElementById('flaeche-ergebnis-einheit');
  if (flaecheErgebnisEinheit) {
    flaecheErgebnisEinheit.addEventListener('change', handleFlaecheEinheitChange);
  }

  initPistonDemo();
});

function initPistonDemo() {
  const kraftSlider = document.getElementById('kraft-slider');
  const flaecheSlider = document.getElementById('flaeche-slider');
  
  if (kraftSlider && flaecheSlider) {
    kraftSlider.addEventListener('input', updatePiston);
    flaecheSlider.addEventListener('input', updatePiston);
    updatePiston();
  }
}

function updatePiston() {
  const kraftSlider = document.getElementById('kraft-slider');
  const flaecheSlider = document.getElementById('flaeche-slider');
  const kraftDisplay = document.getElementById('kraft-display');
  const flaecheDisplay = document.getElementById('flaeche-display');
  const visualPressure = document.getElementById('visual-pressure');
  const pressureFill = document.getElementById('pressure-fill');
  const canvas = document.getElementById('piston-canvas');

  if (!kraftSlider || !flaecheSlider || !kraftDisplay || !flaecheDisplay || !visualPressure || !pressureFill || !canvas) {
    return;
  }

  const kraft = parseInt(kraftSlider.value);
  const flaeche = parseInt(flaecheSlider.value);

  kraftDisplay.textContent = `${kraft} N`;
  flaecheDisplay.textContent = `${flaeche} cm²`;

  const flaecheM2 = flaeche * FLAECHE_EINHEITEN.cm2;
  const druckPa = kraft / flaecheM2;
  const druckKPa = druckPa / 1000;

  visualPressure.textContent = formatiereZahl(druckKPa);

  const prozent = Math.min((druckKPa / 1000) * 100, 100);
  pressureFill.style.width = `${prozent}%`;

  requestAnimationFrame(() => drawPiston(kraft, flaeche, druckKPa));
}

function drawPiston(kraft, flaeche, druckKPa) {
  const canvas = document.getElementById('piston-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cylX = 100;
  const cylY = 100;
  const cylWidth = 200;
  const cylHeight = 150;

  const pistonWidth = 50 + (flaeche / 100) * 100;
  const pistonHeight = 30;

  const pressureProzent = Math.min(druckKPa / 1000, 1);
  const rot = Math.floor(pressureProzent * 255);
  const gruen = Math.floor((1 - pressureProzent) * 255);
  const farbe = `rgb(${rot}, ${gruen}, 0)`;

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.strokeRect(cylX, cylY, cylWidth, cylHeight);

  ctx.fillStyle = `rgba(0, 100, 255, 0.3)`;
  ctx.fillRect(cylX + 2, cylY + pistonHeight + 20, cylWidth - 4, cylHeight - pistonHeight - 22);

  const pistonX = cylX + (cylWidth - pistonWidth) / 2;
  ctx.fillStyle = farbe;
  ctx.fillRect(pistonX, cylY + 20, pistonWidth, pistonHeight);

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

  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`F = ${kraft} N`, arrowX + 40, arrowY - arrowSize / 2);
  ctx.fillText(`A = ${flaeche} cm²`, cylX + cylWidth / 2, cylY + cylHeight + 20);
  ctx.fillText(`p = ${formatiereZahl(druckKPa)} kPa`, cylX + cylWidth / 2, cylY + cylHeight + 40);
}