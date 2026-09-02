#!/usr/bin/env node
/**
 * taskfleet.mjs — Parallel Task Runner for Knowledge Graph Extension
 * 
 * A lightweight task fleet system for parallel execution of KG operations.
 * Uses Node.js worker_threads for CPU-bound tasks and child_process for I/O-bound.
 * 
 * Usage:
 *   # Run all tasks in parallel
 *   node scripts/taskfleet.mjs --config scripts/taskfleet-config.mjs
 *   
 *   # Run specific task groups
 *   node scripts/taskfleet.mjs --groups entity-enrichment,content-linking
 *   
 *   # Dry run (show what would be executed)
 *   node scripts/taskfleet.mjs --dry-run
 *   
 *   # With custom concurrency
 *   node scripts/taskfleet.mjs --concurrency 4
 * 
 * Architecture:
 *   - Task Definition: { id, name, group, command, dependencies?, timeout?, retries? }
 *   - Dependency Graph: Tasks wait for their dependencies to complete
 *   - Result Tracking: Success/failure logging with timestamps
 *   - Progress Reporting: Real-time CLI updates
 * 
 * @module taskfleet
 */

import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// Polyfill for path.toFileURL (Node.js < 20)
if (!path.toFileURL) {
  path.toFileURL = function(pathStr) {
    return new URL('file://' + pathStr.replace(/\\/g, '/'));
  };
}

// ── CLI Argument Parser (supports --key=value and --key value) ────────────
function getArgValue(argName, fallback) {
  const withEq = args.find((a) => a.startsWith(`--${argName}=`));
  if (withEq) return withEq.split('=').slice(1).join('=');
  const idx = args.indexOf(`--${argName}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return fallback;
}

// ── CLI Arguments ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CLI_ARGS = {
  config: getArgValue('config', path.join(REPO_ROOT, 'scripts', 'taskfleet-config.mjs')),
  groups: getArgValue('groups', null)?.split(',') || null,
  tasks: getArgValue('tasks', null)?.split(',') || null,
  concurrency: parseInt(getArgValue('concurrency', '4')),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  force: args.includes('--force'),
  help: args.includes('--help') || args.includes('-h'),
};

// ── Default Task Configuration ───────────────────────────────────────────

// These are the default task groups for KG extension
const DEFAULT_TASKS = [
  // ===== GROUP: entity-enrichment =====
  {
    id: 'enrich-entity-descriptions',
    name: 'Anreichern von Entity-Beschreibungen',
    group: 'entity-enrichment',
    command: 'node scripts/enrich-entity-descriptions.mjs',
    description: 'Fügt Beschreibungen zu Entity-Knoten hinzu',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'enrich-isolated-entities',
    name: 'Isolierte Entities mit Kontext füllen',
    group: 'entity-enrichment',
    command: 'node scripts/enrich-isolated-entities.mjs',
    description: 'Finds and enriches entities with no connections',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'import-pubchem-batch',
    name: 'PubChem Daten Batch-Import',
    group: 'entity-enrichment',
    command: 'node scripts/import-pubchem-data.mjs --batch-size 100',
    description: 'Import chemical properties from PubChem',
    timeout: 1200000, // 20 minutes
    retries: 3,
    priority: 5,
    dependencies: ['enrich-entity-descriptions'],
  },
  
  // ===== GROUP: curriculum-linking =====
  {
    id: 'link-entities-to-curriculum',
    name: 'Entities mit Curricula verknüpfen',
    group: 'curriculum-linking',
    command: 'node scripts/link-entities-to-curriculum.mjs',
    description: 'LLM-basierte Verknüpfung von Entities mit Lehrplan-Inhalten',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 20,
    dependencies: ['enrich-entity-descriptions'],
  },
  {
    id: 'validate-curricula-links',
    name: 'Curricula-Verknüpfungen validieren',
    group: 'curriculum-linking',
    command: 'node scripts/validate-curricula.mjs',
    description: 'Prüft die Qualität der Lehrplan-Verknüpfungen',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 15,
    dependencies: ['link-entities-to-curriculum'],
  },
  
  // ===== GROUP: content-indexing =====
  {
    id: 'import-content-nodes',
    name: 'Hugo-Inhalte als Content-Knoten importieren',
    group: 'content-indexing',
    command: 'node scripts/curricula/import-content-nodes.mjs',
    description: 'Importiert alle Hugo Markdown-Inhalte in den KG',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'link-articles-to-entities',
    name: 'Artikel mit Entities verknüpfen',
    group: 'content-indexing',
    command: 'node scripts/link-articles-to-entities.mjs',
    description: 'Verknüpft Content-Knoten mit chemischen Entities',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 10,
    dependencies: ['import-content-nodes'],
  },
  {
    id: 'link-content',
    name: 'Content-Knoten untereinander verlinken',
    group: 'content-indexing',
    command: 'node scripts/curricula/link-content.mjs',
    description: 'Erstellt Verknüpfungen zwischen verwandten Inhalten',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 8,
    dependencies: ['link-articles-to-entities'],
  },
  
  // ===== GROUP: quality-assurance =====
  {
    id: 'kg-quality-audit',
    name: 'KG Qualitätsprüfung',
    group: 'quality-assurance',
    command: 'node scripts/kg-quality-audit.mjs',
    description: 'Comprehensive quality audit of the knowledge graph',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'cross-link-audit',
    name: 'Kreuzverweise prüfen',
    group: 'quality-assurance',
    command: 'node scripts/cross-link-audit.mjs',
    description: 'Prüft die Konsistenz von Verknüpfungen im KG',
    timeout: 600000, // 10 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'merge-duplicate-entities',
    name: 'Doppelte Entities zusammenführen',
    group: 'quality-assurance',
    command: 'node scripts/merge-duplicate-entities.mjs --dry-run=false',
    description: 'Findet und merged doppelte Entity-Knoten',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 1,
  },
  
  // ===== GROUP: didactic-enrichment =====
  {
    id: 'import-didaktik',
    name: 'Didaktische Richtlinien importieren',
    group: 'didactic-enrichment',
    command: 'node scripts/import-didaktik.mjs',
    description: 'Importiert didaktische Leitlinien und Standards',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 8,
  },
  {
    id: 'generate-learning-paths',
    name: 'Lernpfade generieren',
    group: 'didactic-enrichment',
    command: 'node scripts/generate-learning-paths.mjs',
    description: 'Automatische Generierung von Lernpfaden basierend auf Abhängigkeiten',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 5,
    dependencies: ['link-entities-to-curriculum', 'link-content'],
  },
];

// ── Task Fleet Engine ────────────────────────────────────────────────────

class TaskFleet {
  constructor(tasks = [], options = {}) {
    this.tasks = tasks;
    this.options = {
      concurrency: options.concurrency || CLI_ARGS.concurrency,
      dryRun: options.dryRun || CLI_ARGS.dryRun,
      verbose: options.verbose || CLI_ARGS.verbose,
      force: options.force || CLI_ARGS.force,
    };
    
    this.results = new Map(); // taskId -> { status, startTime, endTime, error, output }
    this.activeWorkers = 0;
    this.completed = 0;
    this.failed = 0;
    this.startTime = null;
  }

  // Filter tasks based on CLI arguments
  filterTasks() {
    let tasks = [...this.tasks];
    
    // Filter by groups
    if (CLI_ARGS.groups) {
      tasks = tasks.filter(task => 
        CLI_ARGS.groups.includes(task.group)
      );
    }
    
    // Filter by specific tasks
    if (CLI_ARGS.tasks) {
      tasks = tasks.filter(task => 
        CLI_ARGS.tasks.includes(task.id)
      );
    }
    
    return tasks;
  }

  // Build dependency graph
  buildDependencyGraph(tasks) {
    const graph = new Map();
    const dependenceCount = new Map(); // How many dependencies each task has
    
    // Initialize
    tasks.forEach(task => {
      graph.set(task.id, { task, dependencies: [], dependents: [] });
      dependenceCount.set(task.id, 0);
    });
    
    // Build edges
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          const depNode = graph.get(depId);
          const taskNode = graph.get(task.id);
          
          if (depNode && taskNode) {
            depNode.dependents.push(task.id);
            taskNode.dependencies.push(depId);
            dependenceCount.set(task.id, (dependenceCount.get(task.id) || 0) + 1);
          } else {
            console.warn(`[warn] Dependency not found: ${depId} (required by ${task.id})`);
          }
        });
      }
    });
    
    return { graph, dependenceCount };
  }

  // Sort tasks by priority (higher first)
  sortByPriority(tasks) {
    return [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  // Execute a single task
  async executeTask(task) {
    const taskId = task.id;
    const startTime = performance.now();
    
    this.results.set(taskId, {
      status: 'running',
      startTime,
      taskId,
      taskName: task.name,
    });
    
    this.activeWorkers++;
    
    if (this.options.dryRun) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.results.set(taskId, {
        ...this.results.get(taskId),
        status: 'success',
        endTime: performance.now(),
        output: `[DRY-RUN] Would execute: ${task.command}`,
      });
      return { success: true, output: `[DRY-RUN] ${task.command}` };
    }
    
    try {
      // Execute command with timeout
      const result = await this.executeCommand(task.command, task.timeout || 300000);
      
      const endTime = performance.now();
      this.results.set(taskId, {
        ...this.results.get(taskId),
        status: 'success',
        endTime,
        output: result,
        durationMs: endTime - startTime,
      });
      
      this.activeWorkers--;
      this.completed++;
      
      return { success: true, output: result };
    } catch (error) {
      const endTime = performance.now();
      this.results.set(taskId, {
        ...this.results.get(taskId),
        status: 'failed',
        endTime,
        error: error.message,
        durationMs: endTime - startTime,
      });
      
      this.activeWorkers--;
      this.failed++;
      
      return { success: false, error: error.message };
    }
  }

  // Execute command with timeout
  async executeCommand(command, timeout) {
    return new Promise((resolve, reject) => {
      const [cmd, ...cmdArgs] = command.split(/\s+/);
      
      const child = spawn(cmd, cmdArgs, {
        cwd: REPO_ROOT,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data.toString());
        }
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data.toString());
        }
      });
      
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Timeout after ${timeout}ms: ${command}`));
      }, timeout);
      
      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Exit code ${code}: ${stderr || stdout}`));
        }
      });
      
      child.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Spawn error: ${err.message}`));
      });
    });
  }

  // Check if task can be executed (all dependencies completed successfully)
  canExecute(taskId, dependenceCount, results) {
    const count = dependenceCount.get(taskId) || 0;
    if (count === 0) return true;
    
    // Check the dependencies in the dependency graph
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies) return true;
    
    return task.dependencies.every(depId => {
      const depResult = results.get(depId);
      return depResult && depResult.status === 'success';
    });
  }

  // Main execution loop
  async run() {
    const filteredTasks = this.filterTasks();
    const { dependenceCount } = this.buildDependencyGraph(filteredTasks);
    
    this.startTime = performance.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 TaskFleet — Knowledge Graph Extension`);
    console.log(`   Tasks: ${filteredTasks.length}`);
    console.log(`   Concurrency: ${this.options.concurrency}`);
    console.log(`   Dry Run: ${this.options.dryRun}`);
    console.log(`   Groups: ${CLI_ARGS.groups ? CLI_ARGS.groups.join(', ') : 'all'}`);
    console.log(`   Specific Tasks: ${CLI_ARGS.tasks ? CLI_ARGS.tasks.join(', ') : 'all'}`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (this.options.dryRun) {
      console.log('📋 DRY RUN — Tasks that would be executed:\n');
      this.printTaskTree(filteredTasks, dependenceCount);
      return this.printSummary();
    }
    
    this.printTaskTree(filteredTasks);
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting execution...\n');
    
    // Process tasks in order of dependencies and priority
    const taskQueue = [...filteredTasks];
    const inProgress = new Set();
    
    while (taskQueue.length > 0 || inProgress.size > 0) {
      // Find all ready tasks (dependencies met)
      const readyTasks = taskQueue.filter(task => 
        this.canExecute(task.id, dependenceCount, this.results) &&
        !inProgress.has(task.id) &&
        this.activeWorkers < this.options.concurrency
      );
      
      // Sort by priority
      readyTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      // Start new tasks
      for (const task of readyTasks) {
        if (this.activeWorkers >= this.options.concurrency) break;
        
        inProgress.add(task.id);
        taskQueue.splice(taskQueue.indexOf(task), 1);
        
        this.executeTask(task).then(() => {
          inProgress.delete(task.id);
        }).catch(() => {
          inProgress.delete(task.id);
        });
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait for all in-progress tasks to complete
    while (inProgress.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return this.printSummary();
  }

  // Print task tree with dependencies
  printTaskTree(tasks) {
    console.log('📊 Task Execution Plan:\n');
    
    // Set of task ids present in THIS run (for cross-group dep handling)
    const taskIdsInRun = new Set(tasks.map(t => t.id));
    
    // A task is "ready" when all of its dependencies THAT BELONG TO THIS RUN
    // are already executed. Dependencies in other groups are out of scope
    // (the actual runner treats them as already-satisfied) and must NOT be
    // flagged as circular.
    const isReady = (task, executed) =>
      (task.dependencies || [])
        .filter(dep => taskIdsInRun.has(dep))
        .every(dep => executed.has(dep));
    
    // Group tasks by execution order
    const executed = new Set();
    let currentLevel = tasks.filter(t => !(t.dependencies || []).some(dep => taskIdsInRun.has(dep)));
    let level = 0;
    
    console.log(`   Level 0 (No Dependencies):`);
    currentLevel.forEach(task => {
      console.log(`     ${this.formatTask(task)}`);
      executed.add(task.id);
    });
    
    // Print dependent tasks level by level
    let hasMore = true;
    while (hasMore) {
      level++;
      const nextLevel = tasks.filter(t => 
        !executed.has(t.id) &&
        isReady(t, executed)
      );
      
      if (nextLevel.length === 0) {
        hasMore = false;
      } else {
        console.log(`\n   Level ${level} (After Dependencies):`);
        nextLevel.forEach(task => {
          console.log(`     ${this.formatTask(task)}`);
          executed.add(task.id);
        });
      }
    }
    
    // Check for genuine circular dependencies (deps that are in this run
    // but can never be satisfied)
    if (executed.size < tasks.length) {
      const remaining = tasks.filter(t => !executed.has(t.id));
      console.log(`\n   ⚠️  Circular Dependencies Detected (within this run):`);
      remaining.forEach(task => {
        console.log(`     ❌ ${task.id} (${task.name})`);
      });
    }
  }

  formatTask(task) {
    const deps = task.dependencies || [];
    const depStr = deps.length > 0 ? ` [deps: ${deps.join(', ')}]` : '';
    const priorityStr = task.priority ? ` (P:${task.priority})` : '';
    const groupStr = task.group ? `[${task.group}]` : '';
    return `→ ${task.id.padEnd(25)} ${groupStr} ${task.name}${priorityStr}${depStr}`;
  }

  // Print execution summary
  printSummary() {
    const endTime = performance.now();
    const totalDuration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    const resultsArray = Array.from(this.results.values());
    
    // Sort by start time
    resultsArray.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    
    resultsArray.forEach(result => {
      const statusIcon = {
        success: '✅',
        failed: '❌',
        running: '🔄',
      }[result.status] || '⚪';
      
      const duration = result.durationMs ? ` (${(result.durationMs / 1000).toFixed(1)}s)` : '';
      const error = result.error ? ` — ERROR: ${result.error}` : '';
      
      console.log(`${statusIcon} ${result.taskId.padEnd(25)} ${result.taskName}${duration}${error}`);
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total Tasks: ${this.results.size}`);
    console.log(`Completed:   ${this.completed}`);
    console.log(`Failed:      ${this.failed}`);
    console.log(`Duration:    ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
    
    if (this.failed > 0) {
      console.log('\n⚠️  Some tasks failed. Check the logs above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tasks completed successfully!');
    }
  }
}

// ── Load Configuration ───────────────────────────────────────────────────

async function loadConfig(configPath) {
  try {
    const configModule = await import(path.toFileURL(path.resolve(configPath)).href);
    return configModule.default || configModule;
  } catch (error) {
    // If config file doesn't exist, use default tasks
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log(`[info] Config file not found: ${configPath}, using default tasks`);
      return { tasks: DEFAULT_TASKS };
    }
    throw error;
  }
}

// ── Worker Thread Entry Point ────────────────────────────────────────────

if (!isMainThread) {
  // This is a worker thread
  (async () => {
    try {
      const { task, taskId } = workerData;
      const fleet = new TaskFleet([task]);
      await fleet.executeTask(task);
      parentPort.postMessage({ success: true, taskId });
    } catch (error) {
      parentPort.postMessage({ success: false, taskId: workerData.taskId, error: error.message });
    }
  })();
}

// ── Main Entry Point ─────────────────────────────────────────────────────

async function main() {
  if (CLI_ARGS.help) {
    printHelp();
    process.exit(0);
  }

  // Load configuration
  // loadConfig returns either the TASKS array (default export) or { tasks: [...] }
  const config = await loadConfig(CLI_ARGS.config);
  const tasks = Array.isArray(config) ? config : config.tasks || DEFAULT_TASKS;
  
  if (tasks.length === 0) {
    console.error('Error: No tasks found in configuration.');
    console.error('Check that ' + CLI_ARGS.config + ' exports a non-empty tasks array.');
    process.exit(1);
  }
  
  // Create task fleet
  const fleet = new TaskFleet(tasks, {
    concurrency: CLI_ARGS.concurrency,
    dryRun: CLI_ARGS.dryRun,
    verbose: CLI_ARGS.verbose,
  });
  
  // Run
  await fleet.run();
}

function printHelp() {
  console.log(`
TaskFleet — Parallel Task Runner for Knowledge Graph Extension

Usage:
  node scripts/taskfleet.mjs [options]

Options:
  --config=<path>       Path to task configuration file (default: scripts/taskfleet-config.mjs)
  --groups=<groups>     Comma-separated list of task groups to run
  --tasks=<tasks>       Comma-separated list of specific task IDs to run
  --concurrency=<n>    Number of parallel tasks (default: 4)
  --dry-run             Show what would be executed without running
  --verbose             Show detailed output from tasks
  --force               Force re-execution of tasks
  --help, -h            Show this help message

Available Task Groups:
  ${[...new Set(DEFAULT_TASKS.map(t => t.group))].map(g => `  - ${g}`).join('\n')}

Available Tasks:
  ${DEFAULT_TASKS.map(t => `  - ${t.id.padEnd(25)} [${t.group}] ${t.name}`).join('\n')}

Examples:
  # Run all tasks in parallel
  node scripts/taskfleet.mjs

  # Run only entity enrichment tasks
  node scripts/taskfleet.mjs --groups entity-enrichment

  # Run specific tasks
  node scripts/taskfleet.mjs --tasks enrich-entity-descriptions,link-entities-to-curriculum

  # Dry run to see execution plan
  node scripts/taskfleet.mjs --dry-run

  # With higher concurrency
  node scripts/taskfleet.mjs --concurrency 8
`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

export default TaskFleet;
export { DEFAULT_TASKS, TaskFleet };
