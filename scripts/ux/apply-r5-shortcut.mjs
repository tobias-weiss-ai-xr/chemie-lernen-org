/**
 * apply-r5-shortcut.mjs — UXF-021: „/"-Shortcut fokussiert das Suchfeld
 *
 * Standard-Pattern (GitHub, MDN, Docs-Seiten): „/" springt in die Suche.
 * Global geladen (head.html), respektiert Texteingaben (kein Abgreifen, wenn
 * bereits in input/textarea/select/contenteditable getippt wird) und Modifika-
 * toren (Strg/Alt/Meta). Escape verlässt das Feld wieder (blurt).
 *
 * Dateien: NEU static/js/search-shortcut.js + Script-Tag in head.html
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const JS = path.join(REPO_ROOT, 'myhugoapp/static/js/search-shortcut.js');
const HEAD = path.join(REPO_ROOT, 'myhugoapp/layouts/partials/head.html');

function fail(task, anchor) {
  throw new Error(`[${task}] Anker nicht gefunden: "${anchor}"`);
}

// ── 1. search-shortcut.js ────────────────────────────────────────────
const shortcutJs = `/**
 * search-shortcut.js — UXF-021: „/" fokussiert das Suchfeld
 *
 * Global geladen (head.html). „/" fokussiert das erste sichtbare Suchfeld
 * der Seite (input[type=search] oder [data-search-shortcut]), Escape blurrt.
 * Ignoriert Eingaben in Feldern (input/textarea/select/contenteditable) und
 * alle Modifikator-Kombis — kein Eingriff in normales Tippen.
 */
(function () {
  'use strict';

  function firstVisibleSearchField() {
    var candidates = document.querySelectorAll(
      '[data-search-shortcut], main input[type="search"], input.cts-input, #mh-search-input, #state-topic-filter-input, #nf-search-input'
    );
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.offsetParent !== null && !el.disabled) return el;
    }
    return null;
  }

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      el.isContentEditable
    );
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.altKey || e.metaKey) return;
    var active = document.activeElement;
    if (isTypingTarget(active)) return; // Nutzer tippt bereits
    var field = firstVisibleSearchField();
    if (!field) return;
    e.preventDefault();
    field.focus();
    // Cursor ans Ende (bessere Vorbelegungs-Ergänzung)
    var len = (field.value || '').length;
    try {
      field.setSelectionRange(len, len);
    } catch (err) {
      /* type=search ohne Selection-API */
    }
  });

  // Escape verlässt Suchfelder (sofern die Seite nichts Eigenes tut)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !isTypingTarget(document.activeElement)) return;
    var tag = (document.activeElement.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return;
    if ((document.activeElement.getAttribute('type') || '') !== 'search') return;
    document.activeElement.blur();
  });
})();
`;

fs.writeFileSync(JS, shortcutJs);
console.log('[UXF-021] ✓ search-shortcut.js geschrieben');

// ── 2. head.html: Script-Tag ─────────────────────────────────────────
{
  let src = fs.readFileSync(HEAD, 'utf-8');
  if (src.includes('search-shortcut.js')) {
    console.log('[UXF-021] head.html bereits gepatcht');
  } else {
    const headAnchor = '<link rel="stylesheet" href="{{ "/css/ux-enhancements.css" | relURL }}">';
    if (!src.includes(headAnchor)) fail('UXF-021', headAnchor);
    src = src.replace(
      headAnchor,
      headAnchor + '\n<script defer src="{{ "/js/search-shortcut.js" | relURL }}"></script>'
    );
    fs.writeFileSync(HEAD, src);
    console.log('[UXF-021] ✓ Script-Tag in head.html');
  }
}

console.log('[r5-shortcut] ✓ abgeschlossen');
