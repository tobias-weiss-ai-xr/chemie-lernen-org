#!/usr/bin/env node
/**
 * verify-uxf-049-stoech-alias.mjs — UXF-049 Verifikation:
 * Hugo-Build erzeugt Redirect-Seiten für /stoechiometrie/ und
 * /stoichiometrie/ auf /stoechiometrie-rechner/.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

export function checkRedirects(publicDir) {
  const missing = [];
  for (const alias of ['stoechiometrie', 'stoichiometrie']) {
    const idx = path.join(publicDir, alias, 'index.html');
    if (!fs.existsSync(idx)) {
      missing.push(alias);
      continue;
    }
    const html = fs.readFileSync(idx, 'utf8');
    if (!html.includes('/stoechiometrie-rechner/')) {
      missing.push(`${alias} (kein Redirect-Ziel)`);
    }
  }
  return missing;
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('verify-uxf-049-stoech-alias.mjs');
if (isDirectRun) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hugo-uxf049-'));
  try {
    execSync(`hugo --source myhugoapp --destination ${outDir} --quiet`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
    const missing = checkRedirects(outDir);
    if (missing.length) {
      console.error(`verify-uxf-049 FAILED — fehlende/kaputte Redirects: ${missing.join(', ')}`);
      process.exit(1);
    }
    console.log(
      'verify-uxf-049: OK — /stoechiometrie/ und /stoichiometrie/ redirecten auf /stoechiometrie-rechner/'
    );
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}
