// orbital-controls.js — UI controls manager for the orbital viewer
// Creates and manages DOM-based controls (select, range, toggle buttons)
// with German labels. Stores references for proper cleanup.

import { ORBITALS } from './orbital-data.js';

export class OrbitalControls {
  constructor(container) {
    if (!container) throw new Error('OrbitalControls: container element required');
    this.container = container;
    this._elements = {};
    this._listeners = [];
    this._styleEl = null;
  }

  /**
   * Create all UI controls and append them to the container.
   * @param {Function} onOrbitalChange - called with orbitalId when selection changes
   * @param {Function} onElectronChange - called with count (0-10) when slider changes
   * @param {Function} onPhaseToggle - called with boolean when phase toggle changes
   * @param {Function} onAxisToggle - called with boolean when axis toggle changes
   */
  createUI(onOrbitalChange, onElectronChange, onPhaseToggle, onAxisToggle) {
    // Inline stylesheet
    this._injectStyles();

    const wrap = this._createEl('div', 'ov-controls-panel');
    wrap.setAttribute('role', 'toolbar');
    wrap.setAttribute('aria-label', 'Orbital-Steuerung');

    // ── Orbital selector ────────────────────────────────────
    const selectGroup = this._createEl('div', 'ov-control-group');
    const selectLabel = this._createEl('label', 'ov-label');
    selectLabel.textContent = 'Orbital:';
    selectLabel.setAttribute('for', 'ov-orbital-select');
    selectGroup.appendChild(selectLabel);

    const select = this._createEl('select', 'ov-select');
    select.id = 'ov-orbital-select';
    ORBITALS.forEach((orb) => {
      const opt = document.createElement('option');
      opt.value = orb.id;
      opt.textContent = orb.name;
      select.appendChild(opt);
    });
    selectGroup.appendChild(select);
    wrap.appendChild(selectGroup);

    this._addListener(select, 'change', () => {
      onOrbitalChange(select.value);
    });

    // ── Electron count slider ────────────────────────────────
    const sliderGroup = this._createEl('div', 'ov-control-group');
    const sliderLabel = this._createEl('label', 'ov-label');
    sliderLabel.textContent = 'Elektronen:';
    sliderLabel.setAttribute('for', 'ov-electron-slider');
    sliderGroup.appendChild(sliderLabel);

    const sliderRow = this._createEl('div', 'ov-slider-row');
    const slider = this._createEl('input', 'ov-slider');
    slider.id = 'ov-electron-slider';
    slider.type = 'range';
    slider.min = '0';
    slider.max = '10';
    slider.value = '0';
    slider.step = '1';
    slider.setAttribute('aria-valuemin', '0');
    slider.setAttribute('aria-valuemax', '10');
    slider.setAttribute('aria-valuenow', '0');
    slider.setAttribute('aria-label', 'Elektronenanzahl');
    sliderRow.appendChild(slider);

    const sliderVal = this._createEl('span', 'ov-slider-value');
    sliderVal.id = 'ov-slider-value';
    sliderVal.textContent = '0';
    sliderRow.appendChild(sliderVal);
    sliderGroup.appendChild(sliderRow);
    wrap.appendChild(sliderGroup);

    this._addListener(slider, 'input', () => {
      const val = parseInt(slider.value, 10);
      sliderVal.textContent = String(val);
      slider.setAttribute('aria-valuenow', String(val));
      onElectronChange(val);
    });

    // ── Phase toggle ────────────────────────────────────────
    const phaseGroup = this._createEl('div', 'ov-control-group');
    const phaseLabel = this._createEl('span', 'ov-label');
    phaseLabel.textContent = 'Phase';
    phaseGroup.appendChild(phaseLabel);

    const phaseBtn = this._createEl('button', 'ov-toggle');
    phaseBtn.id = 'ov-phase-toggle';
    phaseBtn.textContent = '±';
    phaseBtn.setAttribute('aria-pressed', 'false');
    phaseBtn.setAttribute('aria-label', 'Phasendarstellung umschalten');
    phaseBtn.title = 'Phasendarstellung ein/aus';
    phaseGroup.appendChild(phaseBtn);
    wrap.appendChild(phaseGroup);

    this._addListener(phaseBtn, 'click', () => {
      const isActive = phaseBtn.getAttribute('aria-pressed') === 'true';
      const newState = !isActive;
      phaseBtn.setAttribute('aria-pressed', String(newState));
      phaseBtn.classList.toggle('ov-active', newState);
      onPhaseToggle(newState);
    });

    // ── Axis labels toggle ──────────────────────────────────
    const axisGroup = this._createEl('div', 'ov-control-group');
    const axisLabel = this._createEl('span', 'ov-label');
    axisLabel.textContent = 'Achsen';
    axisGroup.appendChild(axisLabel);

    const axisBtn = this._createEl('button', 'ov-toggle');
    axisBtn.id = 'ov-axis-toggle';
    axisBtn.textContent = 'Gitter';
    axisBtn.setAttribute('aria-pressed', 'true');
    axisBtn.setAttribute('aria-label', 'Achsen und Gitter umschalten');
    axisBtn.title = 'Achsen und Gitter ein/aus';
    axisBtn.classList.add('ov-active');
    axisGroup.appendChild(axisBtn);
    wrap.appendChild(axisGroup);

    this._addListener(axisBtn, 'click', () => {
      const isActive = axisBtn.getAttribute('aria-pressed') === 'true';
      const newState = !isActive;
      axisBtn.setAttribute('aria-pressed', String(newState));
      axisBtn.classList.toggle('ov-active', newState);
      onAxisToggle(newState);
    });

    // ── Info display ────────────────────────────────────────
    const infoGroup = this._createEl('div', 'ov-control-group', 'ov-info-group');
    const descEl = this._createEl('div', 'ov-description');
    descEl.id = 'ov-description';
    descEl.textContent = ORBITALS[0].description;
    infoGroup.appendChild(descEl);
    wrap.appendChild(infoGroup);

    this.container.appendChild(wrap);

    // Store references for cleanup
    this._elements = { select, slider, sliderVal, phaseBtn, axisBtn, descEl, wrap };
  }

  /** Read current orbital ID from the select element. */
  getSelectedOrbital() {
    return this._elements.select ? this._elements.select.value : '1s';
  }

  /** Read current electron count from the slider. */
  getElectronCount() {
    if (!this._elements.slider) return 0;
    return parseInt(this._elements.slider.value, 10);
  }

  /** Whether phase visualization is enabled. */
  getPhaseEnabled() {
    if (!this._elements.phaseBtn) return false;
    return this._elements.phaseBtn.getAttribute('aria-pressed') === 'true';
  }

  /** Whether axis labels / grid are enabled. */
  getAxisLabelsEnabled() {
    if (!this._elements.axisBtn) return false;
    return this._elements.axisBtn.getAttribute('aria-pressed') === 'true';
  }

  /** Update the description text shown below controls. */
  updateDescription(text) {
    if (this._elements.descEl) {
      this._elements.descEl.textContent = text;
    }
  }

  /**
   * Remove all created DOM elements and event listeners.
   * Call this when cleaning up the orbital viewer.
   */
  dispose() {
    // Remove event listeners
    for (const entry of this._listeners) {
      entry.el.removeEventListener(entry.event, entry.handler);
    }
    this._listeners = [];

    // Remove the control panel from the DOM
    if (this._elements.wrap && this._elements.wrap.parentNode) {
      this._elements.wrap.parentNode.removeChild(this._elements.wrap);
    }

    // Remove injected styles
    if (this._styleEl && this._styleEl.parentNode) {
      this._styleEl.parentNode.removeChild(this._styleEl);
    }

    this._elements = {};
    this._styleEl = null;
  }

  // ── Internal helpers ──────────────────────────────────────

  /** Create a DOM element with optional class(es). */
  _createEl(tag, ...classes) {
    const el = document.createElement(tag);
    if (classes.length > 0) {
      el.classList.add(...classes.filter(Boolean));
    }
    return el;
  }

  /** Register an event listener that can be later removed via dispose(). */
  _addListener(el, event, handler) {
    el.addEventListener(event, handler);
    this._listeners.push({ el, event, handler });
  }

  /** Inject minimal inline styles for the controls. */
  _injectStyles() {
    if (document.getElementById('ov-controls-style')) return;
    const style = document.createElement('style');
    style.id = 'ov-controls-style';
    style.textContent = `
      .ov-controls-panel {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 20px;
        align-items: center;
        padding: 10px 14px;
        background: rgba(248, 249, 250, 0.95);
        border-radius: 8px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .ov-control-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ov-label {
        font-weight: 600;
        color: #333;
        white-space: nowrap;
        font-size: 13px;
      }
      .ov-select {
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 13px;
        background: #fff;
        cursor: pointer;
      }
      .ov-slider-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ov-slider {
        width: 100px;
        cursor: pointer;
      }
      .ov-slider-value {
        min-width: 22px;
        text-align: center;
        font-weight: 600;
        font-size: 13px;
        color: #1a73e8;
      }
      .ov-toggle {
        padding: 4px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #f5f5f5;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        font-family: inherit;
      }
      .ov-toggle:hover {
        background: #e8e8e8;
      }
      .ov-toggle.ov-active {
        background: #1a73e8;
        color: #fff;
        border-color: #1a73e8;
      }
      .ov-info-group {
        flex: 1 1 100%;
      }
      .ov-description {
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
    this._styleEl = style;
  }
}
