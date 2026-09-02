/**
 * apply-r6-sanitize.mjs — UXF-027: ki-assistent Sanitizer härtet
 *
 * sanitizeAiHtml() ist regex-basiert und hatte reale Bypass-Vektoren:
 *   1. <iframe srcdoc="&lt;script&gt;…"> — srcdoc-Inhalt wird vom Browser
 *      dekodiert und ausgeführt; das script-Regex sieht nur Entities.
 *   2. href="data:text/html,…" — nur javascript:-URIs wurden ersetzt;
 *      data:-HTML-Seiten führen Skripte beim Klick aus.
 *   3. <form action=…> / <base href=…> können Formulare/relative URLs
 *      umlenken (Phishing-Vektor im Chat-Kontext).
 *
 * Härtung: form/base-Tags entfernen, srcdoc-Attribut strippen, iframe nur
 * mit http(s)/relativer src behalten, data:/vbscript:-URIs wie javascript:.
 *
 * Datei: static/js/ki-assistent.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/ki-assistent.js');

function fail(anchor) {
  throw new Error(`[UXF-027] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-027')) {
  console.log('[UXF-027] bereits angewendet');
  process.exit(0);
}

// ── 1. Neue Regeln nach dem script-Strip ─────────────────────────────
const a1 = `    html = html.replace(
      /<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi,
      ''
    );`;
if (!src.includes(a1)) {
  // Fallback: einzeilige Variante (Prettier kann beide Formen erzeugen)
  const a1b = `    html = html.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '');`;
  if (!src.includes(a1b)) fail('script-strip-Regel');
  src = src.replace(
    a1b,
    a1b +
      `
    // UXF-027: form/base entfernen (Phishing-Umlenkung), srcdoc strippen
    // (srcdoc-Inhalt wird vom Browser dekodiert → umgeht script-Regex)
    html = html.replace(/<\\s*(form|base)\\b[\\s\\S]*?(<\\/\\s*\\1\\s*>|\\/?>)/gi, '');
    html = html.replace(/\\ssrcdoc\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)/gi, '');
    // iframe nur mit http(s)/protokollrelativer src behalten
    html = html.replace(/<\\s*iframe\\b([^>]*)>/gi, function (m, attrs) {
      var srcM = /\\ssrc\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))/i.exec(
        attrs || ''
      );
      var srcVal = srcM ? srcM[2] || srcM[3] || srcM[4] || '' : '';
      if (!/^(https?:)?\\/\\//i.test(srcVal) && srcVal.charAt(0) !== '/') {
        return '';
      }
      return m;
    });`
  );
} else {
  src = src.replace(
    a1,
    a1 +
      `
    // UXF-027: form/base entfernen (Phishing-Umlenkung), srcdoc strippen
    // (srcdoc-Inhalt wird vom Browser dekodiert → umgeht script-Regex)
    html = html.replace(/<\\s*(form|base)\\b[\\s\\S]*?(<\\/\\s*\\1\\s*>|\\/?>)/gi, '');
    html = html.replace(/\\ssrcdoc\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)/gi, '');
    // iframe nur mit http(s)/protokollrelativer src behalten
    html = html.replace(/<\\s*iframe\\b([^>]*)>/gi, function (m, attrs) {
      var srcM = /\\ssrc\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))/i.exec(
        attrs || ''
      );
      var srcVal = srcM ? srcM[2] || srcM[3] || srcM[4] || '' : '';
      if (!/^(https?:)?\\/\\//i.test(srcVal) && srcVal.charAt(0) !== '/') {
        return '';
      }
      return m;
    });`
  );
}

// ── 2. data:/vbscript:-URIs wie javascript: behandeln ────────────────
const a2 = `      /(href|src)\\s*=\\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\\s>]+)/gi,`;
if (!src.includes(a2)) fail('javascript:-Regel');
src = src.replace(
  a2,
  a2 +
    `
    // UXF-027: data:/vbscript:-URIs blocken (data:text/html führt JS aus)
    // (die javascript:-Regel darüber wird unverändert beibehalten)
    html = html.replace(
      /(href|src)\\s*=\\s*("(?:data|vbscript):[^"]*"|'(?:data|vbscript):[^']*'|(?:data|vbscript):[^\\s>]+)/gi,
      '$1="#"'
    );`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-027] ✓ 2 Edits in ki-assistent.js (srcdoc/form/base/iframe/data-URI)');
