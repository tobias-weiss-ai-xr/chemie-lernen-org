#!/usr/bin/env node
/**
 * export-kg-from-api.mjs — Export KG data from live API instead of Neo4j.
 *
 * Fetches from https://chemie-lernen.org/api/kg-data and writes to
 * myhugoapp/data/kg_data.json. This bypasses Neo4j connection issues
 * and uses the same data the D3 visualization already uses.
 *
 * Usage: node scripts/export-kg-from-api.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.resolve(__dirname, '..', 'myhugoapp', 'data', 'kg_data.json');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('[export-kg-from-api] Fetching from https://chemie-lernen.org/api/kg-data...');

  try {
    const data = await httpsGet('https://chemie-lernen.org/api/kg-data?limit=20000');

    const output = {
      exportedAt: new Date().toISOString(),
      source: 'api',
      entities: data.entities || [],
      articles: data.articles || [],
      curricula: data.curricula || [],
    };

    const dir = path.dirname(TARGET);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(TARGET, JSON.stringify(output, null, 2), 'utf-8');
    console.log('[export-kg-from-api] Written: ' + TARGET);
    console.log('[export-kg-from-api] ' + output.entities.length + ' entities, ' + output.articles.length + ' articles');
  } catch (err) {
    console.error('[export-kg-from-api] ERROR: ' + err.message);
    console.error('[export-kg-from-api] Existing file (if any) was NOT modified.');
    process.exit(1);
  }
}

main();