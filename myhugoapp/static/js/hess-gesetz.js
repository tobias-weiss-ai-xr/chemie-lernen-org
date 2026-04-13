/**
 * Hess-Gesetz Rechner
 * Interactive enthalpy calculations with reaction pathway comparisons
 */

// eslint-disable-next-line no-unused-vars
const FORMATION_ENTHALPIES = {
  C: 0,
  H: 0,
  O: 0,
  N: 0,
  S: -296.8,
  Cl: -92.3,
  F: -270.7,
  Br: -30.9,
  I: 62.4,
};

const STANDARD_FORMATION_ENTHALPIES = {
  CO2: -393.5,
  H2O_l: -285.8,
  H2O_g: -241.8,
  CH4: -74.8,
  CO: -110.5,
  NO2: 33.2,
  NH3: -45.9,
  SO2: -296.8,
  HCl: -92.3,
};

const domCache = {
  simple: {
    reaktionsgleichung: null,
    stepsContainer: null,
    resultPanel: null,
    calculation: null,
    deltaH: null,
  },
  multiPath: {
    pathA: {
      step1: null,
      step2: null,
      final: null,
      dh1: null,
      dh2: null,
      total: null,
    },
    pathB: {
      step1: null,
      step2: null,
      final: null,
      dh1: null,
      dh2: null,
      total: null,
    },
    resultPanel: null,
    conclusion: null,
  },
  formation: {
    reaktion: null,
    elements: {},
    resultPanel: null,
    calculationSteps: null,
    deltaH: null,
    reactionType: null,
  },
};

let stepCounter = 2;

function initDOMCache() {
  domCache.simple.reaktionsgleichung = document.getElementById('reaktionsgleichung');
  domCache.simple.stepsContainer = document.getElementById('reaction-steps');
  domCache.simple.resultPanel = document.getElementById('hess-simple-result');
  domCache.simple.calculation = document.getElementById('hess-simple-calculation');
  domCache.simple.deltaH = document.getElementById('hess-simple-delta-h');

  domCache.multiPath.pathA.step1 = document.getElementById('path-a-step1');
  domCache.multiPath.pathA.step2 = document.getElementById('path-a-step2');
  domCache.multiPath.pathA.final = document.getElementById('path-a-final');
  domCache.multiPath.pathA.dh1 = document.getElementById('path-a-dh1');
  domCache.multiPath.pathA.dh2 = document.getElementById('path-a-dh2');
  domCache.multiPath.pathA.total = document.getElementById('path-a-total');

  domCache.multiPath.pathB.step1 = document.getElementById('path-b-step1');
  domCache.multiPath.pathB.step2 = document.getElementById('path-b-step2');
  domCache.multiPath.pathB.final = document.getElementById('path-b-final');
  domCache.multiPath.pathB.dh1 = document.getElementById('path-b-dh1');
  domCache.multiPath.pathB.dh2 = document.getElementById('path-b-dh2');
  domCache.multiPath.pathB.total = document.getElementById('path-b-total');

  domCache.multiPath.resultPanel = document.getElementById('hess-multipath-result');
  domCache.multiPath.conclusion = document.getElementById('hess-conclusion');

  domCache.formation.reaktion = document.getElementById('bildungsreaktion');
  domCache.formation.resultPanel = document.getElementById('hess-formation-result');
  domCache.formation.calculationSteps = document.getElementById('formation-calculation-steps');
  domCache.formation.deltaH = document.getElementById('formation-delta-h');
  domCache.formation.reactionType = document.getElementById('formation-reaction-type');

  const elementCheckboxes = document.querySelectorAll('.element-checkbox input[type="checkbox"]');
  elementCheckboxes.forEach((checkbox) => {
    const element = checkbox.value;
    domCache.formation.elements[element] = checkbox;
  });
}

// eslint-disable-next-line no-unused-vars
function addReactionStep() {
  stepCounter++;

  const stepDiv = document.createElement('div');
  stepDiv.className = 'step-input';
  stepDiv.innerHTML = `
    <div class="step-number">${stepCounter}</div>
    <div class="step-content">
      <label>Stufe ${stepCounter}:</label>
      <input type="text" class="form-control step-formula" placeholder="z.B. C + O₂ → CO₂">
      <label>ΔH${stepCounter} (kJ/mol):</label>
      <input type="number" class="form-control step-delta-h" value="0" step="0.1">
    </div>
  `;

  domCache.simple.stepsContainer.appendChild(stepDiv);
}

// eslint-disable-next-line no-unused-vars
function calculateHessSimple() {
  const steps = document.querySelectorAll('.step-input');
  let totalDeltaH = 0;
  let calculationSteps = [];

  steps.forEach((step, _index) => {
    const formula = step.querySelector('.step-formula').value;
    const deltaH = parseFloat(step.querySelector('.step-delta-h').value);

    if (!isNaN(deltaH)) {
      totalDeltaH += deltaH;
      calculationSteps.push({ formula, deltaH });
    }
  });

  if (calculationSteps.length === 0) {
    alert('Bitte geben Sie mindestens eine Reaktionsstufe mit Enthalpiewert ein.');
    return;
  }

  const calculationText = calculationSteps
    .map((step, _i) => {
      const _sign = step.deltaH >= 0 ? '+' : '';
      return `${step.deltaH.toFixed(1)} kJ/mol`;
    })
    .join(' + ');

  domCache.simple.calculation.innerHTML = `ΔH = ${calculationText} = ${totalDeltaH.toFixed(1)} kJ/mol`;
  domCache.simple.deltaH.textContent = `${totalDeltaH.toFixed(1)} kJ/mol`;
  domCache.simple.resultPanel.style.display = 'block';
}

// eslint-disable-next-line no-unused-vars
function calculateHessMultiPath() {
  const pathA_DH1 = parseFloat(domCache.multiPath.pathA.dh1.value) || 0;
  const pathA_DH2 = parseFloat(domCache.multiPath.pathA.dh2.value) || 0;
  const pathA_Total = pathA_DH1 + pathA_DH2;

  const pathB_DH1 = parseFloat(domCache.multiPath.pathB.dh1.value) || 0;
  const pathB_DH2 = parseFloat(domCache.multiPath.pathB.dh2.value) || 0;
  const pathB_Total = pathB_DH1 + pathB_DH2;

  const pathACalc = `${pathA_DH1 >= 0 ? '' : ''}${pathA_DH1.toFixed(1)} + (${pathA_DH2 >= 0 ? '' : ''}${pathA_DH2.toFixed(1)}) = ${pathA_Total.toFixed(1)} kJ/mol`;
  const pathBCalc = `${pathB_DH1 >= 0 ? '' : ''}${pathB_DH1.toFixed(1)} + (${pathB_DH2 >= 0 ? '' : ''}${pathB_DH2.toFixed(1)}) = ${pathB_Total.toFixed(1)} kJ/mol`;

  const pathACalculation = document.getElementById('path-a-calculation');
  const pathBCalculation = document.getElementById('path-b-calculation');

  pathACalculation.textContent = pathACalc;
  pathBCalculation.textContent = pathBCalc;

  domCache.multiPath.pathA.total.textContent = `${pathA_Total.toFixed(1)} kJ/mol`;
  domCache.multiPath.pathB.total.textContent = `${pathB_Total.toFixed(1)} kJ/mol`;

  const tolerance = 0.1;
  const difference = Math.abs(pathA_Total - pathB_Total);

  if (difference > tolerance) {
    domCache.multiPath.conclusion.className = 'alert alert-warning';
    domCache.multiPath.conclusion.innerHTML = `
      <h4>⚠️ Diskrepanz festgestellt!</h4>
      <p>Die beiden Wege ergeben unterschiedliche Werte.</p>
      <p><strong>Unterschied:</strong> ${difference.toFixed(1)} kJ/mol</p>
      <p>Bitte überprüfen Sie Ihre Eingaben oder die Reaktionswege.</p>
    `;
  } else {
    domCache.multiPath.conclusion.className = 'alert alert-success';
    domCache.multiPath.conclusion.innerHTML = `
      <h4>✅ Bestätigt: Hess-Gesetz verifiziert!</h4>
      <p>Beide Wege ergeben das gleiche Ergebnis (ΔH = ${pathA_Total.toFixed(1)} kJ/mol).</p>
      <p>Dies bestätigt, dass die Reaktionsenthalpie wegunabhängig vom Reaktionsweg ist.</p>
    `;
  }

  domCache.multiPath.resultPanel.style.display = 'block';
}

// eslint-disable-next-line no-unused-vars
function calculateFromFormationEnthalpies() {
  const reactionEquation = domCache.formation.reaktion.value.trim();

  if (!reactionEquation) {
    alert('Bitte geben Sie eine Reaktionsgleichung ein.');
    return;
  }

  const elements = parseReactionElements(reactionEquation);

  if (!elements || elements.length === 0) {
    alert('Konnte die Elemente in der Reaktion nicht ermitteln.');
    return;
  }

  let reactantsEnthalpy = 0;
  let productsEnthalpy = 0;

  elements.forEach((element) => {
    if (element.checked) {
      const deltaHf = STANDARD_FORMATION_ENTHALPIES[element.name] || 0;
      const count = element.count || 1;

      if (element.type === 'reactant') {
        reactantsEnthalpy += deltaHf * count;
      } else {
        productsEnthalpy += deltaHf * count;
      }
    }
  });

  const reactionDeltaH = productsEnthalpy - reactantsEnthalpy;

  const calculationSteps = domCache.formation.calculationSteps;

  let calculationHTML = '';
  calculationHTML += `<p>Σ ΔH<sub>f</sub>(Produkte) = ${productsEnthalpy.toFixed(1)} kJ/mol</p>`;
  calculationHTML += `<p>Σ ΔH<sub>f</sub>(Edukte) = ${reactantsEnthalpy.toFixed(1)} kJ/mol</p>`;
  calculationHTML += `<p class="formula">ΔH<sub>Rxn</sub> = ${productsEnthalpy.toFixed(1)} - (${reactantsEnthalpy.toFixed(1)}) = ${reactionDeltaH.toFixed(1)} kJ/mol</p>`;

  calculationSteps.innerHTML = calculationHTML;

  domCache.formation.deltaH.textContent = `${reactionDeltaH.toFixed(1)} kJ/mol`;

  if (reactionDeltaH < 0) {
    domCache.formation.reactionType.textContent = 'Exotherm';
    domCache.formation.reactionType.className = 'badge exothermic';
  } else if (reactionDeltaH > 0) {
    domCache.formation.reactionType.textContent = 'Endotherm';
    domCache.formation.reactionType.className = 'badge endothermic';
  } else {
    domCache.formation.reactionType.textContent = 'Thermoneutral';
    domCache.formation.reactionType.className = 'badge neutral';
  }

  domCache.formation.resultPanel.style.display = 'block';
}

function parseReactionElements(reactionEquation) {
  const elements = [];

  const elementPattern = /([A-Z][a-z]?\d*)/g;
  const matches = reactionEquation.match(elementPattern);

  if (!matches) return [];

  const reactants = reactionEquation.split('→')[0];
  const products = reactionEquation.split('→')[1] || '';

  matches.forEach((match) => {
    const elementName = match[1];
    if (!elements.find((e) => e.name === elementName)) {
      const inReactants = reactants.includes(elementName);
      const inProducts = products.includes(elementName);

      const _count =
        (reactants.match(new RegExp(elementName, 'g')) || []).length +
        (products.match(new RegExp(elementName, 'g')) || []).length;

      if (inReactants && inProducts) {
        const reactantCount = (reactants.match(new RegExp(elementName, 'g')) || []).length;
        const productCount = (products.match(new RegExp(elementName, 'g')) || []).length;

        elements.push({
          name: elementName,
          count: reactantCount,
          type: 'reactant',
          checked: false,
        });
        elements.push({ name: elementName, count: productCount, type: 'product', checked: false });
      } else if (inReactants) {
        const count = (reactants.match(new RegExp(elementName, 'g')) || []).length;
        elements.push({ name: elementName, count, type: 'reactant', checked: false });
      } else if (inProducts) {
        const count = (products.match(new RegExp(elementName, 'g')) || []).length;
        elements.push({ name: elementName, count, type: 'product', checked: false });
      }
    }
  });

  return elements;
}

document.addEventListener('DOMContentLoaded', function () {
  initDOMCache();
});
