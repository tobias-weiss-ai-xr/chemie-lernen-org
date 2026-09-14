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
  const effBgs = (el) => {
    const layers = [];
    let e = el;
    while (e) {
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
