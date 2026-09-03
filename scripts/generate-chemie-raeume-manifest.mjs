#!/usr/bin/env node
/**
 * generate-chemie-raeume-manifest.mjs
 *
 * Regenerates the "Chemie Räume" element-room manifest consumed by
 * /chemie-raeume/ (chemie-raeume.js). Every element tile deep-links into the
 * per-element room of the walkable 3D periodic table hosted on GitHub Pages
 * (repo tobias-weiss-ai-xr/periodic-table):
 *
 *   https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/<NNN>-<name>.html
 *
 * NOTE (2026-09): the self-hosted hubs.chemie-lernen.org rooms are no longer
 * advertised — the instance stays up but is deprecated for promotion. The
 * `hubRoomUrl`/`hubId` fields were therefore removed from the manifest schema
 * (old entries: git history).
 *
 * Usage:
 *   node scripts/generate-chemie-raeume-manifest.mjs [IN_MANIFEST] [OUT_JSON]
 *   ROOMS_BASE_URL=<url> node scripts/generate-chemie-raeume-manifest.mjs
 *
 * The committed manifest is both input (metadata: German names, group
 * taxonomy, themes) and output target — re-run whenever room URLs change.
 * Output is committed so the directory page works without a build step.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOMS_BASE_URL =
  process.env.ROOMS_BASE_URL || 'https://tobias-weiss-ai-xr.github.io/periodic-table';

const IN_MANIFEST =
  process.argv[2] ||
  path.resolve(process.cwd(), 'myhugoapp/static/data/chemie-raeume-manifest.json');
const OUT = process.argv[3] || IN_MANIFEST;

if (!fs.existsSync(IN_MANIFEST)) {
  console.error(`Input manifest not found: ${IN_MANIFEST}`);
  process.exit(1);
}

/**
 * symbol -> [atomicNumber, englishName] on the GitHub Pages periodic table.
 * Room filenames follow roomHref() in its app.js:
 *   rooms/${String(n).padStart(3, '0')}-${name.toLowerCase()}.html
 * Derived once from https://tobias-weiss-ai-xr.github.io/periodic-table/assets/elements-data.js
 *
 * Known filename divergence: the rooms/ static files use the US spelling
 * 'cesium' (055-cesium.html) while elements-data.js carries 'Caesium'.
 */
const PERIODIC_TABLE = {
  H: [1, 'Hydrogen'],
  He: [2, 'Helium'],
  Li: [3, 'Lithium'],
  Be: [4, 'Beryllium'],
  B: [5, 'Boron'],
  C: [6, 'Carbon'],
  N: [7, 'Nitrogen'],
  O: [8, 'Oxygen'],
  F: [9, 'Fluorine'],
  Ne: [10, 'Neon'],
  Na: [11, 'Sodium'],
  Mg: [12, 'Magnesium'],
  Al: [13, 'Aluminium'],
  Si: [14, 'Silicon'],
  P: [15, 'Phosphorus'],
  S: [16, 'Sulfur'],
  Cl: [17, 'Chlorine'],
  Ar: [18, 'Argon'],
  K: [19, 'Potassium'],
  Ca: [20, 'Calcium'],
  Sc: [21, 'Scandium'],
  Ti: [22, 'Titanium'],
  V: [23, 'Vanadium'],
  Cr: [24, 'Chromium'],
  Mn: [25, 'Manganese'],
  Fe: [26, 'Iron'],
  Co: [27, 'Cobalt'],
  Ni: [28, 'Nickel'],
  Cu: [29, 'Copper'],
  Zn: [30, 'Zinc'],
  Ga: [31, 'Gallium'],
  Ge: [32, 'Germanium'],
  As: [33, 'Arsenic'],
  Se: [34, 'Selenium'],
  Br: [35, 'Bromine'],
  Kr: [36, 'Krypton'],
  Rb: [37, 'Rubidium'],
  Sr: [38, 'Strontium'],
  Y: [39, 'Yttrium'],
  Zr: [40, 'Zirconium'],
  Nb: [41, 'Niobium'],
  Mo: [42, 'Molybdenum'],
  Tc: [43, 'Technetium'],
  Ru: [44, 'Ruthenium'],
  Rh: [45, 'Rhodium'],
  Pd: [46, 'Palladium'],
  Ag: [47, 'Silver'],
  Cd: [48, 'Cadmium'],
  In: [49, 'Indium'],
  Sn: [50, 'Tin'],
  Sb: [51, 'Antimony'],
  Te: [52, 'Tellurium'],
  I: [53, 'Iodine'],
  Xe: [54, 'Xenon'],
  Cs: [55, 'Cesium'],
  Ba: [56, 'Barium'],
  La: [57, 'Lanthanum'],
  Ce: [58, 'Cerium'],
  Pr: [59, 'Praseodymium'],
  Nd: [60, 'Neodymium'],
  Pm: [61, 'Promethium'],
  Sm: [62, 'Samarium'],
  Eu: [63, 'Europium'],
  Gd: [64, 'Gadolinium'],
  Tb: [65, 'Terbium'],
  Dy: [66, 'Dysprosium'],
  Ho: [67, 'Holmium'],
  Er: [68, 'Erbium'],
  Tm: [69, 'Thulium'],
  Yb: [70, 'Ytterbium'],
  Lu: [71, 'Lutetium'],
  Hf: [72, 'Hafnium'],
  Ta: [73, 'Tantalum'],
  W: [74, 'Tungsten'],
  Re: [75, 'Rhenium'],
  Os: [76, 'Osmium'],
  Ir: [77, 'Iridium'],
  Pt: [78, 'Platinum'],
  Au: [79, 'Gold'],
  Hg: [80, 'Mercury'],
  Tl: [81, 'Thallium'],
  Pb: [82, 'Lead'],
  Bi: [83, 'Bismuth'],
  Po: [84, 'Polonium'],
  At: [85, 'Astatine'],
  Rn: [86, 'Radon'],
  Fr: [87, 'Francium'],
  Ra: [88, 'Radium'],
  Ac: [89, 'Actinium'],
  Th: [90, 'Thorium'],
  Pa: [91, 'Protactinium'],
  U: [92, 'Uranium'],
  Np: [93, 'Neptunium'],
  Pu: [94, 'Plutonium'],
  Am: [95, 'Americium'],
  Cm: [96, 'Curium'],
  Bk: [97, 'Berkelium'],
  Cf: [98, 'Californium'],
  Es: [99, 'Einsteinium'],
  Fm: [100, 'Fermium'],
  Md: [101, 'Mendelevium'],
  No: [102, 'Nobelium'],
  Lr: [103, 'Lawrencium'],
  Rf: [104, 'Rutherfordium'],
  Db: [105, 'Dubnium'],
  Sg: [106, 'Seaborgium'],
  Bh: [107, 'Bohrium'],
  Hs: [108, 'Hassium'],
  Mt: [109, 'Meitnerium'],
  Ds: [110, 'Darmstadtium'],
  Rg: [111, 'Roentgenium'],
  Cn: [112, 'Copernicium'],
  Nh: [113, 'Nihonium'],
  Fl: [114, 'Flerovium'],
  Mc: [115, 'Moscovium'],
  Lv: [116, 'Livermorium'],
  Ts: [117, 'Tennessine'],
  Og: [118, 'Oganesson'],
};

const pad3 = (n) => String(n).padStart(3, '0');
const roomHref = (n, en) => `rooms/${pad3(n)}-${en.toLowerCase()}.html`;

const old = JSON.parse(fs.readFileSync(IN_MANIFEST, 'utf8'));

const elements = (old.elements || [])
  .map((e) => {
    const pt = PERIODIC_TABLE[e.symbol];
    return {
      symbol: e.symbol,
      name: e.name,
      group: e.group,
      period: e.period ?? null,
      groupNumber: e.groupNumber ?? null,
      theme: e.theme || '',
      // Known element -> per-element room; anything else -> the main room.
      roomUrl: pt ? `${ROOMS_BASE_URL}/${roomHref(pt[0], pt[1])}` : `${ROOMS_BASE_URL}/`,
    };
  })
  .sort((a, b) => a.symbol.localeCompare(b.symbol));

const manifest = {
  generatedAt: new Date().toISOString(),
  roomsBaseUrl: ROOMS_BASE_URL,
  count: elements.length,
  elements,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${elements.length} element rooms (${ROOMS_BASE_URL}) to ${OUT}`);
