#!/usr/bin/env node
/**
 * taskfleet-coordinator.mjs — TaskFleet Coordinator Service
 * 
 * This service coordinates parallel task execution across multiple workers
 * using Redis as a task queue. The coordinator:
 *   - Loads tasks from the configuration
 *   - Manages task dependencies
 *   - Distributes tasks to available workers
 *   - Tracks progress and results
 *   - Handles retries for failed tasks
 * 
 * Usage:
 *   # Run coordinator
 *   node scripts/taskfleet-coordinator.mjs
 *   
 *   # Run with custom config
 *   node scripts/taskfleet-coordinator.mjs --config scripts/taskfleet-config.mjs
 *   
 * Environment Variables:
 *   REDIS_HOST        Redis server host (default: localhost)
 *   REDIS_PORT        Redis server port (default: 6379)
 *   CONCURRENCY       Maximum parallel tasks (default: 8)
 *   NEO4J_URI         Neo4j server URI
 *   NEO4J_PASSWORD    Neo4j password
 * 
 * @module taskfleet-coordinator
 */

import { createClient } from 'redis';
import { DEFAULT_TASKS } from './taskfleet.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ── Configuration ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  concurrency: parseInt(process.env.CONCURRENCY || args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '8'),
  configPath: args.find(a => a.startsWith('--config='))?.split('=')[1] || 
              path.join(REPO_ROOT, 'scripts', 'taskfleet-config.mjs'),
  groups: args.find(a => a.startsWith('--groups='))?.split('=')[1]?.split(',') || null,
  tasks: args.find(a => a.startsWith('--tasks='))?.split('=')[1]?.split(',') || null,
  dryRun: args.includes('--dry-run'),
};

// Redis keys
const REDIS_KEYS = {
  TASK_QUEUE: 'taskfleet:queue',
  ACTIVE_TASKS: 'taskfleet:active',
  COMPLETED_TASKS: 'taskfleet:completed',
  FAILED_TASKS: 'taskfleet:failed',
  TASK_RESULT: (taskId) => `taskfleet:result:${taskId}`,
  TASK_STATUS: (taskId) => `taskfleet:status:${taskId}`,
  WORKER_HEARTBEAT: (workerId) => `taskfleet:worker:${workerId}:heartbeat`,
  WORKER_REGISTRY: 'taskfleet:workers',
  TASK_DEPENDENCIES: (taskId) => `taskfleet:deps:${taskId}`,
  TASK_READY: 'taskfleet:ready',
  COORDINATOR_HEARTBEAT: 'taskfleet:coordinator:heartbeat',
  STATS: 'taskfleet:stats',
};

// Task status constants
const TASK_STATUS = {
  PENDING: 'pending',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
};

// ── Redis Helper ─────────────────────────────────────────────────────────

class RedisHelper {
  constructor(host, port) {
    this.client = createClient({ url: `redis://${host}:${port}` });
    this.connected = false;
  }

  async connect() {
    await this.client.connect();
    this.connected = true;
    console.log(`✅ Redis connected: ${this.client.options.url}`);
  }

  async disconnect() {
    await this.client.quit();
    this.connected = false;
    console.log('✅ Redis disconnected');
  }

  // Queue management
  async enqueueTask(taskId, priority = 10) {
    await this.client.lPush(REDIS_KEYS.TASK_QUEUE, taskId);
    // Also store in priority queue (using sorted set)
    await this.client.zAdd(REDIS_KEYS.TASK_QUEUE + ':priority', { value: taskId, score: -priority });
  }

  async dequeueTask() {
    // Try to get from priority queue first
    const result = await this.client.zPopMin(REDIS_KEYS.TASK_QUEUE + ':priority');
    if (result && result[0]) {
      const taskId = result[0].value;
      // Remove from main queue as well
      await this.client.lRem(REDIS_KEYS.TASK_QUEUE, 0, taskId);
      return taskId;
    }
    return this.client.rPop(REDIS_KEYS.TASK_QUEUE);
  }

  async enqueueReadyTask(taskId) {
    await this.client.lPush(REDIS_KEYS.TASK_READY, taskId);
  }

  async dequeueReadyTask() {
    return this.client.rPop(REDIS_KEYS.TASK_READY);
  }

  // Task status
  async setTaskStatus(taskId, status, data = {}) {
    const key = REDIS_KEYS.TASK_STATUS(taskId);
    await this.client.hSet(key, {
      status,
      timestamp: Date.now(),
      ...data,
    });
    await this.client.expire(key, 3600 * 24); // Expire after 24 hours
  }

  async getTaskStatus(taskId) {
    const key = REDIS_KEYS.TASK_STATUS(taskId);
    return this.client.hGetAll(key);
  }

  // Worker management
  async registerWorker(workerId, workerName) {
    const key = REDIS_KEYS.WORKER_HEARTBEAT(workerId);
    await this.client.hSet(key, {
      workerId,
      workerName,
      lastHeartbeat: Date.now(),
      status: 'active',
    });
    await this.client.sAdd(REDIS_KEYS.WORKER_REGISTRY, workerId);
    await this.client.expire(key, 60); // Workers expire after 60s of inactivity
  }

  async getActiveWorkers() {
    return this.client.sMembers(REDIS_KEYS.WORKER_REGISTRY);
  }

  // Dependencies
  async setTaskDependencies(taskId, dependencies) {
    const key = REDIS_KEYS.TASK_DEPENDENCIES(taskId);
    if (dependencies && dependencies.length > 0) {
      await this.client.sAdd(key, dependencies);
    }
  }

  async getTaskDependencies(taskId) {
    const key = REDIS_KEYS.TASK_DEPENDENCIES(taskId);
    return this.client.sMembers(key);
  }

  // Results
  async setTaskResult(taskId, result) {
    const key = REDIS_KEYS.TASK_RESULT(taskId);
    await this.client.set(key, JSON.stringify(result));
    await this.client.expire(key, 3600 * 24); // Expire after 24 hours
  }

  async getTaskResult(taskId) {
    const key = REDIS_KEYS.TASK_RESULT(taskId);
    const result = await this.client.get(key);
    return result ? JSON.parse(result) : null;
  }

  // Counters
  async incrCounter(key) {
    await this.client.incr(key);
    await this.client.expire(key, 3600); // Expire counters after 1 hour
  }

  async getCounter(key) {
    return parseInt(await this.client.get(key) || '0');
  }

  // Stats
  async updateStats(stats) {
    await this.client.hSet(REDIS_KEYS.STATS, stats);
  }

  async getStats() {
    return this.client.hGetAll(REDIS_KEYS.STATS);
  }

  // Cleanup
  async clearAll() {
    const keys = await this.client.keys('taskfleet:*');
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

// ── Coordinator Class ───────────────────────────────────────────────────

class TaskFleetCoordinator {
  constructor(redis, tasks, options = {}) {
    this.redis = redis;
    this.tasks = tasks;
    this.options = {
      concurrency: options.concurrency || CONFIG.concurrency,
      dryRun: options.dryRun || CONFIG.dryRun,
      maxRetries: options.maxRetries || 3,
    };
    
    this.taskMap = new Map();
    this.completedCount = 0;
    this.failedCount = 0;
    this.startTime = null;
  }

  // Initialize tasks
  async initialize() {
    this.startTime = performance.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 TaskFleet Coordinator Starting`);
    console.log(`   Tasks: ${this.tasks.length}`);
    console.log(`   Concurrency: ${this.options.concurrency}`);
    console.log(`   Max Retries: ${this.options.maxRetries}`);
    console.log(`   Dry Run: ${this.options.dryRun}`);
    console.log(`   Redis: ${this.redis.client.options.url}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Build task map
    this.tasks.forEach(task => {
      this.taskMap.set(task.id, task);
    });
    
    // Clear previous state
    await this.redis.clearAll();
    
    // Initialize stats
    await this.redis.updateStats({
      totalTasks: this.tasks.length,
      startedAt: Date.now(),
      coordinator: process.pid,
    });
    
    // Set up task dependencies
    await this.setupDependencies();
    
    // Print task tree
    this.printTaskTree();
  }

  // Set up task dependencies in Redis
  async setupDependencies() {
    for (const task of this.tasks) {
      if (task.dependencies && task.dependencies.length > 0) {
        await this.redis.setTaskDependencies(task.id, task.dependencies);
        
        // Set each dependency as pending
        for (const depId of task.dependencies) {
          await this.redis.setTaskStatus(depId, TASK_STATUS.PENDING);
        }
      } else {
        // Task has no dependencies, mark as ready
        await this.redis.setTaskStatus(task.id, TASK_STATUS.READY);
        await this.redis.enqueueReadyTask(task.id);
      }
    }
  }

  // Print task tree
  printTaskTree() {
    console.log('\n📊 Task Tree:\n');
    
    const executed = new Set();
    let currentLevel = this.tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
    let level = 0;
    
    const printLevel = (tasks, level) => {
      const indent = '   '.repeat(level);
      console.log(`${indent}Level ${level}:`);
      tasks.forEach(task => {
        const deps = task.dependencies ? ` [deps: ${task.dependencies.join(', ')}]` : '';
        console.log(`${indent}  → ${task.id}${deps}`);
        executed.add(task.id);
      });
    };
    
    printLevel(currentLevel, level);
    
    // Print dependent tasks level by level
    let hasMore = true;
    while (hasMore) {
      level++;
      const nextLevel = this.tasks.filter(t => 
        !executed.has(t.id) &&
        (t.dependencies || []).every(dep => executed.has(dep))
      );
      
      if (nextLevel.length === 0) {
        hasMore = false;
      } else {
        printLevel(nextLevel, level);
      }
    }
  }

  // Check if task dependencies are met
  async checkDependencies(taskId) {
    const task = this.taskMap.get(taskId);
    if (!task) return false;
    
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    for (const depId of task.dependencies) {
      const status = await this.redis.getTaskStatus(depId);
      if (status.status !== TASK_STATUS.COMPLETED) {
        return false;
      }
    }
    
    return true;
  }

  // Mark tasks as ready when dependencies are completed
  async updateReadyTasks() {
    for (const task of this.tasks) {
      if (task.dependencies && task.dependencies.length > 0) {
        const status = await this.redis.getTaskStatus(task.id);
        
        // Only check if not already ready, running, or completed
        if (status.status === TASK_STATUS.PENDING || !status.status) {
          const depsMet = await this.checkDependencies(task.id);
          if (depsMet) {
            await this.redis.setTaskStatus(task.id, TASK_STATUS.READY);
            await this.redis.enqueueReadyTask(task.id);
            console.log(`   📦 Task ready: ${task.id}`);
          }
        }
      }
    }
  }

  // Monitor and dispatch tasks
  async run() {
    console.log('\n🎯 Coordinator Running. Press Ctrl+C to stop.\n');
    
    // Initial ready task update
    await this.updateReadyTasks();
    
    // Main loop
    let lastWorkerCheck = Date.now();
    let lastStatsUpdate = Date.now();
    
    while (true) {
      // Update ready tasks periodically
      if (Date.now() - lastWorkerCheck > 5000) {
        await this.updateReadyTasks();
        lastWorkerCheck = Date.now();
      }
      
      // Update stats
      if (Date.now() - lastStatsUpdate > 10000) {
        await this.updateStats();
        lastStatsUpdate = Date.now();
      }
      
      // Check if all tasks are completed
      const readyCount = await this.redis.client.lLen(REDIS_KEYS.TASK_READY);
      const activeCount = await this.redis.client.sCard(REDIS_KEYS.ACTIVE_TASKS);
      const completedCount = await this.redis.getCounter(REDIS_KEYS.COMPLETED_TASKS);
      const failedCount = await this.redis.getCounter(REDIS_KEYS.FAILED_TASKS);
      
      if (readyCount === 0 && activeCount === 0) {
        if (completedCount + failedCount >= this.tasks.length) {
          console.log('\n✅ All tasks completed!');
          await this.printSummary();
          break;
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Update statistics
  async updateStats() {
    const readyCount = await this.redis.client.lLen(REDIS_KEYS.TASK_READY);
    const activeCount = await this.redis.client.sCard(REDIS_KEYS.ACTIVE_TASKS);
    const completedCount = await this.redis.getCounter(REDIS_KEYS.COMPLETED_TASKS);
    const failedCount = await this.redis.getCounter(REDIS_KEYS.FAILED_TASKS);
    const workers = await this.redis.getActiveWorkers();
    
    const stats = {
      totalTasks: this.tasks.length,
      readyTasks: readyCount,
      activeTasks: activeCount,
      completedTasks: completedCount,
      failedTasks: failedCount,
      activeWorkers: workers.length,
      startedAt: Date.now(),
      lastUpdate: Date.now(),
    };
    
    await this.redis.updateStats(stats);
    
    // Print updated stats
    this.printStatus(stats);
  }

  // Print status
  printStatus(stats) {
    process.stdout.write(`\r`);
    process.stdout.write(`   📊 [${new Date().toLocaleTimeString()}] `);
    process.stdout.write(`Ready: ${stats.readyTasks} | `);
    process.stdout.write(`Running: ${stats.activeTasks} | `);
    process.stdout.write(`Completed: ${stats.completedTasks} | `);
    process.stdout.write(`Failed: ${stats.failedTasks} | `);
    process.stdout.write(`Workers: ${stats.activeWorkers}`);
  }

  // Print final summary
  async printSummary() {
    const endTime = performance.now();
    const duration = (endTime - this.startTime) / 1000;
    
    const completedCount = await this.redis.getCounter(REDIS_KEYS.COMPLETED_TASKS);
    const failedCount = await this.redis.getCounter(REDIS_KEYS.FAILED_TASKS);
    const workers = await this.redis.getActiveWorkers();
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 EXECUTION COMPLETE');
    console.log('='.repeat(60));
    console.log(`   Total Tasks: ${this.tasks.length}`);
    console.log(`   Completed:   ${completedCount}`);
    console.log(`   Failed:      ${failedCount}`);
    console.log(`   Workers:     ${workers.length}`);
    console.log(`   Duration:    ${duration.toFixed(2)}s`);
    console.log('='.repeat(60));
    
    if (failedCount > 0) {
      console.log('\n⚠️  Some tasks failed. Check the worker logs.');
    } else {
      console.log('\n✅ All tasks completed successfully!');
    }
    
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  // Load tasks
  try {
    const configModule = await import(path.toFileURL(CONFIG.configPath).href);
    const tasks = configModule.default || configModule.TASKS || DEFAULT_TASKS;
    
    // Filter tasks based on CLI arguments
    let filteredTasks = [...tasks];
    
    if (CONFIG.groups) {
      filteredTasks = filteredTasks.filter(task => 
        CONFIG.groups.includes(task.group)
      );
    }
    
    if (CONFIG.tasks) {
      filteredTasks = filteredTasks.filter(task => 
        CONFIG.tasks.includes(task.id)
      );
    }
    
    if (filteredTasks.length === 0) {
      console.error('Error: No tasks match the specified filters.');
      console.error(`Available groups: ${[...new Set(tasks.map(t => t.group))].join(', ')}`);
      console.error(`Available tasks: ${tasks.map(t => t.id).join(', ')}`);
      process.exit(1);
    }
    
    // Initialize Redis
    const redis = new RedisHelper(CONFIG.redis.host, CONFIG.redis.port);
    await redis.connect();
    
    // Create coordinator
    const coordinator = new TaskFleetCoordinator(redis, filteredTasks, {
      concurrency: CONFIG.concurrency,
      dryRun: CONFIG.dryRun,
    });
    
    // Initialize and run
    await coordinator.initialize();
    
    if (CONFIG.dryRun) {
      console.log('\n📋 DRY RUN — No tasks will be executed.');
      console.log('   Use --dry-run=false to actually run the tasks.');
      await redis.disconnect();
      return;
    }
    
    await coordinator.run();
    
    // Cleanup
    await redis.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Coordinator shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Coordinator shutting down...');
  process.exit(0);
});

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

export default TaskFleetCoordinator;
