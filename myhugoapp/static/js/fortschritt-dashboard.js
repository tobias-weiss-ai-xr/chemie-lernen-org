/* fortschritt-dashboard.js — Progress dashboard UI with gamification */

function perAreaCompletionTracking() {
  return {
    areas: ['saeuren-basen', 'analytik', 'energetik', 'reaktionstypen', 'anorganik', 'organische-stoffklassen'],
    goals: { 'saeuren-basen': 3, 'analytik': 5, 'energetik': 4, 'reaktionstypen': 3, 'anorganik': 3, 'organische-stoffklassen': 3 },
    progress: {}
  };
}

async function loadDashboard() {
  try {
    await Promise.all([
      loadXPAndLevel(),
      loadStreakAndStats(),
      loadModuleProgress(),
      loadPerAreaProgress(),
      loadAchievements(),
      loadRecentActivity()
    ]);
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
}

async function loadXPAndLevel() {
  const xp = await GamificationEngine.getXP();
  const level = GamificationEngine.getLevel(xp);
  const nextXP = GamificationEngine.getNextLevelXP(xp);
  const xpInLevel = xp - (level.xp || 0);
  const xpNeeded = nextXP - (level.xp || 0);
  const pct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  document.getElementById('xp-display').textContent = xp;
  document.getElementById('level-display').textContent =
    'Level ' + level.level + ' \u2014 ' + level.title;
  const bar = document.getElementById('xp-bar');
  if (bar) bar.style.width = pct + '%';
}

async function loadStreakAndStats() {
  const streak = await ProgressTracker.getStreak();
  document.getElementById('streak-count').textContent = streak;

  const stats = await ProgressTracker.getModuleStats();
  let totalExercises = 0;
  let totalCorrect = 0;
  Object.values(stats).forEach((s) => {
    totalExercises += s.total || 0;
    totalCorrect += s.correct || 0;
  });

  document.getElementById('total-exercises').textContent = totalExercises;
  const accuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  document.getElementById('accuracy-pct').textContent = accuracy + '%';
}

async function loadModuleProgress() {
  const stats = await ProgressTracker.getModuleStats();
  const container = document.getElementById('module-progress-list');

  if (Object.keys(stats).length === 0) {
    container.innerHTML = '<p class="text-muted">Noch keine Daten vorhanden. Beginne mit \u00dcbungen, um deinen Fortschritt zu sehen.</p>';
    return;
  }

  const moduleNames = {
    uebungsgenerator: '\u00dcbungsgenerator',
    lueckentexte: 'L\u00fcckentexte',
    practice: '\u00dcbungen',
    lernpfad: 'Lernpfade'
  };

  container.innerHTML = Object.entries(stats).map(([mod, data]) => {
    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const name = moduleNames[mod] || mod;
    return `
      <div class="module-progress-item">
        <div class="progress-header">
          <strong>${name}</strong>
          <span>${data.correct}/${data.total} richtig</span>
        </div>
        <div class="progress">
          <div class="progress-bar progress-bar-success" role="progressbar"
               style="width: ${pct}%">
            ${pct}%
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadAchievements() {
  const earned = await ProgressTracker.getAchievements();
  const allData = await ProgressTracker.getAllProgress();
  const stats = await ProgressTracker.getModuleStats();
  const streak = await ProgressTracker.getStreak();
  const earnedIds = new Set(earned.map((a) => a.id));

  const allAchievements = [
    {
      id: 'first_exercise', name: 'Erste Schritte', icon: 'fa-star',
      desc: 'Erste \u00dcbung abgeschlossen',
      progress: () => Math.min(100, allData.length * 100),
      max: 100, current: () => allData.length >= 1 ? 1 : 0, of: 1
    },
    {
      id: 'ten_exercises', name: 'Flei\u00dfig', icon: 'fa-certificate',
      desc: '10 \u00dcbungen gel\u00f6st',
      progress: () => Math.min(100, (allData.length / 10) * 100),
      max: 100, current: () => Math.min(10, allData.length), of: 10
    },
    {
      id: 'fifty_exercises', name: 'Chemie-Fuchs', icon: 'fa-graduation-cap',
      desc: '50 \u00dcbungen gel\u00f6st',
      progress: () => Math.min(100, (allData.length / 50) * 100),
      max: 100, current: () => Math.min(50, allData.length), of: 50
    },
    {
      id: 'perfect_score', name: 'Perfektion', icon: 'fa-trophy',
      desc: '100 % in einer \u00dcbung',
      progress: () => {
        const p = allData.some(e => e.total > 0 && e.correct === e.total) ? 100 : 30;
        return p;
      },
      max: 100, current: () => allData.some(e => e.total > 0 && e.correct === e.total) ? 1 : 0, of: 1
    },
    {
      id: 'streak_3', name: 'Dranbleiben', icon: 'fa-fire',
      desc: '3 Tage Lernserie',
      progress: () => Math.min(100, (streak / 3) * 100),
      max: 100, current: () => Math.min(3, streak), of: 3
    },
    {
      id: 'streak_7', name: 'Woche voll', icon: 'fa-calendar-check-o',
      desc: '7 Tage Lernserie',
      progress: () => Math.min(100, (streak / 7) * 100),
      max: 100, current: () => Math.min(7, streak), of: 7
    },
    {
      id: 'all_modules', name: 'Entdecker', icon: 'fa-cubes',
      desc: 'Alle Module ausprobiert',
      progress: () => {
        const mods = new Set(allData.map(e => e.module));
        return Math.min(100, (mods.size / 3) * 100);
      },
      max: 100, current: () => {
        const mods = new Set(allData.map(e => e.module));
        return Math.min(3, mods.size);
      }, of: 3
    },
    {
      id: 'high_accuracy', name: 'Genauigkeit', icon: 'fa-bullseye',
      desc: '90 %+ bei 20+ \u00dcbungen',
      progress: () => {
        if (allData.length < 20) return (allData.length / 20) * 50;
        let total = 0, correct = 0;
        Object.values(stats).forEach(s => { total += s.total || 0; correct += s.correct || 0; });
        if (total === 0) return 0;
        const acc = correct / total;
        return acc >= 0.9 ? 100 : 50 + (acc / 0.9) * 50;
      },
      max: 100, current: () => Math.min(20, allData.length), of: 20
    },
    {
      id: 'night_owl', name: 'Nachtarbeiter', icon: 'fa-moon-o',
      desc: 'Nach 22 Uhr gelernt',
      progress: () => {
        return allData.some(e => { const h = new Date(e.lastAttempt).getHours(); return h >= 22 || h < 5; }) ? 100 : 30;
      },
      max: 100, current: () => allData.some(e => { const h = new Date(e.lastAttempt).getHours(); return h >= 22 || h < 5; }) ? 1 : 0, of: 1
    },
    {
      id: 'collector', name: 'Sammler', icon: 'fa-diamond',
      desc: '5 Erfolge freigeschaltet',
      progress: () => Math.min(100, (earned.length / 5) * 100),
      max: 100, current: () => Math.min(5, earned.length), of: 5
    },
    {
      id: 'speed_demon', name: 'Tempomacher', icon: 'fa-rocket',
      desc: 'Erste \u00dcbung in 5 Min.',
      progress: () => {
        if (allData.length === 0) return 0;
        const today = new Date().toISOString().split('T')[0];
        const firstToday = allData
          .filter(e => e.lastAttempt && e.lastAttempt.startsWith(today))
          .sort((a, b) => a.lastAttempt.localeCompare(b.lastAttempt));
        if (firstToday.length === 0) return 40;
        return firstToday.some(e => { const t = new Date(e.lastAttempt); return t.getHours() === 0 && t.getMinutes() <= 5; }) ? 100 : 60;
      },
      max: 100, current: () => 0, of: 1,
      hideProgress: true
    },
    {
      id: 'grandmaster', name: 'Allesk\u00f6nner', icon: 'fa-star-o',
      desc: 'Alle Erfolge freigeschaltet',
      progress: () => Math.min(100, (earned.length / 11) * 100),
      max: 100, current: () => Math.min(11, earned.length), of: 11
    }
  ];

  const container = document.getElementById('achievements-grid');

  container.innerHTML = allAchievements.map((ach) => {
    const earned = earnedIds.has(ach.id);
    const pct = ach.progress();
    const cur = ach.current();
    return `
      <div class="achievement-card ${earned ? 'earned' : 'locked'}">
        <div class="achievement-icon"><i class="fa ${ach.icon}"></i></div>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
        ${!earned && !ach.hideProgress ? `
          <div class="achievement-progress-container">
            <div class="achievement-progress-bar" style="width: ${pct}%"></div>
          </div>
          <div class="achievement-progress-text">${cur}/${ach.of}</div>
        ` : ''}
        ${earned ? '<div class="achievement-badge"><i class="fa fa-check-circle"></i></div>' : '<div class="achievement-badge locked"><i class="fa fa-lock"></i></div>'}
      </div>
    `;
  }).join('');
}

async function loadPerAreaProgress() {
  const tracking = perAreaCompletionTracking();
  const container = document.getElementById('per-area-progress');

  if (!container) return;

  const fsrsStats = fsrs.getCardStats();
  const areaProgressData = tracking.areas.map(area => {
    const goal = tracking.goals[area] || 3;
    const areaCards = Object.values(fsrs.cards).filter(card => card.id.includes(area));
    const learnedCards = areaCards.filter(card => card.interval > 0).length;
    const pct = areaCards.length > 0 ? Math.round((learnedCards / goal) * 100) : 0;

    return {
      name: area,
      goal: goal,
      completed: Math.min(learnedCards, goal),
      pct: Math.min(pct, 100),
      cardsTotal: areaCards.length,
      mastered: learnedCards
    };
  });

  const overallPct = areaProgressData.reduce((sum, area) => sum + area.pct, 0) / tracking.areas.length;

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h4 class="mb-0">Themenbereiche Fortschritt</h4>
      </div>
      <div class="card-body">
        <div class="overall-progress mb-3">
          <div class="progress">
            <div class="progress-bar progress-bar-primary" role="progressbar"
                 style="width: ${overallPct.toFixed(1)}%">${overallPct.toFixed(1)}% overall</div>
          </div>
        </div>
        ${areaProgressData.map(area => `
          <div class="area-progress-item mb-3" data-area="${area.name}">
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge badge-${area.pct > 75 ? 'success' : area.pct > 50 ? 'warning' : 'secondary'} badge-pill">
                ${area.pct}%
              </span>
              <span class="area-name">${area.name}</span>
              <span class="area-count">${area.completed}/${area.goal}</span>
            </div>
            <div class="progress mt-1">
              <div class="progress-bar progress-bar-${area.pct > 75 ? 'success' : area.pct > 50 ? 'warning' : 'secondary'}" 
                   role="progressbar" style="width: ${area.pct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function loadRecentActivity() {
  const all = await ProgressTracker.getAllProgress();
  const container = document.getElementById('recent-activity');

  if (all.length === 0) {
    container.innerHTML = '<p class="text-muted">Noch keine Aktivit\u00e4ten.</p>';
    return;
  }

  const sorted = all.sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt)).slice(0, 10);

  container.innerHTML = '<ul class="list-group">' +
    sorted.map((entry) => {
      const date = new Date(entry.lastAttempt).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const mName = entry.module === 'uebungsgenerator' ? '\u00dcbungsgenerator' : entry.module;
      const result = entry.completed ? '<span class="label label-success">Erledigt</span>' : '<span class="label label-warning">In Bearbeitung</span>';
      return `<li class="list-group-item">
        <span class="badge">${date}</span>
        <strong>${mName}:</strong> ${entry.exerciseId || '\u00dcbung'}
        ${result}
        <span class="text-muted" style="margin-left: 10px;">${entry.correct || 0}/${entry.total || 0}</span>
      </li>`;
    }).join('') + '</ul>';
}

async function resetProgressData() {
  if (!confirm('Wirklich alle Fortschrittsdaten l\u00f6schen?')) return;
  await ProgressTracker.resetProgress();
  localStorage.removeItem('chemie-lernen-xp');
  loadDashboard();
}

document.addEventListener('DOMContentLoaded', loadDashboard);
