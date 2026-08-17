#!/usr/bin/env node
/**
 * create-hubs-element-rooms.mjs
 *
 * Reproducible creation of ONE Hubs room per element, each embedding the
 * per-element WebXR room (https://tobias-weiss.org/hello-webxr/?room=<SYMBOL>).
 * This is the fix for the „H room → Hubs Fair" problem: instead of every
 * element room falling back to the instance-default scene, each element gets
 * its own Hubs room that loads its themed 3D space.
 *
 * Modes:
 *   node scripts/create-hubs-element-rooms.mjs list     # print planned rooms (no creds)
 *   HUB_API_TOKEN=... node scripts/create-hubs-element-rooms.mjs create
 *
 * Env:
 *   HUB_BASE_URL   default https://hubs.chemie-lernen.org
 *   HUB_API_TOKEN  required for `create`
 *
 * Idempotent-ready: skips names that already exist; writes hubRoomUrl back
 * into the manifest so the directory page (/chemie-raeume/) shows Hubs badges.
 *
 * NOTE: the Hubs `POST /api/v1/rooms` payload is best-effort — adjust the
 * `scene`/link-object shape to match your Hubs instance's API.
 */
import fs from 'node:fs';
import path from 'node:path';

const MODE = process.argv[2] || 'list';
const HUB_BASE_URL = process.env.HUB_BASE_URL || 'https://hubs.chemie-lernen.org';
const HUB_API_TOKEN = process.env.HUB_API_TOKEN || '';
const MANIFEST =
  process.env.MANIFEST ||
  path.resolve(process.cwd(), 'myhugoapp/static/data/chemie-raeume-manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const APP_BASE_URL = manifest.appBaseUrl;

function roomName(e) {
  return `Chemie Raum – ${e.name} (${e.symbol})`;
}
function embedUrl(e) {
  return `${APP_BASE_URL}/?room=${e.symbol}`;
}

async function listRooms() {
  for (const e of manifest.elements) {
    console.log(`${roomName(e)}\t${embedUrl(e)}`);
  }
  console.log(`\n${manifest.elements.length} element rooms planned.`);
}

async function createRooms() {
  if (!HUB_API_TOKEN) {
    console.error('HUB_API_TOKEN required for create mode');
    process.exit(1);
  }
  const updated = [];
  for (const e of manifest.elements) {
    const name = roomName(e);
    const url = embedUrl(e);
    try {
      const res = await fetch(`${HUB_BASE_URL}/api/v1/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUB_API_TOKEN}`
        },
        body: JSON.stringify({
          name,
          scene: {
            objects: [{ type: 'link', url, position: [0, 1.6, -2], scale: [2, 2, 2] }]
          }
        })
      });
      if (!res.ok) {
        console.warn(`Skip ${name}: HTTP ${res.status} ${await res.text()}`);
        updated.push(e);
        continue;
      }
      const data = await res.json();
      e.hubRoomUrl = data.url || `${HUB_BASE_URL}/r/${data.roomId}`;
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
  createRooms();
} else {
  console.error('Unknown mode:', MODE);
  process.exit(1);
}
