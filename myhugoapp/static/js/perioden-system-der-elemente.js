import * as THREE from 'three';

import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// ── Extended element data ───────────────────────────────────
// symbol, germanName, mass, group, period, density(g/cm³), electronegativity,
// electronConfig, atomicRadius(pm), ionizationEnergy(eV), category, englishName
const ELEMENTS = [
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

// ── Emoji mapping ───────────────────────────────────────────
const ELEMENT_EMOJIS = {
  H: '\ud83d\udca7',
  He: '\ud83c\udf88',
  Li: '\ud83d\udd0b',
  Be: '\ud83d\udc8e',
  B: '\ud83d\udca0',
  C: '\ud83d\udc8e',
  N: '\ud83d\udca8',
  O: '\ud83c\udf2c\ufe0f',
  F: '\ud83e\uddb7',
  Ne: '\ud83d\udca1',
  Na: '\ud83e\uddc2',
  Mg: '\ud83d\udd25',
  Al: '\u2708\ufe0f',
  Si: '\ud83d\udcbb',
  P: '\u26a1',
  S: '\ud83d\udfe1',
  Cl: '\ud83e\uddfc',
  Ar: '\ud83c\udf2c\ufe0f',
  K: '\ud83c\udf4c',
  Ca: '\ud83e\uddb4',
  Sc: '\u2694\ufe0f',
  Ti: '\ud83d\udee1\ufe0f',
  V: '\u26a1',
  Cr: '\ud83d\udd27',
  Mn: '\u26cf\ufe0f',
  Fe: '\ud83d\udd29',
  Co: '\ud83d\udd35',
  Ni: '\ud83e\ude99',
  Cu: '\ud83e\udd49',
  Zn: '\ud83d\udd29',
  Ga: '\ud83d\udca1',
  Ge: '\ud83d\udcbe',
  As: '\u2620\ufe0f',
  Se: '\ud83c\udf19',
  Br: '\ud83d\udfe4',
  Kr: '\ud83d\udc7b',
  Rb: '\ud83d\udd2e',
  Sr: '\ud83d\udd34',
  Y: '\ud83d\udc9b',
  Zr: '\u26aa',
  Nb: '\ud83d\udd35',
  Mo: '\u26ab',
  Tc: '\u2622\ufe0f',
  Ru: '\ud83d\udc51',
  Rh: '\ud83c\udf1f',
  Pd: '\ud83e\ude90',
  Ag: '\ud83e\udd48',
  Cd: '\ud83c\udfb8',
  In: '\ud83d\udcf1',
  Sn: '\ud83e\udd6b',
  Sb: '\ud83d\udde1\ufe0f',
  Te: '\ud83c\udf15',
  I: '\ud83d\udfe3',
  Xe: '\ud83d\udca8',
  Cs: '\u23f0',
  Ba: '\ud83c\udffa',
  La: '\ud83c\udf3f',
  Ce: '\ud83c\udf31',
  Pr: '\ud83d\udfe2',
  Nd: '\ud83d\udd37',
  Pm: '\u2622\ufe0f',
  Sm: '\ud83d\udfe8',
  Eu: '\ud83d\udfe5',
  Gd: '\u2b1c',
  Tb: '\ud83d\udfe9',
  Dy: '\ud83d\udfe6',
  Ho: '\ud83d\udfea',
  Er: '\ud83d\udfe5',
  Tm: '\ud83d\udfe7',
  Yb: '\ud83d\udfeb',
  Lu: '\ud83c\udf38',
  Hf: '\ud83d\udd36',
  Ta: '\ud83d\udd37',
  W: '\ud83d\udca1',
  Re: '\u2699\ufe0f',
  Os: '\ud83d\udd35',
  Ir: '\u26aa',
  Pt: '\ud83e\udd47',
  Au: '\ud83c\udfc6',
  Hg: '\ud83c\udf21\ufe0f',
  Tl: '\ud83d\udcca',
  Pb: '\ud83d\udd0b',
  Bi: '\ud83d\udc9c',
  Po: '\u2622\ufe0f',
  At: '\u269b\ufe0f',
  Rn: '\ud83d\udca8',
  Fr: '\ud83c\udf39',
  Ra: '\ud83d\udc80',
  Ac: '\ud83c\udf1f',
  Th: '\u2622\ufe0f',
  Pa: '\u26a1',
  U: '\u2622\ufe0f',
  Np: '\u2622\ufe0f',
  Pu: '\u2622\ufe0f',
  Am: '\u2622\ufe0f',
  Cm: '\u2622\ufe0f',
  Bk: '\u2622\ufe0f',
  Cf: '\u2622\ufe0f',
  Es: '\u2622\ufe0f',
  Fm: '\u2622\ufe0f',
  Md: '\u2622\ufe0f',
  No: '\u2622\ufe0f',
  Lr: '\u2622\ufe0f',
  Rf: '\u269b\ufe0f',
  Db: '\u269b\ufe0f',
  Sg: '\u269b\ufe0f',
  Bh: '\u269b\ufe0f',
  Hs: '\u269b\ufe0f',
  Mt: '\u269b\ufe0f',
  Ds: '\u269b\ufe0f',
  Rg: '\u269b\ufe0f',
  Cn: '\u269b\ufe0f',
  Nh: '\u269b\ufe0f',
  Fl: '\u269b\ufe0f',
  Mc: '\u269b\ufe0f',
  Lv: '\u269b\ufe0f',
  Ts: '\u269b\ufe0f',
  Og: '\u269b\ufe0f',
};

// ── Trend configs ───────────────────────────────────────────
const TRENDS = {
  group: {
    label: 'Gruppe',
    getValue: function (e) {
      return e[3];
    },
    getColor: function (val) {
      return getGroupColor(val);
    },
    format: function (val) {
      return String(val);
    },
  },
  electronegativity: {
    label: 'Elektronegativit\u00e4t',
    getValue: function (e) {
      return e[6];
    },
    getColor: function (val) {
      if (val === null || val === undefined) return 'rgba(100,100,100,0.5)';
      var t = (val - 0.7) / (4.0 - 0.7);
      t = Math.max(0, Math.min(1, t));
      return propertyColor(t);
    },
    format: function (val) {
      return val !== null ? val.toFixed(2) : '\u2014';
    },
  },
  radius: {
    label: 'Atomradius (pm)',
    getValue: function (e) {
      return e[8];
    },
    getColor: function (val) {
      if (val === null || val === undefined) return 'rgba(100,100,100,0.5)';
      var t = (val - 30) / (400 - 30);
      t = Math.max(0, Math.min(1, t));
      return propertyColor(1 - t);
    },
    format: function (val) {
      return val !== null ? val + ' pm' : '\u2014';
    },
  },
  ionization: {
    label: 'Ionisierungsenergie (eV)',
    getValue: function (e) {
      return e[9];
    },
    getColor: function (val) {
      if (val === null || val === undefined) return 'rgba(100,100,100,0.5)';
      var t = (val - 3.5) / (26.0 - 3.5);
      t = Math.max(0, Math.min(1, t));
      return propertyColor(t);
    },
    format: function (val) {
      return val !== null ? val.toFixed(2) + ' eV' : '\u2014';
    },
  },
  density: {
    label: 'Dichte (g/cm\u00b3)',
    getValue: function (e) {
      return e[5];
    },
    getColor: function (val) {
      if (val === null || val === undefined) return 'rgba(100,100,100,0.5)';
      var t = Math.log10(val + 0.001) / 2.0;
      t = (t + 1.0) / 2.0;
      t = Math.max(0, Math.min(1, t));
      return propertyColor(t);
    },
    format: function (val) {
      return val !== null ? val.toFixed(2) + ' g/cm\u00b3' : '\u2014';
    },
  },
  block: {
    label: 'Konfiguration (Block)',
    getValue: function (e) {
      if (e[10] === 'Lanthanoid' || e[10] === 'Actinoid') return 'f';
      var group = e[3];
      var match = (e[7] || '').match(
        /([spdfg])[\u00b9\u00b2\u00b3\u2070\u2074\u2075\u2076\u2077\u2078\u2079]*$/
      );
      if (match) {
        if (match[1] === 's' && group >= 3 && group <= 12) return 'd';
        return match[1];
      }
      if (group <= 2) return 's';
      if (group <= 12) return 'd';
      if (group <= 18) return 'p';
      return 'f';
    },
    getColor: function (val) {
      var colors = { s: '#4A90D9', p: '#50B86C', d: '#E67E22', f: '#9B59B6' };
      return colors[val] || 'rgba(100,100,100,0.5)';
    },
    format: function (val) {
      var labels = { s: 's-Block', p: 'p-Block', d: 'd-Block', f: 'f-Block' };
      return labels[val] || val;
    },
  },
};

var currentTrend = 'group';

function propertyColor(t) {
  var r = Math.round(30 + t * 220);
  var g = Math.round(200 - t * 180);
  var b = Math.round(60 + t * 60);
  return 'rgba(' + r + ',' + g + ',' + b + ',0.9)';
}

function getGroupColor(group) {
  var colors = {
    1: 'rgba(231, 76, 60, 0.9)',
    2: 'rgba(230, 126, 34, 0.9)',
    3: 'rgba(241, 196, 15, 0.85)',
    4: 'rgba(243, 156, 18, 0.85)',
    5: 'rgba(245, 176, 22, 0.85)',
    6: 'rgba(247, 196, 27, 0.85)',
    7: 'rgba(249, 216, 32, 0.85)',
    8: 'rgba(251, 236, 37, 0.85)',
    9: 'rgba(243, 156, 18, 0.85)',
    10: 'rgba(241, 196, 15, 0.85)',
    11: 'rgba(239, 176, 12, 0.85)',
    12: 'rgba(237, 156, 9, 0.85)',
    13: 'rgba(46, 204, 113, 0.9)',
    14: 'rgba(39, 174, 96, 0.9)',
    15: 'rgba(26, 188, 156, 0.9)',
    16: 'rgba(22, 160, 133, 0.9)',
    17: 'rgba(52, 152, 219, 0.9)',
    18: 'rgba(155, 89, 182, 0.9)',
    19: 'rgba(255, 105, 180, 0.85)',
    20: 'rgba(255, 0, 255, 0.85)',
  };
  return colors[group] || 'rgba(52, 73, 94, 0.9)';
}

function getElementColor(elemIdx) {
  var e = ELEMENTS[elemIdx];
  var trend = TRENDS[currentTrend];
  return trend.getColor(trend.getValue(e));
}

// ── Search state ────────────────────────────────────────────
var searchQuery = '';
var filteredIndices = null;

function matchesSearch(e, query) {
  if (!query) return true;
  var q = query.toLowerCase();
  return (
    e[0].toLowerCase().indexOf(q) !== -1 ||
    e[1].toLowerCase().indexOf(q) !== -1 ||
    e[11].toLowerCase().indexOf(q) !== -1 ||
    String(e[2]).indexOf(q) !== -1 ||
    String(e[3]).indexOf(q) !== -1
  );
}

function applySearch() {
  var q = searchQuery.trim().toLowerCase();
  if (!q) {
    filteredIndices = null;
    return;
  }
  filteredIndices = [];
  for (var i = 0; i < ELEMENTS.length; i++) {
    if (matchesSearch(ELEMENTS[i], q)) {
      filteredIndices.push(i);
    }
  }
}

// ── Three.js scene setup ────────────────────────────────────
var camera, scene, renderer;
var controls;
var objects = [];
var targets = { table: [], sphere: [], helix: [], grid: [] };

var tableOffsetX = -1330;
var tableOffsetY = 990;
var isMobile = false;

function updateCentering() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  isMobile = width < 768;
  var tableWidth = 18 * 140;
  var tableHeight = 10 * 180;
  tableOffsetX = -(tableWidth / 2) + 70;
  tableOffsetY = tableHeight / 2 - 90;
  if (isMobile) {
    var scale = Math.min(width / tableWidth, height / tableHeight) * 0.9;
    tableOffsetX = -((tableWidth * scale) / 2) + 70 * scale;
    tableOffsetY = (tableHeight * scale) / 2 - 90 * scale;
  }
}

// ── Init ────────────────────────────────────────────────────
init();
animate();

function init() {
  updateCentering();

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 5000;

  scene = new THREE.Scene();

  // Create CSS3D objects for each element
  for (var i = 0; i < ELEMENTS.length; i++) {
    var e = ELEMENTS[i];
    var el = document.createElement('div');
    el.className = 'element';

    var group = e[3];
    el.style.backgroundColor = getGroupColor(group);

    var number = document.createElement('div');
    number.className = 'number';
    number.textContent = i + 1;
    el.appendChild(number);

    var symbol = document.createElement('div');
    symbol.className = 'symbol';
    symbol.textContent = e[0];
    el.appendChild(symbol);

    var emojiLink = document.createElement('a');
    emojiLink.className = 'emoji-link';
    emojiLink.href = 'https://de.wikipedia.org/wiki/' + encodeURIComponent(e[1]);
    emojiLink.target = '_blank';
    emojiLink.rel = 'noopener noreferrer';
    emojiLink.textContent = ELEMENT_EMOJIS[e[0]] || '\u269b\ufe0f';
    el.appendChild(emojiLink);

    el.style.cursor = 'pointer';

    var details = document.createElement('div');
    details.className = 'details';
    details.innerHTML = e[1] + '<br>' + e[2];
    el.appendChild(details);

    var objectCSS = new CSS3DObject(el);
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;
    scene.add(objectCSS);
    objects.push(objectCSS);

    // Store element index on the DOM element for click handling
    el.dataset.elemIndex = i;

    el.addEventListener(
      'click',
      (function (idx) {
        return function () {
          showDetail(idx);
        };
      })(i)
    );

    // Table target
    var obj = new THREE.Object3D();
    obj.position.x = e[3] * 140 + tableOffsetX;
    obj.position.y = -(e[4] * 180) + tableOffsetY;
    targets.table.push(obj);
  }

  // Sphere targets
  var vector = new THREE.Vector3();
  for (var si = 0, sl = objects.length; si < sl; si++) {
    var phi = Math.acos(-1 + (2 * si) / sl);
    var theta = Math.sqrt(sl * Math.PI) * phi;
    var sobj = new THREE.Object3D();
    sobj.position.setFromSphericalCoords(800, phi, theta);
    vector.copy(sobj.position).multiplyScalar(2);
    sobj.lookAt(vector);
    targets.sphere.push(sobj);
  }

  // Helix targets
  for (var hi = 0, hl = objects.length; hi < hl; hi++) {
    var htheta = hi * 0.175 + Math.PI;
    var hy = -(hi * 8) + 450;
    var hobj = new THREE.Object3D();
    hobj.position.setFromCylindricalCoords(900, htheta, hy);
    vector.x = hobj.position.x * 2;
    vector.y = hobj.position.y;
    vector.z = hobj.position.z * 2;
    hobj.lookAt(vector);
    targets.helix.push(hobj);
  }

  // Grid targets
  for (var gi = 0; gi < objects.length; gi++) {
    var gobj = new THREE.Object3D();
    gobj.position.x = (gi % 5) * 400 - 800;
    gobj.position.y = -(Math.floor(gi / 5) % 5) * 400 + 800;
    gobj.position.z = Math.floor(gi / 25) * 1000 - 2000;
    targets.grid.push(gobj);
  }

  // Renderer
  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  // Controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener('change', render);

  // View buttons
  var viewIds = ['table', 'sphere', 'helix', 'grid'];
  for (var vi = 0; vi < viewIds.length; vi++) {
    (function (vid) {
      var btn = document.getElementById(vid);
      if (btn) {
        btn.addEventListener('click', function () {
          transform(targets[vid], 2000);
          setActiveButton(btn);
        });
      }
    })(viewIds[vi]);
  }

  transform(targets.table, 2000);
  var tableBtn = document.getElementById('table');
  if (tableBtn) setActiveButton(tableBtn);

  window.addEventListener('resize', onWindowResize);

  // ── Wire up search ──────────────────────────────────────
  var searchInput = document.getElementById('search-input');
  var searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value;
      applySearch();
      updateElementVisibility();
      if (searchClear) {
        searchClear.hidden = !searchQuery;
      }
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      searchClear.hidden = true;
      filteredIndices = null;
      updateElementVisibility();
    });
  }

  // ── Wire up trend buttons ───────────────────────────────
  var trendBtns = document.querySelectorAll('.trend-btn');
  for (var ti = 0; ti < trendBtns.length; ti++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var trend = btn.dataset.trend;
        if (trend && TRENDS[trend]) {
          setTrend(trend);
        }
      });
    })(trendBtns[ti]);
  }

  // ── Detail panel: persistent overlay, close only via X button ─
  var closeBtn = document.getElementById('detail-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideDetail);
  }
  // No overlay close — panel stays open until user clicks X or selects another element
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideDetail();
  });
}

function setTrend(trend) {
  currentTrend = trend;
  var btns = document.querySelectorAll('.trend-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.trend === trend);
  }
  updateElementColors();
}

function updateElementColors() {
  for (var i = 0; i < objects.length; i++) {
    var el = objects[i].element;
    if (el) {
      el.style.backgroundColor = getElementColor(i);
    }
  }
}

function updateElementVisibility() {
  for (var i = 0; i < objects.length; i++) {
    var el = objects[i].element;
    if (!el) continue;
    if (filteredIndices === null || filteredIndices.indexOf(i) !== -1) {
      el.style.display = '';
      el.style.opacity = '1';
    } else {
      el.style.display = '';
      el.style.opacity = '0.15';
    }
  }
}

function setActiveButton(activeButton) {
  var buttons = document.querySelectorAll('#menu button');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active-mode');
  }
  activeButton.classList.add('active-mode');
}

function transform(targetsArray, duration) {
  TWEEN.removeAll();
  for (var i = 0; i < objects.length; i++) {
    var object = objects[i];
    var target = targetsArray[i];
    new TWEEN.Tween(object.position)
      .to(
        { x: target.position.x, y: target.position.y, z: target.position.z },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
    new TWEEN.Tween(object.rotation)
      .to(
        { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }
  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}

function onWindowResize() {
  updateCentering();
  for (var i = 0; i < ELEMENTS.length; i++) {
    var idx = i;
    if (targets.table[idx]) {
      targets.table[idx].position.x = ELEMENTS[i][3] * 140 + tableOffsetX;
      targets.table[idx].position.y = -(ELEMENTS[i][4] * 180) + tableOffsetY;
    }
  }
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}

// ── Detail Panel ────────────────────────────────────────────
function showDetail(idx) {
  var e = ELEMENTS[idx];
  if (!e) return;

  var panel = document.getElementById('detail-panel');
  if (!panel) return;

  setText('detail-symbol', e[0]);
  setText('detail-name', e[1]);
  setText('d-atomic-number', idx + 1);
  setText('d-mass', String(e[2]));
  setText('d-density', e[5] ? e[5].toFixed(4) + ' g/cm\u00b3' : '\u2014');
  setText('d-electronegativity', e[6] !== null && e[6] !== undefined ? e[6].toFixed(2) : '\u2014');
  setText('d-config', e[7] || '\u2014');
  setText('d-radius', e[8] ? e[8] + ' pm' : '\u2014');
  setText('d-ionization', e[9] ? e[9].toFixed(2) + ' eV' : '\u2014');
  setText('d-category', e[10] || '\u2014');
  setText('d-period', String(e[4]));
  setText('d-group', String(e[3]));

  var wikiLink = document.getElementById('detail-wiki');
  if (wikiLink) {
    wikiLink.href = 'https://de.wikipedia.org/wiki/' + encodeURIComponent(e[1]);
  }

  panel.hidden = false;
}

function hideDetail() {
  var panel = document.getElementById('detail-panel');
  if (panel) panel.hidden = true;
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
