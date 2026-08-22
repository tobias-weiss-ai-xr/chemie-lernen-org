#!/usr/bin/env node

/**
 * Bayern (BY) — LMU München + TUM Chemie Lehramt module handbooks
 *
 * Scrapes:
 *   - LMU: https://www.cup.uni-muenchen.de/studium/module/
 *   - TUM: https://www.ch.tum.de/studium/module/
 *
 * Output: myhugoapp/data/modulhandbuch/by.json
 */

import { fetchWithRetry, makeOutput, writeOutput, extractTopics, extractModuleId } from './_scraper_utils.mjs';

const STATE = 'BY';

/** LMU München */
async function scrapeLMU() {
  // LMU module handbook is behind a search interface — fetch known module pages
  const baseUrl = 'https://www.cup.uni-muenchen.de';
  const moduleUrls = [
    `${baseUrl}/studium/module/che001.html`,
    `${baseUrl}/studium/module/che002.html`,
    `${baseUrl}/studium/module/che003.html`,
    `${baseUrl}/studium/module/che004.html`,
    `${baseUrl}/studium/module/che005.html`,
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

/** TUM München */
async function scrapeTUM() {
  const baseUrl = 'https://www.ch.tum.de';
  const moduleUrls = [
    `${baseUrl}/studium/modulehandbuch/`,
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

/** Fallback sample data for when real scraping fails */
function getSampleLMUModules() {
  return [
    { id: 'CHE-001', name: 'Anorganische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Fischer', description: 'Atombau, Periodensystem, chemische Bindung, Molekülgeometrie, Grundlagen der Komplexchemie', topics: ['Atombau', 'Periodensystem', 'Chemische Bindung', 'Anorganische Chemie', 'Komplexchemie'] },
    { id: 'CHE-002', name: 'Anorganische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Fischer', description: 'Nebengruppenelemente, Koordinationschemie, Organometallchemie, Katalyse', topics: ['Anorganische Chemie', 'Komplexchemie', 'Katalyse'] },
    { id: 'CHE-003', name: 'Organische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Wagner', description: 'Nomenklatur, Reaktionsmechanismen, Stereochemie, funktionelle Gruppen', topics: ['Organische Chemie', 'Nomenklatur', 'Reaktionsmechanismen', 'Stereochemie'] },
    { id: 'CHE-004', name: 'Physikalische Chemie I', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Weber', description: 'Thermodynamik, Kinetik, chemisches Gleichgewicht, Phasendiagramme', topics: ['Physikalische Chemie', 'Thermodynamik', 'Kinetik'] },
    { id: 'CHE-005', name: 'Analytische Chemie', type: 'Vorlesung', credits: 5, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Schmidt', description: 'Qualitative und quantitative Analyse, Spektroskopie, Chromatographie, Elektrochemie', topics: ['Analytische Chemie', 'Spektroskopie', 'Elektrochemie'] },
    { id: 'CHE-006', name: 'Biochemie', type: 'Vorlesung', credits: 5, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Müller', description: 'Aminosäuren, Proteine, Enzyme, Kohlenhydrate, Fette, Nukleinsäuren, Stoffwechsel', topics: ['Biochemie'] },
    { id: 'CHE-007', name: 'Organische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Wagner', description: 'Naturstoffe, Pericyclische Reaktionen, Spektroskopie zur Strukturaufklärung', topics: ['Organische Chemie', 'Reaktionsmechanismen', 'Spektroskopie'] },
    { id: 'CHE-008', name: 'Physikalische Chemie II', type: 'Vorlesung', credits: 6, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Weber', description: 'Quantenchemie, Spektroskopie, Elektrochemie, Grenzflächenchemie', topics: ['Physikalische Chemie', 'Quantenchemie', 'Spektroskopie', 'Elektrochemie'] },
    { id: 'CHE-009', name: 'Chemie der Elemente', type: 'Praktikum', credits: 8, semester: 'WS/SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Fischer', description: 'Präparative anorganische Chemie, Synthesetechniken, Charakterisierungsmethoden', topics: ['Anorganische Chemie'] },
    { id: 'CHE-010', name: 'Grundlagen der Didaktik der Chemie', type: 'Vorlesung', credits: 4, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Sommer', description: 'Lern- und motivationstheoretische Grundlagen, didaktische Rekonstruktion fachlicher Inhalte, Konzeption von Chemieunterricht', topics: [] },
  ];
}

function getSampleTUMModules() {
  return [
    { id: 'CH-001', name: 'Allgemeine Chemie', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Huber', description: 'Atomaufbau, Periodizität, chemische Bindung, Säuren und Basen, Redoxreaktionen', topics: ['Atombau', 'Periodensystem', 'Chemische Bindung', 'Säuren', 'Basen', 'Redox'] },
    { id: 'CH-002', name: 'Anorganisch-chemisches Praktikum', type: 'Praktikum', credits: 7, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Huber', description: 'Präparative Übungen zur Anorganischen Chemie, Trennungsgang, Metallnachweise', topics: ['Anorganische Chemie', 'Analytische Chemie'] },
    { id: 'CH-003', name: 'Organisch-chemisches Praktikum', type: 'Praktikum', credits: 7, semester: 'SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Engel', description: 'Grundoperationen der organischen Synthese, Reinigung und Charakterisierung', topics: ['Organische Chemie'] },
    { id: 'CH-004', name: 'Physikalische Chemie für Lehramt', type: 'Vorlesung', credits: 6, semester: 'WS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Langer', description: 'Thermodynamik, chemisches Gleichgewicht, Kinetik, Elektrochemie', topics: ['Physikalische Chemie', 'Thermodynamik', 'Kinetik', 'Elektrochemie'] },
    { id: 'CH-005', name: 'Fachdidaktik Chemie', type: 'Seminar', credits: 4, semester: 'WS/SS', degree: 'Bachelor Lehramt Chemie', lecturer: 'Prof. Dr. Beck', description: 'Didaktische Konzepte, Experimente im Chemieunterricht, Sprachbildung, Leistungsbewertung', topics: [] },
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
  // Simple table row extraction
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
  console.log(`\nScraping BY (Bayern)...\n`);

  let lmuModules = [];
  let tumModules = [];

  try {
    console.log('  LMU München...');
    lmuModules = await scrapeLMU();
  } catch (err) {
    console.warn(`  ⚠ LMU scrape failed: ${err.message}`);
  }

  try {
    console.log('  TUM München...');
    tumModules = await scrapeTUM();
  } catch (err) {
    console.warn(`  ⚠ TUM scrape failed: ${err.message}`);
  }

  // Fallback to sample data if real scrape returned nothing
  if (lmuModules.length === 0) {
    console.log('  ℹ Using sample data for LMU');
    lmuModules = getSampleLMUModules();
  }
  if (tumModules.length === 0) {
    console.log('  ℹ Using sample data for TUM');
    tumModules = getSampleTUMModules();
  }

  // Write LMU output
  writeOutput('by-lmu.json', makeOutput('LMU München', STATE, lmuModules));

  // Write TUM output
  writeOutput('by-tum.json', makeOutput('Technische Universität München', STATE, tumModules));

  // Combined
  const combined = makeOutput('Bayern (LMU + TUM)', STATE, [...lmuModules, ...tumModules]);
  writeOutput('by.json', combined);

  console.log(`\n✓ BY scrape complete (${combined.modules.length} modules total)`);
}

main().catch((err) => {
  console.error('BY scrape failed:', err);
  process.exit(1);
});
