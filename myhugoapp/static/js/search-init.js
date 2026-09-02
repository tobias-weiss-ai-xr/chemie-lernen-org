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

    // UX-004: Tastaturnavigation durch Suchergebnisse
    var activeIndex = -1;

    function getVisibleResults() {
      return Array.prototype.slice.call(searchResults.querySelectorAll('.search-result-item'));
    }

    function setActive(index) {
      var items = getVisibleResults();
      if (!items.length) return;
      if (index >= items.length) index = items.length - 1;
      if (index < 0) index = items.length - 1;
      activeIndex = index;
      items.forEach(function (item, i) {
        item.classList.toggle('active', i === activeIndex);
        if (i === activeIndex) {
          item.setAttribute('aria-selected', 'true');
          searchInput.setAttribute('aria-activedescendant', item.id || '');
        } else {
          item.removeAttribute('aria-selected');
        }
      });
    }

    function handleKeyboardNavigation(e) {
      var items = getVisibleResults();
      if (!items.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActive(activeIndex + 1 >= items.length ? 0 : activeIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActive(activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1);
          break;
        case 'Enter':
          if (activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            var link = items[activeIndex].querySelector('a');
            if (link) link.click();
          }
          break;
        case 'Escape':
          hideResults();
          searchInput.blur();
          break;
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

    function resetActiveIndex() {
      activeIndex = -1;
    }

    function hideResults() {
      searchResults.classList.add('hidden');
      searchOverlay.classList.add('hidden');
      resetActiveIndex();
    }

    searchInput.addEventListener('keydown', handleKeyboardNavigation);
    searchInput.addEventListener('input', function () {
      resetActiveIndex();
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
