# Advanced Chemistry Calculators

This document describes the advanced calculator features including serial dilution, titration, and concentration unit conversions.

## Features

### 1. Serial Dilution Calculator

Calculates multi-step dilutions for creating solutions of specific concentrations from stock solutions.

#### Functions

**`calculateSerialDilution(options)`**

Calculates a series of dilutions to reach a target concentration.

```javascript
const result = calculateSerialDilution({
  initialConcentration: 1.0, // Stock solution (M)
  targetConcentration: 0.001, // Target concentration (M)
  finalVolume: 100, // Final volume per step (mL)
  numberOfDilutions: 3, // Number of dilution steps
});
```

**Returns:**

```javascript
{
  initialConcentration: 1.0,
  targetConcentration: 0.001,
  totalDilutionFactor: 1000,
  dilutionFactorPerStep: 10,
  steps: [
    {
      step: 1,
      concentration: 0.1,
      volumeOfStock: 10,
      volumeOfDiluent: 90,
      finalVolume: 100,
      dilutionFactor: 10
    },
    // ... more steps
  ]
}
```

**`calculateDilution(c1, v1, c2)`**

Calculates parameters for a single dilution using C₁V₁ = C₂V₂.

```javascript
const result = calculateDilution(1.0, 10, 0.1);
// Returns: { v2: 100, diluentVolume: 90, dilutionFactor: 10 }
```

### 2. Titration Calculator

Calculates titration parameters, equivalence point, and generates titration curves.

#### Functions

**`calculateTitration(options)`**

```javascript
const result = calculateTitration({
  titrantConcentration: 0.1, // Titrant (M)
  analyteConcentration: 0.1, // Analyte (M)
  analyteVolume: 50, // Analyte volume (mL)
  stoichiometryRatio: 1, // Mole ratio
  acidStrength: 'strong', // 'strong' or 'weak'
  baseStrength: 'strong', // 'strong' or 'weak'
});
```

**Returns:**

```javascript
{
  titrantConcentration: 0.1,
  analyteConcentration: 0.1,
  analyteVolume: 50,
  stoichiometryRatio: 1,
  molesOfAnalyte: 0.005,
  molesOfTitrant: 0.005,
  volumeOfTitrant: 50,
  totalVolume: 100,
  concentrationAtEquivalence: 0.05,
  titrationCurve: [
    { volumeAdded: 0, percent: 0, ph: 1, region: 'before' },
    { volumeAdded: 5, percent: 10, ph: 1.05, region: 'before' },
    // ... more curve points
  ]
}
```

**Titration Curve Properties:**

- `volumeAdded` - Volume of titrant added (mL)
- `percent` - Percentage to equivalence point
- `ph` - pH at this point
- `region` - 'before', 'equivalence', or 'after'

### 3. pH Calculations

#### Functions

**`calculatePHFromConcentration(hConcentration)`**

Calculates pH from H+ concentration.

```javascript
const ph = calculatePHFromConcentration(0.1); // Returns: 1.0
```

**`calculateHConcentrationFromPH(ph)`**

Calculates H+ concentration from pH.

```javascript
const h = calculateHConcentrationFromPH(7); // Returns: 1e-7
```

**`calculatePOH(ph)`**

Calculates pOH from pH.

```javascript
const poh = calculatePOH(7); // Returns: 7
```

### 4. Concentration Unit Converter

Converts between different concentration units.

#### Supported Units

- `M` - Molar (moles/L)
- `mM` - Millimolar (mmol/L)
- `μM` - Micromolar (μmol/L)
- `nM` - Nanomolar (nmol/L)
- `%` - Percent (g/100mL approximate)
- `ppm` - Parts per million (mg/L)
- `ppb` - Parts per billion (μg/L)

#### Functions

**`convertConcentration(value, fromUnit, toUnit, molecularWeight)`**

```javascript
// Convert molar to millimolar
const mM = convertConcentration(1, ConcentrationUnits.MOLAR, ConcentrationUnits.MILLIMOLAR);
// Returns: 1000

// Convert PPM to molar (with molecular weight)
const molar = convertConcentration(5844, ConcentrationUnits.PPM, ConcentrationUnits.MOLAR, 58.44);
// Returns: 0.1 (for NaCl)
```

### 5. Solution Calculator

Calculates relationships between mass, moles, volume, and concentration.

#### Functions

**`calculateSolutionParameters(options)`**

```javascript
const result = calculateSolutionParameters({
  mass: 5.844, // grams (optional)
  molecularWeight: 58.44, // g/mol (required)
  volume: 1, // liters (optional)
  concentration: 0.1, // M (optional)
  moles: 0.1, // moles (optional)
});
```

**Any combination of parameters works:**

```javascript
// From mass and volume
const r1 = calculateSolutionParameters({ mass: 5.844, molecularWeight: 58.44, volume: 1 });

// From moles and volume
const r2 = calculateSolutionParameters({ moles: 0.5, molecularWeight: 58.44, volume: 2 });

// From concentration and volume
const r3 = calculateSolutionParameters({ concentration: 0.1, molecularWeight: 58.44, volume: 1 });
```

**`calculateMolarity(moles, volumeLiters)`**

```javascript
const molarity = calculateMolarity(0.5, 2); // Returns: 0.25 M
```

**`calculateMolesForMolarity(molarity, volumeLiters)`**

```javascript
const moles = calculateMolesForMolarity(0.25, 2); // Returns: 0.5
```

## Usage Examples

### Example 1: Serial Dilution for ELISA

```javascript
// Create 1:1000 dilution in 3 steps
const protocol = calculateSerialDilution({
  initialConcentration: 1.0,
  targetConcentration: 0.001,
  finalVolume: 100,
  numberOfDilutions: 3,
});

console.log('Dilution Protocol:');
protocol.steps.forEach((step) => {
  console.log(`Step ${step.step}: Mix ${step.volumeOfStock.toFixed(1)} mL stock 
    with ${step.volumeOfDiluent.toFixed(1)} mL diluent`);
});
```

### Example 2: Acid-Base Titration

```javascript
// Calculate titration of HCl with NaOH
const titration = calculateTitration({
  titrantConcentration: 0.1, // NaOH
  analyteConcentration: 0.1, // HCl
  analyteVolume: 50,
  stoichiometryRatio: 1,
  acidStrength: 'strong',
  baseStrength: 'strong',
});

console.log(`Equivalence point at ${titration.volumeOfTitrant.toFixed(1)} mL`);

// Find pH at 25 mL added
const point = titration.titrationCurve.find((p) => p.volumeAdded === 25);
console.log(`pH at 25 mL: ${point.ph.toFixed(2)}`);
```

### Example 3: Concentration Conversion

```javascript
// Convert protein concentration from mg/mL to molar
const mw = 66000; // 66 kDa protein
const concMolar = convertConcentration(1, ConcentrationUnits.PPM, ConcentrationUnits.MOLAR, mw);
console.log(`1 mg/mL = ${concMolar.toExponential(2)} M`);

// Convert to micromolar
const concMicromolar = convertConcentration(
  concMolar,
  ConcentrationUnits.MOLAR,
  ConcentrationUnits.MICROMOLAR
);
console.log(`= ${concMicromolar.toFixed(2)} μM`);
```

### Example 4: Solution Preparation

```javascript
// Calculate mass needed for solution
const solution = calculateSolutionParameters({
  concentration: 0.1, // 0.1 M
  volume: 0.5, // 500 mL
  molecularWeight: 58.44, // NaCl
});

console.log(`Weigh ${solution.mass.toFixed(2)} g NaCl`);
console.log(`Dissolve in ${solution.volume} L water`);
console.log(`This gives ${solution.concentration} M (${solution.moles} moles)`);
```

## Error Handling

All functions validate inputs and throw descriptive errors:

```javascript
try {
  calculateSerialDilution({
    initialConcentration: 0.1,
    targetConcentration: 0.5, // Error: target > initial
    finalVolume: 100,
  });
} catch (error) {
  console.error(error.message);
  // "Target concentration must be less than initial concentration"
}
```

## Validation Rules

### Serial Dilution

- Initial concentration must be positive
- Target concentration must be positive and less than initial
- Final volume must be positive
- Number of dilutions must be at least 1

### Titration

- All concentrations must be positive
- Volume must be positive
- Stoichiometry ratio must be positive

### pH Calculations

- H+ concentration must be positive
- pH must be between 0 and 14

### Concentration Conversion

- Value must be numeric
- Units must be valid
- Molecular weight required for mass-based units

### Solution Parameters

- Molecular weight must be positive
- At least two parameters must be provided
- Volumes and concentrations must be positive

## Integration

### Using in Web Pages

```html
<script src="/static/js/calculators/advanced-calculators.js"></script>
<script>
  const result = calculateSerialDilution({
    initialConcentration: parseFloat(document.getElementById('stock').value),
    targetConcentration: parseFloat(document.getElementById('target').value),
    finalVolume: 100,
    numberOfDilutions: 3,
  });

  displayResults(result);
</script>
```

### Using with Node.js

```javascript
const {
  calculateSerialDilution,
  calculateTitration,
  convertConcentration
} = require('./advanced-calculators.js');

const dilution = calculateSerialDilution({...});
console.log(dilution);
```

## Testing

Run the test suite:

```bash
npm test -- tests/advanced-calculators.test.js
```

**Coverage:** 42 tests covering all functions

- Serial Dilution: 6 tests
- Titration: 6 tests
- pH Calculations: 7 tests
- Concentration Conversion: 8 tests
- Solution Calculations: 15 tests

## Formulas

### Dilution Formula

**C₁V₁ = C₂V₂**

Where:

- C₁ = Initial concentration
- V₁ = Initial volume
- C₂ = Final concentration
- V₂ = Final volume

### Dilution Factor

**DF = C₁ / C₂ = V₂ / V₁**

### Serial Dilution

**Total DF = DF₁ × DF₂ × ... × DFₙ**

### Titration

**Moles = Concentration × Volume**

**Equivalence Point:**

- Moles of titrant = Moles of analyte × stoichiometry ratio
- Volume of titrant = Moles of titrant / titrant concentration

### pH

**pH = -log[H⁺]**

**pOH = 14 - pH**

**[H⁺] = 10^(-pH)**

### Molarity

**M = moles / volume (L)**

**moles = M × volume (L)**

## Common Applications

### Laboratory Dilutions

- Preparing working solutions from stock
- Serial dilutions for assays
- Standard curve preparation

### Titration

- Acid-base titrations
- Redox titrations
- Complexometric titrations

### Biochemistry

- Protein solutions
- DNA/RNA concentrations
- Buffer preparation

### Pharmaceutical

- Drug formulation
- IV solution preparation
- Quality control

## Performance

- **Fast calculations:** All operations complete in < 1ms
- **No external dependencies:** Pure JavaScript
- **Browser compatible:** Works in all modern browsers
- **Node.js compatible:** Can be used server-side

## Future Enhancements

Potential additions:

- Support for more titration types
- pKa calculations
- Buffer capacity calculations
- Ionic strength corrections
- Temperature compensation
- More concentration units
- Custom dilution schemes

## References

- Harris, D.C. "Quantitative Chemical Analysis"
- Skoog, D.A. "Fundamentals of Analytical Chemistry"
- Mohr, P.J. et al. "CODATA Recommended Values of the Fundamental Physical Constants"

For more information, see the main project documentation or open an issue.
