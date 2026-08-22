# Sprint 5: Calculator Ecosystem

**Goal**: Expand the interactive calculator suite with 3 new calculators, introduce a unit conversion framework, and add i18n support for calculator UI.

## Scope

### New Calculators (3)

- **Gasgesetz-Rechner** — Ideal gas law (PV=nRT) with unit selection, combined gas law variants
- **Verdünnungs-Rechner** — Dilution calculator (C1V1=C2V2), serial dilution, stock solution prep
- **Reaktionsausbeute-Rechner** — Percent yield, theoretical/actual yield, limiting reagent identification
- Each calculator: ChemistryCalculator subclass, Hugo page + layout, LazyLoader registration

### Unit Conversion Framework

- Create `static/js/utils/unit-converter.js` — reusable unit conversion library
- Supported dimensions: pressure (Pa, bar, atm, mmHg), volume (L, mL, m³), temperature (K, °C, °F), concentration (mol/L, g/L, ppm), mass (g, mg, kg)
- Auto-detect input unit, convert to SI for calculation, convert result back to selected unit
- Integration with existing calculators for unit-aware inputs

### Calculator i18n

- Create `static/js/i18n/calculators-de.json` — German UI labels, error messages, help texts for all calculators
- Add `data-i18n` attributes to calculator HTML templates
- i18n helper function in `chemistry-utils.js` or standalone

### Calculator Testing

- Jest test suite for unit conversions (edge cases: absolute zero, zero Kelvin)
- Jest test suite for each new calculator (known values against reference)
- Add calculator coverage report

## Success Criteria

- 3 new calculators render correctly, LazyLoader on-demand
- Unit converter handles all 5 dimensions with round-trip accuracy (tested)
- All calculator UI in German, no hardcoded English strings
- Tests pass for unit conversion edge cases
- Bundle stays under 50kB gzipped
