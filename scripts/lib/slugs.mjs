#!/usr/bin/env node
/**
 * Node ESM mirror of the browser slug utility. Re-exports the exact same
 * function references by executing the shared IIFE via createRequire, so
 * client and build tooling cannot drift.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Execute the shared IIFE in this process → sets globalThis.Slugs
const SHARED = path.resolve(__dirname, '..', '..', 'myhugoapp', 'static', 'js', 'utils', 'slugs.js');
require(SHARED);

export const { slugify, entityUrl, rawSlug, Slugs } = globalThis.Slugs;