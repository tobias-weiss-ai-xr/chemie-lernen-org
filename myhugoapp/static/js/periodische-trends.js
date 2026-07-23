const elementTrendData = {
  H: {
    z: 1,
    period: 1,
    group: 1,
    name: 'Wasserstoff',
    mass: 1.008,
    radius: 53,
    ionization: 1312,
    electronegativity: 2.2,
    block: 's',
  },
  He: {
    z: 2,
    period: 1,
    group: 18,
    name: 'Helium',
    mass: 4.003,
    radius: 31,
    ionization: 2372,
    electronegativity: 0,
    block: 'p',
  },
  Li: {
    z: 3,
    period: 2,
    group: 1,
    name: 'Lithium',
    mass: 6.941,
    radius: 152,
    ionization: 520,
    electronegativity: 0.98,
    block: 's',
  },
  Be: {
    z: 4,
    period: 2,
    group: 2,
    name: 'Beryllium',
    mass: 9.012,
    radius: 112,
    ionization: 899,
    electronegativity: 1.57,
    block: 's',
  },
  B: {
    z: 5,
    period: 2,
    group: 13,
    name: 'Bor',
    mass: 10.81,
    radius: 85,
    ionization: 801,
    electronegativity: 2.04,
    block: 'p',
  },
  C: {
    z: 6,
    period: 2,
    group: 14,
    name: 'Kohlenstoff',
    mass: 12.011,
    radius: 70,
    ionization: 1086,
    electronegativity: 2.55,
    block: 'p',
  },
  N: {
    z: 7,
    period: 2,
    group: 15,
    name: 'Stickstoff',
    mass: 14.007,
    radius: 65,
    ionization: 1402,
    electronegativity: 3.04,
    block: 'p',
  },
  O: {
    z: 8,
    period: 2,
    group: 16,
    name: 'Sauerstoff',
    mass: 15.999,
    radius: 60,
    ionization: 1314,
    electronegativity: 3.44,
    block: 'p',
  },
  F: {
    z: 9,
    period: 2,
    group: 17,
    name: 'Fluor',
    mass: 18.998,
    radius: 50,
    ionization: 1681,
    electronegativity: 3.98,
    block: 'p',
  },
  Ne: {
    z: 10,
    period: 2,
    group: 18,
    name: 'Neon',
    mass: 20.18,
    radius: 38,
    ionization: 2081,
    electronegativity: 0,
    block: 'p',
  },
  Na: {
    z: 11,
    period: 3,
    group: 1,
    name: 'Natrium',
    mass: 22.99,
    radius: 186,
    ionization: 496,
    electronegativity: 0.93,
    block: 's',
  },
  Mg: {
    z: 12,
    period: 3,
    group: 2,
    name: 'Magnesium',
    mass: 24.305,
    radius: 145,
    ionization: 738,
    electronegativity: 1.31,
    block: 's',
  },
  Al: {
    z: 13,
    period: 3,
    group: 13,
    name: 'Aluminium',
    mass: 26.982,
    radius: 118,
    ionization: 578,
    electronegativity: 1.61,
    block: 'p',
  },
  Si: {
    z: 14,
    period: 3,
    group: 14,
    name: 'Silizium',
    mass: 28.086,
    radius: 111,
    ionization: 787,
    electronegativity: 1.9,
    block: 'p',
  },
  P: {
    z: 15,
    period: 3,
    group: 15,
    name: 'Phosphor',
    mass: 30.974,
    radius: 98,
    ionization: 1012,
    electronegativity: 2.19,
    block: 'p',
  },
  S: {
    z: 16,
    period: 3,
    group: 16,
    name: 'Schwefel',
    mass: 32.065,
    radius: 88,
    ionization: 1000,
    electronegativity: 2.58,
    block: 'p',
  },
  Cl: {
    z: 17,
    period: 3,
    group: 17,
    name: 'Chlor',
    mass: 35.453,
    radius: 79,
    ionization: 1251,
    electronegativity: 3.16,
    block: 'p',
  },
  Ar: {
    z: 18,
    period: 3,
    group: 18,
    name: 'Argon',
    mass: 39.948,
    radius: 71,
    ionization: 1521,
    electronegativity: 0,
    block: 'p',
  },
  K: {
    z: 19,
    period: 4,
    group: 1,
    name: 'Kalium',
    mass: 39.098,
    radius: 227,
    ionization: 419,
    electronegativity: 0.82,
    block: 's',
  },
  Ca: {
    z: 20,
    period: 4,
    group: 2,
    name: 'Calcium',
    mass: 40.078,
    radius: 197,
    ionization: 590,
    electronegativity: 1.0,
    block: 's',
  },
  Sc: {
    z: 21,
    period: 4,
    group: 3,
    name: 'Scandium',
    mass: 44.956,
    radius: 162,
    ionization: 631,
    electronegativity: 1.36,
    block: 'd',
  },
  Ti: {
    z: 22,
    period: 4,
    group: 4,
    name: 'Titan',
    mass: 47.867,
    radius: 147,
    ionization: 658,
    electronegativity: 1.54,
    block: 'd',
  },
  V: {
    z: 23,
    period: 4,
    group: 5,
    name: 'Vanadium',
    mass: 50.942,
    radius: 134,
    ionization: 650,
    electronegativity: 1.63,
    block: 'd',
  },
  Cr: {
    z: 24,
    period: 4,
    group: 6,
    name: 'Chrom',
    mass: 51.996,
    radius: 128,
    ionization: 653,
    electronegativity: 1.66,
    block: 'd',
  },
  Mn: {
    z: 25,
    period: 4,
    group: 7,
    name: 'Mangan',
    mass: 54.938,
    radius: 127,
    ionization: 717,
    electronegativity: 1.55,
    block: 'd',
  },
  Fe: {
    z: 26,
    period: 4,
    group: 8,
    name: 'Eisen',
    mass: 55.845,
    radius: 126,
    ionization: 759,
    electronegativity: 1.83,
    block: 'd',
  },
  Co: {
    z: 27,
    period: 4,
    group: 9,
    name: 'Cobalt',
    mass: 58.933,
    radius: 125,
    ionization: 758,
    electronegativity: 1.88,
    block: 'd',
  },
  Ni: {
    z: 28,
    period: 4,
    group: 10,
    name: 'Nickel',
    mass: 58.693,
    radius: 124,
    ionization: 737,
    electronegativity: 1.91,
    block: 'd',
  },
  Cu: {
    z: 29,
    period: 4,
    group: 11,
    name: 'Kupfer',
    mass: 63.546,
    radius: 128,
    ionization: 745,
    electronegativity: 1.9,
    block: 'd',
  },
  Zn: {
    z: 30,
    period: 4,
    group: 12,
    name: 'Zink',
    mass: 65.38,
    radius: 134,
    ionization: 906,
    electronegativity: 1.65,
    block: 'd',
  },
  Ga: {
    z: 31,
    period: 4,
    group: 13,
    name: 'Gallium',
    mass: 69.723,
    radius: 122,
    ionization: 579,
    electronegativity: 1.81,
    block: 'p',
  },
  Ge: {
    z: 32,
    period: 4,
    group: 14,
    name: 'Germanium',
    mass: 72.63,
    radius: 122,
    ionization: 762,
    electronegativity: 2.01,
    block: 'p',
  },
  As: {
    z: 33,
    period: 4,
    group: 15,
    name: 'Arsen',
    mass: 74.922,
    radius: 119,
    ionization: 947,
    electronegativity: 2.18,
    block: 'p',
  },
  Se: {
    z: 34,
    period: 4,
    group: 16,
    name: 'Selen',
    mass: 78.96,
    radius: 116,
    ionization: 941,
    electronegativity: 2.55,
    block: 'p',
  },
  Br: {
    z: 35,
    period: 4,
    group: 17,
    name: 'Brom',
    mass: 79.904,
    radius: 114,
    ionization: 1140,
    electronegativity: 2.96,
    block: 'p',
  },
  Kr: {
    z: 36,
    period: 4,
    group: 18,
    name: 'Krypton',
    mass: 83.798,
    radius: 112,
    ionization: 1351,
    electronegativity: 3.0,
    block: 'p',
  },
  Rb: {
    z: 37,
    period: 5,
    group: 1,
    name: 'Rubidium',
    mass: 85.468,
    radius: 248,
    ionization: 403,
    electronegativity: 0.82,
    block: 's',
  },
  Sr: {
    z: 38,
    period: 5,
    group: 2,
    name: 'Strontium',
    mass: 87.62,
    radius: 215,
    ionization: 550,
    electronegativity: 0.95,
    block: 's',
  },
  Y: {
    z: 39,
    period: 5,
    group: 3,
    name: 'Yttrium',
    mass: 88.906,
    radius: 180,
    ionization: 600,
    electronegativity: 1.22,
    block: 'd',
  },
  Zr: {
    z: 40,
    period: 5,
    group: 4,
    name: 'Zirconium',
    mass: 91.224,
    radius: 160,
    ionization: 640,
    electronegativity: 1.33,
    block: 'd',
  },
  Nb: {
    z: 41,
    period: 5,
    group: 5,
    name: 'Niob',
    mass: 92.906,
    radius: 146,
    ionization: 652,
    electronegativity: 1.6,
    block: 'd',
  },
  Mo: {
    z: 42,
    period: 5,
    group: 6,
    name: 'Molybdän',
    mass: 95.96,
    radius: 139,
    ionization: 684,
    electronegativity: 2.16,
    block: 'd',
  },
  Tc: {
    z: 43,
    period: 5,
    group: 7,
    name: 'Technetium',
    mass: 98.0,
    radius: 136,
    ionization: 702,
    electronegativity: 1.9,
    block: 'd',
  },
  Ru: {
    z: 44,
    period: 5,
    group: 8,
    name: 'Ruthenium',
    mass: 101.07,
    radius: 134,
    ionization: 710,
    electronegativity: 2.2,
    block: 'd',
  },
  Rh: {
    z: 45,
    period: 5,
    group: 9,
    name: 'Rhodium',
    mass: 102.906,
    radius: 134,
    ionization: 720,
    electronegativity: 2.28,
    block: 'd',
  },
  Pd: {
    z: 46,
    period: 5,
    group: 10,
    name: 'Palladium',
    mass: 106.42,
    radius: 137,
    ionization: 804,
    electronegativity: 2.2,
    block: 'd',
  },
  Ag: {
    z: 47,
    period: 5,
    group: 11,
    name: 'Silber',
    mass: 107.868,
    radius: 144,
    ionization: 731,
    electronegativity: 1.93,
    block: 'd',
  },
  Cd: {
    z: 48,
    period: 5,
    group: 12,
    name: 'Cadmium',
    mass: 112.411,
    radius: 149,
    ionization: 868,
    electronegativity: 1.69,
    block: 'd',
  },
  In: {
    z: 49,
    period: 5,
    group: 13,
    name: 'Indium',
    mass: 114.818,
    radius: 142,
    ionization: 558,
    electronegativity: 1.78,
    block: 'p',
  },
  Sn: {
    z: 50,
    period: 5,
    group: 14,
    name: 'Zinn',
    mass: 118.71,
    radius: 140,
    ionization: 709,
    electronegativity: 1.96,
    block: 'p',
  },
  Sb: {
    z: 51,
    period: 5,
    group: 15,
    name: 'Antimon',
    mass: 121.76,
    radius: 140,
    ionization: 834,
    electronegativity: 2.05,
    block: 'p',
  },
  Te: {
    z: 52,
    period: 5,
    group: 16,
    name: 'Tellur',
    mass: 127.6,
    radius: 138,
    ionization: 869,
    electronegativity: 2.1,
    block: 'p',
  },
  I: {
    z: 53,
    period: 5,
    group: 17,
    name: 'Iod',
    mass: 126.904,
    radius: 133,
    ionization: 1008,
    electronegativity: 2.66,
    block: 'p',
  },
  Xe: {
    z: 54,
    period: 5,
    group: 18,
    name: 'Xenon',
    mass: 131.293,
    radius: 130,
    ionization: 1170,
    electronegativity: 2.6,
    block: 'p',
  },
  Cs: {
    z: 55,
    period: 6,
    group: 1,
    name: 'Caesium',
    mass: 132.905,
    radius: 265,
    ionization: 376,
    electronegativity: 0.79,
    block: 's',
  },
  Ba: {
    z: 56,
    period: 6,
    group: 2,
    name: 'Barium',
    mass: 137.327,
    radius: 222,
    ionization: 503,
    electronegativity: 0.89,
    block: 's',
  },
  La: {
    z: 57,
    period: 8,
    group: 3,
    name: 'Lanthan',
    mass: 138.905,
    radius: 187,
    ionization: 538,
    electronegativity: 1.1,
    block: 'f',
  },
  Ce: {
    z: 58,
    period: 8,
    group: 4,
    name: 'Cer',
    mass: 140.116,
    radius: 182,
    ionization: 534,
    electronegativity: 1.12,
    block: 'f',
  },
  Pr: {
    z: 59,
    period: 8,
    group: 5,
    name: 'Praseodym',
    mass: 140.908,
    radius: 182,
    ionization: 527,
    electronegativity: 1.13,
    block: 'f',
  },
  Nd: {
    z: 60,
    period: 8,
    group: 6,
    name: 'Neodym',
    mass: 144.243,
    radius: 181,
    ionization: 533,
    electronegativity: 1.14,
    block: 'f',
  },
  Pm: {
    z: 61,
    period: 8,
    group: 7,
    name: 'Promethium',
    mass: 145.0,
    radius: 181,
    ionization: 538,
    electronegativity: 1.13,
    block: 'f',
  },
  Sm: {
    z: 62,
    period: 8,
    group: 8,
    name: 'Samarium',
    mass: 150.362,
    radius: 180,
    ionization: 544,
    electronegativity: 1.17,
    block: 'f',
  },
  Eu: {
    z: 63,
    period: 8,
    group: 9,
    name: 'Europium',
    mass: 151.964,
    radius: 199,
    ionization: 547,
    electronegativity: 1.1,
    block: 'f',
  },
  Gd: {
    z: 64,
    period: 8,
    group: 10,
    name: 'Gadolinium',
    mass: 157.25,
    radius: 179,
    ionization: 593,
    electronegativity: 1.2,
    block: 'f',
  },
  Tb: {
    z: 65,
    period: 8,
    group: 11,
    name: 'Terbium',
    mass: 158.925,
    radius: 177,
    ionization: 565,
    electronegativity: 1.22,
    block: 'f',
  },
  Dy: {
    z: 66,
    period: 8,
    group: 12,
    name: 'Dysprosium',
    mass: 162.5,
    radius: 178,
    ionization: 573,
    electronegativity: 1.23,
    block: 'f',
  },
  Ho: {
    z: 67,
    period: 8,
    group: 13,
    name: 'Holmium',
    mass: 164.93,
    radius: 176,
    ionization: 581,
    electronegativity: 1.24,
    block: 'f',
  },
  Er: {
    z: 68,
    period: 8,
    group: 14,
    name: 'Erbium',
    mass: 167.259,
    radius: 175,
    ionization: 589,
    electronegativity: 1.24,
    block: 'f',
  },
  Tm: {
    z: 69,
    period: 8,
    group: 15,
    name: 'Thulium',
    mass: 168.934,
    radius: 176,
    ionization: 596,
    electronegativity: 1.25,
    block: 'f',
  },
  Yb: {
    z: 70,
    period: 8,
    group: 16,
    name: 'Ytterbium',
    mass: 173.045,
    radius: 176,
    ionization: 603,
    electronegativity: 1.1,
    block: 'f',
  },
  Lu: {
    z: 71,
    period: 8,
    group: 17,
    name: 'Lutetium',
    mass: 174.967,
    radius: 174,
    ionization: 524,
    electronegativity: 1.27,
    block: 'f',
  },
  Hf: {
    z: 72,
    period: 6,
    group: 4,
    name: 'Hafnium',
    mass: 178.49,
    radius: 159,
    ionization: 658,
    electronegativity: 1.3,
    block: 'd',
  },
  Ta: {
    z: 73,
    period: 6,
    group: 5,
    name: 'Tantal',
    mass: 180.948,
    radius: 146,
    ionization: 728,
    electronegativity: 1.5,
    block: 'd',
  },
  W: {
    z: 74,
    period: 6,
    group: 6,
    name: 'Wolfram',
    mass: 183.84,
    radius: 139,
    ionization: 759,
    electronegativity: 2.36,
    block: 'd',
  },
  Re: {
    z: 75,
    period: 6,
    group: 7,
    name: 'Rhenium',
    mass: 186.207,
    radius: 137,
    ionization: 756,
    electronegativity: 1.9,
    block: 'd',
  },
  Os: {
    z: 76,
    period: 6,
    group: 8,
    name: 'Osmium',
    mass: 190.23,
    radius: 135,
    ionization: 814,
    electronegativity: 2.2,
    block: 'd',
  },
  Ir: {
    z: 77,
    period: 6,
    group: 9,
    name: 'Iridium',
    mass: 192.217,
    radius: 141,
    ionization: 865,
    electronegativity: 2.2,
    block: 'd',
  },
  Pt: {
    z: 78,
    period: 6,
    group: 10,
    name: 'Platin',
    mass: 195.084,
    radius: 139,
    ionization: 864,
    electronegativity: 2.28,
    block: 'd',
  },
  Au: {
    z: 79,
    period: 6,
    group: 11,
    name: 'Gold',
    mass: 196.967,
    radius: 144,
    ionization: 888,
    electronegativity: 2.54,
    block: 'd',
  },
  Hg: {
    z: 80,
    period: 6,
    group: 12,
    name: 'Quecksilber',
    mass: 200.592,
    radius: 151,
    ionization: 1007,
    electronegativity: 2.0,
    block: 'd',
  },
  Tl: {
    z: 81,
    period: 6,
    group: 13,
    name: 'Thallium',
    mass: 204.383,
    radius: 148,
    ionization: 589,
    electronegativity: 2.04,
    block: 'p',
  },
  Pb: {
    z: 82,
    period: 6,
    group: 14,
    name: 'Blei',
    mass: 207.2,
    radius: 146,
    ionization: 715,
    electronegativity: 2.33,
    block: 'p',
  },
  Bi: {
    z: 83,
    period: 6,
    group: 15,
    name: 'Bismut',
    mass: 208.98,
    radius: 143,
    ionization: 703,
    electronegativity: 2.02,
    block: 'p',
  },
  Po: {
    z: 84,
    period: 6,
    group: 16,
    name: 'Polonium',
    mass: 209.0,
    radius: 135,
    ionization: 812,
    electronegativity: 2.0,
    block: 'p',
  },
  At: {
    z: 85,
    period: 6,
    group: 17,
    name: 'Astat',
    mass: 210.0,
    radius: 140,
    ionization: 920,
    electronegativity: 2.2,
    block: 'p',
  },
  Rn: {
    z: 86,
    period: 6,
    group: 18,
    name: 'Radon',
    mass: 222.0,
    radius: 145,
    ionization: 1037,
    electronegativity: 0,
    block: 'p',
  },
  Fr: {
    z: 87,
    period: 7,
    group: 1,
    name: 'Francium',
    mass: 223.0,
    radius: 270,
    ionization: 380,
    electronegativity: 0.7,
    block: 's',
  },
  Ra: {
    z: 88,
    period: 7,
    group: 2,
    name: 'Radium',
    mass: 226.0,
    radius: 220,
    ionization: 509,
    electronegativity: 0.89,
    block: 's',
  },
  Ac: {
    z: 89,
    period: 9,
    group: 3,
    name: 'Actinium',
    mass: 227.0,
    radius: 188,
    ionization: 499,
    electronegativity: 1.1,
    block: 'f',
  },
  Th: {
    z: 90,
    period: 9,
    group: 4,
    name: 'Thorium',
    mass: 232.038,
    radius: 179,
    ionization: 590,
    electronegativity: 1.3,
    block: 'f',
  },
  Pa: {
    z: 91,
    period: 9,
    group: 5,
    name: 'Protactinium',
    mass: 231.036,
    radius: 163,
    ionization: 568,
    electronegativity: 1.5,
    block: 'f',
  },
  U: {
    z: 92,
    period: 9,
    group: 6,
    name: 'Uran',
    mass: 238.029,
    radius: 156,
    ionization: 598,
    electronegativity: 1.38,
    block: 'f',
  },
};

let currentTrend = 'atomradius';
let periodicTableData = [];

const trendInfo = {
  atomradius: {
    title: 'Atomradius (pm)',
    unit: 'pm',
    description: 'Abstand Atomkern zum Valenzelektron. Nimmt nach unten zu, nach rechts ab.',
    minVal: 31,
    maxVal: 270,
    colorScheme: 'blue',
    reverseColor: false,
  },
  ionization: {
    title: '1. Ionisationsenergie (kJ/mol)',
    unit: 'kJ/mol',
    description: 'Energie zum Entfernen des ersten Elektrons. Nimmt nach rechts zu, nach unten ab.',
    minVal: 376,
    maxVal: 2372,
    colorScheme: 'red',
    reverseColor: true,
  },
  electronegativity: {
    title: 'Elektronegativität (Pauling)',
    unit: '',
    description: 'Tendenz, Bindungselektronen anzuziehen. Nimmt nach rechts zu, nach unten ab.',
    minVal: 0.7,
    maxVal: 3.98,
    colorScheme: 'green',
    reverseColor: true,
  },
};

function getElementsForTable() {
  const data = Object.values(elementTrendData);
  return data;
}

function renderPeriodicTable() {
  const container = document.getElementById('periodic-table');
  container.innerHTML = '';

  const table = document.createElement('div');
  table.className = 'periodic-table-grid';

  for (let period = 1; period <= 9; period++) {
    const row = document.createElement('div');
    row.className = 'periodic-table-row';

    if (period === 8) {
      const label = document.createElement('div');
      label.className = 'periodic-table-label';
      label.textContent = 'Lanthanoide';
      row.appendChild(label);
    } else if (period === 9) {
      const label = document.createElement('div');
      label.className = 'periodic-table-label';
      label.textContent = 'Actinoide';
      row.appendChild(label);
    }

    const periodElements = periodicTableData.filter((e) => e.period === period);
    periodElements.sort((a, b) => a.group - b.group);

    periodElements.forEach((element) => {
      const cell = createElementCell(element);
      row.appendChild(cell);
    });

    table.appendChild(row);
  }

  container.appendChild(table);
  applyTrendHeatmap();
}

function createElementCell(element) {
  const cell = document.createElement('div');
  cell.className = 'element-cell block-' + element.block;
  cell.dataset.z = element.z;
  cell.dataset.symbol = element.symbol;
  cell.dataset.radius = element.radius;
  cell.dataset.ionization = element.ionization;
  cell.dataset.electronegativity = element.electronegativity;

  const symbol = document.createElement('span');
  symbol.className = 'element-symbol';
  symbol.textContent = element.symbol;

  const atomicNumber = document.createElement('span');
  atomicNumber.className = 'element-atomic';
  atomicNumber.textContent = element.z;

  cell.appendChild(atomicNumber);
  cell.appendChild(symbol);
  cell.addEventListener('click', function () {
    displayElementDetails(element);
  });

  return cell;
}

function applyTrendHeatmap() {
  const trend = trendInfo[currentTrend];
  const cells = document.querySelectorAll('.element-cell');

  cells.forEach((cell) => {
    const value = parseFloat(cell.dataset[currentTrend]);
    if (isNaN(value) || value === 0) {
      cell.style.backgroundColor = '#f0f0f0';
      return;
    }

    const normalizedValue = (value - trend.minVal) / (trend.maxVal - trend.minVal);
    const color = getHeatmapColor(normalizedValue, trend.colorScheme, trend.reverseColor);
    cell.style.backgroundColor = color;
    cell.style.borderColor = shadeColor(color, -30);
  });

  updateLegend();
}

function getHeatmapColor(value, scheme, reverse) {
  const adjustedValue = reverse ? 1 - value : value;
  const clampedValue = Math.max(0, Math.min(1, adjustedValue));

  if (scheme === 'blue') {
    return interpolateColor([235, 245, 255], [8, 81, 156], clampedValue);
  } else if (scheme === 'red') {
    return interpolateColor([255, 245, 240], [165, 42, 42], clampedValue);
  } else if (scheme === 'green') {
    return interpolateColor([235, 255, 235], [0, 100, 0], clampedValue);
  }
  return '#f0f0f0';
}

function interpolateColor(c1, c2, factor) {
  const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
  const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
  const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function shadeColor(color, percent) {
  const rgb = color.match(/\d+/g);
  if (!rgb) return color;
  const r = Math.max(0, Math.min(255, parseInt(rgb[0]) + percent));
  const g = Math.max(0, Math.min(255, parseInt(rgb[1]) + percent));
  const b = Math.max(0, Math.min(255, parseInt(rgb[2]) + percent));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function updateLegend() {
  const legendContainer = document.getElementById('heat-legend');
  const trend = trendInfo[currentTrend];
  if (!legendContainer) return;

  legendContainer.innerHTML =
    '<div class="legend-item">' +
    '<span class="legend-color" style="background:' +
    getHeatmapColor(0, trend.colorScheme, trend.reverseColor) +
    '"></span>' +
    '<span>' +
    trend.minVal +
    ' ' +
    trend.unit +
    '</span>' +
    '</div>' +
    '<div class="legend-item">' +
    '<span class="legend-color" style="background:' +
    getHeatmapColor(0.5, trend.colorScheme, trend.reverseColor) +
    '"></span>' +
    '<span>' +
    ((trend.minVal + trend.maxVal) / 2).toFixed(1) +
    ' ' +
    trend.unit +
    '</span>' +
    '</div>' +
    '<div class="legend-item">' +
    '<span class="legend-color" style="background:' +
    getHeatmapColor(1, trend.colorScheme, trend.reverseColor) +
    '"></span>' +
    '<span>' +
    trend.maxVal +
    ' ' +
    trend.unit +
    '</span>' +
    '</div>';
}

function displayElementDetails(element) {
  const infoContainer = document.getElementById('element-info');
  const trend = trendInfo[currentTrend];
  const trendValue = element[currentTrend];
  if (!trendValue) return;

  const normalizedValue = (trendValue - trend.minVal) / (trend.maxVal - trend.minVal);
  const bgColor = getHeatmapColor(normalizedValue, trend.colorScheme, trend.reverseColor);

  const allTrends = ['atomradius', 'ionization', 'electronegativity'];
  let otherTrends = '';
  allTrends.forEach(function (key) {
    if (key !== currentTrend && element[key]) {
      const t = trendInfo[key];
      otherTrends +=
        '<tr><td><strong>' +
        t.title +
        ':</strong></td><td>' +
        element[key] +
        ' ' +
        t.unit +
        '</td></tr>';
    }
  });

  infoContainer.innerHTML =
    '<table class="table">' +
    '<tr><td><strong>Element:</strong></td><td>' +
    element.name +
    ' (' +
    element.symbol +
    ')</td></tr>' +
    '<tr><td><strong>Ordnungszahl:</strong></td><td>' +
    element.z +
    '</td></tr>' +
    '<tr><td><strong>Periode:</strong></td><td>' +
    element.period +
    '</td></tr>' +
    '<tr><td><strong>Gruppe:</strong></td><td>' +
    element.group +
    '</td></tr>' +
    '<tr><td><strong>Atommasse:</strong></td><td>' +
    element.mass +
    ' u</td></tr>' +
    '</table>' +
    '<div class="element-trend-value" style="margin-top:15px;padding:15px;background:' +
    bgColor +
    ';border-radius:8px;">' +
    '<h4>' +
    trend.title +
    '</h4>' +
    '<p><strong>Wert:</strong> ' +
    trendValue +
    ' ' +
    trend.unit +
    '</p>' +
    '<p><strong>Relativ:</strong> ' +
    (normalizedValue * 100).toFixed(0) +
    '%</p>' +
    '</div>' +
    '<div class="additional-trends" style="margin-top:15px;">' +
    '<table class="table">' +
    otherTrends +
    '</table>' +
    '</div>';
}

function loadTrend() {
  currentTrend = document.getElementById('trend-selector').value;
  const trend = trendInfo[currentTrend];

  const info = document.getElementById('trend-info');
  if (info) {
    info.innerHTML =
      '<h4>' +
      trend.title +
      '</h4>' +
      '<p><strong>Definition:</strong> ' +
      trend.description.split('.')[0] +
      '.</p>' +
      '<p><strong>Einheit:</strong> ' +
      (trend.unit || '-') +
      '</p>' +
      '<p><strong>Trend:</strong> ' +
      trend.description +
      '</p>';
  }

  applyTrendHeatmap();
}

function initPeriodicTrends() {
  periodicTableData = getElementsForTable();
  renderPeriodicTable();
  loadTrend();
}

document.addEventListener('DOMContentLoaded', initPeriodicTrends);
