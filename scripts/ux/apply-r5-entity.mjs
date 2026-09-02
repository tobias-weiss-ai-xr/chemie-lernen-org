/**
 * apply-r5-entity.mjs — UXF-022: Entity „Lehrplan-Bezug" mit Links
 *
 * Der Lehrplan-Bezug-Bereich der Entity-Seiten (layouts/entity/single.html)
 * zeigt Topic-Titel und State-Badges als reinen TEXT — keine Navigation in
 * den Lehrplan möglich. Neu:
 *   - Topic-Titel → <a href="/curricula/{state}/"> (wenn state bekannt)
 *   - State-Badge klickbar (dieselbe URL)
 *
 * Datei: layouts/entity/single.html
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/layouts/entity/single.html');

function fail(anchor) {
  throw new Error(`[UXF-022] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-022')) {
  console.log('[UXF-022] bereits angewendet');
  process.exit(0);
}

const a1 = `        var topicKeys = Object.keys(byTopic);
        topicKeys.forEach(function (key, idx) {
          var topic = byTopic[key];
          h += '<div class="entity-lehrplan-topic">';
          h += '<div class="entity-lehrplan-topic-title">';
          h += esc(topic.title);
          if (topic.state) h += '<span class="entity-lehrplan-state-badge">' + esc(topic.state) + '</span>';
          h += '</div>';`;
if (!src.includes(a1)) fail(a1);
src = src.replace(
  a1,
  `        var topicKeys = Object.keys(byTopic);
        topicKeys.forEach(function (key, idx) {
          var topic = byTopic[key];
          // UXF-022: Topic → klickbarer Link auf die State-Lehrplan-Seite
          var stateHref = topic.state
            ? '<a href="/curricula/' + esc(String(topic.state).toLowerCase()) + '/">'
            : '';
          var stateHrefEnd = topic.state ? '</a>' : '';
          h += '<div class="entity-lehrplan-topic">';
          h += '<div class="entity-lehrplan-topic-title">';
          h +=
            stateHref +
            esc(topic.title) +
            stateHrefEnd;
          if (topic.state) {
            h +=
              '<a class="entity-lehrplan-state-badge" href="/curricula/' +
              esc(String(topic.state).toLowerCase()) +
              '/" title="Lehrplan ' + esc(String(topic.state).toUpperCase()) + ' öffnen">' +
              esc(topic.state) + '</a>';
          }
          h += '</div>';`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-022] ✓ 1 Edit in entity/single.html');
