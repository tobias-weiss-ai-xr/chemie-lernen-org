/**
 * Unit tests for assessment-dashboard.js — Client-side dashboard logic.
 *
 * Tests data processing functions (calculateOverallScore, groupByTopic,
 * getWeakTopics, getStrongTopics) in isolation.
 *
 * Uses jsdom environment via Jest configuration.
 */

/**
 * @vitest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Read the dashboard JS file and evaluate it in the global scope
const dashboardJs = fs.readFileSync(
  path.resolve(__dirname, '../myhugoapp/static/js/assessment-dashboard.js'),
  'utf-8'
);

// Set up DOM before evaluating
beforeAll(() => {
  document.body.innerHTML = `
    <div id="assessment-loading" style="display:block">Loading...</div>
    <div id="assessment-content" style="display:none">
      <span id="overall-score"></span>
      <span id="strong-topics-count"></span>
      <span id="weak-topics-count"></span>
      <table id="recent-assessments">
        <tbody id="recent-assessments-body"></tbody>
      </table>
      <div id="weak-topics-list"></div>
      <div id="recommendations-list"></div>
      <canvas id="score-trend-chart"></canvas>
    </div>
    <div id="assessment-error" style="display:none">Error</div>
  `;

  // Evaluate the dashboard JS (IIFE runs immediately)
  // We eval in a try-catch since Chart.js is not available in jsdom
  /* eslint-disable sonarjs/code-eval */
  try {
    eval(dashboardJs);
  } catch {
    // Chart.js reference will throw — that's fine for unit tests
  }
  /* eslint-enable sonarjs/code-eval */
});

describe('window.loadAssessmentData', () => {
  test('is defined', () => {
    expect(typeof window.loadAssessmentData).toBe('function');
  });
});

/* ------------------------------------------------------------------ */
/*  calculateOverallScore                                              */
/* ------------------------------------------------------------------ */

describe('calculateOverallScore', () => {
  test('returns dash for empty results', () => {
    // Access via eval since it's inside IIFE closure
    const score = evaluateInScope('calculateOverallScore');
    expect(score([])).toBe('—');
  });

  test('averages scores from results', () => {
    const score = evaluateInScope('calculateOverallScore');
    const results = [{ score: 80 }, { score: 90 }, { score: 70 }];
    expect(score(results)).toBe(80);
  });

  test('returns dash when no numeric scores', () => {
    const score = evaluateInScope('calculateOverallScore');
    const results = [{ topic: 'test' }, { topic: 'test2' }];
    expect(score(results)).toBe('—');
  });
});

/* ------------------------------------------------------------------ */
/*  groupByTopic                                                       */
/* ------------------------------------------------------------------ */

describe('groupByTopic', () => {
  test('groups results by topic and computes averages', () => {
    const group = evaluateInScope('groupByTopic');
    const results = [
      { topic: 'Oxidation', score: 80 },
      { topic: 'Oxidation', score: 60 },
      { topic: 'Säuren', score: 90 },
    ];
    const grouped = group(results);
    expect(grouped).toHaveLength(2);
    const ox = grouped.find((g) => g.topic === 'Oxidation');
    const sa = grouped.find((g) => g.topic === 'Säuren');
    expect(ox.averageScore).toBe(70); // (80 + 60) / 2
    expect(sa.averageScore).toBe(90);
  });

  test('sorts by ascending average score', () => {
    const group = evaluateInScope('groupByTopic');
    const results = [
      { topic: 'A', score: 90 },
      { topic: 'B', score: 50 },
      { topic: 'C', score: 70 },
    ];
    const grouped = group(results);
    expect(grouped[0].topic).toBe('B'); // lowest first
    expect(grouped[1].topic).toBe('C');
    expect(grouped[2].topic).toBe('A');
  });

  test('filters out results without topic', () => {
    const group = evaluateInScope('groupByTopic');
    const results = [
      { topic: 'Oxidation', score: 80 },
      { topic: null, score: 90 },
      { topic: undefined, score: 100 },
    ];
    const grouped = group(results);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].topic).toBe('Oxidation');
  });
});

/* ------------------------------------------------------------------ */
/*  getWeakTopics / getStrongTopics                                    */
/* ------------------------------------------------------------------ */

describe('getWeakTopics', () => {
  test('returns bottom 3 topics with average < 60', () => {
    const weak = evaluateInScope('getWeakTopics');
    const topics = [
      { topic: 'A', averageScore: 30 },
      { topic: 'B', averageScore: 45 },
      { topic: 'C', averageScore: 70 },
      { topic: 'D', averageScore: 55 },
    ];
    const result = weak(topics);
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.topic)).toEqual(['A', 'B', 'D']);
  });

  test('returns empty array when no weak topics', () => {
    const weak = evaluateInScope('getWeakTopics');
    const topics = [
      { topic: 'A', averageScore: 80 },
      { topic: 'B', averageScore: 90 },
    ];
    expect(weak(topics)).toEqual([]);
  });
});

describe('getStrongTopics', () => {
  test('returns topics with average >= 80', () => {
    const strong = evaluateInScope('getStrongTopics');
    const topics = [
      { topic: 'A', averageScore: 90 },
      { topic: 'B', averageScore: 70 },
      { topic: 'C', averageScore: 85 },
    ];
    const result = strong(topics);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.topic)).toEqual(['A', 'C']);
  });
});

/* ------------------------------------------------------------------ */
/*  Helper to access IIFE-scoped functions                             */
/* ------------------------------------------------------------------ */

function evaluateInScope(fnName) {
  // The dashboard exposes its pure helpers on the global window object
  // (see assessment-dashboard.js export block). Return the reference directly.
  return window[fnName];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  BETTER APPROACH: test via DOM behavior (integration-style)        */
/* ─────────────────────────────────────────────────────────────────── */

describe('renderDashboard (integration via DOM)', () => {
  // Store the original fetch
  let origFetch;

  beforeAll(() => {
    // Set up Chart.js mock globally
    global.Chart = function (ctx, config) {
      this.destroy = vi.fn();
      this.data = config.data;
      this.options = config.options;
    };
  });

  beforeEach(() => {
    origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 3,
        results: [
          {
            assessmentId: 'a1',
            topic: 'Oxidation',
            difficulty: 'mittel',
            score: 80,
            date: '2026-08-06',
          },
          {
            assessmentId: 'a2',
            topic: 'Säuren',
            difficulty: 'leicht',
            score: 45,
            date: '2026-08-05',
          },
          {
            assessmentId: 'a3',
            topic: 'Oxidation',
            difficulty: 'schwer',
            score: 90,
            date: '2026-08-04',
          },
        ],
      }),
    });
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  test('loadAssessmentData fetches and renders', async () => {
    await window.loadAssessmentData();

    // Overall score should be (80 + 45 + 90) / 3 ≈ 72
    const overallEl = document.getElementById('overall-score');
    expect(overallEl.textContent).toBe('72');

    // Weak topics: Säuren at 45% < 60
    const weakList = document.getElementById('weak-topics-list');
    expect(weakList.innerHTML).toContain('Säuren');

    // Strong topics: per-topic averages — Oxidation (80+90)/2=85 ≥ 80 is the
    // only strong topic (Säuren averages 45). Count = 1.
    const strongCount = document.getElementById('strong-topics-count');
    expect(strongCount.textContent).toBe('1');
  });

  test('handles fetch error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await window.loadAssessmentData();

    const errorEl = document.getElementById('assessment-error');
    expect(errorEl.style.display).not.toBe('none');
  });

  test('passes learnerId through to the API for teacher drill-down', async () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '/assessment?learnerId=learner-42');

    try {
      await window.loadAssessmentData();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/assessment/results?learnerId=learner-42',
        expect.anything()
      );
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  test('omits learnerId query when not provided (learner self-view)', async () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '/assessment');

    try {
      await window.loadAssessmentData();
      expect(global.fetch).toHaveBeenCalledWith('/api/assessment/results', expect.anything());
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });
});
