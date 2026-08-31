var uiUtils = require('../myhugoapp/static/js/utils/ui-utils.js');
var showError = uiUtils.showError;
var formatNumber = uiUtils.formatNumber;
var darkenColor = uiUtils.darkenColor;
var escapeHtml = uiUtils.escapeHtml;
var showToast = uiUtils.showToast;
var showBadgeToast = uiUtils.showBadgeToast;
var initExerciseHints = uiUtils.initExerciseHints;

function setupErrorDOM() {
  document.body.innerHTML =
    '<div id="error-message"></div>' +
    '<div id="error-section" style="display:none"></div>' +
    '<div id="results-section" style="display:block"></div>';
}

function resetErrorDOM() {
  document.getElementById('error-message').textContent = '';
  document.getElementById('error-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';
}

describe('UIUtils - showError', function () {
  beforeEach(setupErrorDOM);

  test('sets error message text', function () {
    showError('Test error');
    expect(document.getElementById('error-message').textContent).toBe('Test error');
  });

  test('shows error section', function () {
    showError('Test');
    expect(document.getElementById('error-section').style.display).toBe('block');
  });

  test('hides results section', function () {
    showError('Test');
    expect(document.getElementById('results-section').style.display).toBe('none');
  });

  test('handles empty message', function () {
    showError('');
    expect(document.getElementById('error-message').textContent).toBe('');
    expect(document.getElementById('error-section').style.display).toBe('block');
  });

  test('handles special characters in message via textContent (safe)', function () {
    showError('<script>alert("xss")</script>');
    expect(document.getElementById('error-message').textContent).toBe(
      '<script>alert("xss")</script>'
    );
    expect(document.getElementById('error-message').innerHTML).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    );
  });

  test('sets all three elements in correct order', function () {
    showError('Ungültige Eingabe');
    expect(document.getElementById('error-message').textContent).toBe('Ungültige Eingabe');
    expect(document.getElementById('error-section').style.display).toBe('block');
    expect(document.getElementById('results-section').style.display).toBe('none');
  });

  test('gracefully handles missing DOM elements', function () {
    document.body.innerHTML = '';
    expect(function () {
      showError('test');
    }).not.toThrow();
  });

  test('gracefully handles partial DOM (only error-message)', function () {
    document.body.innerHTML = '<div id="error-message"></div>';
    expect(function () {
      showError('test');
    }).not.toThrow();
    expect(document.getElementById('error-message').textContent).toBe('test');
  });

  test('can be called multiple times', function () {
    showError('Error 1');
    expect(document.getElementById('error-message').textContent).toBe('Error 1');
    showError('Error 2');
    expect(document.getElementById('error-message').textContent).toBe('Error 2');
  });
});

describe('UIUtils - formatNumber', function () {
  describe('default behavior (decimals=3, threshold=0.0001/10000)', function () {
    test('formats normal numbers with toFixed', function () {
      expect(formatNumber(3.14159)).toBe('3.142');
    });

    test('uses scientific notation for very small values', function () {
      expect(formatNumber(0.00005)).toBe('5.00e-5');
    });

    test('uses scientific notation for very large values', function () {
      expect(formatNumber(15000)).toBe('1.50e+4');
    });

    test('formats zero with toFixed (not scientific)', function () {
      expect(formatNumber(0)).toBe('0.000');
    });

    test('formats negative numbers', function () {
      expect(formatNumber(-42.5)).toBe('-42.500');
    });

    test('uses scientific for large negative', function () {
      expect(formatNumber(-15000)).toBe('-1.50e+4');
    });

    test('formats integer', function () {
      expect(formatNumber(5)).toBe('5.000');
    });

    test('boundary: just below upper threshold', function () {
      expect(formatNumber(9999.9)).toBe('9999.900');
    });

    test('boundary: at upper threshold', function () {
      expect(formatNumber(10000)).toBe('1.00e+4');
    });

    test('boundary: just above lower threshold', function () {
      expect(formatNumber(0.0002)).toBe('0.000');
    });

    test('boundary: just below lower threshold', function () {
      expect(formatNumber(0.00009)).toBe('9.00e-5');
    });
  });

  describe('custom decimals', function () {
    test('respects decimals=4 like konzentrationsumrechner', function () {
      expect(formatNumber(3.14159, 4)).toBe('3.1416');
    });

    test('respects decimals=2', function () {
      expect(formatNumber(3.14159, 2)).toBe('3.14');
    });

    test('respects decimals=0', function () {
      expect(formatNumber(3.7, 0)).toBe('4');
    });

    test('respects decimals=6', function () {
      expect(formatNumber(3.14159265, 6)).toBe('3.141593');
    });

    test('scientific notation uses dec-1 exponent digits', function () {
      expect(formatNumber(0.00005, 4)).toBe('5.000e-5');
    });
  });

  describe('custom thresholds like redox-potenzial (0.001)', function () {
    test('uses 0.001 lower threshold when specified', function () {
      expect(formatNumber(0.0005, 3, { lowerThreshold: 0.001 })).toBe('5.00e-4');
    });

    test('keeps fixed notation above custom lower threshold', function () {
      expect(formatNumber(0.002, 3, { lowerThreshold: 0.001 })).toBe('0.002');
    });

    test('uses custom upper threshold', function () {
      expect(formatNumber(5000, 3, { upperThreshold: 1000 })).toBe('5.00e+3');
    });
  });

  describe('disable scientific notation like redox-titrationen', function () {
    test('never uses scientific when useScientific=false', function () {
      expect(formatNumber(0.00005, 3, { useScientific: false })).toBe('0.000');
    });

    test('never uses scientific for large values when disabled', function () {
      expect(formatNumber(15000, 3, { useScientific: false })).toBe('15000.000');
    });

    test('still formats decimals correctly with scientific disabled', function () {
      expect(formatNumber(1.5, 2, { useScientific: false })).toBe('1.50');
    });
  });

  describe('edge cases', function () {
    test('handles null', function () {
      expect(formatNumber(null)).toBe('null');
    });

    test('handles undefined', function () {
      expect(formatNumber(undefined)).toBe('undefined');
    });

    test('handles NaN', function () {
      expect(formatNumber(NaN)).toBe('NaN');
    });

    test('no decimals param defaults to 3', function () {
      expect(formatNumber(1)).toBe('1.000');
    });

    test('null options uses defaults', function () {
      expect(formatNumber(0.00005, 3, null)).toBe('5.00e-5');
    });

    test('empty options object uses defaults', function () {
      expect(formatNumber(0.00005, 3, {})).toBe('5.00e-5');
    });

    test('handles Infinity', function () {
      expect(formatNumber(Infinity)).toBe('Infinity');
    });

    test('handles negative Infinity', function () {
      expect(formatNumber(-Infinity)).toBe('-Infinity');
    });

    test('handles negative zero', function () {
      expect(formatNumber(-0)).toBe('0.000');
    });
  });
});

describe('UIUtils - darkenColor', function () {
  test('darkens rgb color by percent', function () {
    expect(darkenColor('rgb(100, 150, 200)', 20)).toBe('rgb(80, 130, 180)');
  });

  test('clamps to 0 minimum', function () {
    expect(darkenColor('rgb(10, 10, 10)', 50)).toBe('rgb(0, 0, 0)');
  });

  test('clamps to 255 maximum for negative percent', function () {
    expect(darkenColor('rgb(200, 200, 200)', -50)).toBe('rgb(250, 250, 250)');
  });

  test('returns original for non-rgb input', function () {
    expect(darkenColor('#ff0000', 50)).toBe('#ff0000');
  });

  test('returns original for rgb with less than 3 values', function () {
    expect(darkenColor('rgb(100)', 50)).toBe('rgb(100)');
  });

  test('handles zero percent', function () {
    expect(darkenColor('rgb(100, 150, 200)', 0)).toBe('rgb(100, 150, 200)');
  });

  test('handles large percent that exceeds 255 range', function () {
    expect(darkenColor('rgb(255, 255, 255)', 300)).toBe('rgb(0, 0, 0)');
  });

  test('returns original for null-like rgb match', function () {
    expect(darkenColor('no-numbers-here', 50)).toBe('no-numbers-here');
  });

  test('extracts only first three numbers from rgb', function () {
    expect(darkenColor('rgb(100, 150, 200, 0.5)', 20)).toBe('rgb(80, 130, 180)');
  });

  test('matches konvektion.js behavior exactly', function () {
    expect(darkenColor('rgb(66, 133, 244)', 30)).toBe('rgb(36, 103, 214)');
  });

  test('handles mixed brightness values', function () {
    expect(darkenColor('rgb(255, 128, 0)', 100)).toBe('rgb(155, 28, 0)');
  });
});

describe('UIUtils - escapeHtml', function () {
  test('escapes ampersand', function () {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  test('escapes less-than', function () {
    expect(escapeHtml('1 < 2')).toBe('1 &lt; 2');
  });

  test('escapes greater-than', function () {
    expect(escapeHtml('2 > 1')).toBe('2 &gt; 1');
  });

  test('escapes double quotes', function () {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  test('escapes single quotes', function () {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  test('escapes all special chars combined', function () {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#039;&lt;/a&gt;'
    );
  });

  test('returns empty string for empty input', function () {
    expect(escapeHtml('')).toBe('');
  });

  test('converts non-string to string first', function () {
    expect(escapeHtml(42)).toBe('42');
  });

  test('handles null via String()', function () {
    expect(escapeHtml(null)).toBe('null');
  });

  test('leaves normal text unchanged', function () {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  test('handles german umlauts (no transformation)', function () {
    expect(escapeHtml('äöü ÄÖÜ ß')).toBe('äöü ÄÖÜ ß');
  });

  test('escapes multiple ampersands', function () {
    expect(escapeHtml('a & b & c')).toBe('a &amp; b &amp; c');
  });

  test('matches entity-index.js original behavior', function () {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('handles already-escaped content idempotently', function () {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});

describe('UIUtils - backward compatibility with existing calculators', function () {
  beforeEach(setupErrorDOM);

  test('gasgesetz formatNumber: decimals=3, threshold=0.0001', function () {
    expect(formatNumber(0.08206, 3)).toBe('0.082');
    expect(formatNumber(0.00005, 3)).toBe('5.00e-5');
    expect(formatNumber(22.4, 3)).toBe('22.400');
    expect(formatNumber(273.15, 3)).toBe('273.150');
  });

  test('konzentrationsumrechner formatNumber: decimals=4, threshold=0.0001', function () {
    expect(formatNumber(0.5, 4)).toBe('0.5000');
    expect(formatNumber(0.00005, 4)).toBe('5.000e-5');
  });

  test('redox-potenzial formatNumber: decimals=3, threshold=0.001', function () {
    expect(formatNumber(0.34, 3, { lowerThreshold: 0.001 })).toBe('0.340');
    expect(formatNumber(0.0005, 3, { lowerThreshold: 0.001 })).toBe('5.00e-4');
  });

  test('redox-titrationen formatNumber: decimals=3, no scientific', function () {
    expect(formatNumber(12.5, 3, { useScientific: false })).toBe('12.500');
  });

  test('verbrennungsrechner formatNumber: decimals=3, threshold=0.0001', function () {
    expect(formatNumber(44.01, 3)).toBe('44.010');
    expect(formatNumber(0.00001, 3)).toBe('1.00e-5');
  });

  test('showError matches Variant A behavior (6 calculators)', function () {
    showError('Bitte füllen Sie alle Felder aus.');
    expect(document.getElementById('error-message').textContent).toBe(
      'Bitte füllen Sie alle Felder aus.'
    );
    expect(document.getElementById('error-section').style.display).toBe('block');
    expect(document.getElementById('results-section').style.display).toBe('none');
  });

  test('showError can be called after reset', function () {
    showError('First error');
    resetErrorDOM();
    showError('Second error');
    expect(document.getElementById('error-message').textContent).toBe('Second error');
  });

  test('darkenColor matches original IIFE implementations', function () {
    expect(darkenColor('rgb(66, 133, 244)', 30)).toBe('rgb(36, 103, 214)');
    expect(darkenColor('rgb(255, 0, 0)', 100)).toBe('rgb(155, 0, 0)');
    expect(darkenColor('rgb(100, 100, 100)', 50)).toBe('rgb(50, 50, 50)');
  });
});

describe('UIUtils - showToast', function () {
  var origRAF;

  beforeAll(function () {
    origRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = function (cb) {
      return setTimeout(cb, 16);
    };
  });

  afterAll(function () {
    global.requestAnimationFrame = origRAF;
  });

  function freshShowToast() {
    jest.resetModules();
    return require('../myhugoapp/static/js/utils/ui-utils.js').showToast;
  }

  beforeEach(function () {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    showToast = freshShowToast();
  });

  afterEach(function () {
    jest.useRealTimers();
  });

  test('creates toast container and appends to body', function () {
    showToast('Test message');
    var container = document.getElementById('toast-container');
    expect(container).not.toBeNull();
    expect(container.style.position).toBe('fixed');
    expect(document.body.contains(container)).toBe(true);
  });

  test('creates toast with message text', function () {
    showToast('Hello World');
    var container = document.getElementById('toast-container');
    expect(container.children).toHaveLength(1);
    expect(container.children[0].textContent).toBe('Hello World');
  });

  test('uses type=info by default', function () {
    showToast('Info toast');
    var toast = document.getElementById('toast-container').children[0];
    expect(toast.style.background).toBe('rgb(23, 162, 184)');
  });

  test('uses error colors for error type', function () {
    showToast('Error toast', 'error');
    var toast = document.getElementById('toast-container').children[0];
    expect(toast.style.background).toBe('rgb(220, 53, 69)');
    expect(toast.style.borderLeft).toContain('rgb(189, 33, 48)');
  });

  test('uses warning colors for warning type', function () {
    showToast('Warning toast', 'warning');
    var toast = document.getElementById('toast-container').children[0];
    expect(toast.style.background).toBe('rgb(255, 193, 7)');
  });

  test('uses success colors for success type', function () {
    showToast('Success toast', 'success');
    var toast = document.getElementById('toast-container').children[0];
    expect(toast.style.background).toBe('rgb(40, 167, 69)');
  });

  test('reuses existing toast container on multiple calls', function () {
    showToast('First');
    showToast('Second');
    var container = document.getElementById('toast-container');
    expect(container.children).toHaveLength(2);
    expect(container.children[0].textContent).toBe('First');
    expect(container.children[1].textContent).toBe('Second');
  });

  test('animates toast in via requestAnimationFrame', function () {
    showToast('Animate');
    var toast = document.getElementById('toast-container').children[0];
    jest.advanceTimersByTime(20);
    expect(toast.style.opacity).toBe('1');
    expect(toast.style.transform).toBe('translateX(0)');
  });

  test('removes toast from DOM after fade-out sequence', function () {
    showToast('Cleanup test');
    var container = document.getElementById('toast-container');
    expect(container.children).toHaveLength(1);
    jest.advanceTimersByTime(20);
    jest.advanceTimersByTime(4000);
    expect(container.children[0].style.opacity).toBe('0');
    jest.advanceTimersByTime(300);
    expect(container.children).toHaveLength(0);
  });

  test('handles unknown toast type gracefully', function () {
    showToast('Custom type', 'unknown');
    var toast = document.getElementById('toast-container').children[0];
    expect(toast.style.background).toBe('rgb(23, 162, 184)');
  });

  test('can show multiple toasts of different types', function () {
    showToast('Error!', 'error');
    showToast('Success!', 'success');
    showToast('Info!', 'info');
    var container = document.getElementById('toast-container');
    expect(container.children).toHaveLength(3);
    expect(container.children[0].style.background).toBe('rgb(220, 53, 69)');
    expect(container.children[1].style.background).toBe('rgb(40, 167, 69)');
    expect(container.children[2].style.background).toBe('rgb(23, 162, 184)');
  });
});

// ── showBadgeToast / initExerciseHints (jsdom) ───────────────────────
global.requestAnimationFrame = global.requestAnimationFrame || ((cb) => setTimeout(cb, 0));

describe('showBadgeToast — Badge-Benachrichtigung', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('legt Container automatisch an und zeigt Badge mit Namen + XP', () => {
    showBadgeToast({ name: 'Erster Rechner', icon: 'fa-trophy', xpBonus: 50 });
    const container = document.getElementById('badge-toast-container');
    expect(container).not.toBeNull();
    const toast = container.querySelector('.badge-toast');
    expect(toast).not.toBeNull();
    expect(toast.innerHTML).toContain('Erster Rechner');
    expect(toast.innerHTML).toContain('+50 XP');
    expect(toast.innerHTML).toContain('fa-trophy');
  });

  test('ohne name → No-Op (kein Toast)', () => {
    showBadgeToast({ icon: 'fa-star' });
    expect(document.getElementById('badge-toast-container')).toBeNull();
  });

  test('Badge-Namen werden escaped (XSS-Schutz)', () => {
    showBadgeToast({ name: '<script>alert(1)</script>', icon: 'fa-star' });
    const toast = document.querySelector('.badge-toast');
    expect(toast.innerHTML).not.toContain('<script>');
    expect(toast.innerHTML).toContain('&lt;script&gt;');
  });

  test('zweites Badge landet im selben Container', () => {
    showBadgeToast({ name: 'A', icon: 'fa-star' });
    showBadgeToast({ name: 'B', icon: 'fa-star' });
    expect(document.querySelectorAll('.badge-toast')).toHaveLength(2);
  });
});

describe('initExerciseHints — Übungs-Hinweise in Listen', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<h2>Übungsaufgaben</h2>' +
      '<ol><li>Berechne die Molmasse von Wasser.</li><li>Stelle die Reaktionsgleichung auf.</li></ol>' +
      '<h3>Theorie</h3><p>Grundlagen der Chemie.</p>';
  });

  test('fügt jedem Listenelement unter "Übung" einen Hinweis-Button hinzu', () => {
    initExerciseHints();
    const buttons = document.querySelectorAll('ol li .hint-button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe('Hinweis');
    expect(buttons[0].dataset.problem).toContain('Molmasse');
  });

  test('Theorie-Überschrift ohne nachfolgende Liste → keine Buttons', () => {
    initExerciseHints();
    // Theorie-Überschrift hat nur einen <p>, keine OL/UL → keine Buttons dort
    const theoryButtons = document.querySelectorAll(
      'h3 + p + ol .hint-button, h3 ~ ol .hint-button'
    );
    expect(theoryButtons).toHaveLength(0);
  });

  test('idempotent: zweiter Aufruf fügt keine zweiten Buttons hinzu', () => {
    initExerciseHints();
    initExerciseHints();
    expect(document.querySelectorAll('ol li .hint-button')).toHaveLength(2);
  });
});
