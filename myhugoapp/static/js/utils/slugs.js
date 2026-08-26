/* global globalThis */
/**
 * Canonical slug utilities — SINGLE SOURCE OF TRUTH for entity URLs.
 * Shared by the browser (plain script via globalThis.Slugs) and by Node
 * build scripts (scripts/lib/slugs.mjs re-exports this file).
 *
 * Rules (see spec "Part A1"): lowercase, ä→ae ö→oe ü→ue ß→ss, other
 * diacritics stripped via NFD, subscript digits mapped to plain digits,
 * every run of non [a-z0-9] becomes a single dash, edges trimmed.
 *
 * Verified against the live entity corpus (200+ names, 2026-08-27):
 * for every name without subscript digits the output is byte-identical
 * to the previous generator slugify, i.e. zero canonical-slug churn.
 */
(function (root) {
  'use strict';

  var SUBSCRIPT_MAP = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  };

  function slugify(name) {
    var s = String(name === null || name === undefined ? '' : name);
    // German transliteration FIRST (before NFD would strip the umlaut marker)
    s = s.replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss');
    // General diacritics: decompose and drop combining marks
    s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = s.toLowerCase();
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function (ch) {
      return SUBSCRIPT_MAP[ch];
    });
    s = s.replace(/[^a-z0-9]+/g, '-');
    return s.replace(/^-+|-+$/g, '');
  }

  function entityUrl(name) {
    return '/entity/' + slugify(name) + '/';
  }

  /**
   * Legacy-alias slug: lowercase, keep German umlauts, replace all other
   * runs of non [a-z0-9äöüß] with a dash. Used ONLY to emit redirect pages
   * for old umlaut URLs; never for building current links.
   */
  function rawSlug(name) {
    var s = String(name === null || name === undefined ? '' : name).toLowerCase();
    s = s.replace(/[^a-z0-9äöüß]+/g, '-');
    return s.replace(/^-+|-+$/g, '');
  }

  root.Slugs = { slugify: slugify, entityUrl: entityUrl, rawSlug: rawSlug };
})(typeof globalThis !== 'undefined' ? globalThis : this);
