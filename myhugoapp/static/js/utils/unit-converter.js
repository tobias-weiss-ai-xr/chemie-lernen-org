/**
 * UnitConverter — Chemistry unit conversion utility
 * Supports 5 dimensions: pressure, volume, temperature, concentration, mass
 * Dual module/global pattern for Node.js tests and browser usage
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Conversion maps — each dimension maps unit keys to their SI base value
  // ---------------------------------------------------------------------------

  /** pressure: base unit = Pa (Pascal) */
  var PRESSURE = {
    Pa: 1,
    kPa: 1e3,
    bar: 1e5,
    atm: 101325,
    mmHg: 133.322,
    psi: 6894.76,
  };

  /** volume: base unit = L (liter) */
  var VOLUME = {
    L: 1,
    mL: 1e-3,
    'm³': 1e3,
    gal: 3.78541,
  };

  /** temperature: base unit = K (Kelvin) — uses functions, not scalars */
  var TEMPERATURE = {
    K: {
      toBase: function (v) {
        return v;
      },
      fromBase: function (v) {
        return v;
      },
    },
    '°C': {
      toBase: function (v) {
        return v + 273.15;
      },
      fromBase: function (v) {
        return v - 273.15;
      },
    },
    '°F': {
      toBase: function (v) {
        return ((v - 32) * 5) / 9 + 273.15;
      },
      fromBase: function (v) {
        return ((v - 273.15) * 9) / 5 + 32;
      },
    },
  };

  /** concentration: base unit = mol/L (molar) */
  var CONCENTRATION = {
    M: 1,
    mM: 1e-3,
    'mol/L': 1,
    'g/L': null, // requires molar mass; handled by detectUnit and convert
    'mg/mL': null,
    '%': null,
  };

  /** mass: base unit = g (gram) */
  var MASS = {
    g: 1,
    kg: 1e3,
    mg: 1e-3,
    lb: 453.592,
    oz: 28.3495,
  };

  // ---------------------------------------------------------------------------
  // Dimension registry
  // ---------------------------------------------------------------------------

  var DIMENSIONS = {
    pressure: { units: PRESSURE, base: 'Pa', label: 'Druck' },
    volume: { units: VOLUME, base: 'L', label: 'Volumen' },
    temperature: { units: TEMPERATURE, base: 'K', label: 'Temperatur' },
    concentration: { units: CONCENTRATION, base: 'mol/L', label: 'Konzentration' },
    mass: { units: MASS, base: 'g', label: 'Masse' },
  };

  // ---------------------------------------------------------------------------
  // Unit pattern database for detectUnit(string)
  // ---------------------------------------------------------------------------

  var UNIT_PATTERNS = [
    // pressure
    { pattern: /^Pa$/i, dimension: 'pressure', unit: 'Pa' },
    { pattern: /^kPa$/i, dimension: 'pressure', unit: 'kPa' },
    { pattern: /^bar$/i, dimension: 'pressure', unit: 'bar' },
    { pattern: /^atm$/i, dimension: 'pressure', unit: 'atm' },
    { pattern: /^mmHg$/i, dimension: 'pressure', unit: 'mmHg' },
    { pattern: /^mm[- ]?Hg$/i, dimension: 'pressure', unit: 'mmHg' },
    { pattern: /^psi$/i, dimension: 'pressure', unit: 'psi' },
    // volume
    { pattern: /^L$/i, dimension: 'volume', unit: 'L' },
    { pattern: /^l(?:iter)?$/i, dimension: 'volume', unit: 'L' },
    { pattern: /^mL$/i, dimension: 'volume', unit: 'mL' },
    { pattern: /^ml$/i, dimension: 'volume', unit: 'mL' },
    { pattern: /^m³$/i, dimension: 'volume', unit: 'm³' },
    { pattern: /^m3$/i, dimension: 'volume', unit: 'm³' },
    { pattern: /^gal(?:lon)?$/i, dimension: 'volume', unit: 'gal' },
    // temperature
    { pattern: /^K$/i, dimension: 'temperature', unit: 'K' },
    { pattern: /^°?C$/i, dimension: 'temperature', unit: '°C' },
    { pattern: /^°?F$/i, dimension: 'temperature', unit: '°F' },
    { pattern: /^Celsius$/i, dimension: 'temperature', unit: '°C' },
    { pattern: /^Fahrenheit$/i, dimension: 'temperature', unit: '°F' },
    { pattern: /^Kelvin$/i, dimension: 'temperature', unit: 'K' },
    // concentration
    { pattern: /^M(?:ol\/L)?$/i, dimension: 'concentration', unit: 'M' },
    { pattern: /^mM$/i, dimension: 'concentration', unit: 'mM' },
    { pattern: /^mol\/L$/i, dimension: 'concentration', unit: 'mol/L' },
    { pattern: /^g\/L$/i, dimension: 'concentration', unit: 'g/L' },
    { pattern: /^mg\/mL$/i, dimension: 'concentration', unit: 'mg/mL' },
    { pattern: /^%$/i, dimension: 'concentration', unit: '%' },
    // mass
    { pattern: /^g$/i, dimension: 'mass', unit: 'g' },
    { pattern: /^kg$/i, dimension: 'mass', unit: 'kg' },
    { pattern: /^mg$/i, dimension: 'mass', unit: 'mg' },
    { pattern: /^lb$/i, dimension: 'mass', unit: 'lb' },
    { pattern: /^oz$/i, dimension: 'mass', unit: 'oz' },
  ];

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------

  function getDimension(name) {
    var dim = DIMENSIONS[name];
    if (!dim) throw new Error('Unbekannte Dimension: ' + name);
    return dim;
  }

  // ---------------------------------------------------------------------------
  // UnitConverter
  // ---------------------------------------------------------------------------

  var UnitConverter = {
    /**
     * Convert value between two units in the same dimension.
     * @param {number} value
     * @param {string} fromUnit  — unit key (e.g. 'Pa', '°C', 'M')
     * @param {string} toUnit    — target unit key
     * @param {string} dimension — 'pressure' | 'volume' | 'temperature' | 'concentration' | 'mass'
     * @returns {number} converted value
     */
    convert: function (value, fromUnit, toUnit, dimension) {
      if (typeof value !== 'number' || !isFinite(value)) {
        throw new Error('Ungültiger Wert: ' + value);
      }

      var dim = getDimension(dimension);
      var units = dim.units;

      // Same unit — identity
      if (fromUnit === toUnit) return value;

      var fromEntry = units[fromUnit];
      var toEntry = units[toUnit];
      if (fromEntry === undefined || toEntry === undefined) {
        throw new Error('Unbekannte Einheit in Dimension ' + dimension);
      }

      // Temperature uses functions; everything else uses scalar factors
      if (dimension === 'temperature') {
        var inBase = fromEntry.toBase(value);
        return toEntry.fromBase(inBase);
      }

      // Scalar conversion: value -> base -> target
      var baseValue = value * fromEntry;
      return baseValue / toEntry;
    },

    /**
     * Try to parse a string like "100 g/L" or "25°C" into { value, unit, dimension }.
     * Returns null if parsing fails.
     * @param {string} str
     * @returns {{ value: number, unit: string, dimension: string } | null}
     */
    detectUnit: function (str) {
      if (typeof str !== 'string') return null;

      str = str.trim();
      if (str.length === 0) return null;

      // Split into number part and unit part at the first space or non-digit boundary
      var splitIdx = str.search(/\s/);
      var numStr, unitStr;
      if (splitIdx === -1) {
        // No whitespace — find transition from digit/decimal to alpha/unit chars
        var m = str.match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:[eE][+-]?\d+)?)(.*)$/);
        if (!m) return null;
        numStr = m[1];
        unitStr = m[2].trim();
      } else {
        numStr = str.substring(0, splitIdx);
        unitStr = str.substring(splitIdx + 1).trim();
      }

      // Normalize decimal comma → dot
      var valueStr = numStr.replace(',', '.');
      var value = parseFloat(valueStr);
      if (isNaN(value)) return null;

      // Search pattern database
      for (var i = 0; i < UNIT_PATTERNS.length; i++) {
        var entry = UNIT_PATTERNS[i];
        if (entry.pattern.test(unitStr)) {
          return { value: value, unit: entry.unit, dimension: entry.dimension };
        }
      }

      return null;
    },

    /**
     * List all available units for a dimension.
     * @param {string} dimension
     * @returns {Array<{ unit: string, label: string }>}
     */
    getAvailableUnits: function (dimension) {
      var dim = getDimension(dimension);
      var unitKeys = Object.keys(dim.units);
      return unitKeys.map(function (u) {
        return { unit: u, label: u };
      });
    },

    /**
     * Check whether two units belong to the same dimension.
     * @param {string} unitA
     * @param {string} unitB
     * @returns {boolean}
     */
    sameDimension: function (unitA, unitB) {
      for (var dimName in DIMENSIONS) {
        if (Object.prototype.hasOwnProperty.call(DIMENSIONS, dimName)) {
          var units = DIMENSIONS[dimName].units;
          if (
            Object.prototype.hasOwnProperty.call(units, unitA) &&
            Object.prototype.hasOwnProperty.call(units, unitB)
          ) {
            return true;
          }
        }
      }
      return false;
    },

    /**
     * List all supported dimensions.
     * @returns {Array<{ name: string, label: string, baseUnit: string }>}
     */
    getDimensions: function () {
      var result = [];
      for (var name in DIMENSIONS) {
        if (Object.prototype.hasOwnProperty.call(DIMENSIONS, name)) {
          var d = DIMENSIONS[name];
          result.push({ name: name, label: d.label, baseUnit: d.base });
        }
      }
      return result;
    },
  };

  // ---------------------------------------------------------------------------
  // Exports (dual pattern)
  // ---------------------------------------------------------------------------

  // Node.js / CommonJS (Jest tests)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitConverter;
  }

  // Browser global
  if (typeof window !== 'undefined') {
    window.UnitConverter = UnitConverter;
  }
})();
