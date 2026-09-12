#!/usr/bin/env node
/**
 * apply-uxf-047-lernpfade-gate.mjs — UXF-047: kein /gamification/profile-Call
 * für anonyme Besucher der Lernpfade-Seite (401-Console-Noise).
 *
 * lernpfade.js: lernpfadeInit() ruft loadProfile() unconditionally — anonym
 * → 401. Jetzt Auth-Gate via AuthClient.getUser(); der bestehende
 * unauthorized-Handler wird in renderLoginPrompt() extrahiert und auch im
 * anonym-Fall genutzt (statt versteckter Gamification: Login-Prompt).
 *
 * Idempotent: Edit nur wenn Marker fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const JS = path.join(ROOT, 'myhugoapp/static/js/lernpfade.js');

const INIT_OLD = `  /* ── Public entry point ── */
  window.lernpfadeInit = function () {
    loadPaths();
    loadProfile();
  };`;
const INIT_NEW = `  /* ── Public entry point ── */
  window.lernpfadeInit = function () {
    loadPaths();
    /* UXF-047: anonymous visitors never hit /gamification/profile (401 noise) */
    var auth = window.AuthClient;
    if (auth && typeof auth.getUser === 'function') {
      auth.getUser().then(function (user) {
        if (user) {
          loadProfile();
        } else {
          renderLoginPrompt();
        }
      });
    } else {
      /* AuthClient nicht geladen (alter Cache) — Legacy-Verhalten */
      loadProfile();
    }
  };`;

const HANDLER_OLD = `        if (err.message === 'unauthorized') {
          /* Hide gamification elements, show login prompt */
          var els = document.querySelectorAll(
            '.xp-section, .streak-section, .badge-section, .xp-log-section'
          );
          for (var i = 0; i < els.length; i++) {
            els[i].style.display = 'none';
          }
          var rec = getEl('recommendation-card');
          if (rec) {
            rec.innerHTML =
              '<div class="recommendation-login-prompt">' +
              '<h3><i class="fa fa-user"></i> Dein Lernpfad</h3>' +
              '<p>Melde dich an, um personalisierte Lernempfehlungen zu erhalten.</p>' +
              '<a href="/login/" class="btn btn-primary">Anmelden</a>' +
              '</div>';
          }
          return;
        }`;
const HANDLER_NEW = `        if (err.message === 'unauthorized') {
          /* UXF-047: geteilter Anmelde-Prompt (auch für anonyme Besucher) */
          renderLoginPrompt();
          return;
        }`;

const FN_ANCHOR = '  function loadProfile() {';
const FN_NEW = `  /* UXF-047: versteckt Gamification-Elemente und zeigt den Login-Prompt */
  function renderLoginPrompt() {
    var els = document.querySelectorAll(
      '.xp-section, .streak-section, .badge-section, .xp-log-section'
    );
    for (var i = 0; i < els.length; i++) {
      els[i].style.display = 'none';
    }
    var rec = getEl('recommendation-card');
    if (rec) {
      rec.innerHTML =
        '<div class="recommendation-login-prompt">' +
        '<h3><i class="fa fa-user"></i> Dein Lernpfad</h3>' +
        '<p>Melde dich an, um personalisierte Lernempfehlungen zu erhalten.</p>' +
        '<a href="/login/" class="btn btn-primary">Anmelden</a>' +
        '</div>';
    }
  }

  function loadProfile() {`;

export function applyGate(src) {
  if (src.includes('UXF-047')) return { changed: false, src };
  const anchors = [
    ['init', INIT_OLD, INIT_NEW],
    ['handler', HANDLER_OLD, HANDLER_NEW],
    ['fn', FN_ANCHOR, FN_NEW],
  ];
  let out = src;
  for (const [name, old, neu] of anchors) {
    if (!out.includes(old)) return { changed: false, error: `Anker nicht gefunden: ${name}` };
    out = out.replace(old, neu);
  }
  return { changed: true, src: out };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-uxf-047-lernpfade-gate.mjs');
if (isDirectRun) {
  const before = fs.readFileSync(JS, 'utf8');
  const { changed, src, error } = applyGate(before);
  if (error) {
    console.error(`apply-uxf-047-lernpfade-gate: ${error}`);
    process.exit(1);
  }
  if (changed) fs.writeFileSync(JS, src);
  console.log(
    `apply-uxf-047-lernpfade-gate: ${changed ? 'Auth-Gate eingebaut' : 'bereits vorhanden'}`
  );
}
