/**
 * UXF-051..054 — Guards für die „Was ist Chemie?"-UX-Fixes:
 *  - UXF-051: kein 100vw-Video-Breakout mehr in .thema-content
 *  - UXF-052: Tabellen in .thema-content haben width:100%
 *  - UXF-053: Badge-Selektoren matchen die tatsächlichen Klassen
 *             (.label-difficulty.label-grundlagen, nicht .grundlagen)
 *  - UXF-054: Video-Caption + zigs-Metatexte lesbar (Light + Dark)
 */

import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8');

describe('UXF-051..054: thema-content Fixes', () => {
  const custom = read('myhugoapp/static/css/custom.css');
  const dark = read('myhugoapp/static/css/dark-mode.css');
  const single = read('myhugoapp/layouts/_default/single.html');

  test('UXF-051: kein 100vw-Breakout für Videos mehr', () => {
    expect(custom).toContain('.thema-content > .video-embed');
    expect(custom).not.toMatch(/\.thema-content > \.video-embed[^}]*100vw/s);
  });

  test('UXF-051/055: Videos in Artikeln auf 640px begrenzt + zentriert', () => {
    expect(custom).toMatch(/\.thema-content > \.video-embed\s*{[\s\S]*?max-width:\s*640px/);
    expect(custom).toMatch(/\.thema-content > \.video-embed\s*{[\s\S]*?margin-left:\s*auto/);
  });

  test('UXF-052: Tabellen in thema-content auf volle Breite', () => {
    expect(custom).toMatch(/\.thema-content table\s*{\s*width:\s*100%/);
    expect(custom).toMatch(
      /\.thema-content th,\s*\n\.thema-content td\s*{[\s\S]*?padding:\s*10px 14px/
    );
  });

  test('UXF-053: Badge-Selektoren matchen label-grundlagen etc.', () => {
    expect(single).toContain('.label-difficulty.label-grundlagen');
    expect(single).toContain('.label-difficulty.label-mittelstufe');
    expect(single).toContain('.label-difficulty.label-fortgeschritten');
    // der kaputte Selektor (ohne label-Präfix) darf nicht wiederkommen
    expect(single).not.toContain('.label-difficulty.grundlagen');
    // Markup erzeugt weiterhin label-<schwierigkeit>
    expect(single).toContain('label-{{ .Params.schwierigkeit }}');
  });

  test('UXF-054: Caption/Metatexte kontraststark in beiden Themes', () => {
    expect(custom).toMatch(/\.video-embed-caption\s*{[\s\S]*?color:\s*#595959/);
    expect(custom).toMatch(/\.zigs-video-source\s*{[\s\S]*?color:\s*#595959/);
    expect(custom).toMatch(/\.zigs-video-empty\s*{[\s\S]*?color:\s*#595959/);
    expect(dark).toContain("[data-theme='dark'] .video-embed-caption");
    expect(dark).toContain("[data-theme='dark'] .zigs-video-source");
  });
});
