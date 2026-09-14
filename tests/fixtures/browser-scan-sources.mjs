/**
 * Browser-seitige Quellen für tests/contrast-rendered.test.mjs.
 *
 * Extra-Datei, weil node-env-Files laut tests/vitest-project-lists.test.js
 * keine DOM-Referenzen im Test-Source haben dürfen — die Strings hier laufen
 * ausschließlich via page.evaluate/addInitScript im Chromium der Seite.
 */

/** WCAG-Relative-Luminanz + Ratio + effektiver BG (Chain, Alpha, Gradient). */
export const SCAN_SRC = `(() => {
  const lum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (fg, bg) => {
    const l1 = lum(fg.r, fg.g, fg.b), l2 = lum(bg.r, bg.g, bg.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const parse = (c) => {
    const m = c && c.match && c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  // Gradient-Endpunkte als Worst-Case-BG (background-image überdeckt bg-color)
  const stopsFromImage = (img) => {
    if (!img || img === 'none' || !img.includes('gradient')) return [];
    return (img.match(/rgba?\\([^)]+\\)/g) || []).slice(0, 2).map(parse).filter(Boolean);
  };
  // Effektiver BG: Parent-Kette, Alpha-Kompositierung, Gradient-Stops.
  const blend = (t, b) => ({
    r: t.r * t.a + b.r * (1 - t.a),
    g: t.g * t.a + b.g * (1 - t.a),
    b: t.b * t.a + b.b * (1 - t.a),
  });
  // Geometrie-Guard: Nur Vorfahren, deren Box den Text wirklich umschließt,
  // liegen visuell hinter ihm (z. B. .ph-marks: top:100% unter dem
  // Gradient-Streifen — der Streifen ist NICHT der Text-Hintergrund).
  const contains = (o, i) =>
    o.left <= i.left + 2 && o.right >= i.right - 2 && o.top <= i.top + 2 && o.bottom >= i.bottom - 2;
  const effBgs = (el) => {
    const layers = [];
    const elRect = el.getBoundingClientRect();
    let e = el;
    while (e) {
      if (e !== el && !contains(e.getBoundingClientRect(), elRect)) {
        e = e.parentElement;
        continue;
      }
      const cs = getComputedStyle(e);
      const stops = stopsFromImage(cs.backgroundImage);
      if (stops.length) {
        // Gradient liegt UNTER gesammelten semi-transparenten Layern:
        // Layer über jeden Gradient-Endpunkt komponieren (Worst-Case).
        return stops.map((s) => {
          let base = { r: s.r, g: s.g, b: s.b, a: 1 };
          for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
          return base;
        });
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.999) break;
      }
      e = e.parentElement;
    }
    if (!layers.length) {
      const bb = parse(getComputedStyle(document.body).backgroundColor);
      return [bb || { r: 255, g: 255, b: 255 }];
    }
    let base = layers[layers.length - 1];
    for (let i = layers.length - 2; i >= 0; i--) base = blend(layers[i], base);
    return [base];
  };
  const out = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest('script, style, noscript, iframe, svg, .katex-mathml, [aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const bgCandidates = effBgs(el);
    let worst = Infinity, worstBg = null;
    for (const bg of bgCandidates) {
      const r = ratio(fg, bg);
      if (r < worst) { worst = r; worstBg = Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b); }
    }
    if (worst === Infinity) continue;
    const fsz = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = fsz >= 24 || (fsz >= 18.66 && bold);
    const min = large ? 3 : 4.5;
    if (worst < min) {
      let p = el, path = [];
      for (let i = 0; p && i < 4; i++, p = p.parentElement) {
        const cls = p.className && typeof p.className === 'string' ? '.' + p.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
        path.unshift(p.tagName.toLowerCase() + cls);
      }
      out.push({
        text: n.nodeValue.trim().slice(0, 40),
        selector: path.join(' > '),
        fg: cs.color,
        bg: worstBg,
        ratio: +worst.toFixed(2),
        need: min,
      });
    }
  }
  return out;
})()`;

/** UXF-057-Regression: Feedback-Boxen injizieren (wie quiz-ui.js _showFeedback). */
export const INJECT_QUIZ_FEEDBACK = `(() => {
  const area = document.getElementById('quiz-area') || document.querySelector('.quiz-container');
  if (!area) return false;
  for (const cls of ['quiz-feedback-wrong', 'quiz-feedback-correct']) {
    const d = document.createElement('div');
    d.className = 'quiz-feedback ' + cls;
    d.innerHTML =
      '<div class="quiz-feedback-label">' + (cls.includes('wrong') ? 'Falsch · 0/10 Punkte' : 'Richtig! 10/10 Punkte') + '</div>' +
      '<div class="quiz-feedback-explanation">Erklärung: Testtext für den Kontrast-Scan.</div>';
    area.appendChild(d);
  }
  return true;
})()`;

/** Init-Script (String) — setzt das Theme vor dem ersten Paint (FOUC-safe). */
export const themeInitSrc = (theme) =>
  `try { localStorage.setItem('theme', '${theme}'); } catch (e) {}`;

/**
 * UXF-059: Gerenderte UX-/A11y-Checks (Fokus, Touch-Targets, Alt, Labels,
 * Headings, Icon-Buttons). Läuft via page.evaluate — reine Browser-Strings.
 */
export const UX_CHECKS_SRC = `(() => {
  const out = { focusless: [], smallTargets: [], imgsNoAlt: [], unlabeledInputs: [], headingSkips: [], unnamedIconButtons: [] };
  const vis = (el) => {
    if (!el.isConnected) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const describe = (el) => {
    let p = el, path = [];
    for (let i = 0; p && i < 4; i++, p = p.parentElement) {
      const cls = p.className && typeof p.className === 'string' ? '.' + p.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
      path.unshift(p.tagName.toLowerCase() + cls);
    }
    return path.join(' > ') + ' "' + (el.textContent || '').trim().slice(0, 25) + '"';
  };
  // Alt-Attribute
  for (const img of document.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) out.imgsNoAlt.push((img.getAttribute('src') || '').slice(-50));
  }
  // Formular-Labels (WCAG 3.3.2)
  const skipTypes = ['hidden', 'submit', 'button', 'reset'];
  for (const el of document.querySelectorAll('input, select, textarea')) {
    const t = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
    if (skipTypes.includes(t) || !vis(el) || el.disabled) continue;
    const id = el.getAttribute('id');
    const labeled =
      (id && document.querySelector('label[for="' + id + '"]')) ||
      el.closest('label') ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.getAttribute('title') ||
      el.getAttribute('placeholder');
    if (!labeled) out.unlabeledInputs.push(describe(el));
  }
  // Fokus-Indikator: Zustands-Diff vor/nach .focus()
  const focusables = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => vis(el) && !el.disabled)
    .slice(0, 150);
  const snap = (el) => {
    const cs = getComputedStyle(el);
    return [cs.outlineWidth, cs.outlineStyle, cs.outlineColor, cs.boxShadow, cs.backgroundColor, cs.borderTopColor, cs.textDecorationLine].join('|');
  };
  for (const el of focusables) {
    const before = snap(el);
    el.focus({ preventScroll: true });
    const after = snap(el);
    if (before === after) out.focusless.push(describe(el));
  }
  document.activeElement && document.activeElement.blur();
  // Touch-Targets >= 24x24px (WCAG 2.5.8; Inline-Ausnahme: display:inline)
  for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')) {
    // Skip-Links & Screenreader-Helfer sind absichtlich 1px bis zum Fokus
    if (el.classList.contains('sr-only') || el.classList.contains('sr-only-focusable') || el.closest('.sr-only')) continue;
    if (!vis(el) || el.disabled) continue;
    if (getComputedStyle(el).display === 'inline') continue;
    // Radio/Checkbox in einem <label>: Das Label ist der echte Touch-Target
    const t = el.tagName === 'INPUT' ? el.closest('label') || el : el;
    if (t !== el && vis(t)) {
      const lr = t.getBoundingClientRect();
      if (lr.width >= 24 && lr.height >= 24) continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) out.smallTargets.push(describe(el) + ' [' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px]');
  }
  // Heading-Hierarchie (keine Sprünge, genau ein h1-Bereich)
  let prev = 0;
  for (const h of [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis)) {
    const lvl = +h.tagName[1];
    if (prev && lvl - prev > 1) out.headingSkips.push('h' + prev + ' -> ' + h.tagName + ' "' + (h.textContent || '').trim().slice(0, 30) + '"');
    if (lvl > prev) prev = lvl;
  }
  if (!document.querySelector('h1') || ![...document.querySelectorAll('h1')].some(vis)) out.headingSkips.push('KEIN sichtbares h1');
  // Icon-Buttons ohne zugänglichen Namen
  for (const el of document.querySelectorAll('button, a[href]')) {
    if (!vis(el) || el.disabled) continue;
    const txt = (el.textContent || '').trim();
    if (txt) continue;
    const aria = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('aria-labelledby');
    if (aria) continue;
    if (el.querySelector('img[alt]:not([alt=""]), svg title')) continue;
    out.unnamedIconButtons.push(describe(el));
  }
  return out;
})()`;
