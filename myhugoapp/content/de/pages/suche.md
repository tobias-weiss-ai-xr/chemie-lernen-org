---
title: "Suche"
date: 2025-12-27
layout: "search"
---


## Suchergebnisse

<div class="search-container">
  <div class="search-form-wrapper">
    <div class="input-group">
      <input type="text" id="search-input" class="form-control" placeholder="Thema suchen..." value="">
      <span class="input-group-btn">
        <button class="btn btn-default" type="button" onclick="performSearch(); return false;">Suchen</button>
      </span>
    </div>
  </div>

  <div id="search-results">
    <p class="search-loading">Lade Suchindex...</p>
  </div>

  <div id="search-stats" class="search-stats"></div>
</div>

<style>
.search-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

.search-form-wrapper {
  margin-bottom: 30px;
}

#search-input {
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

#search-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.search-result {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.search-result:hover {
  background-color: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-result h3 {
  margin-top: 0;
  color: #2c3e50;
}

.search-result h3 a {
  color: #4CAF50;
  text-decoration: none;
}

.search-result h3 a:hover {
  text-decoration: underline;
}

.search-result .url {
  color: #006621;
  font-size: 14px;
  margin-bottom: 8px;
}

.search-result .snippet {
  color: #545454;
  line-height: 1.6;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
}

.search-loading {
  text-align: center;
  color: #999;
}

.search-stats {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  .search-result {
    background-color: #2c2c2c;
    border-color: #444;
  }

  .search-result:hover {
    background-color: #3c3c3c;
  }

  .search-result h3 {
    color: #e0e0e0;
  }

  .search-result .snippet {
    color: #b0b0b0;
  }

  #search-input {
    background-color: #3c3c3c;
    border-color: #555;
    color: #e0e0e0;
  }

  .no-results {
    color: #adb5bd;
  }
}
</style>

<script>
// Get search query from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('q') || '';

// Set input value
document.getElementById('search-input').value = searchQuery;

// Search index
let searchIndex = [];
let isIndexLoaded = false;

// Load search index from index.json
async function loadSearchIndex() {
  try {
    const response = await fetch('/index.json');
    const data = await response.json();
    searchIndex = data;
    isIndexLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to load search index:', error);
    return false;
  }
}

// Perform search
async function performSearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const resultsContainer = document.getElementById('search-results');
  const statsContainer = document.getElementById('search-stats');

  if (!query) {
    resultsContainer.innerHTML = '<p class="no-results">Bitte geben Sie einen Suchbegriff ein.</p>';
    statsContainer.innerHTML = '';
    return;
  }

  // Wait for index to load if not loaded yet
  if (!isIndexLoaded) {
    resultsContainer.innerHTML = '<p class="search-loading">Lade Suchindex...</p>';
    await loadSearchIndex();
  }

  // Filter search index
  const results = searchIndex.filter(item => {
    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();
    const categories = (item.categories || []).join(' ').toLowerCase();

    return title.includes(query) ||
           content.includes(query) ||
           tags.includes(query) ||
           categories.includes(query);
  });

  // Display results
  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h3>Keine Ergebnisse gefunden</h3>
        <p>Es wurden keine Ergebnisse gefunden für "<strong>${escapeHtml(query)}</strong>"</p>
        <p>Versuchen Sie es mit einem anderen Suchbegriff.</p>
      </div>
    `;
    statsContainer.innerHTML = '';
  } else {
    let html = '';
    results.forEach(item => {
      const title = escapeHtml(item.title || 'Ohne Titel');
      const url = escapeHtml(item.permalink || item.url || '#');
      const snippet = getSnippet(item.content || '', query);

      html += `
        <div class="search-result">
          <h3><a href="${url}">${title}</a></h3>
          <div class="url">${url}</div>
          <div class="snippet">${snippet}</div>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;
    statsContainer.innerHTML = `<p>${results.length} Ergebnis(se) gefunden für "${escapeHtml(query)}"</p>`;
  }
}

// Get snippet with highlighted search term
function getSnippet(content, query, maxLength = 200) {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, ' ');

  // Find the position of the search term
  const pos = text.toLowerCase().indexOf(query);

  if (pos === -1) {
    // If query not found, return first maxLength characters
    return escapeHtml(text.substring(0, maxLength)) + '...';
  }

  // Get context around the search term
  const start = Math.max(0, pos - 50);
  const end = Math.min(text.length, pos + query.length + 50);
  let snippet = text.substring(start, end);

  // Highlight the search term
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  snippet = snippet.replace(regex, '<strong>$1</strong>');

  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return escapeHtml(snippet).replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Initialize search on page load
document.addEventListener('DOMContentLoaded', async () => {
  const resultsContainer = document.getElementById('search-results');

  // Pre-load search index in background
  const indexLoaded = await loadSearchIndex();

  if (!indexLoaded) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h3>Suche nicht verfügbar</h3>
        <p>Die Suchfunktion konnte nicht geladen werden. Bitte versuchen Sie es später erneut.</p>
      </div>
    `;
    return;
  }

  // Perform search if query exists
  if (searchQuery) {
    performSearch();
  } else {
    resultsContainer.innerHTML = '<p class="no-results">Geben Sie einen Suchbegriff ein, um zu suchen.</p>';
  }
});

// Search on Enter key
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await performSearch();
      }
    });
  }
});
</script>
