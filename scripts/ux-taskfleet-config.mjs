/**
 * ux-taskfleet-config.mjs — TaskFleet configuration for UX improvements
 *
 * This config defines parallel UX enhancement tasks for chemie-lernen.org.
 * Each task is an independent improvement that can run in parallel.
 *
 * Usage:
 *   node scripts/taskfleet.mjs --config scripts/ux-taskfleet-config.mjs --dry-run
 *   node scripts/taskfleet.mjs --config scripts/ux-taskfleet-config.mjs --concurrency 4
 *   node scripts/taskfleet.mjs --config scripts/ux-taskfleet-config.mjs --groups loading-states
 *
 * Groups:
 *   loading-states    — Skeleton shimmer, loading indicators
 *   error-handling    — Retry buttons, error states, toast notifications
 *   accessibility     — ARIA live regions, focus consistency, touch targets
 *   search-ux         — Search keyboard navigation, result display
 *   quiz-ux           — Quiz widget loading state
 *
 * @module ux-taskfleet-config
 */

/** @type {Array<import('./taskfleet.mjs').Task>} */
const TASKS = [
  // =========================================================================
  // GROUP: loading-states
  // =========================================================================
  {
    id: 'ux-skeleton-shimmer',
    name: 'Skeleton-Shimmer-Animation hinzufügen',
    group: 'loading-states',
    command:
      'node scripts/ux/apply-skeleton-shimmer.mjs',
    description:
      'Fügt eine Shimmer-Animation zu allen Skeleton-Loadern hinzu (curricula, entity-index, modulhandbuch)',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'ux-quiz-loading',
    name: 'Quiz-Widget Loading-State verbessern',
    group: 'loading-states',
    command: 'node scripts/ux/apply-quiz-loading.mjs',
    description:
      'Verbessert den Loading-State des Quiz-Widgets mit Skeleton-Placeholder statt Spinner-Text',
    timeout: 60000,
    retries: 1,
    priority: 15,
  },

  // =========================================================================
  // GROUP: error-handling
  // =========================================================================
  {
    id: 'ux-retry-buttons',
    name: 'Retry-Buttons für Fehlerzustände',
    group: 'error-handling',
    command: 'node scripts/ux/apply-retry-buttons.mjs',
    description:
      'Fügt einheitliche Retry-Buttons zu allen API-Fehlerzuständen hinzu (curricula, modulhandbuch, entity-index)',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'ux-toast-system',
    name: 'Toast-Notification-System',
    group: 'error-handling',
    command: 'node scripts/ux/apply-toast-system.mjs',
    description:
      'Erstellt ein allgemeines Toast-System für Erfolg-/Fehler-/Info-Meldungen (Ergänzung zum Badge-Toast)',
    timeout: 60000,
    retries: 1,
    priority: 15,
  },

  // =========================================================================
  // GROUP: accessibility
  // =========================================================================
  {
    id: 'ux-aria-live',
    name: 'ARIA-Live-Regions für dynamische Inhalte',
    group: 'accessibility',
    command: 'node scripts/ux/apply-aria-live.mjs',
    description:
      'Fügt aria-live="polite" zu dynamischen Content-Containern hinzu (curricula, entity-index, modulhandbuch, search-results)',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'ux-touch-targets',
    name: 'Touch-Targets für Mobile',
    group: 'accessibility',
    command: 'node scripts/ux/apply-touch-targets.mjs',
    description:
      'Stellt sicher, dass alle interaktiven Elemente mindestens 44px Touch-Target haben (WCAG 2.5.5)',
    timeout: 60000,
    retries: 1,
    priority: 15,
  },
  {
    id: 'ux-focus-consistency',
    name: 'Fokus-Konsistenz',
    group: 'accessibility',
    command: 'node scripts/ux/apply-focus-consistency.mjs',
    description:
      'Einheitliche Focus-Rings für alle interaktiven Elemente (Tastaturnavigation)',
    timeout: 60000,
    retries: 1,
    priority: 15,
  },

  // =========================================================================
  // GROUP: search-ux
  // =========================================================================
  {
    id: 'ux-search-keyboard',
    name: 'Tastaturnavigation für Suche',
    group: 'search-ux',
    command: 'node scripts/ux/apply-search-keyboard.mjs',
    description:
      'Pfeiltasten-Navigation in Suchergebnissen, Enter zum Auswählen, Escape zum Schließen',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },

  // =========================================================================
  // GROUP: quiz-ux (depends on loading-states)
  // =========================================================================
  // (quiz-loading is in loading-states group above)
];

// =============================================================================
// PREDEFINED TASK SETS
// =============================================================================

const ALL_UX_IMPROVEMENTS = TASKS.map((t) => t.id);

const LOADING_STATES = ['ux-skeleton-shimmer', 'ux-quiz-loading'];

const ERROR_HANDLING = ['ux-retry-buttons', 'ux-toast-system'];

const ACCESSIBILITY = ['ux-aria-live', 'ux-touch-targets', 'ux-focus-consistency'];

const SEARCH_UX = ['ux-search-keyboard'];

export default TASKS;
export {
  TASKS,
  ALL_UX_IMPROVEMENTS,
  LOADING_STATES,
  ERROR_HANDLING,
  ACCESSIBILITY,
  SEARCH_UX,
};
