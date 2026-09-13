#!/usr/bin/env node
/**
 * apply-uxf-050-auth-init-observer.mjs — UXF-050: kein blinder 200ms-Retry
 * mehr im auth-client-Auto-Init.
 *
 * init() rief getUser() sofort + nochmal nach 200ms ("for dynamic nav
 * loading") — ein Rate-Spiel über das Navbar-Rendering. Seit UXF-046 ist
 * getUser() memoiziert, der Retry kostet also kein /me mehr, aber er ist
 * trotzdem unnötig + refresht das Auth-UI doppelt. Jetzt: MutationObserver
 * auf body — sobald eine .navbar-nav ohne .auth-menu-item auftaucht
 * (initial oder nach Re-Render), wird der Auth-Eintrag nachgesetzt
 * (memoizierter User, kein Netz-Call). Observer löst sich nach 10s auf.
 *
 * Idempotent: Edit nur wenn Marker fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const JS = path.join(ROOT, 'myhugoapp/static/js/auth-client.js');

const OLD = `  function init() {
    window.AuthClient.getUser().then(function (user) {
      if (user) {
        addAuthUI(user);
      } else {
        addAuthUI(null);
      }
    });
    // Also try again in 100ms (for dynamic nav loading)
    setTimeout(function () {
      window.AuthClient.getUser().then(function (user) {
        addAuthUI(user);
      });
    }, 200);
  }`;

const NEW = `  /* UXF-050: getUser ist memoiziert — init verursacht genau 1 /me-Call */
  function applyAuthUI() {
    window.AuthClient.getUser().then(addAuthUI);
  }

  /* UXF-050: statt blindem 200ms-Retry beobachten wir das DOM — sobald eine
     .navbar-nav ohne .auth-menu-item auftaucht (initial oder nach Re-Render),
     wird der Auth-Eintrag ohne Netz-Call nachgesetzt. */
  function watchDynamicNav() {
    if (typeof MutationObserver === 'undefined') return;
    var observer = new MutationObserver(function () {
      var nav = document.querySelector('.navbar-nav');
      if (nav && !nav.querySelector('.auth-menu-item')) {
        applyAuthUI();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      observer.disconnect();
    }, 10000);
  }

  function init() {
    applyAuthUI();
    watchDynamicNav();
  }`;

export function applyObserver(src) {
  if (src.includes('UXF-050')) return { changed: false, src };
  if (!src.includes(OLD)) return { changed: false, error: 'Anker nicht gefunden' };
  return { changed: true, src: src.replace(OLD, NEW) };
}

const isDirectRun =
  process.argv[1] && process.argv[1].endsWith('apply-uxf-050-auth-init-observer.mjs');
if (isDirectRun) {
  const before = fs.readFileSync(JS, 'utf8');
  const { changed, src, error } = applyObserver(before);
  if (error) {
    console.error(`apply-uxf-050-auth-init-observer: ${error}`);
    process.exit(1);
  }
  if (changed) fs.writeFileSync(JS, src);
  console.log(
    `apply-uxf-050-auth-init-observer: ${changed ? 'Observer statt 200ms-Retry eingebaut' : 'bereits vorhanden'}`
  );
}
