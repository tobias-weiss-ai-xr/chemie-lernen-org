/**
 * lernkarten-review.js — FSRS-based Spaced Repetition Review UI
 * Browser global (sourceType: 'script'), loaded via <script> tag
 */
(function () {
  'use strict';

  var API = '/api/fsrs';
  var cards = [];
  var currentIndex = 0;
  var isFlipped = false;
  var isSubmitting = false;
  var reviewCountToday = 0;

  // ── DOM refs ───────────────────────────────────────────
  var elLoading = document.getElementById('lr-loading');
  var elCardArea = document.getElementById('lr-card-area');
  var elEmpty = document.getElementById('lr-empty');
  var elError = document.getElementById('lr-error');
  var elErrorMsg = document.getElementById('lr-error-msg');
  var elCardInner = document.getElementById('lr-card-inner');
  var elQuestion = document.getElementById('lr-question-text');
  var elAnswer = document.getElementById('lr-answer-text');
  var elButtons = document.getElementById('lr-buttons');
  var elTopicBadge = document.getElementById('lr-topic-badge');
  var elCountToday = document.getElementById('lr-count-today');
  var elCountRemaining = document.getElementById('lr-count-remaining');
  var elCountTotal = document.getElementById('lr-count-total');

  // ── Init ───────────────────────────────────────────────
  function init() {
    loadDueCards();
    loadStats();
  }

  // ── Fetch due cards ────────────────────────────────────
  function loadDueCards() {
    showLoading();

    fetch(API + '/cards', {
      credentials: 'same-origin',
    })
      .then(function (r) {
        if (r.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!r.ok) {
          return r.json().then(function (data) {
            throw new Error(data.error || 'Karten konnten nicht geladen werden');
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        cards = data.cards || [];
        reviewCountToday = data.reviewedToday || 0;
        currentIndex = 0;
        isFlipped = false;

        if (cards.length === 0) {
          showEmptyState();
          updateStats(0);
          return;
        }

        showCardArea();
        updateStats(cards.length);
        renderCard(0);
      })
      .catch(function (err) {
        showError(err.message || 'Verbindungsfehler');
      });
  }

  // ── Render card ────────────────────────────────────────
  function renderCard(index) {
    if (index >= cards.length) {
      showEmptyState();
      return;
    }

    var card = cards[index];
    elQuestion.textContent = card.question || 'Keine Frage';
    elAnswer.textContent = card.answer || 'Keine Antwort';

    // Reset flip
    isFlipped = false;
    elCardInner.classList.remove('lr-card-flipped');
    elButtons.style.display = 'none';

    // Topic badge
    if (card.topic) {
      elTopicBadge.textContent = card.topic;
      elTopicBadge.style.display = 'inline-block';
    } else {
      elTopicBadge.style.display = 'none';
    }

    updateStats(cards.length - index);
  }

  // ── Flip card ──────────────────────────────────────────
  function flipCard(e) {
    // Ignore clicks on score buttons
    if (e && e.target && e.target.closest('.lr-btn')) return;
    if (isSubmitting) return;

    isFlipped = !isFlipped;
    elCardInner.classList.toggle('lr-card-flipped');

    if (isFlipped) {
      elButtons.style.display = 'flex';
    } else {
      elButtons.style.display = 'none';
    }
  }

  // ── Submit review ──────────────────────────────────────
  function submitReview(score) {
    if (isSubmitting || !isFlipped) return;
    var card = cards[currentIndex];
    if (!card || !card.id) return;

    isSubmitting = true;
    elButtons.style.display = 'none';

    fetch(API + '/cards/' + encodeURIComponent(card.id) + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ score: score }),
    })
      .then(function (r) {
        if (r.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!r.ok) {
          return r.json().then(function (data) {
            throw new Error(data.error || 'Bewertung fehlgeschlagen');
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        isSubmitting = false;
        reviewCountToday++;
        currentIndex++;
        renderCard(currentIndex);
      })
      .catch(function (err) {
        isSubmitting = false;
        elButtons.style.display = 'flex';
        showError(err.message || 'Fehler beim Speichern');
      });
  }

  // ── Load stats ─────────────────────────────────────────
  function loadStats() {
    fetch(API + '/cards/stats', {
      credentials: 'same-origin',
    })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (data) {
        if (data) {
          if (elCountToday) elCountToday.textContent = data.reviewedToday || 0;
          if (elCountTotal) elCountTotal.textContent = data.totalCards || 0;
        }
      })
      .catch(function () {
        // Silent fail for stats
      });
  }

  // ── Update stats bar ───────────────────────────────────
  function updateStats(remaining) {
    if (elCountToday) elCountToday.textContent = reviewCountToday;
    if (elCountRemaining) elCountRemaining.textContent = remaining || 0;
    if (elCountTotal) elCountTotal.textContent = cards.length;
  }

  // ── UI state helpers ───────────────────────────────────
  function showLoading() {
    elLoading.style.display = 'block';
    elCardArea.style.display = 'none';
    elEmpty.style.display = 'none';
    elError.style.display = 'none';
  }

  function showCardArea() {
    elLoading.style.display = 'none';
    elCardArea.style.display = 'block';
    elEmpty.style.display = 'none';
    elError.style.display = 'none';
  }

  function showEmptyState() {
    elLoading.style.display = 'none';
    elCardArea.style.display = 'none';
    elEmpty.style.display = 'block';
    elError.style.display = 'none';
    if (elCountRemaining) elCountRemaining.textContent = '0';
  }

  function showError(msg) {
    elLoading.style.display = 'none';
    elCardArea.style.display = 'none';
    elEmpty.style.display = 'none';
    elError.style.display = 'block';
    elErrorMsg.textContent = msg;
  }

  // ── Keyboard handlers ──────────────────────────────────
  document.addEventListener('keydown', function (e) {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (isFlipped) return; // Space after flip is no-op (use 1-4)
        flipCard(e);
        break;
      case '1':
        submitReview(0);
        break;
      case '2':
        submitReview(0.33);
        break;
      case '3':
        submitReview(0.66);
        break;
      case '4':
        submitReview(1.0);
        break;
    }
  });

  // ── Public API ─────────────────────────────────────────
  window.LernkartenReview = {
    init: init,
    loadDueCards: loadDueCards,
    flipCard: flipCard,
    submitReview: submitReview,
  };

  // ── Auto-init ──────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
