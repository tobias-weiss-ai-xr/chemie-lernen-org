/**
 * search.test.js — regression tests for the site-wide search (search.js).
 *
 * The API list route returns entities WITHOUT `articles`/`articleCount`
 * (fields: name, category, description, relationCount). buildIndex() used
 * `e.articles.length` directly, which threw on every entity and left the
 * site search permanently broken (SEARCH.isReady=true, empty index).
 */
const fs = require('fs');
const path = require('path');

const MODULE_PATH = path.resolve(__dirname, '../myhugoapp/static/js/search.js');

function makeLunrMock() {
  const docs = [];
  const index = {
    ref: null,
    fields: [],
    search: jest.fn().mockReturnValue([]),
    _mockDocs: docs,
  };
  window.lunr = jest.fn(function (fn) {
    const builder = {
      ref: (r) => {
        index.ref = r;
      },
      field: (f) => {
        index.fields.push(f);
      },
      add: (doc) => {
        docs.push(doc);
        this.docs = docs;
      },
    };
    fn.call(builder);
    return index;
  });
  return index;
}

describe('search.js — buildIndex with API-shaped entities', () => {
  afterEach(() => {
    delete window.__search;
    delete window.lunr;
    global.fetch = undefined;
  });

  test('indexes API entities without articles/articleCount (no crash)', async () => {
    const index = makeLunrMock();
    // Exact shape the API list route returns today
    const apiData = {
      entities: [
        { name: 'Wasser', category: 'stoff', description: 'H2O', relationCount: 5 },
        { name: 'Alkohole', category: 'stoff', description: null, relationCount: 3 },
      ],
      articles: [{ title: 'Wasser — Artikel', url: '/artikel/wasser/' }],
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(apiData),
    });

    const src = fs.readFileSync(MODULE_PATH, 'utf8');
    const script = document.createElement('script');
    script.textContent = src;
    document.body.appendChild(script);

    await new Promise((r) => setTimeout(r, 50));

    expect(index._mockDocs.length).toBeGreaterThanOrEqual(2);
    const wasser = index._mockDocs.find((d) => d.name === 'Wasser');
    expect(wasser).toBeTruthy();
    expect(wasser._articleCount).toBe(0);
    expect(window.__search.isReady).toBe(true);
    expect(index._mockDocs).toHaveLength(3); // 2 entities + 1 article, no crash
  });

  test('marks search ready when fetch fails (graceful degradation)', async () => {
    makeLunrMock();
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const src = fs.readFileSync(MODULE_PATH, 'utf8');
    const script = document.createElement('script');
    script.textContent = src;
    document.body.appendChild(script);

    await new Promise((r) => setTimeout(r, 50));

    expect(window.__search.isReady).toBe(true);
  });
});
