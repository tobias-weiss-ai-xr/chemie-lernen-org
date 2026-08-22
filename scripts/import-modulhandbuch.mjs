#!/usr/bin/env node
/**
 * Import university module catalogs from
 *   myhugoapp/data/modulhandbuch/*.json
 * into the central Neo4j KG (modulhandbuch subset per
 * openspec/specs/central-kg-architecture/spec.md).
 *
 * Idempotent: uses MERGE on (short_code) for University, on
 * (module_code, university_short_code) for Module, etc.
 *
 * Exits 0 on partial success (per the existing export-kg-data.mjs
 * pattern in this repo).
 *
 * Usage:
 *   node scripts/import-modulhandbuch.mjs
 *   node scripts/import-modulhandbuch.mjs --dry-run
 *   node scripts/import-modulhandbuch.mjs --file myhugoapp/data/modulhandbuch/mit.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import neo4j from 'neo4j-driver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(REPO_ROOT, 'myhugoapp', 'data', 'modulhandbuch');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

export const MODULHANDBUCH_LABELS = [
  'University',
  'UniversityModule',
  'Degree',
  'Lecturer',
  'ECTS',
  'ModuleOffering',
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const fileArg = args.find((a) => a.startsWith('--file='));
const singleFile = fileArg ? fileArg.slice('--file='.length) : null;

async function loadJson(filepath) {
  const raw = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(raw);
}
/**
 * Detects new Sprint-35 scraper format and normalizes to old format.
 * New: { university: "LMU München", state: "BY", modules: [{id, name, credits, ...}] }
 * Old: { university: {name, short_code, country, city, website}, modules: [{module_code, ...}] }
 */
function normalizeModuleData(catalog, filename) {
  if (!catalog || (typeof catalog.university === 'object' && catalog.university.short_code)) {
    return catalog;
  }
  const uniName = typeof catalog.university === 'string'
    ? catalog.university
    : (catalog.university?.name || path.basename(filename, '.json'));
  const shortCode = uniName
    .replace(/Universität\s+/gi, '')
    .replace(/University\s+/gi, '')
    .replace(/\(.*\)/, '')
    .replace(/\s+/g, '_')
    .substring(0, 20)
    .toLowerCase();
  const normalized = {
    university: { name: uniName, short_code: shortCode, country: 'DE', city: '', website: '' },
    modules: (catalog.modules || []).map((mod) => ({
      module_code: mod.id || mod.module_code || '',
      module_name: mod.name || mod.module_name || '',
      ects: mod.credits || mod.ects || 0,
      level: mod.type === 'Vorlesung' ? 'BSc' : (mod.level || 'BSc'),
      degree: mod.degree || '',
      url: mod.url || '',
      language: 'de',
      learning_outcomes: [],
      content: mod.topics || [],
      examination: '',
      offerings: mod.semester ? [{ semester: mod.semester, year: '' }] : [],
    })),
    degrees: [],
    lecturers: [],
  };
  const lecturerSet = new Set();
  for (const mod of catalog.modules || []) {
    if (mod.lecturer && !lecturerSet.has(mod.lecturer)) {
      lecturerSet.add(mod.lecturer);
      normalized.lecturers.push({ name: mod.lecturer, title: '', email: '', orcid: '' });
    }
  }
  return normalized;
}



async function importCatalog(driver, catalog, dryRun) {
  let count = { universities: 0, modules: 0, offerings: 0, lecturers: 0, degrees: 0, ects: 0 };
  if (dryRun) {
    console.log(`  [dry-run] Would import: ${catalog.university.name}`);
    count.universities = 1;
    count.modules = (catalog.modules || []).length;
    count.lecturers = (catalog.lecturers || []).length;
    count.degrees = (catalog.degrees || []).length;
    return count;
  }
  if (!driver) {
    console.warn('  [skip] no driver (dry-run mode)');
    return count;
  }
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const u = catalog.university;
    if (!u || !u.short_code || !u.name) {
      console.warn('  [skip] catalog missing university.short_code / .name');
      return count;
    }
    await session.run(
      `MERGE (u:University {short_code: $short_code})
       SET u.name = $name,
           u.country = $country,
           u.city = $city,
           u.website = $website`,
      {
        short_code: u.short_code,
        name: u.name,
        country: u.country || '',
        city: u.city || '',
        website: u.website || '',
      }
    );
    count.universities = 1;

    for (const deg of catalog.degrees || []) {
      await session.run(
        `MATCH (u:University {short_code: $short_code})
         MERGE (d:Degree {name: $name, university: $short_code})
         SET d.level = $level
         MERGE (u)-[:OFFERS_DEGREE]->(d)`,
        {
          short_code: u.short_code,
          name: deg.name,
          level: deg.level || 'BSc',
        }
      );
      count.degrees++;
    }

    for (const lec of catalog.lecturers || []) {
      await session.run(
        `MERGE (l:Lecturer {name: $name, university: $short_code})
         SET l.title = $title,
             l.email = $email,
             l.orcid = $orcid
         WITH l
         MATCH (u:University {short_code: $short_code})
         MERGE (l)-[:AFFILIATED_WITH]->(u)`,
        {
          short_code: u.short_code,
          name: lec.name,
          title: lec.title || '',
          email: lec.email || '',
          orcid: lec.orcid || '',
        }
      );
      count.lecturers++;
    }

    for (const mod of catalog.modules || []) {
      await session.run(
        `MATCH (u:University {short_code: $short_code})
         MERGE (m:UniversityModule {module_code: $module_code, university: $short_code})
         SET m.module_name = $module_name,
             m.ects = $ects,
             m.language = $language,
             m.level = $level,
             m.degree = $degree,
             m.url = $url,
             m.learning_outcomes = $learning_outcomes,
             m.content = $content,
             m.examination = $examination,
             m.last_checked = $last_checked
         MERGE (u)-[:OFFERS]->(m)`,
        {
          short_code: u.short_code,
          module_code: mod.module_code,
          module_name: mod.module_name,
          ects: mod.ects,
          language: mod.language || 'en',
          level: mod.level || 'BSc',
          degree: mod.degree || '',
          url: mod.url || '',
          learning_outcomes: mod.learning_outcomes || [],
          content: mod.content || [],
          examination: mod.examination || '',
          last_checked: mod.last_checked || new Date().toISOString(),
        }
      );
      count.modules++;

      await session.run(
        `MATCH (m:UniversityModule {module_code: $module_code, university: $short_code})
         MERGE (e:ECTS {module_code: $module_code, university: $short_code})
         SET e.credits = $ects,
             e.workload_hours = $workload_hours
         MERGE (m)-[:CARRIES]->(e)`,
        {
          short_code: u.short_code,
          module_code: mod.module_code,
          ects: mod.ects,
          workload_hours: Math.round(mod.ects * 30),
        }
      );
      count.ects++;

      for (const offering of mod.offerings || []) {
        await session.run(
          `MATCH (m:UniversityModule {module_code: $module_code, university: $short_code})
           MERGE (o:ModuleOffering {module_code: $module_code, university: $short_code, semester: $semester, year: $year})
           MERGE (m)-[:OFFERED_IN]->(o)`,
          {
            short_code: u.short_code,
            module_code: mod.module_code,
            semester: offering.semester,
            year: offering.year,
          }
        );
        count.offerings++;
      }
    }
  } finally {
    await session.close();
  }
  return count;
}

async function main() {
  console.log('=== import-modulhandbuch.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DATA_DIR: ${DATA_DIR}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);

  const files = singleFile
    ? [singleFile]
    : (await fs.readdir(DATA_DIR))
        .filter((f) => f.endsWith('.json'))
        .map((f) => path.join(DATA_DIR, f));

  if (DRY_RUN) {
    console.log('DRY-RUN: not connecting to Neo4j');
    for (const f of files) {
      const cat = await loadJson(f);
      const norm = normalizeModuleData(cat, f);
      const c = await importCatalog(null, norm, true);
      console.log(`  [dry-run] ${path.basename(f)}: ${JSON.stringify(c)}`);
    }
    return;
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const total = { universities: 0, modules: 0, offerings: 0, lecturers: 0, degrees: 0, ects: 0 };
  try {
    for (const f of files) {
      console.log(`Importing ${path.basename(f)} ...`);
      const cat = await loadJson(f);
      const norm = normalizeModuleData(cat, f);
      const c = await importCatalog(driver, norm, false);
      Object.keys(c).forEach((k) => {
        total[k] += c[k];
      });
      console.log(`  imported: ${JSON.stringify(c)}`);
    }
  } catch (e) {
    console.error('Import failed:', e.message);
  } finally {
    await driver.close();
  }
  console.log('=== totals ===');
  console.log(JSON.stringify(total, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
