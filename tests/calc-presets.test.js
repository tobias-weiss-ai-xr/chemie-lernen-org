/**
 * Comprehensive Unit Tests for calc-presets.js
 * Tests presets/massPresets data integrity AND loadPreset/loadMassPreset DOM functions.
 *
 * Strategy: require() for exported data + eval patching for DOM functions.
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'myhugoapp/static/js/calculators/calc-presets.js');

// 1) Load exports for pure data tests
let presets, massPresets;
beforeAll(() => {
  const mod = require(SRC_PATH);
  presets = mod.presets;
  massPresets = mod.massPresets;
});

// 2) Also evaluate source to register DOM functions as globals
beforeEach(() => {
  const _code = fs.readFileSync(SRC_PATH, 'utf8');
  const _noExport = _code.replace(/if \(typeof module[^]+$/s, '');
  const _patched = _noExport.replace(/^function\s+(\w+)/gm, 'globalThis.$1 = function $1');
  (0, eval)(_patched);
});

describe('presets — data integrity', () => {
  test('exports 5 reaction presets', () => {
    expect(Object.keys(presets)).toHaveLength(5);
  });

  test('exports 5 mass presets', () => {
    expect(Object.keys(massPresets)).toHaveLength(5);
  });

  test('both objects have the same keys', () => {
    expect(Object.keys(presets).sort()).toEqual(Object.keys(massPresets).sort());
  });

  test('every preset has required fields with correct types', () => {
    Object.entries(presets).forEach(([_key, p]) => {
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.equation).toBe('string');
      expect(p.equation.length).toBeGreaterThan(0);
      expect(typeof p.v1).toBe('number');
      expect(typeof p.v2).toBe('number');
      expect(typeof p.example).toBe('number');
    });
  });

  test('every massPreset has required fields with correct types', () => {
    Object.entries(massPresets).forEach(([_key, p]) => {
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.v1).toBe('number');
      expect(typeof p.v2).toBe('number');
      expect(typeof p.m1).toBe('number');
      expect(typeof p.M1).toBe('number');
      expect(typeof p.M2).toBe('number');
    });
  });

  test('all coefficients are positive integers', () => {
    Object.values(presets).forEach((p) => {
      expect(p.v1).toBeGreaterThan(0);
      expect(Number.isInteger(p.v1)).toBe(true);
      expect(p.v2).toBeGreaterThan(0);
      expect(Number.isInteger(p.v2)).toBe(true);
      expect(p.example).toBeGreaterThan(0);
      expect(Number.isInteger(p.example)).toBe(true);
    });
  });

  test('massPresets v1/v2 match presets v1/v2', () => {
    Object.keys(presets).forEach((key) => {
      expect(massPresets[key].v1).toBe(presets[key].v1);
      expect(massPresets[key].v2).toBe(presets[key].v2);
    });
  });

  test('water: 2H₂ + O₂ → 2H₂O', () => {
    expect(presets.water.equation).toContain('2H2');
    expect(presets.water.v1).toBe(2);
    expect(presets.water.v2).toBe(2);
    expect(massPresets.water.M1).toBe(2);
    expect(massPresets.water.M2).toBe(18);
  });

  test('methane: CH₄ + 2O₂ → CO₂ + 2H₂O', () => {
    expect(presets.methane.v1).toBe(1);
    expect(presets.methane.v2).toBe(1);
    expect(massPresets.methane.m1).toBe(16);
    expect(massPresets.methane.M1).toBe(16);
  });

  test('ammonia (Haber): N₂ + 3H₂ → 2NH₃', () => {
    expect(presets.ammonia.v1).toBe(1);
    expect(presets.ammonia.v2).toBe(2);
    expect(massPresets.ammonia.m1).toBe(28);
    expect(massPresets.ammonia.M2).toBe(17);
  });

  test('sodium + water: 2Na + 2H₂O → 2NaOH + H₂', () => {
    expect(presets.sodium.v1).toBe(2);
    expect(presets.sodium.v2).toBe(2);
    expect(massPresets.sodium.M1).toBe(23);
    expect(massPresets.sodium.M2).toBe(40);
  });

  test('photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', () => {
    expect(presets.photosynthesis.v1).toBe(6);
    expect(presets.photosynthesis.v2).toBe(1);
    expect(massPresets.photosynthesis.m1).toBe(264);
    expect(massPresets.photosynthesis.M1).toBe(44);
  });

  test('mol-mol calculation with each preset gives positive finite result', () => {
    Object.values(presets).forEach((p) => {
      const n2 = p.example * (p.v2 / p.v1);
      expect(n2).toBeGreaterThan(0);
      expect(isFinite(n2)).toBe(true);
    });
  });

  test('mass equations are self-consistent', () => {
    // n1 = m1 / M1 should give a clean molar quantity
    Object.values(massPresets).forEach((p) => {
      const n1 = p.m1 / p.M1;
      expect(n1).toBeGreaterThan(0);
      expect(isFinite(n1)).toBe(true);
    });
  });
});

describe('loadPreset — DOM manipulation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="reaction-1" type="text" />
      <input id="mol-coeff-r" type="text" />
      <input id="mol-coeff-p" type="text" />
      <input id="mol-reactant" type="text" placeholder="" />
      <div id="mol-result" style="display:block"></div>
    `;
  });

  test('loads water preset into DOM elements', () => {
    loadPreset('water');

    expect(document.getElementById('reaction-1').value).toBe('2H2 + O2 -> 2H2O');
    expect(document.getElementById('mol-coeff-r').value).toBe('2');
    expect(document.getElementById('mol-coeff-p').value).toBe('2');
    expect(document.getElementById('mol-reactant').value).toBe('4');
    expect(document.getElementById('mol-reactant').placeholder).toBe('4');
    expect(document.getElementById('mol-result').style.display).toBe('none');
  });

  test('loads ammonia preset', () => {
    loadPreset('ammonia');

    expect(document.getElementById('reaction-1').value).toBe('N2 + 3H2 -> 2NH3');
    expect(document.getElementById('mol-coeff-r').value).toBe('1');
    expect(document.getElementById('mol-coeff-p').value).toBe('2');
    expect(document.getElementById('mol-reactant').value).toBe('3');
  });

  test('loads photosynthesis preset', () => {
    loadPreset('photosynthesis');

    expect(document.getElementById('mol-coeff-r').value).toBe('6');
    expect(document.getElementById('mol-coeff-p').value).toBe('1');
    expect(document.getElementById('mol-reactant').value).toBe('6');
  });

  test('early return for unknown preset key', () => {
    // Should not throw and not modify DOM
    loadPreset('nonexistent_key');
    expect(document.getElementById('reaction-1').value).toBe('');
  });

  test('loadPreset hides mol-result', () => {
    const result = document.getElementById('mol-result');
    result.style.display = 'block';
    loadPreset('methane');
    expect(result.style.display).toBe('none');
  });
});

describe('loadMassPreset — DOM manipulation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="mass-coeff-r" type="text" />
      <input id="mass-coeff-p" type="text" />
      <input id="mass-r" type="text" />
      <input id="mm-r" type="text" />
      <input id="mm-p" type="text" />
      <div id="mass-result" style="display:block"></div>
      <div id="mass-preview"></div>
    `;
  });

  test('loads water mass preset', () => {
    loadMassPreset('water');

    expect(document.getElementById('mass-coeff-r').value).toBe('2');
    expect(document.getElementById('mass-coeff-p').value).toBe('2');
    expect(document.getElementById('mass-r').value).toBe('4');
    expect(document.getElementById('mm-r').value).toBe('2');
    expect(document.getElementById('mm-p').value).toBe('18');
    expect(document.getElementById('mass-result').style.display).toBe('none');
    expect(document.getElementById('mass-preview').innerHTML).toContain('Gramm');
  });

  test('loads sodium mass preset', () => {
    loadMassPreset('sodium');

    expect(document.getElementById('mm-r').value).toBe('23');
    expect(document.getElementById('mm-p').value).toBe('40');
    expect(document.getElementById('mass-r').value).toBe('46');
  });

  test('loads ammonia mass preset', () => {
    loadMassPreset('ammonia');

    expect(document.getElementById('mass-coeff-r').value).toBe('1');
    expect(document.getElementById('mass-coeff-p').value).toBe('2');
    expect(document.getElementById('mm-r').value).toBe('28');
    expect(document.getElementById('mm-p').value).toBe('17');
  });

  test('loads photosynthesis mass preset', () => {
    loadMassPreset('photosynthesis');

    expect(document.getElementById('mass-coeff-r').value).toBe('6');
    expect(document.getElementById('mass-coeff-p').value).toBe('1');
    expect(document.getElementById('mm-r').value).toBe('44');
    expect(document.getElementById('mm-p').value).toBe('180');
  });

  test('loadMassPreset hides mass-result and sets preview', () => {
    const result = document.getElementById('mass-result');
    const preview = document.getElementById('mass-preview');
    result.style.display = 'block';
    preview.innerHTML = 'old';

    loadMassPreset('water');

    expect(result.style.display).toBe('none');
    expect(preview.innerHTML).toContain('--');
  });

  test('early return for unknown massPreset key', () => {
    loadMassPreset('nonexistent_key');
    expect(document.getElementById('mass-coeff-r').value).toBe('');
  });
});

// ── DOM-Flows (jsdom): loadPreset / loadMassPreset ────────────────────
const presetMod = require('../myhugoapp/static/js/calculators/calc-presets.js');
global.showToast = jest.fn();

describe('calc-presets — loadPreset / loadMassPreset', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<input id="reaction-1" /><input id="mol-coeff-r" /><input id="mol-coeff-p" />' +
      '<input id="mol-reactant" /><div id="mol-result" style="display:block" />' +
      '<input id="mass-coeff-r" /><input id="mass-coeff-p" /><input id="mass-r" />' +
      '<input id="mm-r" /><input id="mm-p" />' +
      '<div id="mass-result" style="display:block" /><div id="mass-preview"></div>';
  });

  test('loadPreset("water") füllt die Mol-Felder und verbirgt das Ergebnis', () => {
    presetMod.loadPreset('water');
    expect(document.getElementById('reaction-1').value).toBeTruthy();
    expect(document.getElementById('mol-coeff-r').value).not.toBe('');
    expect(document.getElementById('mol-result').style.display).toBe('none');
  });

  test('loadPreset("gibts-nicht") ist ein No-Op (kein Crash, Felder leer)', () => {
    presetMod.loadPreset('gibts-nicht');
    expect(document.getElementById('reaction-1').value).toBe('');
  });

  test('loadMassPreset("methane") füllt die Massenfelder und verbirgt das Ergebnis', () => {
    presetMod.loadMassPreset('methane');
    expect(document.getElementById('mass-coeff-r').value).not.toBe('');
    expect(document.getElementById('mm-r').value).not.toBe('');
    expect(document.getElementById('mass-result').style.display).toBe('none');
    expect(document.getElementById('mass-preview').innerHTML).not.toBe('');
  });
});
