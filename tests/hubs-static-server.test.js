/**
 * Hubs-Static-Server — Drift-Wächter.
 *
 * scripts/hubs-static-server.py ist die repo-seitige Kopie der im
 * Container laufenden static-server.py (/code/static-server.py, RO
 * Single-File-Bind-Mount von /opt/git/hubs-client-assets/…). Die
 * Host-Kopie wurde manuell gepatcht (slug-aware Room-URLs,
 * _resolve_target, do_HEAD) und danach ins Repo zurückgesync't.
 *
 * Diese Suite verhindert, dass die beiden Kopien wieder auseinander-
 * laufen — auf Deploy-Hosts. Ohne Host-Datei (z. B. CI) wird der
 * Drift-Vergleich übersprungen; Syntax + Kern-Features laufen überall.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPO_SERVER = path.join(ROOT, 'scripts', 'hubs-static-server.py');
const HOST_SERVER = '/opt/git/hubs-client-assets/static-server.py';

const src = fs.readFileSync(REPO_SERVER, 'utf8');

describe('scripts/hubs-static-server.py — Kern-Features', () => {
  test('Datei existiert im Repo', () => {
    expect(fs.existsSync(REPO_SERVER)).toBe(true);
  });

  test('slug-bewusstes Routing (_resolve_target, do_HEAD vorhanden)', () => {
    expect(src).toContain('_resolve_target');
    expect(src).toContain('do_HEAD');
    expect(src).toMatch(/slug/);
  });

  test('Python-Syntax kompiliert (python3 -m py_compile, falls verfügbar)', () => {
    let python3;
    try {
      python3 = execFileSync('which', ['python3']).toString().trim();
    } catch {
      python3 = null;
    }
    if (!python3) {
      return; // kein python3 -> überspringen (z. B. Alpine-CI)
    }
    expect(() =>
      execFileSync(python3, ['-m', 'py_compile', REPO_SERVER], { stdio: 'pipe' })
    ).not.toThrow();
  });
});

describe('Drift-Wächter: Host-Kopie ↔ Repo-Kopie', () => {
  test('Host-Datei ist byte-identisch mit der Repo-Quelle (sonst Deploy-Regression)', () => {
    // Nur auf Deploy-Hosts prüfbar; ohne Host-Datei (z. B. CI) trivial grün.
    if (!fs.existsSync(HOST_SERVER)) {
      return;
    }
    const hostSrc = fs.readFileSync(HOST_SERVER, 'utf8');
    expect(hostSrc).toBe(src);
  });
});
