/**
 * @vitest-environment jsdom
 *
 * UXF-050 — auth-client Auto-Init mit MutationObserver statt blindem
 * 200ms-Retry:
 *  - init() verursacht genau 1 /me-Call (Memo)
 *  - taucht die Navbar SPÄTER auf (dynamisches Rendering), wird der
 *    Auth-Eintrag ohne zusätzlichen /me-Call nachgesetzt
 *  - Re-Render der Navbar → Auth-Eintrag wird wiederhergestellt, weiter 1 Call
 *
 * Eigenes Testfile: auth-client.js ist eine IIFE mit require-Cache —
 * pro File genau eine frische Modul-Instanz.
 */

describe('UXF-050: auth-client init + dynamische Navbar', () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  it('init: 1 /me-Call, spätere Navbar bekommt Auth-Eintrag ohne neuen Call', async () => {
    let meCalls = 0;
    const realFetch = global.fetch;
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/me')) meCalls++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: null }),
      });
    });

    document.body.innerHTML = '<nav><ul id="nav-root"></ul></nav>';

    // jsdom readyState ist hier bereits 'complete' → init() läuft sofort
    require('../myhugoapp/static/js/auth-client.js');
    await sleep(20);
    expect(meCalls).toBe(1); // init = genau 1 Call, kein 200ms-Retry

    /* Navbar erscheint dynamisch (z. B. spätes Template-Rendering) */
    const nav = document.createElement('ul');
    nav.className = 'navbar-nav';
    document.getElementById('nav-root').appendChild(nav);
    await sleep(30);
    expect(nav.querySelector('.auth-menu-item')).not.toBeNull(); // nachgesetzt
    expect(meCalls).toBe(1); // ohne zusätzlichen /me-Call

    /* Navbar-Re-Render: Auth-Eintrag wird wiederhergestellt, weiter 1 Call */
    const nav2 = document.createElement('ul');
    nav2.className = 'navbar-nav';
    nav.replaceWith(nav2);
    await sleep(30);
    expect(nav2.querySelector('.auth-menu-item')).not.toBeNull();
    expect(meCalls).toBe(1);

    global.fetch = realFetch;
  });
});
