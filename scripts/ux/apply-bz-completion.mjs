#!/usr/bin/env node
/**
 * apply-bz-completion.mjs — closes out bloom-zpd-adaptive-engine (BZ-5.1):
 *  1. Marks tasks 1.2 / 1.4 / 5.1 done in the change's tasks.md
 *     (5.1's delta→main spec sync itself is performed natively by
 *     `openspec archive`, which runs as a later TaskFleet task).
 *  2. Updates SPECS_INDEX.md notes for the two touched capabilities.
 *
 * Idempotent: re-running makes no further changes.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const CHANGE_DIR = path.join(ROOT, 'openspec/changes/bloom-zpd-adaptive-engine');
const ARCHIVE_DIR = path.join(
  ROOT,
  'openspec/changes/archive/2026-09-12-bloom-zpd-adaptive-engine'
);
const TASKS_MD = fs.existsSync(path.join(CHANGE_DIR, 'tasks.md'))
  ? path.join(CHANGE_DIR, 'tasks.md')
  : path.join(ARCHIVE_DIR, 'tasks.md');
const INDEX_MD = path.join(ROOT, 'openspec/SPECS_INDEX.md');

export function markTaskDone(md, marker) {
  // marker = unique prefix of the unchecked line, e.g. '- [ ] 1.2'
  const re = new RegExp(`- \\[ \\] ${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  if (re.test(md)) return md.replace(re, `- [x] ${marker}`);
  return md;
}

export function updateIndexNotes(md) {
  return md
    .replace(
      /(\| Lehrplan \+ Didaktik \(curricula\) [^\n]*?)( \| Sisyphus \| [^|]+\|)/,
      '$1 (ZPD: bloom index + objective state)$2'
    )
    .replace(
      /(\| Learning Paths & Gamification [^\n]*?)( \| Sisyphus \| [^|]+\|)/,
      '$1 (ZPD-aware next-objective requirements)$2'
    );
}

export function applyCompletion({ tasks = TASKS_MD, index = INDEX_MD } = {}) {
  let tasksMd = fs.readFileSync(tasks, 'utf8');
  const before = tasksMd;
  for (const marker of ['1.2', '1.4', '5.1']) {
    tasksMd = markTaskDone(tasksMd, marker);
  }
  if (tasksMd !== before) fs.writeFileSync(tasks, tasksMd);

  let indexMd = fs.readFileSync(index, 'utf8');
  const indexBefore = indexMd;
  indexMd = updateIndexNotes(indexMd);
  if (indexMd !== indexBefore) fs.writeFileSync(index, indexMd);

  return {
    tasksChanged: tasksMd !== before,
    indexChanged: indexMd !== indexBefore,
  };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-bz-completion.mjs');
if (isDirectRun) {
  const r = applyCompletion();
  console.log(
    `apply-bz-completion: tasks.md ${r.tasksChanged ? 'updated' : 'already done'}, SPECS_INDEX.md ${r.indexChanged ? 'updated' : 'unchanged'}`
  );
}
