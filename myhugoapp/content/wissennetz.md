---
title: 'Wissensnetz Graph'
description: 'Interaktive Visualisierung der Wissensverbindungen zwischen Fachbegriffen und Artikeln'
date: 2026-06-11
aliases: [/entity/graph/]
weight: 10
---

<style>
#kg-controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding:10px;background:#f8f9fa;border-radius:8px;align-items:center;}
#kg-controls label{font-size:0.85rem;font-weight:600;margin-right:4px;color:#555;}
.kg-filter-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border:1px solid #ddd;border-radius:14px;background:#fff;cursor:pointer;font-size:0.8rem;transition:all 0.2s;user-select:none;}
.kg-filter-chip:hover{border-color:#999;}
.kg-filter-chip.active{color:#fff;border-color:currentColor;}
.kg-filter-chip .kg-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
@media(prefers-color-scheme:dark){
#kg-controls{background:#2a2a2a;}
#kg-controls label{color:#ccc;}
.kg-filter-chip{background:#333;border-color:#555;color:#ddd;}
.kg-filter-chip:hover{border-color:#888;}
}
</style>
<div id="kg-controls">
<label>Kategorien:</label>
</div>
<div id="kg-app" style="width:100%;height:700px;border:1px solid #ddd;border-radius:8px;background:#fafafa;position:relative;">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
<div class="spinner-border text-primary mb-3" role="status"><span class="visually-hidden">Loading...</span></div>
<h5>Lade Wissensnetz...</h5>
</div>
</div>
<script src="{{ "/js/visualization/d3-ego-graph.js" | relURL }}"></script>
<script>
(function(){
  var container = document.getElementById('kg-app');
  var controls = document.getElementById('kg-controls');
  if (!container || !globalThis.D3EgoGraph) return;

fetch('/api/kg-data', { signal: AbortSignal.timeout(15000) })
.then(function (r) {
if (!r.ok) throw new Error('HTTP ' + r.status);
return r.json();
})
.then(function (data) {
globalThis.D3EgoGraph.createFullGraph(container, data, {
filterControls: controls,
showLegend: true,
height: 700,
});
})
.catch(function () {
container.innerHTML = '<p style="padding:2em;color:#888;">Wissensnetz konnte nicht geladen werden.</p>';
});
})();
</script>
