#!/usr/bin/env node
/**
 * taskfleet-worker.mjs — TaskFleet Worker Service
 * 
 * This service executes tasks assigned by the coordinator.
 * Multiple workers can run in parallel to process tasks from the queue.
 * 
 * Usage:
 *   # Run a worker
 *   node scripts/taskfleet-worker.mjs --worker-id 1 --worker-name worker-1
 *   
 *   # Run with custom config
 *   node scripts/taskfleet-worker.mjs --config scripts/taskfleet-config.mjs
 *   
 * Environment Variables:
 *   REDIS_HOST        Redis server host (default: localhost)
 *   REDIS_PORT        Redis server port (default: 6379)
 *   WORKER_ID         Unique worker ID
 *   WORKER_NAME       Human-readable worker name
 *   NEO4J_URI         Neo4j server URI
 *   NEO4J_PASSWORD    Neo4j password
 *   TASK_TIMEOUT      Task execution timeout in ms (default: 300000)
 * 
 * @module taskfleet-worker
 */

import { createClient } from 'redis';
import { DEFAULT_TASKS } from './taskfleet.mjs';
import { spawn } from 'node:child_process';
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
  worker: {
    id: process.env.WORKER_ID || args.find(a => a.startsWith('--worker-id='))?.split('=')[1] || '1',
    name: process.env.WORKER_NAME || args.find(a => a.startsWith('--worker-name='))?.split('=')[1] || 'worker-' + (process.env.WORKER_ID || '1'),
  },
  configPath: args.find(a => a.startsWith('--config='))?.split('=')[1] || 
              path.join(REPO_ROOT, 'scripts', 'taskfleet-config.mjs'),
  taskTimeout: parseInt(process.env.TASK_TIMEOUT || '300000'), // 5 minutes default
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'), // 30 seconds
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
};

// Redis keys (must match coordinator)
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
  }

  async disconnect() {
    await this.client.quit();
    this.connected = false;
  }

  async dequeueReadyTask() {
    return this.client.rPop(REDIS_KEYS.TASK_READY);
  }

  async setTaskStatus(taskId, status, data = {}) {
    const key = REDIS_KEYS.TASK_STATUS(taskId);
    await this.client.hSet(key, {
      status,
      timestamp: Date.now(),
      workerId: CONFIG.worker.id,
      workerName: CONFIG.worker.name,
      ...data,
    });
    await this.client.expire(key, 3600 * 24);
  }

  async getTaskStatus(taskId) {
    const key = REDIS_KEYS.TASK_STATUS(taskId);
    return this.client.hGetAll(key);
  }

  async getTaskCommand() {
    // This would ideally be stored in Redis, but for now we load from config
    return null;
  }

  async registerWorker() {
    const key = REDIS_KEYS.WORKER_HEARTBEAT(CONFIG.worker.id);
    await this.client.hSet(key, {
      workerId: CONFIG.worker.id,
      workerName: CONFIG.worker.name,
      lastHeartbeat: Date.now(),
      status: 'active',
      pid: process.pid,
      startedAt: Date.now(),
    });
    await this.client.sAdd(REDIS_KEYS.WORKER_REGISTRY, CONFIG.worker.id);
    await this.client.expire(key, 60); // Expire after 60s
  }

  async updateHeartbeat() {
    const key = REDIS_KEYS.WORKER_HEARTBEAT(CONFIG.worker.id);
    await this.client.hSet(key, {
      lastHeartbeat: Date.now(),
      status: 'active',
    });
    await this.client.expire(key, 60);
  }

  async incrCounter(key) {
    await this.client.incr(key);
    await this.client.expire(key, 3600);
  }

  async setTaskResult(taskId, result) {
    const key = REDIS_KEYS.TASK_RESULT(taskId);
    await this.client.set(key, JSON.stringify(result));
    await this.client.expire(key, 3600 * 24);
  }

  async getTaskDependencies(taskId) {
    const key = REDIS_KEYS.TASK_DEPENDENCIES(taskId);
    return this.client.sMembers(key);
  }
}

// ── Worker Class ─────────────────────────────────────────────────────────

class TaskFleetWorker {
  constructor(redis, tasks, options = {}) {
    this.redis = redis;
    this.tasks = tasks;
    this.options = {
      taskTimeout: options.taskTimeout || CONFIG.taskTimeout,
      maxRetries: options.maxRetries || CONFIG.maxRetries,
      heartbeatInterval: options.heartbeatInterval || CONFIG.heartbeatInterval,
    };
    
    this.taskMap = new Map();
    this.running = true;
    this.currentTask = null;
    this.startTime = null;
    this.tasksCompleted = 0;
    this.tasksFailed = 0;
  }

  // Initialize worker
  async initialize() {
    this.startTime = performance.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`👷 TaskFleet Worker Starting`);
    console.log(`   Worker ID: ${CONFIG.worker.id}`);
    console.log(`   Worker Name: ${CONFIG.worker.name}`);
    console.log(`   Task Timeout: ${this.options.taskTimeout}ms`);
    console.log(`   Max Retries: ${this.options.maxRetries}`);
    console.log(`   Redis: ${this.redis.client.options.url}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Build task map
    this.tasks.forEach(task => {
      this.taskMap.set(task.id, task);
    });
    
    // Register worker
    await this.redis.registerWorker();
    
    // Start heartbeat
    this.startHeartbeat();
    
    console.log(`✅ Worker ${CONFIG.worker.name} registered`);
  }

  // Start heartbeat timer
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.redis.updateHeartbeat();
      } catch (error) {
        console.error(`[heartbeat] Error: ${error.message}`);
      }
    }, this.options.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  // Get task command from configuration
  getTaskCommand(taskId) {
    const task = this.taskMap.get(taskId);
    if (task) {
      return task.command;
    }
    return null;
  }

  // Execute a task
  async executeTask(taskId) {
    const task = this.taskMap.get(taskId);
    if (!task) {
      console.error(`[execute] Task not found: ${taskId}`);
      return { success: false, error: 'Task not found' };
    }
    
    this.currentTask = taskId;
    const startTime = performance.now();
    
    console.log(`\n📦 Executing task: ${taskId}`);
    console.log(`   Command: ${task.command}`);
    console.log(`   Timeout: ${this.options.taskTimeout}ms`);
    
    // Update status to running
    await this.redis.setTaskStatus(taskId, TASK_STATUS.RUNNING, {
      startedAt: Date.now(),
    });
    
    try {
      // Execute the command
      const result = await this.executeCommand(task.command, this.options.taskTimeout);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Task completed: ${taskId} (${(duration / 1000).toFixed(2)}s)`);
      
      // Update status and counters
      await this.redis.setTaskStatus(taskId, TASK_STATUS.COMPLETED, {
        completedAt: Date.now(),
        durationMs: duration,
        output: result.stdout,
      });
      await this.redis.setTaskResult(taskId, {
        success: true,
        output: result.stdout,
        durationMs: duration,
        workerId: CONFIG.worker.id,
        workerName: CONFIG.worker.name,
      });
      await this.redis.incrCounter(REDIS_KEYS.COMPLETED_TASKS);
      
      this.tasksCompleted++;
      this.currentTask = null;
      
      return { success: true, duration, output: result.stdout };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ Task failed: ${taskId} - ${error.message}`);
      
      // Check if we should retry
      const status = await this.redis.getTaskStatus(taskId);
      const retryCount = parseInt(status.retries || '0') + 1;
      
      if (retryCount <= this.options.maxRetries) {
        console.log(`   ➡️  Retrying (${retryCount}/${this.options.maxRetries})...`);
        
        // Update retry count
        await this.redis.setTaskStatus(taskId, TASK_STATUS.RETRYING, {
          retries: retryCount,
          lastError: error.message,
        });
        
        // Re-queue the task
        await this.redis.enqueueReadyTask(taskId);
        
        await this.redis.setTaskResult(taskId, {
          success: false,
          error: error.message,
          durationMs: duration,
          workerId: CONFIG.worker.id,
          workerName: CONFIG.worker.name,
          retries: retryCount,
        });
      } else {
        // Max retries exceeded
        console.log(`   ⚠️  Max retries (${this.options.maxRetries}) exceeded`);
        
        await this.redis.setTaskStatus(taskId, TASK_STATUS.FAILED, {
          completedAt: Date.now(),
          durationMs: duration,
          error: error.message,
          retries: retryCount,
        });
        await this.redis.setTaskResult(taskId, {
          success: false,
          error: error.message,
          durationMs: duration,
          workerId: CONFIG.worker.id,
          workerName: CONFIG.worker.name,
          retries: retryCount,
        });
        await this.redis.incrCounter(REDIS_KEYS.FAILED_TASKS);
        
        this.tasksFailed++;
      }
      
      this.currentTask = null;
      
      return { success: false, error: error.message, duration };
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
        process.stdout.write(data.toString());
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data.toString());
      });
      
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Timeout after ${timeout}ms: ${command}`));
      }, timeout);
      
      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve({ stdout, stderr });
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

  // Main work loop
  async run() {
    console.log(`\n🔄 Worker ${CONFIG.worker.name} waiting for tasks...\n`);
    
    while (this.running) {
      try {
        // Try to get a ready task
        const taskId = await this.redis.dequeueReadyTask();
        
        if (taskId) {
          // Check if task exists
          if (!this.taskMap.has(taskId)) {
            console.warn(`[warn] Task not in worker's map: ${taskId}`);
            await this.redis.enqueueReadyTask(taskId);
            continue;
          }
          
          // Execute the task
          await this.executeTask(taskId);
        } else {
          // No tasks available, wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`[work loop] Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Print summary
  async printSummary() {
    const endTime = performance.now();
    const duration = (endTime - this.startTime) / 1000;
    
    console.log('\n' + '='.repeat(60));
    console.log(`🛑 Worker ${CONFIG.worker.name} Shutting Down`);
    console.log('='.repeat(60));
    console.log(`   Worker ID: ${CONFIG.worker.id}`);
    console.log(`   Tasks Completed: ${this.tasksCompleted}`);
    console.log(`   Tasks Failed: ${this.tasksFailed}`);
    console.log(`   Uptime: ${duration.toFixed(2)}s`);
    console.log('='.repeat(60));
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  try {
    // Load tasks
    const configModule = await import(path.toFileURL(CONFIG.configPath).href);
    const tasks = configModule.default || configModule.TASKS || DEFAULT_TASKS;
    
    // Initialize Redis
    const redis = new RedisHelper(CONFIG.redis.host, CONFIG.redis.port);
    await redis.connect();
    
    // Create worker
    const worker = new TaskFleetWorker(redis, tasks, {
      taskTimeout: CONFIG.taskTimeout,
      maxRetries: CONFIG.maxRetries,
      heartbeatInterval: CONFIG.heartbeatInterval,
    });
    
    // Initialize and run
    await worker.initialize();
    await worker.run();
    
    // Cleanup
    worker.stopHeartbeat();
    await redis.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Worker shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Worker shutting down...');
  process.exit(0);
});

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

export default TaskFleetWorker;
