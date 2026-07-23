#!/usr/bin/env node

/**
 * Shared scraper utilities for Modulhandbuch scrapers.
 *
 * Provides:
 * - HTTP fetch with retry (2 retries) and rate limiting (1s between requests per domain)
 * - Normalized output schema
 * - Helper to write output JSON to myhugoapp/data/modulhandbuch/
 *
 * Usage:
 *   import { fetchWithRetry, writeOutput, MODULHANDBUCH_DIR } from './_scraper_utils.mjs';
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** Directory where scraped JSON output files go */
export const MODULHANDBUCH_DIR = path.resolve(REPO_ROOT, 'myhugoapp', 'data', 'modulhandbuch');

/** Per-domain last-request timestamps for rate limiting */
const lastRequestTime = new Map();

/**
 * HTTP(S) fetch with retry and rate limiting.
 *
 * @param {string} url - The URL to fetch
 * @param {object} [options]
 * @param {number} [options.retries=2] - Number of retries on failure
 * @param {number} [options.delayMs=1000] - Min ms between requests to same host
 * @param {number} [options.timeout=15000] - Request timeout in ms
 * @param {string} [options.userAgent] - User-Agent header
 * @returns {Promise<string>} Response body as text
 */
export function fetchWithRetry(url, options = {}) {
  const {
    retries = 2,
    delayMs = 1000,
    timeout = 15000,
    userAgent = 'Mozilla/5.0 (compatible; chemie-lernen-org-modulhandbuch/1.0)',
  } = options;

  return _fetchWithRetryInner(url, retries, { delayMs, timeout, userAgent });
}

function _fetchWithRetryInner(url, retriesLeft, config) {
  return new Promise((resolve, reject) => {
    const { delayMs, timeout, userAgent } = config;

    // Rate limiting: wait if we hit the same host too fast
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const now = Date.now();
    const lastReq = lastRequestTime.get(host) || 0;
    const waitMs = Math.max(0, delayMs - (now - lastReq));

    setTimeout(() => {
      lastRequestTime.set(host, Date.now());

      const mod = parsedUrl.protocol === 'https:' ? https : http;
      const req = mod.get(url, { headers: { 'User-Agent': userAgent }, timeout }, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          return resolve(_fetchWithRetryInner(redirectUrl, retriesLeft, config));
        }

        if (res.statusCode >= 400) {
          if (retriesLeft > 0) {
            return resolve(_retry(url, retriesLeft, config));
          }
          return resolve(null);
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });

      req.on('error', () => {
        if (retriesLeft > 0) {
          resolve(_retry(url, retriesLeft, config));
        } else {
          resolve(null);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (retriesLeft > 0) {
          resolve(_retry(url, retriesLeft, config));
        } else {
          resolve(null);
        }
      });
    }, waitMs);
  });
}

function _retry(url, retriesLeft, config) {
  const backoff = config.delayMs * (1 + Math.random() * 0.5);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(_fetchWithRetryInner(url, retriesLeft - 1, config));
    }, backoff);
  });
}

/**
 * Normalized module schema.
 *
 * @typedef {object} ModuleEntry
 * @property {string} id - Module identifier (e.g., "CHE-001")
 * @property {string} name - Module name (e.g., "Anorganische Chemie I")
 * @property {string} type - Module type (e.g., "Vorlesung", "Übung", "Seminar")
 * @property {number} credits - ECTS credits
 * @property {string} semester - Typical semester (e.g., "WS", "SS", "WS/SS")
 * @property {string} degree - Degree program (e.g., "Bachelor Lehramt Chemie")
 * @property {string} lecturer - Lecturer name
 * @property {string} description - Module description text
 * @property {string[]} topics - Extracted topic keywords
 * @property {string} url - Source URL
 */

/**
 * Normalized output schema.
 *
 * @typedef {object} ScraperOutput
 * @property {string} university - University name
 * @property {string} state - Federal state code (e.g., "BY", "NW")
 * @property {ModuleEntry[]} modules - Array of module entries
 * @property {string} scrapedAt - ISO timestamp of scrape
 */

/**
 * Create a normalized ScraperOutput object.
 *
 * @param {string} university - University name
 * @param {string} state - State code
 * @param {ModuleEntry[]} modules - Module entries
 * @returns {ScraperOutput}
 */
export function makeOutput(university, state, modules) {
  return {
    university,
    state,
    modules: modules.map((m) => ({
      id: m.id || '',
      name: m.name || '',
      type: m.type || 'Vorlesung',
      credits: typeof m.credits === 'number' ? m.credits : 0,
      semester: m.semester || 'WS/SS',
      degree: m.degree || '',
      lecturer: m.lecturer || '',
      description: m.description || '',
      topics: Array.isArray(m.topics) ? m.topics : [],
      url: m.url || '',
    })),
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Write scraper output to the modulhandbuch data directory.
 *
 * @param {string} filename - e.g., "by.json"
 * @param {ScraperOutput} data - Output object
 */
export function writeOutput(filename, data) {
  if (!fs.existsSync(MODULHANDBUCH_DIR)) {
    fs.mkdirSync(MODULHANDBUCH_DIR, { recursive: true });
  }
  const filePath = path.join(MODULHANDBUCH_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Written ${filePath} (${data.modules.length} modules)`);
}

/**
 * Extract topic keywords from a module description and name.
 * Simple keyword matching based on common chemistry terms.
 *
 * @param {string} name - Module name
 * @param {string} description - Module description
 * @returns {string[]}
 */
const CHEMISTRY_TOPICS = [
  'Atombau',
  'Periodensystem',
  'Chemische Bindung',
  'Anorganische Chemie',
  'Organische Chemie',
  'Physikalische Chemie',
  'Biochemie',
  'Analytische Chemie',
  'Thermodynamik',
  'Kinetik',
  'Spektroskopie',
  'Quantenchemie',
  'Elektrochemie',
  'Säuren',
  'Basen',
  'Redox',
  'Komplexchemie',
  'Nomenklatur',
  'Reaktionsmechanismen',
  'Stereochemie',
  'Katalyse',
  'Polymerchemie',
  'Kernchemie',
  'Umweltchemie',
  'Lebensmittelchemie',
];

export function extractTopics(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  return CHEMISTRY_TOPICS.filter((topic) => text.includes(topic.toLowerCase()));
}

/**
 * Extract a module ID from text like "CHE-001" or "MOD-1234".
 * @param {string} text
 * @returns {string}
 */
export function extractModuleId(text) {
  const match = text.match(/[A-ZÄÖÜ]{2,6}-\d{2,4}/);
  return match ? match[0] : `MOD-${Date.now()}`;
}

/**
 * Parse ECTS credits from a string.
 * @param {string} text
 * @returns {number}
 */
export function parseCredits(text) {
  if (!text) return 0;
  // Matches patterns like "6 LP", "6 ECTS", "6 CP", "6 Credits"
  const match = text.match(/(\d+[.,]?\d*)\s*(LP|ECTS|CP|Credits|SWS)/i);
  if (match) {
    return parseFloat(match[1].replace(',', '.')) || 0;
  }
  // Just a number
  const numMatch = text.match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1], 10) : 0;
}
