#!/usr/bin/env node
// Create the 5 themed scenes from the reticulum-hosted GLBs and save sids.
import { readFileSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.HUB_TOKEN;
const BASE = process.env.HUB_BASE_URL || 'https://hubs.chemie-lernen-org';
const ARCH = ['ElementRoom', 'PeriodicPavilion', 'LabWing', 'ExperimentalRoom', 'Lobby'];

function authH() { return { 'content-type': 'application/json', Authorization: `Bearer ${TOKEN}` }; }

async function createScene(a) {
  const url = `${BASE}/generated-scenes/${a}.glb`;
  const res = await fetch(`${BASE}/api/v1/scenes`, {
    method: 'POST',
    headers: authH(),
    body: JSON.stringify({ url, name: `Chemie-Lernen ${a} v1` }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`scene ${a}: HTTP ${res.status} ${text.slice(0, 300)}`);
  let d;
  try { d = JSON.parse(text); } catch { throw new Error(`scene ${a}: non-JSON ${text.slice(0, 200)}`); }
  const sid = d.sid || d.scene?.sid || d.data?.sid || (d.entries && d.entries[0]?.sid);
  console.log(`scene ${a}:`, JSON.stringify(d).slice(0, 240));
  if (!sid) throw new Error(`scene ${a}: no sid in ${JSON.stringify(d).slice(0, 200)}`);
  return sid;
}

async function main() {
  const sids = {};
  for (const a of ARCH) sids[a] = await createScene(a);
  writeFileSync('/tmp/scene_sids.json', JSON.stringify(sids, null, 2));
  console.log('SIDS:', JSON.stringify(sids));
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
