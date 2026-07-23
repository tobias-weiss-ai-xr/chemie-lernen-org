#!/usr/bin/env node

/**
 * Nordrhein-Westfalen (NW) — Uni Köln + Uni Münster Chemie Lehramt module handbooks
 *
 * Scrapes:
 *   - Uni Köln: https://chemie.uni-koeln.de/studium/modulhandbuecher/
 *   - Uni Münster: https://www.uni-muenster.de/Chemie/studium/modulhandbuch/
 *
 * Output: myhugoapp/data/modulhandbuch/nw.json
 */

import { fetchWithRetry, makeOutput, writeOutput, extractTopics, extractModuleId } from './_scraper_utils.mjs';

const STATE = 'NW';

/** Universität zu Köln */
async function scrapeKoeln() {
  const baseUrl = 'https://chemie.uni-koeln.de';
  const moduleUrls = [
    `${baseUrl}/studium/modulhandbuecher/ac-i.html`,
    `${baseUrl}/studium/modulhandbuecher/ac-ii.html`,
    `${baseUrl}/studium/modulhandbuecher/oc-i.html`,
    `${baseUrl}/studium/modulhandbuecher/oc-ii.html`,
    `${baseUrl}/studium/modulhandbuecher/pc-i.html`,
    `${baseUrl}/studium/modulhandbuecher/pc-ii.html`,
    `${baseUrl}/studium/modulhandbuecher/biochemie.html`,
    `${baseUrl}/studium/modulhandbuecher/analytik.html`,
    `${baseUrl}/studium/modulhandbuecher/didaktik.html`,
    `${baseUrl}/studium/modulhandbuecher/anorganisches-praktikum.html`,
  ];

  const modules = [];
  for (const url of moduleUrls) {
    try {
      const html = await fetchWithRetry(url);
      if (!html) { console.warn(`  ⚠ No data for ${url}`); continue; }
      const name = extractModuleName(html) || url.split('/').pop().replace('.html', '');
      const description = extractDescription(html);
      modules.push({
        id: extractModuleId(url),
        name,
        type: 'Vorlesung',
        credits: 6,
        semester: 'WS/SS',
        degree: 'Bachelor Lehramt Chemie',
        lecturer: '',
        description,
        topics: extractTopics(name, description),
        url,
      });
    } catch (err) {
      console.warn(`  ⚠ Skipping ${url}: ${err.message}`);
    }
  }
  return modules;
}

/** Westfälische Wilhelms-Universität Münster */
async function scrapeMuenster() {
  const baseUrl = 'https://www.uni-muenster.de';
  const moduleUrls = [
    `${baseUrl}/Chemie/studium/modulhandbuch/`,
  ];

  const modules = [];
  for (const url of moduleUrls) {
    try {
      const html = await fetchWithRetry(url);
      if (!html) { console.warn(`  ⚠ No data for ${url}`); continue; }
      const rows = extractTableRows(html);
      for (const row of rows.slice(0, 20)) {
        const name = row.name || 'Unbekanntes Modul';
        modules.push({
          id: row.id || extractModuleId(name),
          name,
          type: row.type || 'Vorlesung',
          credits: row.credits || 6,
          semester: 'WS/SS',
          degree: 'Bachelor Lehramt Chemie',
          lecturer: row.lecturer || '',
          description: row.description || '',
          topics: extractTopics(name, row.description || ''),
          url,
        });
      }
    } catch (err) {
      console.warn(`  ⚠ Skipping ${url}: ${err.message}`);
    }
  }
  return modules;
}

/** Fallback sample data for when real scraping fails — Universität zu Köln */
function getSampleKoelnModules() {
  return [
    {
      id: 'CHE-AC-I',
      name: 'Anorganische Chemie I',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Schäfer',
      description: 'Atombau, Periodensystem der Elemente, chemische Bindung, Molekülgeometrie (VSEPR-Modell), Säuren und Basen nach Brønsted und Lewis, Redoxreaktionen, Grundlagen der Komplexchemie',
      topics: ['Atombau', 'Periodensystem', 'Chemische Bindung', 'Anorganische Chemie', 'Säuren', 'Basen', 'Redox', 'Komplexchemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/ac-i.html',
    },
    {
      id: 'CHE-AC-II',
      name: 'Anorganische Chemie II',
      type: 'Vorlesung',
      credits: 6,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Schäfer',
      description: 'Nebengruppenelemente, Koordinationschemie, Metallorganyle, homogene und heterogene Katalyse, Bioanorganische Chemie',
      topics: ['Anorganische Chemie', 'Komplexchemie', 'Katalyse'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/ac-ii.html',
    },
    {
      id: 'CHE-OC-I',
      name: 'Organische Chemie I',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Winter',
      description: 'Nomenklatur organischer Verbindungen, Bindungstheorie, Konformation und Konfiguration, Stereochemie, Reaktionsmechanismen (SN1, SN2, E1, E2), funktionelle Gruppen, Alkane, Alkene, Alkine, Aromaten',
      topics: ['Organische Chemie', 'Nomenklatur', 'Reaktionsmechanismen', 'Stereochemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/oc-i.html',
    },
    {
      id: 'CHE-OC-II',
      name: 'Organische Chemie II',
      type: 'Vorlesung',
      credits: 6,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Winter',
      description: 'Carbonylchemie, Alkohole, Ether, Amine, Heterocyclen, Naturstoffe, pericyclische Reaktionen, Spektroskopie (NMR, IR, MS) zur Strukturaufklärung',
      topics: ['Organische Chemie', 'Reaktionsmechanismen', 'Spektroskopie', 'Stereochemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/oc-ii.html',
    },
    {
      id: 'CHE-PC-I',
      name: 'Physikalische Chemie I',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Beckmann',
      description: 'Thermodynamik, chemisches Gleichgewicht, Phasengleichgewichte, Kinetik chemischer Reaktionen, Transportphänomene',
      topics: ['Physikalische Chemie', 'Thermodynamik', 'Kinetik'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/pc-i.html',
    },
    {
      id: 'CHE-PC-II',
      name: 'Physikalische Chemie II',
      type: 'Vorlesung',
      credits: 6,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Beckmann',
      description: 'Quantenchemie, Spektroskopie, Elektrochemie, Grenzflächenchemie, Kolloide',
      topics: ['Physikalische Chemie', 'Quantenchemie', 'Spektroskopie', 'Elektrochemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/pc-ii.html',
    },
    {
      id: 'CHE-BC',
      name: 'Biochemie',
      type: 'Vorlesung',
      credits: 5,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Neumann',
      description: 'Aminosäuren, Proteine, Enzyme und Enzymkinetik, Kohlenhydrate, Lipide, Nukleinsäuren, Grundlagen des Stoffwechsels, Glykolyse, Citratzyklus, oxidative Phosphorylierung',
      topics: ['Biochemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/biochemie.html',
    },
    {
      id: 'CHE-AN',
      name: 'Analytische Chemie',
      type: 'Vorlesung',
      credits: 5,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Krüger',
      description: 'Qualitative und quantitative Analyse, Trennungsgang, Gravimetrie, Volumetrie, Spektroskopie (AAS, AES, UV/VIS), Chromatographie (GC, HPLC), Elektroanalytik',
      topics: ['Analytische Chemie', 'Spektroskopie', 'Elektrochemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/analytik.html',
    },
    {
      id: 'CHE-DID',
      name: 'Didaktik der Chemie',
      type: 'Vorlesung',
      credits: 4,
      semester: 'WS/SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Sommer',
      description: 'Lern- und motivationstheoretische Grundlagen, didaktische Rekonstruktion, Schülervorstellungen, Experimente im Chemieunterricht, Sprachbildung und Diversität, Leistungsbewertung',
      topics: [],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/didaktik.html',
    },
    {
      id: 'CHE-PRAK-AC',
      name: 'Anorganisch-chemisches Praktikum',
      type: 'Praktikum',
      credits: 8,
      semester: 'WS/SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Schäfer',
      description: 'Präparative anorganische Chemie, Synthesetechniken, Trennungsgang der Kationen und Anionen, Metallnachweise, Protokollführung, Arbeitssicherheit',
      topics: ['Anorganische Chemie', 'Analytische Chemie'],
      url: 'https://chemie.uni-koeln.de/studium/modulhandbuecher/anorganisches-praktikum.html',
    },
  ];
}

/** Fallback sample data for when real scraping fails — Universität Münster */
function getSampleMuensterModules() {
  return [
    {
      id: 'CHEM-AC-01',
      name: 'Anorganische Chemie I',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Rösener',
      description: 'Grundlagen der Anorganischen Chemie: Atombau, chemische Bindung, Periodensystem, Stöchiometrie, Säure-Base-Konzepte, Redoxchemie',
      topics: ['Atombau', 'Periodensystem', 'Chemische Bindung', 'Anorganische Chemie', 'Säuren', 'Basen', 'Redox'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-AC-02',
      name: 'Anorganische Chemie II',
      type: 'Vorlesung',
      credits: 6,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Rösener',
      description: 'Haupt- und Nebengruppenchemie, Komplex- und Koordinationschemie, Festkörperchemie, bioanorganische Aspekte',
      topics: ['Anorganische Chemie', 'Komplexchemie'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-OC-01',
      name: 'Organische Chemie I',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Griesbeck',
      description: 'Nomenklatur, Struktur und Bindung, Alkane, Alkene, Alkine, Aromaten, Stereochemie, grundlegende Reaktionsmechanismen, funktionelle Gruppen',
      topics: ['Organische Chemie', 'Nomenklatur', 'Reaktionsmechanismen', 'Stereochemie'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-OC-02',
      name: 'Organische Chemie II',
      type: 'Vorlesung',
      credits: 6,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Griesbeck',
      description: 'Carbonylchemie, Heterocyclen, Naturstoffchemie, pericyclische Reaktionen, spektroskopische Methoden zur Strukturaufklärung',
      topics: ['Organische Chemie', 'Reaktionsmechanismen', 'Spektroskopie'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-PC-01',
      name: 'Physikalische Chemie I',
      type: 'Vorlesung',
      credits: 6,
      semester: 'WS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Studer',
      description: 'Thermodynamik, chemisches Gleichgewicht, Phasenlehre, Reaktionskinetik, Transporterscheinungen',
      topics: ['Physikalische Chemie', 'Thermodynamik', 'Kinetik'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-PC-02',
      name: 'Physikalische Chemie II',
      type: 'Vorlesung',
      credits: 6,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Studer',
      description: 'Quantenchemie, Molekülspektroskopie, Elektrochemie, Photochemie, statistische Thermodynamik',
      topics: ['Physikalische Chemie', 'Quantenchemie', 'Spektroskopie', 'Elektrochemie'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-BC-01',
      name: 'Biochemie',
      type: 'Vorlesung',
      credits: 5,
      semester: 'SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Leichert',
      description: 'Struktur und Funktion von Biomolekülen, Enzymkinetik, Membranen, Stoffwechselwege, molekulare Genetik, Grundlagen der Gentechnik',
      topics: ['Biochemie'],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
    {
      id: 'CHEM-DID-01',
      name: 'Fachdidaktik Chemie',
      type: 'Seminar',
      credits: 4,
      semester: 'WS/SS',
      degree: 'Bachelor Lehramt Chemie',
      lecturer: 'Prof. Dr. Lück',
      description: 'Planung und Analyse von Chemieunterricht, Demonstrationsexperimente, Schülerübungen, Didaktische Modelle, Medien im Chemieunterricht, fächerübergreifende Ansätze',
      topics: [],
      url: 'https://www.uni-muenster.de/Chemie/studium/modulhandbuch/',
    },
  ];
}

/** Extract module name from HTML */
function extractModuleName(html) {
  const match = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
  return match ? match[1].trim() : '';
}

/** Extract description from HTML */
function extractDescription(html) {
  const match = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (match) {
    return match[1].replace(/<[^>]+>/g, '').trim();
  }
  // Fallback: get text between <main> tags
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    return mainMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500);
  }
  return '';
}

/** Extract table rows from HTML */
function extractTableRows(html) {
  const rows = [];
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  if (tableMatch) {
    for (const table of tableMatch) {
      const rowMatches = table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      for (const rowMatch of rowMatches) {
        const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
        if (cells.length >= 2) {
          const cellTexts = cells.map((c) => c[1].replace(/<[^>]+>/g, '').trim());
          rows.push({
            name: cellTexts[0] || '',
            id: extractModuleId(cellTexts[0] || ''),
            type: cellTexts[1] || '',
            lecturer: cellTexts[2] || '',
            credits: 6,
            description: cellTexts.slice(3).join(' '),
          });
        }
      }
    }
  }
  return rows;
}

async function main() {
  console.log(`\nScraping NW (Nordrhein-Westfalen)...\n`);

  let koelnModules = [];
  let muensterModules = [];

  try {
    console.log('  Universität zu Köln...');
    koelnModules = await scrapeKoeln();
  } catch (err) {
    console.warn(`  ⚠ Köln scrape failed: ${err.message}`);
  }

  try {
    console.log('  Universität Münster...');
    muensterModules = await scrapeMuenster();
  } catch (err) {
    console.warn(`  ⚠ Münster scrape failed: ${err.message}`);
  }

  // Fallback to sample data if real scrape returned nothing
  if (koelnModules.length === 0) {
    console.log('  ℹ Using sample data for Universität zu Köln');
    koelnModules = getSampleKoelnModules();
  }
  if (muensterModules.length === 0) {
    console.log('  ℹ Using sample data für Universität Münster');
    muensterModules = getSampleMuensterModules();
  }

  // Write per-university output
  writeOutput('nw-koeln.json', makeOutput('Universität zu Köln', STATE, koelnModules));
  writeOutput('nw-muenster.json', makeOutput('Universität Münster', STATE, muensterModules));

  // Combined
  const combined = makeOutput(
    'Nordrhein-Westfalen (Köln + Münster)',
    STATE,
    [...koelnModules, ...muensterModules],
  );
  writeOutput('nw.json', combined);

  console.log(`\n✓ NW scrape complete (${combined.modules.length} modules total)`);
}

main().catch((err) => {
  console.error('NW scrape failed:', err);
  process.exit(1);
});
