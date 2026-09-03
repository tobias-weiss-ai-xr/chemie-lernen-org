/**
 * apply-r8b-lab.mjs — UXF-037/038: Virtuelles Labor „black plane" Fix
 *
 * Pixel-verifizierter Produktions-Bug: Die Lab-Szene blieb nach dem Laden
 * LEER (nur Hintergrund 0x1a1a2e + unsichtbare Bodenebene = „black plane").
 * Gemessen: Ø-RGB(26,27,47), 0.3 % helle Pixel —equipment erscheint erst
 * nach manueller Dropdown-Änderung.
 *
 * UXF-037: init() lädt jetzt das vorausgewählte Experiment automatisch
 *   (Select-Wert; ohne Select „freestyle" aus dem Katalog).
 * UXF-038: reset() stellt das aktuelle Experiment wieder her, statt die
 *   Szene leer zu hinterlassen.
 * UXF-039: Dual-Export (module.exports) für die Test-Suite.
 *
 * Datei: myhugoapp/static/js/virtual-lab/lab-engine.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const TARGET = path.join(REPO_ROOT, 'myhugoapp/static/js/virtual-lab/lab-engine.js');

let src = fs.readFileSync(TARGET, 'utf-8');

// ── UXF-037: initiales Experiment laden ──────────────────────────────
if (src.includes('UXF-037')) {
  console.log('[UXF-037] initiales Experiment-Laden bereits vorhanden');
} else {
  const a1 = `    // ── Hide loading indicator ──────────────────────────────────────
    var loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  },`;
  if (!src.includes(a1)) throw new Error('[UXF-037] Anker a1 (Ende von init) nicht gefunden');
  src = src.replace(
    a1,
    `    // ── Hide loading indicator ──────────────────────────────────────
    var loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    // ── UXF-037: Initiales Experiment laden ────────────────────────
    // Vorher blieb die Szene leer (dunkler Hintergrund + unsichtbare
    // Bodenebene = „black plane"), bis der Nutzer das Dropdown änderte.
    var select = document.getElementById('experiment-select');
    var initialId =
      select && select.value
        ? select.value
        : window.experiments && window.experiments.freestyle
          ? 'freestyle'
          : null;
    if (initialId) {
      self.loadExperiment(initialId);
    }
  },`
  );
  console.log('[UXF-037] ✓ init() lädt vorausgewähltes Experiment');
}

// ── UXF-038: reset() stellt Experiment wieder her ────────────────────
if (src.includes('UXF-038')) {
  console.log('[UXF-038] reset-Wiederherstellung bereits vorhanden');
} else {
  const a2 = `  reset: function () {
    if (typeof EquipmentManager !== 'undefined') {
      EquipmentManager.clear();
    }
    this._clearObservations();
    this.hideInfo();
    this._isRunning = false;
    this._setRunButtonDisabled(false);
  },`;
  if (!src.includes(a2)) throw new Error('[UXF-038] Anker a2 (reset) nicht gefunden');
  src = src.replace(
    a2,
    `  reset: function () {
    var hadExperiment = this._currentExperimentId;
    if (typeof EquipmentManager !== 'undefined') {
      EquipmentManager.clear();
    }
    this._clearObservations();
    this.hideInfo();
    this._isRunning = false;
    this._setRunButtonDisabled(false);
    // UXF-038: Szene wiederherstellen — vorher blieb nach dem Reset die
    // leere Szene stehen („black plane") bis zur Neu-Auswahl.
    if (hadExperiment) {
      this.loadExperiment(hadExperiment);
    }
  },`
  );
  console.log('[UXF-038] ✓ reset() stellt aktuelles Experiment wieder her');
}

// ── UXF-040: Sichtbarer Boden + Bedien-Hinweis (kein Void) ──────────
if (src.includes('UXF-040')) {
  console.log('[UXF-040] Boden + Hinweis bereits vorhanden');
} else {
  const a4 = `    // ── UXF-037: Initiales Experiment laden ────────────────────────`;
  if (!src.includes(a4)) throw new Error('[UXF-040] Anker a4 nicht gefunden');
  src = src.replace(
    a4,
    `    // ── UXF-040: Sichtbarer Lab-Boden ──────────────────────────────
    // Vorher war die Szene ein dunkler Void — das las sich als „kaputt".
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x22223a, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this._scene.add(floor);
    var grid = new THREE.GridHelper(20, 20, 0x444466, 0x333348);
    grid.position.y = 0.001;
    this._scene.add(grid);

    // ── UXF-037: Initiales Experiment laden ────────────────────────`
  );

  // Bedien-Hinweis NACH dem initialen Experiment-Load (loadExperiment
  // leert das Log).
  const a5 = `    if (initialId) {
      self.loadExperiment(initialId);
    }
  },`;
  if (!src.includes(a5)) throw new Error('[UXF-040] Anker a5 nicht gefunden');
  src = src.replace(
    a5,
    `    if (initialId) {
      self.loadExperiment(initialId);
    }
    self.addObservation(
      'Wähle oben ein Experiment oder ziehe Geräte aus der Leiste in den Raum.',
      'info'
    );
  },`
  );
  console.log('[UXF-040] ✓ sichtbarer Boden (Floor + Grid) und Bedien-Hinweis');
}

// ── UXF-039: Dual-Export für Tests ───────────────────────────────────
if (src.includes('UXF-039')) {
  console.log('[UXF-039] module.exports bereits vorhanden');
} else {
  src = src.replace(
    /\n*$/,
    `
// UXF-039: Dual-Export für Tests (Browser behält das globale var LabEngine)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LabEngine;
}
`
  );
  console.log('[UXF-039] ✓ module.exports ergänzt');
}

fs.writeFileSync(TARGET, src);
execFileSync('node', ['--check', TARGET], { stdio: 'inherit' });
console.log('[r8b-lab] ✓ abgeschlossen (Syntax OK)');
