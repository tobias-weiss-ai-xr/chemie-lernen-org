#!/usr/bin/env node
/**
 * assign-hubs-scenes.mjs
 * -----------------------
 * Creates 5 themed Hubs scenes (one per archetype) from the pre-generated,
 * reticulum-hosted glTF GLB files and assigns each of the 120 per-element
 * learning rooms to the scene matching its `theme`.
 *
 * The GLB files live at:
 *   https://hubs.chemie-lernen.org/generated-scenes/<Archetype>.glb
 * (served by reticulum's page_controller render_for_path clause).
 *
 * Auth (one of):
 *   HUB_API_TOKEN            session token (Bearer) — preferred
 *   HUB_EMAIL + HUB_PASSWORD log in via POST /api/v1/accounts/login
 *
 * Other env:
 *   HUB_BASE_URL   default https://hubs.chemie-lernen.org
 *
 * Usage:
 *   node scripts/assign-hubs-scenes.mjs                # real run
 *   node scripts/assign-hubs-scenes.mjs --dry-run      # validate only, no API writes
 *   node scripts/assign-hubs-scenes.mjs --recreate     # ignore cached sids, force new scenes
 *
 * Idempotent: re-running reuses already-created scene sids (cached in
 * scripts/hubs-scenes/scene_sids.json) and only updates hubs whose scene_id
 * differs from the target.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const HUB_BASE_URL = process.env.HUB_BASE_URL || 'https://hubs.chemie-lernen.org';
const HUB_API_TOKEN = process.env.HUB_API_TOKEN || '';
const HUB_EMAIL = process.env.HUB_EMAIL || '';
const HUB_PASSWORD = process.env.HUB_PASSWORD || '';
const DRY_RUN = process.argv.includes('--dry-run');
const RECREATE = process.argv.includes('--recreate');

const ARCHETYPES = ['ElementRoom', 'PeriodicPavilion', 'LabWing', 'ExperimentalRoom', 'Lobby'];
const MANIFEST = join(ROOT, 'myhugoapp/static/data/chemie-raeume-manifest.json');
const THEME_MAP = join(__dirname, 'hubs-scenes/theme_to_archetype.json');
const SID_CACHE = join(__dirname, 'hubs-scenes/scene_sids.json');

function log(...a) { console.log(...a); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getToken() {
  if (HUB_API_TOKEN) return HUB_API_TOKEN;
  if (!HUB_EMAIL || !HUB_PASSWORD) {
    throw new Error('Auth required: set HUB_API_TOKEN or HUB_EMAIL+HUB_PASSWORD');
  }
  const res = await fetch(`${HUB_BASE_URL}/api/v1/accounts/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: HUB_EMAIL, password: HUB_PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const token = data.token || data.authToken || data.session_token;
  if (!token) throw new Error('login response had no token');
  return token;
}

function authHeaders(token) {
  return { 'content-type': 'application/json', Authorization: `Bearer ${token}` };
}

// Find an existing projectless scene by exact name (so re-runs are idempotent).
async function findExistingScene(token, name) {
  const res = await fetch(`${HUB_BASE_URL}/api/v1/scenes`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const scenes = data.scenes || data.data || [];
  return scenes.find((s) => s.name === name) || null;
}

function extractSid(scene) {
  return scene?.sid || scene?.data?.sid || scene?.scene?.sid || null;
}

async function createScene(token, archetype) {
  const name = `Chemie-Lernen ${archetype} v1`;
  const url = `${HUB_BASE_URL}/generated-scenes/${archetype}.glb`;
  if (!RECREATE) {
    const existing = await findExistingScene(token, name);
    if (existing) {
      const sid = extractSid(existing);
      if (sid) { log(`  reuse scene "${name}" -> ${sid}`); return sid; }
    }
  }
  if (DRY_RUN) { log(`  [dry-run] would POST scene "${name}" from ${url}`); return `DRYRUN-${archetype}`; }
  const res = await fetch(`${HUB_BASE_URL}/api/v1/scenes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ url, name }),
  });
  if (!res.ok) throw new Error(`scene create failed for ${archetype}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const sid = extractSid(data);
  if (!sid) throw new Error(`scene create returned no sid for ${archetype}: ${JSON.stringify(data).slice(0, 200)}`);
  log(`  created scene "${name}" -> ${sid}`);
  return sid;
}

async function assignSceneToHub(token, hubId, sid) {
  if (DRY_RUN) { log(`  [dry-run] would PATCH hub ${hubId} -> scene ${sid}`); return true; }
  const res = await fetch(`${HUB_BASE_URL}/api/v1/hubs/${hubId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ hub: { scene_id: sid } }),
  });
  if (!res.ok) {
    const body = await res.text();
    log(`  ! hub ${hubId} update failed: ${res.status} ${body.slice(0, 160)}`);
    return false;
  }
  return true;
}

async function main() {
  log(`HUB_BASE_URL=${HUB_BASE_URL}  DRY_RUN=${DRY_RUN}  RECREATE=${RECREATE}`);
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const elements = manifest.elements || manifest;
  const themeToArchetype = JSON.parse(readFileSync(THEME_MAP, 'utf8'));
  log(`manifest rooms: ${elements.length}`);

  // Load cached sids unless recreating.
  let sids = {};
  if (!RECREATE && existsSync(SID_CACHE)) {
    try { sids = JSON.parse(readFileSync(SID_CACHE, 'utf8')); } catch { sids = {}; }
  }

  let token = null;
  if (!DRY_RUN) token = await getToken();

  // 1) Create / resolve the 5 scenes.
  log('--- scenes ---');
  for (const a of ARCHETYPES) {
    sids[a] = await createScene(token, a);
    await sleep(150);
  }
  if (!DRY_RUN) writeFileSync(SID_CACHE, JSON.stringify(sids, null, 2));

  // 2) Assign each room to its archetype's scene.
  log('--- assign ---');
  let ok = 0, fail = 0, skip = 0;
  for (const el of elements) {
    const archetype = themeToArchetype[el.theme] || 'ElementRoom';
    const sid = sids[archetype];
    if (!sid) { log(`  ! no sid for archetype ${archetype} (room ${el.symbol})`); fail++; continue; }
    const done = await assignSceneToHub(token, el.hubId, sid);
    if (done) ok++; else fail++;
    await sleep(80);
  }
  log(`--- done: ok=${ok} fail=${fail} skip=${skip} ---`);
  if (fail > 0 && !DRY_RUN) process.exitCode = 1;
}

main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
