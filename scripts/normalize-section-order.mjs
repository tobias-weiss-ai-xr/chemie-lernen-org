#!/usr/bin/env node
/**
 * normalize-section-order.mjs
 *
 * Normalisiert die Sektion-Reihenfolge in allen Artikel-Markdown-Dateien
 * zu: ## Übungen → ## Verwandte Themen → ## Zusammenfassung
 *
 * Nur Sektionen auf Ebene ## (nicht ###) werden umgeordnet.
 * Frontmatter und nicht-standard-Sektionen bleiben erhalten.
 *
 * Aufruf: node scripts/normalize-section-order.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEMEN_DIR = path.resolve(__dirname, '..', 'myhugoapp', 'content', 'themenbereiche');

// Standard sections in desired order
const STANDARD_SECTIONS = ['## Übungen', '## Verwandte Themen', '## Zusammenfassung'];

function normalizeFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Split frontmatter from body
  const fmMatch = raw.match(/^---\n[\s\S]*?\n---\n/);
  if (!fmMatch) return false;
  const frontmatter = fmMatch[0];
  const body = raw.slice(fmMatch[0].length);

  // Find all ## sections with their content
  let currentSection = null;
  const lines = body.split('\n');
  let currentLines = [];
  const sectionMap = [];
  let nonStandardLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(## .+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentSection !== null) {
        sectionMap.push({
          heading: currentSection,
          content: currentLines.join('\n'),
        });
      } else if (currentLines.length > 0) {
        // Content before first ## heading
        nonStandardLines = currentLines;
      }

      currentSection = headingMatch[1];
      currentLines = [line];
    } else {
      if (currentLines.length > 0) {
        currentLines.push(line);
      } else {
        nonStandardLines.push(line);
      }
    }
  }

  // Save last section
  if (currentSection !== null) {
    sectionMap.push({
      heading: currentSection,
      content: currentLines.join('\n'),
    });
  }

  // Separate standard sections from non-standard
  const standardSections = [];
  const otherSections = [];

  for (const sec of sectionMap) {
    if (STANDARD_SECTIONS.includes(sec.heading)) {
      standardSections.push(sec);
    } else {
      otherSections.push(sec);
    }
  }

  // Reorder standard sections
  const orderedStandard = [];
  // First preserve existing content but in the right order
  for (const target of STANDARD_SECTIONS) {
    const found = standardSections.find(s => s.heading === target);
    if (found) {
      orderedStandard.push(found);
    }
  }

  // Also collect any standard sections not in our target order (shouldn't happen)
  const remainingStandard = standardSections.filter(
    s => !orderedStandard.includes(s)
  );

  // Build new body
  const allNonStandard = [...nonStandardLines];
  const otherContent = otherSections.map(s => s.content);

  const combined = [
    ...allNonStandard,
    '',
    ...otherContent,
    ...(otherContent.length > 0 && orderedStandard.length > 0 ? [''] : []),
    ...orderedStandard.map(s => s.content),
    ...remainingStandard.map(s => s.content),
  ];

  const newBody = combined.join('\n').replace(/\n{3,}/g, '\n\n');

  const fullContent = frontmatter + newBody;

  if (fullContent !== raw) {
    fs.writeFileSync(filePath, fullContent, 'utf-8');
    return true;
  }
  return false;
}

function main() {
  const bereiche = fs.readdirSync(THEMEN_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let changed = 0;
  let skipped = 0;
  let statistics = { ubungen: 0, verwandte: 0, zusammenfassung: 0, before_after: [] };

  for (const bereich of bereiche) {
    const dir = path.join(THEMEN_DIR, bereich);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== '_index.md');
    
    for (const file of files) {
      const fp = path.join(dir, file);
      const raw = fs.readFileSync(fp, 'utf-8');

      // Count which sections exist
      const hasUbungen = raw.includes('## Übungen');
      const hasVerwandte = raw.includes('## Verwandte Themen');
      const hasZusammenfassung = raw.includes('## Zusammenfassung');

      if (hasUbungen) statistics.ubungen++;
      if (hasVerwandte) statistics.verwandte++;
      if (hasZusammenfassung) statistics.zusammenfassung++;

      const changed_file = normalizeFile(fp);
      if (changed_file) {
        changed++;
        // Read back to verify order
        const newRaw = fs.readFileSync(fp, 'utf-8');
        const ubPos = newRaw.indexOf('## Übungen');
        const vtPos = newRaw.indexOf('## Verwandte Themen');
        const zfPos = newRaw.indexOf('## Zusammenfassung');

        let issue = '';
        if (hasUbungen && hasVerwandte && ubPos > vtPos) issue = ' Übungen_nach_VT';
        if (hasVerwandte && hasZusammenfassung && vtPos > zfPos) issue = ' VT_nach_ZF';
        
        statistics.before_after.push({
          file: `${bereich}/${file}`,
          before_issue: issue || 'OK',
        });

        console.log(`  ✅ ${bereich}/${file} (${issue || 'OK'})`);
      } else {
        skipped++;
      }
    }
  }

  console.log(`\nStatistiken:`);
  console.log(`  Artikel mit Übungen: ${statistics.ubungen}`);
  console.log(`  Artikel mit Verwandte Themen: ${statistics.verwandte}`);
  console.log(`  Artikel mit Zusammenfassung: ${statistics.zusammenfassung}`);
  console.log(`  Geändert: ${changed}`);
  console.log(`  Unverändert: ${skipped}`);
}

main();
