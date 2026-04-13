import * as THREE from 'three';

import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// Emoji mapping for chemical elements
const elementEmojis = {
  H: '💧',
  He: '🎈',
  Li: '🔋',
  Be: '💎',
  B: '💠',
  C: '💎',
  N: '💨',
  O: '🌬️',
  F: '🦷',
  Ne: '💡',
  Na: '🧂',
  Mg: '🔥',
  Al: '✈️',
  Si: '💻',
  P: '⚡',
  S: '🟡',
  Cl: '🧼',
  Ar: '🌬️',
  K: '🍌',
  Ca: '🦴',
  Sc: '⚔️',
  Ti: '🛡️',
  V: '⚡',
  Cr: '🔧',
  Mn: '⛏️',
  Fe: '🔩',
  Co: '🔵',
  Ni: '🪙',
  Cu: '🥉',
  Zn: '🔩',
  Ga: '💡',
  Ge: '💾',
  As: '☠️',
  Se: '🌙',
  Br: '🟤',
  Kr: '👻',
  Rb: '🔮',
  Sr: '🔴',
  Y: '💛',
  Zr: '⚪',
  Nb: '🔵',
  Mo: '⚫',
  Tc: '☢️',
  Ru: '👑',
  Rh: '🌟',
  Pd: '🪐',
  Ag: '🥈',
  Cd: '🎸',
  In: '📱',
  Sn: '🥫',
  Sb: '🗡️',
  Te: '🌕',
  I: '🟣',
  Xe: '💨',
  Cs: '⏰',
  Ba: '🏺',
  La: '🌿',
  Ce: '🌱',
  Pr: '🟢',
  Nd: '🔷',
  Pm: '☢️',
  Sm: '🟨',
  Eu: '🟥',
  Gd: '⬜',
  Tb: '🟩',
  Dy: '🟦',
  Ho: '🟪',
  Er: '🟥',
  Tm: '🟧',
  Yb: '🟫',
  Lu: '🌸',
  Hf: '🔶',
  Ta: '🔷',
  W: '💡',
  Re: '⚙️',
  Os: '🔵',
  Ir: '⚪',
  Pt: '🥇',
  Au: '🏆',
  Hg: '🌡️',
  Tl: '📊',
  Pb: '🔋',
  Bi: '💜',
  Po: '☢️',
  At: '⚛️',
  Rn: '💨',
  Fr: '🌹',
  Ra: '💀',
  Ac: '🌟',
  Th: '☢️',
  Pa: '⚡',
  U: '☢️',
  Np: '☢️',
  Pu: '☢️',
  Am: '☢️',
  Cm: '☢️',
  Bk: '☢️',
  Cf: '☢️',
  Es: '☢️',
  Fm: '☢️',
  Md: '☢️',
  No: '☢️',
  Lr: '☢️',
  Rf: '⚛️',
  Db: '⚛️',
  Sg: '⚛️',
  Bh: '⚛️',
  Hs: '⚛️',
  Mt: '⚛️',
  Ds: '⚛️',
  Rg: '⚛️',
  Cn: '⚛️',
  Nh: '⚛️',
  Fl: '⚛️',
  Mc: '⚛️',
  Lv: '⚛️',
  Ts: '⚛️',
  Og: '⚛️',
};

const table = [
  'H',
  'Hydrogen',
  '1.00794',
  1,
  1,
  'He',
  'Helium',
  '4.002602',
  18,
  1,
  'Li',
  'Lithium',
  '6.941',
  1,
  2,
  'Be',
  'Beryllium',
  '9.012182',
  2,
  2,
  'B',
  'Boron',
  '10.811',
  13,
  2,
  'C',
  'Carbon',
  '12.0107',
  14,
  2,
  'N',
  'Nitrogen',
  '14.0067',
  15,
  2,
  'O',
  'Oxygen',
  '15.9994',
  16,
  2,
  'F',
  'Fluorine',
  '18.9984032',
  17,
  2,
  'Ne',
  'Neon',
  '20.1797',
  18,
  2,
  'Na',
  'Sodium',
  '22.98976...',
  1,
  3,
  'Mg',
  'Magnesium',
  '24.305',
  2,
  3,
  'Al',
  'Aluminium',
  '26.9815386',
  13,
  3,
  'Si',
  'Silicon',
  '28.0855',
  14,
  3,
  'P',
  'Phosphorus',
  '30.973762',
  15,
  3,
  'S',
  'Sulfur',
  '32.065',
  16,
  3,
  'Cl',
  'Chlorine',
  '35.453',
  17,
  3,
  'Ar',
  'Argon',
  '39.948',
  18,
  3,
  'K',
  'Potassium',
  '39.948',
  1,
  4,
  'Ca',
  'Calcium',
  '40.078',
  2,
  4,
  'Sc',
  'Scandium',
  '44.955912',
  3,
  4,
  'Ti',
  'Titanium',
  '47.867',
  4,
  4,
  'V',
  'Vanadium',
  '50.9415',
  5,
  4,
  'Cr',
  'Chromium',
  '51.9961',
  6,
  4,
  'Mn',
  'Manganese',
  '54.938045',
  7,
  4,
  'Fe',
  'Iron',
  '55.845',
  8,
  4,
  'Co',
  'Cobalt',
  '58.933195',
  9,
  4,
  'Ni',
  'Nickel',
  '58.6934',
  10,
  4,
  'Cu',
  'Copper',
  '63.546',
  11,
  4,
  'Zn',
  'Zinc',
  '65.38',
  12,
  4,
  'Ga',
  'Gallium',
  '69.723',
  13,
  4,
  'Ge',
  'Germanium',
  '72.63',
  14,
  4,
  'As',
  'Arsenic',
  '74.9216',
  15,
  4,
  'Se',
  'Selenium',
  '78.96',
  16,
  4,
  'Br',
  'Bromine',
  '79.904',
  17,
  4,
  'Kr',
  'Krypton',
  '83.798',
  18,
  4,
  'Rb',
  'Rubidium',
  '85.4678',
  1,
  5,
  'Sr',
  'Strontium',
  '87.62',
  2,
  5,
  'Y',
  'Yttrium',
  '88.90585',
  3,
  5,
  'Zr',
  'Zirconium',
  '91.224',
  4,
  5,
  'Nb',
  'Niobium',
  '92.90628',
  5,
  5,
  'Mo',
  'Molybdenum',
  '95.96',
  6,
  5,
  'Tc',
  'Technetium',
  '(98)',
  7,
  5,
  'Ru',
  'Ruthenium',
  '101.07',
  8,
  5,
  'Rh',
  'Rhodium',
  '102.9055',
  9,
  5,
  'Pd',
  'Palladium',
  '106.42',
  10,
  5,
  'Ag',
  'Silver',
  '107.8682',
  11,
  5,
  'Cd',
  'Cadmium',
  '112.411',
  12,
  5,
  'In',
  'Indium',
  '114.818',
  13,
  5,
  'Sn',
  'Tin',
  '118.71',
  14,
  5,
  'Sb',
  'Antimony',
  '121.76',
  15,
  5,
  'Te',
  'Tellurium',
  '127.6',
  16,
  5,
  'I',
  'Iodine',
  '126.90447',
  17,
  5,
  'Xe',
  'Xenon',
  '131.293',
  18,
  5,
  'Cs',
  'Caesium',
  '132.9054',
  1,
  6,
  'Ba',
  'Barium',
  '132.9054',
  2,
  6,
  'La',
  'Lanthanum',
  '138.90547',
  4,
  9,
  'Ce',
  'Cerium',
  '140.116',
  5,
  9,
  'Pr',
  'Praseodymium',
  '140.90765',
  6,
  9,
  'Nd',
  'Neodymium',
  '144.242',
  7,
  9,
  'Pm',
  'Promethium',
  '(145)',
  8,
  9,
  'Sm',
  'Samarium',
  '150.36',
  9,
  9,
  'Eu',
  'Europium',
  '151.964',
  10,
  9,
  'Gd',
  'Gadolinium',
  '157.25',
  11,
  9,
  'Tb',
  'Terbium',
  '158.92535',
  12,
  9,
  'Dy',
  'Dysprosium',
  '162.5',
  13,
  9,
  'Ho',
  'Holmium',
  '164.93032',
  14,
  9,
  'Er',
  'Erbium',
  '167.259',
  15,
  9,
  'Tm',
  'Thulium',
  '168.93421',
  16,
  9,
  'Yb',
  'Ytterbium',
  '173.054',
  17,
  9,
  'Lu',
  'Lutetium',
  '174.9668',
  18,
  9,
  'Hf',
  'Hafnium',
  '178.49',
  4,
  6,
  'Ta',
  'Tantalum',
  '180.94788',
  5,
  6,
  'W',
  'Tungsten',
  '183.84',
  6,
  6,
  'Re',
  'Rhenium',
  '186.207',
  7,
  6,
  'Os',
  'Osmium',
  '190.23',
  8,
  6,
  'Ir',
  'Iridium',
  '192.217',
  9,
  6,
  'Pt',
  'Platinum',
  '195.084',
  10,
  6,
  'Au',
  'Gold',
  '196.966569',
  11,
  6,
  'Hg',
  'Mercury',
  '200.59',
  12,
  6,
  'Tl',
  'Thallium',
  '204.3833',
  13,
  6,
  'Pb',
  'Lead',
  '207.2',
  14,
  6,
  'Bi',
  'Bismuth',
  '208.9804',
  15,
  6,
  'Po',
  'Polonium',
  '(209)',
  16,
  6,
  'At',
  'Astatine',
  '(210)',
  17,
  6,
  'Rn',
  'Radon',
  '(222)',
  18,
  6,
  'Fr',
  'Francium',
  '(223)',
  1,
  7,
  'Ra',
  'Radium',
  '(226)',
  2,
  7,
  'Ac',
  'Actinium',
  '(227)',
  4,
  10,
  'Th',
  'Thorium',
  '232.03806',
  5,
  10,
  'Pa',
  'Protactinium',
  '231.0588',
  6,
  10,
  'U',
  'Uranium',
  '238.02891',
  7,
  10,
  'Np',
  'Neptunium',
  '(237)',
  8,
  10,
  'Pu',
  'Plutonium',
  '(244)',
  9,
  10,
  'Am',
  'Americium',
  '(243)',
  10,
  10,
  'Cm',
  'Curium',
  '(247)',
  11,
  10,
  'Bk',
  'Berkelium',
  '(247)',
  12,
  10,
  'Cf',
  'Californium',
  '(251)',
  13,
  10,
  'Es',
  'Einstenium',
  '(252)',
  14,
  10,
  'Fm',
  'Fermium',
  '(257)',
  15,
  10,
  'Md',
  'Mendelevium',
  '(258)',
  16,
  10,
  'No',
  'Nobelium',
  '(259)',
  17,
  10,
  'Lr',
  'Lawrencium',
  '(262)',
  18,
  10,
  'Rf',
  'Rutherfordium',
  '(267)',
  4,
  7,
  'Db',
  'Dubnium',
  '(268)',
  5,
  7,
  'Sg',
  'Seaborgium',
  '(271)',
  6,
  7,
  'Bh',
  'Bohrium',
  '(272)',
  7,
  7,
  'Hs',
  'Hassium',
  '(270)',
  8,
  7,
  'Mt',
  'Meitnerium',
  '(276)',
  9,
  7,
  'Ds',
  'Darmstadium',
  '(281)',
  10,
  7,
  'Rg',
  'Roentgenium',
  '(280)',
  11,
  7,
  'Cn',
  'Copernicium',
  '(285)',
  12,
  7,
  'Nh',
  'Nihonium',
  '(286)',
  13,
  7,
  'Fl',
  'Flerovium',
  '(289)',
  14,
  7,
  'Mc',
  'Moscovium',
  '(290)',
  15,
  7,
  'Lv',
  'Livermorium',
  '(293)',
  16,
  7,
  'Ts',
  'Tennessine',
  '(294)',
  17,
  7,
  'Og',
  'Oganesson',
  '(294)',
  18,
  7,
];

let camera, scene, renderer;
let controls;

const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

// Responsive centering configuration
let tableOffsetX = -1330;
let tableOffsetY = 990;
let isMobile = false;

// Detect mobile device and calculate centered offsets
function updateCentering() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width < 768;

  // Table dimensions: 18 columns × 140px = 2520px, 10 rows × 180px = 1800px
  const tableWidth = 18 * 140; // 2520
  const tableHeight = 10 * 180; // 1800

  // Calculate centered position
  // In CSS3D, (0,0) is center, so we need to offset by half dimensions
  tableOffsetX = -(tableWidth / 2) + 70; // +70 for half element width
  tableOffsetY = tableHeight / 2 - 90; // -90 for half element height

  // On mobile, apply additional offset to account for viewport
  if (isMobile) {
    // On mobile, scale down and adjust
    const scale = Math.min(width / tableWidth, height / tableHeight) * 0.9;
    // Adjust offset for scaled content
    tableOffsetX = -((tableWidth * scale) / 2) + 70 * scale;
    tableOffsetY = (tableHeight * scale) / 2 - 90 * scale;
  }
}

// Function to get element color based on group (column)
function getElementColor(group) {
  const colors = {
    // Alkali metals (Group 1) - Red
    1: 'rgba(231, 76, 60, 0.9)',
    // Alkaline earth metals (Group 2) - Orange
    2: 'rgba(230, 126, 34, 0.9)',
    // Transition metals (Groups 3-12) - Yellow/Gold
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
    // Boron group (Group 13) - Light green
    13: 'rgba(46, 204, 113, 0.9)',
    // Carbon group (Group 14) - Green
    14: 'rgba(39, 174, 96, 0.9)',
    // Nitrogen group (Group 15) - Teal
    15: 'rgba(26, 188, 156, 0.9)',
    // Chalcogens (Group 16) - Cyan
    16: 'rgba(22, 160, 133, 0.9)',
    // Halogens (Group 17) - Blue
    17: 'rgba(52, 152, 219, 0.9)',
    // Noble gases (Group 18) - Purple
    18: 'rgba(155, 89, 182, 0.9)',
    // Lanthanides - Pink
    19: 'rgba(255, 105, 180, 0.85)',
    // Actinides - Magenta
    20: 'rgba(255, 0, 255, 0.85)',
  };

  return colors[group] || 'rgba(52, 73, 94, 0.9)';
}

init();
animate();

function init() {
  // Calculate centering before setting up scene
  updateCentering();

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 5000;

  scene = new THREE.Scene();

  // table

  for (let i = 0; i < table.length; i += 5) {
    const element = document.createElement('div');
    element.className = 'element';

    // Get column (group) to determine color
    const group = table[i + 3];
    element.style.backgroundColor = getElementColor(group);

    const number = document.createElement('div');
    number.className = 'number';
    number.textContent = i / 5 + 1;
    element.appendChild(number);

    const symbol = document.createElement('div');
    symbol.className = 'symbol';
    symbol.textContent = table[i];
    element.appendChild(symbol);

    // Add emoji with Wikipedia link
    const emojiLink = document.createElement('a');
    emojiLink.className = 'emoji-link';
    emojiLink.href = `https://de.wikipedia.org/wiki/${table[i + 1]}`;
    emojiLink.target = '_blank';
    emojiLink.rel = 'noopener noreferrer';
    emojiLink.textContent = elementEmojis[table[i]] || '⚛️';
    element.appendChild(emojiLink);

    element.style.cursor = 'pointer';
    element.onclick = () => {
      window.open(`https://de.wikipedia.org/wiki/${table[i + 1]}`, '_blank');
    };

    const details = document.createElement('div');
    details.className = 'details';
    details.innerHTML = table[i + 1] + '<br>' + table[i + 2];
    element.appendChild(details);

    const objectCSS = new CSS3DObject(element);
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;
    scene.add(objectCSS);

    objects.push(objectCSS);

    //

    const object = new THREE.Object3D();
    object.position.x = table[i + 3] * 140 + tableOffsetX;
    object.position.y = -(table[i + 4] * 180) + tableOffsetY;

    targets.table.push(object);
  }

  // sphere

  const vector = new THREE.Vector3();

  for (let i = 0, l = objects.length; i < l; i++) {
    const phi = Math.acos(-1 + (2 * i) / l);
    const theta = Math.sqrt(l * Math.PI) * phi;

    const object = new THREE.Object3D();

    object.position.setFromSphericalCoords(800, phi, theta);

    vector.copy(object.position).multiplyScalar(2);

    object.lookAt(vector);

    targets.sphere.push(object);
  }

  // helix

  for (let i = 0, l = objects.length; i < l; i++) {
    const theta = i * 0.175 + Math.PI;
    const y = -(i * 8) + 450;

    const object = new THREE.Object3D();

    object.position.setFromCylindricalCoords(900, theta, y);

    vector.x = object.position.x * 2;
    vector.y = object.position.y;
    vector.z = object.position.z * 2;

    object.lookAt(vector);

    targets.helix.push(object);
  }

  // grid

  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();

    object.position.x = (i % 5) * 400 - 800;
    object.position.y = -(Math.floor(i / 5) % 5) * 400 + 800;
    object.position.z = Math.floor(i / 25) * 1000 - 2000;

    targets.grid.push(object);
  }

  //

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  //

  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener('change', render);

  const buttonTable = document.getElementById('table');
  buttonTable.addEventListener('click', function () {
    transform(targets.table, 2000);
    setActiveButton(buttonTable);
  });

  const buttonSphere = document.getElementById('sphere');
  buttonSphere.addEventListener('click', function () {
    transform(targets.sphere, 2000);
    setActiveButton(buttonSphere);
  });

  const buttonHelix = document.getElementById('helix');
  buttonHelix.addEventListener('click', function () {
    transform(targets.helix, 2000);
    setActiveButton(buttonHelix);
  });

  const buttonGrid = document.getElementById('grid');
  buttonGrid.addEventListener('click', function () {
    transform(targets.grid, 2000);
    setActiveButton(buttonGrid);
  });

  transform(targets.grid, 2000);
  setActiveButton(buttonGrid);

  //

  window.addEventListener('resize', onWindowResize);
}

// Function to set active button styling
function setActiveButton(activeButton) {
  const buttons = document.querySelectorAll('#menu button');

  buttons.forEach(function (button) {
    button.classList.remove('active-mode');
  });

  activeButton.classList.add('active-mode');
}

function transform(targets, duration) {
  TWEEN.removeAll();

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targets[i];

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
  // Recalculate centering on resize
  updateCentering();

  // Update table targets with new offsets
  for (let i = 0; i < table.length; i += 5) {
    const index = i / 5;
    if (targets.table[index]) {
      targets.table[index].position.x = table[i + 3] * 140 + tableOffsetX;
      targets.table[index].position.y = -(table[i + 4] * 180) + tableOffsetY;
    }
  }

  // Re-transform to current view with updated positions
  // eslint-disable-next-line no-unused-vars
  const currentView =
    document.querySelector('#menu button.active') ||
    document.querySelector('#menu button[style*="background-color: #007bff"]');

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
