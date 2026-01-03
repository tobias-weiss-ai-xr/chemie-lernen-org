/**
 * Progress Tracking System for chemie-lernen.org
 * Tracks learning progress across topics
 */

class ProgressTracker {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-progress';
    this.topics = [];
    this.progress = this.loadProgress();
  }

  /**
   * Register a topic for tracking
   */
  registerTopic(topicId, topicData) {
    this.topics.push({
      id: topicId,
      title: topicData.title,
      category: topicData.category || 'general',
      difficulty: topicData.difficulty || 'grundlagen',
      url: topicData.url
    });

    // Initialize progress if not exists
    if (!this.progress[topicId]) {
      this.progress[topicId] = {
        visited: false,
        completed: false,
        quizScore: 0,
        quizAttempts: 0,
        lastVisited: null,
        timeSpent: 0
      };
    }
  }

  /**
   * Mark topic as visited
   */
  markVisited(topicId) {
    if (this.progress[topicId]) {
      this.progress[topicId].visited = true;
      this.progress[topicId].lastVisited = new Date().toISOString();
      this.saveToStorage();
    }
  }

  /**
   * Mark topic as completed
   */
  markCompleted(topicId, score = 100) {
    if (this.progress[topicId]) {
      this.progress[topicId].completed = true;
      this.progress[topicId].quizScore = score;
      this.saveToStorage();
      this.renderProgressWidget();
    }
  }

  /**
   * Record quiz attempt
   */
  recordQuizAttempt(topicId, score) {
    if (this.progress[topicId]) {
      this.progress[topicId].quizAttempts++;
      this.progress[topicId].quizScore = Math.max(
        this.progress[topicId].quizScore,
        score
      );
      if (score >= 70) {
        this.progress[topicId].completed = true;
      }
      this.saveToStorage();
    }
  }

  /**
   * Add time spent on topic (in seconds)
   */
  addTimeSpent(topicId, seconds) {
    if (this.progress[topicId]) {
      this.progress[topicId].timeSpent += seconds;
      this.saveToStorage();
    }
  }

  /**
   * Get progress for a topic
   */
  getTopicProgress(topicId) {
    return this.progress[topicId] || {
      visited: false,
      completed: false,
      quizScore: 0,
      quizAttempts: 0,
      lastVisited: null,
      timeSpent: 0
    };
  }

  /**
   * Get overall statistics
   */
  getStatistics() {
    const totalTopics = this.topics.length;
    const visitedTopics = Object.values(this.progress)
      .filter(p => p.visited).length;
    const completedTopics = Object.values(this.progress)
      .filter(p => p.completed).length;
    const totalQuizAttempts = Object.values(this.progress)
      .reduce((sum, p) => sum + p.quizAttempts, 0);
    const averageQuizScore = Object.values(this.progress)
      .filter(p => p.quizScore > 0)
      .reduce((sum, p, _, arr) => sum + p.quizScore / arr.length, 0);
    const totalTimeSpent = Object.values(this.progress)
      .reduce((sum, p) => sum + p.timeSpent, 0);

    return {
      totalTopics: totalTopics,
      visitedTopics: visitedTopics,
      completedTopics: completedTopics,
      completionPercentage: totalTopics > 0
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0,
      visitPercentage: totalTopics > 0
        ? Math.round((visitedTopics / totalTopics) * 100)
        : 0,
      totalQuizAttempts: totalQuizAttempts,
      averageQuizScore: Math.round(averageQuizScore),
      totalTimeSpent: totalTimeSpent,
      totalTimeSpentHours: (totalTimeSpent / 3600).toFixed(1)
    };
  }

  /**
   * Get progress by category
   */
  getProgressByCategory() {
    const categories = {};

    this.topics.forEach(topic => {
      if (!categories[topic.category]) {
        categories[topic.category] = {
          total: 0,
          visited: 0,
          completed: 0
        };
      }
      categories[topic.category].total++;

      const progress = this.progress[topic.id];
      if (progress) {
        if (progress.visited) categories[topic.category].visited++;
        if (progress.completed) categories[topic.category].completed++;
      }
    });

    return categories;
  }

  /**
   * Render progress widget
   */
  renderProgressWidget(containerId = 'progress-widget') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = this.getStatistics();

    container.innerHTML = `
      <div class="progress-widget">
        <h3 class="widget-title">📊 Ihr Lernfortschritt</h3>

        <div class="progress-overview">
          <div class="progress-circle">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="circle"
                stroke-dasharray="${stats.completionPercentage}, 100"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" class="percentage">
                ${stats.completionPercentage}%
              </text>
            </svg>
          </div>
          <div class="progress-details">
            <div class="detail-item">
              <span class="detail-label">Besucht:</span>
              <span class="detail-value">${stats.visitedTopics}/${stats.totalTopics}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Abgeschlossen:</span>
              <span class="detail-value">${stats.completedTopics}/${stats.totalTopics}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Quiz-Durchschnitt:</span>
              <span class="detail-value">${stats.averageQuizScore}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Lernzeit:</span>
              <span class="detail-value">${stats.totalTimeSpentHours}h</span>
            </div>
          </div>
        </div>

        <div class="topic-list">
          ${this.topics.map(topic => this.renderTopicItem(topic)).join('')}
        </div>

        <div class="progress-actions">
          <button onclick="progressTracker.resetProgress()" class="btn-reset">
            🔄 Fortschritt zurücksetzen
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render single topic item
   */
  renderTopicItem(topic) {
    const progress = this.getTopicProgress(topic.id);
    const statusClass = progress.completed ? 'completed' :
                       progress.visited ? 'visited' : 'not-visited';
    const statusIcon = progress.completed ? '✅' :
                      progress.visited ? '📖' : '⭕';

    return `
      <div class="topic-item ${statusClass}">
        <a href="${topic.url}" class="topic-link">
          <span class="topic-icon">${statusIcon}</span>
          <span class="topic-title">${topic.title}</span>
        </a>
        ${progress.quizScore > 0 ? `
          <span class="topic-score">${progress.quizScore}%</span>
        ` : ''}
      </div>
    `;
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading progress:', e);
      return {};
    }
  }

  /**
   * Save progress to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  /**
   * Reset all progress
   */
  resetProgress() {
    if (confirm('Möchten Sie wirklich Ihren gesamten Lernfortschritt zurücksetzen?')) {
      this.progress = {};
      this.saveToStorage();
      this.renderProgressWidget();
    }
  }

  /**
   * Reset progress for specific topic
   */
  resetTopicProgress(topicId) {
    if (this.progress[topicId]) {
      this.progress[topicId] = {
        visited: false,
        completed: false,
        quizScore: 0,
        quizAttempts: 0,
        lastVisited: null,
        timeSpent: 0
      };
      this.saveToStorage();
    }
  }
}

// Global progress tracker instance
const progressTracker = new ProgressTracker({
  storageKey: 'chemie-lernen-progress'
});

// Initialize topics
progressTracker.registerTopic('einfuehrung-chemie', {
  title: 'Einführung in die Chemie',
  category: 'grundlagen',
  difficulty: 'grundlagen',
  url: '/themenbereiche/einfuehrung-chemie/'
});

progressTracker.registerTopic('aufbau-materie', {
  title: 'Aufbau der Materie',
  category: 'grundlagen',
  difficulty: 'grundlagen',
  url: '/themenbereiche/aufbau-materie/'
});

progressTracker.registerTopic('saeuren-basen', {
  title: 'Säuren und Basen',
  category: 'anorganisch',
  difficulty: 'mittelstufe',
  url: '/themenbereiche/saeuren-basen/'
});

progressTracker.registerTopic('anorganische-verbindungen', {
  title: 'Anorganische Verbindungen',
  category: 'anorganisch',
  difficulty: 'mittelstufe',
  url: '/themenbereiche/anorganische-verbindungen/'
});

progressTracker.registerTopic('redox-elektrochemie', {
  title: 'Redoxreaktionen und Elektrochemie',
  category: 'physikalisch',
  difficulty: 'mittelstufe',
  url: '/themenbereiche/redox-elektrochemie/'
});

progressTracker.registerTopic('gleichgewicht-geschwindigkeit', {
  title: 'Gleichgewicht und Geschwindigkeit',
  category: 'physikalisch',
  difficulty: 'fortgeschritten',
  url: '/themenbereiche/gleichgewicht-geschwindigkeit/'
});

progressTracker.registerTopic('energetik', {
  title: 'Energetik',
  category: 'physikalisch',
  difficulty: 'fortgeschritten',
  url: '/themenbereiche/energetik/'
});

progressTracker.registerTopic('tipps-tricks', {
  title: 'Tipps und Tricks',
  category: 'allgemein',
  difficulty: 'alle',
  url: '/themenbereiche/tipps-tricks/'
});

// Auto-mark current page as visited
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const currentTopic = progressTracker.topics.find(t =>
    t.url.replace(/\/$/, '') === currentPath
  );

  if (currentTopic) {
    progressTracker.markVisited(currentTopic.id);

    // Track time spent on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', function() {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      progressTracker.addTimeSpent(currentTopic.id, timeSpent);
    });
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProgressTracker, progressTracker };
}
