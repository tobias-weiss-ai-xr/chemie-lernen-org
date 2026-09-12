#!/usr/bin/env node
/**
 * apply-uxf-045-home-auth-gate.mjs — UXF-045: kein 401-Noise für anonyme
 * Homepage-Besucher.
 *
 * home-recommendation.js rief /api/gamification/profile sofort bei
 * DOMContentLoaded auf — für jeden anonymen Besucher: 1 nutzloser API-Call
 * + 401-Console-Error. Jetzt: bei vorhandenem AuthClient.getUser() zuerst
 * den Login-Status prüfen; anonym wird direkt das anonyme Widget gerendert.
 *
 * Idempotent: Edit wird nur angewendet, wenn der Marker fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const JS = path.join(ROOT, 'myhugoapp/static/js/home-recommendation.js');

const START = "  document.addEventListener('DOMContentLoaded', function () {";
const END_MARKER = '})();';

export function applyGate(src) {
  if (src.includes('UXF-045')) return { changed: false, src };

  const startIdx = src.indexOf(START);
  if (startIdx === -1) return { changed: false, error: 'Start-Anker nicht gefunden' };
  const endIdx = src.indexOf(END_MARKER, startIdx);
  if (endIdx === -1) return { changed: false, error: 'End-Anker nicht gefunden' };

  const replacement = [
    "  document.addEventListener('DOMContentLoaded', function () {",
    '    /* UXF-045: anonymous visitors never hit /gamification/profile (401 noise) */',
    '    function loadRecommendations() {',
    '      /* Fetch profile + paths in parallel */',
    '      Promise.all([',
    "        apiFetch('/gamification/profile').catch(function () {",
    '          return null;',
    '        }),',
    "        apiFetch('/learning-paths').catch(function () {",
    '          return null;',
    '        }),',
    '      ])',
    '        .then(function (results) {',
    '          var profile = results[0];',
    '          var pathsData = results[1];',
    '          var paths = (pathsData && pathsData.paths) || [];',
    '',
    '          if (!profile) {',
    '            /* Not logged in — show generic widget with path list */',
    '            showWidget();',
    '            renderAnonymousPaths();',
    '            return;',
    '          }',
    '',
    '          showWidget();',
    '          var next = findNextFromProfile(profile, paths);',
    '          renderRecommended(next);',
    '        })',
    '        .catch(function () {',
    '          /* API completely unavailable — hide widget gracefully */',
    '          hideWidget();',
    '        });',
    '    }',
    '',
    '    var auth = window.AuthClient;',
    "    if (auth && typeof auth.getUser === 'function') {",
    '      auth.getUser().then(function (user) {',
    '        if (user) {',
    '          loadRecommendations();',
    '        } else {',
    '          /* Not logged in — skip the doomed profile call entirely */',
    '          showWidget();',
    '          renderAnonymousPaths();',
    '        }',
    '      });',
    '    } else {',
    '      /* AuthClient nicht geladen (alter Cache) — Legacy-Verhalten */',
    '      loadRecommendations();',
    '    }',
    '  });',
  ].join('\n');

  return { changed: true, src: src.slice(0, startIdx) + replacement + src.slice(endIdx) };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-uxf-045-home-auth-gate.mjs');
if (isDirectRun) {
  const before = fs.readFileSync(JS, 'utf8');
  const { changed, src, error } = applyGate(before);
  if (error) {
    console.error(`apply-uxf-045-home-auth-gate: ${error}`);
    process.exit(1);
  }
  if (changed) fs.writeFileSync(JS, src);
  console.log(
    `apply-uxf-045-home-auth-gate: Auth-Gate ${changed ? 'eingebaut' : 'bereits vorhanden'}`
  );
}
