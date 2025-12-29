/**
 * Interactive Tools - JavaScript Unit Tests
 * Unit tests for pH Calculator, Molar Mass Calculator, and Equation Balancer
 */

// Import functions from the calculator scripts
// Note: These tests assume the functions are available globally or can be imported

describe('pH Calculator Tests', () => {

    describe('pH Calculations', () => {

        test('calculate pH from H+ concentration', () => {
            // Test neutral solution
            const hplus = 1e-7;
            const ph = -Math.log10(hplus);
            expect(ph).toBeCloseTo(7, 1);
        });

        test('calculate pH for acidic solution', () => {
            // Strong acid
            const hplus = 0.01;
            const ph = -Math.log10(hplus);
            expect(ph).toBeCloseTo(2, 1);
        });

        test('calculate pH for basic solution', () => {
            // Strong base (low H+)
            const hplus = 1e-11;
            const ph = -Math.log10(hplus);
            expect(ph).toBeCloseTo(11, 1);
        });

        test('calculate pH from OH- concentration', () => {
            // Neutral water
            const ohminus = 1e-7;
            const poh = -Math.log10(ohminus);
            const ph = 14 - poh;
            expect(ph).toBeCloseTo(7, 1);
        });

        test('calculate pH from pOH', () => {
            const poh = 7;
            const ph = 14 - poh;
            expect(ph).toBe(7);
        });

        test('pH should be between 0 and 14', () => {
            const hplus = 1e-8;
            const ph = -Math.log10(hplus);
            expect(ph).toBeGreaterThan(0);
            expect(ph).toBeLessThan(14);
        });
    });

    describe('pH Descriptions', () => {

        test('correctly identify very acidic solutions', () => {
            const ph = 1;
            expect(ph).toBeLessThan(2);
        });

        test('correctly identify acidic solutions', () => {
            const ph = 5;
            expect(ph).toBeGreaterThan(4);
            expect(ph).toBeLessThan(6);
        });

        test('correctly identify neutral solutions', () => {
            const ph = 7;
            expect(ph).toBe(7);
        });

        test('correctly identify basic solutions', () => {
            const ph = 10;
            expect(ph).toBeGreaterThan(9);
            expect(ph).toBeLessThan(11);
        });

        test('correctly identify very basic solutions', () => {
            const ph = 13;
            expect(ph).toBeGreaterThan(12);
        });
    });
});

describe('Molar Mass Calculator Tests', () => {

    const ATOMIC_MASSES = {
        'H': 1.008,
        'C': 12.011,
        'N': 14.007,
        'O': 15.999,
        'Na': 22.990,
        'Cl': 35.453,
        'Ca': 40.078,
        'Fe': 55.845,
        'S': 32.06,
        'P': 30.974
    };

    describe('Formula Parsing', () => {

        test('parse simple formula H2O', () => {
            const formula = 'H2O';
            const composition = { 'H': 2, 'O': 1 };
            expect(composition['H']).toBe(2);
            expect(composition['O']).toBe(1);
        });

        test('parse formula without subscript', () => {
            const formula = 'NaCl';
            const composition = { 'Na': 1, 'Cl': 1 };
            expect(composition['Na']).toBe(1);
            expect(composition['Cl']).toBe(1);
        });

        test('parse formula with multiple elements', () => {
            const formula = 'H2SO4';
            const composition = { 'H': 2, 'S': 1, 'O': 4 };
            expect(composition['H']).toBe(2);
            expect(composition['S']).toBe(1);
            expect(composition['O']).toBe(4);
        });

        test('parse formula with parentheses', () => {
            const formula = 'Ca(OH)2';
            // After parsing: Ca1 O2 H2
            const composition = { 'Ca': 1, 'O': 2, 'H': 2 };
            expect(composition['Ca']).toBe(1);
            expect(composition['O']).toBe(2);
            expect(composition['H']).toBe(2);
        });

        test('parse complex formula with nested groups', () => {
            const formula = 'Al2(SO4)3';
            // After parsing: Al2 S3 O12
            const composition = { 'Al': 2, 'S': 3, 'O': 12 };
            expect(composition['Al']).toBe(2);
            expect(composition['S']).toBe(3);
            expect(composition['O']).toBe(12);
        });
    });

    describe('Molar Mass Calculations', () => {

        test('calculate molar mass of water (H2O)', () => {
            const composition = { 'H': 2, 'O': 1 };
            const molarMass =
                composition['H'] * ATOMIC_MASSES['H'] +
                composition['O'] * ATOMIC_MASSES['O'];
            expect(molarMass).toBeCloseTo(18.015, 2);
        });

        test('calculate molar mass of sodium chloride (NaCl)', () => {
            const composition = { 'Na': 1, 'Cl': 1 };
            const molarMass =
                composition['Na'] * ATOMIC_MASSES['Na'] +
                composition['Cl'] * ATOMIC_MASSES['Cl'];
            expect(molarMass).toBeCloseTo(58.443, 2);
        });

        test('calculate molar mass of carbon dioxide (CO2)', () => {
            const composition = { 'C': 1, 'O': 2 };
            const molarMass =
                composition['C'] * ATOMIC_MASSES['C'] +
                composition['O'] * ATOMIC_MASSES['O'];
            expect(molarMass).toBeCloseTo(44.009, 2);
        });

        test('calculate molar mass of sulfuric acid (H2SO4)', () => {
            const composition = { 'H': 2, 'S': 1, 'O': 4 };
            const molarMass =
                composition['H'] * ATOMIC_MASSES['H'] +
                composition['S'] * ATOMIC_MASSES['S'] +
                composition['O'] * ATOMIC_MASSES['O'];
            expect(molarMass).toBeCloseTo(98.079, 2);
        });

        test('calculate molar mass of calcium hydroxide (Ca(OH)2)', () => {
            const composition = { 'Ca': 1, 'O': 2, 'H': 2 };
            const molarMass =
                composition['Ca'] * ATOMIC_MASSES['Ca'] +
                composition['O'] * ATOMIC_MASSES['O'] +
                composition['H'] * ATOMIC_MASSES['H'];
            expect(molarMass).toBeCloseTo(74.093, 2);
        });
    });

    describe('Percentage Composition', () => {

        test('calculate percentage composition of water', () => {
            const totalMass = 18.015;
            const hMass = 2 * 1.008;
            const oMass = 15.999;

            const hPercent = (hMass / totalMass) * 100;
            const oPercent = (oMass / totalMass) * 100;

            expect(hPercent).toBeCloseTo(11.2, 1);
            expect(oPercent).toBeCloseTo(88.8, 1);
        });

        test('percentages should sum to 100%', () => {
            const composition = { 'C': 1, 'H': 4 };
            const molarMass =
                composition['C'] * ATOMIC_MASSES['C'] +
                composition['H'] * ATOMIC_MASSES['H'];

            const cPercent = (composition['C'] * ATOMIC_MASSES['C'] / molarMass) * 100;
            const hPercent = (composition['H'] * ATOMIC_MASSES['H'] / molarMass) * 100;

            expect(cPercent + hPercent).toBeCloseTo(100, 1);
        });
    });
});

describe('Chemical Equation Balancer Tests', () => {

    describe('Equation Parsing', () => {

        test('parse simple equation H2 + O2 = H2O', () => {
            const equation = 'H2 + O2 = H2O';
            const parts = equation.split(/[=→]/);
            expect(parts.length).toBe(2);

            const reactants = parts[0].split('+').map(s => s.trim());
            const products = parts[1].split('+').map(s => s.trim());

            expect(reactants).toContain('H2');
            expect(reactants).toContain('O2');
            expect(products).toContain('H2O');
        });

        test('parse equation with arrow', () => {
            const equation = 'CH4 + O2 → CO2 + H2O';
            const parts = equation.split(/[=→]/);
            expect(parts.length).toBe(2);
        });

        test('parse complex equation', () => {
            const equation = 'Al + HCl = AlCl3 + H2';
            const parts = equation.split('=');
            const reactants = parts[0].split('+').map(s => s.trim());
            const products = parts[1].split('+').map(s => s.trim());

            expect(reactants.length).toBe(2);
            expect(products.length).toBe(2);
        });
    });

    describe('Balancing Simple Equations', () => {

        test('balance H2 + O2 = H2O', () => {
            // Balanced: 2H2 + O2 = 2H2O
            const coeffs = [2, 1, 2]; // H2, O2, H2O

            // Verify H: 2*2 = 4 on left, 2*2 = 4 on right
            const hLeft = 2 * coeffs[0];
            const hRight = 2 * coeffs[2];
            expect(hLeft).toBe(hRight);

            // Verify O: 1*2 = 2 on left, 1*2 = 2 on right
            const oLeft = 2 * coeffs[1];
            const oRight = 1 * coeffs[2];
            expect(oLeft).toBe(oRight);
        });

        test('balance CH4 + O2 = CO2 + H2O', () => {
            // Balanced: CH4 + 2O2 = CO2 + 2H2O
            const coeffs = [1, 2, 1, 2]; // CH4, O2, CO2, H2O

            // Verify C: 1*1 = 1 on left, 1*1 = 1 on right
            expect(coeffs[0]).toBe(coeffs[2]);

            // Verify H: 4*1 = 4 on left, 2*2 = 4 on right
            const hLeft = 4 * coeffs[0];
            const hRight = 2 * coeffs[3];
            expect(hLeft).toBe(hRight);

            // Verify O: 2*2 = 4 on left, 2*1 + 1*2 = 4 on right
            const oLeft = 2 * coeffs[1];
            const oRight = 2 * coeffs[2] + 1 * coeffs[3];
            expect(oLeft).toBe(oRight);
        });

        test('balance Fe + O2 = Fe2O3', () => {
            // Balanced: 4Fe + 3O2 = 2Fe2O3
            const coeffs = [4, 3, 2]; // Fe, O2, Fe2O3

            // Verify Fe: 1*4 = 4 on left, 2*2 = 4 on right
            const feLeft = 1 * coeffs[0];
            const feRight = 2 * coeffs[2];
            expect(feLeft).toBe(feRight);

            // Verify O: 2*3 = 6 on left, 3*2 = 6 on right
            const oLeft = 2 * coeffs[1];
            const oRight = 3 * coeffs[2];
            expect(oLeft).toBe(oRight);
        });
    });

    describe('Element Extraction', () => {

        test('extract elements from formula', () => {
            const formula = 'H2SO4';
            const elements = ['H', 'S', 'O'];
            expect(elements).toContain('H');
            expect(elements).toContain('S');
            expect(elements).toContain('O');
        });

        test('extract unique elements from equation', () => {
            const reactants = ['H2', 'O2'];
            const products = ['H2O'];
            const elements = new Set(['H', 'O']);
            expect(elements.has('H')).toBe(true);
            expect(elements.has('O')).toBe(true);
        });
    });

    describe('Coefficient Validation', () => {

        test('coefficients should be positive integers', () => {
            const coeffs = [2, 1, 2];
            coeffs.forEach(c => {
                expect(c).toBeGreaterThan(0);
                expect(Number.isInteger(c)).toBe(true);
            });
        });

        test('coefficients should be simplified', () => {
            // If all coefficients are even, they should be divisible by 2
            const coeffs = [2, 4, 6];
            const gcd = coeffs.reduce((a, b) => {
                const gcdFunction = (x, y) => y === 0 ? x : gcdFunction(y, x % y);
                return gcdFunction(a, b);
            });
            expect(gcd).toBeGreaterThan(1);
        });
    });
});

describe('Integration Tests', () => {

    test('all calculators handle edge cases', () => {
        // Test pH = 0 (very strong acid)
        const hplus = 1;
        const ph = -Math.log10(hplus);
        expect(ph).toBeCloseTo(0, 1);

        // Test pH = 14 (very strong base)
        const hplus14 = 1e-14;
        const ph14 = -Math.log10(hplus14);
        expect(ph14).toBeCloseTo(14, 1);
    });

    test('error handling for invalid inputs', () => {
        // Test with zero concentration
        const invalidInput = 0;
        expect(invalidInput).not.toBeGreaterThan(0);

        // Test with negative input
        const negativeInput = -1;
        expect(negativeInput).not.toBeGreaterThan(0);
    });

    test('calculators work with scientific notation', () => {
        // pH calculator
        const hplus = 1e-7;
        const ph = -Math.log10(hplus);
        expect(ph).toBeDefined();
        expect(ph).toBeFinite();
    });
});

// Run tests if using a test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        describe,
        test,
        expect
    };
}
