/**
 * Advanced Chemistry Calculators
 * Serial Dilution and Titration calculators
 */

/**
 * Serial Dilution Calculator
 * Calculates dilutions for creating solutions of specific concentrations
 */

function calculateSerialDilution(options) {
  const {
    initialConcentration,  // Stock solution concentration (M)
    targetConcentration,   // Desired final concentration (M)
    finalVolume,          // Desired final volume (mL)
    numberOfDilutions = 1 // Number of serial dilutions
  } = options;

  // Validation
  if (initialConcentration <= 0) {
    throw new Error('Initial concentration must be positive');
  }
  if (targetConcentration <= 0) {
    throw new Error('Target concentration must be positive');
  }
  if (targetConcentration >= initialConcentration) {
    throw new Error('Target concentration must be less than initial concentration');
  }
  if (finalVolume <= 0) {
    throw new Error('Final volume must be positive');
  }
  if (numberOfDilutions < 1) {
    throw new Error('Number of dilutions must be at least 1');
  }

  const results = [];
  let currentConcentration = initialConcentration;

  // Calculate total dilution factor needed
  const totalDilutionFactor = initialConcentration / targetConcentration;

  // Calculate dilution factor per step
  const dilutionFactorPerStep = Math.pow(totalDilutionFactor, 1 / numberOfDilutions);

  for (let i = 1; i <= numberOfDilutions; i++) {
    const volumeOfStock = finalVolume / dilutionFactorPerStep;
    const volumeOfDiluent = finalVolume - volumeOfStock;

    results.push({
      step: i,
      concentration: currentConcentration / dilutionFactorPerStep,
      volumeOfStock,
      volumeOfDiluent,
      finalVolume,
      dilutionFactor: dilutionFactorPerStep
    });

    currentConcentration = currentConcentration / dilutionFactorPerStep;
  }

  return {
    initialConcentration,
    targetConcentration,
    finalVolume,
    numberOfDilutions,
    totalDilutionFactor,
    dilutionFactorPerStep,
    steps: results
  };
}

/**
 * Calculate single dilution
 * @param {number} c1 - Initial concentration
 * @param {number} v1 - Initial volume
 * @param {number} c2 - Final concentration
 * @returns {object} Dilution parameters
 */
function calculateDilution(c1, v1, c2) {
  if (c1 <= 0 || v1 <= 0 || c2 <= 0) {
    throw new Error('All parameters must be positive');
  }
  if (c2 >= c1) {
    throw new Error('Final concentration must be less than initial concentration');
  }

  // Using C1V1 = C2V2, find V2
  const v2 = (c1 * v1) / c2;
  const diluentVolume = v2 - v1;
  const dilutionFactor = c1 / c2;

  return {
    c1,
    v1,
    c2,
    v2,
    diluentVolume,
    dilutionFactor,
    formula: 'C₁V₁ = C₂V₂'
  };
}

/**
 * Titration Calculator
 * Calculates titration parameters and equivalence point
 */

function calculateTitration(options) {
  const {
    titrantConcentration,  // Concentration of titrant (M)
    analyteConcentration,  // Concentration of analyte (M)
    analyteVolume,         // Volume of analyte (mL)
    stoichiometryRatio = 1 // Mole ratio (titrant:analyte)
  } = options;

  // Validation
  if (titrantConcentration <= 0) {
    throw new Error('Titrant concentration must be positive');
  }
  if (analyteConcentration <= 0) {
    throw new Error('Analyte concentration must be positive');
  }
  if (analyteVolume <= 0) {
    throw new Error('Analyte volume must be positive');
  }
  if (stoichiometryRatio <= 0) {
    throw new Error('Stoichiometry ratio must be positive');
  }

  // Calculate moles of analyte
  const molesOfAnalyte = (analyteConcentration * analyteVolume) / 1000;

  // Calculate moles of titrant needed
  const molesOfTitrant = molesOfAnalyte * stoichiometryRatio;

  // Calculate volume of titrant at equivalence point
  const volumeOfTitrant = (molesOfTitrant / titrantConcentration) * 1000;

  // Calculate total volume at equivalence point
  const totalVolume = analyteVolume + volumeOfTitrant;

  // Calculate concentration of analyte at equivalence point
  const concentrationAtEquivalence = molesOfAnalyte / (totalVolume / 1000);

  return {
    titrantConcentration,
    analyteConcentration,
    analyteVolume,
    stoichiometryRatio,
    molesOfAnalyte,
    molesOfTitrant,
    volumeOfTitrant,
    totalVolume,
    concentrationAtEquivalence,
    titrationCurve: generateTitrationCurve(options)
  };
}

/**
 * Generate titration curve data points
 */
function generateTitrationCurve(options) {
  const {
    titrantConcentration,
    analyteConcentration,
    analyteVolume,
    stoichiometryRatio = 1,
    acidStrength = 'strong',  // 'strong' or 'weak'
    baseStrength = 'strong'   // 'strong' or 'weak'
  } = options;

  const curve = [];

  // Calculate equivalence point directly (no recursion)
  const molesOfAnalyte = (analyteConcentration * analyteVolume) / 1000;
  const molesOfTitrant = molesOfAnalyte * stoichiometryRatio;
  const equivalencePoint = (molesOfTitrant / titrantConcentration) * 1000;

  // Generate points before equivalence point (0% to 90%)
  for (let percent = 0; percent <= 90; percent += 10) {
    const volumeAdded = (equivalencePoint * percent) / 100;
    const ph = calculatePHBeforeEquivalence(percent, acidStrength, baseStrength);
    curve.push({ volumeAdded, percent, ph, region: 'before' });
  }

  // Points near equivalence point (95% to 105%)
  for (let percent = 95; percent <= 105; percent += 1) {
    const volumeAdded = (equivalencePoint * percent) / 100;
    const ph = calculatePHAtEquivalence(percent, acidStrength, baseStrength);
    curve.push({ volumeAdded, percent, ph, region: 'equivalence' });
  }

  // Points after equivalence point (110% to 200%)
  for (let percent = 110; percent <= 200; percent += 10) {
    const volumeAdded = (equivalencePoint * percent) / 100;
    const ph = calculatePHAfterEquivalence(percent, acidStrength, baseStrength);
    curve.push({ volumeAdded, percent, ph, region: 'after' });
  }

  return curve;
}

/**
 * Calculate pH before equivalence point
 */
function calculatePHBeforeEquivalence(percent, acidStrength, baseStrength) {
  // Simplified pH calculation
  if (acidStrength === 'strong' && baseStrength === 'strong') {
    // Strong acid - strong base
    const remainingAcidPercent = 100 - percent;
    return -Math.log10(remainingAcidPercent / 100);
  } else if (acidStrength === 'weak' && baseStrength === 'strong') {
    // Weak acid - strong base (buffer region)
    return 4.75 + Math.log10(percent / (100 - percent)); // pKa = 4.75 for acetic acid
  }
  return 7;
}

/**
 * Calculate pH at equivalence point
 */
function calculatePHAtEquivalence(percent, acidStrength, baseStrength) {
  if (acidStrength === 'strong' && baseStrength === 'strong') {
    return 7.0;
  } else if (acidStrength === 'weak' && baseStrength === 'strong') {
    return 8.72; // Typical for weak acid - strong base
  } else if (acidStrength === 'strong' && baseStrength === 'weak') {
    return 5.28; // Typical for strong acid - weak base
  }
  return 7.0;
}

/**
 * Calculate pH after equivalence point
 */
function calculatePHAfterEquivalence(percent, acidStrength, baseStrength) {
  const excessBasePercent = percent - 100;
  if (acidStrength === 'strong' && baseStrength === 'strong') {
    return 7 + Math.log10(excessBasePercent / 100);
  } else if (acidStrength === 'weak' && baseStrength === 'strong') {
    return 8 + Math.log10(excessBasePercent / 100);
  }
  return 7 + Math.log10(excessBasePercent / 100);
}

/**
 * Concentration Unit Converter
 */

const ConcentrationUnits = {
  MOLAR: 'M',           // moles/L
  MILLIMOLAR: 'mM',     // mmol/L
  MICROMOLAR: 'μM',     // μmol/L
  NANOMOLAR: 'nM',      // nmol/L
  PERCENT: '%',         // g/100mL (approximate)
  PPM: 'ppm',           // mg/L
  PPB: 'ppb'            // μg/L
};

function convertConcentration(value, fromUnit, toUnit, molecularWeight = 1) {
  // Convert to molar first
  let molar = value;

  switch (fromUnit) {
    case ConcentrationUnits.MOLAR:
      molar = value;
      break;
    case ConcentrationUnits.MILLIMOLAR:
      molar = value / 1000;
      break;
    case ConcentrationUnits.MICROMOLAR:
      molar = value / 1000000;
      break;
    case ConcentrationUnits.NANOMOLAR:
      molar = value / 1000000000;
      break;
    case ConcentrationUnits.PERCENT:
      // Approximate: 1% ≈ 10 g/L for MW = 100 g/mol
      molar = (value * 10) / molecularWeight;
      break;
    case ConcentrationUnits.PPM:
      // ppm = mg/L, convert to mol/L
      molar = (value / 1000) / molecularWeight;
      break;
    case ConcentrationUnits.PPB:
      // ppb = μg/L, convert to mol/L
      molar = (value / 1000000) / molecularWeight;
      break;
    default:
      throw new Error('Unknown source unit: ' + fromUnit);
  }

  // Convert from molar to target unit
  switch (toUnit) {
    case ConcentrationUnits.MOLAR:
      return molar;
    case ConcentrationUnits.MILLIMOLAR:
      return molar * 1000;
    case ConcentrationUnits.MICROMOLAR:
      return molar * 1000000;
    case ConcentrationUnits.NANOMOLAR:
      return molar * 1000000000;
    case ConcentrationUnits.PERCENT:
      return (molar * molecularWeight) / 10;
    case ConcentrationUnits.PPM:
      return (molar * molecularWeight) * 1000;
    case ConcentrationUnits.PPB:
      return (molar * molecularWeight) * 1000000;
    default:
      throw new Error('Unknown target unit: ' + toUnit);
  }
}

/**
 * pH Calculator
 */

function calculatePHFromConcentration(hConcentration) {
  if (hConcentration <= 0) {
    throw new Error('H+ concentration must be positive');
  }
  return -Math.log10(hConcentration);
}

function calculateHConcentrationFromPH(ph) {
  if (ph < 0 || ph > 14) {
    throw new Error('pH must be between 0 and 14');
  }
  return Math.pow(10, -ph);
}

function calculatePOH(ph) {
  return 14 - ph;
}

function calculateKW(ph, temperature = 25) {
  // Water ionization product varies with temperature
  const kwAt25C = 1e-14;
  const _tempCelsius = temperature - 273.15;

  // Simplified temperature correction
  const kw = kwAt25C * Math.exp(7000 * (1 / 298 - 1 / temperature));

  return kw;
}

/**
 * Solution Calculator
 * Calculates mass, moles, and concentration relationships
 */

function calculateSolutionParameters(options) {
  const {
    mass = null,              // grams
    molecularWeight,          // g/mol
    volume = null,            // liters
    concentration = null,     // M (moles/L)
    moles = null              // moles
  } = options;

  if (!molecularWeight || molecularWeight <= 0) {
    throw new Error('Molecular weight must be positive');
  }

  const results = {};

  // Calculate moles if not provided
  if (moles === null) {
    if (mass !== null) {
      results.moles = mass / molecularWeight;
    } else if (concentration !== null && volume !== null) {
      results.moles = concentration * volume;
    }
  } else {
    results.moles = moles;
  }

  // Calculate mass if not provided
  if (mass === null) {
    results.mass = results.moles * molecularWeight;
  } else {
    results.mass = mass;
  }

  // Calculate concentration if not provided
  if (concentration === null) {
    if (volume !== null) {
      results.concentration = results.moles / volume;
    }
  } else {
    results.concentration = concentration;
  }

  // Calculate volume if not provided
  if (volume === null) {
    if (concentration !== null) {
      results.volume = results.moles / concentration;
    }
  } else {
    results.volume = volume;
  }

  return results;
}

/**
 * Molarity Calculator
 */

function calculateMolarity(moles, volumeLiters) {
  if (moles < 0) {
    throw new Error('Moles cannot be negative');
  }
  if (volumeLiters <= 0) {
    throw new Error('Volume must be positive');
  }

  return moles / volumeLiters;
}

function calculateMolesForMolarity(molarity, volumeLiters) {
  if (molarity < 0) {
    throw new Error('Molarity cannot be negative');
  }
  if (volumeLiters <= 0) {
    throw new Error('Volume must be positive');
  }

  return molarity * volumeLiters;
}

/**
 * Dilution Calculator for multiple concentrations
 */

function _calculateMultipleDilutions(dilutionScheme) {
  // dilutionScheme: array of {targetConcentration, finalVolume}
  const results = [];

  for (const step of dilutionScheme) {
    const { targetConcentration, finalVolume, startingConcentration } = step;

    if (startingConcentration && targetConcentration >= startingConcentration) {
      throw new Error('Target concentration must be less than starting concentration');
    }

    const dilutionFactor = startingConcentration / targetConcentration;
    const volumeOfStock = finalVolume / dilutionFactor;
    const volumeOfDiluent = finalVolume - volumeOfStock;

    results.push({
      targetConcentration,
      finalVolume,
      volumeOfStock,
      volumeOfDiluent,
      dilutionFactor
    });
  }

  return results;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateSerialDilution,
    calculateDilution,
    calculateTitration,
    calculatePHFromConcentration,
    calculateHConcentrationFromPH,
    calculatePOH,
    calculateKW,
    calculateSolutionParameters,
    calculateMolarity,
    calculateMolesForMolarity,
    convertConcentration,
    ConcentrationUnits,
    generateTitrationCurve
  };
}
