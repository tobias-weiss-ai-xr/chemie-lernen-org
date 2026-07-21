/* global loadD3AndEgoGraph */
(function () {
  var container = document.getElementById('kg-app');
  var controls = document.getElementById('kg-controls');
  if (!container) return;

  function initGraph(data) {
    if (!globalThis.D3EgoGraph) {
      console.warn('[wissennetz] D3EgoGraph not available');
      return;
    }
    globalThis.D3EgoGraph.createFullGraph(container, data, {
      filterControls: controls,
      showLegend: true,
      height: 700,
    });
  }

  function loadGraph() {
    fetch('/api/kg-data', { signal: AbortSignal.timeout(15000) })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        initGraph(data);
      })
      .catch(function () {
        container.innerHTML =
          '<p style="padding:2em;color:#888;">Wissensnetz konnte nicht geladen werden.</p>';
      });
  }

  if (typeof loadD3AndEgoGraph === 'function') {
    loadD3AndEgoGraph()
      .then(function () {
        loadGraph();
      })
      .catch(function (err) {
        console.warn('[wissennetz] Failed to load D3:', err);
        container.innerHTML =
          '<p style="padding:2em;color:#888;">Graph-Bibliothek konnte nicht geladen werden.</p>';
      });
  } else {
    console.warn('[wissennetz] loadD3AndEgoGraph not available, loading graph directly');
    loadGraph();
  }
})();
