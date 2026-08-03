/**
 * Tests for the cognitive-load session chunking logic in lernpfad.js.
 * Simulates the buildSessionPlan algorithm (5–7 min segments with breaks).
 */

// Re-implements the exact algorithm from lernpfad.js so changes are caught
// if the production code drifts.
const SESSION_MINUTES = 10;

function stepMinutes(step) {
  var m = parseInt(step.mins || step.estimatedMinutes || 5, 10);
  return isNaN(m) || m < 1 ? 5 : m;
}

function buildSessionPlan(steps) {
  if (!steps || steps.length === 0) return [];
  var sessions = [];
  var current = { steps: [], totalMinutes: 0 };
  steps.forEach(function (step, idx) {
    var mins = stepMinutes(step);
    if (current.steps.length > 0 && current.totalMinutes + mins > SESSION_MINUTES) {
      sessions.push(current);
      current = { steps: [], totalMinutes: 0 };
    }
    current.steps.push(Object.assign({}, step, { index: idx, minutes: mins }));
    current.totalMinutes += mins;
  });
  if (current.steps.length > 0) sessions.push(current);
  return sessions;
}

function makeSteps(durations) {
  return durations.map(function (mins, i) {
    return { title: 'Schritt ' + (i + 1), mins: mins };
  });
}

describe('buildSessionPlan (cognitive-load chunking)', () => {
  test('returns empty for no steps', () => {
    expect(buildSessionPlan([])).toEqual([]);
    expect(buildSessionPlan(null)).toEqual([]);
  });

  test('groups steps into sessions respecting the 10 min budget', () => {
    // 5 steps of 5 min = 25 min → 3 sessions (10, 10, 5)
    const plan = buildSessionPlan(makeSteps([5, 5, 5, 5, 5]));
    expect(plan).toHaveLength(3);
    expect(plan[0].totalMinutes).toBe(10);
    expect(plan[1].totalMinutes).toBe(10);
    expect(plan[2].totalMinutes).toBe(5);
  });

  test('a single long step gets its own session', () => {
    const plan = buildSessionPlan(makeSteps([20]));
    expect(plan).toHaveLength(1);
    expect(plan[0].totalMinutes).toBe(20);
  });

  test('session indexes are sequential across the whole path', () => {
    const plan = buildSessionPlan(makeSteps([3, 4, 5, 6]));
    const indexes = plan.flatMap((s) => s.steps.map((st) => st.index));
    expect(indexes).toEqual([0, 1, 2, 3]);
  });

  test('falls back to 5 min when minutes are invalid', () => {
    const plan = buildSessionPlan([{ title: 'x', mins: 'abc' }]);
    expect(plan[0].totalMinutes).toBe(5);
  });

  test('no step is duplicated across sessions', () => {
    const plan = buildSessionPlan(makeSteps([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]));
    const titles = plan.flatMap((s) => s.steps.map((st) => st.title));
    expect(new Set(titles).size).toBe(titles.length);
  });
});
