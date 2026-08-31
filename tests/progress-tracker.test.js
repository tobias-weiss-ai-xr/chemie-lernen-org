/**
 * Unit Tests für utils/progress-tracker.js (IndexedDB-Persistenz).
 *
 * jsdom liefert KEIN IndexedDB — deshalb ein kompakter In-Memory-Shim
 * (open/onupgradeneeded, transaction/objectStore, get/put/getAll/clear,
 * openCursor inkl. 'prev'-Richtung). Damit ist der komplette
 * CRUD-/Stats-/Streak-/Achievements-Fluss testbar.
 */

// ── Minimaler IndexedDB-Shim ─────────────────────────────────────────
class FakeRequest {
  constructor() {
    this.onsuccess = null;
    this.onerror = null;
    this.result = undefined;
    this.error = undefined;
  }
  _succeed(result) {
    this.result = result;
    if (this.onsuccess) this.onsuccess({ target: this });
  }
}

class FakeCursor {
  constructor(values, request) {
    this.values = values;
    this.index = 0;
    this.request = request;
    this.value = null;
  }
  continue() {
    this._advance();
  }
  _advance() {
    if (this.index < this.values.length) {
      this.value = this.values[this.index++];
      this.request._succeed(this);
    } else {
      this.request._succeed(null);
    }
  }
}

class FakeObjectStore {
  constructor(map, keyPath) {
    this.map = map; // Map: key → value
    this.keyPath = keyPath;
  }
  _sorted(direction) {
    const entries = [...this.map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (direction === 'prev') entries.reverse();
    return entries.map((e) => e[1]);
  }
  get(key) {
    const req = new FakeRequest();
    queueMicrotask(() => req._succeed(this.map.has(key) ? this.map.get(key) : undefined));
    return req;
  }
  put(value) {
    const req = new FakeRequest();
    queueMicrotask(() => {
      this.map.set(value[this.keyPath], value);
      req._succeed(value);
    });
    return req;
  }
  getAll() {
    const req = new FakeRequest();
    queueMicrotask(() => req._succeed(this._sorted()));
    return req;
  }
  clear() {
    const req = new FakeRequest();
    queueMicrotask(() => {
      this.map.clear();
      req._succeed(undefined);
    });
    return req;
  }
  openCursor(_range, direction) {
    const req = new FakeRequest();
    queueMicrotask(() => {
      new FakeCursor(this._sorted(direction), req)._advance();
    });
    return req;
  }
}

class FakeTransaction {
  constructor(stores) {
    this.stores = stores;
    this.oncomplete = null;
    this.onerror = null;
    this.error = null;
    // oncomplete als MAKRO-Task: der Aufrufer weist tx.oncomplete erst
    // nach dem transaction()-Aufruf zu — ein queueMicrotask im Konstruktor
    // würde vorher feuern und der Promise löste nie auf.
    setTimeout(() => {
      if (this.oncomplete) this.oncomplete();
    }, 0);
  }
  objectStore(name) {
    return this.stores[name];
  }
}

class FakeDB {
  constructor() {
    this.objectStoreNames = { contains: () => true };
    this.stores = {
      exercises: new Map(),
      achievements: new Map(),
      stats: new Map(),
    };
    this._storeObjs = {
      exercises: new FakeObjectStore(this.stores.exercises, 'id'),
      achievements: new FakeObjectStore(this.stores.achievements, 'id'),
      stats: new FakeObjectStore(this.stores.stats, 'date'),
    };
  }
  transaction(_names, _mode) {
    return new FakeTransaction(this._storeObjs);
  }
  close() {}
}

const fakeIndexedDB = {
  open(name, version) {
    const req = new FakeRequest();
    const db = new FakeDB();
    queueMicrotask(() => {
      if (req.onupgradeneeded) req.onupgradeneeded({ target: { result: db } });
      req._succeed(db);
    });
    return req;
  },
};

// ── Module unter Test ────────────────────────────────────────────────
global.indexedDB = fakeIndexedDB;
const { _ProgressTracker: Tracker } = require('../myhugoapp/static/js/utils/progress-tracker.js');

function freshTracker() {
  const t = Object.create(Tracker);
  t.db = null;
  return t;
}

beforeEach(() => {
  global.indexedDB = fakeIndexedDB; // jeder Fall bekommt frische Maps über openDB
});

describe('openDB — Verbindung & Upgrade', () => {
  test('öffnet und cached die Verbindung', async () => {
    const t = freshTracker();
    const db1 = await t.openDB();
    const db2 = await t.openDB();
    expect(db1).toBe(db2);
  });
});

describe('saveExerciseProgress / getExerciseProgress — CRUD', () => {
  test('speichert unter key "module:exerciseId" und liest zurück', async () => {
    const t = freshTracker();
    const rec = await t.saveExerciseProgress('ph', 'ex1', { correct: 3, total: 5 });
    expect(rec.module).toBe('ph');
    expect(rec.exerciseId).toBe('ex1');
    expect(rec.correct).toBe(3);
    expect(rec.lastAttempt).toBeTruthy();

    const loaded = await t.getExerciseProgress('ph', 'ex1');
    expect(loaded.correct).toBe(3);
    expect(loaded.total).toBe(5);
  });

  test('unbekannter Eintrag → null', async () => {
    const t = freshTracker();
    expect(await t.getExerciseProgress('ph', 'gibtsnicht')).toBeNull();
  });

  test('Überschreiben aktualisiert denselben Eintrag', async () => {
    const t = freshTracker();
    await t.saveExerciseProgress('ph', 'ex1', { correct: 1, total: 2 });
    await t.saveExerciseProgress('ph', 'ex1', { correct: 2, total: 2 });
    const loaded = await t.getExerciseProgress('ph', 'ex1');
    expect(loaded.correct).toBe(2);
    expect((await t.getAllProgress()).length).toBe(1);
  });
});

describe('getModuleProgress / getAllProgress / getModuleStats', () => {
  test('filtert nach Modul; Stats aggregieren total/correct/completed', async () => {
    const t = freshTracker();
    await t.saveExerciseProgress('ph', 'a', { correct: 2, total: 4 });
    await t.saveExerciseProgress('ph', 'b', { correct: 3, total: 4, completed: true });
    await t.saveExerciseProgress('org', 'c', { correct: 4, total: 4, completed: true });

    const ph = await t.getModuleProgress('ph');
    expect(ph).toHaveLength(2);
    expect((await t.getAllProgress()).length).toBe(3);

    const stats = await t.getModuleStats();
    expect(stats.ph).toEqual({ total: 8, correct: 5, completed: 1 });
    expect(stats.org).toEqual({ total: 4, correct: 4, completed: 1 });
  });
});

describe('updateDailyStats — Tageszähler & Streak', () => {
  test('erster Tag: count 1, streak 1', async () => {
    const t = freshTracker();
    const s = await t.updateDailyStats();
    expect(s.count).toBe(1);
    expect(s.streak).toBe(1);
    expect(s.date).toBe(new Date().toISOString().split('T')[0]);
  });

  test('zweiter Aufruf am selben Tag: count 2, streak bleibt 1', async () => {
    const t = freshTracker();
    await t.updateDailyStats();
    const s = await t.updateDailyStats();
    expect(s.count).toBe(2);
    expect(s.streak).toBe(1);
  });

  test('Gestern aktiv → Streak steigt auf 2', async () => {
    const t = freshTracker();
    // Gestern-Eintrag direkt in den Stats-Store legen:
    const db = await t.openDB();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = y.toISOString().split('T')[0];
    db._storeObjs.stats.map.set(yKey, { date: yKey, count: 1, streak: 1 });

    const s = await t.updateDailyStats();
    expect(s.streak).toBe(2);
  });
});

describe('Achievements', () => {
  test('freischalten, doppelt schalten ändert nichts, auflisten', async () => {
    const t = freshTracker();
    await t.unlockAchievement('a1', 'Erster Rechner', 'Erste Berechnung', '🧪');
    await t.unlockAchievement('a1', 'Erster Rechner', 'Erste Berechnung', '🧪');
    await t.unlockAchievement('a2', 'Zweiter', 'Noch eine', '⚗️');

    const list = await t.getAchievements();
    expect(list).toHaveLength(2);
    expect(list.find((a) => a.id === 'a1').name).toBe('Erster Rechner');
  });
});

describe('resetProgress — alles weg', () => {
  test('leert Übungen, Erfolge und Statistik', async () => {
    const t = freshTracker();
    await t.saveExerciseProgress('ph', 'a', { correct: 1, total: 1 });
    await t.unlockAchievement('a1', 'x', 'y', 'z');
    await t.updateDailyStats();
    await t.resetProgress();

    expect(await t.getAllProgress()).toEqual([]);
    expect(await t.getAchievements()).toEqual([]);
    const s = await t.updateDailyStats();
    expect(s.count).toBe(1); // frischer Start
  });
});

describe('getStreak — aufeinanderfolgende Tage', () => {
  test('heute aktiv → liefert den aktuellen Streak', async () => {
    const t = freshTracker();
    await t.updateDailyStats();
    await t.updateDailyStats();
    const streak = await t.getStreak();
    expect(streak).toBe(1);
  });

  test('gestern aktiv, heute nicht → Streak vom gestrigen Tag', async () => {
    const t = freshTracker();
    const db = await t.openDB();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = y.toISOString().split('T')[0];
    db._storeObjs.stats.map.set(yKey, { date: yKey, count: 5, streak: 4 });
    const streak = await t.getStreak();
    expect(streak).toBe(4);
  });

  test('letzter Eintrag ist 10 Tage alt → Streak 0 (abgebrochen)', async () => {
    const t = freshTracker();
    const db = await t.openDB();
    const old = new Date();
    old.setDate(old.getDate() - 10);
    const oldKey = old.toISOString().split('T')[0];
    db._storeObjs.stats.map.set(oldKey, { date: oldKey, count: 3, streak: 7 });
    const streak = await t.getStreak();
    expect(streak).toBe(0);
  });

  test('keine Statistik → Streak 0', async () => {
    const t = freshTracker();
    const streak = await t.getStreak();
    expect(streak).toBe(0);
  });
});
