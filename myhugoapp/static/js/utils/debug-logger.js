(function () {
  'use strict';

  var DEBUG_KEY = 'chemie_debug';
  var params = new window.URLSearchParams(location.search);
  var enabled = params.get('debug') === '1' || localStorage.getItem(DEBUG_KEY) === '1';

  window.__debug = {
    enabled: enabled,
    enable: function () {
      enabled = true;
      localStorage.setItem(DEBUG_KEY, '1');
    },
    disable: function () {
      enabled = false;
      localStorage.removeItem(DEBUG_KEY);
    },
    toggle: function () {
      if (enabled) {
        this.disable();
      } else {
        this.enable();
      }
      return enabled;
    },
    log: function () { if (enabled) console.log.apply(console, arguments); },
    warn: function () { if (enabled) console.warn.apply(console, arguments); },
    error: function () { if (enabled) console.error.apply(console, arguments); },
    info: function () { if (enabled) console.info.apply(console, arguments); },
    dir: function () { if (enabled) console.dir.apply(console, arguments); },
    table: function () { if (enabled) console.table.apply(console, arguments); },
    time: function () { if (enabled) console.time.apply(console, arguments); },
    timeEnd: function () { if (enabled) console.timeEnd.apply(console, arguments); },
    group: function () { if (enabled) console.group.apply(console, arguments); },
    groupEnd: function () { if (enabled) console.groupEnd.apply(console, arguments); },
    trace: function () { if (enabled) console.trace.apply(console, arguments); },
    assert: function () {
      if (enabled) console.assert.apply(console, arguments);
    },
    clear: function () { if (enabled) console.clear.apply(console, arguments); },
  };
})();
