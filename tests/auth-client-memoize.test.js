/**
 * @vitest-environment jsdom
 *
 * UXF-046 — auth-client.js getUser()-Memoization:
 * Mehrere getUser()-Aufrufe pro Seitenlast → genau 1 /api/auth/me-Call.
 * login()/logout() invalidieren den Cache (nächster getUser lädt frisch).
 *
 * Hinweis: auth-client.js ist eine IIFE mit Closure-Memo — der require-Cache
 * überlebt vi.resetModules() nicht zuverlässig, daher wird der Lifecycle in
 * einer sequenziellen Story getestet (Memo → invalidate → frisch).
 */

describe('UXF-046: auth-client getUser-Memoization', () => {
  const loadModule = () => {
    // Auto-Init (200ms-Retry-Timer) unterdrücken: readyState 'loading' lässt
    // die IIFE nur einen DOMContentLoaded-Listener registrieren.
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
    require('../myhugoapp/static/js/auth-client.js');
  };

  it('Lifecycle: memo → logout invalidiert → login invalidiert', async () => {
    let meCalls = 0;
    let meUser = { user: null };
    const realFetch = global.fetch;
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes('/me')) {
        meCalls++;
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(meUser) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    loadModule();

    /* Phase 1: init (auth-UI) + 200ms-Retry + Consumer greifen dasselbe Memo */
    const p1 = window.AuthClient.getUser();
    await window.AuthClient.getUser();
    const p2 = window.AuthClient.getUser();
    await p1;
    await p2;
    expect(meCalls).toBe(1); // 3 Aufrufe → 1 /me
    expect(window.AuthClient.me()).toBe(window.AuthClient.getUser()); // me() teilt das Memo
    expect(meCalls).toBe(1);

    /* Phase 2: logout invalidiert — nächster getUser lädt frisch */
    window.AuthClient.logout();
    meUser = { user: { email: 'a@b.de', isPremium: false } };
    await expect(window.AuthClient.getUser()).resolves.toMatchObject({ email: 'a@b.de' });
    expect(meCalls).toBe(2);
    await window.AuthClient.getUser();
    expect(meCalls).toBe(2); // eingeloggter User kommt aus dem Memo

    /* Phase 3: login invalidiert ebenfalls */
    await window.AuthClient.login('a@b.de', 'pw');
    meUser = { user: { email: 'a@b.de', isPremium: true } };
    await expect(window.AuthClient.getUser()).resolves.toMatchObject({ isPremium: true });
    expect(meCalls).toBe(3);

    global.fetch = realFetch;
  });
});
