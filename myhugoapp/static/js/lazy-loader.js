const LazyLoader = {
  loadedScripts: new Set(),
  loadingScripts: new Map(),

  loadScript(t, e) {
    if (this.loadingScripts.has(t)) return this.loadingScripts.get(t);
    if (this.loadedScripts.has(e)) return Promise.resolve();
    const r = new Promise((resolve, reject) => {
      const i = document.createElement('script');
      i.src = t;
      i.id = e;
      i.async = !0;
      i.onload = () => {
        this.loadedScripts.add(e);
        this.loadingScripts.delete(t);
        resolve();
      };
      i.onerror = () => {
        this.loadingScripts.delete(t);
        reject(new Error('Failed to load script: ' + t));
      };
      document.head.appendChild(i);
    });
    this.loadingScripts.set(t, r);
    return r;
  },

  loadCalculator(t) {
    const calculators = {
      stoichiometry: [
        '/js/calculators/calc-presets.js',
        '/js/calculators/calc-equation-parser.js',
        '/js/calculators/calc-element-lookup.js',
        '/js/calculators/calc-history.js',
        '/js/calculators/calc-molmol.js',
        '/js/calculators/calc-massmass.js',
        '/js/calculators/calc-limiting.js',
        '/js/calculators/calc-yield.js',
        '/js/calculators/calc-multistep.js',
        '/js/calculators/calc-gaslaw.js',
      ],
      werkzeuge: [
        '/js/calculators/calc-equation-parser.js',
        '/js/calculators/calc-element-lookup.js',
        '/js/calculators/calc-history.js',
      ],
      uebungen: [
        '/js/calculators/practice-quiz.js',
      ],
      tutorien: [
        '/js/calculators/tutorials.js',
      ],
    };

    var scripts = calculators[t];
    if (!scripts) return Promise.reject(new Error('Unknown calculator type: ' + t));

    return scripts.reduce(function(promise, script) {
      var scriptId = script.replace(/[\/\.]/g, '-');
      return promise.then(function() {
        return LazyLoader.loadScript(script, scriptId);
      });
    }, Promise.resolve());
  },

  preloadCritical() {
    if (document.querySelector('.stoichiometry-calculator-container')) {
      this.loadCalculator('stoichiometry');
    }
  },

  init() {
    var container = document.querySelector('.stoichiometry-calculator-container');
    if (container && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              LazyLoader.loadCalculator('stoichiometry');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );
      observer.observe(container);
    } else if (container) {
      this.preloadCritical();
    }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}
