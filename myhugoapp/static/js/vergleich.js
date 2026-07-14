// ── Element data ───────────────────────────────────────────
// [symbol, germanName, mass, group, period, density(g/cm³), electronegativity,
//  electronConfig, atomicRadius(pm), ionizationEnergy(eV), category, englishName]
var ELEMENTS_DATA = [
  ['H', 'Wasserstoff', 1.008, 1, 1, 0.00009, 2.2, '1s\u00b9', 53, 13.6, 'Nichtmetall', 'Hydrogen'],
  ['He', 'Helium', 4.003, 18, 1, 0.00018, null, '1s\u00b2', 31, 24.6, 'Edelgas', 'Helium'],
  ['Li', 'Lithium', 6.941, 1, 2, 0.534, 0.98, '2s\u00b9', 167, 5.39, 'Alkalimetall', 'Lithium'],
  [
    'Be',
    'Beryllium',
    9.012,
    2,
    2,
    1.85,
    1.57,
    '2s\u00b2',
    112,
    9.32,
    'Erdalkalimetall',
    'Beryllium',
  ],
  ['B', 'Bor', 10.81, 13, 2, 2.34, 2.04, '2s\u00b22p\u00b9', 87, 8.3, 'Halbmetall', 'Boron'],
  [
    'C',
    'Kohlenstoff',
    12.01,
    14,
    2,
    2.27,
    2.55,
    '2s\u00b22p\u00b2',
    67,
    11.26,
    'Nichtmetall',
    'Carbon',
  ],
  [
    'N',
    'Stickstoff',
    14.01,
    15,
    2,
    0.00125,
    3.04,
    '2s\u00b22p\u00b3',
    56,
    14.53,
    'Nichtmetall',
    'Nitrogen',
  ],
  [
    'O',
    'Sauerstoff',
    16.0,
    16,
    2,
    0.00143,
    3.44,
    '2s\u00b22p\u2074',
    48,
    13.62,
    'Nichtmetall',
    'Oxygen',
  ],
  ['F', 'Fluor', 19.0, 17, 2, 0.0017, 3.98, '2s\u00b22p\u2075', 42, 17.42, 'Halogen', 'Fluorine'],
  ['Ne', 'Neon', 20.18, 18, 2, 0.0009, null, '2s\u00b22p\u2076', 38, 21.56, 'Edelgas', 'Neon'],
  ['Na', 'Natrium', 22.99, 1, 3, 0.97, 0.93, '3s\u00b9', 190, 5.14, 'Alkalimetall', 'Sodium'],
  [
    'Mg',
    'Magnesium',
    24.31,
    2,
    3,
    1.74,
    1.31,
    '3s\u00b2',
    145,
    7.65,
    'Erdalkalimetall',
    'Magnesium',
  ],
  [
    'Al',
    'Aluminium',
    26.98,
    13,
    3,
    2.7,
    1.61,
    '3s\u00b23p\u00b9',
    118,
    5.99,
    'Metall',
    'Aluminium',
  ],
  [
    'Si',
    'Silicium',
    28.09,
    14,
    3,
    2.33,
    1.9,
    '3s\u00b23p\u00b2',
    111,
    8.15,
    'Halbmetall',
    'Silicon',
  ],
  [
    'P',
    'Phosphor',
    30.97,
    15,
    3,
    1.82,
    2.19,
    '3s\u00b23p\u00b3',
    98,
    10.49,
    'Nichtmetall',
    'Phosphorus',
  ],
  [
    'S',
    'Schwefel',
    32.07,
    16,
    3,
    2.07,
    2.58,
    '3s\u00b23p\u2074',
    88,
    10.36,
    'Nichtmetall',
    'Sulfur',
  ],
  [
    'Cl',
    'Chlor',
    35.45,
    17,
    3,
    0.00321,
    3.16,
    '3s\u00b23p\u2075',
    79,
    12.97,
    'Halogen',
    'Chlorine',
  ],
  ['Ar', 'Argon', 39.95, 18, 3, 0.00178, null, '3s\u00b23p\u2076', 71, 15.76, 'Edelgas', 'Argon'],
  ['K', 'Kalium', 39.1, 1, 4, 0.86, 0.82, '4s\u00b9', 243, 4.34, 'Alkalimetall', 'Potassium'],
  ['Ca', 'Calcium', 40.08, 2, 4, 1.55, 1.0, '4s\u00b2', 194, 6.11, 'Erdalkalimetall', 'Calcium'],
  [
    'Sc',
    'Scandium',
    44.96,
    3,
    4,
    2.99,
    1.36,
    '3d\u00b94s\u00b2',
    184,
    6.56,
    '\u00dcbergangsmetall',
    'Scandium',
  ],
  [
    'Ti',
    'Titan',
    47.87,
    4,
    4,
    4.51,
    1.54,
    '3d\u00b24s\u00b2',
    176,
    6.83,
    '\u00dcbergangsmetall',
    'Titanium',
  ],
  [
    'V',
    'Vanadium',
    50.94,
    5,
    4,
    6.11,
    1.63,
    '3d\u00b34s\u00b2',
    171,
    6.75,
    '\u00dcbergangsmetall',
    'Vanadium',
  ],
  [
    'Cr',
    'Chrom',
    52.0,
    6,
    4,
    7.15,
    1.66,
    '3d\u20754s\u00b9',
    166,
    6.77,
    '\u00dcbergangsmetall',
    'Chromium',
  ],
  [
    'Mn',
    'Mangan',
    54.94,
    7,
    4,
    7.44,
    1.55,
    '3d\u20754s\u00b2',
    161,
    7.43,
    '\u00dcbergangsmetall',
    'Manganese',
  ],
  [
    'Fe',
    'Eisen',
    55.85,
    8,
    4,
    7.87,
    1.83,
    '3d\u20764s\u00b2',
    156,
    7.9,
    '\u00dcbergangsmetall',
    'Iron',
  ],
  [
    'Co',
    'Cobalt',
    58.93,
    9,
    4,
    8.86,
    1.88,
    '3d\u20774s\u00b2',
    152,
    7.88,
    '\u00dcbergangsmetall',
    'Cobalt',
  ],
  [
    'Ni',
    'Nickel',
    58.69,
    10,
    4,
    8.91,
    1.91,
    '3d\u20784s\u00b2',
    149,
    7.64,
    '\u00dcbergangsmetall',
    'Nickel',
  ],
  [
    'Cu',
    'Kupfer',
    63.55,
    11,
    4,
    8.93,
    1.9,
    '3d\u00b9\u20704s\u00b9',
    145,
    7.73,
    '\u00dcbergangsmetall',
    'Copper',
  ],
  [
    'Zn',
    'Zink',
    65.38,
    12,
    4,
    7.14,
    1.65,
    '3d\u00b9\u20704s\u00b2',
    142,
    9.39,
    '\u00dcbergangsmetall',
    'Zinc',
  ],
  ['Ga', 'Gallium', 69.72, 13, 4, 5.91, 1.81, '4s\u00b24p\u00b9', 136, 6.0, 'Metall', 'Gallium'],
  [
    'Ge',
    'Germanium',
    72.63,
    14,
    4,
    5.32,
    2.01,
    '4s\u00b24p\u00b2',
    125,
    7.9,
    'Halbmetall',
    'Germanium',
  ],
  ['As', 'Arsen', 74.92, 15, 4, 5.78, 2.18, '4s\u00b24p\u00b3', 114, 9.79, 'Halbmetall', 'Arsenic'],
  [
    'Se',
    'Selen',
    78.97,
    16,
    4,
    4.81,
    2.55,
    '4s\u00b24p\u2074',
    103,
    9.75,
    'Nichtmetall',
    'Selenium',
  ],
  ['Br', 'Brom', 79.9, 17, 4, 3.12, 2.96, '4s\u00b24p\u2075', 94, 11.81, 'Halogen', 'Bromine'],
  ['Kr', 'Krypton', 83.8, 18, 4, 0.00375, 3.0, '4s\u00b24p\u2076', 88, 14.0, 'Edelgas', 'Krypton'],
  ['Rb', 'Rubidium', 85.47, 1, 5, 1.53, 0.82, '5s\u00b9', 265, 4.18, 'Alkalimetall', 'Rubidium'],
  [
    'Sr',
    'Strontium',
    87.62,
    2,
    5,
    2.63,
    0.95,
    '5s\u00b2',
    219,
    5.69,
    'Erdalkalimetall',
    'Strontium',
  ],
  [
    'Y',
    'Yttrium',
    88.91,
    3,
    5,
    4.47,
    1.22,
    '4d\u00b95s\u00b2',
    212,
    6.22,
    '\u00dcbergangsmetall',
    'Yttrium',
  ],
  [
    'Zr',
    'Zirconium',
    91.22,
    4,
    5,
    6.52,
    1.33,
    '4d\u00b25s\u00b2',
    206,
    6.63,
    '\u00dcbergangsmetall',
    'Zirconium',
  ],
  [
    'Nb',
    'Niob',
    92.91,
    5,
    5,
    8.57,
    1.6,
    '4d\u20745s\u00b9',
    198,
    6.76,
    '\u00dcbergangsmetall',
    'Niobium',
  ],
  [
    'Mo',
    'Molybd\u00e4n',
    95.96,
    6,
    5,
    10.28,
    2.16,
    '4d\u20755s\u00b9',
    190,
    7.09,
    '\u00dcbergangsmetall',
    'Molybdenum',
  ],
  [
    'Tc',
    'Technetium',
    '(98)',
    7,
    5,
    11.5,
    1.9,
    '4d\u20756s\u00b2',
    183,
    7.28,
    '\u00dcbergangsmetall',
    'Technetium',
  ],
  [
    'Ru',
    'Ruthenium',
    101.07,
    8,
    5,
    12.37,
    2.2,
    '4d\u20747s\u00b9',
    178,
    7.36,
    '\u00dcbergangsmetall',
    'Ruthenium',
  ],
  [
    'Rh',
    'Rhodium',
    102.91,
    9,
    5,
    12.45,
    2.28,
    '4d\u20755s\u00b9',
    173,
    7.46,
    '\u00dcbergangsmetall',
    'Rhodium',
  ],
  [
    'Pd',
    'Palladium',
    106.42,
    10,
    5,
    12.02,
    2.2,
    '4d\u00b9\u2070',
    169,
    8.34,
    '\u00dcbergangsmetall',
    'Palladium',
  ],
  [
    'Ag',
    'Silber',
    107.87,
    11,
    5,
    10.49,
    1.93,
    '4d\u00b9\u20705s\u00b9',
    165,
    7.58,
    '\u00dcbergangsmetall',
    'Silver',
  ],
  [
    'Cd',
    'Cadmium',
    112.41,
    12,
    5,
    8.69,
    1.69,
    '4d\u00b9\u20705s\u00b2',
    161,
    8.99,
    '\u00dcbergangsmetall',
    'Cadmium',
  ],
  ['In', 'Indium', 114.82, 13, 5, 7.31, 1.78, '5s\u00b25p\u00b9', 156, 5.79, 'Metall', 'Indium'],
  ['Sn', 'Zinn', 118.71, 14, 5, 7.29, 1.96, '5s\u00b25p\u00b2', 145, 7.34, 'Metall', 'Tin'],
  [
    'Sb',
    'Antimon',
    121.76,
    15,
    5,
    6.7,
    2.05,
    '5s\u00b25p\u00b3',
    133,
    8.61,
    'Halbmetall',
    'Antimony',
  ],
  [
    'Te',
    'Tellur',
    127.6,
    16,
    5,
    6.24,
    2.1,
    '5s\u00b25p\u2074',
    123,
    9.01,
    'Halbmetall',
    'Tellurium',
  ],
  ['I', 'Iod', 126.9, 17, 5, 4.93, 2.66, '5s\u00b25p\u2075', 115, 10.45, 'Halogen', 'Iodine'],
  ['Xe', 'Xenon', 131.29, 18, 5, 0.0059, 2.6, '5s\u00b25p\u2076', 108, 12.13, 'Edelgas', 'Xenon'],
  ['Cs', 'C\u00e4sium', 132.91, 1, 6, 1.93, 0.79, '6s\u00b9', 298, 3.89, 'Alkalimetall', 'Caesium'],
  ['Ba', 'Barium', 137.33, 2, 6, 3.62, 0.89, '6s\u00b2', 253, 5.21, 'Erdalkalimetall', 'Barium'],
  [
    'La',
    'Lanthan',
    138.91,
    3,
    6,
    6.15,
    1.1,
    '5d\u00b96s\u00b2',
    262,
    5.58,
    'Lanthanoid',
    'Lanthanum',
  ],
  [
    'Ce',
    'Cer',
    140.12,
    4,
    6,
    6.77,
    1.12,
    '4f\u00b95d\u00b96s\u00b2',
    257,
    5.54,
    'Lanthanoid',
    'Cerium',
  ],
  [
    'Pr',
    'Praseodym',
    140.91,
    5,
    6,
    6.77,
    1.13,
    '4f\u00b36s\u00b2',
    250,
    5.46,
    'Lanthanoid',
    'Praseodymium',
  ],
  [
    'Nd',
    'Neodym',
    144.24,
    6,
    6,
    7.01,
    1.14,
    '4f\u20746s\u00b2',
    249,
    5.53,
    'Lanthanoid',
    'Neodymium',
  ],
  [
    'Pm',
    'Promethium',
    '(145)',
    7,
    6,
    7.26,
    null,
    '4f\u20756s\u00b2',
    247,
    5.55,
    'Lanthanoid',
    'Promethium',
  ],
  [
    'Sm',
    'Samarium',
    150.36,
    8,
    6,
    7.52,
    1.17,
    '4f\u20766s\u00b2',
    245,
    5.64,
    'Lanthanoid',
    'Samarium',
  ],
  [
    'Eu',
    'Europium',
    151.96,
    9,
    6,
    5.24,
    null,
    '4f\u20776s\u00b2',
    243,
    5.67,
    'Lanthanoid',
    'Europium',
  ],
  [
    'Gd',
    'Gadolinium',
    157.25,
    10,
    6,
    7.9,
    1.2,
    '4f\u20775d\u00b96s\u00b2',
    242,
    6.15,
    'Lanthanoid',
    'Gadolinium',
  ],
  [
    'Tb',
    'Terbium',
    158.93,
    11,
    6,
    8.23,
    1.2,
    '4f\u20796s\u00b2',
    240,
    5.86,
    'Lanthanoid',
    'Terbium',
  ],
  [
    'Dy',
    'Dysprosium',
    162.5,
    12,
    6,
    8.55,
    1.22,
    '4f\u00b9\u20706s\u00b2',
    238,
    5.94,
    'Lanthanoid',
    'Dysprosium',
  ],
  [
    'Ho',
    'Holmium',
    164.93,
    13,
    6,
    8.8,
    1.23,
    '4f\u00b9\u00b96s\u00b2',
    236,
    6.02,
    'Lanthanoid',
    'Holmium',
  ],
  [
    'Er',
    'Erbium',
    167.26,
    14,
    6,
    9.07,
    1.24,
    '4f\u00b9\u00b2\u20706s\u00b2',
    234,
    6.1,
    'Lanthanoid',
    'Erbium',
  ],
  [
    'Tm',
    'Thulium',
    168.93,
    15,
    6,
    9.32,
    1.25,
    '4f\u00b9\u00b36s\u00b2',
    232,
    6.18,
    'Lanthanoid',
    'Thulium',
  ],
  [
    'Yb',
    'Ytterbium',
    173.05,
    16,
    6,
    6.97,
    null,
    '4f\u00b9\u20746s\u00b2',
    230,
    6.25,
    'Lanthanoid',
    'Ytterbium',
  ],
  [
    'Lu',
    'Lutetium',
    174.97,
    17,
    6,
    9.84,
    1.27,
    '4f\u00b9\u20745d\u00b96s\u00b2',
    228,
    5.43,
    'Lanthanoid',
    'Lutetium',
  ],
  [
    'Hf',
    'Hafnium',
    178.49,
    4,
    6,
    13.31,
    1.3,
    '4f\u00b9\u20745d\u00b26s\u00b2',
    225,
    6.83,
    '\u00dcbergangsmetall',
    'Hafnium',
  ],
  [
    'Ta',
    'Tantal',
    180.95,
    5,
    6,
    16.65,
    1.5,
    '4f\u00b9\u20745d\u00b36s\u00b2',
    220,
    7.55,
    '\u00dcbergangsmetall',
    'Tantalum',
  ],
  [
    'W',
    'Wolfram',
    183.84,
    6,
    6,
    19.25,
    2.36,
    '4f\u00b9\u20745d\u20746s\u00b2',
    218,
    7.98,
    '\u00dcbergangsmetall',
    'Tungsten',
  ],
  [
    'Re',
    'Rhenium',
    186.21,
    7,
    6,
    21.02,
    1.9,
    '4f\u00b9\u20745d\u20755s\u00b2',
    216,
    7.88,
    '\u00dcbergangsmetall',
    'Rhenium',
  ],
  [
    'Os',
    'Osmium',
    190.23,
    8,
    6,
    22.59,
    2.2,
    '4f\u00b9\u20745d\u20766s\u00b2',
    214,
    8.44,
    '\u00dcbergangsmetall',
    'Osmium',
  ],
  [
    'Ir',
    'Iridium',
    192.22,
    9,
    6,
    22.56,
    2.2,
    '4f\u00b9\u20745d\u20776s\u00b2',
    212,
    8.97,
    '\u00dcbergangsmetall',
    'Iridium',
  ],
  [
    'Pt',
    'Platin',
    195.08,
    10,
    6,
    21.45,
    2.28,
    '4f\u00b9\u20745d\u20796s\u00b9',
    210,
    8.96,
    '\u00dcbergangsmetall',
    'Platinum',
  ],
  [
    'Au',
    'Gold',
    196.97,
    11,
    6,
    19.32,
    2.54,
    '4f\u00b9\u20745d\u00b9\u20706s\u00b9',
    166,
    9.23,
    '\u00dcbergangsmetall',
    'Gold',
  ],
  [
    'Hg',
    'Quecksilber',
    200.59,
    12,
    6,
    13.53,
    2.0,
    '4f\u00b9\u20745d\u00b9\u20706s\u00b2',
    209,
    10.44,
    '\u00dcbergangsmetall',
    'Mercury',
  ],
  [
    'Tl',
    'Thallium',
    204.38,
    13,
    6,
    11.85,
    1.62,
    '6s\u00b26p\u00b9',
    207,
    6.11,
    'Metall',
    'Thallium',
  ],
  ['Pb', 'Blei', 207.2, 14, 6, 11.34, 2.33, '6s\u00b26p\u00b2', 202, 7.42, 'Metall', 'Lead'],
  ['Bi', 'Bismut', 208.98, 15, 6, 9.78, 2.02, '6s\u00b26p\u00b3', 196, 7.29, 'Metall', 'Bismuth'],
  [
    'Po',
    'Polonium',
    '(209)',
    16,
    6,
    9.2,
    2.0,
    '6s\u00b26p\u2074',
    190,
    8.42,
    'Halbmetall',
    'Polonium',
  ],
  ['At', 'Astat', '(210)', 17, 6, 7.0, 2.2, '6s\u00b26p\u2075', 185, 9.3, 'Halogen', 'Astatine'],
  [
    'Rn',
    'Radon',
    '(222)',
    18,
    6,
    0.00973,
    null,
    '6s\u00b26p\u2076',
    180,
    10.75,
    'Edelgas',
    'Radon',
  ],
  ['Fr', 'Francium', '(223)', 1, 7, 1.87, 0.7, '7s\u00b9', 348, 4.07, 'Alkalimetall', 'Francium'],
  ['Ra', 'Radium', '(226)', 2, 7, 5.5, 0.9, '7s\u00b2', 283, 5.28, 'Erdalkalimetall', 'Radium'],
  [
    'Ac',
    'Actinium',
    '(227)',
    3,
    7,
    10.07,
    1.1,
    '6d\u00b97s\u00b2',
    260,
    5.17,
    'Actinoid',
    'Actinium',
  ],
  [
    'Th',
    'Thorium',
    '232.04',
    4,
    7,
    11.72,
    1.3,
    '6d\u00b27s\u00b2',
    237,
    6.31,
    'Actinoid',
    'Thorium',
  ],
  [
    'Pa',
    'Protactinium',
    '231.04',
    5,
    7,
    15.37,
    1.5,
    '5f\u00b26d\u00b97s\u00b2',
    243,
    5.89,
    'Actinoid',
    'Protactinium',
  ],
  [
    'U',
    'Uran',
    '238.03',
    6,
    7,
    18.95,
    1.38,
    '5f\u00b36d\u00b97s\u00b2',
    240,
    6.19,
    'Actinoid',
    'Uranium',
  ],
  [
    'Np',
    'Neptunium',
    '(237)',
    7,
    7,
    20.45,
    1.36,
    '5f\u20746d\u00b97s\u00b2',
    236,
    6.27,
    'Actinoid',
    'Neptunium',
  ],
  [
    'Pu',
    'Plutonium',
    '(244)',
    8,
    7,
    19.84,
    1.28,
    '5f\u20767s\u00b2',
    234,
    6.03,
    'Actinoid',
    'Plutonium',
  ],
  [
    'Am',
    'Americium',
    '(243)',
    9,
    7,
    13.69,
    1.3,
    '5f\u20777s\u00b2',
    232,
    5.97,
    'Actinoid',
    'Americium',
  ],
  [
    'Cm',
    'Curium',
    '(247)',
    10,
    7,
    13.51,
    1.3,
    '5f\u20776d\u00b97s\u00b2',
    230,
    5.99,
    'Actinoid',
    'Curium',
  ],
  [
    'Bk',
    'Berkelium',
    '(247)',
    11,
    7,
    14.78,
    1.3,
    '5f\u20797s\u00b2',
    227,
    6.2,
    'Actinoid',
    'Berkelium',
  ],
  [
    'Cf',
    'Californium',
    '(251)',
    12,
    7,
    15.1,
    1.3,
    '5f\u00b9\u20707s\u00b2',
    225,
    6.28,
    'Actinoid',
    'Californium',
  ],
  [
    'Es',
    'Einsteinium',
    '(252)',
    13,
    7,
    13.5,
    1.3,
    '5f\u00b9\u00b97s\u00b2',
    222,
    6.37,
    'Actinoid',
    'Einsteinium',
  ],
  [
    'Fm',
    'Fermium',
    '(257)',
    14,
    7,
    9.7,
    1.3,
    '5f\u00b9\u00b27s\u00b2',
    220,
    6.45,
    'Actinoid',
    'Fermium',
  ],
  [
    'Md',
    'Mendelevium',
    '(258)',
    15,
    7,
    10.3,
    1.3,
    '5f\u00b9\u00b37s\u00b2',
    218,
    6.54,
    'Actinoid',
    'Mendelevium',
  ],
  [
    'No',
    'Nobelium',
    '(259)',
    16,
    7,
    9.9,
    1.3,
    '5f\u00b9\u20747s\u00b2',
    216,
    6.62,
    'Actinoid',
    'Nobelium',
  ],
  [
    'Lr',
    'Lawrencium',
    '(262)',
    17,
    7,
    15.6,
    1.3,
    '5f\u00b9\u20747s\u00b27p\u00b9',
    214,
    4.9,
    'Actinoid',
    'Lawrencium',
  ],
  [
    'Rf',
    'Rutherfordium',
    '(267)',
    4,
    7,
    23.2,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b27s\u00b2',
    210,
    6.0,
    '\u00dcbergangsmetall',
    'Rutherfordium',
  ],
  [
    'Db',
    'Dubnium',
    '(268)',
    5,
    7,
    29.3,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b37s\u00b2',
    208,
    6.0,
    '\u00dcbergangsmetall',
    'Dubnium',
  ],
  [
    'Sg',
    'Seaborgium',
    '(271)',
    6,
    7,
    35.0,
    null,
    '[Rn] 5f\u00b9\u20746d\u20747s\u00b2',
    206,
    6.0,
    '\u00dcbergangsmetall',
    'Seaborgium',
  ],
  [
    'Bh',
    'Bohrium',
    '(272)',
    7,
    7,
    37.1,
    null,
    '[Rn] 5f\u00b9\u20746d\u20757s\u00b2',
    204,
    6.0,
    '\u00dcbergangsmetall',
    'Bohrium',
  ],
  [
    'Hs',
    'Hassium',
    '(270)',
    8,
    7,
    40.7,
    null,
    '[Rn] 5f\u00b9\u20746d\u20767s\u00b2',
    202,
    6.0,
    '\u00dcbergangsmetall',
    'Hassium',
  ],
  [
    'Mt',
    'Meitnerium',
    '(276)',
    9,
    7,
    37.4,
    null,
    '[Rn] 5f\u00b9\u20746d\u20777s\u00b2',
    200,
    6.0,
    '\u00dcbergangsmetall',
    'Meitnerium',
  ],
  [
    'Ds',
    'Darmstadtium',
    '(281)',
    10,
    7,
    34.8,
    null,
    '[Rn] 5f\u00b9\u20746d\u20786s\u00b9',
    199,
    6.0,
    '\u00dcbergangsmetall',
    'Darmstadtium',
  ],
  [
    'Rg',
    'Roentgenium',
    '(280)',
    11,
    7,
    28.7,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b9',
    198,
    6.0,
    '\u00dcbergangsmetall',
    'Roentgenium',
  ],
  [
    'Cn',
    'Copernicium',
    '(285)',
    12,
    7,
    14.0,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b2',
    197,
    6.0,
    '\u00dcbergangsmetall',
    'Copernicium',
  ],
  [
    'Nh',
    'Nihonium',
    '(286)',
    13,
    7,
    16.0,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b27p\u00b9',
    196,
    6.0,
    '\u00dcbergangsmetall',
    'Nihonium',
  ],
  [
    'Fl',
    'Flerovium',
    '(289)',
    14,
    7,
    14.0,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b27p\u00b2',
    195,
    6.0,
    '\u00dcbergangsmetall',
    'Flerovium',
  ],
  [
    'Mc',
    'Moscovium',
    '(290)',
    15,
    7,
    13.5,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b27p\u00b3',
    194,
    6.0,
    '\u00dcbergangsmetall',
    'Moscovium',
  ],
  [
    'Lv',
    'Livermorium',
    '(293)',
    16,
    7,
    12.9,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b27p\u2074',
    193,
    6.0,
    '\u00dcbergangsmetall',
    'Livermorium',
  ],
  [
    'Ts',
    'Tenness',
    '(294)',
    17,
    7,
    7.17,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b27p\u2075',
    192,
    6.0,
    'Halogen',
    'Tennessine',
  ],
  [
    'Og',
    'Oganesson',
    '(294)',
    18,
    7,
    7.0,
    null,
    '[Rn] 5f\u00b9\u20746d\u00b9\u20707s\u00b27p\u2076',
    191,
    6.0,
    'Edelgas',
    'Oganesson',
  ],
];

// Melting and boiling points (K) for common elements
var THERMAL_DATA = {
  H: { melt: 14.01, boil: 20.28 },
  He: { melt: 0.95, boil: 4.22 },
  Li: { melt: 453.65, boil: 1615 },
  Be: { melt: 1560, boil: 2742 },
  B: { melt: 2349, boil: 4200 },
  C: { melt: 3825, boil: 5100 },
  N: { melt: 63.15, boil: 77.36 },
  O: { melt: 54.36, boil: 90.2 },
  F: { melt: 53.53, boil: 85.03 },
  Ne: { melt: 24.56, boil: 27.07 },
  Na: { melt: 370.87, boil: 1156 },
  Mg: { melt: 923, boil: 1363 },
  Al: { melt: 933.47, boil: 2792 },
  Si: { melt: 1687, boil: 3538 },
  P: { melt: 317.3, boil: 553.6 },
  S: { melt: 388.36, boil: 717.8 },
  Cl: { melt: 171.6, boil: 239.11 },
  Ar: { melt: 83.8, boil: 87.3 },
  K: { melt: 336.53, boil: 1032 },
  Ca: { melt: 1115, boil: 1757 },
  Sc: { melt: 1814, boil: 3109 },
  Ti: { melt: 1941, boil: 3560 },
  V: { melt: 2183, boil: 3680 },
  Cr: { melt: 2180, boil: 2944 },
  Mn: { melt: 1519, boil: 2334 },
  Fe: { melt: 1811, boil: 3134 },
  Co: { melt: 1768, boil: 3200 },
  Ni: { melt: 1728, boil: 3186 },
  Cu: { melt: 1357.77, boil: 2835 },
  Zn: { melt: 692.68, boil: 1180 },
  Ga: { melt: 302.91, boil: 2477 },
  Ge: { melt: 1211.4, boil: 3106 },
  As: { melt: 1090, boil: 887 },
  Se: { melt: 494, boil: 958 },
  Br: { melt: 265.8, boil: 332.0 },
  Kr: { melt: 115.78, boil: 119.93 },
  Rb: { melt: 312.46, boil: 961 },
  Sr: { melt: 1050, boil: 1655 },
  Y: { melt: 1799, boil: 3609 },
  Zr: { melt: 2128, boil: 4682 },
  Nb: { melt: 2750, boil: 5017 },
  Mo: { melt: 2896, boil: 4912 },
  Tc: { melt: 2430, boil: 4538 },
  Ru: { melt: 2607, boil: 4423 },
  Rh: { melt: 2237, boil: 3968 },
  Pd: { melt: 1828.05, boil: 3236 },
  Ag: { melt: 1234.93, boil: 2435 },
  Cd: { melt: 594.22, boil: 1040 },
  In: { melt: 429.75, boil: 2345 },
  Sn: { melt: 505.08, boil: 2875 },
  Sb: { melt: 904, boil: 1860 },
  Te: { melt: 722.66, boil: 1261 },
  I: { melt: 386.85, boil: 457.4 },
  Xe: { melt: 161.4, boil: 165.03 },
  Cs: { melt: 301.59, boil: 944 },
  Ba: { melt: 1000, boil: 2143 },
  La: { melt: 1193, boil: 3737 },
  Ce: { melt: 1068, boil: 3716 },
  Pr: { melt: 1208, boil: 3793 },
  Nd: { melt: 1297, boil: 3347 },
  Sm: { melt: 1345, boil: 2067 },
  Eu: { melt: 1099, boil: 1802 },
  Gd: { melt: 1585, boil: 3546 },
  Tb: { melt: 1629, boil: 3503 },
  Dy: { melt: 1680, boil: 2840 },
  Ho: { melt: 1734, boil: 2993 },
  Er: { melt: 1802, boil: 3141 },
  Tm: { melt: 1818, boil: 2223 },
  Yb: { melt: 1097, boil: 1469 },
  Lu: { melt: 1925, boil: 3675 },
  Hf: { melt: 2506, boil: 4876 },
  Ta: { melt: 3290, boil: 5731 },
  W: { melt: 3695, boil: 5828 },
  Re: { melt: 3459, boil: 5869 },
  Os: { melt: 3306, boil: 5285 },
  Ir: { melt: 2719, boil: 4701 },
  Pt: { melt: 2041.4, boil: 4098 },
  Au: { melt: 1337.33, boil: 3129 },
  Hg: { melt: 234.32, boil: 629.88 },
  Tl: { melt: 577, boil: 1746 },
  Pb: { melt: 600.61, boil: 2022 },
  Bi: { melt: 544.55, boil: 1837 },
  Po: { melt: 527, boil: 1235 },
  Rn: { melt: 202, boil: 211.3 },
  Ra: { melt: 973, boil: 2010 },
  Th: { melt: 2023, boil: 5061 },
  Pa: { melt: 1841, boil: 4300 },
  U: { melt: 1405.3, boil: 4404 },
  Np: { melt: 917, boil: 4273 },
  Pu: { melt: 912.5, boil: 3501 },
  Am: { melt: 1449, boil: 2880 },
  Cm: { melt: 1613, boil: 3383 },
};

// ── State ──────────────────────────────────────────────────
var comparisonState = {
  selected: [], // Array of element symbol strings (max 4)
  elementMap: {}, // Symbol -> parsed element object lookup
};

// ── Initialization ─────────────────────────────────────────
function initComparisonTool() {
  loadElementsData();
  initSearch();
}

function loadElementsData() {
  comparisonState.elementMap = {};
  for (var i = 0; i < ELEMENTS_DATA.length; i++) {
    var e = ELEMENTS_DATA[i];
    var mass =
      typeof e[2] === 'string' && e[2].charAt(0) === '('
        ? parseFloat(e[2].replace(/[()]/g, ''))
        : parseFloat(e[2]);
    var thermal = THERMAL_DATA[e[0]] || { melt: null, boil: null };
    comparisonState.elementMap[e[0]] = {
      symbol: e[0],
      name: e[1],
      mass: mass,
      group: e[3],
      period: e[4],
      density: e[5],
      eneg: e[6],
      config: e[7],
      radius: e[8],
      ionization: e[9],
      category: e[10],
      englishName: e[11],
      melt: thermal.melt,
      boil: thermal.boil,
    };
  }
}

// ── Search ─────────────────────────────────────────────────
function initSearch() {
  var input = document.getElementById('element-search');
  var dropdown = document.getElementById('autocomplete-dropdown');

  input.addEventListener('input', function () {
    var query = input.value.trim().toLowerCase();
    if (query.length < 1) {
      dropdown.classList.remove('open');
      return;
    }
    var results = [];
    for (var key in comparisonState.elementMap) {
      if (!comparisonState.elementMap.hasOwnProperty(key)) continue;
      var el = comparisonState.elementMap[key];
      if (comparisonState.selected.indexOf(el.symbol) !== -1) continue;
      if (
        el.symbol.toLowerCase().indexOf(query) !== -1 ||
        el.name.toLowerCase().indexOf(query) !== -1 ||
        String(el.group).indexOf(query) !== -1 ||
        el.englishName.toLowerCase().indexOf(query) !== -1
      ) {
        results.push(el);
        if (results.length >= 10) break;
      }
    }
    renderAutocomplete(results, dropdown);
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrapper')) {
      dropdown.classList.remove('open');
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      dropdown.classList.remove('open');
      input.blur();
    }
  });
}

function renderAutocomplete(results, dropdown) {
  dropdown.innerHTML = '';
  if (results.length === 0) {
    dropdown.classList.remove('open');
    return;
  }
  for (var i = 0; i < results.length; i++) {
    var el = results[i];
    var item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.innerHTML =
      '<span class="sym">' +
      el.symbol +
      '</span>' +
      '<span class="num">' +
      getAtomicNumber(el.symbol) +
      '</span>' +
      '<span class="name">' +
      el.name +
      '</span>';
    item.addEventListener(
      'click',
      (function (sym) {
        return function () {
          addElement(sym);
          document.getElementById('element-search').value = '';
          dropdown.classList.remove('open');
          document.getElementById('element-search').focus();
        };
      })(el.symbol)
    );
    dropdown.appendChild(item);
  }
  dropdown.classList.add('open');
}

function getAtomicNumber(symbol) {
  var keys = Object.keys(comparisonState.elementMap);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] === symbol) return i + 1;
  }
  return 0;
}

// ── Add / Remove ──────────────────────────────────────────
function addElement(symbol) {
  if (comparisonState.selected.indexOf(symbol) !== -1) return;
  if (comparisonState.selected.length >= 4) return;
  comparisonState.selected.push(symbol);
  renderChips();
  renderCards();
  renderSphereOverlay();
}

function removeElement(symbol) {
  var idx = comparisonState.selected.indexOf(symbol);
  if (idx === -1) return;
  comparisonState.selected.splice(idx, 1);
  renderChips();
  renderCards();
  renderSphereOverlay();
}

function renderChips() {
  var container = document.getElementById('selected-chips');
  container.innerHTML = '';
  for (var i = 0; i < comparisonState.selected.length; i++) {
    var sym = comparisonState.selected[i];
    var el = comparisonState.elementMap[sym];
    var chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML =
      el.symbol +
      ' - ' +
      el.name +
      ' <span class="remove" data-symbol="' +
      sym +
      '">&times;</span>';
    chip.querySelector('.remove').addEventListener('click', function () {
      removeElement(this.dataset.symbol);
    });
    container.appendChild(chip);
  }
}

// ── Render Cards ──────────────────────────────────────────
function renderCards() {
  var grid = document.getElementById('card-grid');
  var empty = document.getElementById('empty-state');
  var loading = document.getElementById('loading-state');

  if (comparisonState.selected.length === 0) {
    grid.style.display = 'none';
    empty.style.display = '';
    loading.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  loading.style.display = 'none';
  grid.style.display = '';

  var html = '';
  for (var i = 0; i < 4; i++) {
    if (i < comparisonState.selected.length) {
      var sym = comparisonState.selected[i];
      var el = comparisonState.elementMap[sym];
      html += renderCard(el);
    } else {
      html += '<div class="comparison-card placeholder">+ (max. 4)</div>';
    }
  }
  grid.innerHTML = html;
}

function renderCard(el) {
  var catClass = el.category ? 'category-' + el.category.toLowerCase().replace(/[^a-z]/g, '') : '';
  var massStr = typeof el.mass === 'number' ? el.mass.toFixed(2) : String(el.mass);

  var barsHtml = renderPropertyBars(el);

  return (
    '<div class="comparison-card ' +
    catClass +
    '">' +
    '<div class="symbol" style="color:' +
    getCategoryColor(el.category) +
    '">' +
    el.symbol +
    '</div>' +
    '<div class="ename">' +
    el.name +
    '</div>' +
    '<div class="info-grid">' +
    '<span class="label">Ordnungszahl</span><span class="value">' +
    getAtomicNumber(el.symbol) +
    '</span>' +
    '<span class="label">Masse (u)</span><span class="value">' +
    massStr +
    '</span>' +
    '<span class="label">Periode</span><span class="value">' +
    el.period +
    '</span>' +
    '<span class="label">Gruppe</span><span class="value">' +
    el.group +
    '</span>' +
    '</div>' +
    '<div class="property-bars">' +
    barsHtml +
    '</div>' +
    '</div>'
  );
}

function renderPropertyBars(el) {
  var props = [
    { key: 'radius', label: 'Atomradius', unit: 'pm', val: el.radius, max: 350 },
    { key: 'eneg', label: 'Elektronegativit\u00e4t', unit: '', val: el.eneg, max: 4.0 },
    { key: 'ionization', label: 'Ionisierungsenergie', unit: 'eV', val: el.ionization, max: 25 },
    { key: 'density', label: 'Dichte', unit: 'g/cm\u00b3', val: el.density, max: 23 },
    { key: 'melt', label: 'Schmelzpunkt', unit: 'K', val: el.melt, max: 3700 },
    { key: 'boil', label: 'Siedepunkt', unit: 'K', val: el.boil, max: 5900 },
  ];

  var html = '';
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    var val = p.val;
    if (val === null || val === undefined) {
      html +=
        '<div class="property-bar-row">' +
        '<div class="pbar-label"><span class="pbar-name">' +
        p.label +
        '</span><span class="pbar-val">\u2014</span></div>' +
        '<div class="property-bar-track"><div class="property-bar-fill" style="width:0;background:#eee"></div></div>' +
        '</div>';
    } else {
      var percent = Math.min(100, (val / p.max) * 100);
      var color = propertyBarColor(percent / 100);
      var valStr = typeof val === 'number' ? val.toFixed(1) : val;
      html +=
        '<div class="property-bar-row">' +
        '<div class="pbar-label"><span class="pbar-name">' +
        p.label +
        '</span><span class="pbar-val">' +
        valStr +
        ' ' +
        p.unit +
        '</span></div>' +
        '<div class="property-bar-track"><div class="property-bar-fill" style="width:' +
        percent +
        '%;background:' +
        color +
        '"></div></div>' +
        '</div>';
    }
  }
  return html;
}

function propertyBarColor(t) {
  var r, g, b;
  if (t < 0.33) {
    var lt = t / 0.33;
    r = Math.round(52 + lt * (46 - 52));
    g = Math.round(152 + lt * (204 - 152));
    b = Math.round(219 + lt * (113 - 219));
  } else if (t < 0.66) {
    var lt2 = (t - 0.33) / 0.33;
    r = Math.round(46 + lt2 * (230 - 46));
    g = Math.round(204 + lt2 * (126 - 204));
    b = Math.round(113 + lt2 * (34 - 113));
  } else {
    var lt3 = (t - 0.66) / 0.34;
    r = Math.round(230 + lt3 * (231 - 230));
    g = Math.round(126 + lt3 * (76 - 126));
    b = Math.round(34 + lt3 * (60 - 34));
  }
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function getCategoryColor(category) {
  var colors = {
    Nichtmetall: '#2ecc71',
    Edelgas: '#9b59b6',
    Alkalimetall: '#e74c3c',
    Erdalkalimetall: '#e67e22',
    Halbmetall: '#f1c40f',
    Metall: '#3498db',
    Halogen: '#1abc9c',
    '\u00dcbergangsmetall': '#e67e22',
    Lanthanoid: '#e74c3c',
    Actinoid: '#c0392b',
  };
  return colors[category] || '#3498db';
}

// ── Sphere Overlay (Three.js) ─────────────────────────────
function renderSphereOverlay() {
  var section = document.getElementById('sphere-section');
  var wrap = document.getElementById('sphere-canvas-wrap');

  if (comparisonState.selected.length !== 2) {
    section.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }

  section.style.display = '';

  var symA = comparisonState.selected[0];
  var symB = comparisonState.selected[1];
  var elA = comparisonState.elementMap[symA];
  var elB = comparisonState.elementMap[symB];

  if (!elA.radius || !elB.radius) {
    wrap.innerHTML =
      '<p style="text-align:center;color:#999;padding:60px 0;">Atomradius-Daten nicht verf\u00fcgbar</p>';
    return;
  }

  wrap.innerHTML =
    '<div style="text-align:center;color:#999;padding:20px 0;">Lade 3D-Visualisierung...</div>';

  // Dynamically import Three.js
  import('three')
    .then(function (THREE) {
      wrap.innerHTML = '';
      buildSphereScene(THREE, wrap, elA, elB);
    })
    .catch(function () {
      wrap.innerHTML =
        '<p style="text-align:center;color:#999;padding:60px 0;">3D-Visualisierung nicht verf\u00fcgbar</p>';
    });
}

function buildSphereScene(THREE, container, elA, elB) {
  var width = container.clientWidth || 500;
  var height = container.clientHeight || 360;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1, 6);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  var ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  var dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);
  var backLight = new THREE.DirectionalLight(0xffffff, 0.4);
  backLight.position.set(-2, -1, -3);
  scene.add(backLight);

  // Scale radii to visual units: reference Cs (265pm) -> radius 2.5
  // radius = pm / 106
  var radiusA = Math.max(0.3, elA.radius / 106);
  var radiusB = Math.max(0.3, elB.radius / 106);

  var colorA = getCategoryColor(elA.category);
  var colorB = getCategoryColor(elB.category);

  // Offset spheres side by side
  var totalWidth = radiusA + radiusB;
  var offsetA = -totalWidth / 2 + radiusA;
  var offsetB = totalWidth / 2 - radiusB;

  // Sphere A
  var geoA = new THREE.SphereGeometry(radiusA, 48, 48);
  var matA = new THREE.MeshPhongMaterial({
    color: colorA,
    transparent: true,
    opacity: 0.65,
    shininess: 30,
  });
  var sphereA = new THREE.Mesh(geoA, matA);
  sphereA.position.x = offsetA;
  scene.add(sphereA);

  // Sphere B
  var geoB = new THREE.SphereGeometry(radiusB, 48, 48);
  var matB = new THREE.MeshPhongMaterial({
    color: colorB,
    transparent: true,
    opacity: 0.65,
    shininess: 30,
  });
  var sphereB = new THREE.Mesh(geoB, matB);
  sphereB.position.x = offsetB;
  scene.add(sphereB);

  // Labels using sprite text
  var labelA = makeTextSprite(THREE, elA.symbol + ' (' + elA.radius + ' pm)', colorA);
  labelA.position.set(offsetA, -radiusA - 0.5, 0);
  scene.add(labelA);

  var labelB = makeTextSprite(THREE, elB.symbol + ' (' + elB.radius + ' pm)', colorB);
  labelB.position.set(offsetB, -radiusB - 0.5, 0);
  scene.add(labelB);

  // Camera fit to content
  var dist = (totalWidth / 2 + 1.5) * 1.2;
  camera.position.z = Math.max(dist, 4);

  // Animation
  function animate() {
    requestAnimationFrame(animate);
    sphereA.rotation.y += 0.005;
    sphereB.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  function onResize() {
    var w = container.clientWidth || 500;
    var h = container.clientHeight || 360;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // Store cleanup reference
  container._cleanup = function () {
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

function makeTextSprite(THREE, message, color) {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'Bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);

  var texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  var material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  var sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
}

// ── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initComparisonTool);
