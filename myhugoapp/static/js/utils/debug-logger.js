var DEBUG_KEY = 'chemie_debug';

function createDebugLogger() {
  var enabled = false;

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    var params = new window.URLSearchParams(location.search);
    enabled = params.get('debug') === '1' || localStorage.getItem(DEBUG_KEY) === '1';
  }

  return {
    isEnabled: function () { return enabled; },
    enable: function () {
      enabled = true;
      if (typeof localStorage !== 'undefined') localStorage.setItem(DEBUG_KEY, '1');
    },
    disable: function () {
      enabled = false;
      if (typeof localStorage !== 'undefined') localStorage.removeItem(DEBUG_KEY);
    },
    toggle: function () {
      if (enabled) { this.disable(); } else { this.enable(); }
      return enabled;
    },
    log: function () { if (enabled && console.log) console.log.apply(console, arguments); },
    warn: function () { if (enabled && console.warn) console.warn.apply(console, arguments); },
    error: function () { if (enabled && console.error) console.error.apply(console, arguments); },
    info: function () { if (enabled && console.info) console.info.apply(console, arguments); },
    dir: function () { if (enabled && console.dir) console.dir.apply(console, arguments); },
    table: function () { if (enabled && console.table) console.table.apply(console, arguments); },
    time: function () { if (enabled && console.time) console.time.apply(console, arguments); },
    timeEnd: function () { if (enabled && console.timeEnd) console.timeEnd.apply(console, arguments); },
    group: function () { if (enabled && console.group) console.group.apply(console, arguments); },
    groupEnd: function () { if (enabled && console.groupEnd) console.groupEnd.apply(console, arguments); },
    trace: function () { if (enabled && console.trace) console.trace.apply(console, arguments); },
    assert: function () { if (enabled && console.assert) console.assert.apply(console, arguments); },
    clear: function () { if (enabled && console.clear) console.clear.apply(console, arguments); },
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDebugLogger };
}

(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  window.__debug = createDebugLogger();
})();
