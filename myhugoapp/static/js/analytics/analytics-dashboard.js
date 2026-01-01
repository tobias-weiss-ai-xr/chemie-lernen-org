/**
 * Analytics Dashboard
 * Visualizes learning progress and analytics
 */

const AnalyticsDashboard = {
  /**
   * Create analytics dashboard
   */
  create(options = {}) {
    const {
      showDetails = true,
      showRecommendations = true,
      showAchievements = true
    } = options;

    const container = document.createElement('div');
    container.className = 'analytics-dashboard';
    container.id = 'analytics-dashboard';

    // Create dashboard sections
    container.appendChild(this.createSummaryCard());
    container.appendChild(this.createProgressChart());
    container.appendChild(this.createPerformanceStats());

    if (showDetails) {
      container.appendChild(this.createCategoryBreakdown());
    }

    if (showRecommendations) {
      container.appendChild(this.createRecommendationsCard());
    }

    if (showAchievements) {
      container.appendChild(this.createAchievementsCard());
    }

    // Add styles
    this.addStyles();

    return container;
  },

  /**
   * Create summary card
   */
  createSummaryCard() {
    const progress = AnalyticsManager.getProgress();
    const stats = AnalyticsManager.getStats();
    const streak = AnalyticsManager.getStreak();

    const overallAccuracy = progress.totalAttempts > 0
      ? ((progress.correctAttempts / progress.totalAttempts) * 100).toFixed(1)
      : 0;

    const card = document.createElement('div');
    card.className = 'analytics-card summary-card';
    card.innerHTML = `
      <h3>Learning Progress</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${progress.level || 1}</span>
          <span class="stat-label">Level</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${overallAccuracy}%</span>
          <span class="stat-label">Accuracy</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${progress.totalAttempts}</span>
          <span class="stat-label">Total Attempts</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${streak.current}</span>
          <span class="stat-label">Current Streak</span>
        </div>
      </div>
    `;

    return card;
  },

  /**
   * Create progress chart
   */
  createProgressChart() {
    const progress = AnalyticsManager.getProgress();
    const insights = AnalyticsManager.getInsights();

    const card = document.createElement('div');
    card.className = 'analytics-card progress-chart';
    card.innerHTML = `
      <h3>Performance by Category</h3>
      <div class="progress-chart-container">
        ${this.renderCategoryBars(progress.categories)}
      </div>
      <div class="insights-summary">
        <p>${insights.summary}</p>
      </div>
    `;

    return card;
  },

  /**
   * Render category performance bars
   */
  renderCategoryBars(categories) {
    const bars = [];

    for (const [category, data] of Object.entries(categories)) {
      if (data.totalAttempts < 5) continue; // Skip categories with few attempts

      const accuracy = ((data.correctAttempts / data.totalAttempts) * 100).toFixed(1);
      const barWidth = accuracy;
      const barColor = accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FFC107' : '#F44336';

      bars.push(`
        <div class="category-bar">
          <div class="category-info">
            <span class="category-name">${this.formatCategoryName(category)}</span>
            <span class="category-accuracy">${accuracy}%</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${barWidth}%; background-color: ${barColor};"></div>
          </div>
          <div class="category-details">
            <span>${data.correctAttempts}/${data.totalAttempts} correct</span>
          </div>
        </div>
      `);
    }

    if (bars.length === 0) {
      return '<p class="no-data">Complete more calculations to see performance data</p>';
    }

    return bars.join('');
  },

  /**
   * Create performance stats card
   */
  createPerformanceStats() {
    const stats = AnalyticsManager.getStats();
    const sessions = AnalyticsManager.getSessions();

    const avgSessionLength = stats.avgSessionLength
      ? this.formatDuration(stats.avgSessionLength)
      : '0 min';

    const card = document.createElement('div');
    card.className = 'analytics-card stats-card';
    card.innerHTML = `
      <h3>Study Statistics</h3>
      <div class="stats-grid">
        <div class="stat-row">
          <span class="stat-label">Total Sessions:</span>
          <span class="stat-value">${stats.totalSessions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Total Study Time:</span>
          <span class="stat-value">${this.formatDuration(stats.totalTime)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Avg Session Length:</span>
          <span class="stat-value">${avgSessionLength}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Calculations:</span>
          <span class="stat-value">${stats.totalCalculations}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Practice Problems:</span>
          <span class="stat-value">${stats.totalPracticeProblems}</span>
        </div>
      </div>
    `;

    return card;
  },

  /**
   * Create category breakdown
   */
  createCategoryBreakdown() {
    const progress = AnalyticsManager.getProgress();

    const card = document.createElement('div');
    card.className = 'analytics-card breakdown-card';
    card.innerHTML = `
      <h3>Category Breakdown</h3>
      <div class="breakdown-list">
        ${this.renderCategoryBreakdown(progress.categories)}
      </div>
    `;

    return card;
  },

  /**
   * Render category breakdown list
   */
  renderCategoryBreakdown(categories) {
    const items = [];

    for (const [category, data] of Object.entries(categories)) {
      if (data.totalAttempts === 0) continue;

      items.push(`
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-category">${this.formatCategoryName(category)}</span>
            <span class="breakdown-accuracy">${((data.correctAttempts / data.totalAttempts * 100).toFixed(1)}%</span>
          </div>
          <div class="breakdown-stats">
            <span>${data.totalAttempts} attempts</span>
            <span>${this.formatDuration(data.totalTime)} time</span>
          </div>
        </div>
      `);
    }

    if (items.length === 0) {
      return '<p class="no-data">No category data yet</p>';
    }

    return items.join('');
  },

  /**
   * Create recommendations card
   */
  createRecommendationsCard() {
    const insights = AnalyticsManager.getInsights();

    const card = document.createElement('div');
    card.className = 'analytics-card recommendations-card';
    card.innerHTML = `
      <h3>Personalized Recommendations</h3>
      <div class="recommendations-list">
        ${insights.recommendations.map(rec => `
          <div class="recommendation-item priority-${rec.priority}">
            <div class="rec-header">
              <span class="rec-type">${rec.type}</span>
              <span class="rec-priority">${rec.priority}</span>
            </div>
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
          </div>
        `).join('') || '<p class="no-data">No recommendations yet</p>'}
      </div>
    `;

    return card;
  },

  /**
   * Create achievements card
   */
  createAchievementsCard() {
    const achievements = AnalyticsManager.getAchievements();

    const card = document.createElement('div');
    card.className = 'analytics-card achievements-card';
    card.innerHTML = `
      <h3>Achievements</h3>
      <div class="achievements-list">
        ${achievements.length > 0
          ? achievements.slice(-5).reverse().map(ach => `
            <div class="achievement-item">
              <div class="achievement-icon">🏆</div>
              <div class="achievement-info">
                <h4>${ach.title}</h4>
                <p>${ach.description}</p>
                <span class="achievement-date">${new Date(ach.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          `).join('')
          : '<p class="no-data">No achievements yet. Keep learning!</p>'
        }
      </div>
    `;

    return card;
  },

  /**
   * Format category name for display
   */
  formatCategoryName(category) {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Format duration in human-readable form
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('analytics-dashboard-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'analytics-dashboard-styles';
    style.textContent = `
      .analytics-dashboard {
        display: grid;
        gap: 20px;
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .analytics-card {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .analytics-card h3 {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: #333;
      }

      /* Summary Card */
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 15px;
      }

      .stat-item {
        text-align: center;
        padding: 10px;
      }

      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: bold;
        color: #4CAF50;
      }

      .stat-label {
        font-size: 12px;
        color: #666;
      }

      /* Progress Chart */
      .category-bar {
        margin-bottom: 15px;
      }

      .category-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }

      .category-name {
        font-weight: 500;
      }

      .category-accuracy {
        font-weight: bold;
      }

      .bar-container {
        height: 24px;
        background: #f0f0f0;
        border-radius: 12px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        transition: width 0.3s ease;
        border-radius: 12px;
      }

      .category-details {
        font-size: 12px;
        color: #666;
        margin-top: 3px;
      }

      /* Stats Card */
      .stats-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .stat-row:last-child {
        border-bottom: none;
      }

      /* Recommendations */
      .recommendation-item {
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 6px;
        border-left: 4px solid #ccc;
      }

      .recommendation-item.priority-high {
        background: #fff3f0;
        border-left-color: #f44336;
      }

      .recommendation-item.priority-medium {
        background: #fffbf0;
        border-left-color: #ffc107;
      }

      .recommendation-item.priority-low {
        background: #f0fff4;
        border-left-color: #4caf50;
      }

      .rec-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }

      .rec-type {
        font-size: 11px;
        text-transform: uppercase;
        color: #666;
      }

      .rec-priority {
        font-size: 11px;
        text-transform: uppercase;
        font-weight: bold;
      }

      .recommendation-item h4 {
        margin: 5px 0;
        font-size: 14px;
      }

      .recommendation-item p {
        margin: 5px 0;
        font-size: 13px;
        color: #666;
      }

      /* Achievements */
      .achievements-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .achievement-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: #fff9f0;
        border-radius: 6px;
      }

      .achievement-icon {
        font-size: 32px;
      }

      .achievement-info h4 {
        margin: 0 0 5px 0;
        font-size: 14px;
      }

      .achievement-info p {
        margin: 5px 0;
        font-size: 12px;
        color: #666;
      }

      .achievement-date {
        font-size: 11px;
        color: #999;
      }

      .no-data {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .analytics-card {
          background: #2c2c2c;
        }

        .analytics-card h3 {
          color: #fff;
        }

        .bar-container {
          background: #3c3c3c;
        }

        .stat-row {
          border-bottom-color: #3c3c3c;
        }

        .achievement-item {
          background: #3c3c2c;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .analytics-dashboard {
          padding: 10px;
        }

        .analytics-card {
          padding: 15px;
        }

        .summary-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Initialize dashboard in container
   */
  init(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const dashboard = this.create(options);
    container.appendChild(dashboard);

    return dashboard;
  },

  /**
   * Refresh dashboard data
   */
  refresh(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const options = {
      showDetails: container.querySelector('.breakdown-card') !== null,
      showRecommendations: container.querySelector('.recommendations-card') !== null,
      showAchievements: container.querySelector('.achievements-card') !== null
    };

    container.innerHTML = '';
    this.init(containerId, options);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsDashboard;
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.AnalyticsDashboard = AnalyticsDashboard;
}
