/**
 * Progress Tracker
 * IndexedDB-based persistent progress tracking for interactive chemistry modules
 */

const _ProgressTracker = {
  DB_NAME: 'ChemieLernenProgress',
  DB_VERSION: 1,
  db: null,

  /**
   * Open IndexedDB connection
   */
  async openDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('achievements')) {
          db.createObjectStore('achievements', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'date' });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Save progress for a specific exercise
   */
  async saveExerciseProgress(module, exerciseId, data) {
    const db = await this.openDB();
    const tx = db.transaction('exercises', 'readwrite');
    const store = tx.objectStore('exercises');
    const record = {
      id: `${module}:${exerciseId}`,
      module,
      exerciseId,
      ...data,
      lastAttempt: new Date().toISOString(),
    };
    store.put(record);
    await this.updateDailyStats();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve(record);
        // Notify gamification engine if available
        if (typeof GamificationEngine !== 'undefined') {
          const correct = data.correct || 0;
          const total = data.total || 0;
          setTimeout(() => {
            GamificationEngine.processExerciseResult(module, exerciseId, correct, total);
          }, 100);
        }
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Get progress for a specific exercise
   */
  async getExerciseProgress(module, exerciseId) {
    const db = await this.openDB();
    const tx = db.transaction('exercises', 'readonly');
    const store = tx.objectStore('exercises');
    return new Promise((resolve) => {
      const request = store.get(`${module}:${exerciseId}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  },

  /**
   * Get all progress for a module
   */
  async getModuleProgress(module) {
    const db = await this.openDB();
    const tx = db.transaction('exercises', 'readonly');
    const store = tx.objectStore('exercises');
    return new Promise((resolve) => {
      const results = [];
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.module === module) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => resolve([]);
    });
  },

  /**
   * Get all progress entries
   */
  async getAllProgress() {
    const db = await this.openDB();
    const tx = db.transaction('exercises', 'readonly');
    const store = tx.objectStore('exercises');
    return new Promise((resolve) => {
      const _results = [];
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  },

  /**
   * Get summary stats per module
   */
  async getModuleStats() {
    const all = await this.getAllProgress();
    const stats = {};
    all.forEach((entry) => {
      if (!stats[entry.module]) {
        stats[entry.module] = { total: 0, correct: 0, completed: 0 };
      }
      stats[entry.module].total += entry.total || 0;
      stats[entry.module].correct += entry.correct || 0;
      if (entry.completed) {
        stats[entry.module].completed++;
      }
    });
    return stats;
  },

  /**
   * Update daily stats (streak tracking)
   */
  async updateDailyStats() {
    const db = await this.openDB();
    const today = new Date().toISOString().split('T')[0];
    const tx = db.transaction('stats', 'readwrite');
    const store = tx.objectStore('stats');
    return new Promise((resolve) => {
      const request = store.get(today);
      request.onsuccess = () => {
        const existing = request.result || { date: today, count: 0, streak: 1 };
        existing.count = (existing.count || 0) + 1;
        existing.lastActive = new Date().toISOString();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().split('T')[0];

        const getYesterday = store.get(yKey);
        getYesterday.onsuccess = () => {
          if (getYesterday.result) {
            existing.streak = (getYesterday.result.streak || 0) + 1;
          } else {
            existing.streak = 1;
          }
          store.put(existing);
          resolve(existing);
        };
        getYesterday.onerror = () => {
          existing.streak = 1;
          store.put(existing);
          resolve(existing);
        };
      };
      request.onerror = () => resolve(null);
    });
  },

  /**
   * Get current streak
   */
  async getStreak() {
    const db = await this.openDB();
    const tx = db.transaction('stats', 'readonly');
    const store = tx.objectStore('stats');
    return new Promise((resolve) => {
      const results = [];
      const request = store.openCursor(null, 'prev');
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          if (results.length < 3) cursor.continue();
          else resolve(results);
        } else {
          resolve(results);
        }
      };
      request.onerror = () => resolve([]);
    }).then((days) => {
      if (days.length === 0) return 0;
      const today = new Date().toISOString().split('T')[0];
      const lastActive = days[0].date;
      if (lastActive === today || lastActive === this.yesterday()) {
        return days[0].streak || 0;
      }
      return 0;
    });
  },

  /**
   * Unlock an achievement
   */
  async unlockAchievement(id, name, description, icon) {
    const db = await this.openDB();
    const tx = db.transaction('achievements', 'readwrite');
    const store = tx.objectStore('achievements');
    const existing = await new Promise((resolve) => {
      const r = store.get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    });
    if (existing) return false;
    const achievement = { id, name, description, icon, earnedAt: new Date().toISOString() };
    store.put(achievement);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },

  /**
   * Get all achievements
   */
  async getAchievements() {
    const db = await this.openDB();
    const tx = db.transaction('achievements', 'readonly');
    const store = tx.objectStore('achievements');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  },

  /**
   * Reset all progress
   */
  async resetProgress() {
    const db = await this.openDB();
    const stores = ['exercises', 'achievements', 'stats'];
    stores.forEach((name) => {
      const tx = db.transaction(name, 'readwrite');
      tx.objectStore(name).clear();
    });
  },

  yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  },
};
