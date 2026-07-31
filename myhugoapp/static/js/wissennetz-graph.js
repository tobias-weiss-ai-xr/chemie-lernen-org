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

  function showError(msg, canRetry) {
    var retryBtn = canRetry
      ? '<p><button onclick="location.reload()" style="background:#667eea;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-size:0.9rem;margin-top:8px;">🔄 Erneut versuchen</button></p>'
      : '';
    container.innerHTML =
      '<p style="padding:2em;color:#888;text-align:center;">' + msg + '</p>' + retryBtn;
  }

  function loadGraph() {
    fetch('/api/kg-data?limit=1000', { signal: AbortSignal.timeout(20000) })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var entities = data.entities || [];
        var articles = data.articles || [];
        if (entities.length === 0 && articles.length === 0) {
          showError(
            '🗄️ Wissensnetz wird geladen<br><small>Die Wissensdatenbank wird gerade aktualisiert. Bitte versuche es in wenigen Minuten erneut.</small>',
            true
          );
          return;
        }
        initGraph(data);
      })
      .catch(function () {
        showError('Wissensnetz konnte nicht geladen werden.', true);
      });
  }

  if (typeof loadD3AndEgoGraph === 'function') {
    loadD3AndEgoGraph()
      .then(function () {
        loadGraph();
      })
      .catch(function (err) {
        console.warn('[wissennetz] Failed to load D3:', err);
        showError('Graph-Bibliothek konnte nicht geladen werden.', true);
      });
  } else {
    console.warn('[wissennetz] loadD3AndEgoGraph not available, loading graph directly');
    loadGraph();
  }
})();
