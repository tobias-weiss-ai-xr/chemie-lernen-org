(function () {
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
      container.innerHTML =
        '<p style="padding:2em;color:#888;">Wissensnetz konnte nicht geladen werden.</p>';
    });
})();
