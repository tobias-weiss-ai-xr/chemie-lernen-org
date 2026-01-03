// Preset reactions data
const presets = {
  water: {
    name: "Wasserbildung",
    equation: "2H2 + O2 -> 2H2O",
    v1: 2,
    v2: 2,
    example: 4
  },
  methane: {
    name: "Methan-Verbrennung",
    equation: "CH4 + 2O2 -> CO2 + 2H2O",
    v1: 1,
    v2: 1,
    example: 2
  },
  ammonia: {
    name: "Haber-Verfahren (Ammoniak)",
    equation: "N2 + 3H2 -> 2NH3",
    v1: 1,
    v2: 2,
    example: 3
  },
  sodium: {
    name: "Natrium + Wasser",
    equation: "2Na + 2H2O -> 2NaOH + H2",
    v1: 2,
    v2: 2,
    example: 4
  },
  photosynthesis: {
    name: "Fotosynthese",
    equation: "6CO2 + 6H2O -> C6H12O6 + 6O2",
    v1: 6,
    v2: 1,
    example: 6
  }
};

const massPresets = {
  water: {
    name: "Wasserbildung",
    v1: 2,
    v2: 2,
    m1: 4,
    M1: 2,  // H2
    M2: 18  // H2O
  },
  methane: {
    name: "Methan-Verbrennung",
    v1: 1,
    v2: 1,
    m1: 16,
    M1: 16,  // CH4
    M2: 44   // CO2
  },
  ammonia: {
    name: "Haber-Verfahren",
    v1: 1,
    v2: 2,
    m1: 28,
    M1: 28,  // N2
    M2: 17   // NH3
  },
  sodium: {
    name: "Natrium + Wasser",
    v1: 2,
    v2: 2,
    m1: 46,
    M1: 23,  // Na
    M2: 40   // NaOH
  },
  photosynthesis: {
    name: "Fotosynthese",
    v1: 6,
    v2: 1,
    m1: 264,
    M1: 44,  // CO2
    M2: 180  // C6H12O6
  }
};

// Load preset for Mol-Mol calculator
// eslint-disable-next-line no-unused-vars
function loadPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) {return;}

  document.getElementById('reaction-1').value = preset.equation;
  document.getElementById('mol-coeff-r').value = preset.v1;
  document.getElementById('mol-coeff-p').value = preset.v2;
  document.getElementById('mol-reactant').value = preset.example;
  document.getElementById('mol-reactant').placeholder = preset.example;

  // Hide previous results
  document.getElementById('mol-result').style.display = 'none';
}

// Load preset for Mass-Mass calculator
// eslint-disable-next-line no-unused-vars
function loadMassPreset(presetKey) {
  const preset = massPresets[presetKey];
  if (!preset) {return;}

  document.getElementById('mass-coeff-r').value = preset.v1;
  document.getElementById('mass-coeff-p').value = preset.v2;
  document.getElementById('mass-r').value = preset.m1;
  document.getElementById('mm-r').value = preset.M1;
  document.getElementById('mm-p').value = preset.M2;

  // Hide previous results
  document.getElementById('mass-result').style.display = 'none';
  document.getElementById('mass-preview').innerHTML = '<p style="font-size:2em; color:#007bff;">--</p><p>Gramm</p>';
}

// ===== EQUATION PARSER =====

// Parse chemical equation and extract coefficients
// eslint-disable-next-line no-unused-vars
function parseEquation() {
  const equation = document.getElementById('equation-parser-input').value.trim();

  if (!equation) {
    alert('Bitte geben Sie eine Reaktionsgleichung ein.');
    return;
  }

  try {
    const result = parseChemicalEquation(equation);
    displayParsedCoefficients(result);
  } catch (error) {
    alert('Fehler beim Parsen: ' + error.message);
    console.error('Parse error:', error);
  }
}

// Main parsing function
function parseChemicalEquation(equation) {
  // Support different arrow types
  const arrowMatch = equation.match(/(->|→|=)/);
  if (!arrowMatch) {
    throw new Error('Kein Reaktionspfeil gefunden. Verwenden Sie ->, → oder =');
  }

  const [reactantsStr, productsStr] = equation.split(arrowMatch[1]).map(s => s.trim());

  const reactants = parseSide(reactantsStr);
  const products = parseSide(productsStr);

  return {
    reactants,
    products,
    totalReactants: reactants.length,
    totalProducts: products.length
  };
}

// Parse one side of the equation (reactants or products)
function parseSide(sideStr) {
  if (!sideStr) {
    throw new Error('Leere Seite der Gleichung');
  }

  // Split by + and trim whitespace
  const compounds = sideStr.split('+').map(s => s.trim()).filter(s => s.length > 0);

  if (compounds.length === 0) {
    throw new Error('Keine Verbindungen gefunden');
  }

  return compounds.map(compound => parseCompound(compound));
}

// Parse a single compound to extract coefficient and formula
function parseCompound(compoundStr) {
  // Match coefficient at the beginning (can be decimal like 0.5, 1.5, etc.)
  const coeffMatch = compoundStr.match(/^(\d*\.?\d+)?\s*([A-Za-z0-9\(\)]+)$/);

  if (!coeffMatch) {
    // If no coefficient found, assume 1
    return {
      coefficient: 1,
      formula: compoundStr.trim(),
      hasExplicitCoefficient: false
    };
  }

  const coefficient = coeffMatch[1] ? parseFloat(coeffMatch[1]) : 1;
  const formula = coeffMatch[2];

  return {
    coefficient,
    formula,
    hasExplicitCoefficient: !!coeffMatch[1]
  };
}

// Display parsed coefficients in the UI
function displayParsedCoefficients(result) {
  const container = document.getElementById('parsed-coefficients');
  const buttonsContainer = document.getElementById('apply-buttons');
  const resultPanel = document.getElementById('parser-result');

  let html = '<div class="row">';

  // Reactants
  html += '<div class="col-md-6">';
  html += '<h5>Edukte:</h5>';
  html += '<ul class="list-group">';
  result.reactants.forEach((reactant, index) => {
    html += `
      <li class="list-group-item">
        <strong>${reactant.formula}</strong>
        <span class="badge" style="margin-left: 10px;">ν₁ = ${reactant.coefficient}</span>
      </li>
    `;
  });
  html += '</ul></div>';

  // Products
  html += '<div class="col-md-6">';
  html += '<h5>Produkte:</h5>';
  html += '<ul class="list-group">';
  result.products.forEach((product, index) => {
    html += `
      <li class="list-group-item">
        <strong>${product.formula}</strong>
        <span class="badge" style="margin-left: 10px;">ν₂ = ${product.coefficient}</span>
      </li>
    `;
  });
  html += '</ul></div>';

  html += '</div>';
  container.innerHTML = html;

  // Generate apply buttons based on what makes sense
  let buttonsHtml = '<p style="margin-bottom: 10px;"><strong>Koeffizienten übernehmen:</strong></p>';
  buttonsHtml += '<div class="btn-group">';

  // For Mol-Mol calculator (simple 2-compound case)
  if (result.reactants.length === 1 && result.products.length === 1) {
    const rCoeff = result.reactants[0].coefficient;
    const pCoeff = result.products[0].coefficient;
    buttonsHtml += `<button class="btn btn-success" onclick="applyCoefficientsToMolMol(${rCoeff}, ${pCoeff})">
      <i class="fa fa-check"></i> Mol-Mol-Rechner
    </button>`;
  }

  // For Mass-Mass calculator
  if (result.reactants.length === 1 && result.products.length === 1) {
    const rCoeff = result.reactants[0].coefficient;
    const pCoeff = result.products[0].coefficient;
    buttonsHtml += `<button class="btn btn-success" onclick="applyCoefficientsToMassMass(${rCoeff}, ${pCoeff})">
      <i class="fa fa-check"></i> Masse-Masse-Rechner
    </button>`;
  }

  buttonsHtml += '</div>';
  buttonsContainer.innerHTML = buttonsHtml;

  resultPanel.style.display = 'block';
}

// Apply parsed coefficients to Mol-Mol calculator
// eslint-disable-next-line no-unused-vars
function applyCoefficientsToMolMol(v1, v2) {
  document.getElementById('mol-coeff-r').value = v1;
  document.getElementById('mol-coeff-p').value = v2;

  // Switch to Mol-Mol tab
  document.querySelector('a[href="#mol-mol"]').click();

  // Scroll to calculator
  document.querySelector('.calculator-panel').scrollIntoView({ behavior: 'smooth' });

  // Show confirmation
  alert(`Koeffizienten übernommen: Edukt ν₁=${v1}, Produkt ν₂=${v2}`);
}

// Apply parsed coefficients to Mass-Mass calculator
// eslint-disable-next-line no-unused-vars
function applyCoefficientsToMassMass(v1, v2) {
  document.getElementById('mass-coeff-r').value = v1;
  document.getElementById('mass-coeff-p').value = v2;

  // Switch to Mass-Mass tab
  document.querySelector('a[href="#masse-masse"]').click();

  // Scroll to calculator
  document.querySelectorAll('.calculator-panel')[1].scrollIntoView({ behavior: 'smooth' });

  // Show confirmation
  alert(`Koeffizienten übernommen: Edukt ν₁=${v1}, Produkt ν₂=${v2}`);
}

// ===== PERIODIC TABLE / MOLAR MASS LOOKUP =====

// Comprehensive element database with molar masses
const elementDatabase = {
  // Non-metals
  'H': { symbol: 'H', name: 'Wasserstoff', mass: 1.008, number: 1 },
  'C': { symbol: 'C', name: 'Kohlenstoff', mass: 12.011, number: 6 },
  'N': { symbol: 'N', name: 'Stickstoff', mass: 14.007, number: 7 },
  'O': { symbol: 'O', name: 'Sauerstoff', mass: 15.999, number: 8 },
  'F': { symbol: 'F', name: 'Fluor', mass: 18.998, number: 9 },
  'P': { symbol: 'P', name: 'Phosphor', mass: 30.974, number: 15 },
  'S': { symbol: 'S', name: 'Schwefel', mass: 32.06, number: 16 },
  'Cl': { symbol: 'Cl', name: 'Chlor', mass: 35.45, number: 17 },
  'I': { symbol: 'I', name: 'Iod', mass: 126.90, number: 53 },

  // Metals (Main Group)
  'Li': { symbol: 'Li', name: 'Lithium', mass: 6.941, number: 3 },
  'Na': { symbol: 'Na', name: 'Natrium', mass: 22.990, number: 11 },
  'K': { symbol: 'K', name: 'Kalium', mass: 39.098, number: 19 },
  'Be': { symbol: 'Be', name: 'Beryllium', mass: 9.012, number: 4 },
  'Mg': { symbol: 'Mg', name: 'Magnesium', mass: 24.305, number: 12 },
  'Ca': { symbol: 'Ca', name: 'Calcium', mass: 40.078, number: 20 },
  'Al': { symbol: 'Al', name: 'Aluminium', mass: 26.982, number: 13 },
  'Fe': { symbol: 'Fe', name: 'Eisen', mass: 55.845, number: 26 },
  'Cu': { symbol: 'Cu', name: 'Kupfer', mass: 63.546, number: 29 },
  'Zn': { symbol: 'Zn', name: 'Zink', mass: 65.38, number: 30 },
  'Ag': { symbol: 'Ag', name: 'Silber', mass: 107.87, number: 47 },
  'Au': { symbol: 'Au', name: 'Gold', mass: 196.97, number: 79 },

  // Transition Metals
  'Cr': { symbol: 'Cr', name: 'Chrom', mass: 51.996, number: 24 },
  'Mn': { symbol: 'Mn', name: 'Mangan', mass: 54.938, number: 25 },
  'Ni': { symbol: 'Ni', name: 'Nickel', mass: 58.693, number: 28 },
  'Pt': { symbol: 'Pt', name: 'Platin', mass: 195.08, number: 78 },

  // Noble Gases
  'He': { symbol: 'He', name: 'Helium', mass: 4.0026, number: 2 },
  'Ne': { symbol: 'Ne', name: 'Neon', mass: 20.180, number: 10 },
  'Ar': { symbol: 'Ar', name: 'Argon', mass: 39.948, number: 18 }
};

// Apply selected element's molar mass to calculator
// eslint-disable-next-line no-unused-vars
function applyMolarMass() {
  const selector = document.getElementById('element-selector');
  const selectedValue = selector.value;

  if (!selectedValue) {
    alert('Bitte wählen Sie ein Element aus.');
    return;
  }

  const [symbol, mass] = selectedValue.split(':');
  const element = elementDatabase[symbol];

  if (!element) {
    alert('Element nicht gefunden: ' + symbol);
    return;
  }

  // Show element info
  showElementInfo(element);

  // Apply to Mass-Mass calculator
  applyMolarMassToCalculator(element);

  // Switch to Mass-Mass tab
  setTimeout(() => {
    document.querySelector('a[href="#masse-masse"]').click();
    document.querySelectorAll('.calculator-panel')[1].scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

// Display element information
function showElementInfo(element) {
  const infoContainer = document.getElementById('molar-mass-info');
  const detailsContainer = document.getElementById('molar-mass-details');

  detailsContainer.innerHTML = `
    <strong>${element.symbol}</strong> - ${element.name}<br>
    <span style="font-size: 1.2em; color: #9C27B0;">
      <strong>M = ${element.mass} g/mol</strong>
    </span><br>
    <small class="text-muted">Ordnungszahl: ${element.number}</small>
  `;

  infoContainer.style.display = 'block';
}

// Apply molar mass to Mass-Mass calculator fields
function applyMolarMassToCalculator(element) {
  // Check which field to fill (reactant or product)
  const reactantField = document.getElementById('mm-r');
  const productField = document.getElementById('mm-p');

  // Simple logic: fill the field that's empty or has default value
  if (!reactantField.value || parseFloat(reactantField.value) === 0) {
    reactantField.value = element.mass;
    alert(`${element.symbol} (${element.name}) molare Masse ${element.mass} g/mol als Edukt übernommen`);
  } else if (!productField.value || parseFloat(productField.value) === 0) {
    productField.value = element.mass;
    alert(`${element.symbol} (${element.name}) molare Masse ${element.mass} g/mol als Produkt übernommen`);
  } else {
    // Both filled, ask user which to replace
    const choice = confirm(
      `${element.symbol} (${element.name}) - M = ${element.mass} g/mol\n\n` +
      `Beide Felder sind ausgefüllt:\n` +
      `Edukt: ${reactantField.value} g/mol\n` +
      `Produkt: ${productField.value} g/mol\n\n` +
      `Klicken Sie OK, um das Edukt-Feld zu ersetzen,\n` +
      `oder Abbrechen, um das Produkt-Feld zu ersetzen.`
    );

    if (choice) {
      reactantField.value = element.mass;
    } else {
      productField.value = element.mass;
    }
  }
}

// ===== HISTORY MANAGEMENT =====

// Save calculation to history
function saveToHistory(type, data) {
  try {
    const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');

    const entry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      type,
      data
    };

    // Add to beginning of array (most recent first)
    history.unshift(entry);

    // Keep only last 20 entries
    if (history.length > 20) {
      history.splice(20);
    }

    localStorage.setItem('stoichHistory', JSON.stringify(history));
    updateHistoryCount();
    displayHistory();
  } catch (e) {
    console.error('Error saving to history:', e);
  }
}

// Load and display history
function loadHistory() {
  displayHistory();
  updateHistoryCount();
}

// Display history in the UI
function displayHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
      historyList.innerHTML = '<p class="text-muted"><small>Noch keine Berechnungen durchgeführt.</small></p>';
      return;
    }

    let html = '<div class="history-items">';
    history.forEach((entry, index) => {
      html += `
        <div class="history-item" style="padding: 10px; margin-bottom: 8px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #007bff;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <strong>${entry.type}</strong>
              <span class="text-muted" style="font-size: 0.85em; margin-left: 10px;">${entry.timestamp}</span>
              <div style="margin-top: 5px; font-size: 0.9em;">${entry.data}</div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    historyList.innerHTML = html;
  } catch (e) {
    console.error('Error displaying history:', e);
  }
}

// Toggle history panel visibility
// eslint-disable-next-line no-unused-vars
function toggleHistory() {
  const panel = document.getElementById('history-panel');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    displayHistory();
  } else {
    panel.style.display = 'none';
  }
}

// Update history count badge
function updateHistoryCount() {
  try {
    const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');
    const countBadge = document.getElementById('history-count');
    countBadge.textContent = `(${history.length})`;
  } catch (e) {
    console.error('Error updating history count:', e);
  }
}

// Clear all history
// eslint-disable-next-line no-unused-vars
function clearHistory() {
  if (confirm('Möchten Sie wirklich den gesamten Berechnungsverlauf löschen?')) {
    localStorage.removeItem('stoichHistory');
    displayHistory();
    updateHistoryCount();
  }
}

// ===== INTEGRATION WITH EQUATION BALANCER =====

// Check for and apply balanced equation data from Equation Balancer
function checkForBalancedEquation() {
  try {
    const balancedData = sessionStorage.getItem('balancedEquation');

    if (!balancedData) {
      return; // No data to import
    }

    const data = JSON.parse(balancedData);

    // Validate data structure
    if (!data.reactants || !data.products || data.reactants.length === 0 || data.products.length === 0) {
      console.warn('Invalid balanced equation data structure');
      return;
    }

    // Show notification
    showImportNotification(data);

    // Apply coefficients to calculators
    // For simplicity, we'll use the first reactant-product pair
    const firstReactant = data.reactants[0];
    const firstProduct = data.products[0];

    // Apply to Mol-Mol calculator
    const molCoeffR = document.getElementById('mol-coeff-r');
    const molCoeffP = document.getElementById('mol-coeff-p');

    if (molCoeffR && molCoeffP) {
      molCoeffR.value = firstReactant.coefficient;
      molCoeffP.value = firstProduct.coefficient;
    }

    // Apply to Mass-Mass calculator
    const massCoeffR = document.getElementById('mass-coeff-r');
    const massCoeffP = document.getElementById('mass-coeff-p');

    if (massCoeffR && massCoeffP) {
      massCoeffR.value = firstReactant.coefficient;
      massCoeffP.value = firstProduct.coefficient;
    }

    // Clear the sessionStorage to prevent re-import on refresh
    sessionStorage.removeItem('balancedEquation');

  } catch (e) {
    console.error('Error importing balanced equation:', e);
  }
}

// Show notification when data is imported
function showImportNotification(data) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    max-width: 400px;
    animation: slideIn 0.5s ease;
  `;

  const equationStr = data.reactants.map(r => `${r.coefficient > 1 ? r.coefficient : ''}${r.formula}`).join(' + ') +
                      ' → ' +
                      data.products.map(p => `${p.coefficient > 1 ? p.coefficient : ''}${p.formula}`).join(' + ');

  notification.innerHTML = `
    <div style="display: flex; align-items: start;">
      <i class="fa fa-check-circle" style="font-size: 24px; margin-right: 12px; flex-shrink: 0;"></i>
      <div>
        <h4 style="margin: 0 0 10px 0;">Gleichung übertragen!</h4>
        <p style="margin: 0 0 10px 0; font-size: 14px;">Die ausgeglichene Gleichung wurde automatisch in den Stöchiometrie-Rechner übertragen.</p>
        <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; font-size: 13px;">
          <strong style="display: block; margin-bottom: 5px;">Übertragene Koeffizienten:</strong>
          <div style="font-family: monospace;">${equationStr}</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// eslint-disable-next-line no-unused-vars
function calcMolMol() {
  const n1 = parseFloat(document.getElementById('mol-reactant').value);
  const v1 = parseFloat(document.getElementById('mol-coeff-r').value);
  const v2 = parseFloat(document.getElementById('mol-coeff-p').value);

  if (isNaN(n1) || isNaN(v1) || isNaN(v2)) {
    alert('Bitte geben Sie alle Werte ein');
    return;
  }

  const n2 = n1 * (v2 / v1);
  document.getElementById('mol-result').style.display = 'block';

  // Basic result
  document.getElementById('mol-calc').innerHTML = `
    <p><strong>Edukt (ν₁=${v1}):</strong> ${n1} mol</p>
    <p><strong>Produkt (ν₂=${v2}):</strong> ${n2.toFixed(4)} mol</p>
    <p class="text-muted"><small>Formel: n₂ = n₁ × (ν₂/ν₁) = ${n1} × (${v2}/${v1}) = ${n2.toFixed(4)} mol</small></p>
    <button class="btn btn-info btn-sm" onclick="toggleMolMolExplanation()" style="margin-top:10px;">
      <i class="fa fa-info-circle"></i> Schritt-für-Schritt Erklärung
    </button>
    <div id="mol-mol-explanation" style="display:none; margin-top:15px; padding:15px; background:#e3f2fd; border-radius:4px; border-left:4px solid #2196F3;">
      <h4 style="color:#1976D2; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausführliche Erklärung</h4>

      <div style="margin-bottom:15px;">
        <h5 style="color:#0D47A1;">📚 Das Konzept</h5>
        <p>Bei chemischen Reaktionen reagieren Edukte und Produkte in festen Stoffmengenverhältnissen, die durch die stöchiometrischen Koeffizienten bestimmt werden. Diese Verhältnisse ermöglichen es uns, die Stoffmenge eines Produkts aus der Stoffmenge eines Edukts zu berechnen.</p>
      </div>

      <div style="margin-bottom:15px;">
        <h5 style="color:#0D47A1;">📐 Die Formel</h5>
        <p style="font-size:18px; font-weight:bold; color:#1976D2;">n₂ = n₁ × (ν₂/ν₁)</p>
        <p><strong>Wo:</strong></p>
        <ul>
          <li><strong>n₁</strong> = Stoffmenge des Edukts (gegeben)</li>
          <li><strong>ν₁</strong> = Koeffizient des Edukts in der Reaktionsgleichung</li>
          <li><strong>ν₂</strong> = Koeffizient des Produkts in der Reaktionsgleichung</li>
          <li><strong>n₂</strong> = Stoffmenge des Produkts (berechnet)</li>
        </ul>
      </div>

      <div style="margin-bottom:15px;">
        <h5 style="color:#0D47A1;">🔢 Schritt-für-Schritt Berechnung</h5>
        <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
          <p><strong>Schritt 1:</strong> Koeffizientenverhältnis bestimmen</p>
          <p style="font-family:monospace; color:#1976D2;">Verhältnis = ν₂/ν₁ = ${v2}/${v1} = ${(v2/v1).toFixed(4)}</p>
          <p><small>Das bedeutet: Für jedes ${v1} Mol Edukt entstehen ${v2} Mol Produkt.</small></p>
        </div>

        <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
          <p><strong>Schritt 2:</strong> Stoffmenge des Produkts berechnen</p>
          <p style="font-family:monospace; color:#1976D2;">n₂ = ${n1} mol × ${(v2/v1).toFixed(4)} = ${n2.toFixed(4)} mol</p>
          <p><small>Multipliziere die gegebene Stoffmenge mit dem Koeffizientenverhältnis.</small></p>
        </div>

        <div style="background:white; padding:10px; border-radius:4px;">
          <p><strong>Schritt 3:</strong> Ergebnis überprüfen</p>
          <p><strong>Ergebnis:</strong> ${n2.toFixed(4)} mol Produkt werden aus ${n1} mol Edukt gebildet.</p>
        </div>
      </div>

      <div style="margin-bottom:15px;">
        <h5 style="color:#0D47A1;">💡 Einheiten-Analyse</h5>
        <p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">
          mol × (mol/mol) = mol
        </p>
        <p><small>Die Koeffizienten sind einheitenlos (Verhältnis von Mol zu Mol), daher bleibt die Einheit "mol" erhalten.</small></p>
      </div>

      <div style="background:#fff3e0; padding:12px; border-radius:4px; border-left:4px solid #FF9800;">
        <h5 style="color:#E65100; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & Häufige Fehler</h5>
        <ul style="margin-bottom:0;">
          <li>✅ <strong>Richtig:</strong> Immer die Koeffizienten aus der <em>ausglichenen</em> Reaktionsgleichung verwenden</li>
          <li>✅ <strong>Richtig:</strong> Das Koeffizientenverhältnis als Bruch schreiben (ν₂/ν₁)</li>
          <li>❌ <strong>Falsch:</strong> Koeffizienten vergessen und annehmen, das Verhältnis sei 1:1</li>
          <li>❌ <strong>Falsch:</strong> Das Verhältnis umgekehrt (ν₁/ν₂ statt ν₂/ν₁)</li>
        </ul>
      </div>
    </div>
  `;

  // Save to history
  saveToHistory('Mol-Mol', `ν₁=${v1}, ν₂=${v2}: ${n1} mol → ${n2.toFixed(4)} mol`);
}

// Toggle explanation visibility
// eslint-disable-next-line no-unused-vars
function toggleMolMolExplanation() {
  const explanation = document.getElementById('mol-mol-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

// eslint-disable-next-line no-unused-vars
function calcMassMass() {
  const m1 = parseFloat(document.getElementById('mass-r').value);
  const M1 = parseFloat(document.getElementById('mm-r').value);
  const M2 = parseFloat(document.getElementById('mm-p').value);
  const v1 = parseFloat(document.getElementById('mass-coeff-r').value);
  const v2 = parseFloat(document.getElementById('mass-coeff-p').value);

  if (isNaN(m1) || isNaN(M1) || isNaN(M2) || isNaN(v1) || isNaN(v2)) {
    alert('Bitte geben Sie alle Werte ein');
    return;
  }

  const n1 = m1 / M1;
  const n2 = n1 * (v2 / v1);
  const m2 = n2 * M2;

  document.getElementById('mass-preview').innerHTML = `
    <p style="font-size:2em; color:#007bff;">${m2.toFixed(2)}</p>
    <p>Gramm</p>
  `;

  document.getElementById('mass-result').style.display = 'block';
  document.getElementById('mass-result').innerHTML = `
    <div class="result-box">
      <h3>Berechnung:</h3>
      <p><strong>Schritt 1:</strong> n₁ = m₁/M₁ = ${m1} g / ${M1} g/mol = ${n1.toFixed(4)} mol</p>
      <p><strong>Schritt 2:</strong> n₂ = n₁ × (ν₂/ν₁) = ${n1.toFixed(4)} mol × (${v2}/${v1}) = ${n2.toFixed(4)} mol</p>
      <p><strong>Schritt 3:</strong> m₂ = n₂ × M₂ = ${n2.toFixed(4)} mol × ${M2} g/mol = <strong>${m2.toFixed(2)} g</strong></p>
      <button class="btn btn-info btn-sm" onclick="toggleMassMassExplanation()" style="margin-top:10px;">
        <i class="fa fa-info-circle"></i> Schritt-für-Schritt Erklärung
      </button>
      <div id="mass-mass-explanation" style="display:none; margin-top:15px; padding:15px; background:#e8f5e9; border-radius:4px; border-left:4px solid #4CAF50;">
        <h4 style="color:#2E7D32; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausführliche Erklärung</h4>

        <div style="margin-bottom:15px;">
          <h5 style="color:#1B5E20;">📚 Das Konzept</h5>
          <p>Die Umrechnung von Masse zu Masse erfordert drei Schritte: Masse → Mol (Stoffmenge) → Mol (Stoffmenge) → Masse. Dies ist notwendig, weil die stöchiometrischen Koeffizienten das Verhältnis der <strong>Stoffmengen</strong> (in Mol), nicht der Massen angeben.</p>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#1B5E20;">📐 Die Formeln</h5>
          <p style="font-size:16px; font-weight:bold; color:#2E7D32;">Schritt 1: n = m/M</p>
          <p style="font-size:16px; font-weight:bold; color:#2E7D32;">Schritt 2: n₂ = n₁ × (ν₂/ν₁)</p>
          <p style="font-size:16px; font-weight:bold; color:#2E7D32;">Schritt 3: m = n × M</p>
          <p><strong>Wo:</strong></p>
          <ul>
            <li><strong>m</strong> = Masse (in Gramm)</li>
            <li><strong>M</strong> = Molare Masse (in g/mol)</li>
            <li><strong>n</strong> = Stoffmenge (in mol)</li>
            <li><strong>ν</strong> = Stöchiometrischer Koeffizient</li>
          </ul>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#1B5E20;">🔢 Detaillierte Berechnung</h5>
          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 1:</strong> Masse des Edukts in Stoffmenge umrechnen</p>
            <p style="font-family:monospace; color:#2E7D32;">n₁ = m₁ / M₁ = ${m1} g / ${M1} g/mol</p>
            <p style="font-family:monospace; color:#2E7D32;">n₁ = ${n1.toFixed(4)} mol</p>
            <p><small>Teile die Masse durch die molare Masse, um die Stoffmenge in Mol zu erhalten.</small></p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 2:</strong> Stoffmenge des Produkts berechnen (unter Verwendung der Koeffizienten)</p>
            <p style="font-family:monospace; color:#2E7D32;">Verhältnis = ν₂/ν₁ = ${v2}/${v1} = ${(v2/v1).toFixed(4)}</p>
            <p style="font-family:monospace; color:#2E7D32;">n₂ = ${n1.toFixed(4)} mol × ${(v2/v1).toFixed(4)} = ${n2.toFixed(4)} mol</p>
            <p><small>Multipliziere die Stoffmenge des Edukts mit dem Koeffizientenverhältnis.</small></p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px;">
            <p><strong>Schritt 3:</strong> Stoffmenge des Produkts in Masse umrechnen</p>
            <p style="font-family:monospace; color:#2E7D32;">m₂ = n₂ × M₂ = ${n2.toFixed(4)} mol × ${M2} g/mol</p>
            <p style="font-family:monospace; color:#2E7D32;">m₂ = ${m2.toFixed(2)} g</p>
            <p><small>Multipliziere die Stoffmenge mit der molaren Masse, um die Masse zu erhalten.</small></p>
          </div>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#1B5E20;">💡 Einheiten-Analyse</h5>
          <p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">
            Schritt 1: g ÷ (g/mol) = mol
          </p>
          <p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">
            Schritt 2: mol × (mol/mol) = mol
          </p>
          <p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">
            Schritt 3: mol × (g/mol) = g
          </p>
        </div>

        <div style="background:#fff3e0; padding:12px; border-radius:4px; border-left:4px solid #FF9800;">
          <h5 style="color:#E65100; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & Häufige Fehler</h5>
          <ul style="margin-bottom:0;">
            <li>✅ <strong>Richtig:</strong> Immer über Mol (Stoffmenge) umrechnen, nicht direkt von Masse zu Masse</li>
            <li>✅ <strong>Richtig:</strong> Die molare Masse aus dem Periodensystem bestimmen (Summe der Atommassen)</li>
            <li>❌ <strong>Falsch:</strong> Masse₁ × (Masse₂/Masse₁) - Die molaren Massen sind nicht proportional!</li>
            <li>❌ <strong>Falsch:</strong> Vergessen, die Koeffizienten zu berücksichtigen</li>
          </ul>
        </div>
      </div>
      <button class="btn btn-success btn-sm" onclick="exportMassMassToPDF()" style="margin-top:15px;">
        <i class="fa fa-file-pdf-o"></i> Als PDF exportieren
      </button>
    </div>
  `;

  // Save to history
  saveToHistory('Masse-Masse', `${m1} g → ${m2.toFixed(2)} g (ν₁=${v1}, ν₂=${v2})`);
}

// Toggle mass-mass explanation visibility
// eslint-disable-next-line no-unused-vars
function toggleMassMassExplanation() {
  const explanation = document.getElementById('mass-mass-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

// eslint-disable-next-line no-unused-vars
function calcLimiting() {
  const m1 = parseFloat(document.getElementById('lim-m1').value);
  const M1 = parseFloat(document.getElementById('lim-mm1').value);
  const m2 = parseFloat(document.getElementById('lim-m2').value);
  const M2 = parseFloat(document.getElementById('lim-mm2').value);

  if (isNaN(m1) || isNaN(M1) || isNaN(m2) || isNaN(M2)) {
    alert('Bitte geben Sie alle Werte ein');
    return;
  }

  const n1 = m1 / M1;
  const n2_2 = m2 / M2;

  const limiting = n1 < n2_2 ? 1 : 2;
  const name = limiting === 1 ? 'Reagenz 1' : 'Reagenz 2';
  const other = limiting === 1 ? n2_2 - n1 : n1 - n2_2;

  document.getElementById('limit-result').style.display = 'block';
  document.getElementById('limit-result').innerHTML = `
    <div class="alert alert-success">
      <h4>Limitierend: ${name}</h4>
      <p>Reagenz 1: ${n1.toFixed(4)} mol</p>
      <p>Reagenz 2: ${n2_2.toFixed(4)} mol</p>
      <button class="btn btn-info btn-sm" onclick="toggleLimitingExplanation()" style="margin-top:10px;">
        <i class="fa fa-info-circle"></i> Schritt-für-Schritt Erklärung
      </button>
      <div id="limiting-explanation" style="display:none; margin-top:15px; padding:15px; background:#fff3e0; border-radius:4px; border-left:4px solid #FF9800;">
        <h4 style="color:#E65100; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausführliche Erklärung</h4>

        <div style="margin-bottom:15px;">
          <h5 style="color:#BF360C;">📚 Das Konzept</h5>
          <p>Das <strong>limitierende Reagenz</strong> (Limiting Reagent) ist der Stoff, der zuerst verbraucht wird und damit die Menge an Produkt bestimmt, die gebildet werden kann. Der andere Stoff ist im Überschuss vorhanden und wird nicht vollständig verbraucht.</p>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#BF360C;">📐 Die Logik</h5>
          <p>Vergleiche die Stoffmengen (in Mol) der beiden Reagenzien:</p>
          <ul>
            <li>Wenn beide Reagenzien im 1:1-Verhältnis reagieren: Das Reagenz mit der <strong>geringeren Stoffmenge</strong> ist limitierend</li>
            <li>Das Reagenz mit der größeren Stoffmenge ist im <strong>Überschuss</strong></li>
          </ul>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#BF360C;">🔢 Schritt-für-Schritt Berechnung</h5>
          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 1:</strong> Stoffmenge von Reagenz 1 berechnen</p>
            <p style="font-family:monospace; color:#E65100;">n₁ = m₁ / M₁ = ${m1} g / ${M1} g/mol = ${n1.toFixed(4)} mol</p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 2:</strong> Stoffmenge von Reagenz 2 berechnen</p>
            <p style="font-family:monospace; color:#E65100;">n₂ = m₂ / M₂ = ${m2} g / ${M2} g/mol = ${n2_2.toFixed(4)} mol</p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 3:</strong> Stoffmengen vergleichen</p>
            <p style="font-family:monospace; color:#E65100;">${n1.toFixed(4)} mol ${n1 < n2_2 ? '<' : '>'} ${n2_2.toFixed(4)} mol</p>
            <p><strong>Ergebnis:</strong> ${name} hat weniger Mol und ist daher limitierend.</p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px;">
            <p><strong>Schritt 4:</strong> Überschuss berechnen (optional)</p>
            <p style="font-family:monospace; color:#E65100;">Überschuss = ${other.toFixed(4)} mol</p>
            <p><small>Dies ist die Menge an ${limiting === 1 ? 'Reagenz 2' : 'Reagenz 1'}, die <strong>nicht</strong> reagieren wird.</small></p>
          </div>
        </div>

        <div style="background:#e1f5fe; padding:12px; border-radius:4px; border-left:4px solid #03A9F4;">
          <h5 style="color:#0277BD; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & Häufige Fehler</h5>
          <ul style="margin-bottom:0;">
            <li>✅ <strong>Richtig:</strong> Immer die Stoffmengen (in Mol) vergleichen, nicht die Massen!</li>
            <li>✅ <strong>Richtig:</strong> Auf die Koeffizienten der Reaktionsgleichung achten (z.B. 2A + B → C bedeutet 2:1 Verhältnis)</li>
            <li>❌ <strong>Falsch:</strong> Die Massen direkt vergleichen - das funktioniert nur bei gleichen molaren Massen!</li>
            <li>❌ <strong>Falsch:</strong> Annehmen, das Reagenz mit der kleineren Masse sei immer limitierend</li>
          </ul>
        </div>
      </div>
      <button class="btn btn-success btn-sm" onclick="exportLimitingToPDF()" style="margin-top:15px;">
        <i class="fa fa-file-pdf-o"></i> Als PDF exportieren
      </button>
    </div>
  `;

  // Save to history
  saveToHistory('Limitierendes Reagenz', `${name} (${n1.toFixed(4)} vs ${n2_2.toFixed(4)} mol)`);
}

// Toggle limiting explanation visibility
// eslint-disable-next-line no-unused-vars
function toggleLimitingExplanation() {
  const explanation = document.getElementById('limiting-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

// eslint-disable-next-line no-unused-vars
function calcYield() {
  const theo = parseFloat(document.getElementById('yield-theo').value);
  const act = parseFloat(document.getElementById('yield-act').value);

  if (isNaN(theo) || isNaN(act)) {
    alert('Bitte geben Sie alle Werte ein');
    return;
  }

  const yield_pct = (act / theo) * 100;

  document.getElementById('yield-result').style.display = 'block';
  document.getElementById('yield-result').innerHTML = `
    <div class="result-box">
      <h3>Ausbeute: ${yield_pct.toFixed(2)}%</h3>
      <p>Theoretisch: ${theo} g</p>
      <p>Praktisch: ${act} g</p>
      <button class="btn btn-info btn-sm" onclick="toggleYieldExplanation()" style="margin-top:10px;">
        <i class="fa fa-info-circle"></i> Schritt-für-Schritt Erklärung
      </button>
      <div id="yield-explanation" style="display:none; margin-top:15px; padding:15px; background:#f3e5f5; border-radius:4px; border-left:4px solid #9C27B0;">
        <h4 style="color:#7B1FA2; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausführliche Erklärung</h4>

        <div style="margin-bottom:15px;">
          <h5 style="color:#4A148C;">📚 Das Konzept</h5>
          <p>Die <strong>Reaktionsausbeute</strong> (Percent Yield) gibt an, wie effizient eine chemische Reaktion ist. Sie vergleicht die tatsächlich erhaltene Produktmenge mit der theoretisch möglichen Menge.</p>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#4A148C;">📐 Die Formel</h5>
          <p style="font-size:18px; font-weight:bold; color:#7B1FA2;">Ausbeute (%) = (Praktische Masse / Theoretische Masse) × 100%</p>
          <p><strong>Wo:</strong></p>
          <ul>
            <li><strong>Theoretische Masse:</strong> Maximale Produktmenge, die basierend auf der Stöchiometrie berechnet wurde</li>
            <li><strong>Praktische Masse:</strong> Tatsächlich im Labor erhaltene Produktmenge</li>
            <li><strong>Ausbeute:</strong> Prozentuales Verhältnis von praktisch zu theoretisch</li>
          </ul>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#4A148C;">🔢 Schritt-für-Schritt Berechnung</h5>
          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 1:</strong> Werte identifizieren</p>
            <p style="font-family:monospace; color:#7B1FA2;">Theoretisch = ${theo} g</p>
            <p style="font-family:monospace; color:#7B1FA2;">Praktisch = ${act} g</p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">
            <p><strong>Schritt 2:</strong> Ausbeute berechnen</p>
            <p style="font-family:monospace; color:#7B1FA2;">Ausbeute = (${act} / ${theo}) × 100%</p>
            <p style="font-family:monospace; color:#7B1FA2;">Ausbeute = ${(act/theo).toFixed(4)} × 100%</p>
            <p style="font-family:monospace; color:#7B1FA2;">Ausbeute = ${yield_pct.toFixed(2)}%</p>
          </div>

          <div style="background:white; padding:10px; border-radius:4px;">
            <p><strong>Schritt 3:</strong> Ergebnis interpretieren</p>
            <p><strong>${yield_pct.toFixed(2)}%</strong> Ausbeute bedeutet, dass ${yield_pct.toFixed(1)}% der theoretisch möglichen Produktmenge tatsächlich erhalten wurden.</p>
            ${yield_pct < 50 ? '<p style="color:#c62828;"><small>⚠️ <strong>Niedrige Ausbeute:</strong> Es könnten Probleme mit der Reaktion aufgetreten sein (Verunreinigungen, Nebenreaktionen, Verluste bei der Aufarbeitung).</small></p>' : ''}
            ${yield_pct > 100 ? '<p style="color:#c62828;"><small>⚠️ <strong>Ausbeute > 100%:</strong> Dies ist physikalisch unmöglich! Mögliche Ursachen: Verunreinigungen im Produkt, Feuchtigkeit, Messfehler.</small></p>' : ''}
            ${yield_pct >= 80 && yield_pct <= 100 ? '<p style="color:#2e7d32;"><small>✅ <strong>Gute Ausbeute:</strong> Die Reaktion verlief effizient.</small></p>' : ''}
          </div>
        </div>

        <div style="margin-bottom:15px;">
          <h5 style="color:#4A148C;">💡 Warum ist die Ausbeute nie 100%?</h5>
          <div style="background:white; padding:12px; border-radius:4px;">
            <p><strong>Typische Gründe für niedrigere Ausbeuten:</strong></p>
            <ul>
              <li>💧 <strong>Verluste bei der Aufarbeitung:</strong> Produkt geht beim Filtern, Waschen oder Umkristallisieren verloren</li>
              <li>⚠️ <strong>Nebenreaktionen:</strong> Edukte reagieren zu unerwünschten Nebenprodukten</li>
              <li>🔄 <strong>Reversible Reaktionen:</strong> Die Reaktion erreicht nicht das vollständige Gleichgewicht</li>
              <li>🧪 <strong>Ungünstige Bedingungen:</strong> Temperatur, Druck oder Katalysator nicht optimal</li>
              <li>📏 <strong>Messungenauigkeit:</strong> Waagen, Messzylinder und andere Geräte haben Ungenauigkeiten</li>
            </ul>
          </div>
        </div>

        <div style="background:#e1f5fe; padding:12px; border-radius:4px; border-left:4px solid #03A9F4;">
          <h5 style="color:#0277BD; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & Häufige Fehler</h5>
          <ul style="margin-bottom:0;">
            <li>✅ <strong>Richtig:</strong> Die praktische Masse kann nie größer als die theoretische sein (außer bei Messfehlern)</li>
            <li>✅ <strong>Richtig:</strong> Die Ausbeute wird als Prozentsatz angegeben, nicht als Dezimalzahl</li>
            <li>❌ <strong>Falsch:</strong> Theoretische und praktische Masse vertauschen</li>
            <li>❌ <strong>Falsch:</strong> Das "×100%" vergessen und als Dezimalzahl angeben</li>
          </ul>
        </div>
      </div>
      <button class="btn btn-success btn-sm" onclick="exportYieldToPDF()" style="margin-top:15px;">
        <i class="fa fa-file-pdf-o"></i> Als PDF exportieren
      </button>
    </div>
  `;

  // Save to history
  saveToHistory('Ausbeute', `${yield_pct.toFixed(2)}% (${act}g / ${theo}g)`);
}

// Toggle yield explanation visibility
// eslint-disable-next-line no-unused-vars
function toggleYieldExplanation() {
  const explanation = document.getElementById('yield-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

// ===== MULTI-STEP REACTIONS =====

let stepCounter = 0;

// Add a new reaction step
function addReactionStep() {
  stepCounter++;
  const container = document.getElementById('reaction-steps-container');

  const stepDiv = document.createElement('div');
  stepDiv.className = 'reaction-step';
  stepDiv.id = `step-${stepCounter}`;
  stepDiv.style.cssText = 'margin-bottom: 20px;';

  stepDiv.innerHTML = `
    <div class="well" style="background: #fff3e0; border: 2px solid #FF9800;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4 style="color: #E65100; margin: 0;">
          <i class="fa fa-step-forward"></i> Schritt ${stepCounter}
        </h4>
        <button class="btn btn-sm btn-danger" onclick="removeStep(${stepCounter})">
          <i class="fa fa-times"></i> Entfernen
        </button>
      </div>

      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
            <label>Koeffizient Edukt:</label>
            <input type="number" class="form-control step-coeff-r" id="step-${stepCounter}-coeff-r" value="1" step="any" min="0">
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Koeffizient Produkt:</label>
            <input type="number" class="form-control step-coeff-p" id="step-${stepCounter}-coeff-p" value="1" step="any" min="0">
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Molare Masse Produkt (g/mol):</label>
            <input type="number" class="form-control step-molar-mass" id="step-${stepCounter}-molar-mass" step="any" placeholder="Optional">
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Produkt-Verbindung:</label>
            <input type="text" class="form-control step-product" id="step-${stepCounter}-product" placeholder="z.B. FeO">
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Reaktionsgleichung (optional, zur Anzeige):</label>
        <input type="text" class="form-control step-equation" id="step-${stepCounter}-equation" placeholder="z.B. 2Fe + O2 → 2FeO">
      </div>
    </div>
  `;

  container.appendChild(stepDiv);

  // Update step numbers if this isn't the first step
  updateStepNumbers();
}

// Remove a reaction step
// eslint-disable-next-line no-unused-vars
function removeStep(stepId) {
  const stepElement = document.getElementById(`step-${stepId}`);
  if (stepElement) {
    stepElement.remove();
    updateStepNumbers();
  }
}

// Update step numbers after removal
function updateStepNumbers() {
  const steps = document.querySelectorAll('.reaction-step');
  steps.forEach((step, index) => {
    const titleElement = step.querySelector('h4');
    if (titleElement) {
      titleElement.innerHTML = `<i class="fa fa-step-forward"></i> Schritt ${index + 1}`;
    }
  });
}

// Clear all steps
function clearAllSteps() {
  if (confirm('Möchten Sie wirklich alle Reaktionsschritte löschen?')) {
    document.getElementById('reaction-steps-container').innerHTML = '';
    stepCounter = 0;
    document.getElementById('multistep-result').style.display = 'none';
  }
}

// Load example multi-step reaction (Iron to Iron(III) oxide)
// eslint-disable-next-line no-unused-vars
function loadMultiStepExample() {
  // Clear existing steps
  clearAllSteps();

  // Set initial reactant
  document.getElementById('initial-amount').value = 2;
  document.getElementById('initial-molar-mass').value = 55.845; // Fe
  document.getElementById('initial-compound').value = 'Fe';

  // Step 1: Fe → FeO
  addReactionStep();
  document.getElementById('step-1-coeff-r').value = 2;
  document.getElementById('step-1-coeff-p').value = 2;
  document.getElementById('step-1-molar-mass').value = 71.844; // FeO
  document.getElementById('step-1-product').value = 'FeO';
  document.getElementById('step-1-equation').value = '2Fe + O2 → 2FeO';

  // Step 2: FeO → Fe2O3
  addReactionStep();
  document.getElementById('step-2-coeff-r').value = 2;
  document.getElementById('step-2-coeff-p').value = 1;
  document.getElementById('step-2-molar-mass').value = 159.688; // Fe2O3
  document.getElementById('step-2-product').value = 'Fe2O3';
  document.getElementById('step-2-equation').value = '4FeO + O2 → 2Fe2O3';

  // Show initial mass
  updateInitialMass();
}

// Update initial mass display
function updateInitialMass() {
  const amount = parseFloat(document.getElementById('initial-amount').value);
  const molarMass = parseFloat(document.getElementById('initial-molar-mass').value);
  const display = document.getElementById('initial-mass-display');
  const valueSpan = document.getElementById('initial-mass-value');

  if (!isNaN(amount) && !isNaN(molarMass) && molarMass > 0) {
    const mass = amount * molarMass;
    valueSpan.textContent = mass.toFixed(4);
    display.style.display = 'block';
  } else {
    display.style.display = 'none';
  }
}

// Calculate multi-step reaction
// eslint-disable-next-line no-unused-vars
function calculateMultiStep() {
  // Get initial reactant data
  const initialAmount = parseFloat(document.getElementById('initial-amount').value);
  const initialMolarMass = parseFloat(document.getElementById('initial-molar-mass').value);
  const initialCompound = document.getElementById('initial-compound').value || 'Ausgangsstoff';

  if (isNaN(initialAmount) || initialAmount <= 0) {
    alert('Bitte geben Sie eine gültige Stoffmenge für den Ausgangsstoff ein.');
    return;
  }

  // Get all reaction steps
  const steps = [];
  const stepElements = document.querySelectorAll('.reaction-step');

  if (stepElements.length === 0) {
    alert('Bitte fügen Sie mindestens einen Reaktionsschritt hinzu.');
    return;
  }

  let currentAmount = initialAmount;
  const currentMass = null;
  const results = [];
  let hasError = false;

  // Process each step
  stepElements.forEach((stepEl, index) => {
    const coeffR = parseFloat(stepEl.querySelector('.step-coeff-r').value);
    const coeffP = parseFloat(stepEl.querySelector('.step-coeff-p').value);
    const molarMass = parseFloat(stepEl.querySelector('.step-molar-mass').value);
    const product = stepEl.querySelector('.step-product').value || `Produkt ${index + 1}`;
    const equation = stepEl.querySelector('.step-equation').value || '';

    // Validate
    if (isNaN(coeffR) || isNaN(coeffP) || coeffR <= 0 || coeffP <= 0) {
      alert(`Fehler in Schritt ${index + 1}: Ungültige Koeffizienten`);
      hasError = true;
      return;
    }

    // Calculate product amount using stoichiometry
    const productAmount = currentAmount * (coeffP / coeffR);

    // Calculate mass if molar mass is provided
    let productMass = null;
    if (!isNaN(molarMass) && molarMass > 0) {
      productMass = productAmount * molarMass;
    }

    // Store result
    results.push({
      stepNumber: index + 1,
      reactantAmount: currentAmount,
      coeffR,
      coeffP,
      productAmount,
      molarMass,
      productMass,
      product,
      equation
    });

    // This product becomes the reactant for the next step
    currentAmount = productAmount;
  });

  if (hasError) {
    return;
  }

  // Display results
  displayMultiStepResults(initialAmount, initialMolarMass, initialCompound, results);
}

// Display multi-step results
function displayMultiStepResults(initialAmount, initialMolarMass, initialCompound, results) {
  const resultDiv = document.getElementById('multistep-result');
  const contentDiv = document.getElementById('multistep-results-content');

  let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';

  // Initial reactant summary
  html += '<div style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px;">';
  html += `<h4 style="color: #2E7D32; margin-top: 0;"><i class="fa fa-play-circle"></i> Ausgangsstoff</h4>`;
  html += `<p><strong>Verbindung:</strong> ${initialCompound}</p>`;
  html += `<p><strong>Stoffmenge:</strong> ${initialAmount.toFixed(4)} mol</p>`;
  if (!isNaN(initialMolarMass) && initialMolarMass > 0) {
    const initialMass = initialAmount * initialMolarMass;
    html += `<p><strong>Molare Masse:</strong> ${initialMolarMass} g/mol</p>`;
    html += `<p><strong>Masse:</strong> ${initialMass.toFixed(4)} g</p>`;
  }
  html += '</div>';

  // Step-by-step breakdown
  results.forEach((result, index) => {
    const bgColor = index % 2 === 0 ? '#fff3e0' : '#fce4ec';
    const borderColor = index % 2 === 0 ? '#FF9800' : '#E91E63';

    html += `
      <div style="margin-bottom: 15px; padding: 15px; background: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 4px;">
        <h4 style="color: ${index % 2 === 0 ? '#E65100' : '#C2185B'}; margin-top: 0;">
          <i class="fa fa-step-forward"></i> Schritt ${result.stepNumber}
        </h4>
    `;

    if (result.equation) {
      html += `<p><strong>Gleichung:</strong> ${result.equation}</p>`;
    }

    html += `<p><strong>Edukt:</strong> ${result.reactantAmount.toFixed(4)} mol</p>`;
    html += `<p><strong>Koeffizienten:</strong> ν₁ = ${result.coeffR}, ν₂ = ${result.coeffP}</p>`;
    html += `<p><strong>Berechnung:</strong> ${result.product} = ${result.reactantAmount.toFixed(4)} × (${result.coeffP}/${result.coeffR})</p>`;
    html += `<p><strong>Produktstoffmenge:</strong> <strong style="color: ${index % 2 === 0 ? '#E65100' : '#C2185B'}">${result.productAmount.toFixed(4)} mol</strong></p>`;

    if (result.productMass !== null) {
      html += `<p><strong>Produktmasse:</strong> <strong style="color: ${index % 2 === 0 ? '#E65100' : '#C2185B'}">${result.productMass.toFixed(4)} g</strong> (${result.molarMass} g/mol)</p>`;
    }

    html += '</div>';
  });

  // Final summary
  const finalResult = results[results.length - 1];
  const overallYield = (finalResult.productAmount / initialAmount) * 100;

  html += `
    <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
      <h3 style="margin-top: 0;"><i class="fa fa-flag-checkered"></i> Gesamtergebnis</h3>
      <p style="font-size: 16px;"><strong>Ausgangsstoff:</strong> ${initialCompound} (${initialAmount.toFixed(4)} mol)</p>
      <p style="font-size: 16px;"><strong>Endprodukt:</strong> ${finalResult.product} (${finalResult.productAmount.toFixed(4)} mol)</p>
      <p style="font-size: 18px; margin-top: 15px;"><strong>Gesamtausbeute:</strong> ${overallYield.toFixed(2)}%</p>
  `;

  if (finalResult.productMass !== null && !isNaN(initialMolarMass) && initialMolarMass > 0) {
    const initialMass = initialAmount * initialMolarMass;
    const massYield = (finalResult.productMass / initialMass) * 100;
    html += `<p style="font-size: 16px;"><strong>Massenausbeute:</strong> ${massYield.toFixed(2)}%</p>`;
  }

  html += '</div></div>';

  // Export button
  html += `
    <div style="margin-top: 15px; text-align: center;">
      <button class="btn btn-success" onclick="exportMultiStepToPDF()" style="color: white;">
        <i class="fa fa-file-pdf-o"></i> Als PDF exportieren
      </button>
    </div>
  `;

  contentDiv.innerHTML = html;
  resultDiv.style.display = 'block';

  // Save to history
  const lastResult = results[results.length - 1];
  const historyData = `${initialCompound} → ${lastResult.product}: ${lastResult.productAmount.toFixed(4)} mol (${results.length} Schritte)`;
  saveToHistory('Mehrstufige Reaktion', historyData);
}

// Export multi-step results to PDF
function exportMultiStepToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('Stöchiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Mehrstufige Reaktion', 105, 35, { align: 'center' });

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  let y = 60;

  // Get data from DOM
  const initialAmount = document.getElementById('initial-amount').value;
  const initialMolarMass = document.getElementById('initial-molar-mass').value;
  const initialCompound = document.getElementById('initial-compound').value || 'Ausgangsstoff';

  // Initial reactant
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Ausgangsstoff:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Verbindung: ${initialCompound}`, 25, y); y += 8;
  doc.text(`Stoffmenge: ${initialAmount} mol`, 25, y); y += 8;
  if (initialMolarMass) {
    const mass = (parseFloat(initialAmount) * parseFloat(initialMolarMass)).toFixed(4);
    doc.text(`Molare Masse: ${initialMolarMass} g/mol`, 25, y); y += 8;
    doc.text(`Masse: ${mass} g`, 25, y); y += 8;
  }
  y += 10;

  // Steps
  const stepElements = document.querySelectorAll('.reaction-step');
  let currentAmount = parseFloat(initialAmount);

  stepElements.forEach((stepEl, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(` Schritt ${index + 1}`, 20, y);
    y += 8;

    const coeffR = stepEl.querySelector('.step-coeff-r').value;
    const coeffP = stepEl.querySelector('.step-coeff-p').value;
    const product = stepEl.querySelector('.step-product').value || `Produkt ${index + 1}`;
    const equation = stepEl.querySelector('.step-equation').value;
    const molarMass = stepEl.querySelector('.step-molar-mass').value;

    const productAmount = (currentAmount * (parseFloat(coeffP) / parseFloat(coeffR))).toFixed(4);

    doc.setTextColor(0, 0, 0);
    if (equation) {
      doc.text(`Gleichung: ${equation}`, 25, y); y += 8;
    }
    doc.text(`Edukt: ${currentAmount.toFixed(4)} mol`, 25, y); y += 8;
    doc.text(`Koeffizienten: ν₁ = ${coeffR}, ν₂ = ${coeffP}`, 25, y); y += 8;
    doc.text(`Produkt: ${product}`, 25, y); y += 8;
    doc.setTextColor(0, 123, 255);
    doc.text(`Stoffmenge: ${productAmount} mol`, 25, y); y += 8;

    if (molarMass) {
      const productMass = (parseFloat(productAmount) * parseFloat(molarMass)).toFixed(4);
      doc.text(`Masse: ${productMass} g (${molarMass} g/mol)`, 25, y); y += 8;
    }

    currentAmount = parseFloat(productAmount);
    y += 5;
  });

  // Overall yield
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  const overallYield = ((currentAmount / parseFloat(initialAmount)) * 100).toFixed(2);

  doc.setFontSize(14);
  doc.setTextColor(102, 126, 234);
  doc.text(`Gesamtausbeute: ${overallYield}%`, 20, y);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 285);
  doc.text('chemie-lernen.org', 105, 285, { align: 'center' });

  // Save
  doc.save(`mehrstufige-reaktion-${Date.now()}.pdf`);
}

// Event listener for initial mass calculation
document.addEventListener('DOMContentLoaded', () => {
  const initialAmount = document.getElementById('initial-amount');
  const initialMolarMass = document.getElementById('initial-molar-mass');

  if (initialAmount && initialMolarMass) {
    initialAmount.addEventListener('input', updateInitialMass);
    initialMolarMass.addEventListener('input', updateInitialMass);
  }
});

// ===== GAS LAW FUNCTIONS =====

// Load STP conditions (0°C, 1 atm)
function loadSTP() {
  document.getElementById('gas-pressure').value = 1;
  document.getElementById('gas-pressure-unit').value = 'atm';
  document.getElementById('gas-volume').value = 22.414;
  document.getElementById('gas-volume-unit').value = 'L';
  document.getElementById('gas-amount').value = 1;
  document.getElementById('gas-amount-unit').value = 'mol';
  document.getElementById('gas-temperature').value = 0;
  document.getElementById('gas-temperature-unit').value = 'C';
  document.getElementById('gas-constant-select').value = '0.08206';
  document.getElementById('gas-calculate-variable').value = 'V';

  convertTemperatureToKelvin();
}

// Load SATP conditions (25°C, 1 bar)
function loadSATP() {
  document.getElementById('gas-pressure').value = 1;
  document.getElementById('gas-pressure-unit').value = 'bar';
  document.getElementById('gas-volume').value = 24.789;
  document.getElementById('gas-volume-unit').value = 'L';
  document.getElementById('gas-amount').value = 1;
  document.getElementById('gas-amount-unit').value = 'mol';
  document.getElementById('gas-temperature').value = 25;
  document.getElementById('gas-temperature-unit').value = 'C';
  document.getElementById('gas-constant-select').value = '0.08314';
  document.getElementById('gas-calculate-variable').value = 'V';

  convertTemperatureToKelvin();
}

// Load gas example
function loadGasExample() {
  document.getElementById('gas-pressure').value = 2.5;
  document.getElementById('gas-pressure-unit').value = 'atm';
  document.getElementById('gas-volume').value = 10;
  document.getElementById('gas-volume-unit').value = 'L';
  document.getElementById('gas-temperature').value = 25;
  document.getElementById('gas-temperature-unit').value = 'C';
  document.getElementById('gas-constant-select').value = '0.08206';
  document.getElementById('gas-calculate-variable').value = 'n';

  convertTemperatureToKelvin();
}

// Convert temperature to Kelvin for display
function convertTemperatureToKelvin() {
  const temp = parseFloat(document.getElementById('gas-temperature').value);
  const unit = document.getElementById('gas-temperature-unit').value;
  const display = document.getElementById('kelvin-value');

  if (isNaN(temp)) {
    display.textContent = '-';
    return;
  }

  let kelvin;
  switch(unit) {
    case 'K':
      kelvin = temp;
      break;
    case 'C':
      kelvin = temp + 273.15;
      break;
    case 'F':
      kelvin = (temp - 32) * 5/9 + 273.15;
      break;
  }

  display.textContent = kelvin.toFixed(2);
}

// Update input fields based on what to calculate
function updateGasInputs() {
  const variable = document.getElementById('gas-calculate-variable').value;
  const pressureInput = document.getElementById('gas-pressure');
  const volumeInput = document.getElementById('gas-volume');
  const amountInput = document.getElementById('gas-amount');
  const temperatureInput = document.getElementById('gas-temperature');

  // Reset all
  pressureInput.disabled = false;
  volumeInput.disabled = false;
  amountInput.disabled = false;
  temperatureInput.disabled = false;

  // Disable the variable being calculated
  switch(variable) {
    case 'P':
      pressureInput.disabled = true;
      pressureInput.placeholder = "Wird berechnet...";
      volumeInput.placeholder = "z.B. 22.4";
      amountInput.placeholder = "z.B. 1";
      temperatureInput.placeholder = "z.B. 273.15";
      break;
    case 'V':
      volumeInput.disabled = true;
      volumeInput.placeholder = "Wird berechnet...";
      pressureInput.placeholder = "z.B. 1";
      amountInput.placeholder = "z.B. 1";
      temperatureInput.placeholder = "z.B. 273.15";
      break;
    case 'n':
      amountInput.disabled = true;
      amountInput.placeholder = "Wird berechnet...";
      pressureInput.placeholder = "z.B. 1";
      volumeInput.placeholder = "z.B. 22.4";
      temperatureInput.placeholder = "z.B. 273.15";
      break;
    case 'T':
      temperatureInput.disabled = true;
      temperatureInput.placeholder = "Wird berechnet...";
      pressureInput.placeholder = "z.B. 1";
      volumeInput.placeholder = "z.B. 22.4";
      amountInput.placeholder = "z.B. 1";
      break;
  }

  // Clear disabled field
  if (variable === 'P') {pressureInput.value = '';}
  if (variable === 'V') {volumeInput.value = '';}
  if (variable === 'n') {amountInput.value = '';}
  if (variable === 'T') {temperatureInput.value = '';}
}

// Convert pressure to atm (base unit for R = 0.08206)
function convertPressureToAtm(pressure, unit) {
  switch(unit) {
    case 'atm': return pressure;
    case 'bar': return pressure * 0.986923;
    case 'Pa': return pressure / 101325;
    case 'kPa': return pressure / 101.325;
    case 'Torr': return pressure / 760;
    case 'mmHg': return pressure / 760;
    default: return pressure;
  }
}

// Convert volume to liters (base unit for R = 0.08206)
function convertVolumeToLiters(volume, unit) {
  switch(unit) {
    case 'L': return volume;
    case 'mL': return volume / 1000;
    case 'm3': return volume * 1000;
    case 'cm3': return volume / 1000;
    default: return volume;
  }
}

// Convert amount to moles (base unit)
function convertAmountToMoles(amount, unit) {
  switch(unit) {
    case 'mol': return amount;
    case 'mmol': return amount / 1000;
    default: return amount;
  }
}

// Convert temperature to Kelvin
function convertToKelvin(temp, unit) {
  switch(unit) {
    case 'K': return temp;
    case 'C': return temp + 273.15;
    case 'F': return (temp - 32) * 5/9 + 273.15;
    default: return temp;
  }
}

// Calculate gas law
function calculateGasLaw() {
  const calculateVariable = document.getElementById('gas-calculate-variable').value;
  const R = parseFloat(document.getElementById('gas-constant-select').value);

  // Get input values
  const pressureValue = parseFloat(document.getElementById('gas-pressure').value);
  const pressureUnit = document.getElementById('gas-pressure-unit').value;
  const volumeValue = parseFloat(document.getElementById('gas-volume').value);
  const volumeUnit = document.getElementById('gas-volume-unit').value;
  const amountValue = parseFloat(document.getElementById('gas-amount').value);
  const amountUnit = document.getElementById('gas-amount-unit').value;
  const temperatureValue = parseFloat(document.getElementById('gas-temperature').value);
  const temperatureUnit = document.getElementById('gas-temperature-unit').value;

  // Convert all to standard units (atm, L, mol, K) for calculation
  let P_atm, V_L, n_mol, T_K;

  try {
    P_atm = calculateVariable !== 'P' ? convertPressureToAtm(pressureValue, pressureUnit) : null;
    V_L = calculateVariable !== 'V' ? convertVolumeToLiters(volumeValue, volumeUnit) : null;
    n_mol = calculateVariable !== 'n' ? convertAmountToMoles(amountValue, amountUnit) : null;
    T_K = calculateVariable !== 'T' ? convertToKelvin(temperatureValue, temperatureUnit) : null;

    // Validate
    if (calculateVariable !== 'P' && (isNaN(P_atm) || P_atm <= 0)) {
      throw new Error('Ungültiger Druckwert');
    }
    if (calculateVariable !== 'V' && (isNaN(V_L) || V_L <= 0)) {
      throw new Error('Ungültiger Volumenwert');
    }
    if (calculateVariable !== 'n' && (isNaN(n_mol) || n_mol <= 0)) {
      throw new Error('Ungültige Stoffmenge');
    }
    if (calculateVariable !== 'T' && (isNaN(T_K) || T_K <= 0)) {
      throw new Error('Ungültige Temperatur (muss > 0 K sein)');
    }

    // Calculate unknown variable
    let result;
    let resultUnit;

    switch(calculateVariable) {
      case 'n':
        result = (P_atm * V_L) / (R * T_K);
        resultUnit = 'mol';
        break;
      case 'P':
        result = (n_mol * R * T_K) / V_L;
        resultUnit = pressureUnit;
        break;
      case 'V':
        result = (n_mol * R * T_K) / P_atm;
        resultUnit = volumeUnit;
        break;
      case 'T':
        result = (P_atm * V_L) / (n_mol * R);
        resultUnit = 'K';
        break;
    }

    displayGasResult(calculateVariable, result, resultUnit, P_atm, V_L, n_mol, T_K, R);

  } catch (error) {
    alert(error.message);
  }
}

// Display gas calculation result
function displayGasResult(variable, result, unit, P, V, n, T, R) {
  const resultDiv = document.getElementById('gas-result');
  const contentDiv = document.getElementById('gas-result-content');

  const variableNames = {
    'P': 'Druck',
    'V': 'Volumen',
    'n': 'Stoffmenge',
    'T': 'Temperatur'
  };

  let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';

  // Formula display
  html += '<div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; text-align: center;">';
  html += '<h4 style="color: #1976D2; margin-top: 0;">Ideales Gasgesetz</h4>';
  html += '<p style="font-size: 24px; font-weight: bold; color: #0D47A1;">PV = nRT</p>';

  let formulaText = '';
  switch(variable) {
    case 'n':
      formulaText = `n = PV ÷ RT = ${(P).toFixed(4)} × ${(V).toFixed(4)} ÷ (${R} × ${(T).toFixed(2)})`;
      break;
    case 'P':
      formulaText = `P = nRT ÷ V = ${(n).toFixed(4)} × ${R} × ${(T).toFixed(2)} ÷ ${(V).toFixed(4)}`;
      break;
    case 'V':
      formulaText = `V = nRT ÷ P = ${(n).toFixed(4)} × ${R} × ${(T).toFixed(2)} ÷ ${(P).toFixed(4)}`;
      break;
    case 'T':
      formulaText = `T = PV ÷ nR = ${(P).toFixed(4)} × ${(V).toFixed(4)} ÷ (${(n).toFixed(4)} × ${R})`;
      break;
  }
  html += `<p style="font-size: 16px; color: #1976D2;">${formulaText}</p>`;
  html += '</div>';

  // Known values
  html += '<div style="margin-bottom: 20px;">';
  html += '<h4>Bekannte Werte:</h4>';
  html += '<table class="table table-bordered" style="background: white;">';
  if (variable !== 'P') {html += `<tr><td><strong>Druck (P)</strong></td><td>${P.toFixed(4)} atm</td></tr>`;}
  if (variable !== 'V') {html += `<tr><td><strong>Volumen (V)</strong></td><td>${V.toFixed(4)} L</td></tr>`;}
  if (variable !== 'n') {html += `<tr><td><strong>Stoffmenge (n)</strong></td><td>${n.toFixed(4)} mol</td></tr>`;}
  if (variable !== 'T') {html += `<tr><td><strong>Temperatur (T)</strong></td><td>${T.toFixed(2)} K (${convertFromKelvin(T).toFixed(1)}°C)</td></tr>`;}
  html += `<tr><td><strong>Gaskonstante (R)</strong></td><td>${R} L·atm/(mol·K)</td></tr>`;
  html += '</table>';
  html += '</div>';

  // Result
  html += '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center;">';
  html += `<h3 style="margin-top: 0;">${variableNames[variable]}</h3>`;
  html += `<p style="font-size: 32px; font-weight: bold;">${result.toFixed(4)} ${unit}</p>`;

  if (variable === 'T') {
    html += `<p style="font-size: 18px;">(${convertFromKelvin(result).toFixed(1)}°C)</p>`;
  }

  // Additional calculations
  html += '<div style="margin-top: 20px; text-align: left;">';
  if (variable === 'n') {
    const molarVolume = V / result;
    html += `<p><strong>Molares Volumen:</strong> ${molarVolume.toFixed(4)} L/mol</p>`;
    const massExample = result * 2.016; // H2 example
    html += `<p><strong>Beispiel (H₂):</strong> ${massExample.toFixed(4)} g</p>`;
  }
  if (variable === 'V' && n > 0) {
    const molarVolume = result / n;
    html += `<p><strong>Molares Volumen:</strong> ${molarVolume.toFixed(4)} L/mol</p>`;
  }
  html += '</div>';
  html += '</div>';

  html += '</div>';

  contentDiv.innerHTML = html;
  resultDiv.style.display = 'block';

  // Save to history
  const historyData = `${variableNames[variable]}: ${result.toFixed(4)} ${unit}`;
  saveToHistory('Gasgesetz (PV=nRT)', historyData);
}

// Convert from Kelvin to Celsius
function convertFromKelvin(kelvin) {
  return kelvin - 273.15;
}

// Export gas calculation to PDF
function exportGasToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('Stöchiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Ideales Gasgesetz (PV=nRT)', 105, 35, { align: 'center' });

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  let y = 60;

  // Get data
  const calculateVariable = document.getElementById('gas-calculate-variable').value;
  const R = document.getElementById('gas-constant-select').value;
  const pressure = document.getElementById('gas-pressure').value;
  const pressureUnit = document.getElementById('gas-pressure-unit').value;
  const volume = document.getElementById('gas-volume').value;
  const volumeUnit = document.getElementById('gas-volume-unit').value;
  const amount = document.getElementById('gas-amount').value;
  const amountUnit = document.getElementById('gas-amount-unit').value;
  const temperature = document.getElementById('gas-temperature').value;
  const temperatureUnit = document.getElementById('gas-temperature-unit').value;

  // Title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Berechnung: ' + calculateVariable, 20, y);
  y += 15;

  // Input values
  doc.setFontSize(12);
  doc.text('Eingabewerte:', 20, y); y += 10;

  if (calculateVariable !== 'P') {doc.text(`Druck: ${pressure} ${pressureUnit}`, 25, y);} y += 8;
  if (calculateVariable !== 'V') {doc.text(`Volumen: ${volume} ${volumeUnit}`, 25, y);} y += 8;
  if (calculateVariable !== 'n') {doc.text(`Stoffmenge: ${amount} ${amountUnit}`, 25, y);} y += 8;
  if (calculateVariable !== 'T') {doc.text(`Temperatur: ${temperature} ${temperatureUnit}`, 25, y);} y += 8;
  doc.text(`Gaskonstante: R = ${R}`, 25, y); y += 15;

  // Formula
  doc.setFontSize(14);
  doc.setTextColor(0, 123, 255);
  doc.text('Formel: PV = nRT', 20, y); y += 15;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 285);
  doc.text('chemie-lernen.org', 105, 285, { align: 'center' });

  // Save
  doc.save(`gasgesetz-${calculateVariable}-${Date.now()}.pdf`);
}

// Initialize gas inputs on page load
document.addEventListener('DOMContentLoaded', () => {
  updateGasInputs();
  const tempInput = document.getElementById('gas-temperature');
  const tempUnit = document.getElementById('gas-temperature-unit');

  if (tempInput && tempUnit) {
    tempInput.addEventListener('input', convertTemperatureToKelvin);
    tempUnit.addEventListener('change', convertTemperatureToKelvin);
  }
});

// ===== PRACTICE MODE FUNCTIONS =====

// Practice state
let practiceState = {
  score: 0,
  correct: 0,
  incorrect: 0,
  currentProblem: null,
  problemNumber: 1,
  active: false
};

// Start practice mode
function startPractice() {
  const type = document.getElementById('practice-type').value;
  const difficulty = document.getElementById('practice-difficulty').value;

  practiceState.active = true;
  practiceState.problemNumber = 1;

  document.getElementById('practice-setup').style.display = 'none';
  document.getElementById('practice-problem').style.display = 'block';

  generateProblem(type, difficulty);
}

// Generate a problem
function generateProblem(type, difficulty) {
  let problemType = type;

  if (type === 'random') {
    const types = ['mol-mol', 'mass-mass', 'limiting', 'yield'];
    problemType = types[Math.floor(Math.random() * types.length)];
  }

  switch(problemType) {
    case 'mol-mol':
      generateMolMolProblem(difficulty);
      break;
    case 'mass-mass':
      generateMassMassProblem(difficulty);
      break;
    case 'limiting':
      generateLimitingProblem(difficulty);
      break;
    case 'yield':
      generateYieldProblem(difficulty);
      break;
  }
}

// Generate Mol-Mol problem
function generateMolMolProblem(difficulty) {
  let n1, v1, v2;

  if (difficulty === 'easy') {
    v1 = Math.floor(Math.random() * 3) + 1; // 1-3
    v2 = Math.floor(Math.random() * 3) + 1; // 1-3
    n1 = Math.floor(Math.random() * 10) + 1; // 1-10 mol
  } else if (difficulty === 'medium') {
    v1 = Math.floor(Math.random() * 5) + 1;
    v2 = Math.floor(Math.random() * 5) + 1;
    n1 = (Math.floor(Math.random() * 50) + 1) / 2; // 0.5-25.5 mol
  } else { // hard
    v1 = Math.floor(Math.random() * 6) + 2; // 2-7
    v2 = Math.floor(Math.random() * 6) + 2;
    n1 = (Math.floor(Math.random() * 200) + 10) / 10; // 1-21 mol
  }

  const answer = n1 * (v2 / v1);

  practiceState.currentProblem = {
    type: 'mol-mol',
    n1,
    v1,
    v2,
    answer,
    tolerance: 0.01 // 1% tolerance
  };

  const problemHTML = `
    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
      <p><strong>Aufgabe:</strong> Berechne die Stoffmenge des Produkts.</p>
      <p style="font-size: 18px; margin: 15px 0;">
        Gegeben: ${n1} mol Edukt (Koeffizient: ${v1})<br>
        Koeffizient des Produkts: ${v2}
      </p>
      <p><strong>Frage:</strong> Wie viel Mol Produkt werden gebildet?</p>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">
        <i class="fa fa-lightbulb-o"></i> Tipp: Verwende die Formel n₂ = n₁ × (ν₂/ν₁)
      </p>
    </div>
  `;

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

// Generate Mass-Mass problem
function generateMassMassProblem(difficulty) {
  let m1, M1, M2, v1, v2;

  const elements = [
    { symbol: 'H₂', M: 2.016 },
    { symbol: 'O₂', M: 32.00 },
    { symbol: 'N₂', M: 28.02 },
    { symbol: 'Cl₂', M: 70.90 },
    { symbol: 'CO₂', M: 44.01 },
    { symbol: 'H₂O', M: 18.02 },
    { symbol: 'NH₃', M: 17.03 },
    { symbol: 'CH₄', M: 16.04 },
    { symbol: 'NaCl', M: 58.44 },
    { symbol: 'CaCO₃', M: 100.09 }
  ];

  if (difficulty === 'easy') {
    v1 = v2 = 1;
    M1 = elements[Math.floor(Math.random() * 5)].M;
    M2 = elements[Math.floor(Math.random() * 5)].M;
    m1 = Math.floor(Math.random() * 10) + 1; // 1-10 g
  } else if (difficulty === 'medium') {
    v1 = Math.floor(Math.random() * 2) + 1;
    v2 = Math.floor(Math.random() * 2) + 1;
    M1 = elements[Math.floor(Math.random() * 7)].M;
    M2 = elements[Math.floor(Math.random() * 7)].M;
    m1 = (Math.floor(Math.random() * 50) + 5) / 2; // 2.5-27.5 g
  } else { // hard
    v1 = Math.floor(Math.random() * 3) + 1;
    v2 = Math.floor(Math.random() * 3) + 1;
    M1 = elements[Math.floor(Math.random() * 10)].M;
    M2 = elements[Math.floor(Math.random() * 10)].M;
    m1 = (Math.floor(Math.random() * 200) + 10) / 4; // 2.5-52.5 g
  }

  const n1 = m1 / M1;
  const n2 = n1 * (v2 / v1);
  const answer = n2 * M2;

  practiceState.currentProblem = {
    type: 'mass-mass',
    m1,
    M1,
    M2,
    v1,
    v2,
    answer,
    tolerance: 0.02 // 2% tolerance
  };

  const problemHTML = `
    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
      <p><strong>Aufgabe:</strong> Berechne die Masse des Produkts.</p>
      <p style="font-size: 16px; margin: 15px 0;">
        Edukt: ${m1.toFixed(2)} g (molare Masse: ${M1.toFixed(2)} g/mol, Koeffizient: ${v1})<br>
        Produkt: molare Masse = ${M2.toFixed(2)} g/mol (Koeffizient: ${v2})
      </p>
      <p><strong>Frage:</strong> Wie viel Gramm Produkt werden gebildet?</p>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">
        <i class="fa fa-lightbulb-o"></i> Tipp: Gehe in 3 Schritten vor (Masse → Mol → Mol → Masse)
      </p>
    </div>
  `;

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

// Generate Limiting Reactant problem
function generateLimitingProblem(difficulty) {
  let m1, M1, m2, M2;

  const elements = [
    { symbol: 'H₂', M: 2.016 },
    { symbol: 'O₂', M: 32.00 },
    { symbol: 'N₂', M: 28.02 },
    { symbol: 'Na', M: 22.99 },
    { symbol: 'K', M: 39.10 }
  ];

  M1 = elements[Math.floor(Math.random() * elements.length)].M;
  M2 = elements[Math.floor(Math.random() * elements.length)].M;

  if (difficulty === 'easy') {
    m1 = Math.floor(Math.random() * 20) + 5;
    m2 = Math.floor(Math.random() * 20) + 5;
  } else if (difficulty === 'medium') {
    m1 = (Math.floor(Math.random() * 100) + 10) / 2;
    m2 = (Math.floor(Math.random() * 100) + 10) / 2;
  } else { // hard
    m1 = (Math.floor(Math.random() * 200) + 10) / 4;
    m2 = (Math.floor(Math.random() * 200) + 10) / 4;
  }

  const n1 = m1 / M1;
  const n2_2 = m2 / M2;
  const answer = n1 < n2_2 ? 1 : 2;

  practiceState.currentProblem = {
    type: 'limiting',
    m1,
    M1,
    m2,
    M2,
    answer,
    tolerance: 0
  };

  const problemHTML = `
    <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800;">
      <p><strong>Aufgabe:</strong> Bestimme das limitierende Reagenz.</p>
      <p style="font-size: 16px; margin: 15px 0;">
        Reagenz 1: ${m1.toFixed(2)} g (molare Masse: ${M1.toFixed(2)} g/mol)<br>
        Reagenz 2: ${m2.toFixed(2)} g (molare Masse: ${M2.toFixed(2)} g/mol)<br>
        <small>Beide Reagenzien reagieren im 1:1 Verhältnis</small>
      </p>
      <p><strong>Frage:</strong> Welches Reagenz ist limitierend? (Antworte mit 1 oder 2)</p>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">
        <i class="fa fa-lightbulb-o"></i> Tipp: Vergleiche die Stoffmengen in Mol
      </p>
    </div>
  `;

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

// Generate Yield problem
function generateYieldProblem(difficulty) {
  let theoretical, actual, yieldPct;

  if (difficulty === 'easy') {
    yieldPct = Math.floor(Math.random() * 30) + 70; // 70-100%
    theoretical = Math.floor(Math.random() * 20) + 10;
  } else if (difficulty === 'medium') {
    yieldPct = (Math.floor(Math.random() * 50) + 50) / 2; // 25-75%
    theoretical = (Math.floor(Math.random() * 100) + 10) / 2;
  } else { // hard
    yieldPct = (Math.floor(Math.random() * 80) + 10) / 2; // 5-45%
    theoretical = (Math.floor(Math.random() * 150) + 5) / 4;
  }

  actual = (theoretical * yieldPct) / 100;
  const answer = yieldPct;

  practiceState.currentProblem = {
    type: 'yield',
    theoretical,
    actual,
    answer,
    tolerance: 1 // 1% tolerance
  };

  const problemHTML = `
    <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9C27B0;">
      <p><strong>Aufgabe:</strong> Berechne die prozentuale Ausbeute.</p>
      <p style="font-size: 16px; margin: 15px 0;">
        Theoretische Ausbeute: ${theoretical.toFixed(2)} g<br>
        Praktische Ausbeute: ${actual.toFixed(2)} g
      </p>
      <p><strong>Frage:</strong> Wie hoch ist die prozentuale Ausbeute?</p>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">
        <i class="fa fa-lightbulb-o"></i> Tipp: Ausbeute = (Praktisch / Theoretisch) × 100%
      </p>
    </div>
  `;

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

// Check answer
function checkAnswer() {
  const userAnswer = parseFloat(document.getElementById('practice-answer').value);

  if (isNaN(userAnswer)) {
    alert('Bitte gib eine Zahl ein');
    return;
  }

  const problem = practiceState.currentProblem;
  const correctAnswer = problem.answer;
  const tolerance = problem.tolerance || 0.01;

  const isCorrect = Math.abs((userAnswer - correctAnswer) / correctAnswer) <= tolerance;

  showFeedback(isCorrect, correctAnswer, userAnswer, tolerance);
  updateScore(isCorrect);
}

// Show feedback
function showFeedback(isCorrect, correctAnswer, userAnswer, tolerance) {
  const feedbackDiv = document.getElementById('feedback-section');
  feedbackDiv.style.display = 'block';

  if (isCorrect) {
    feedbackDiv.innerHTML = `
      <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px;">
        <h4 style="margin-top: 0;"><i class="fa fa-check-circle"></i> Richtig! 🎉</h4>
        <p>Deine Antwort (${userAnswer.toFixed(4)}) ist korrekt!</p>
        ${problemDetailHTML(correctAnswer)}
      </div>
    `;
  } else {
    const diffPercent = ((userAnswer - correctAnswer) / correctAnswer * 100).toFixed(1);
    feedbackDiv.innerHTML = `
      <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px;">
        <h4 style="margin-top: 0;"><i class="fa fa-times-circle"></i> Leider falsch</h4>
        <p>Deine Antwort: ${userAnswer.toFixed(4)}</p>
        <p>Korrekte Antwort: <strong>${correctAnswer.toFixed(4)}</strong></p>
        <p>Abweichung: ${diffPercent}%</p>
        ${problemDetailHTML(correctAnswer)}
      </div>
    `;
  }

  // Auto-load next problem after delay
  setTimeout(() => {
    if (isCorrect) {
      practiceState.problemNumber++;
      const type = document.getElementById('practice-type').value;
      const difficulty = document.getElementById('practice-difficulty').value;
      generateProblem(type, difficulty);
    }
  }, 2000);
}

// Generate problem detail HTML
function problemDetailHTML(answer) {
  const problem = practiceState.currentProblem;

  switch(problem.type) {
    case 'mol-mol':
      return `
        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">
          <strong>Lösungsweg:</strong><br>
          n₂ = ${problem.n1} × (${problem.v2}/${problem.v1}) = ${answer.toFixed(4)} mol
        </div>
      `;
    case 'mass-mass': {
      const n1 = problem.m1 / problem.M1;
      const n2 = n1 * (problem.v2 / problem.v1);
      return `
        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">
          <strong>Lösungsweg:</strong><br>
          Schritt 1: n₁ = ${problem.m1.toFixed(2)} / ${problem.M1.toFixed(2)} = ${n1.toFixed(4)} mol<br>
          Schritt 2: n₂ = ${n1.toFixed(4)} × (${problem.v2}/${problem.v1}) = ${n2.toFixed(4)} mol<br>
          Schritt 3: m₂ = ${n2.toFixed(4)} × ${problem.M2.toFixed(2)} = ${answer.toFixed(2)} g
        </div>
      `;
    }
    case 'limiting': {
      const n1_limiting = problem.m1 / problem.M1;
      const n2_limiting = problem.m2 / problem.M2;
      const name = answer === 1 ? 'Reagenz 1' : 'Reagenz 2';
      return `
        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">
          <strong>Lösungsweg:</strong><br>
          Reagenz 1: ${n1_limiting.toFixed(4)} mol<br>
          Reagenz 2: ${n2_limiting.toFixed(4)} mol<br>
          ${name} hat weniger Mol und ist daher limitierend.
        </div>
      `;
    }
    case 'yield':
      return `
        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">
          <strong>Lösungsweg:</strong><br>
          Ausbeute = (${problem.actual.toFixed(2)} / ${problem.theoretical.toFixed(2)}) × 100% = ${answer.toFixed(1)}%
        </div>
      `;
    default:
      return '';
  }
}

// Update score
function updateScore(isCorrect) {
  if (isCorrect) {
    practiceState.correct++;
    practiceState.score += 10;
  } else {
    practiceState.incorrect++;
    practiceState.score = Math.max(0, practiceState.score - 5);
  }

  document.getElementById('practice-score').textContent = practiceState.score;
  document.getElementById('correct-count').textContent = practiceState.correct;
  document.getElementById('incorrect-count').textContent = practiceState.incorrect;
}

// Skip problem
function skipProblem() {
  practiceState.incorrect++;
  practiceState.score = Math.max(0, practiceState.score - 2);

  document.getElementById('practice-score').textContent = practiceState.score;
  document.getElementById('correct-count').textContent = practiceState.correct;
  document.getElementById('incorrect-count').textContent = practiceState.incorrect;

  practiceState.problemNumber++;
  const type = document.getElementById('practice-type').value;
  const difficulty = document.getElementById('practice-difficulty').value;
  generateProblem(type, difficulty);
}

// Reset practice
function resetPractice() {
  if (confirm('Möchtest du den Übungsmodus wirklich neustarten? Dein Punktestand wird zurückgesetzt.')) {
    practiceState = {
      score: 0,
      correct: 0,
      incorrect: 0,
      currentProblem: null,
      problemNumber: 1,
      active: false
    };

    document.getElementById('practice-score').textContent = '0';
    document.getElementById('correct-count').textContent = '0';
    document.getElementById('incorrect-count').textContent = '0';
    document.getElementById('practice-setup').style.display = 'block';
    document.getElementById('practice-problem').style.display = 'none';
  }
}

// ===== INTERACTIVE TUTORIAL SYSTEM =====

// Tutorial state management
const tutorialState = {
  currentTutorial: null,
  currentStep: 0,
  completedTutorials: JSON.parse(localStorage.getItem('completedTutorials') || '[]')
};

// Tutorial content database
const tutorials = {
  1: {
    title: 'Was ist Stöchiometrie?',
    color: '#4CAF50',
    steps: [
      {
        title: 'Willkommen zur Stöchiometrie! 🧪',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;">🎯 Lernziele</h4>
            <p>Nach diesem Tutorial wirst du verstehen:</p>
            <ul style="color: #1b5e20;">
              <li>Was Stöchiometrie ist und warum sie wichtig ist</li>
              <li>Das Konzept der Stoffmenge (Mol)</li>
              <li>Wie chemische Gleichungen als "Rezepte" funktionieren</li>
              <li>Die Grundlage aller stöchiometrischen Berechnungen</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-question-circle" style="color: #4CAF50;"></i> Was bedeutet "Stöchiometrie"?</h5>
            <p>Das Wort kommt aus dem Griechischen:</p>
            <ul>
              <li><strong>stoicheion</strong> = Element</li>
              <li><strong>metron</strong> = Maß</li>
            </ul>
            <p>Stöchiometrie ist also das <strong"Messen von Elementen</strong> - die Berechnung der Mengenverhältnisse bei chemischen Reaktionen.</p>
          </div>
        `
      },
      {
        title: 'Das Mol - Die Grundlage 📊',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;"><i class="fa fa-lightbulb-o"></i> Das Wichtigste auf einen Blick</h4>
            <p><strong>1 Mol</strong> ist die Menge eines Stoffes, die genau <strong>6.022 × 10²³ Teilchen</strong> enthält.</p>
            <p style="font-size: 18px; color: #e65100; text-align: center; margin: 15px 0;">
              <strong>1 Mol = 602.200.000.000.000.000.000.000 Teilchen</strong>
            </p>
            <p>Diese Zahl heißt <strong>Avogadro-Konstante</strong> (Nₐ).</p>
          </div>

          <div style="margin-top: 20px;">
            <h5>🎨 Eine Analogie</h5>
            <p>Stell dir vor, ein <strong>Dutzend</strong> sind 12 Stück:</p>
            <ul>
              <li>1 Dutzend Eier = 12 Eier</li>
              <li>1 Dutzend Stifte = 12 Stifte</li>
            </ul>
            <p>In der Chemie ist das <strong>Mol</strong> unser "Dutzend" - nur viel größer!</p>
            <ul>
              <li>1 Mol Atome = 6.022 × 10²³ Atome</li>
              <li>1 Mol Moleküle = 6.022 × 10²³ Moleküle</li>
            </ul>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #1565c0;"><i class="fa fa-balance-scale"></i> Mol und Masse</h5>
            <p>Die Masse von 1 Mol nennt man <strong>molare Masse</strong> (M). Sie hängt vom Element ab:</p>
            <ul>
              <li>1 Mol Kohlenstoff (C) wiegt <strong>12.01 g</strong></li>
              <li>1 Mol Wasserstoff (H) wiegt <strong>1.008 g</strong></li>
              <li>1 Mol Sauerstoff (O) wiegt <strong>16.00 g</strong></li>
            </ul>
            <p><strong>Formel:</strong> n = m / M (Stoffmenge = Masse / molare Masse)</p>
          </div>
        `
      },
      {
        title: 'Chemische Gleichungen als Rezepte 📝',
        content: `
          <div style="background: #fce4ec; padding: 20px; border-radius: 8px; border-left: 4px solid #E91E63;">
            <h4 style="color: #c2185b; margin-top: 0;"><i class="fa fa-cutlery"></i> Rezepte in der Küche und Chemie</h4>
            <p>Ein chemisches Rezept (Gleichung) funktioniert genau wie ein Kochrezept!</p>
          </div>

          <div style="margin-top: 20px;">
            <h5>🍳 Beispiel: Kuchen backen</h5>
            <div style="background: #fff; padding: 15px; border: 2px dashed #ccc; border-radius: 8px;">
              <p><strong>Rezept:</strong> 2 Eier + 3 Tassen Mehl → 1 Kuchen</p>
              <p><em>Wenn du 6 Eier hast, wie viele Tassen Mehl brauchst du?</em></p>
              <p style="color: #4CAF50; font-weight: bold;">Lösung: 9 Tassen Mehl (Verhältnis 2:3)</p>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <h5>⚗️ Chemisches Beispiel: Wasserbildung</h5>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; font-size: 18px; text-align: center;">
              <p><strong>2 H₂ + O₂ → 2 H₂O</strong></p>
            </div>
            <p style="margin-top: 15px;">Diese Gleichung sagt:</p>
            <ul>
              <li><strong>2 Moleküle</strong> H₂ reagieren mit <strong>1 Molekül</strong> O₂</li>
              <li>Es entstehen <strong>2 Moleküle</strong> H₂O</li>
              <li>Das Verhältnis ist <strong>2:1:2</strong></li>
            </ul>
            <p>Auf Mol-Ebene: <strong>2 mol H₂ + 1 mol O₂ → 2 mol H₂O</strong></p>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-star"></i> Das Prinzip</h5>
            <p>Die <strong>Koeffizienten</strong> (Zahlen vor den Formeln) geben das Mengenverhältnis an:</p>
            <p style="font-size: 16px; text-align: center;">
              ν₁ A + ν₂ B → ν₃ C + ν₄ D
            </p>
            <p>Daraus folgt: <strong>n(A) / ν₁ = n(B) / ν₂ = n(C) / ν₃ = n(D) / ν₄</strong></p>
          </div>
        `
      },
      {
        title: 'Warum ist Stöchiometrie wichtig? 🎯',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-industry"></i> In der Industrie</h4>
            <p>Chemische Unternehmen müssen genau berechnen:</p>
            <ul>
              <li>Wie viel Rohstoff wird benötigt für eine gewünschte Produktmenge?</li>
              <li>Was kostet die Produktion?</li>
              <li>Wie viel Abfall entsteht?</li>
            </ul>
          </div>

          <div style="background: #f1f8e9; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4 style="color: #558b2f; margin-top: 0;"><i class="fa fa-flask"></i> Im Labor</h4>
            <p>Chemiker verwenden Stöchiometrie für:</p>
            <ul>
              <li>Die Synthese neuer Verbindungen</li>
              <li>Quantitative Analysen</li>
              <li>Qualitätskontrolle</li>
            </ul>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4 style="color: #ef6c00; margin-top: 0;"><i class="fa fa-leaf"></i> In der Umwelt</h4>
            <p>Stöchiometrie hilft uns zu verstehen:</p>
            <ul>
              <li>Wie viel CO₂ bei der Verbrennung entsteht</li>
              <li>Wie viel Abgas ein Auto produziert</li>
              <li>Wie man Umweltbelastung reduziert</li>
            </ul>
          </div>

          <div style="background: #fce4ec; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4 style="color: #c2185b; margin-top: 0;"><i class="fa fa-heartbeat"></i> Im Körper</h4>
            <p>Dein Körper nutzt stöchiometrische Prinzipien:</p>
            <ul>
              <li>Zellatmung: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energie</li>
              <li>Photosynthese: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Zusammenfassung & Quiz 📝',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Was du jetzt wissen solltest</h4>
            <ol>
              <li><strong>Stöchiometrie</strong> = Lehre von den Mengenverhältnissen in chemischen Reaktionen</li>
              <li><strong>1 Mol</strong> = 6.022 × 10²³ Teilchen (Avogadro-Konstante)</li>
              <li><strong>Molare Masse</strong> = Masse von 1 Mol (in g/mol)</li>
              <li><strong>Koeffizienten</strong> in Gleichungen geben das Mengenverhältnis an</li>
              <li>Stöchiometrie ist wichtig in Industrie, Labor, Umwelt und Biologie</li>
            </ol>
          </div>

          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-puzzle-piece"></i> Teste dein Wissen!</h4>

            <div style="margin-top: 15px;">
              <p><strong>Frage 1:</strong> Wie viele Teilchen sind in 1 Mol?</p>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">A) 1 Milliarde</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="true">B) 6.022 × 10²³</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">C) 1000</button>
            </div>

            <div style="margin-top: 15px;">
              <p><strong>Frage 2:</strong> Was gibt die molare Masse an?</p>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="true">A) Masse von 1 Mol</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">B) Anzahl der Atome</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">C) Volumen eines Stoffes</button>
            </div>

            <div style="margin-top: 15px;">
              <p><strong>Frage 3:</strong> In der Gleichung "2 H₂ + O₂ → 2 H₂O", was ist das Verhältnis H₂:O₂:H₂O?</p>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="true">A) 2:1:2</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">B) 1:1:1</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">C) 2:2:1</button>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Gratulation!</strong> Du hast Tutorial 1 abgeschlossen! Klicke auf "Weiter", um fortzufahren.</p>
          </div>
        `
      }
    ]
  },
  2: {
    title: 'Mol-Mol Umrechnung',
    color: '#2196F3',
    steps: [
      {
        title: 'Einführung in Mol-Mol Berechnungen 🔄',
        content: `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3;">
            <h4 style="color: #1565c0; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>In diesem Tutorial lernst du:</p>
            <ul>
              <li>Wie man Stoffmengen mit Hilfe von Koeffizienten umrechnet</li>
              <li>Die grundlegende Formel: n₂ = n₁ × (ν₂/ν₁)</li>
              <li>Praktische Beispiele Schritt für Schritt durchzurechnen</li>
            </ul>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-question-circle" style="color: #2196F3;"></i> Warum Mol-Mol?</h5>
            <p>Die Mol-Mol-Umrechnung ist die <strong>grundlegendste stöchiometrische Berechnung</strong>. Alle anderen Berechnungen (Masse-Masse, Volumen-Volumen) basieren darauf!</p>
            <p>Du rechnest Stoffmengen um, wenn du:</p>
            <ul>
              <li>Willst wissen, wie viel Produkt entsteht</li>
              <li>Berechnen willst, wie viel Edukt verbraucht wird</li>
              <li>Reaktionspartner im richtigen Verhältnis mischen willst</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Die Grundformel 📐',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;"><i class="fa fa-balance-scale"></i> Die wichtigste Formel!</h4>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; margin: 15px 0;">
              <strong>n₂ = n₁ × (ν₂/ν₁)</strong>
            </div>
            <p>Haben die Geduld, diese Formel zu verstehen - sie ist der Schlüssel zur Stöchiometrie!</p>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-book"></i> Die Variablen erklärt</h5>
            <table class="table table-striped" style="margin-top: 15px;">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Bedeutung</th>
                  <th>Einheit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>n₁</strong></td>
                  <td>Stoffmenge des Edukts (gegeben)</td>
                  <td>mol</td>
                </tr>
                <tr>
                  <td><strong>n₂</strong></td>
                  <td>Stoffmenge des Produkts (gesucht)</td>
                  <td>mol</td>
                </tr>
                <tr>
                  <td><strong>ν₁</strong></td>
                  <td>Koeffizient des Edukts in der Gleichung</td>
                  <td>(dimensionslos)</td>
                </tr>
                <tr>
                  <td><strong>ν₂</strong></td>
                  <td>Koeffizient des Produkts in der Gleichung</td>
                  <td>(dimensionslos)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #2e7d32;"><i class="fa fa-lightbulb-o"></i> Woher kommt diese Formel?</h5>
            <p>Aus der <strong>Proportion</strong> der Koeffizienten:</p>
            <p style="text-align: center; font-size: 18px;">
              n₁ / ν₁ = n₂ / ν₂
            </p>
            <p>Umgestellt nach n₂:</p>
            <p style="text-align: center; font-size: 20px; color: #4CAF50;">
              n₂ = n₁ × (ν₂/ν₁)
            </p>
          </div>
        `
      },
      {
        title: 'Beispiel 1: Wasserbildung 💧',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-tint"></i> Aufgabe</h4>
            <p>Gegeben ist die Wasserbildung:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 22px; margin: 10px 0;">
              <strong>2 H₂ + O₂ → 2 H₂O</strong>
            </div>
            <p><strong>Frage:</strong> Wie viel Mol H₂O entstehen, wenn 5 mol H₂ reagieren?</p>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Identifiziere die Größen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>• n₁ = 5 mol (H₂, gegeben)</p>
                <p>• ν₁ = 2 (Koeffizient von H₂)</p>
                <p>• ν₂ = 2 (Koeffizient von H₂O)</p>
                <p>• n₂ = ? (gesucht)</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> Einsetzen in die Formel</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p style="font-size: 18px;">n₂ = 5 mol × (2/2)</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Ausrechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p style="font-size: 18px;">n₂ = 5 mol × 1</p>
                <p style="font-size: 18px; color: #4CAF50;"><strong>n₂ = 5 mol</strong></p>
              </div>
            </div>

            <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
              <p><strong>✅ Lösung:</strong> Aus 5 mol H₂ entstehen 5 mol H₂O!</p>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-eye"></i> Beobachtung</h5>
            <p>Weil beide Koeffizienten gleich sind (2 und 2), ist das Verhältnis 1:1. Die Stoffmenge bleibt gleich!</p>
          </div>
        `
      },
      {
        title: 'Beispiel 2: Methanverbrennung 🔥',
        content: `
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #F44336;">
            <h4 style="color: #c62828; margin-top: 0;"><i class="fa fa-fire"></i> Aufgabe</h4>
            <p>Verbrennung von Methan:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 22px; margin: 10px 0;">
              <strong>CH₄ + 2 O₂ → CO₂ + 2 H₂O</strong>
            </div>
            <p><strong>Frage:</strong> Wie viel Mol CO₂ entstehen aus 3 mol CH₄?</p>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Identifiziere die Größen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>• n₁ = 3 mol (CH₄, gegeben)</p>
                <p>• ν₁ = 1 (Koeffizient von CH₄)</p>
                <p>• ν₂ = 1 (Koeffizient von CO₂)</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> Einsetzen in die Formel</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p style="font-size: 18px;">n(CO₂) = 3 mol × (1/1)</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Ausrechnen</p>
              <div style="background: #c8e6c9; padding: 10px; border-radius: 4px;">
                <p style="font-size: 18px; color: #4CAF50;"><strong>n(CO₂) = 3 mol</strong></p>
              </div>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <h5 style="color: #1565c0;"><i class="fa fa-plus-circle"></i> Zusatzfrage</h5>
            <p><strong>Wie viel Mol H₂O entstehen gleichzeitig?</strong></p>
            <p>Hier ist ν(H₂O) = 2:</p>
            <p style="font-size: 18px; text-align: center;">n(H₂O) = 3 mol × (2/1) = <strong>6 mol</strong></p>
          </div>
        `
      },
      {
        title: 'Praxis & Zusammenfassung ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Merke dir</h4>
            <ul>
              <li><strong>Formel:</strong> n₂ = n₁ × (ν₂/ν₁)</li>
              <li><strong>Einheiten:</strong> Alle Stoffmengen in mol</li>
              <li><strong>Koeffizienten:</strong> Aus der ausgeglichenen Gleichung ablesen</li>
              <li><strong>Verhältnis:</strong> Das Verhältnis ν₂/ν₁ skaliert die Stoffmenge</li>
            </ul>
          </div>

          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Probier es selbst!</h4>

            <div style="margin-top: 15px;">
              <p><strong>Aufgabe:</strong> N₂ + 3 H₂ → 2 NH₃ (Haber-Verfahren)</p>
              <p>Wie viel Mol NH₃ entstehen aus 4 mol N₂?</p>

              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                  <strong>Lösung anzeigen</strong>
                </summary>
                <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                  <p><strong>Schritt 1:</strong> n₁ = 4 mol, ν₁ = 1, ν₂ = 2</p>
                  <p><strong>Schritt 2:</strong> n(NH₃) = 4 mol × (2/1)</p>
                  <p><strong>Schritt 3:</strong> n(NH₃) = <strong>8 mol</strong></p>
                </div>
              </details>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Super!</strong> Du kennst jetzt die Grundlage aller stöchiometrischen Berechnungen!</p>
            <p style="margin: 10px 0 0 0;">Als nächstes lernst du, wie man Massen umrechnet (Tutorial 3).</p>
          </div>
        `
      }
    ]
  },
  3: {
    title: 'Masse-Masse Umrechnung',
    color: '#FF9800',
    steps: [
      {
        title: 'Von Masse zu Masse und zurück 🔄',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>Im Labor wiegen wir Stoffe in Gramm, nicht in Mol! Du lernst:</p>
            <ul>
              <li>Die 3-Schritt-Methode für Masse-Masse-Berechnungen</li>
              <li>Wie man Masse → Mol → Mol → Masse umrechnet</li>
              <li>Praktische Beispiele aus dem Laboralltag</li>
            </ul>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-road"></i> Der Weg von Masse zu Masse</h5>
            <p>Um von einer Masse zur anderen zu kommen, brauchst du einen <strong>Umweg über Mol</strong>:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
              <p style="font-size: 20px; margin: 10px 0;">
                m₁ <span style="color: #FF9800;">→</span> n₁ <span style="color: #FF9800;">→</span> n₂ <span style="color: #FF9800;">→</span> m₂
              </p>
              <p style="font-size: 14px; color: #666;">
                (Masse Edukt) → (Mol Edukt) → (Mol Produkt) → (Masse Produkt)
              </p>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>💡 Merke:</strong> Mol ist die "Brücke" zwischen Massen verschiedener Stoffe!</p>
          </div>
        `
      },
      {
        title: 'Die drei Schritte im Detail 📝',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-list-ol"></i> Die 3-Schritt-Methode</h4>
          </div>

          <div style="margin-top: 20px;">
            <div style="margin-bottom: 20px;">
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <h5 style="color: #1565c0;">Schritt 1: Masse → Mol (Edukt)</h5>
                <p style="font-size: 18px; text-align: center; margin: 10px 0;">
                  <strong>n₁ = m₁ / M₁</strong>
                </p>
                <p>Berechne die Stoffmenge des Edukts aus seiner Masse und molaren Masse.</p>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800;">
                <h5 style="color: #e65100;">Schritt 2: Mol → Mol (Umrechnung)</h5>
                <p style="font-size: 18px; text-align: center; margin: 10px 0;">
                  <strong>n₂ = n₁ × (ν₂/ν₁)</strong>
                </p>
                <p>Rechne die Stoffmengen mit den Koeffizienten um (das kennst du schon!).</p>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9C27B0;">
                <h5 style="color: #6a1b9a;">Schritt 3: Mol → Masse (Produkt)</h5>
                <p style="font-size: 18px; text-align: center; margin: 10px 0;">
                  <strong>m₂ = n₂ × M₂</strong>
                </p>
                <p>Berechne die Masse des Produkts aus seiner Stoffmenge und molaren Masse.</p>
              </div>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px;">
            <h5 style="color: #f57f17;"><i class="fa fa-lightbulb-o"></i> Einheiten, Einheiten, Einheiten!</h5>
            <ul>
              <li><strong>m</strong> = Masse in Gramm (g)</li>
              <li><strong>n</strong> = Stoffmenge in Mol (mol)</li>
              <li><strong>M</strong> = Molare Masse in g/mol</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Beispiel: Wasserbildung berechnen 💧',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-tint"></i> Aufgabe</h4>
            <p>Wasserbildung: <strong>2 H₂ + O₂ → 2 H₂O</strong></p>
            <p><strong>Gegeben:</strong> 4.0 g Wasserstoff (H₂)</p>
            <p><strong>Frage:</strong> Wie viel Gramm Wasser (H₂O) entstehen?</p>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> H₂-Masse zu H₂-Mol</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>n(H₂) = m(H₂) / M(H₂)</p>
                <p>n(H₂) = 4.0 g / 2.016 g/mol</p>
                <p>n(H₂) = <strong>1.98 mol</strong></p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> H₂-Mol zu H₂O-Mol</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>n(H₂O) = n(H₂) × (ν(H₂O) / ν(H₂))</p>
                <p>n(H₂O) = 1.98 mol × (2/2)</p>
                <p>n(H₂O) = <strong>1.98 mol</strong></p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> H₂O-Mol zu H₂O-Masse</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>m(H₂O) = n(H₂O) × M(H₂O)</p>
                <p>m(H₂O) = 1.98 mol × 18.015 g/mol</p>
                <p>m(H₂O) = <strong>35.7 g</strong></p>
              </div>
            </div>

            <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
              <p><strong>✅ Lösung:</strong> Aus 4.0 g H₂ entstehen 35.7 g H₂O!</p>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-eye"></i> Beobachtung</h5>
            <p>Die Masse hat sich fast verzehnffacht! Das liegt an der unterschiedlichen molaren Masse.</p>
          </div>
        `
      },
      {
        title: 'Tipps & Tricks 💡',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-star"></i> Wichtige Tipps</h4>
          </div>

          <div style="margin-top: 20px;">
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #1565c0;"><i class="fa fa-check"></i> Immer schrittweise vorgehen</h5>
              <p>Schreib jeden Schritt einzeln auf. So vermeidest du Fehler und kannst später nachvollziehen, was du getan hast.</p>
            </div>

            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #e65100;"><i class="fa fa-check"></i> Einheiten kontrollieren</h5>
              <p>Überprüfe nach jedem Schritt, ob die Einheiten stimmen:</p>
              <ul>
                <li>Schritt 1: g / (g/mol) = mol ✓</li>
                <li>Schritt 2: mol × (dimensionslos) = mol ✓</li>
                <li>Schritt 3: mol × (g/mol) = g ✓</li>
              </ul>
            </div>

            <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #6a1b9a;"><i class="fa fa-check"></i> Molare Massen准确 berechnen</h5>
              <p>Addiere die Atommassen aller Atome im Molekül:</p>
              <ul>
                <li>H₂O = 2×1.008 + 1×15.999 = 18.015 g/mol</li>
                <li>CO₂ = 1×12.011 + 2×15.999 = 44.009 g/mol</li>
              </ul>
            </div>

            <div style="background: #fce4ec; padding: 15px; border-radius: 8px;">
              <h5 style="color: #c2185b;"><i class="fa fa-warning"></i> Häufige Fehler vermeiden</h5>
              <ul>
                <li>❌ Nicht vergessen, die molare Masse zu berechnen</li>
                <li>❌ Koeffizienten beim Mol-Mol-Schritt ignorieren</li>
                <li>❌ Falsche Koeffizienten verwenden (Edukt vs. Produkt)</li>
                <li>✅ Immer die ausgeglichene Gleichung kontrollieren</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        title: 'Zusammenfassung & Praxis ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Die 3-Schritt-Methode</h4>
            <ol>
              <li><strong>Schritt 1:</strong> n₁ = m₁ / M₁ (Masse → Mol, Edukt)</li>
              <li><strong>Schritt 2:</strong> n₂ = n₁ × (ν₂/ν₁) (Mol → Mol, Umrechnung)</li>
              <li><strong>Schritt 3:</strong> m₂ = n₂ × M₂ (Mol → Masse, Produkt)</li>
            </ol>
          </div>

          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Übungsaufgabe</h4>

            <p><strong>Verbrennung von Kohlenstoff:</strong> C + O₂ → CO₂</p>
            <p>Wie viel Gramm CO₂ entstehen aus 12.0 g Kohlenstoff (C)?</p>

            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                <strong>Lösung anzeigen</strong>
              </summary>
              <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <p><strong>Schritt 1:</strong> n(C) = 12.0 g / 12.011 g/mol = 0.999 mol</p>
                <p><strong>Schritt 2:</strong> n(CO₂) = 0.999 mol × (1/1) = 0.999 mol</p>
                <p><strong>Schritt 3:</strong> m(CO₂) = 0.999 mol × 44.009 g/mol = <strong>44.0 g</strong></p>
              </div>
            </details>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Ausgezeichnet!</strong> Du kannst jetzt Massen stöchiometrisch umrechnen!</p>
          </div>
        `
      }
    ]
  },
  4: {
    title: 'Limitierendes Reagenz',
    color: '#9C27B0',
    steps: [
      {
        title: 'Was ist ein limitierendes Reagenz? 🚧',
        content: `
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #9C27B0;">
            <h4 style="color: #6a1b9a; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>Oft haben wir nicht von jedem Reaktionspartner genau die richtige Menge. Du lernst:</p>
            <ul>
              <li>Was ein limitierendes Reagenz ist</li>
              <li>Wie du es identifizierst</li>
              <li>Warum es wichtig für die Berechnung ist</li>
            </ul>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-question-circle" style="color: #9C27B0;"></i> Eine Analogie: Auto bauen 🚗</h5>
            <div style="background: #fff; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px;">
              <p>Stell dir vor, du willst Autos bauen:</p>
              <p><strong>Rezept:</strong> 4 Räder + 1 Karosserie → 1 Auto</p>
              <p>Du hast: <strong>16 Räder</strong> und <strong>5 Karosserien</strong></p>
              <p>Wie viele Autos kannst du bauen?</p>
              <details>
                <summary style="cursor: pointer; padding: 10px; background: #f5f5f5; border-radius: 4px; margin-top: 10px;">
                  <strong>Lösung</strong>
                </summary>
                <div style="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
                  <p>Aus 16 Rädern: 16/4 = 4 Autos möglich</p>
                  <p>Aus 5 Karosserien: 5/1 = 5 Autos möglich</p>
                  <p><strong>Antwort:</strong> Nur 4 Autos! Die Räder sind <strong>limitierend</strong>.</p>
                </div>
              </details>
            </div>
          </div>

          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>💡 Erkenntnis:</strong> Das Reagenz, das weniger Produkt erzeugen kann, bestimmt die Reaktion!</p>
          </div>
        `
      },
      {
        title: 'Wie man das limitierende Reagenz findet 🔍',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-list-ol"></i> Schritt-für-Schritt Methode</h4>
          </div>

          <div style="margin-top: 20px;">
            <h5>Der Algorithmus</h5>

            <div style="margin-bottom: 15px;">
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                <p><strong>Schritt 1:</strong> Berechne Mol für jedes Reagenz</p>
                <p style="font-size: 18px; text-align: center;">n = m / M</p>
                <p class="text-muted">Für jeden Edukt die Stoffmenge berechnen</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
                <p><strong>Schritt 2:</strong> Vergleiche die Mol-Verhältnisse</p>
                <p style="font-size: 18px; text-align: center;">n / ν für jedes Reagenz</p>
                <p class="text-muted">Teile die Stoffmenge durch den Koeffizienten</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <div style="background: #f3e5f5; padding: 15px; border-radius: 8px;">
                <p><strong>Schritt 3:</strong> Identifiziere das limitierende Reagenz</p>
                <p style="text-align: center;">Das Reagenz mit dem <strong>kleinsten n/ν-Wert</strong></p>
                <p class="text-muted">Es kann die geringste Menge Produkt erzeugen</p>
              </div>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-exclamation-triangle"></i> Wichtig!</h5>
            <p>Vergleiche <strong>immer n/ν</strong>, nicht nur n oder m!</p>
            <p>Ein Reagenz mit kleinerer Masse kann trotzdem im Überschuss sein, wenn sein Koeffizient klein ist.</p>
          </div>
        `
      },
      {
        title: 'Beispiel: Ammoniaksynthese 🌿',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-flask"></i> Aufgabe</h4>
            <p>Haber-Verfahren: <strong>N₂ + 3 H₂ → 2 NH₃</strong></p>
            <p><strong>Gegeben:</strong> 28.0 g N₂ und 10.0 g H₂</p>
            <p><strong>Frage:</strong> Was ist das limitierende Reagenz?</p>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Lösung</h5>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Mol berechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <p>n(N₂) = 28.0 g / 28.02 g/mol = <strong>0.999 mol</strong></p>
                <p>n(H₂) = 10.0 g / 2.016 g/mol = <strong>4.96 mol</strong></p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> n/ν berechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <p>N₂: 0.999 mol / 1 = <strong>0.999</strong></p>
                <p>H₂: 4.96 mol / 3 = <strong>1.65</strong></p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Vergleich</p>
              <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
                <p>0.999 &lt; 1.65</p>
                <p><strong>N₂ ist das limitierende Reagenz!</strong></p>
              </div>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-plus-circle"></i> Zusatzfrage</h5>
            <p>Wie viel NH₃ entsteht maximal?</p>
            <details>
              <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                <strong>Lösung</strong>
              </summary>
              <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <p>n(NH₃) = n(N₂) × (2/1) = 0.999 × 2 = 1.998 mol</p>
                <p>m(NH₃) = 1.998 mol × 17.031 g/mol = <strong>34.0 g NH₃</strong></p>
              </div>
            </details>
          </div>
        `
      },
      {
        title: 'Überschuss berechnen ➗',
        content: `
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px;">
            <h4 style="color: #6a1b9a; margin-top: 0;"><i class="fa fa-calculator"></i> Wie viel vom anderen Reagenz bleibt übrig?</h4>
          </div>

          <div style="margin-top: 20px;">
            <h5>Die Methode</h5>
            <ol>
              <li>Berechne, wie viel vom überschüssigen Reagenz verbraucht wird</li>
              <li>Ziehe dies von der ursprünglichen Menge ab</li>
            </ol>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p><strong>Beispiel (weiter mit N₂ + 3 H₂ → 2 NH₃):</strong></p>
              <p>Wie viel H₂ bleibt übrig?</p>

              <p style="margin-top: 10px;"><strong>Verbrauchtes H₂:</strong></p>
              <p>n(H₂)verbraucht = n(N₂) × (3/1) = 0.999 × 3 = 2.997 mol</p>

              <p style="margin-top: 10px;"><strong>Überschussiges H₂:</strong></p>
              <p>n(H₂)übrig = 4.96 - 2.997 = 1.96 mol</p>
              <p>m(H₂)übrig = 1.96 mol × 2.016 g/mol = <strong>3.95 g H₂ übrig</strong></p>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-lightbulb-o"></i> Praktische Bedeutung</h5>
            <ul>
              <li>In der Industrie nutzt man oft ein Reagenz im Überschuss</li>
              <li>So wird sichergestellt, dass das teure Reagenz komplett verbraucht wird</li>
              <li>Der Überschuss kann recycelt werden</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Zusammenfassung ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Merkpunkte</h4>
            <ul>
              <li><strong>Limitierendes Reagenz:</strong> Der Reaktionspartner, der zuerst aufgebraucht wird</li>
              <li><strong>Identifikation:</strong> Vergleiche n/ν für alle Edukte</li>
              <li><strong>Das kleinste n/ν</strong> bestimmt die Produktmenge</li>
              <li><strong>Überschuss:</strong> Differenz zwischen vorhandenem und verbrauchtem Reagenz</li>
            </ul>
          </div>

          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Übungsaufgabe</h4>

            <p><strong>Reaktion:</strong> 2 Na + Cl₂ → 2 NaCl</p>
            <p>Gegeben: 5.0 g Na und 7.0 g Cl₂</p>
            <p>Was ist das limitierende Reagenz?</p>

            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                <strong>Lösung anzeigen</strong>
              </summary>
              <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <p><strong>Schritt 1:</strong> n(Na) = 5.0 / 22.99 = 0.217 mol, n(Cl₂) = 7.0 / 70.90 = 0.099 mol</p>
                <p><strong>Schritt 2:</strong> Na: 0.217 / 2 = 0.109, Cl₂: 0.099 / 1 = 0.099</p>
                <p><strong>Lösung:</strong> <strong>Cl₂ ist limitierend</strong> (0.099 &lt; 0.109)</p>
              </div>
            </details>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Perfekt!</strong> Du kannst jetzt limitierende Reagenzien finden und berechnen!</p>
          </div>
        `
      }
    ]
  },
  5: {
    title: 'Ausbeute berechnen',
    color: '#F44336',
    steps: [
      {
        title: 'Theoretische vs. praktische Ausbeute 📊',
        content: `
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #F44336;">
            <h4 style="color: #c62828; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>In der Realität erhalten wir nie 100% des theoretisch möglichen Produkts. Du lernst:</p>
            <ul>
              <li>Was theoretische und praktische Ausbeute sind</li>
              <li>Wie man die prozentuale Ausbeute berechnet</li>
              <li>Warum Ausbeuten nie 100% erreichen</li>
            </ul>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-balance-scale" style="color: #F44336;"></i> Zwei Arten der Ausbeute</h5>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p><strong>📐 Theoretische Ausbeute</strong></p>
              <p>Die Menge an Produkt, die man <strong>perfekten Bedingungen</strong> erhalten würde (berechnet mit Stöchiometrie).</p>
            </div>

            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p><strong>⚗️ Praktische Ausbeute (tatsächliche Ausbeute)</strong></p>
              <p>Die Menge an Produkt, die man <strong>wirklich im Labor</strong> erhält.</p>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
              <p><strong>📈 Prozentsatz der Ausbeute</strong></p>
              <p>Das Verhältnis von praktischer zu theoretischer Ausbeute in Prozent.</p>
            </div>
          </div>

          <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #6a1b9a;"><i class="fa fa-lightbulb-o"></i> Wichtig zu wissen</h5>
            <p>Die praktische Ausbeute ist <strong>immer kleiner</strong> als die theoretische (oder in Ausnahmefällen gleich, aber nie größer).</p>
          </div>
        `
      },
      {
        title: 'Die Ausbeute-Formel 📐',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;"><i class="fa fa-calculator"></i> Die Formel</h4>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; margin: 15px 0;">
              <strong>Ausbeute % = (m(praktisch) / m(theoretisch)) × 100%</strong>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-book"></i> Die Variablen erklärt</h5>
            <table class="table table-striped" style="margin-top: 15px;">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Bedeutung</th>
                  <th>Einheit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>m(praktisch)</strong></td>
                  <td>Tatsächlich erhaltene Produktmasse</td>
                  <td>g</td>
                </tr>
                <tr>
                  <td><strong>m(theoretisch)</strong></td>
                  <td>Berechnete Produktmasse (aus Stöchiometrie)</td>
                  <td>g</td>
                </tr>
                <tr>
                  <td><strong>Ausbeute %</strong></td>
                  <td>Prozentuale Ausbeute</td>
                  <td>%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #2e7d32;"><i class="fa fa-lightbulb-o"></i> Berechnungsablauf</h5>
            <ol>
              <li>Berechne zuerst die <strong>theoretische Ausbeute</strong> mit Stöchiometrie</li>
              <li>Messse die <strong>praktische Ausbeute</strong> im Labor</li>
              <li>Setze beide in die Formel ein</li>
            </ol>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>⚠️ Achtung:</strong> Du kannst die praktische Ausbeute nicht berechnen - sie muss <strong>gemessen</strong> werden!</p>
          </div>
        `
      },
      {
        title: 'Beispiel: Kupferfällung 🧪',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-flask"></i> Experiment</h4>
            <p>Fällung von Kupfer: Cu²⁺ + 2e⁻ → Cu</p>
            <p>Du verwendest 6.35 g CuSO₄ und erhältst 2.1 g Kupfer.</p>
          </div>

          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Theoretische Ausbeute berechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>n(CuSO₄) = 6.35 g / 159.61 g/mol = 0.0398 mol</p>
                <p>n(Cu)theoretisch = 0.0398 mol (1:1 Verhältnis)</p>
                <p>m(Cu)theoretisch = 0.0398 mol × 63.55 g/mol = <strong>2.53 g</strong></p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> Praktische Ausbeute (gegeben)</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>m(Cu)praktisch = <strong>2.1 g</strong> (gemessen)</p>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Ausbeute berechnen</p>
              <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
                <p style="font-size: 18px; text-align: center;">
                  Ausbeute % = (2.1 g / 2.53 g) × 100%
                </p>
                <p style="font-size: 22px; text-align: center; color: #4CAF50;">
                  <strong>Ausbeute % = 83.0%</strong>
                </p>
              </div>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>💡 Bewertung:</strong> 83% ist eine gute Ausbeute für eine Fällungsreaktion!</p>
          </div>
        `
      },
      {
        title: 'Warum nie 100% Ausbeute? 🤔',
        content: `
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px;">
            <h4 style="color: #6a1b9a; margin-top: 0;"><i class="fa fa-question-circle"></i> Gründe für Verluste</h4>
          </div>

          <div style="margin-top: 20px;">
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #c62828;"><i class="fa fa-times-circle"></i> Incomplete Reactions</h5>
              <p>Manche Reaktionen erreichen nicht 100% Umsatz, weil:</p>
              <ul>
                <li>Die Reaktion reversibel ist (Gleichgewicht)</li>
                <li>Nicht alle Edukte reagieren</li>
                <li>Die Reaktion zu früh abgebrochen wird</li>
              </ul>
            </div>

            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #e65100;"><i class="fa fa-times-circle"></i> Side Reactions</h5>
              <p>Nebenreaktionen verbrauchen Edukte:</p>
              <ul>
                <li>Ungewünschte Konkurrenzreaktionen</li>
                <li>Bildung von Nebenprodukten</li>
                <li>Zersetzung des Produkts</li>
              </ul>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #1565c0;"><i class="fa fa-times-circle"></i> Mechanical Losses</h5>
              <p>Verluste bei der Arbeit:</p>
              <ul>
                <li>Produkt bleibt am Glas haften</li>
                <li>Transferverluste beim Umfüllen</li>
                <li>Verlust beim Filtern oder Waschen</li>
                <li>Flüchtige Produkte verdampfen</li>
              </ul>
            </div>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #2e7d32;"><i class="fa fa-times-circle"></i> Purification</h5>
              <p>Reinigungsverfahren:</p>
              <ul>
                <li>Um kristallisieren verringert die Masse</li>
                <li>Waschen entfernt Verunreinigungen (und etwas Produkt)</li>
                <li>Chromatographie oder Destillation haben Verluste</li>
              </ul>
            </div>
          </div>

          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-lightbulb-o"></i> Typische Ausbeuten</h5>
            <ul>
              <li>Präzise Synthesen: 80-90%</li>
              <li>Organische Synthesen: 50-70%</li>
              <li>Komplexe mehrstufige Synthesen: 10-40% (pro Schritt)</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Zusammenfassung & Abschluss ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Das hast du gelernt</h4>
            <ul>
              <li><strong>Theoretische Ausbeute:</strong> Berechneter Maximalwert (aus Stöchiometrie)</li>
              <li><strong>Praktische Ausbeute:</strong> Tatsächlich erhaltene Menge (gemessen)</li>
              <li><strong>Formel:</strong> Ausbeute % = (m(praktisch) / m(theoretisch)) × 100%</li>
              <li><strong>Realistische Ausbeuten:</strong> 50-90% je nach Reaktionstyp</li>
              <li><strong>Verlustursachen:</strong> Incomplete reactions, side reactions, mechanical losses, purification</li>
            </ul>
          </div>

          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Letzte Übung</h4>

            <p><strong>Verbrennung:</strong> CH₄ + 2 O₂ → CO₂ + 2 H₂O</p>
            <p>Theoretische Ausbeute: 22.0 g CO₂</p>
            <p>Praktische Ausbeute: 18.5 g CO₂</p>
            <p>Berechne die prozentuale Ausbeute!</p>

            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                <strong>Lösung anzeigen</strong>
              </summary>
              <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <p>Ausbeute % = (18.5 g / 22.0 g) × 100%</p>
                <p>Ausbeute % = 0.841 × 100%</p>
                <p><strong>Ausbeute % = 84.1%</strong></p>
              </div>
            </details>
          </div>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: white; margin-top: 0;"><i class="fa fa-trophy"></i> 🎉 Glückwunsch!</h4>
            <p style="color: white; font-size: 16px;">Du hast alle 5 Tutorials abgeschlossen!</p>
            <p style="color: white;">Du beherrschst jetzt:</p>
            <ul style="color: white;">
              <li>Grundlagen der Stöchiometrie</li>
              <li>Mol-Mol Umrechnungen</li>
              <li>Masse-Masse Umrechnungen</li>
              <li>Limitierende Reagenzien</li>
              <li>Ausbeuteberechnung</li>
            </ul>
            <p style="color: white; margin-top: 15px;"><strong>Nutze den Übungsmodus, um dein Wissen zu festigen!</strong></p>
          </div>
        `
      }
    ]
  }
};

// Start a tutorial
function startTutorial(tutorialId) {
  const tutorial = tutorials[tutorialId];

  if (!tutorial) {
    alert('Tutorial nicht gefunden!');
    return;
  }

  // Check if tutorial is locked
  if (tutorialId > 1 && !tutorialState.completedTutorials.includes(tutorialId - 1)) {
    alert('Bitte schließe zuerst das vorherige Tutorial ab!');
    return;
  }

  tutorialState.currentTutorial = tutorialId;
  tutorialState.currentStep = 0;

  // Update UI
  document.getElementById('tutorial-menu').style.display = 'none';
  document.getElementById('tutorial-viewer').style.display = 'block';

  updateTutorialView();
}

// Update tutorial view with current step
function updateTutorialView() {
  const tutorial = tutorials[tutorialState.currentTutorial];

  if (!tutorial) {return;}

  const step = tutorial.steps[tutorialState.currentStep];

  // Update title
  document.getElementById('tutorial-title').textContent = tutorial.title;

  // Update content
  document.getElementById('tutorial-content').innerHTML = step.content;

  // Update step indicator
  document.getElementById('step-indicator').textContent =
    `Schritt ${tutorialState.currentStep + 1} von ${tutorial.steps.length}`;

  // Update buttons
  document.getElementById('tutorial-prev').style.visibility =
    tutorialState.currentStep === 0 ? 'hidden' : 'visible';

  const nextBtn = document.getElementById('tutorial-next');
  if (tutorialState.currentStep === tutorial.steps.length - 1) {
    nextBtn.innerHTML = '<i class="fa fa-check"></i> Tutorial abschließen';
  } else {
    nextBtn.innerHTML = 'Weiter <i class="fa fa-arrow-right"></i>';
  }
}

// Navigate to next step
function nextStep() {
  const tutorial = tutorials[tutorialState.currentTutorial];

  if (tutorialState.currentStep < tutorial.steps.length - 1) {
    tutorialState.currentStep++;
    updateTutorialView();
  } else {
    // Complete tutorial
    completeTutorial();
  }
}

// Navigate to previous step
function previousStep() {
  if (tutorialState.currentStep > 0) {
    tutorialState.currentStep--;
    updateTutorialView();
  }
}

// Complete tutorial
function completeTutorial() {
  const tutorialId = tutorialState.currentTutorial;

  // Mark as completed
  if (!tutorialState.completedTutorials.includes(tutorialId)) {
    tutorialState.completedTutorials.push(tutorialId);
    localStorage.setItem('completedTutorials', JSON.stringify(tutorialState.completedTutorials));
  }

  // Update progress display
  updateTutorialProgress();

  // Show completion message
  alert(`🎉 Tutorial "${tutorials[tutorialId].title}" abgeschlossen!`);

  // Close tutorial viewer
  closeTutorial();
}

// Close tutorial viewer
function closeTutorial() {
  document.getElementById('tutorial-viewer').style.display = 'none';
  document.getElementById('tutorial-menu').style.display = 'block';
  tutorialState.currentTutorial = null;
  tutorialState.currentStep = 0;
}

// Update tutorial progress display
function updateTutorialProgress() {
  const completedCount = tutorialState.completedTutorials.length;
  document.getElementById('tutorial-progress').textContent = completedCount;

  // Update tutorial cards
  for (let i = 1; i <= 5; i++) {
    const statusEl = document.getElementById(`status-tutorial-${i}`);
    if (!statusEl) {continue;}

    if (tutorialState.completedTutorials.includes(i)) {
      statusEl.innerHTML = '<i class="fa fa-check-circle"></i> Abgeschlossen';
      statusEl.style.background = '#c8e6c9';
      statusEl.style.color = '#2e7d32';
    } else if (i === 1 || tutorialState.completedTutorials.includes(i - 1)) {
      statusEl.innerHTML = '<i class="fa fa-circle-o"></i> Nicht begonnen';
      statusEl.style.background = '#e0e0e0';
      statusEl.style.color = '#666';
    } else {
      statusEl.innerHTML = '<i class="fa fa-lock"></i> Gesperrt';
      statusEl.style.background = '#ffe0b2';
      statusEl.style.color = '#e65100';
    }
  }
}

// Initialize tutorial progress on page load
document.addEventListener('DOMContentLoaded', () => {
  updateTutorialProgress();
});

// ===== STUDENT PROGRESS TRACKING SYSTEM =====

// Progress data structure
let studentProgress = {
  // Tutorial progress
  completedTutorials: [],
  tutorialStartTime: null,
  timeInTutorials: 0, // in seconds

  // Practice statistics
  practiceProblems: {
    total: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0,
    byType: {
      'mol-mol': { total: 0, correct: 0 },
      'mass-mass': { total: 0, correct: 0 },
      'limiting': { total: 0, correct: 0 },
      'yield': { total: 0, correct: 0 }
    }
  },

  // Calculator usage
  calculations: {
    molMol: 0,
    massMass: 0,
    limiting: 0,
    yield: 0
  },

  // Achievements
  achievements: [],

  // Activity log
  activities: [],

  // Streak tracking
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: null
  },

  // First visit
  firstVisit: null,
  lastVisit: null,
  totalSessions: 0
};

// Achievement definitions
const achievementDefinitions = [
  {
    id: 'first-tutorial',
    name: 'Erste Schritte',
    description: 'Absolviere dein erstes Tutorial',
    icon: 'fa-graduation-cap',
    color: '#4CAF50',
    condition: (progress) => progress.completedTutorials.length >= 1
  },
  {
    id: 'tutorial-master',
    name: 'Tutorial-Meister',
    description: 'Absolviere alle 5 Tutorials',
    icon: 'fa-star',
    color: '#FFD700',
    condition: (progress) => progress.completedTutorials.length >= 5
  },
  {
    id: 'first-practice',
    name: 'Praxis-Start',
    description: 'Löse deine erste Praxisaufgabe',
    icon: 'fa-pencil',
    color: '#2196F3',
    condition: (progress) => progress.practiceProblems.total >= 1
  },
  {
    id: 'practice-10',
    name: 'Übung macht den Meister',
    description: 'Löse 10 Praxisaufgaben',
    icon: 'fa-trophy',
    color: '#FF9800',
    condition: (progress) => progress.practiceProblems.total >= 10
  },
  {
    id: 'practice-50',
    name: 'Stöchiometrie-Experte',
    description: 'Löse 50 Praxisaufgaben',
    icon: 'fa-gem',
    color: '#9C27B0',
    condition: (progress) => progress.practiceProblems.total >= 50
  },
  {
    id: 'perfect-10',
    name: 'Perfekte 10',
    description: 'Löse 10 Aufgaben hintereinander richtig',
    icon: 'fa-bolt',
    color: '#F44336',
    condition: (progress) => progress.practiceProblems.correct >= 10 &&
                          progress.practiceProblems.correct === progress.practiceProblems.total
  },
  {
    id: 'first-calculation',
    name: 'Rechner-Nutzer',
    description: 'Führe deine erste Berechnung durch',
    icon: 'fa-calculator',
    color: '#00BCD4',
    condition: (progress) => Object.values(progress.calculations).reduce((a, b) => a + b, 0) >= 1
  },
  {
    id: 'calculation-20',
    name: 'Berechnungs-Profi',
    description: 'Führe 20 Berechnungen durch',
    icon: 'fa-cogs',
    color: '#3F51B5',
    condition: (progress) => Object.values(progress.calculations).reduce((a, b) => a + b, 0) >= 20
  },
  {
    id: 'streak-3',
    name: '3-Tage-Serie',
    description: 'Lerne an 3 aufeinanderfolgenden Tagen',
    icon: 'fa-fire',
    color: '#FF5722',
    condition: (progress) => progress.streak.current >= 3
  },
  {
    id: 'streak-7',
    name: 'Wochen-Champion',
    description: 'Lerne an 7 aufeinanderfolgenden Tagen',
    icon: 'fa-fire',
    color: '#E91E63',
    condition: (progress) => progress.streak.current >= 7
  },
  {
    id: 'all-calculators',
    name: 'Alleskönner',
    description: 'Nutze alle 4 Rechner mindestens einmal',
    icon: 'fa-th',
    color: '#8BC34A',
    condition: (progress) => progress.calculations.molMol > 0 &&
                          progress.calculations.massMass > 0 &&
                          progress.calculations.limiting > 0 &&
                          progress.calculations.yield > 0
  },
  {
    id: 'accuracy-90',
    name: 'Präzision',
    description: 'Erziele eine Genauigkeit von 90% in mindestens 20 Aufgaben',
    icon: 'fa-bullseye',
    color: '#673AB7',
    condition: (progress) => progress.practiceProblems.total >= 20 &&
                          (progress.practiceProblems.correct / progress.practiceProblems.total) >= 0.9
  }
];

// Initialize progress from localStorage
function initializeProgress() {
  const saved = localStorage.getItem('studentProgress');
  if (saved) {
    studentProgress = { ...studentProgress, ...JSON.parse(saved) };
  } else {
    studentProgress.firstVisit = new Date().toISOString();
    saveProgress();
  }

  // Update session tracking
  studentProgress.lastVisit = new Date().toISOString();
  studentProgress.totalSessions++;
  updateStreak();
  saveProgress();

  // Update UI
  updateQuickStats();
  checkAchievements();
}

// Save progress to localStorage
function saveProgress() {
  localStorage.setItem('studentProgress', JSON.stringify(studentProgress));
}

// Update streak
function updateStreak() {
  const today = new Date().toDateString();
  const lastActive = studentProgress.streak.lastActiveDate;

  if (lastActive) {
    const lastDate = new Date(lastActive);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.toDateString() === yesterday.toDateString()) {
      // Continue streak
      studentProgress.streak.current++;
    } else if (lastDate.toDateString() !== today) {
      // Streak broken
      studentProgress.streak.longest = Math.max(studentProgress.streak.longest, studentProgress.streak.current);
      studentProgress.streak.current = 1;
    }
  } else {
    studentProgress.streak.current = 1;
  }

  studentProgress.streak.lastActiveDate = today;
  studentProgress.streak.longest = Math.max(studentProgress.streak.longest, studentProgress.streak.current);
}

// Log activity
function logActivity(type, description, data = {}) {
  const activity = {
    timestamp: new Date().toISOString(),
    type,
    description,
    data
  };

  studentProgress.activities.unshift(activity);

  // Keep only last 100 activities
  if (studentProgress.activities.length > 100) {
    studentProgress.activities = studentProgress.activities.slice(0, 100);
  }

  saveProgress();
}

// Update quick stats display
function updateQuickStats() {
  // Tutorials
  document.getElementById('stat-tutorials').textContent =
    `${studentProgress.completedTutorials.length}/5`;

  // Practice
  document.getElementById('stat-practice').textContent =
    studentProgress.practiceProblems.total;

  // Calculations
  const totalCalculations = Object.values(studentProgress.calculations).reduce((a, b) => a + b, 0);
  document.getElementById('stat-calculations').textContent = totalCalculations;

  // Achievements
  document.getElementById('stat-achievements').textContent =
    studentProgress.achievements.length;
}

// Check and award achievements
function checkAchievements() {
  let newAchievements = false;

  achievementDefinitions.forEach(achievement => {
    if (!studentProgress.achievements.includes(achievement.id)) {
      if (achievement.condition(studentProgress)) {
        studentProgress.achievements.push(achievement.id);
        newAchievements = true;

        // Show notification
        showAchievementNotification(achievement);

        // Log activity
        logActivity('achievement', `Erfolg freigeschaltet: ${achievement.name}`, {
          achievementId: achievement.id
        });
      }
    }
  });

  if (newAchievements) {
    saveProgress();
    updateQuickStats();
  }
}

// Show achievement notification
function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
    min-width: 300px;
    animation: slideInRight 0.5s ease;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center;">
      <i class="fa ${achievement.icon}" style="font-size: 32px; margin-right: 15px;"></i>
      <div>
        <h4 style="margin: 0 0 5px 0;">🏆 Erfolg freigeschaltet!</h4>
        <p style="margin: 0; font-weight: bold;">${achievement.name}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${achievement.description}</p>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// Toggle progress dashboard
function toggleProgressDashboard() {
  const dashboard = document.getElementById('progress-dashboard');
  dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';

  if (dashboard.style.display === 'block') {
    loadDashboardContent();
  }
}

// Load dashboard content
function loadDashboardContent() {
  loadOverviewTab();
  loadAchievementsTab();
  loadActivityTab();
  loadPerformanceTab();
}

// Load overview tab
function loadOverviewTab() {
  // Tutorial progress bars
  const tutorialNames = {
    1: 'Was ist Stöchiometrie?',
    2: 'Mol-Mol Umrechnung',
    3: 'Masse-Masse Umrechnung',
    4: 'Limitierendes Reagenz',
    5: 'Ausbeute berechnen'
  };

  let progressHTML = '';
  for (let i = 1; i <= 5; i++) {
    const completed = studentProgress.completedTutorials.includes(i);
    const percentage = completed ? 100 : 0;

    progressHTML += `
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>${tutorialNames[i]}</span>
          <span>${completed ? '✅ Abgeschlossen' : '⏳ Nicht begonnen'}</span>
        </div>
        <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
          <div style="background: ${completed ? '#4CAF50' : '#9E9E9E'}; width: ${percentage}%; height: 100%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }
  document.getElementById('tutorial-progress-bars').innerHTML = progressHTML;

  // Practice statistics
  const accuracy = studentProgress.practiceProblems.total > 0
    ? ((studentProgress.practiceProblems.correct / studentProgress.practiceProblems.total) * 100).toFixed(1)
    : 0;

  const statsHTML = `
    <div style="margin-bottom: 10px;">
      <strong>Gelöste Aufgaben:</strong> ${studentProgress.practiceProblems.total}
    </div>
    <div style="margin-bottom: 10px;">
      <strong>Richtig:</strong> ${studentProgress.practiceProblems.correct} (${accuracy}%)
    </div>
    <div style="margin-bottom: 10px;">
      <strong>Falsch:</strong> ${studentProgress.practiceProblems.incorrect}
    </div>
    <div>
      <strong>Übersprungen:</strong> ${studentProgress.practiceProblems.skipped}
    </div>
  `;
  document.getElementById('practice-stats').innerHTML = statsHTML;

  // Streak info
  const streakInfo = `
    <div style="display: flex; justify-content: space-around; text-align: center;">
      <div>
        <p style="font-size: 32px; font-weight: bold; margin: 0; color: #FF5722;">
          ${studentProgress.streak.current}
        </p>
        <p style="margin: 5px 0 0 0;">Aktuelle Serie (Tage)</p>
      </div>
      <div>
        <p style="font-size: 32px; font-weight: bold; margin: 0; color: #E91E63;">
          ${studentProgress.streak.longest}
        </p>
        <p style="margin: 5px 0 0 0;">Längste Serie (Tage)</p>
      </div>
      <div>
        <p style="font-size: 32px; font-weight: bold; margin: 0; color: #9C27B0;">
          ${studentProgress.totalSessions}
        </p>
        <p style="margin: 5px 0 0 0;">Gesamtsitzungen</p>
      </div>
    </div>
  `;
  document.getElementById('streak-info').innerHTML = streakInfo;
}

// Load achievements tab
function loadAchievementsTab() {
  let gridHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">';

  achievementDefinitions.forEach(achievement => {
    const unlocked = studentProgress.achievements.includes(achievement.id);

    gridHTML += `
      <div style="background: ${unlocked ? 'white' : '#f5f5f5'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${achievement.color}; opacity: ${unlocked ? 1 : 0.6};">
        <div style="display: flex; align-items: center;">
          <i class="fa ${achievement.icon}" style="font-size: 32px; color: ${achievement.color}; margin-right: 15px; ${unlocked ? '' : 'filter: grayscale(100%);'}"></i>
          <div>
            <h5 style="margin: 0 0 5px 0;">${achievement.name}</h5>
            <p style="margin: 0; font-size: 13px; color: #666;">${achievement.description}</p>
            ${unlocked ? '<p style="margin: 5px 0 0 0; color: #4CAF50; font-size: 12px;">✅ Freigeschaltet</p>' : '<p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">🔒 Gesperrt</p>'}
          </div>
        </div>
      </div>
    `;
  });

  gridHTML += '</div>';
  document.getElementById('achievements-grid').innerHTML = gridHTML;
}

// Load activity tab
function loadActivityTab() {
  if (studentProgress.activities.length === 0) {
    document.getElementById('activity-list').innerHTML = '<p class="text-muted">Noch keine Aktivitäten.</p>';
    return;
  }

  const typeIcons = {
    'tutorial': 'fa-graduation-cap',
    'practice': 'fa-pencil',
    'calculation': 'fa-calculator',
    'achievement': 'fa-trophy'
  };

  const typeColors = {
    'tutorial': '#4CAF50',
    'practice': '#FF9800',
    'calculation': '#2196F3',
    'achievement': '#E91E63'
  };

  let listHTML = '';
  studentProgress.activities.slice(0, 50).forEach(activity => {
    const date = new Date(activity.timestamp);
    const formattedDate = date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE');

    listHTML += `
      <div style="padding: 10px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <i class="fa ${typeIcons[activity.type] || 'fa-circle'}" style="color: ${typeColors[activity.type] || '#999'}; margin-right: 10px;"></i>
          <div style="flex: 1;">
            <p style="margin: 0;">${activity.description}</p>
            <small style="color: #999;">${formattedDate}</small>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById('activity-list').innerHTML = listHTML;
}

// Load performance tab
function loadPerformanceTab() {
  // Accuracy by problem type
  const accuracyHTML = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Aufgabentyp</th>
          <th>Gelöst</th>
          <th>Richtig</th>
          <th>Genauigkeit</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Mol-Mol</td>
          <td>${studentProgress.practiceProblems.byType['mol-mol'].total}</td>
          <td>${studentProgress.practiceProblems.byType['mol-mol'].correct}</td>
          <td>${studentProgress.practiceProblems.byType['mol-mol'].total > 0
            ? ((studentProgress.practiceProblems.byType['mol-mol'].correct / studentProgress.practiceProblems.byType['mol-mol'].total) * 100).toFixed(1)
            : 0}%</td>
        </tr>
        <tr>
          <td>Masse-Masse</td>
          <td>${studentProgress.practiceProblems.byType['mass-mass'].total}</td>
          <td>${studentProgress.practiceProblems.byType['mass-mass'].correct}</td>
          <td>${studentProgress.practiceProblems.byType['mass-mass'].total > 0
            ? ((studentProgress.practiceProblems.byType['mass-mass'].correct / studentProgress.practiceProblems.byType['mass-mass'].total) * 100).toFixed(1)
            : 0}%</td>
        </tr>
        <tr>
          <td>Limitierend</td>
          <td>${studentProgress.practiceProblems.byType['limiting'].total}</td>
          <td>${studentProgress.practiceProblems.byType['limiting'].correct}</td>
          <td>${studentProgress.practiceProblems.byType['limiting'].total > 0
            ? ((studentProgress.practiceProblems.byType['limiting'].correct / studentProgress.practiceProblems.byType['limiting'].total) * 100).toFixed(1)
            : 0}%</td>
        </tr>
        <tr>
          <td>Ausbeute</td>
          <td>${studentProgress.practiceProblems.byType['yield'].total}</td>
          <td>${studentProgress.practiceProblems.byType['yield'].correct}</td>
          <td>${studentProgress.practiceProblems.byType['yield'].total > 0
            ? ((studentProgress.practiceProblems.byType['yield'].correct / studentProgress.practiceProblems.byType['yield'].total) * 100).toFixed(1)
            : 0}%</td>
        </tr>
      </tbody>
    </table>
  `;
  document.getElementById('accuracy-chart').innerHTML = accuracyHTML;

  // Time spent in tutorials (minutes)
  const minutesSpent = Math.floor(studentProgress.timeInTutorials / 60);
  const timeHTML = `
    <p style="font-size: 24px; font-weight: bold; text-align: center; color: #9C27B0;">
      ${minutesSpent} Minuten
    </p>
    <p class="text-muted text-center">in Tutorials verbracht</p>
  `;
  document.getElementById('time-spent').innerHTML = timeHTML;
}

// Export progress report
function exportProgressReport() {
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalSessions: studentProgress.totalSessions,
      firstVisit: studentProgress.firstVisit,
      lastVisit: studentProgress.lastVisit,
      streak: studentProgress.streak
    },
    tutorials: {
      completed: studentProgress.completedTutorials.length,
      total: 5,
      list: studentProgress.completedTutorials
    },
    practice: studentProgress.practiceProblems,
    calculations: studentProgress.calculations,
    achievements: studentProgress.achievements.map(id => {
      const achievement = achievementDefinitions.find(a => a.id === id);
      return achievement ? achievement.name : id;
    }),
    recentActivities: studentProgress.activities.slice(0, 20)
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stoechiometrie-fortschritt-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logActivity('export', 'Fortschrittsbericht exportiert');
}

// Reset progress
function resetProgress() {
  if (!confirm('Möchtest du wirklich deinen gesamten Fortschritt zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
    return;
  }

  if (!confirm('Bist du wirklich sicher? Alle Erfolge, Statistiken und Aktivitäten werden gelöscht.')) {
    return;
  }

  localStorage.removeItem('studentProgress');
  location.reload();
}

// Integration hooks - called from other functions

// Called when tutorial is completed
function onTutorialCompleted(tutorialId, timeSpent) {
  if (!studentProgress.completedTutorials.includes(tutorialId)) {
    studentProgress.completedTutorials.push(tutorialId);
    studentProgress.timeInTutorials += timeSpent;
    logActivity('tutorial', `Tutorial ${tutorialId} abgeschlossen`, { tutorialId, timeSpent });
    saveProgress();
    checkAchievements();
    updateQuickStats();
  }
}

// Called when practice problem is attempted
function onPracticeProblemAttempt(type, correct) {
  studentProgress.practiceProblems.total++;
  studentProgress.practiceProblems.byType[type].total++;

  if (correct) {
    studentProgress.practiceProblems.correct++;
    studentProgress.practiceProblems.byType[type].correct++;
  } else {
    studentProgress.practiceProblems.incorrect++;
  }

  logActivity('practice', `Praxisaufgabe ${correct ? 'richtig' : 'falsch'} gelöst`, { type, correct });
  saveProgress();
  checkAchievements();
  updateQuickStats();
}

// Called when calculator is used
function onCalculatorUsed(type) {
  studentProgress.calculations[type]++;
  logActivity('calculation', `${type} Rechner verwendet`, { type });
  saveProgress();
  checkAchievements();
  updateQuickStats();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeProgress();
  updateTutorialProgress();

  // Hook into practice mode
  const originalCheckAnswer = window.checkAnswer;
  if (originalCheckAnswer) {
    window.checkAnswer = function() {
      const result = originalCheckAnswer.apply(this, arguments);
      // The practice state will have the current problem type
      if (practiceState && practiceState.currentProblem) {
        const isCorrect = result !== false; // Adapt based on actual implementation
        onPracticeProblemAttempt(practiceState.currentProblem.type, isCorrect);
      }
      return result;
    };
  }
});

// ===== PDF EXPORT FUNCTIONS =====

// Export Mol-Mol calculation to PDF
function exportMolMolToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const v1 = document.getElementById('mol-coeff-r').value;
  const v2 = document.getElementById('mol-coeff-p').value;
  const n1 = document.getElementById('mol-reactant').value;
  const n2 = (parseFloat(n1) * (parseFloat(v2) / parseFloat(v1))).toFixed(4);

  // PDF Header
  doc.setFontSize(20);
  doc.setTextColor(0, 123, 255);
  doc.text('Stöchiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Mol-Mol Umrechnung', 105, 35, { align: 'center' });

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  // Content
  doc.setFontSize(12);
  let y = 60;

  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Eingabewerte:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Stoffmenge (n₁): ${n1} mol`, 25, y); y += 8;
  doc.text(`Koeffizient Edukt (ν₁): ${v1}`, 25, y); y += 8;
  doc.text(`Koeffizient Produkt (ν₂): ${v2}`, 25, y); y += 15;

  doc.setFontSize(14);
  doc.text('Ergebnis:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Produktstoffmenge (n₂): ${n2} mol`, 25, y); y += 8;
  y += 5;

  doc.setTextColor(0, 123, 255);
  doc.text(`Formel: n₂ = n₁ × (ν₂/ν₁) = ${n1} × (${v2}/${v1}) = ${n2} mol`, 20, y); y += 20;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Erstellt mit chemie-lernen.org/stoechiometrie-rechner/', 105, 280, { align: 'center' });

  // Save PDF
  doc.save(`stoechiometrie-mol-mol-${Date.now()}.pdf`);
}

// Export Mass-Mass calculation to PDF
function exportMassMassToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const m1 = document.getElementById('mass-r').value;
  const M1 = document.getElementById('mm-r').value;
  const M2 = document.getElementById('mm-p').value;
  const v1 = document.getElementById('mass-coeff-r').value;
  const v2 = document.getElementById('mass-coeff-p').value;

  const n1 = (parseFloat(m1) / parseFloat(M1)).toFixed(4);
  const n2 = (parseFloat(n1) * (parseFloat(v2) / parseFloat(v1))).toFixed(4);
  const m2 = (parseFloat(n2) * parseFloat(M2)).toFixed(2);

  // PDF Header
  doc.setFontSize(20);
  doc.setTextColor(0, 123, 255);
  doc.text('Stöchiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Masse-Masse Umrechnung', 105, 35, { align: 'center' });

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  // Content
  doc.setFontSize(12);
  let y = 60;

  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Eingabewerte:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Masse Edukt (m₁): ${m1} g`, 25, y); y += 8;
  doc.text(`Molare Masse Edukt (M₁): ${M1} g/mol`, 25, y); y += 8;
  doc.text(`Molare Masse Produkt (M₂): ${M2} g/mol`, 25, y); y += 8;
  doc.text(`Koeffizient Edukt (ν₁): ${v1}`, 25, y); y += 8;
  doc.text(`Koeffizient Produkt (ν₂): ${v2}`, 25, y); y += 15;

  doc.setFontSize(14);
  doc.text('Berechnungsschritte:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Schritt 1: n₁ = m₁/M₁ = ${m1} / ${M1} = ${n1} mol`, 25, y); y += 8;
  doc.text(`Schritt 2: n₂ = n₁ × (ν₂/ν₁) = ${n1} × (${v2}/${v1}) = ${n2} mol`, 25, y); y += 8;
  doc.text(`Schritt 3: m₂ = n₂ × M₂ = ${n2} × ${M2} = ${m2} g`, 25, y); y += 15;

  doc.setFontSize(14);
  doc.text('Ergebnis:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 123, 255);
  doc.text(`Produktmasse: ${m2} g`, 25, y); y += 20;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Erstellt mit chemie-lernen.org/stoechiometrie-rechner/', 105, 280, { align: 'center' });

  // Save PDF
  doc.save(`stoechiometrie-masse-masse-${Date.now()}.pdf`);
}

// Export Limiting Reactant calculation to PDF
function exportLimitingToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const m1 = document.getElementById('lim-m1').value;
  const M1 = document.getElementById('lim-mm1').value;
  const m2 = document.getElementById('lim-m2').value;
  const M2 = document.getElementById('lim-mm2').value;

  const n1 = (parseFloat(m1) / parseFloat(M1)).toFixed(4);
  const n2 = (parseFloat(m2) / parseFloat(M2)).toFixed(4);
  const limiting = parseFloat(n1) < parseFloat(n2) ? 'Reagenz 1' : 'Reagenz 2';

  // PDF Header
  doc.setFontSize(20);
  doc.setTextColor(0, 123, 255);
  doc.text('Stöchiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Limitierendes Reagenz', 105, 35, { align: 'center' });

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  // Content
  doc.setFontSize(12);
  let y = 60;

  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Reagenz 1:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Masse: ${m1} g`, 25, y); y += 8;
  doc.text(`Molare Masse: ${M1} g/mol`, 25, y); y += 8;
  doc.text(`Stoffmenge: ${n1} mol`, 25, y); y += 15;

  doc.setFontSize(14);
  doc.text('Reagenz 2:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Masse: ${m2} g`, 25, y); y += 8;
  doc.text(`Molare Masse: ${M2} g/mol`, 25, y); y += 8;
  doc.text(`Stoffmenge: ${n2} mol`, 25, y); y += 15;

  doc.setFontSize(14);
  doc.text('Ergebnis:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 123, 255);
  doc.text(`Limitierend: ${limiting}`, 25, y); y += 8;
  doc.setTextColor(0, 0, 0);
  doc.text(`Vergleich: ${n1} mol vs ${n2} mol`, 25, y); y += 20;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Erstellt mit chemie-lernen.org/stoechiometrie-rechner/', 105, 280, { align: 'center' });

  // Save PDF
  doc.save(`stoechiometrie-limitierend-${Date.now()}.pdf`);
}

// Export Yield calculation to PDF
function exportYieldToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const theo = document.getElementById('yield-theo').value;
  const act = document.getElementById('yield-act').value;
  const yield_pct = ((parseFloat(act) / parseFloat(theo)) * 100).toFixed(2);

  // PDF Header
  doc.setFontSize(20);
  doc.setTextColor(0, 123, 255);
  doc.text('Stöchiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Ausbeute Berechnung', 105, 35, { align: 'center' });

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  // Content
  doc.setFontSize(12);
  let y = 60;

  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Eingabewerte:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Theoretische Masse: ${theo} g`, 25, y); y += 8;
  doc.text(`Praktische Masse: ${act} g`, 25, y); y += 15;

  doc.setFontSize(14);
  doc.text('Ergebnis:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text('Prozentuale Ausbeute:', 25, y); y += 8;
  doc.setTextColor(0, 123, 255);
  doc.setFontSize(16);
  doc.text(`${yield_pct}%`, 25, y); y += 8;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Berechnung: (${act} g / ${theo} g) × 100 = ${yield_pct}%`, 25, y); y += 20;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Erstellt mit chemie-lernen.org/stoechiometrie-rechner/', 105, 280, { align: 'center' });

  // Save PDF
  doc.save(`stoechiometrie-ausbeute-${Date.now()}.pdf`);
}

// Initialize history on page load
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  // Check for balanced equation data from Equation Balancer
  checkForBalancedEquation();
});
