// Search functionality
(function () {
  async function initSearch() {
    var searchInput = document.getElementById('search-input');
    var searchForm = document.getElementById('search-form');
    var searchClear = document.getElementById('search-clear');
    var searchResults = document.getElementById('search-results');
    var searchOverlay = document.getElementById('search-overlay');

    if (!searchInput || !searchResults) return;

    function debounce(func, wait) {
      var timeout;
      return function executedFunction() {
        var args = arguments;
        var later = function () {
          timeout = null;
          func.apply(null, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    async function performSearch(query) {
      if (!query.trim()) {
        hideResults();
        searchClear.classList.add('hidden');
        return;
      }

      searchClear.classList.remove('hidden');

      try {
        var pagefind = await import('/pagefind/pagefind.js');
        var results = await pagefind.search(query);
        await displayResults(results);
      } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-error">Fehler bei der Suche</div>';
        showResults();
      }
    }

    var debouncedSearch = debounce(performSearch, 300);

    function getResultCategory(url) {
      if (!url) return null;
      var path = new URL(url, window.location.origin).pathname;
      if (path.indexOf('/rechner/') !== -1 || path.match(/rechner/i) || path.match(/-rechner\//))
        return { label: 'Rechner', color: '#4ecdc4' };
      if (path.indexOf('/themenbereich') !== -1)
        return { label: 'Themenbereich', color: '#45b7d1' };
      if (path.indexOf('/simulation') !== -1 || path.match(/simulator/))
        return { label: 'Simulation', color: '#f093fb' };
      if (path.indexOf('/uebungsgenerator') !== -1 || path.indexOf('/aufgabensammlung') !== -1)
        return { label: 'Übung', color: '#ff9a76' };
      if (path.indexOf('/lernpfad') !== -1 || path.indexOf('/fortschritt') !== -1)
        return { label: 'Lernpfad', color: '#667eea' };
      if (path.indexOf('/lehr') !== -1) return { label: 'Lehrende', color: '#a8a8a8' };
      if (path.indexOf('/ki-assistent') !== -1) return { label: 'KI-Assistent', color: '#667eea' };
      if (path.indexOf('/entity/') !== -1) return { label: 'Begriff', color: '#45b7d1' };
      if (path.indexOf('/wissennetz') !== -1) return { label: 'Wissensnetz', color: '#667eea' };
      if (path.indexOf('/posts/') !== -1 || path.match(/\/\d{4}\/\d{2}\//))
        return { label: 'Artikel', color: '#888' };
      return null;
    }

    function escapeHtml(str) {
      if (!str) return '';
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    async function displayResults(results) {
      if (!results || !results.results || results.results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">Keine Ergebnisse gefunden</div>';
      } else {
        // Pagefind returns results with async data() method — call it for each result
        var items = await Promise.all(
          results.results.map(function (r) {
            return r.data();
          })
        );
        var html = '';
        items.forEach(function (data) {
          var cat = getResultCategory(data.url);
          var excerpt = data.excerpt || (data.content ? data.content.substring(0, 200) : '');
          html += '<div class="search-result-item">';
          html += '  <a href="' + escapeHtml(data.url) + '" class="search-result-link">';
          html += '    <div class="search-result-title">' + escapeHtml(data.meta.title) + '</div>';
          if (cat) {
            html +=
              '    <span class="search-result-badge" style="display:inline-block;font-size:0.65rem;padding:0.1rem 0.45rem;border-radius:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;background:' +
              cat.color +
              '22;color:' +
              cat.color +
              ';margin-top:0.2rem;">' +
              cat.label +
              '</span>';
          }
          html += '    <div class="search-result-excerpt">' + escapeHtml(excerpt) + '</div>';
          html += '  </a>';
          html += '</div>';
        });
        searchResults.innerHTML = html;
      }
      showResults();
    }

    function showResults() {
      searchResults.classList.remove('hidden');
      searchOverlay.classList.remove('hidden');
    }

    function hideResults() {
      searchResults.classList.add('hidden');
      searchOverlay.classList.add('hidden');
    }

    searchInput.addEventListener('input', function () {
      debouncedSearch(this.value);
    });

    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      performSearch(searchInput.value);
    });

    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      hideResults();
      searchClear.classList.add('hidden');
      searchInput.focus();
    });

    searchOverlay.addEventListener('click', function () {
      hideResults();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideResults();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();
