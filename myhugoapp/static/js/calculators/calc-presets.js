// Preset reactions data
const presets = {
  water: {
    name: 'Wasserbildung',
    equation: '2H2 + O2 -> 2H2O',
    v1: 2,
    v2: 2,
    example: 4
  },
  methane: {
    name: 'Methan-Verbrennung',
    equation: 'CH4 + 2O2 -> CO2 + 2H2O',
    v1: 1,
    v2: 1,
    example: 2
  },
  ammonia: {
    name: 'Haber-Verfahren (Ammoniak)',
    equation: 'N2 + 3H2 -> 2NH3',
    v1: 1,
    v2: 2,
    example: 3
  },
  sodium: {
    name: 'Natrium + Wasser',
    equation: '2Na + 2H2O -> 2NaOH + H2',
    v1: 2,
    v2: 2,
    example: 4
  },
  photosynthesis: {
    name: 'Fotosynthese',
    equation: '6CO2 + 6H2O -> C6H12O6 + 6O2',
    v1: 6,
    v2: 1,
    example: 6
  }
};

const massPresets = {
  water: {
    name: 'Wasserbildung',
    v1: 2,
    v2: 2,
    m1: 4,
    M1: 2,
    M2: 18
  },
  methane: {
    name: 'Methan-Verbrennung',
    v1: 1,
    v2: 1,
    m1: 16,
    M1: 16,
    M2: 44
  },
  ammonia: {
    name: 'Haber-Verfahren',
    v1: 1,
    v2: 2,
    m1: 28,
    M1: 28,
    M2: 17
  },
  sodium: {
    name: 'Natrium + Wasser',
    v1: 2,
    v2: 2,
    m1: 46,
    M1: 23,
    M2: 40
  },
  photosynthesis: {
    name: 'Fotosynthese',
    v1: 6,
    v2: 1,
    m1: 264,
    M1: 44,
    M2: 180
  }
};


function loadPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) {return;}

  document.getElementById('reaction-1').value = preset.equation;
  document.getElementById('mol-coeff-r').value = preset.v1;
  document.getElementById('mol-coeff-p').value = preset.v2;
  document.getElementById('mol-reactant').value = preset.example;
  document.getElementById('mol-reactant').placeholder = preset.example;

  document.getElementById('mol-result').style.display = 'none';
}


function loadMassPreset(presetKey) {
  const preset = massPresets[presetKey];
  if (!preset) {return;}

  document.getElementById('mass-coeff-r').value = preset.v1;
  document.getElementById('mass-coeff-p').value = preset.v2;
  document.getElementById('mass-r').value = preset.m1;
  document.getElementById('mm-r').value = preset.M1;
  document.getElementById('mm-p').value = preset.M2;

  document.getElementById('mass-result').style.display = 'none';
  document.getElementById('mass-preview').innerHTML = '<p style="font-size:2em; color:#007bff;">--</p><p>Gramm</p>';
}
