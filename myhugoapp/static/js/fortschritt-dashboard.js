/* fortschritt-dashboard.js — Progress dashboard UI */

async function loadDashboard() {
  try {
    await Promise.all([
      loadStreakAndStats(),
      loadModuleProgress(),
      loadAchievements(),
      loadRecentActivity()
    ]);
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
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
    container.innerHTML = '<p class="text-muted">Noch keine Daten vorhanden. Beginne mit Übungen, um deinen Fortschritt zu sehen.</p>';
    return;
  }

  const moduleNames = {
    uebungsgenerator: 'Übungsgenerator',
    lueckentexte: 'Lückentexte',
    practice: 'Übungen'
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
  const achievements = await ProgressTracker.getAchievements();
  const container = document.getElementById('achievements-grid');

  const allAchievements = [
    { id: 'first_exercise', name: 'Erste Schritte', description: 'Erste Übung abgeschlossen', icon: 'fa-star' },
    { id: 'ten_exercises', name: 'Fleißig', description: '10 Übungen gelöst', icon: 'fa-certificate' },
    { id: 'perfect_score', name: 'Perfektion', description: '100% in einer Übung', icon: 'fa-trophy' },
    { id: 'streak_3', name: 'Dranbleiben', description: '3 Tage Lernserie', icon: 'fa-fire' },
    { id: 'streak_7', name: 'Woche voll', description: '7 Tage Lernserie', icon: 'fa-calendar-check-o' },
    { id: 'all_modules', name: 'Entdecker', description: 'Alle Module ausprobiert', icon: 'fa-cubes' }
  ];

  const earnedIds = new Set(achievements.map((a) => a.id));

  container.innerHTML = allAchievements.map((ach) => {
    const earned = earnedIds.has(ach.id);
    return `
      <div class="achievement-card ${earned ? 'earned' : 'locked'}">
        <div class="achievement-icon"><i class="fa ${ach.icon}"></i></div>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.description}</div>
        ${earned ? '<div class="achievement-badge"><i class="fa fa-check-circle"></i></div>' : '<div class="achievement-badge locked"><i class="fa fa-lock"></i></div>'}
      </div>
    `;
  }).join('');
}

async function loadRecentActivity() {
  const all = await ProgressTracker.getAllProgress();
  const container = document.getElementById('recent-activity');

  if (all.length === 0) {
    container.innerHTML = '<p class="text-muted">Noch keine Aktivitäten.</p>';
    return;
  }

  const sorted = all.sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt)).slice(0, 10);

  container.innerHTML = '<ul class="list-group">' +
    sorted.map((entry) => {
      const date = new Date(entry.lastAttempt).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const mName = entry.module === 'uebungsgenerator' ? 'Übungsgenerator' : entry.module;
      const result = entry.completed ? '<span class="label label-success">Erledigt</span>' : '<span class="label label-warning">In Bearbeitung</span>';
      return `<li class="list-group-item">
        <span class="badge">${date}</span>
        <strong>${mName}:</strong> ${entry.exerciseId || 'Übung'}
        ${result}
        <span class="text-muted" style="margin-left: 10px;">${entry.correct || 0}/${entry.total || 0}</span>
      </li>`;
    }).join('') + '</ul>';
}

async function resetProgressData() {
  if (!confirm('Wirklich alle Fortschrittsdaten löschen?')) return;
  await ProgressTracker.resetProgress();
  loadDashboard();
}

document.addEventListener('DOMContentLoaded', loadDashboard);
