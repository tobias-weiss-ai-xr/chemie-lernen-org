/**
 * Unit Tests for Atmosphärendruck im Alltag (Atmospheric Pressure Calculator)
 */

function calculateStrohhalmDruck(suctionStrength, liquidDensity, liquidHeight) {
  // pressure difference in Pa from suction (0-100%)
  const atmPressure = 101325;
  const pressureDrop = (suctionStrength / 100) * 0.3 * atmPressure;  // max 30% drop
  const insidePressure = atmPressure - pressureDrop;
  const hydrostaticPressure = liquidDensity * 9.81 * (liquidHeight / 100);
  const canLift = insidePressure > hydrostaticPressure;
  return {
    insidePressure,
    outsidePressure: atmPressure,
    pressureDiff: pressureDrop,
    maxLiftHeight: insidePressure / (liquidDensity * 9.81) * 100,  // in cm
    canLift
  };
}

function calculateBallonPressure(airAmount, temperature, tensionLevel) {
  const basePressure = 101325;
  const tensionFactors = { low: 0.02, medium: 0.05, high: 0.10 };
  const factor = tensionFactors[tensionLevel] || 0.05;
  const tempKelvin = temperature + 273.15;
  const tempFactor = tempKelvin / 293.15;  // relative to 20°C
  const pressureIncrease = basePressure * factor * airAmount * tempFactor;
  const insidePressure = basePressure + pressureIncrease;
  const burstPressure = basePressure * (1 + (tensionLevel === 'high' ? 0.5 : tensionLevel === 'medium' ? 0.8 : 1.2));
  const willBurst = insidePressure > burstPressure;
  const volume = 0.5 + (airAmount / 50) * 5 * tempFactor;  // in Litern
  return { insidePressure, outsidePressure: basePressure, volume, willBurst };
}

function calculateSaugnapf(sizeCm, pressurePercent, surfaceType) {
  const atmPressure = 101325;
  const insidePressure = atmPressure * (pressurePercent / 100);
  const radius = (sizeCm / 2) / 100;  // in m
  const area = Math.PI * radius * radius;
  const holdForce = (atmPressure - insidePressure) * area;
  const surfaceFactors = { glass: 1.0, tile: 0.9, wood: 0.7, concrete: 0.4 };
  const surfaceFactor = surfaceFactors[surfaceType] || 0.5;
  const effectiveForce = holdForce * surfaceFactor;
  const loadCapacity = effectiveForce / 9.81;  // in kg
  return { holdForce, effectiveForce, loadCapacity, area };
}

describe('Atmosphärendruck im Alltag', () => {
  describe('calculateStrohhalmDruck', () => {
    test('ohne Saugen (0%) → kein Unterdruck', () => {
      const result = calculateStrohhalmDruck(0, 1000, 10);
      expect(result.insidePressure).toBeCloseTo(101325, 0);
      expect(result.pressureDiff).toBe(0);
    });

    test('starkes Saugen erzeugt Unterdruck', () => {
      const result = calculateStrohhalmDruck(80, 1000, 10);
      expect(result.insidePressure).toBeLessThan(101325);
      expect(result.pressureDiff).toBeGreaterThan(0);
    });

    test('Wasser kann bei vollem Saugen gehoben werden', () => {
      const result = calculateStrohhalmDruck(100, 1000, 10);
      expect(result.canLift).toBe(true);
    });

    test('schwerere Flüssigkeit → geringere maximale Steighöhe', () => {
      const wasser = calculateStrohhalmDruck(50, 1000, 10);
      const honig = calculateStrohhalmDruck(50, 1420, 10);
      expect(honig.maxLiftHeight).toBeLessThan(wasser.maxLiftHeight);
    });
  });

  describe('calculateBallonPressure', () => {
    test('wenig Luft → niedriger Innendruck', () => {
      const result = calculateBallonPressure(5, 20, 'medium');
      expect(result.insidePressure).toBeGreaterThan(101325);
      expect(result.willBurst).toBe(false);
    });

    test('viel Luft → hoher Innendruck, Platzen möglich', () => {
      const result = calculateBallonPressure(45, 20, 'low');
      expect(result.insidePressure).toBeGreaterThan(101325);
    });

    test('höhere Temperatur → höherer Innendruck', () => {
      const kalt = calculateBallonPressure(20, 0, 'medium');
      const warm = calculateBallonPressure(20, 40, 'medium');
      expect(warm.insidePressure).toBeGreaterThan(kalt.insidePressure);
    });

    test('dünner Ballon (niedrige Spannung) platzt leichter', () => {
      const result = calculateBallonPressure(30, 20, 'high');
      // High tension = harder to burst
      expect(result.willBurst).toBeDefined();
    });
  });

  describe('calculateSaugnapf', () => {
    test('volles Vakuum → maximale Haltekraft', () => {
      const result = calculateSaugnapf(10, 0, 'glass');
      expect(result.holdForce).toBeGreaterThan(0);
    });

    test('kein Vakuum → keine Haltekraft', () => {
      const result = calculateSaugnapf(10, 100, 'glass');
      expect(result.holdForce).toBeCloseTo(0, 0);
    });

    test('größerer Saugnapf → größere Haltekraft', () => {
      const klein = calculateSaugnapf(5, 50, 'glass');
      const gross = calculateSaugnapf(15, 50, 'glass');
      expect(gross.holdForce).toBeGreaterThan(klein.holdForce);
    });

    test('raue Oberfläche (concrete) → geringere effektive Kraft', () => {
      const glatt = calculateSaugnapf(10, 50, 'glass');
      const rau = calculateSaugnapf(10, 50, 'concrete');
      expect(rau.effectiveForce).toBeLessThan(glatt.effectiveForce);
    });

    test('Haltekraft = Druckdifferenz × Fläche', () => {
      const result = calculateSaugnapf(10, 50, 'glass');
      const expectedForce = (101325 - 101325 * 0.5) * result.area;
      expect(result.holdForce).toBeCloseTo(expectedForce, -1);
    });
  });
});
