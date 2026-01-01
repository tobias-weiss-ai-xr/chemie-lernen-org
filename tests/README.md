# Stoichiometry Calculator - Unit Tests

This directory contains comprehensive unit tests for the Stoichiometry Calculator functions.

## Test Coverage

### 1. **Stoichiometry Core Functions** (`stoichiometry.test.js`)
- `parseFormula()` - Parse chemical formulas into element compositions
- `calcMolToMol()` - Mole-to-mole conversions with stoichiometric coefficients
- `calcMassToMass()` - Mass-to-mass conversions (3-step method)
- `calcLimitingReactant()` - Identify limiting reagents
- `calcPercentYield()` - Calculate percent yield
- `calcGasLaw()` - Ideal gas law calculations (PV=nRT)
- `convertToKelvin()` - Temperature conversions

### 2. **Practice Mode Generators** (`practice-generators.test.js`)
- `generateMolMolProblem()` - Random mole-mole problems
- `generateMassMassProblem()` - Random mass-mass problems
- `generateLimitingProblem()` - Random limiting reagent problems
- `generateYieldProblem()` - Random yield problems
- `checkAnswerTolerance()` - Answer validation with tolerance

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests with Verbose Output
```bash
npm run test:verbose
```

## Test Statistics

- **Total Tests**: 80+
- **Test Files**: 2
- **Functions Tested**: 11
- **Code Coverage Target**: 70% (branches, functions, lines, statements)

## Test Structure

### Example Test
```javascript
describe('calcMolToMol', () => {
  test('should calculate 1:1 ratio correctly', () => {
    const result = calcMolToMol(5, 1, 1);
    expect(result).toBe(5);
  });

  test('should calculate 2:1 ratio correctly', () => {
    const result = calcMolToMol(5, 2, 1);
    expect(result).toBe(2.5);
  });

  test('should throw error for non-numeric input', () => {
    expect(() => calcMolToMol('abc', 1, 1)).toThrow('All parameters must be numbers');
  });
});
```

## Test Categories

### ✅ Happy Path Tests
- Normal operations with valid inputs
- Expected correct results
- Different difficulty levels

### ⚠️ Edge Case Tests
- Zero values
- Negative values
- Very large/small numbers
- Decimal precision

### 🚫 Error Handling Tests
- Invalid input types
- Division by zero
- Missing required parameters
- Invalid units

## Coverage Goals

We aim for **70% minimum coverage** across:
- **Branches**: All conditional logic paths
- **Functions**: All public functions tested
- **Lines**: All executable lines
- **Statements**: All code statements

## Continuous Integration

These tests should be run:
1. **Before committing** new code
2. **In CI/CD pipeline** on every push
3. **Before releases** to production

## Adding New Tests

When adding new functionality:

1. **Write the function** in `myhugoapp/static/js/calculators/`
2. **Export it** for Node.js (if using module.exports)
3. **Create tests** in corresponding `tests/*.test.js` file
4. **Run tests** to ensure they pass
5. **Check coverage** to meet 70% threshold

### Test Template
```javascript
describe('functionName', () => {
  test('should do X', () => {
    const result = functionName(param1, param2);
    expect(result).toBe(expected);
  });

  test('should handle edge case Y', () => {
    expect(() => functionName(invalidParam))
      .toThrow('Expected error message');
  });
});
```

## Troubleshooting

### Tests Failing?
1. Check if dependencies are installed: `npm install`
2. Verify function logic matches test expectations
3. Check for rounding/precision issues with `toBeCloseTo()`

### Coverage Low?
1. Add tests for uncovered branches
2. Test error conditions
3. Test edge cases

### Module Not Found?
1. Ensure functions are exported in source files
2. Check file paths in require() statements
3. Verify files are in correct directories

## Test Data

- **Elements Database**: 10 common elements with accurate molar masses
- **Seeded Random**: Tests use seeded random for reproducibility
- **Known Values**: Tests verify against manually calculated results

## Documentation

- **Main Calculator**: `/stoechiometrie-rechner/`
- **Code Documentation**: See inline comments in source files
- **Phase 4**: Technical Improvements (Unit Tests - Feature 1 of 5)

## License

Same as parent project (see LICENSE file in root).

---

**Last Updated**: 2026-01-01
**Test Framework**: Jest 29.7.0
**Environment**: Node.js + jsDOM
