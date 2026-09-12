/**
 * @vitest-environment jsdom
 *
 * UXF-045 — home-recommendation.js Auth-Gate:
 * Anonyme Besucher dürfen /api/gamification/profile nicht mehr aufrufen
 * (401-Console-Noise + nutzloser API-Call). Eingeloggte Nutzer bekommen den
 * vollen Empfehlungs-Flow. Ohne AuthClient gilt Legacy-Verhalten.
 */

describe('UXF-045: home-recommendation Auth-Gate', () => {
  let calls;

  const loadModule = (getUserImpl) => {
    jest.resetModules();
    calls = [];
    const realFetch = global.fetch;
    global.fetch = jest.fn((url) => {
      calls.push(String(url));
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ paths: [] }),
      });
    });

    document.body.innerHTML =
      '<div id="next-recommendation"><div id="recommendation-content"></div></div>';

    if (getUserImpl) {
      window.AuthClient = { getUser: jest.fn(getUserImpl) };
    } else {
      delete window.AuthClient;
    }

    // Datei registriert DOMContentLoaded — jsdom ist hier schon 'complete'
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    require('../myhugoapp/static/js/home-recommendation.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });
    return () => {
      global.fetch = realFetch;
      delete window.AuthClient;
    };
  };

  it('anonym: kein /api/gamification/profile-Call, Widget mit Fallback-Pfaden', async () => {
    const cleanup = loadModule(() => Promise.resolve(null));
    await new Promise((r) => setTimeout(r, 20));

    expect(window.AuthClient.getUser).toHaveBeenCalled();
    expect(calls.filter((u) => u.includes('gamification/profile'))).toHaveLength(0);
    expect(calls.filter((u) => u.includes('learning-paths'))).toHaveLength(0);
    const content = document.getElementById('recommendation-content').textContent;
    expect(content).toContain('Lernpfade');
    cleanup();
  });

  it('eingeloggt: Empfehlungs-Flow läuft (profile + learning-paths)', async () => {
    const cleanup = loadModule(() => Promise.resolve({ email: 'test@example.org' }));
    await new Promise((r) => setTimeout(r, 20));

    expect(calls.some((u) => u.includes('gamification/profile'))).toBe(true);
    expect(calls.some((u) => u.includes('learning-paths'))).toBe(true);
    cleanup();
  });

  it('ohne AuthClient (alter Cache): Legacy-Verhalten bleibt funktionsfähig', async () => {
    const cleanup = loadModule(null);
    await new Promise((r) => setTimeout(r, 20));

    expect(calls.some((u) => u.includes('gamification/profile'))).toBe(true);
    cleanup();
  });
});
