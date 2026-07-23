/**
 * Gamification Engine for chemie-lernen.org
 * Points, levels, achievements, and unlock notifications
 *
 * Depends on: ProgressTracker (static/js/utils/progress-tracker.js)
 */
const _GamificationEngine = {
  /** Points constants */
  POINTS_CORRECT: 10,
  POINTS_WRONG: 2,
  POINTS_DAILY_LOGIN: 5,
  POINTS_STREAK_BONUS_3: 20,
  POINTS_STREAK_BONUS_7: 50,
  POINTS_ACHIEVEMENT: 50,

  /** Level thresholds */
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

  /**
   * All defined achievements with unlock condition functions
   */
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
    {
      id: 'all_modules',
      name: 'Entdecker',
      description: 'Alle Module ausprobiert',
      icon: 'fa-cubes',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        const mods = new Set(all.map((e) => e.module));
        return mods.size >= 3;
      },
    },
    {
      id: 'high_accuracy',
      name: 'Genauigkeit',
      description: '90 %+ Genauigkeit bei 20+ Übungen',
      icon: 'fa-bullseye',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        if (all.length < 20) return false;
        const stats = await ProgressTracker.getModuleStats();
        let total = 0,
          correct = 0;
        Object.values(stats).forEach((s) => {
          total += s.total || 0;
          correct += s.correct || 0;
        });
        return total > 0 && correct / total >= 0.9;
      },
    },
    {
      id: 'night_owl',
      name: 'Nachtarbeiter',
      description: 'Nach 22 Uhr gelernt',
      icon: 'fa-moon-o',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        return all.some((e) => {
          const hour = new Date(e.lastAttempt).getHours();
          return hour >= 22 || hour < 5;
        });
      },
    },
    {
      id: 'collector',
      name: 'Sammler',
      description: '5 Erfolge freigeschaltet',
      icon: 'fa-diamond',
      condition: async () => {
        const earned = await ProgressTracker.getAchievements();
        return earned.length >= 5;
      },
    },
    {
      id: 'speed_demon',
      name: 'Tempomacher',
      description: 'Erste Übung eines Tages innerhalb von 5 Minuten erledigt',
      icon: 'fa-rocket',
      condition: async () => {
        const all = await ProgressTracker.getAllProgress();
        const today = new Date().toISOString().split('T')[0];
        const firstToday = all
          .filter((e) => e.lastAttempt && e.lastAttempt.startsWith(today))
          .sort((a, b) => a.lastAttempt.localeCompare(b.lastAttempt));
        return firstToday.some((e) => {
          const time = new Date(e.lastAttempt);
          return time.getHours() === 0 && time.getMinutes() <= 5;
        });
      },
    },
    {
      id: 'grandmaster',
      name: 'Alleskönner',
      description: 'Alle Erfolge freigeschaltet',
      icon: 'fa-star-o',
      condition: async () => {
        const earned = await ProgressTracker.getAchievements();
        return earned.length >= 11; /* all except this one */
      },
    },
  ],

  /**
   * Get total XP from stored stats
   */
  async getXP() {
    const data = localStorage.getItem('chemie-lernen-xp');
    return data ? parseInt(data, 10) : 0;
  },

  /**
   * Add XP and check for level-up
   */
  async addXP(amount) {
    const current = await this.getXP();
    const newXP = current + amount;
    localStorage.setItem('chemie-lernen-xp', String(newXP));
    const currentLevel = this.getLevel(current);
    const newLevel = this.getLevel(newXP);
    if (newLevel > currentLevel) {
      this.showNotification(
        `Level-Aufstieg! ${newLevel.title} (Level ${newLevel.level})`,
        'fa-arrow-up',
        '#4CAF50'
      );
    }
    return { xp: newXP, level: newLevel };
  },

  /**
   * Get current level info
   */
  getLevel(xp) {
    let result = this.LEVELS[0];
    for (const l of this.LEVELS) {
      if (xp >= l.xp) result = l;
      else break;
    }
    return result;
  },

  /**
   * Get XP needed for next level
   */
  getNextLevelXP(xp) {
    for (const l of this.LEVELS) {
      if (xp < l.xp) return l.xp;
    }
    return this.LEVELS[this.LEVELS.length - 1].xp;
  },

  /**
   * Process post-exercise actions:
   * 1. Check and unlock any new achievements
   * 2. Add XP for the exercise result
   * 3. Return summary of what happened
   */
  async processExerciseResult(module, exerciseId, correct, total) {
    const newlyUnlocked = [];
    const allDefs = this.ACHIEVEMENT_DEFS;

    // Add XP
    const xpGained = correct * this.POINTS_CORRECT + (total - correct) * this.POINTS_WRONG;
    const { xp, level } = await this.addXP(xpGained);

    // Check each achievement
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

    // Show notifications for new achievements
    newlyUnlocked.forEach((def) => {
      this.showNotification(`Erfolg freigeschaltet: ${def.name}`, def.icon, '#FFC107');
    });

    return {
      newlyUnlocked,
      xpGained,
      totalXP: xp,
      level,
    };
  },

  /**
   * Show a floating notification on the page
   */
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
    notif.style.cssText =
      `background:${color || '#333'};color:white;padding:15px 20px;border-radius:12px;` +
      'box-shadow:0 4px 20px rgba(0,0,0,0.3);display:flex;align-items:center;' +
      'animation:slideInNotification 0.3s ease-out;font-size:1rem;cursor:pointer;';

    const style = document.createElement('style');
    if (!document.getElementById('gamification-toast-style')) {
      style.id = 'gamification-toast-style';
      style.textContent = `
        @keyframes slideInNotification {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .gamification-toast:hover { filter: brightness(1.1); }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(notif);
    notif.addEventListener('click', () => notif.remove());
    setTimeout(() => {
      if (notif.parentNode) {
        notif.style.transition = 'opacity 0.3s';
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
      }
    }, 5000);
  },
};
