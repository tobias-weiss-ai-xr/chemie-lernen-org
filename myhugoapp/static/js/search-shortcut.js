/**
 * search-shortcut.js — UXF-021: „/" fokussiert das Suchfeld
 *
 * Global geladen (head.html). „/" fokussiert das erste sichtbare Suchfeld
 * der Seite (input[type=search] oder [data-search-shortcut]), Escape blurrt.
 * Ignoriert Eingaben in Feldern (input/textarea/select/contenteditable) und
 * alle Modifikator-Kombis — kein Eingriff in normales Tippen.
 */
(function () {
  'use strict';

  function firstVisibleSearchField() {
    var candidates = document.querySelectorAll(
      '[data-search-shortcut], main input[type="search"], input.cts-input, #mh-search-input, #state-topic-filter-input, #nf-search-input'
    );
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.offsetParent !== null && !el.disabled) return el;
    }
    return null;
  }

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.altKey || e.metaKey) return;
    var active = document.activeElement;
    if (isTypingTarget(active)) return; // Nutzer tippt bereits
    var field = firstVisibleSearchField();
    if (!field) return;
    e.preventDefault();
    field.focus();
    // Cursor ans Ende (bessere Vorbelegungs-Ergänzung)
    var len = (field.value || '').length;
    try {
      field.setSelectionRange(len, len);
    } catch (err) {
      /* type=search ohne Selection-API */
    }
  });

  // Escape verlässt Suchfelder (sofern die Seite nichts Eigenes tut)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !isTypingTarget(document.activeElement)) return;
    var tag = (document.activeElement.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return;
    if ((document.activeElement.getAttribute('type') || '') !== 'search') return;
    document.activeElement.blur();
  });
})();
