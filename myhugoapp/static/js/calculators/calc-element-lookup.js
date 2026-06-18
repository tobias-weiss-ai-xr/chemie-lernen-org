const elementDatabase = {
  'H': { symbol: 'H', name: 'Wasserstoff', mass: 1.008, number: 1 },
  'C': { symbol: 'C', name: 'Kohlenstoff', mass: 12.011, number: 6 },
  'N': { symbol: 'N', name: 'Stickstoff', mass: 14.007, number: 7 },
  'O': { symbol: 'O', name: 'Sauerstoff', mass: 15.999, number: 8 },
  'F': { symbol: 'F', name: 'Fluor', mass: 18.998, number: 9 },
  'P': { symbol: 'P', name: 'Phosphor', mass: 30.974, number: 15 },
  'S': { symbol: 'S', name: 'Schwefel', mass: 32.06, number: 16 },
  'Cl': { symbol: 'Cl', name: 'Chlor', mass: 35.45, number: 17 },
  'I': { symbol: 'I', name: 'Iod', mass: 126.90, number: 53 },
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
  'Cr': { symbol: 'Cr', name: 'Chrom', mass: 51.996, number: 24 },
  'Mn': { symbol: 'Mn', name: 'Mangan', mass: 54.938, number: 25 },
  'Ni': { symbol: 'Ni', name: 'Nickel', mass: 58.693, number: 28 },
  'Pt': { symbol: 'Pt', name: 'Platin', mass: 195.08, number: 78 },
  'He': { symbol: 'He', name: 'Helium', mass: 4.0026, number: 2 },
  'Ne': { symbol: 'Ne', name: 'Neon', mass: 20.180, number: 10 },
  'Ar': { symbol: 'Ar', name: 'Argon', mass: 39.948, number: 18 }
};


function applyMolarMass() {
  const selector = document.getElementById('element-selector');
  const selectedValue = selector.value;

  if (!selectedValue) {
    showToast('Bitte wählen Sie ein Element aus.', 'error');
    return;
  }

  const parts = selectedValue.split(':');
  const symbol = parts[0];
  const mass = parts[1];
  const element = elementDatabase[symbol];

  if (!element) {
    showToast('Element nicht gefunden: ' + symbol, 'error');
    return;
  }

  showElementInfo(element);

  applyMolarMassToCalculator(element);

  setTimeout(() => {
    document.querySelector('a[href="#masse-masse"]').click();
    document.querySelectorAll('.calculator-panel')[1].scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

function showElementInfo(element) {
  const infoContainer = document.getElementById('molar-mass-info');
  const detailsContainer = document.getElementById('molar-mass-details');

  detailsContainer.innerHTML =
    '<strong>' + element.symbol + '</strong> - ' + element.name + '<br>' +
    '<span style="font-size: 1.2em; color: #9C27B0;">' +
      '<strong>M = ' + element.mass + ' g/mol</strong>' +
    '</span><br>' +
    '<small class="text-muted">Ordnungszahl: ' + element.number + '</small>';

  infoContainer.style.display = 'block';
}

function applyMolarMassToCalculator(element) {
  const reactantField = document.getElementById('mm-r');
  const productField = document.getElementById('mm-p');

  if (!reactantField.value || parseFloat(reactantField.value) === 0) {
    reactantField.value = element.mass;
    showToast(element.symbol + ' (' + element.name + ') molare Masse ' + element.mass + ' g/mol als Edukt übernommen', 'success');
  } else if (!productField.value || parseFloat(productField.value) === 0) {
    productField.value = element.mass;
    showToast(element.symbol + ' (' + element.name + ') molare Masse ' + element.mass + ' g/mol als Produkt übernommen', 'success');
  } else {
    const choice = confirm(
      element.symbol + ' (' + element.name + ') - M = ' + element.mass + ' g/mol\n\n' +
      'Beide Felder sind ausgefüllt:\n' +
      'Edukt: ' + reactantField.value + ' g/mol\n' +
      'Produkt: ' + productField.value + ' g/mol\n\n' +
      'Klicken Sie OK, um das Edukt-Feld zu ersetzen,\n' +
      'oder Abbrechen, um das Produkt-Feld zu ersetzen.'
    );

    if (choice) {
      reactantField.value = element.mass;
    } else {
      productField.value = element.mass;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    elementDatabase: elementDatabase,
  };
}
