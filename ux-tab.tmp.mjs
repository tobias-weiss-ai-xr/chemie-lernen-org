import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://chemie-lernen.org/themenbereiche/einfuehrung-chemie/was-ist-chemie/', { waitUntil: 'networkidle' });
const out = await p.evaluate(() => {
  const r = {};
  const main = document.querySelector('main') || document.querySelector('.content') || document.querySelector('article') || document.body;
  const cs = getComputedStyle(main);
  r.main = { cls: main.className, w: main.getBoundingClientRect().width, maxW: cs.maxWidth, pad: cs.padding };
  const art = main.closest('article, .post, .card') || main;
  r.container = { cls: art.className, w: art.getBoundingClientRect().width, maxW: getComputedStyle(art).maxWidth };
  const t = document.querySelector('table');
  if (t) {
    const tcs = getComputedStyle(t);
    r.table = { w: t.getBoundingClientRect().width, parentW: t.parentElement.getBoundingClientRect().width,
      display: tcs.display, fs: tcs.fontSize, color: tcs.color, thBg: getComputedStyle(t.querySelector('th') || t.rows[0].cells[0]).backgroundColor,
      thColor: t.querySelector('th') ? getComputedStyle(t.querySelector('th')).color : null,
      tdPad: getComputedStyle(t.rows[1].cells[1]).padding };
  }
  const f = document.querySelector('iframe[src*="youtube"], .video-container iframe, iframe[title*="Why"]');
  if (f) { const fr = f.getBoundingClientRect(); const wrap = f.parentElement.getBoundingClientRect();
    r.video = { iframeW: fr.width, iframeH: fr.height, wrapCls: f.parentElement.className, wrapW: wrap.width }; }
  else { const vc = document.querySelector('[class*="video"], [class*="embed"]'); r.video = vc ? { wrapCls: vc.className, w: vc.getBoundingClientRect().width, html: vc.outerHTML.slice(0,150) } : 'kein iframe gefunden'; }
  // helle Schrift finden: Absätze/Formeln mit niedrigem Kontrast
  r.lightText = [];
  for (const el of document.querySelectorAll('p, td, th, li, .katex, span')) {
    const s = getComputedStyle(el);
    if (s.color && el.textContent.trim().length > 5) {
      const m = s.color.match(/rgba?\((\d+), (\d+), (\d+)/);
      if (m) { const lum = 0.299*m[1] + 0.587*m[2] + 0.114*m[3];
        if (lum > 190 && el.children.length === 0) { r.lightText.push({ tag: el.tagName, cls: el.className.toString().slice(0,30), color: s.color, text: el.textContent.trim().slice(0,40) }); if (r.lightText.length > 5) break; } }
    }
  }
  return r;
});
console.log(JSON.stringify(out, null, 1));
await b.close();
