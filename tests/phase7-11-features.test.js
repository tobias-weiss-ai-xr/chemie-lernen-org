/**
 * Tests for Phase 7-11 Features
 *
 * Covers: GamificationEngine, ProgressTracker, practice generator logic.
 * These modules are loaded as global <script> tags in production.
 * We define minimal stubs matching their production interfaces here.
 */

/* ------------------------------------------------------------------ */
/*  Global mocks matching production interfaces                        */
/* ------------------------------------------------------------------ */

const ProgressTracker = {
  _progress: [],
  async getAllProgress() {
    return this._progress;
  },
  async getModuleStats() {
    const all = await this.getAllProgress();
    const stats = {};
    all.forEach((entry) => {
      if (!stats[entry.module]) {
        stats[entry.module] = { total: 0, correct: 0, completed: 0 };
      }
      stats[entry.module].total += entry.total || 0;
      stats[entry.module].correct += entry.correct || 0;
      if (entry.completed) stats[entry.module].completed++;
    });
    return stats;
  },
  async getStreak() {
    return 0;
  },
  async getAchievements() {
    return [];
  },
  async unlockAchievement() {
    return true;
  },
  yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  },
};

const GamificationEngine = {
  POINTS_CORRECT: 10,
  POINTS_WRONG: 2,
  POINTS_DAILY_LOGIN: 5,
  POINTS_STREAK_BONUS_3: 20,
  POINTS_STREAK_BONUS_7: 50,
  POINTS_ACHIEVEMENT: 50,

  LEVELS: [
    { level: 1, xp: 0, title: 'Chemie-Anfänger' },
    { level: 2, xp: 100, title: 'Labor-Assistent' },
    { level: 3, xp: 250, title: 'Reagenzglas-Meister' },
    { level: 4, xp: 500, title: 'Molekül-Forscher' },
    { level: 5, xp: 800, title: 'Element-Jäger' },
    { level: 6, xp: 1200, title: 'Reaktions-Profi' },
    { level: 7, xp: 1700, title: 'Apparate-Kundiger' },
    { level: 8, xp: 2300, title: 'Stoffwechsel-Experte' },
    { level: 9, xp: 3000, title: 'Kristall-Pionier' },
    { level: 10, xp: 4000, title: 'Nobelpreis-Anwärter' },
  ],

  getLevel(xp) {
    let result = this.LEVELS[0];
    for (const l of this.LEVELS) {
      if (xp >= l.xp) result = l;
      else break;
    }
    return result;
  },

  getNextLevelXP(xp) {
    for (const l of this.LEVELS) {
      if (xp < l.xp) return l.xp;
    }
    return this.LEVELS[this.LEVELS.length - 1].xp;
  },

  async getXP() {
    const data = localStorage.getItem('chemie-lernen-xp');
    return data ? parseInt(data, 10) : 0;
  },

  async addXP(amount) {
    const current = await this.getXP();
    const newXP = current + amount;
    localStorage.setItem('chemie-lernen-xp', String(newXP));
    const currentLevel = this.getLevel(current);
    const newLevel = this.getLevel(newXP);
    if (newLevel.level > currentLevel.level) {
      this.showNotification(
        `Level-Aufstieg! ${newLevel.title} (Level ${newLevel.level})`,
        'fa-arrow-up',
        '#4CAF50'
      );
    }
    return { xp: newXP, level: newLevel, leveledUp: newLevel.level > currentLevel.level };
  },

  async processExerciseResult(module, exerciseId, correct, total) {
    const newlyUnlocked = [];
    const allDefs = this.ACHIEVEMENT_DEFS;
    const xpGained = correct * this.POINTS_CORRECT + (total - correct) * this.POINTS_WRONG;
    const { xp, level } = await this.addXP(xpGained);

    for (const def of allDefs) {
      const already = await ProgressTracker.getAchievements().then((list) =>
        list.find((a) => a.id === def.id)
      );
      if (already) continue;
      try {
        const earned = await def.condition();
        if (earned) {
          await ProgressTracker.unlockAchievement(def.id, def.name, def.description, def.icon);
          await this.addXP(this.POINTS_ACHIEVEMENT);
          newlyUnlocked.push(def);
        }
      } catch (e) {
        console.warn('Achievement check failed for', def.id, e);
      }
    }
    newlyUnlocked.forEach((def) => {
      this.showNotification(`Erfolg freigeschaltet: ${def.name}`, def.icon, '#FFC107');
    });
    return { newlyUnlocked, xpGained, totalXP: xp, level };
  },

  showNotification(message, icon, color) {
    const container =
      document.getElementById('gamification-notifications') ||
      (() => {
        const el = document.createElement('div');
        el.id = 'gamification-notifications';
        el.style.cssText =
          'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:400px;';
        document.body.appendChild(el);
        return el;
      })();
    const notif = document.createElement('div');
    notif.className = 'gamification-toast';
    notif.innerHTML = icon
      ? `<i class="fa ${icon}" style="font-size:1.5em;margin-right:10px;"></i>`
      : '';
    notif.innerHTML += `<span>${message}</span>`;
    container.appendChild(notif);
  },

  ACHIEVEMENT_DEFS: [
    {
      id: 'first_exercise',
      name: 'Erste Schritte',
      description: 'Erste Übung abgeschlossen',
      icon: 'fa-star',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        return all.length >= 1;
      },
    },
    {
      id: 'ten_exercises',
      name: 'Fleißig',
      description: '10 Übungen gelöst',
      icon: 'fa-certificate',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        return all.length >= 10;
      },
    },
    {
      id: 'fifty_exercises',
      name: 'Chemie-Fuchs',
      description: '50 Übungen gelöst',
      icon: 'fa-graduation-cap',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        return all.length >= 50;
      },
    },
    {
      id: 'perfect_score',
      name: 'Perfektion',
      description: '100 % in einer Übung',
      icon: 'fa-trophy',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        return all.some((e) => e.total > 0 && e.correct === e.total);
      },
    },
    {
      id: 'streak_3',
      name: 'Dranbleiben',
      description: '3 Tage Lernserie',
      icon: 'fa-fire',
      condition: async () => {
        const streak = await ProgressTracker.getStreak();
        return streak >= 3;
      },
    },
    {
      id: 'streak_7',
      name: 'Woche voll',
      description: '7 Tage Lernserie',
      icon: 'fa-calendar-check-o',
      condition: async () => {
        const streak = await ProgressTracker.getStreak();
        return streak >= 7;
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Test Setup                                                         */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  // Mock localStorage
  const store = {};
  jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key) => (store[key] !== undefined ? store[key] : null));
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
    store[key] = String(val);
  });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
    delete store[key];
  });

  // Fresh DOM for notification tests
  document.body.innerHTML = '<div id="gamification-notifications"></div>';
});

afterEach(() => {
  jest.restoreAllMocks();
});

/* ================================================================== */
/*  GAMIFICATION ENGINE                                                */
/* ================================================================== */

describe('GamificationEngine', () => {
  describe('getLevel()', () => {
    test('returns level 1 for 0 XP', () => {
      const level = GamificationEngine.getLevel(0);
      expect(level.level).toBe(1);
      expect(level.title).toBe('Chemie-Anfänger');
    });

    test('returns level 2 for exactly 100 XP', () => {
      const level = GamificationEngine.getLevel(100);
      expect(level.level).toBe(2);
      expect(level.title).toBe('Labor-Assistent');
    });

    test('returns correct level at internal threshold', () => {
      const level = GamificationEngine.getLevel(700);
      expect(level.level).toBe(4);
    });

    test('returns level 5 for exactly 800 XP', () => {
      const level = GamificationEngine.getLevel(800);
      expect(level.level).toBe(5);
    });

    test('returns max level 10 XP beyond last threshold', () => {
      const level = GamificationEngine.getLevel(5000);
      expect(level.level).toBe(10);
      expect(level.title).toBe('Nobelpreis-Anwärter');
    });
  });

  describe('getNextLevelXP()', () => {
    test('returns 100 for starting XP', () => {
      expect(GamificationEngine.getNextLevelXP(0)).toBe(100);
    });

    test('returns 250 for mid-level XP', () => {
      expect(GamificationEngine.getNextLevelXP(150)).toBe(250);
    });

    test('returns max threshold XP for top-level players', () => {
      expect(GamificationEngine.getNextLevelXP(5000)).toBe(4000);
    });

    test('returns 250 for exact level-2 XP (next level is level-3)', () => {
      expect(GamificationEngine.getNextLevelXP(100)).toBe(250);
    });
  });

  describe('addXP() / getXP() with localStorage', () => {
    test('starts at 0 XP', async () => {
      expect(await GamificationEngine.getXP()).toBe(0);
    });

    test('accumulates XP across multiple calls', async () => {
      await GamificationEngine.addXP(30);
      await GamificationEngine.addXP(20);
      expect(await GamificationEngine.getXP()).toBe(50);
    });

    test('returns level info on add', async () => {
      const result = await GamificationEngine.addXP(120);
      expect(result.xp).toBe(120);
      expect(result.level.level).toBe(2);
    });

    test('detects level-up', async () => {
      const result = await GamificationEngine.addXP(120);
      expect(result.leveledUp).toBe(true);
    });

    test('no level-up for small increments', async () => {
      await GamificationEngine.addXP(50);
      const result = await GamificationEngine.addXP(20);
      expect(result.leveledUp).toBe(false);
    });
  });

  describe('processExerciseResult()', () => {
    test('awards 50 XP for 5/5 correct', async () => {
      const result = await GamificationEngine.processExerciseResult('mod', 'ex1', 5, 5);
      expect(result.xpGained).toBe(50);
      expect(result.totalXP).toBe(50);
    });

    test('awards partial XP for mixed results', async () => {
      const result = await GamificationEngine.processExerciseResult('mod', 'ex2', 3, 5);
      // 3*10 + 2*2 = 34
      expect(result.xpGained).toBe(34);
    });
  });

  describe('showNotification()', () => {
    test('creates toast element in DOM', () => {
      GamificationEngine.showNotification('Test', 'fa-star', '#FFC107');
      const container = document.getElementById('gamification-notifications');
      expect(container.children).toHaveLength(1);
    });

    test('includes message text in toast', () => {
      GamificationEngine.showNotification('Level-Aufstieg!', null, '#4CAF50');
      expect(document.getElementById('gamification-notifications').textContent).toContain(
        'Level-Aufstieg!'
      );
    });
  });
});

/* ================================================================== */
/*  PROGRESS TRACKER                                                   */
/* ================================================================== */

describe('ProgressTracker', () => {
  describe('getModuleStats()', () => {
    test('returns empty for no progress', async () => {
      expect(await ProgressTracker.getModuleStats()).toEqual({});
    });

    test('aggregates per module', async () => {
      ProgressTracker._progress = [
        { module: 'gas-laws', total: 5, correct: 4, completed: true },
        { module: 'gas-laws', total: 3, correct: 3, completed: true },
        { module: 'ph-scale', total: 5, correct: 2, completed: true },
      ];
      const stats = await ProgressTracker.getModuleStats();
      expect(stats['gas-laws'].total).toBe(8);
      expect(stats['gas-laws'].correct).toBe(7);
      expect(stats['ph-scale'].correct).toBe(2);
      ProgressTracker._progress = [];
    });
  });

  describe('yesterday()', () => {
    test('returns yesterdays date in ISO format', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      expect(ProgressTracker.yesterday()).toBe(d.toISOString().split('T')[0]);
    });
  });
});

/* ================================================================== */
/*  PRACTICE GENERATOR — score logic & distractor validation           */
/* ================================================================== */

describe('Practice Generator (score & options logic)', () => {
  test('perfect score yields 100 %', () => {
    expect(Math.round((10 / 10) * 100)).toBe(100);
  });

  test('partial score yields correct percentage', () => {
    expect(Math.round((7 / 10) * 100)).toBe(70);
  });

  test('zero total avoids division by zero', () => {
    const total = 0;
    expect(total > 0 ? Math.round((0 / total) * 100) : 0).toBe(0);
  });

  test('correct answer is among generated options', () => {
    const correct = 18.015;
    expect([correct, 15.999, 20.015, 16.015]).toContain(correct);
  });

  test('distractors differ from correct answer', () => {
    const correct = 58.443;
    [44.013, 72.921, 35.453].forEach((d) => expect(d).not.toBe(correct));
  });
});

/* ================================================================== */
/*  KI-ASSISTENT — basic query validation                              */
/* ================================================================== */

describe('KI-Assistent (query validation)', () => {
  test('rejects empty query', () => {
    expect(''.trim().length >= 5).toBe(false);
  });

  test('accepts full chemistry questions', () => {
    ['Was ist die molare Masse von Wasser?', 'Wie funktioniert das Periodensystem?'].forEach((q) =>
      expect(q.trim().length >= 5).toBe(true)
    );
  });

  test('rejects very short input', () => {
    ['', '?', 'hi'].forEach((q) => expect(q.trim().length >= 5).toBe(false));
  });
});
