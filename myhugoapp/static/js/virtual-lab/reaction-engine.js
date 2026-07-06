/* reaction-engine.js — Chemical reaction state machine
 * Exposes a global ReactionEngine object.
 * Depends on: window.experiments (from experiments.js)
 */
/* exported ReactionEngine */

/* ------------------------------------------------------------------ */
/*  Observation scripts per experiment type                            */
/*  Maps elapsed seconds to visual hints for the renderer layer.       */
/* ------------------------------------------------------------------ */
var ReactionEngine = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Predefined chemical reaction pairs  (simplified thermodynamic      */
  /*  look-up — real reactivity depends on concentration, temp, etc.)    */
  /* ------------------------------------------------------------------ */
  var REACTION_PAIRS = [
    // Acid / base neutralisation
    { a: 'NaOH', b: 'HCl', reacts: true },
    { a: 'HCl', b: 'NaOH', reacts: true },
    { a: 'NaOH', b: 'H₂SO₄', reacts: true },
    { a: 'H₂SO₄', b: 'NaOH', reacts: true },
    { a: 'HCl', b: 'KOH', reacts: true },
    { a: 'KOH', b: 'HCl', reacts: true },

    // Metal + acid → H₂
    { a: 'Zn', b: 'HCl', reacts: true },
    { a: 'HCl', b: 'Zn', reacts: true },
    { a: 'Mg', b: 'HCl', reacts: true },
    { a: 'HCl', b: 'Mg', reacts: true },
    { a: 'Fe', b: 'HCl', reacts: true },
    { a: 'HCl', b: 'Fe', reacts: true },

    // CO₂ / limewater
    { a: 'Ca(OH)₂', b: 'CO₂', reacts: true },
    { a: 'CO₂', b: 'Ca(OH)₂', reacts: true },

    // Hydration of CuSO₄
    { a: 'CuSO₄', b: 'H₂O', reacts: true },
    { a: 'H₂O', b: 'CuSO₄', reacts: true },

    // H₂ combustion
    { a: 'H₂', b: 'O₂', reacts: true },
    { a: 'O₂', b: 'H₂', reacts: true },
  ];

  /* Each experiment type maps to a "visual script" — timeline of visual
     effects the UI layer can consume. Fields are optional hints for
     the renderer; the engine passes them through as-is. */
  var VISUAL_SCRIPTS = {
    titration: [
      { time: 0, color: '#f0b8d0', liquid: 'NaOH', pH: 13, bubbles: false },
      { time: 5, color: '#e86ba0', liquid: 'NaOH+Ind', pH: 12.5, bubbles: false },
      { time: 15, color: '#e86ba0', liquid: 'NaOH+Ind+HCl', pH: 10, bubbles: false, drip: true },
      { time: 22, color: '#f0b8d0', liquid: 'NaOH+Ind+HCl', pH: 8, bubbles: false, drip: true },
      { time: 25, color: '#d0e0f0', liquid: 'NaCl', pH: 7, bubbles: false },
      { time: 30, color: '#d0e0f0', liquid: 'NaCl', pH: 7, bubbles: false },
    ],
    'co2-nachweis': [
      { time: 0, color: '#e8f0e8', liquid: 'Ca(OH)₂', precipitate: 0, bubbles: false },
      { time: 5, color: '#e8f0e8', liquid: 'Ca(OH)₂+CO₂', precipitate: 0, bubbles: true },
      { time: 10, color: '#e0e8d8', liquid: 'Ca(OH)₂+CO₂', precipitate: 30, bubbles: true },
      { time: 15, color: '#d0dcc0', liquid: 'CaCO₃↓', precipitate: 70, bubbles: false },
      { time: 20, color: '#d8e0d0', liquid: 'Ca(HCO₃)₂', precipitate: 20, bubbles: false },
    ],
    'kupfer-sulfat': [
      { time: 0, color: '#f0f0f0', liquid: 'CuSO₄(anhydr)', temp: 20, crystals: 0 },
      { time: 3, color: '#4080d0', liquid: 'CuSO₄·5H₂O', temp: 25, crystals: 0 },
      { time: 8, color: '#3070c0', liquid: 'CuSO₄(aq)', temp: 40, crystals: 0 },
      { time: 12, color: '#2860b0', liquid: 'CuSO₄(aq)', temp: 55, crystals: 0 },
      { time: 18, color: '#3870c8', liquid: 'CuSO₄·5H₂O↓', temp: 30, crystals: 50 },
    ],
    wasserstoff: [
      { time: 0, color: '#c0c0c0', liquid: 'Zn(s)', gas: 0, flame: false },
      { time: 3, color: '#b0b8c0', liquid: 'Zn+HCl', gas: 40, flame: false },
      { time: 8, color: '#b0b8c0', liquid: 'ZnCl₂(aq)', gas: 70, flame: false },
      { time: 12, color: '#b0b8c0', liquid: 'ZnCl₂(aq)', gas: 90, flame: false, spark: false },
      { time: 15, color: '#ff8800', liquid: 'ZnCl₂(aq)', gas: 0, flame: true, spark: true },
    ],
  };

  /* How long a full observation timeline takes (ms) */
  var OBSERVATION_DURATION = 3500;

  /* ------------------------------------------------------------------ */
  /*  Internal state                                                     */
  /* ------------------------------------------------------------------ */
  var _state = 'idle'; // idle | running | complete | error
  var _timer = null;
  var _currentId = null;
  var _stepIndex = 0;

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /** Find experiment by id in window.experiments */
  function _findExperiment(id) {
    if (!window.experiments) {
      return null;
    }
    for (var i = 0; i < window.experiments.length; i++) {
      if (window.experiments[i].id === id) {
        return window.experiments[i];
      }
    }
    return null;
  }

  /** Derive visual effect from the visual script for the given
   *  experiment ID at the given elapsed seconds.
   *  Returns a plain object (safe to JSON.stringify).
   */
  function _getVisuals(experimentId, elapsedSec) {
    var script = VISUAL_SCRIPTS[experimentId];
    if (!script) {
      return {};
    }

    var current = script[0] || {};
    for (var i = 0; i < script.length; i++) {
      if (script[i].time <= elapsedSec) {
        current = script[i];
      }
    }
    return current;
  }

  /** Run the observation timeline for an experiment that has
   *  pre-defined observations (scheduled at callback-compatible delays).
   */
  function _runObservationTimeline(experiment, callbacks) {
    var obs = experiment.observations;
    if (!obs || obs.length === 0) {
      _finish(experiment, callbacks);
      return;
    }

    var idx = 0;

    function step() {
      if (idx >= obs.length || _state !== 'running') {
        return;
      }

      var entry = obs[idx];
      /* Derive elapsed seconds from the observation's time string,
         e.g. "15s" → 15 */
      var sec = parseInt(entry.time, 10) || 0;

      var effects = _getVisuals(experiment.id, sec);

      if (typeof callbacks.onProgress === 'function') {
        callbacks.onProgress(entry.text, entry.type, effects);
      }

      idx++;

      if (idx < obs.length) {
        var nextEntry = obs[idx];
        var nextSec = parseInt(nextEntry.time, 10) || 0;
        var delay = (nextSec - sec) * 100; /* scale time for UX */
        _timer = setTimeout(step, delay);
      } else {
        _finish(experiment, callbacks);
      }
    }

    _timer = setTimeout(step, 400);
  }

  /** Walk through the step-by-step instructions (5–7 steps). */
  function _runInstructionSteps(experiment, callbacks) {
    var steps = experiment.steps;
    if (!steps || steps.length === 0) {
      _finish(experiment, callbacks);
      return;
    }

    _stepIndex = 0;

    function nextStep() {
      if (_state !== 'running') {
        return;
      }

      if (_stepIndex >= steps.length) {
        /* If there are observations, run those now */
        if (experiment.observations && experiment.observations.length > 0) {
          _runObservationTimeline(experiment, callbacks);
        } else {
          _finish(experiment, callbacks);
        }
        return;
      }

      var step = steps[_stepIndex];

      /* Notify the UI about the current instruction */
      if (typeof callbacks.onProgress === 'function') {
        callbacks.onProgress('▶ ' + step.text, step.type, {});
      }

      _stepIndex++;

      var delay = 800 + Math.floor(Math.random() * 700);
      _timer = setTimeout(nextStep, delay);
    }

    _timer = setTimeout(nextStep, 300);
  }

  /** Build the result summary and call onComplete. */
  function _finish(experiment, callbacks) {
    if (_state !== 'running') {
      return;
    }
    _state = 'complete';

    var summary = {
      experimentId: experiment.id,
      title: experiment.title,
      duration: _getEstimatedDuration(experiment),
      reactionEquation: _getReactionEquation(experiment.id),
      completedSteps: experiment.steps ? experiment.steps.length : 0,
      status: 'completed',
    };

    if (typeof callbacks.onComplete === 'function') {
      callbacks.onComplete(summary);
    }

    _cleanup();
  }

  function _getEstimatedDuration(experiment) {
    var stepCount = experiment.steps ? experiment.steps.length : 0;
    var obsCount = experiment.observations ? experiment.observations.length : 0;
    return stepCount * 1000 + obsCount * 500 + 'ms';
  }

  function _getReactionEquation(id) {
    var map = {
      titration: 'NaOH + HCl → NaCl + H₂O',
      'co2-nachweis': 'Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O',
      'kupfer-sulfat': 'CuSO₄ + 5H₂O → CuSO₄·5H₂O',
      wasserstoff: '2H₂ + O₂ → 2H₂O',
    };
    return map[id] || null;
  }

  function _cleanup() {
    _currentId = null;
    _stepIndex = 0;
    /* Keep _state so the caller can check it — gets reset on next run() */
  }

  /** Find a hazard class label in German for display */
  var HAZARD_LABELS = {
    caustic: 'Ätzend',
    flammable: 'Entzündbar',
    irritant: 'Reizend',
    asphyxiant: 'Atemgift',
    none: 'Keine',
  };

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  return {
    /* -- State machine ------------------------------------------------ */

    _state: 'idle',
    _timer: null,

    /** Run a reaction by experiment ID.
     *
     *  @param {string}   experimentId  — one of the `experiments[*].id` values
     *  @param {object}   callbacks
     *  @param {function} callbacks.onProgress(msg, type, effects)
     *  @param {function} callbacks.onComplete(result)
     *  @param {function} callbacks.onSafety(safetyItems)
     *  @param {function} callbacks.onError(msg)
     */
    run: function (experimentId, callbacks) {
      if (_state === 'running') {
        if (typeof callbacks.onError === 'function') {
          callbacks.onError('Es läuft bereits ein Experiment.');
        }
        return;
      }

      callbacks = callbacks || {};

      var experiment = _findExperiment(experimentId);
      if (!experiment) {
        if (typeof callbacks.onError === 'function') {
          callbacks.onError('Experiment "' + experimentId + '" nicht gefunden.');
        }
        return;
      }

      _state = 'running';
      _currentId = experimentId;

      /* Send safety info first */
      if (experiment.safety && experiment.safety.length > 0) {
        if (typeof callbacks.onSafety === 'function') {
          callbacks.onSafety(experiment.safety);
        }
      }

      /* If the experiment has an onRun hook, call it for custom logic */
      if (typeof experiment.onRun === 'function') {
        experiment.onRun(callbacks);
        return;
      }

      /* Freestyle = no predefined reaction; just show instructions */
      if (experimentId === 'freestyle') {
        _runInstructionSteps(experiment, callbacks);
        return;
      }

      /* Run the instruction steps (which will cascade into observations) */
      _runInstructionSteps(experiment, callbacks);
    },

    /** Cancel a running reaction */
    cancel: function () {
      if (_timer !== null) {
        clearTimeout(_timer);
        _timer = null;
      }
      _state = 'idle';
      _currentId = null;
      _stepIndex = 0;
    },

    /* -- Queries ------------------------------------------------------ */

    /** Get the current state of the engine */
    getState: function () {
      return _state;
    },

    /** Return the id of the currently running experiment (or null) */
    getCurrentExperimentId: function () {
      return _currentId;
    },

    /** Get safety info for a given experiment.
     *  @param {string} experimentId
     *  @returns {Array} safety badges or empty array
     */
    getSafetyInfo: function (experimentId) {
      var experiment = _findExperiment(experimentId);
      if (!experiment || !experiment.safety) {
        return [];
      }
      return experiment.safety;
    },

    /** Get chemicals for an experiment.
     *  @param {string} experimentId
     *  @returns {Array} of {name, formula, concentration, hazardClass}
     */
    getChemicals: function (experimentId) {
      var experiment = _findExperiment(experimentId);
      if (!experiment || !experiment.chemicals) {
        return [];
      }
      return experiment.chemicals;
    },

    /** Get the hazard label for a hazardClass key. */
    getHazardLabel: function (hazardClass) {
      return HAZARD_LABELS[hazardClass] || hazardClass || 'Unbekannt';
    },

    /** Check if two chemicals would react (simplified lookup).
     *  @param {string} chemical1 — formula string, e.g. "NaOH"
     *  @param {string} chemical2 — formula string, e.g. "HCl"
     *  @returns {boolean}
     */
    wouldReact: function (chemical1, chemical2) {
      if (!chemical1 || !chemical2) {
        return false;
      }

      /* Normalise: strip whitespace, treat " " as potential separator */
      var c1 = chemical1.trim();
      var c2 = chemical2.trim();

      for (var i = 0; i < REACTION_PAIRS.length; i++) {
        var pair = REACTION_PAIRS[i];
        if (pair.a === c1 && pair.b === c2) {
          return pair.reacts;
        }
      }
      return false;
    },

    /** Get visual effects for a given experiment at a given elapsed
     *  time (in seconds). Returns a plain hint object or {}.
     *  @param {string} experimentId
     *  @param {number} elapsedSec
     *  @returns {object}
     */
    getVisuals: function (experimentId, elapsedSec) {
      return _getVisuals(experimentId, elapsedSec);
    },

    /** Return a copy of the predefined reaction pairs table. */
    getReactionPairs: function () {
      /* Return a shallow copy so callers don't mutate the internal table */
      return REACTION_PAIRS.slice(0);
    },
  };
})();
