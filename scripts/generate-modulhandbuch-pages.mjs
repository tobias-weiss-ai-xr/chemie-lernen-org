#!/usr/bin/env node
/**
 * generate-modulhandbuch-pages.mjs
 *
 * Reads all modulhandbuch JSON files from myhugoapp/data/modulhandbuch/
 * and generates Hugo content pages for:
 *   - University detail pages  (/modulhandbuecher/{short_code}/)
 *   - Module detail pages      (/modulhandbuecher/{short_code}/{module_code}/)
 *
 * These SSR pages replace the existing client-side JS rendering,
 * making university/module data indexable by search engines.
 *
 * Usage:  node scripts/generate-modulhandbuch-pages.mjs
 * Run AFTER scraping (npm run scrape:modulhandbuch or individual runners).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'myhugoapp', 'data', 'modulhandbuch');
const CONTENT_DIR = join(__dirname, '..', 'myhugoapp', 'content', 'modulhandbuch');
const LAYOUT_DIR = join(__dirname, '..', 'myhugoapp', 'layouts', 'modulhandbuch');

// ── University layout (uni.html) ──────────────────────────────────────────
const UNI_LAYOUT = `{{ define "css" }}
<style>
.uni-header{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;}
.uni-header h1{margin:0;font-size:1.6rem;}
.uni-meta{font-size:0.9rem;color:var(--text-muted,#888);}
.uni-meta span{margin-right:1.5rem;}
.degree-group{margin-bottom:2rem;}
.degree-group h3{color:var(--text-primary,#333);margin-bottom:0.8rem;font-size:1.1rem;border-bottom:2px solid #9b59b6;padding-bottom:0.3rem;}
.module-list{display:grid;gap:0.5rem;}
.module-card{background:var(--bg-card,#fff);border:1px solid var(--border-color,#e0e0e0);border-radius:8px;padding:0.8rem 1rem;display:flex;justify-content:space-between;align-items:center;transition:box-shadow 0.2s;}
.module-card:hover{box-shadow:0 2px 8px rgba(0,0,0,0.08);}
.module-card a{color:var(--text-primary,#333);text-decoration:none;font-weight:500;}
.module-card a:hover{color:#9b59b6;}
.module-card .code{font-family:monospace;color:#9b59b6;font-size:0.85rem;}
.module-card .ects{font-size:0.8rem;color:var(--text-muted,#888);white-space:nowrap;}
@media(prefers-color-scheme:dark){
.module-card{background:#2a2a2a;border-color:#444;}
.module-card a{color:#ddd;}
}
</style>
{{ end }}

{{ define "main" }}
<div class="container" style="margin-top:1rem;">
  <div class="row">
    <div class="col-md-12">
      <a href="/modulhandbuecher/" style="font-size:0.85rem;color:#9b59b6;">&larr; Zurück zur Übersicht</a>
    </div>
  </div>
  <div class="row" style="margin-top:1rem;">
    <div class="col-md-12">
      <div class="uni-header">
        <h1>{{ .Params.uni_name }}</h1>
        <span style="font-size:0.85rem;color:#9b59b6;font-family:monospace;">{{ .Params.uni_code }}</span>
      </div>
      <div class="uni-meta">
        <span>📍 {{ .Params.uni_city }}, {{ .Params.uni_country }}</span>
        <span>🎓 {{ .Params.degree_count }} Studiengänge</span>
        <span>📚 {{ .Params.module_count }} Module</span>
        {{ if .Params.uni_website }}
        <span><a href="{{ .Params.uni_website }}" target="_blank" rel="noopener">🌐 Website</a></span>
        {{ end }}
      </div>
    </div>
  </div>
  <div class="row" style="margin-top:1.5rem;">
    <div class="col-md-12">
      {{ .Content }}
    </div>
  </div>
</div>
{{ end }}

{{ define "js" }}
{{ end }}
`;

// ── Module layout (module.html) ──────────────────────────────────────────
const MODULE_LAYOUT = `{{ define "css" }}
<style>
.mod-header{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;}
.mod-header h1{margin:0;font-size:1.4rem;}
.mod-code{font-family:monospace;color:#9b59b6;font-size:1rem;}
.mod-meta{display:grid;grid-template-columns:auto 1fr;gap:0.5rem 1.5rem;font-size:0.9rem;background:var(--bg-card,#fff);border:1px solid var(--border-color,#e0e0e0);border-radius:8px;padding:1rem;margin-bottom:1.5rem;}
.mod-meta dt{color:var(--text-muted,#888);font-weight:600;}
.mod-meta dd{margin:0;}
.mod-section{margin-bottom:1.5rem;}
.mod-section h3{font-size:1.05rem;color:var(--text-primary,#333);border-bottom:1px solid var(--border-color,#e0e0e0);padding-bottom:0.3rem;margin-bottom:0.8rem;}
.mod-section ul{padding-left:1.2rem;}
.mod-section li{margin-bottom:0.3rem;color:#555;font-size:0.9rem;}
.back-link{font-size:0.85rem;color:#9b59b6;}
@media(prefers-color-scheme:dark){
.mod-meta{background:#2a2a2a;border-color:#444;}
}
</style>
{{ end }}

{{ define "main" }}
<div class="container" style="margin-top:1rem;">
  <div class="row">
    <div class="col-md-12">
      <a href="/modulhandbuecher/{{ .Params.uni_code }}/" class="back-link">&larr; {{ .Params.uni_name }}</a>
    </div>
  </div>
  <div class="row" style="margin-top:1rem;">
    <div class="col-md-12">
      <div class="mod-header">
        <h1>{{ .Params.module_name }}</h1>
        <span class="mod-code">{{ .Params.module_code }}</span>
      </div>
      <div class="mod-meta">
        <dt>Hochschule</dt><dd>{{ .Params.uni_name }} ({{ .Params.uni_code }})</dd>
        <dt>ECTS</dt><dd>{{ .Params.ects }}</dd>
        <dt>Niveau</dt><dd>{{ .Params.level }}</dd>
        <dt>Sprache</dt><dd>{{ .Params.language }}</dd>
        {{ if .Params.degree }}<dt>Studiengang</dt><dd>{{ .Params.degree }}</dd>{{ end }}
        {{ if .Params.module_url }}<dt>Link</dt><dd><a href="{{ .Params.module_url }}" target="_blank" rel="noopener">Modulhandbuch-Eintrag</a></dd>{{ end }}
      </div>
      {{ .Content }}
    </div>
  </div>
</div>
{{ end }}

{{ define "js" }}
{{ end }}
`;

// ── Slugify for URL-safe module codes ────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Main ─────────────────────────────────────────────────────────────────
function main() {
  // Ensure directories
  for (const dir of [LAYOUT_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  // Write layouts
  writeFileSync(join(LAYOUT_DIR, 'uni.html'), UNI_LAYOUT, 'utf-8');
  console.log('[gen-mod-pages] Layout: layouts/modulhandbuch/uni.html');
  writeFileSync(join(LAYOUT_DIR, 'module.html'), MODULE_LAYOUT, 'utf-8');
  console.log('[gen-mod-pages] Layout: layouts/modulhandbuch/module.html');

  // Read all JSON files from the data directory
  const jsonFiles = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  let totalUniversities = 0;
  let totalModules = 0;

  for (const fname of jsonFiles) {
    const fpath = join(DATA_DIR, fname);
    if (!existsSync(fpath)) {
      console.log(`[gen-mod-pages] SKIP ${fname} — not found`);
      continue;
    }
    const raw = JSON.parse(readFileSync(fpath, 'utf-8'));
    const uni = raw.university;
    const modules = raw.modules || [];
    const degrees = raw.degrees || [];

    const shortCode = uni.short_code.toLowerCase();
    const uniDir = join(CONTENT_DIR, shortCode);
    if (!existsSync(uniDir)) mkdirSync(uniDir, { recursive: true });

    // ── University _index.md ──────────────────────────────────────────
    const uniDescription =
      degrees.length > 0
        ? `Die ${uni.name} bietet ${modules.length} Chemie-Module in ${degrees.length} Studiengängen an.`
        : `Die ${uni.name} bietet ${modules.length} Chemie-Module an.`;

    const uniFrontmatter = {
      title: uni.name,
      description: uniDescription,
      layout: 'uni',
      date: raw.last_updated || '2026-06-28',
      aliases: [`/modulhandbuch/${uni.short_code}/`],
      uni_code: uni.short_code,
      uni_name: uni.name,
      uni_city: uni.city,
      uni_country: uni.country,
      uni_website: uni.website,
      degree_count: degrees.length,
      module_count: modules.length,
    };

    const degreeSections = degrees.map((d) => {
      const degModules = modules.filter((m) => m.degree && m.degree.includes(d.name));
      return { degree: d, modules: degModules };
    });

    let uniBody = '';
    if (raw.source_url) {
      uniBody += `> Quelle: [${raw.source_url}](${raw.source_url})\n\n`;
    }

    for (const group of degreeSections) {
      if (group.modules.length === 0) continue;
      const levelLabel = group.degree.level ? ` (${group.degree.level})` : '';
      uniBody += `## ${group.degree.name}${levelLabel}\n\n`;
      for (const mod of group.modules) {
        const slug = slugify(mod.module_code);
        const modLink = `/modulhandbuch/${shortCode}/${slug}/`;
        uniBody += `- **[${mod.module_name}](${modLink})** — \`${mod.module_code}\`, ${mod.ects} ECTS, ${mod.language}\n`;
      }
      uniBody += '\n';
    }

    // Also add modules not in any degree group
    const groupedCodes = new Set();
    for (const group of degreeSections) {
      for (const m of group.modules) groupedCodes.add(m.module_code);
    }
    const ungrouped = modules.filter((m) => !groupedCodes.has(m.module_code));
    if (ungrouped.length > 0) {
      uniBody += `## Weitere Module\n\n`;
      for (const mod of ungrouped) {
        const slug = slugify(mod.module_code);
        const modLink = `/modulhandbuch/${shortCode}/${slug}/`;
        uniBody += `- **[${mod.module_name}](${modLink})** — \`${mod.module_code}\`, ${mod.ects} ECTS, ${mod.language}\n`;
      }
    }

    writeFileSync(
      join(uniDir, '_index.md'),
      `---\n${yamlify(uniFrontmatter)}---\n\n${uniBody}`,
      'utf-8'
    );
    console.log(`[gen-mod-pages] Uni: ${uni.name} (${uni.short_code}) — ${uniDir}/_index.md`);
    totalUniversities++;

    // ── Module pages ──────────────────────────────────────────────────
    for (const mod of modules) {
      const slug = slugify(mod.module_code);
      const modFrontmatter = {
        title: `${mod.module_name} — ${uni.name}`,
        description: `${mod.module_name} (${mod.module_code}) an der ${uni.name}. ${mod.ects} ECTS, Niveau: ${mod.level}.`,
        layout: 'module',
        date: mod.last_checked || raw.last_updated || '2026-06-28',
        uni_code: uni.short_code,
        uni_name: uni.name,
        module_code: mod.module_code,
        module_name: mod.module_name,
        module_url: mod.url || '',
        ects: mod.ects,
        level: mod.level,
        language: mod.language,
        degree: mod.degree || '',
      };

      let modBody = '';
      if (mod.learning_outcomes && mod.learning_outcomes.length > 0) {
        modBody += `## Lernziele\n\n`;
        for (const lo of mod.learning_outcomes) {
          modBody += `- ${lo}\n`;
        }
        modBody += '\n';
      }
      if (mod.content && mod.content.length > 0) {
        modBody += `## Inhalte\n\n`;
        for (const c of mod.content) {
          modBody += `- ${c}\n`;
        }
        modBody += '\n';
      }
      if (mod.examination) {
        modBody += `## Prüfung\n\n${mod.examination}\n\n`;
      }
      if (mod.url) {
        modBody += `[→ Modulhandbuch-Eintrag](${mod.url})\n`;
      }

      writeFileSync(
        join(uniDir, `${slug}.md`),
        `---\n${yamlify(modFrontmatter)}---\n\n${modBody}`,
        'utf-8'
      );
      console.log(`[gen-mod-pages]   Module: ${mod.module_code} — ${slug}.md`);
      totalModules++;
    }
  }

  console.log(
    `\n[gen-mod-pages] Done: ${totalUniversities} universities, ${totalModules} module pages generated.`
  );
  console.log(`[gen-mod-pages] Content in: ${CONTENT_DIR}`);
}

// ── Simple YAML serializer (no deps needed) ──────────────────────────────
function yamlify(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  const lines = [];
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = obj[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    if (typeof v === 'string') {
      // Quote multiline or special chars
      if (v.includes('\n') || v.includes(':') || v.includes('#') || v.includes("'")) {
        lines.push(`${pad}${k}: "${v.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${pad}${k}: ${v}`);
      }
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      lines.push(`${pad}${k}: ${v}`);
    } else if (Array.isArray(v)) {
      lines.push(`${pad}${k}:`);
      for (const item of v) {
        if (typeof item === 'object') {
          lines.push(`${pad}- ${yamlify(item, indent + 1).trimStart()}`);
        } else {
          lines.push(`${pad}- ${item}`);
        }
      }
    } else if (typeof v === 'object') {
      lines.push(`${pad}${k}:`);
      for (const [sk, sv] of Object.entries(v)) {
        if (sv === undefined || sv === null) continue;
        lines.push(`${pad}  ${sk}: ${sv}`);
      }
    }
  }
  return lines.join('\n') + '\n';
}

main();
