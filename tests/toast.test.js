/**
 * tests/toast.test.js — Tests für das UX-002 Toast-Notification-System
 */
require('../myhugoapp/static/js/utils/toast.js');

describe('UIToast (UX-002)', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function getContainer() {
    return document.getElementById('ux-toast-container');
  }

  test('erstellt Container lazy beim ersten Toast', () => {
    expect(getContainer()).toBeNull();
    window.UIToast.show('Test');
    container = getContainer();
    expect(container).not.toBeNull();
    expect(container.getAttribute('aria-live')).toBe('polite');
    expect(container.getAttribute('role')).toBe('status');
  });

  test('Toast erscheint mit message und Default-Typ info', () => {
    window.UIToast.show('Hallo Welt');
    container = getContainer();
    const toast = container.querySelector('.ux-toast');
    expect(toast).not.toBeNull();
    expect(toast.className).toContain('ux-toast-info');
    expect(toast.querySelector('.ux-toast-body').textContent).toBe('Hallo Welt');
  });

  test('Typen setzen korrekte CSS-Klassen und Icons', () => {
    window.UIToast.success('ok');
    window.UIToast.error('fail');
    window.UIToast.warning('warn');
    window.UIToast.info('info');
    container = getContainer();
    // MAX_TOASTS=3: älteste (success) wurde entfernt
    const toasts = container.querySelectorAll('.ux-toast');
    expect(toasts.length).toBe(3);
    expect(toasts[0].className).toContain('ux-toast-error');
    expect(toasts[0].getAttribute('role')).toBe('alert');
    expect(toasts[0].querySelector('i').className).toContain('fa-exclamation-circle');
    expect(toasts[1].className).toContain('ux-toast-warning');
    expect(toasts[2].className).toContain('ux-toast-info');
  });

  test('textContent (nicht innerHTML) — XSS-sicher', () => {
    window.UIToast.show('<img src=x onerror=alert(1)>');
    container = getContainer();
    const body = container.querySelector('.ux-toast-body');
    expect(body.querySelector('img')).toBeNull();
    expect(body.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  test('Auto-dismiss nach Default-Dauer (5s)', () => {
    window.UIToast.show('verschwinde');
    container = getContainer();
    expect(container.querySelectorAll('.ux-toast').length).toBe(1);
    jest.advanceTimersByTime(5000);
    // dismissing-Klasse wird gesetzt, nach 300ms entfernt
    jest.advanceTimersByTime(400);
    expect(container.querySelectorAll('.ux-toast').length).toBe(0);
  });

  test('Fehler-Toasts haben längere Dauer (8s)', () => {
    window.UIToast.error('bleibt länger');
    container = getContainer();
    jest.advanceTimersByTime(5000);
    expect(container.querySelectorAll('.ux-toast').length).toBe(1);
    jest.advanceTimersByTime(3500);
    expect(container.querySelectorAll('.ux-toast').length).toBe(0);
  });

  test('Close-Button entfernt Toast sofort', () => {
    window.UIToast.show('manuelles schließen');
    container = getContainer();
    const closeBtn = container.querySelector('.ux-toast-close');
    closeBtn.click();
    jest.advanceTimersByTime(400);
    expect(container.querySelectorAll('.ux-toast').length).toBe(0);
  });

  test('max. 3 gleichzeitige Toasts — älteste werden entfernt', () => {
    window.UIToast.show('eins');
    window.UIToast.show('zwei');
    window.UIToast.show('drei');
    window.UIToast.show('vier');
    container = getContainer();
    expect(container.querySelectorAll('.ux-toast').length).toBe(3);
    const bodies = Array.from(container.querySelectorAll('.ux-toast-body')).map(
      (b) => b.textContent
    );
    expect(bodies).toEqual(['zwei', 'drei', 'vier']);
  });

  test('Custom duration wird respektiert', () => {
    window.UIToast.show('kurz', { duration: 1000 });
    container = getContainer();
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(400);
    expect(container.querySelectorAll('.ux-toast').length).toBe(0);
  });

  test('duration: 0 bedeutet kein Auto-dismiss', () => {
    window.UIToast.show('bleibt', { duration: 0 });
    container = getContainer();
    jest.advanceTimersByTime(60000);
    expect(container.querySelectorAll('.ux-toast').length).toBe(1);
  });
});
