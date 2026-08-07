/**
 * Simple offline grade queue for AI-generated exercise answers.
 * Stores queued submissions in localStorage under 'chemie-offline-grades'
 * and drains them when the browser comes back online (task 7.5).
 */
class QuizGradeQueue {
  constructor() {
    this.STORAGE_KEY = 'chemie-offline-grades';
    this.listenersAdded = false;
    this.addOnlineListener();
  }

  addOnlineListener() {
    if (this.listenersAdded) return;
    this.listenersAdded = true;
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => this.drain());
      // Drain any stale queue on first construction
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.drain();
      }
    }
  }

  enqueue(exerciseId, answer) {
    if (typeof localStorage === 'undefined' || !localStorage.setItem) return false;
    try {
      var queue = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      queue.push({ exerciseId: exerciseId, answer: answer, ts: Date.now() });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      return false;
    }
  }

  drain() {
    if (typeof localStorage === 'undefined' || typeof fetch !== 'function') return;
    var queue = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    if (!queue.length) return;

    var self = this;
    // Take a copy to avoid mutation while sending
    var toSend = queue.slice();
    localStorage.removeItem(self.STORAGE_KEY);
    // Process one by one to avoid bulk failure
    var next = function () {
      if (!toSend.length) {
        return;
      }
      var item = toSend.shift();
      try {
        fetch('/api/exercises/grade', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ exerciseId: item.exerciseId, answer: item.answer }),
        }).catch(function () {});
      } catch (e) {}
      // Give the network a breath
      setTimeout(next, 200);
    };
    next();
  }
}

module.exports = { QuizGradeQueue };
