/**
 * @vitest-environment jsdom
 *
 * UXF-047 — lernpfade.js Auth-Gate:
 * Anonyme Besucher rufen /api/gamification/profile nicht mehr (401-Noise),
 * stattdessen erscheint der Login-Prompt. Eingeloggte Nutzer bekommen den
 * vollen Flow. Ohne AuthClient: Legacy-Verhalten.
 */

describe('UXF-047: lernpfade Auth-Gate', () => {
  let calls;

  const setupDom = () => {
    document.body.innerHTML = `
      <div id="path-tree"></div>
      <div id="state-selector"></div>
      <div class="xp-section" id="xp-bar-fill"></div>
      <div class="streak-section"><span id="streak-count"></span></div>
      <div class="badge-section"><div id="badge-grid"></div></div>
      <div class="xp-log-section"><div id="xp-log"></div></div>
      <div id="recommendation-card"></div>
      <div id="level-number"></div><div id="level-title"></div>
      <div id="xp-current"></div><div id="xp-next"></div>
      <div id="btn-checkin"></div>`;
  };

  const loadModule = (getUserImpl, profileResponse) => {
    jest.resetModules();
    calls = [];
    const realFetch = global.fetch;
    global.fetch = jest.fn((url) => {
      const u = String(url);
      calls.push(u);
      if (u.includes('gamification/profile')) {
        if (profileResponse === 'unauthorized') {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'unauthorized' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(profileResponse || { badges: [], xpLog: [], xp: 0 }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ paths: [] }) });
    });

    if (getUserImpl) {
      window.AuthClient = { getUser: jest.fn(getUserImpl) };
    } else {
      delete window.AuthClient;
    }

    require('../myhugoapp/static/js/lernpfade.js');
    window.lernpfadeInit();
    return () => {
      global.fetch = realFetch;
      delete window.AuthClient;
    };
  };

  const profileCallCount = () => calls.filter((u) => u.includes('gamification/profile')).length;

  it('anonym: kein profile-Call, Login-Prompt sichtbar', async () => {
    setupDom();
    const cleanup = loadModule(() => Promise.resolve(null));
    await new Promise((r) => setTimeout(r, 30));

    expect(profileCallCount()).toBe(0);
    const rec = document.getElementById('recommendation-card');
    expect(rec.innerHTML).toContain('recommendation-login-prompt');
    expect(rec.innerHTML).toContain('/login/');
    cleanup();
  });

  it('eingeloggt: profile-Call läuft, Gamification gerendert', async () => {
    setupDom();
    const cleanup = loadModule(() => Promise.resolve({ email: 'a@b.de' }), {
      xp: 120,
      streak: 3,
      badges: [],
      xpLog: [],
    });
    await new Promise((r) => setTimeout(r, 30));

    expect(profileCallCount()).toBe(1);
    expect(document.getElementById('streak-count').textContent).toBe('3');
    cleanup();
  });

  it('ohne AuthClient: Legacy-Verhalten (profile-Call wie bisher)', async () => {
    setupDom();
    const cleanup = loadModule(null, { xp: 0, badges: [], xpLog: [] });
    await new Promise((r) => setTimeout(r, 30));

    expect(profileCallCount()).toBe(1);
    cleanup();
  });
});
