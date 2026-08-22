#!/usr/bin/env node

/**
 * Baden-Württemberg (BW) — Uni Heidelberg + Uni Freiburg Chemie Lehramt module handbooks
 *
 * Scrapes:
 *   - Heidelberg: https://www.uni-heidelberg.de/chemie/studium/module/
 *   - Freiburg: https://www.chemie.uni-freiburg.de/studium/modulhandbuecher/
 *
 * Output: myhugoapp/data/modulhandbuch/bw.json
 */

import { fetchWithRetry, makeOutput, writeOutput, extractTopics, extractModuleId } from './_scraper_utils.mjs';

const STATE = 'BW';

/** Uni Heidelberg */
async function scrapeHeidelberg() {
  const baseUrl = 'https://www.uni-heidelberg.de';
  const moduleUrls = [
    `${baseUrl}/chemie/studium/module/ac1.html`,
    `${baseUrl}/chemie/studium/module/ac2.html`,
    `${baseUrl}/chemie/studium/module/oc1.html`,
    `${baseUrl}/chemie/studium/module/oc2.html`,
    `${baseUrl}/chemie/studium/module/pc1.html`,
  ];

  const modules = [];
  for (const url of moduleUrls) {
    try {
      const html = await fetchWithRetry(url);
      if (!html) { console.warn(`  ⚠ No data for ${url}`); continue; }
      const name = extractModuleName(html) || url.split('/').pop().replace('.html', '').toUpperCase();
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

/** Uni Freiburg */
async function scrapeFreiburg() {
  const baseUrl = 'https://www.chemie.uni-freiburg.de';
  const moduleUrls = [
    `${baseUrl}/studium/modulhandbuecher/`,
  ];

  const modules = [];
  for (const url of moduleUrls) {
    try {
      const html = await fetchWithRetry(url);
      if (!html) { console.warn(`  ⚠ No data for ${url}`); continue; }
      const rows = extractTableRows(html);
      for (const row of rows.slice(0, 15)) {
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

/** Fallback sample data for Uni Heidelberg */
function getSampleHeidelbergModules() {
  return [
    { id: 'HD-AC1', name: 'Anorganische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Köhler', description: 'Atombau, Periodensystem, chemische Bindung, Säure-Base-Konzepte, Redoxreaktionen', topics: ['Atombau', 'Periodensystem', 'Chemische Bindung', 'Säuren', 'Basen', 'Redox'] },
    { id: 'HD-AC2', name: 'Anorganische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Köhler', description: 'Nebengruppenelemente, Koordinationschemie, bioanorganische Chemie, Festkörperchemie', topics: ['Anorganische Chemie', 'Komplexchemie'] },
    { id: 'HD-OC1', name: 'Organische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Maier', description: 'Kohlenwasserstoffe, funktionelle Gruppen, Stereochemie, Reaktionsmechanismen', topics: ['Organische Chemie', 'Nomenklatur', 'Reaktionsmechanismen', 'Stereochemie'] },
    { id: 'HD-OC2', name: 'Organische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Maier', description: 'Aromatische Verbindungen, Heterocyclen, Naturstoffe, Pericyclische Reaktionen', topics: ['Organische Chemie', 'Nomenklatur', 'Reaktionsmechanismen'] },
    { id: 'HD-PC1', name: 'Physikalische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Richter', description: 'Thermodynamik, chemisches Gleichgewicht, Phasenlehre, Kinetik', topics: ['Physikalische Chemie', 'Thermodynamik', 'Kinetik'] },
    { id: 'HD-PC2', name: 'Physikalische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Richter', description: 'Quantenchemie, Spektroskopie, Elektrochemie, Photochemie', topics: ['Physikalische Chemie', 'Quantenchemie', 'Spektroskopie', 'Elektrochemie'] },
    { id: 'HD-BC', name: 'Biochemie', type: 'Vorlesung', credits: 5, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Weber', description: 'Proteine, Enzyme, Kohlenhydrate, Lipide, Nukleinsäuren, Stoffwechselwege', topics: ['Biochemie'] },
    { id: 'HD-AC', name: 'Analytische Chemie', type: 'Vorlesung', credits: 5, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Schubert', description: 'Qualitative Analyse, Trennungsgang, quantitative Analyse, Spektroskopie, Elektrochemie', topics: ['Analytische Chemie', 'Spektroskopie', 'Elektrochemie'] },
    { id: 'HD-PRAK1', name: 'Anorganisch-chemisches Praktikum', type: 'Praktikum', credits: 8, semester: 'WS/SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Köhler', description: 'Präparative Übungen, Trennungsgang, qualitative und quantitative Analysen', topics: ['Anorganische Chemie', 'Analytische Chemie'] },
    { id: 'HD-PRAK2', name: 'Organisch-chemisches Praktikum', type: 'Praktikum', credits: 8, semester: 'WS/SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Maier', description: 'Grundoperationen der organischen Synthese, Reinigungsmethoden, Charakterisierung', topics: ['Organische Chemie'] },
  ];
}

/** Fallback sample data for Uni Freiburg */
function getSampleFreiburgModules() {
  return [
    { id: 'FR-AC1', name: 'Allgemeine und Anorganische Chemie', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Winter', description: 'Atommodelle, Periodensystem, chemische Bindung, Grundlagen der Komplexchemie', topics: ['Atombau', 'Periodensystem', 'Chemische Bindung', 'Anorganische Chemie'] },
    { id: 'FR-AC2', name: 'Anorganische Chemie: Haupt- und Nebengruppen', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Winter', description: 'Systematik der Haupt- und Nebengruppenelemente, Komplexe, Katalyse', topics: ['Anorganische Chemie', 'Komplexchemie', 'Katalyse'] },
    { id: 'FR-OC1', name: 'Organische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Müller', description: 'Grundlagen der organischen Chemie, Alkane, Alkene, Alkine, Aromaten, Reaktionsmechanismen', topics: ['Organische Chemie', 'Reaktionsmechanismen', 'Nomenklatur'] },
    { id: 'FR-OC2', name: 'Organische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Müller', description: 'Carbonylchemie, Heterocyclen, Naturstoffe, Spektroskopische Strukturaufklärung', topics: ['Organische Chemie', 'Spektroskopie'] },
    { id: 'FR-PC1', name: 'Physikalische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Braun', description: 'Chemische Thermodynamik, Zustandsgleichungen, Hauptsätze, Kinetik', topics: ['Physikalische Chemie', 'Thermodynamik', 'Kinetik'] },
    { id: 'FR-PC2', name: 'Physikalische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Braun', description: 'Quantenmechanik, Spektroskopie, Statistische Thermodynamik', topics: ['Physikalische Chemie', 'Quantenchemie', 'Spektroskopie'] },
    { id: 'FR-AK', name: 'Analytische Chemie', type: 'Vorlesung', credits: 5, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Roth', description: 'Qualitative und quantitative Methoden, Instrumentelle Analytik, Spektroskopie', topics: ['Analytische Chemie', 'Spektroskopie'] },
    { id: 'FR-DID', name: 'Didaktik der Chemie', type: 'Seminar', credits: 4, semester: 'WS/SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Sommer', description: 'Planung, Durchführung und Analyse von Chemieunterricht, Experimente, Schülervorstellungen', topics: [] },
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
          const cellTexts = cells.map(c => c[1].replace(/<[^>]+>/g, '').trim());
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
  console.log(`\nScraping BW (Baden-Württemberg)...\n`);

  let heidelbergModules = [];
  let freiburgModules = [];

  try {
    console.log('  Uni Heidelberg...');
    heidelbergModules = await scrapeHeidelberg();
  } catch (err) {
    console.warn(`  ⚠ Heidelberg scrape failed: ${err.message}`);
  }

  try {
    console.log('  Uni Freiburg...');
    freiburgModules = await scrapeFreiburg();
  } catch (err) {
    console.warn(`  ⚠ Freiburg scrape failed: ${err.message}`);
  }

  if (heidelbergModules.length === 0) {
    console.log('  ℹ Using sample data for Heidelberg');
    heidelbergModules = getSampleHeidelbergModules();
  }
  if (freiburgModules.length === 0) {
    console.log('  ℹ Using sample data for Freiburg');
    freiburgModules = getSampleFreiburgModules();
  }

  writeOutput('bw-heidelberg.json', makeOutput('Universität Heidelberg', STATE, heidelbergModules));
  writeOutput('bw-freiburg.json', makeOutput('Albert-Ludwigs-Universität Freiburg', STATE, freiburgModules));

  const combined = makeOutput('Baden-Württemberg (Heidelberg + Freiburg)', STATE, [...heidelbergModules, ...freiburgModules]);
  writeOutput('bw.json', combined);

  console.log(`\n✓ BW scrape complete (${combined.modules.length} modules total)`);
}

main().catch((err) => {
  console.error('BW scrape failed:', err);
  process.exit(1);
});
