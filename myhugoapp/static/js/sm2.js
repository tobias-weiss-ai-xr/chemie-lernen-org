/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 *
 * Export: SM2.calculate(quality, repetitions, ease, interval)
 * quality: 0-5 (0=complete blackout, 5=perfect response)
 */
(function () {
  'use strict';

  var SM2 = {};

  /**
   * Calculate new SM-2 parameters after a review.
   *
   * @param {number} quality - 0 to 5 (0=forgot, 5=perfect)
   * @param {number} repetitions - Number of consecutive correct reviews
   * @param {number} ease - Ease factor (default 2.5)
   * @param {number} interval - Current interval in days
   * @returns {{ ease: number, interval: number, repetitions: number, nextReview: Date, status: string }}
   */
  SM2.calculate = function (quality, repetitions, ease, interval) {
    // Validate inputs
    quality = Math.max(0, Math.min(5, Math.round(quality)));
    repetitions = Math.max(0, Math.floor(repetitions));
    ease = Math.max(1.3, ease || 2.5);
    interval = Math.max(0, Math.floor(interval || 0));

    var status;
    var newRepetitions;
    var newInterval;
    var newEase;

    if (quality < 3) {
      // Failed recall — reset
      newRepetitions = 0;
      newInterval = 1;
      status = 'failed';
    } else {
      // Successful recall
      newRepetitions = repetitions + 1;

      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * ease);
      }

      status = 'reviewed';
    }

    // Update ease factor
    newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEase < 1.3) {
      newEase = 1.3;
    }

    // Calculate next review date
    var nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      ease: Math.round(newEase * 100) / 100,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReview: nextReview,
      status: status,
    };
  };

  /**
   * Get cards due for review from an array of SM-2 card data.
   * Each card: { id, ease, interval, repetitions, lastReview (ISO string) }
   */
  SM2.getDueCards = function (cards) {
    if (!cards || !cards.length) return [];

    var now = new Date();
    var due = [];

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (!card.lastReview) {
        due.push(card);
        continue;
      }
      var lastReviewDate = new Date(card.lastReview);
      var nextDate = new Date(lastReviewDate);
      nextDate.setDate(nextDate.getDate() + (card.interval || 1));

      if (nextDate <= now) {
        due.push(card);
      }
    }

    // Sort by due date (oldest first)
    due.sort(function (a, b) {
      var aDate = a.lastReview ? new Date(a.lastReview) : new Date(0);
      var bDate = b.lastReview ? new Date(b.lastReview) : new Date(0);
      var aNext = new Date(aDate);
      aNext.setDate(aNext.getDate() + (a.interval || 1));
      var bNext = new Date(bDate);
      bNext.setDate(bNext.getDate() + (b.interval || 1));
      return aNext - bNext;
    });

    return due;
  };

  /**
   * Calculate review urgency score (0-1) for sorting.
   * Higher = more urgent.
   */
  SM2.calculateUrgency = function (card) {
    if (!card || !card.lastReview) return 1;

    var now = new Date();
    var lastReview = new Date(card.lastReview);
    var intervalMs = (card.interval || 1) * 24 * 60 * 60 * 1000;
    var dueDate = new Date(lastReview.getTime() + intervalMs);
    var overdueMs = now - dueDate;

    // If overdue, urgency > 0.5; if not yet due, urgency 0-0.5
    if (overdueMs > 0) {
      return Math.min(1, 0.5 + overdueMs / intervalMs);
    } else {
      return Math.max(0, 0.5 - (Math.abs(overdueMs) / intervalMs) * 0.5);
    }
  };

  // Export as browser global
  window.SM2 = SM2;

  // For Node.js tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SM2: SM2 };
  }
})();
