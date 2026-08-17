#!/usr/bin/env node
/**
 * create-hubs-element-rooms.mjs
 *
 * Reproducible creation of ONE Hubs room per element, each representing that
 * element's "Lernraum". This is the fix for the „H room → Hubs Fair" problem:
 * instead of every element room falling back to the instance-default scene,
 * each element gets its own Hubs room named after the element.
 *
 * IMPORTANT (learned from the hubs-compose reticulum source):
 *   - The rooms API is `POST /api/v1/hubs` (NOT /api/v1/rooms in this Hubs
 *     build). The body must be wrapped: { "hub": { "name": ..., "description": ... } }.
 *   - Room creation REQUIRES an authenticated account
 *     (HubController.create -> Guardian.Plug.current_resource + can?(create_hub)).
 *     Anonymous creation is rejected. So you MUST authenticate (see AUTH below).
 *   - Listing existing hubs (GET /api/v1/hubs) also requires auth (403 anon).
 *
 * Modes:
 *   node scripts/create-hubs-element-rooms.mjs list     # print planned rooms (no creds)
 *   node scripts/create-hubs-element-rooms.mjs create   # create/update rooms (needs auth)
 *
 * AUTH (provide one):
 *   HUB_API_TOKEN       session token (sent as Bearer) — preferred
 *   HUB_EMAIL + HUB_PASSWORD   log in via POST /api/v1/accounts/login
 *
 * Env:
 *   HUB_BASE_URL   default https://hubs.chemie-lernen.org
 *
 * Idempotent: lists existing hubs, skips names that already exist, writes
 * hubRoomUrl back into the manifest so /chemie-raeume/ can show Hubs badges.
 */
import fs from 'node:fs';
import path from 'node:path';

const MODE = process.argv[2] || 'list';
const HUB_BASE_URL = process.env.HUB_BASE_URL || 'https://hubs.chemie-lernen.org';
const HUB_API_TOKEN = process.env.HUB_API_TOKEN || '';
const HUB_EMAIL = process.env.HUB_EMAIL || '';
const HUB_PASSWORD = process.env.HUB_PASSWORD || '';
const MANIFEST =
  process.env.MANIFEST ||
  path.resolve(process.cwd(), 'myhugoapp/static/data/chemie-raeume-manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

function roomName(e) {
  return `Chemie Raum – ${e.name} (${e.symbol})`;
}
function roomDescription(e) {
  const group = e.group || '';
  const mass = e.atomicMass ? ` Masse ${e.atomicMass}.` : '';
  return `Immersiver 3D-Lernraum für ${e.name} (${e.symbol}), Gruppe ${group}.${mass} Entdecke das Element im Periodensystem.`;
}

async function listRooms() {
  for (const e of manifest.elements) {
    console.log(`${roomName(e)}\t${roomDescription(e).slice(0, 60)}…`);
  }
  console.log(`\n${manifest.elements.length} element rooms planned.`);
}

async function getToken() {
  if (HUB_API_TOKEN) return HUB_API_TOKEN;
  if (!HUB_EMAIL || !HUB_PASSWORD) {
    throw new Error('Auth required: set HUB_API_TOKEN or HUB_EMAIL+HUB_PASSWORD');
  }
  const res = await fetch(`${HUB_BASE_URL}/api/v1/accounts/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: HUB_EMAIL, password: HUB_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: HTTP ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const token = data.token || data.authToken || data.session_token;
  if (!token) throw new Error('Login response had no token');
  return token;
}

async function listExistingHubs(token) {
  const res = await fetch(`${HUB_BASE_URL}/api/v1/hubs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`List hubs failed: HTTP ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // Newer Hubs returns { entries: [...] }; guard either shape.
  return Array.isArray(data) ? data : data.entries || [];
}

async function createRooms() {
  const token = await getToken();
  const existing = await listExistingHubs(token);
  const existingNames = new Set(existing.map((h) => h.name).filter(Boolean));

  const updated = [];
  for (const e of manifest.elements) {
    const name = roomName(e);
    if (existingNames.has(name)) {
      console.log(`Skip (exists): ${name}`);
      const ex = existing.find((h) => h.name === name);
      e.hubRoomUrl = ex?.url || ex?.hub_url || `${HUB_BASE_URL}/r/${ex?.id || ex?.sid}`;
      updated.push(e);
      continue;
    }
    try {
      const res = await fetch(`${HUB_BASE_URL}/api/v1/hubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hub: { name, description: roomDescription(e) },
        }),
      });
      if (!res.ok) {
        console.warn(`Skip ${name}: HTTP ${res.status} ${await res.text()}`);
        updated.push(e);
        continue;
      }
      const data = await res.json();
      e.hubRoomUrl = data.url || data.hub_url || `${HUB_BASE_URL}/r/${data.id || data.sid}`;
      console.log(`Created ${name} -> ${e.hubRoomUrl}`);
    } catch (err) {
      console.warn(`Skip ${name}: ${err.message}`);
    }
    updated.push(e);
  }

  const out = { ...manifest, elements: updated };
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2) + '\n');
  console.log(`Updated ${MANIFEST} with hubRoomUrl values.`);
}

if (MODE === 'list') {
  listRooms();
} else if (MODE === 'create') {
  await createRooms();
} else {
  console.error('Unknown mode:', MODE);
  process.exit(1);
}
