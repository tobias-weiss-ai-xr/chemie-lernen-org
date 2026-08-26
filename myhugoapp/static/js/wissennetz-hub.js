/**
 * Wissensnetz-Hub (Part B B1): converts /wissennetz/ into a Themen-Portal.
 *
 * Pure helpers are exported on window.WissennetzHub for unit testing; init()
 * wires the DOM (portal cards → createTopicGraph, search → ego graph) once the
 * Slugs + D3EgoGraph modules are loaded (see wissennetz.html script order).
 *
 * Didactic constraints (spec Part B, didactic pass): portal cards are ordered
 * along a Lernpfad (SECTION_ORDER), not alphabetically; entity→section
 * assignment is (1) article-URL sections, (2) keyword overlap, (3) fallback
 * bucket. ES5-compatible IIFE, no external deps.
 */
(function () {
  'use strict';

  var SECTION_LABELS = {
    'einfuehrung-chemie': 'Einführung in die Chemie',
    'aufbau-materie': 'Aufbau der Materie',
    'saeuren-basen': 'Säuren und Basen',
    'redox-elektrochemie': 'Redoxreaktionen und Elektrochemie',
    'gleichgewicht-geschwindigkeit': 'Gleichgewicht und Geschwindigkeit',
    energetik: 'Energetik',
    'anorganische-verbindungen': 'Anorganische Verbindungen',
    'erdoel-organische-stoffklassen': 'Erdöl und organische Stoffklassen',
    'reaktionstypen-organisch': 'Reaktionstypen der Organischen Chemie',
    'produkte-organisch': 'Produkte der Organischen Chemie',
    biochemie: 'Biochemie',
    'analytische-methoden': 'Analytische Methoden',
    'tipps-tricks': 'Tipps und Tricks',
    'weitere-begriffe': 'Weitere Begriffe',
  };

  // Lernpfad order (spec B1): foundation → matter → acids/bases → redox →
  // equilibrium → energy → extension topics → organic → analysis → study aids.
  var SECTION_ORDER = [
    'einfuehrung-chemie',
    'aufbau-materie',
    'saeuren-basen',
    'redox-elektrochemie',
    'gleichgewicht-geschwindigkeit',
    'energetik',
    'anorganische-verbindungen',
    'erdoel-organische-stoffklassen',
    'reaktionstypen-organisch',
    'produkte-organisch',
    'biochemie',
    'analytische-methoden',
    'tipps-tricks',
  ];

  // Curated keyword lists per section (priority-2 assignment). Words are
  // lowercase, trimmed; matching is substring overlap (score = count of hits).
  // Chosen to be discriminative (strong markers per section, little overlap).
  // Curated against the live 545-entity corpus (2026-09): observed clusters
  // (Elemente, Verfahren, Stoffklassen, -metrie/-spektro, Katalyse …).
  var SECTION_KEYWORDS = {
    'einfuehrung-chemie': ['chemikalie', 'labor', 'reagenzglas', 'bunsenbrenner', 'sicherheit'],
    'aufbau-materie': [
      'atom',
      'ion',
      'molekuel',
      'periodensystem',
      'elektronenpaar',
      'isotop',
      'orbital',
      'quanten',
      'aufbauprinzip',
      'hund',
      'pauli',
      'hybrid',
      'periode',
      'kern',
      'nano',
      'supraleit',
      'magnet',
      'halbleit',
      'elektronenaffin',
    ],
    'saeuren-basen': [
      'saeure',
      'sauere',
      'base',
      'ph-wert',
      'pks',
      'neutralisation',
      'puffer',
      'titration',
      'hydronium',
      'acid',
      'alkal',
      'elektrolyt',
      'hydrath',
      'amphoter',
      'bronsted',
      'aequivalenz',
      'poh',
    ],
    'redox-elektrochemie': [
      'redox',
      'oxidation',
      'reduktion',
      'elektrolyse',
      'galvanisch',
      'nernst',
      'nersnt',
      'korrosion',
      'zellspannung',
      'zelle',
      'strom',
      'elektrokatalys',
    ],
    'gleichgewicht-geschwindigkeit': [
      'gleichgewicht',
      'massenwirkung',
      'le-chatelier',
      'kollisionstheorie',
      'reaktionsgeschwindigkeit',
      'kinetik',
      'kataly',
      'arrhenius',
      'henry',
    ],
    energetik: [
      'enthalpie',
      'kalorimetrie',
      'hess',
      'bindungsenergie',
      'thermochemie',
      'freie-energie',
      'gibbs',
      'thermodynamik',
      'energie',
      'vant',
    ],
    'anorganische-verbindungen': [
      'salz',
      'metallkomplex',
      'oxid',
      'sulfat',
      'carbonat',
      'edelgas',
      'alkalimetall',
      'quecksilber',
      'ammoniak',
      'natron',
      'sulfid',
      'nitrat',
      'hydroxid',
      'solway',
      'frasch',
      'mannheim',
      'ostwald',
      'haber',
      'contact-prozess',
      'metall',
      'perowskit',
      'komplex',
      'ligand',
      'zeolith',
      'kristall',
      'heroult',
      'wasser',
      'gas',
      'bioanorganisch',
    ],
    'erdoel-organische-stoffklassen': [
      'alkan',
      'alken',
      'alkin',
      'erdöl',
      'cracken',
      'kohlenwasserstoff',
      'ester',
      'fett',
      'seife',
      'alkohol',
      'aldehyd',
      'keton',
      'ether',
      'amin',
      'amid',
      'nitril',
      'phenol',
      'lact',
      'enol',
      'acyl',
      'anhydrid',
      'carbonyl',
      'harnstoff',
      'glucose',
      'glycerin',
      'ethanol',
      'methanol',
      'biodiesel',
      'biogas',
    ],
    'reaktionstypen-organisch': [
      'substitution',
      'addition',
      'eliminierung',
      'polymerisation',
      'carbokation',
      'nukleophil',
      'elektrophil',
      'radikal',
      'kupplung',
      'synthese',
      'umlagerung',
      'aktivierung',
      'nitrier',
      'acylier',
      'alkylier',
      'dehydrier',
      'etherifiz',
      'sulfonier',
    ],
    'produkte-organisch': [
      'kunststoff',
      'medikament',
      'wirkstoff',
      'arzneimittel',
      'waschmittel',
      'faser',
      'thermoplast',
      'duromer',
      'elastomer',
    ],
    biochemie: [
      'enzym',
      'protein',
      'dna',
      'stoffwechsel',
      'fotosynthese',
      'zellatmung',
      'amylase',
      'zucker',
      'zyklus',
      'glykol',
      'photosynthese',
      'chlorophyll',
      'atp',
      'nadh',
      'rna',
      'alloster',
      'michaelis',
      'hormon',
      'biochem',
      'atmung',
      'haem',
      'gluk',
      'sacchar',
      'kreatin',
      'fad',
    ],
    'analytische-methoden': [
      'chromatographie',
      'spektroskopie',
      'nachweis',
      'destillation',
      'extraktion',
      'trenn',
      'metrie',
      'spektro',
      'skopie',
      'analyse',
      'elektrophorese',
      'hplc',
      'icp',
      'sem',
      'tem',
      'xrd',
      'xps',
      'afm',
      'nir',
      'polarograph',
      'coulometr',
      'biosensor',
      'hdx',
      'roentgen',
    ],
    'tipps-tricks': [
      'lernhilfe',
      'merk',
      'klausur',
      'pruefung',
      'strategie',
      'lerntipp',
      'hausaufgabe',
    ],
  };

  // Elements (Periodensystem) route to Aufbau der Materie — a curated,
  // bounded list derived from the live corpus; keeps the atom block together.
  var ELEMENTS = [
    'argon',
    'blei',
    'bor',
    'brom',
    'chlor',
    'chrom',
    'cobalt',
    'fluor',
    'helium',
    'iod',
    'iridium',
    'kohlenstoff',
    'lithium',
    'mangan',
    'neon',
    'nickel',
    'phosphor',
    'sauerstoff',
    'schwefel',
    'selen',
    'silizium',
    'stickstoff',
    'titan',
    'uran',
    'wasserstoff',
    'wolfram',
    'zinn',
  ];
  var ELEMENTS_SECTION = 'aufbau-materie';

  // Reuses the graph palette; per-section swatches for the portal cards.
  var SECTION_COLORS = {
    'einfuehrung-chemie': '#95a5a6',
    'aufbau-materie': '#3498db',
    'saeuren-basen': '#e74c3c',
    'redox-elektrochemie': '#f39c12',
    'gleichgewicht-geschwindigkeit': '#9b59b6',
    energetik: '#e67e22',
    'anorganische-verbindungen': '#2ecc71',
    'erdoel-organische-stoffklassen': '#8e44ad',
    'reaktionstypen-organisch': '#1abc9c',
    'produkte-organisch': '#16a085',
    biochemie: '#27ae60',
    'analytische-methoden': '#2980b9',
    'tipps-tricks': '#7f8c8d',
    'weitere-begriffe': '#bdc3c7',
  };

  var FALLBACK_SECTION = 'weitere-begriffe';
  var TOPICS_URL = '/api/kg-data?limit=550';

  // ── pure helpers ────────────────────────────────────────────────────

  function normalizeKeyword(s) {
    return String(s == null ? '' : s)
      .trim()
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/é/g, 'e')
      .replace(/è/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/ë/g, 'e')
      .replace(/á/g, 'a')
      .replace(/à/g, 'a')
      .replace(/â/g, 'a')
      .replace(/í/g, 'i')
      .replace(/î/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ô/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/ñ/g, 'n');
  }

  function normalizeKeywords(keywordsMap) {
    var out = {};
    Object.keys(keywordsMap || {}).forEach(function (section) {
      out[section] = (keywordsMap[section] || []).map(normalizeKeyword);
    });
    return out;
  }

  function trimName(name) {
    return String(name == null ? '' : name).trim();
  }

  /** entity name → section, derived from article URLs containing /themenbereiche/<section>/. */
  function sectionsFromArticles(articles) {
    var map = {};
    (articles || []).forEach(function (a) {
      var m = /\/themenbereiche\/([a-z0-9-]+)\//.exec(a.url || '');
      if (!m) return;
      (a.entities || []).forEach(function (en) {
        var key = trimName(en);
        if (key && !map[key]) map[key] = m[1];
      });
    });
    return map;
  }

  /**
   * Assign every entity to exactly one section.
   * Priority: 1) article-URL sections, 2) keyword overlap (best score),
   * 3) fallback bucket 'weitere-begriffe'.
   * @returns {Object<string,string>} trimmed entity name → section slug
   */
  function assignEntitiesToSections(entities, articleSections, keywordsMap) {
    var kw = normalizeKeywords(keywordsMap);
    var derived = {};
    Object.keys(articleSections || {}).forEach(function (name) {
      var key = trimName(name);
      if (key) derived[key] = articleSections[name];
    });
    (entities || []).forEach(function (e) {
      var name = trimName(e && e.name);
      if (!name || derived[name]) return;
      var norm = normalizeKeyword(name);
      // priority 1.5: elements of the periodic table → Aufbau der Materie
      // (exact match only — 'Schwefelwasserstoff (H2S)' is NOT the element)
      if (ELEMENTS.indexOf(norm) !== -1) {
        derived[name] = ELEMENTS_SECTION;
        return;
      }
      var best = null;
      var bestScore = 0;
      Object.keys(kw).forEach(function (section) {
        var score = 0;
        kw[section].forEach(function (word) {
          if (norm.indexOf(word) !== -1) score += 1;
        });
        if (score > bestScore) {
          bestScore = score;
          best = section;
        }
      });
      derived[name] = best || FALLBACK_SECTION;
    });
    return derived;
  }

  /** { total, bySection } concept counts for the portal cards. */
  function sectionCounts(names, sectionOf) {
    var total = 0;
    var bySection = {};
    (names || []).forEach(function (name) {
      var s = sectionOf(name);
      total += 1;
      bySection[s] = (bySection[s] || 0) + 1;
    });
    return { total: total, bySection: bySection };
  }

  /** Portal card grid HTML in Lernpfad order; active section is highlighted. */
  function buildPortalHtml(bySection, order, active) {
    var html = '';
    (order || []).forEach(function (section) {
      var count = bySection[section] || 0;
      var isActive = active === section ? ' is-active' : '';
      var label = SECTION_LABELS[section] || section;
      var color = SECTION_COLORS[section] || '#bdc3c7';
      var target =
        section === FALLBACK_SECTION ? '/wissennetz/' : '/themenbereiche/' + section + '/';
      html +=
        '<button type="button" class="kg-portal-card' +
        isActive +
        '" data-section="' +
        section +
        '" title="Themenbereich öffnen: ' +
        label +
        '">' +
        '<span class="kg-portal-swatch" style="background:' +
        color +
        '"></span>' +
        '<span class="kg-portal-name">' +
        label +
        '</span>' +
        '<span class="kg-portal-count" data-count="' +
        count +
        '">' +
        count +
        ' Begriffe</span>' +
        '<a class="kg-portal-link" href="' +
        target +
        '">Themenbereich</a>' +
        '</button>';
    });
    return html;
  }

  /**
   * Search ranking: prefix matches first (case/umlaut-insensitive), then
   * substring matches; returns trimmed entity names, capped at `limit`.
   */
  function buildSearchResults(query, entities, limit) {
    var q = normalizeKeyword(query);
    if (!q) return [];
    var prefix = [];
    var substring = [];
    (entities || []).forEach(function (e) {
      var name = trimName(e && e.name);
      if (!name) return;
      var norm = normalizeKeyword(name);
      if (norm.indexOf(q) !== -1) {
        if (norm.indexOf(q) === 0) prefix.push(name);
        else substring.push(name);
      }
    });
    var cap = limit || 6;
    return prefix.concat(substring).slice(0, cap);
  }

  // ── DOM wiring (init) ────────────────────────────────────────────────

  function el(id) {
    return typeof document !== 'undefined' && document.getElementById
      ? document.getElementById(id)
      : null;
  }

  function renderPortals(entities, articleSections) {
    var map = assignEntitiesToSections(entities, articleSections, SECTION_KEYWORDS);
    var names = Object.keys(map);
    var counts = sectionCounts(names, function (n) {
      return map[n];
    });
    var order = SECTION_ORDER.slice();
    if (counts.bySection[FALLBACK_SECTION]) order.push(FALLBACK_SECTION);
    var portals = el('kg-portals');
    if (portals) portals.innerHTML = buildPortalHtml(counts.bySection, order);
    return { map: map, counts: counts, order: order };
  }

  function init() {
    var container = el('kg-app');
    var portals = el('kg-portals');
    if (!container) return null;

    var state = null;
    var fetchImpl = typeof fetch === 'function' ? fetch : null;
    if (!fetchImpl) return null;

    fetchImpl(TOPICS_URL, { signal: AbortSignal.timeout(15000) })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        state = renderPortals(data.entities || [], data.articles || []);
        var fullBtn = el('kg-full-graph-btn');
        if (fullBtn) fullBtn.style.display = 'inline-flex';
        if (portals) portals.style.display = 'grid';
        var app = el('kg-app');
        if (app && typeof globalThis.D3EgoGraph !== 'undefined') {
          var graph = globalThis.D3EgoGraph;
          if (graph.createTopicGraph) {
            // click delegation for portal cards
            portals.addEventListener('click', function (ev) {
              var card = ev.target.closest ? ev.target.closest('[data-section]') : null;
              if (!card || ev.target.closest('.kg-portal-link')) return;
              var section = card.getAttribute('data-section');
              if (!section || !state || !state.map) return;
              var slugs = [];
              Object.keys(state.map).forEach(function (name) {
                if (state.map[name] === section) slugs.push(slugifyFor(name));
              });
              graph.createTopicGraph(container, data, {
                topic: section,
                topicSlugs: slugs,
                cap: 80,
                hintContainer: el('kg-hint'),
              });
              setBreadcrumb(SECTION_LABELS[section] || section);
            });
          }
          var search = el('kg-search');
          if (search && graph.createEgoGraph) {
            var timer = null;
            search.addEventListener('input', function () {
              if (timer) clearTimeout(timer);
              timer = setTimeout(function () {
                var q = (search.value || '').trim();
                if (q.length < 2) {
                  if (state) renderPortalsFor(data, state);
                  return;
                }
                var hits = buildSearchResults(q, data.entities || [], 6);
                if (!hits.length) {
                  container.innerHTML = buildEmptySearchHtml(q);
                  return;
                }
                graph.createEgoGraph(container, data, { matches: hits, cap: 30 });
                setBreadcrumb('Suche: ' + q);
              }, 250);
            });
          }
          var fullBtn2 = el('kg-full-graph-btn');
          if (fullBtn2 && graph.createFullGraph) {
            fullBtn2.addEventListener('click', function () {
              graph.createFullGraph(container, data, {
                filterControls: el('kg-controls'),
                showLegend: true,
                height: 700,
              });
              setBreadcrumb('Gesamtübersicht');
            });
          }
        }
      })
      .catch(function () {
        var app = el('kg-app');
        if (app) {
          app.innerHTML =
            '<p style="padding:2em;color:#888;">Wissensnetz konnte nicht geladen werden. ' +
            '<a href="/wissennetz/">Erneut versuchen</a></p>';
        }
      });
    return true;
  }

  function slugifyFor(name) {
    if (globalThis.Slugs && typeof globalThis.Slugs.slugify === 'function') {
      return globalThis.Slugs.slugify(name);
    }
    // minimal fallback (Slugs.js is loaded before this module on the page)
    var s = String(name)
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-');
    if (s.charAt(0) === '-') s = s.slice(1);
    if (s.charAt(s.length - 1) === '-') s = s.slice(0, -1);
    return s;
  }

  function renderPortalsFor() {
    var portals = el('kg-portals');
    var app = el('kg-app');
    if (portals) portals.style.display = 'grid';
    if (app) app.innerHTML = '';
    setBreadcrumb('Wissensnetz');
  }

  function setBreadcrumb(label) {
    var crumb = el('kg-breadcrumb');
    if (crumb) crumb.textContent = label ? 'Wissensnetz / ' + label : 'Wissensnetz';
  }

  function buildEmptySearchHtml(query) {
    return (
      '<p class="kg-empty" data-query="' +
      String(query).replace(/"/g, '&quot;') +
      '">Keine Begriffe zu „' +
      String(query).replace(/</g, '&lt;') +
      '“ gefunden.</p>'
    );
  }

  window.WissennetzHub = {
    SECTION_LABELS,
    SECTION_ORDER,
    SECTION_KEYWORDS,
    sectionsFromArticles,
    assignEntitiesToSections,
    sectionCounts,
    buildPortalHtml,
    buildSearchResults,
    buildEmptySearchHtml,
    renderPortals,
    init,
  };
})();
