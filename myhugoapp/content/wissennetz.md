---
title: 'Wissensnetz Graph'
description: 'Interaktive Visualisierung der Wissensverbindungen zwischen Fachbegriffen und Artikeln'
date: 2026-06-11
last_reviewed: 2026-07-09
aliases: [/entity/graph/]
weight: 10
layout: wissennetz
---


<style>
#kg-breadcrumb{display:block;font-size:0.85rem;color:#777;margin-bottom:8px;}
#kg-hint{display:none;position:relative;padding:10px 14px;border:1px solid #b8d4f0;background:#eef6fd;border-radius:8px;margin-bottom:12px;font-size:0.95rem;color:#1a3a5c;}
#kg-hint .btn-close-sm{position:absolute;top:8px;right:10px;border:none;background:none;font-size:14px;cursor:pointer;color:#558;}
.kg-search-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:stretch;}
#kg-search{flex:1 1 220px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:1rem;background:#fff;}
#kg-search:focus{outline:2px solid #667eea;outline-offset:-1px;border-color:#667eea;}
#kg-full-graph-btn{white-space:nowrap;}
#kg-controls{display:none;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding:10px;background:#f8f9fa;border-radius:8px;align-items:center;}
#kg-controls label{font-size:0.85rem;font-weight:600;margin-right:4px;color:#555;}
.kg-filter-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border:1px solid #ddd;border-radius:14px;background:#fff;cursor:pointer;font-size:0.8rem;transition:all 0.2s;user-select:none;}
.kg-filter-chip:hover{border-color:#999;}
.kg-filter-chip.active{color:#fff;border-color:currentColor;}
.kg-filter-chip .kg-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
.kg-portals{display:none;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:16px;}
.kg-portal-card{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid #e0e0e0;border-radius:10px;background:#fff;cursor:pointer;text-align:left;transition:transform 0.15s ease,box-shadow 0.15s ease,background 0.15s ease;}
.kg-portal-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.10);background:#fafbff;}
.kg-portal-card:focus-visible{outline:2px solid #667eea;outline-offset:2px;}
.kg-portal-top{display:flex;align-items:center;gap:8px;}
.kg-portal-swatch{width:12px;height:12px;border-radius:50%;flex:0 0 auto;}
.kg-portal-name{font-weight:700;font-size:1rem;line-height:1.25;}
.kg-portal-count{font-size:0.8rem;color:#888;}
.kg-portal-link{align-self:flex-start;font-size:0.85rem;color:#667eea;text-decoration:none;border-bottom:1px dotted #667eea;}
.kg-portal-link:hover{text-decoration:underline;}
.kg-empty{color:#888;font-style:italic;padding:1em 0;}
@media(prefers-color-scheme:dark){
#kg-breadcrumb{color:#999;}
#kg-hint{background:#1e2a38;border-color:#2e4a66;color:#cfe3f5;}
#kg-search{background:#2a2a2a;border-color:#555;color:#eee;}
#kg-controls{background:#2a2a2a;}
#kg-controls label{color:#ccc;}
.kg-filter-chip{background:#333;border-color:#555;color:#ddd;}
.kg-filter-chip:hover{border-color:#888;}
.kg-portal-card{background:#2a2a2a;border-color:#444;color:#eee;}
.kg-portal-card:hover{background:#31333a;}
.kg-portal-name{color:#fff;}
.kg-portal-count{color:#aaa;}
.kg-portal-link{color:#9db4f0;}
}
</style>
<nav aria-label="Brotkrumenpfad"><span id="kg-breadcrumb">Wissensnetz</span></nav>
<div id="kg-hint" role="note"></div>
<div class="kg-search-row">
  <input id="kg-search" type="search" placeholder="Begriff suchen … (z. B. ‚Elektrolyse’, ‚pH-Wert’)" aria-label="Begriff im Wissensnetz suchen" autocomplete="off">
  <button id="kg-full-graph-btn" class="btn btn-outline-primary" type="button" style="display:none;">Gesamtübersicht</button>
</div>
<div id="kg-controls"><label>Kategorien:</label></div>
<div id="kg-portals" class="kg-portals" aria-label="Themenportale"></div>
<div id="kg-app" style="width:100%;height:700px;border:1px solid #ddd;border-radius:8px;background:#fafafa;position:relative;">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
<div class="spinner-border text-primary mb-3" role="status"><span class="visually-hidden">Loading...</span></div>
<h5>Lade Wissensnetz...</h5>
</div>
</div>
