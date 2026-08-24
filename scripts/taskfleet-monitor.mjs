#!/usr/bin/env node
/**
 * taskfleet-monitor.mjs — TaskFleet Monitoring Dashboard
 * 
 * This service provides a real-time web dashboard for monitoring
 * TaskFleet execution. It exposes:
 *   - Web interface on port 3000
 *   - Prometheus metrics on /metrics
 *   - JSON API on /api
 * 
 * Usage:
 *   # Run monitor
 *   node scripts/taskfleet-monitor.mjs
 *   
 *   # Run with custom port
 *   node scripts/taskfleet-monitor.mjs --port 4000
 *   
 * Environment Variables:
 *   REDIS_HOST        Redis server host (default: localhost)
 *   REDIS_PORT        Redis server port (default: 6379)
 *   PORT             HTTP server port (default: 3000)
 * 
 * @module taskfleet-monitor
 */

import { createClient } from 'redis';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ── Configuration ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  port: parseInt(args.find(a => a.startsWith('--port='))?.split('=')[1] || 
                 process.env.PORT || '3000'),
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

  async getStats() {
    return this.client.hGetAll(REDIS_KEYS.STATS);
  }

  async getActiveWorkers() {
    return this.client.sMembers(REDIS_KEYS.WORKER_REGISTRY);
  }

  async getWorkerInfo(workerId) {
    const key = REDIS_KEYS.WORKER_HEARTBEAT(workerId);
    return this.client.hGetAll(key);
  }

  async getTaskStatus(taskId) {
    const key = REDIS_KEYS.TASK_STATUS(taskId);
    return this.client.hGetAll(key);
  }

  async getTaskResult(taskId) {
    const key = REDIS_KEYS.TASK_RESULT(taskId);
    const result = await this.client.get(key);
    return result ? JSON.parse(result) : null;
  }

  async getAllTaskKeys() {
    return this.client.keys(REDIS_KEYS.TASK_STATUS('*'));
  }

  async getTaskDependencies(taskId) {
    const key = REDIS_KEYS.TASK_DEPENDENCIES(taskId);
    return this.client.sMembers(key);
  }

  async getReadyQueueLength() {
    return this.client.lLen(REDIS_KEYS.TASK_READY);
  }

  async getActiveTasks() {
    return this.client.sMembers(REDIS_KEYS.ACTIVE_TASKS);
  }

  async getCounters() {
    const completed = await this.client.get(REDIS_KEYS.COMPLETED_TASKS) || '0';
    const failed = await this.client.get(REDIS_KEYS.FAILED_TASKS) || '0';
    return {
      completed: parseInt(completed),
      failed: parseInt(failed),
    };
  }
}

// ── Monitor Application ─────────────────────────────────────────────────

class TaskFleetMonitor {
  constructor(redis, config) {
    this.redis = redis;
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use('/static', express.static(path.join(REPO_ROOT, 'scripts', 'taskfleet-static')));
  }

  setupRoutes() {
    // Home page - redirect to dashboard
    this.app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });

    // Dashboard page
    this.app.get('/dashboard', this.renderDashboard.bind(this));

    // JSON API
    this.app.get('/api', this.getApiStats.bind(this));
    this.app.get('/api/tasks', this.getApiTasks.bind(this));
    this.app.get('/api/tasks/:id', this.getApiTask.bind(this));
    this.app.get('/api/workers', this.getApiWorkers.bind(this));
    this.app.get('/api/workers/:id', this.getApiWorker.bind(this));
    
    // Prometheus metrics
    this.app.get('/metrics', this.getMetrics.bind(this));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });
    
    // Static HTML for dashboard
    this.app.get('/static/dashboard.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'taskfleet-dashboard.html'));
    });
  }

  async renderDashboard(req, res) {
    try {
      res.sendFile(path.join(__dirname, 'taskfleet-dashboard.html'));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApiStats(req, res) {
    try {
      const stats = await this.redis.getStats();
      const counters = await this.redis.getCounters();
      const workers = await this.redis.getActiveWorkers();
      const readyQueue = await this.redis.getReadyQueueLength();
      
      res.json({
        ...stats,
        counters,
        workerCount: workers.length,
        readyQueueLength: readyQueue,
        timestamp: Date.now(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApiTasks(req, res) {
    try {
      const taskKeys = await this.redis.getAllTaskKeys();
      
      const tasks = await Promise.all(taskKeys.map(async (key) => {
        const taskId = key.replace('taskfleet:status:', '');
        const status = await this.redis.getTaskStatus(taskId);
        const result = await this.redis.getTaskResult(taskId);
        const deps = await this.redis.getTaskDependencies(taskId);
        
        return {
          id: taskId,
          status: status.status || 'unknown',
          ...status,
          result,
          dependencies: deps,
        };
      }));
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApiTask(req, res) {
    try {
      const taskId = req.params.id;
      const status = await this.redis.getTaskStatus(taskId);
      const result = await this.redis.getTaskResult(taskId);
      const deps = await this.redis.getTaskDependencies(taskId);
      
      if (!status.status) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({
        id: taskId,
        status: status.status,
        ...status,
        result,
        dependencies: deps,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApiWorkers(req, res) {
    try {
      const workers = await this.redis.getActiveWorkers();
      
      const workerDetails = await Promise.all(workers.map(async (workerId) => {
        const info = await this.redis.getWorkerInfo(workerId);
        return {
          id: workerId,
          ...info,
        };
      }));
      
      res.json(workerDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApiWorker(req, res) {
    try {
      const workerId = req.params.id;
      const info = await this.redis.getWorkerInfo(workerId);
      
      if (!info.workerId) {
        return res.status(404).json({ error: 'Worker not found' });
      }
      
      res.json({
        id: workerId,
        ...info,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMetrics(req, res) {
    try {
      const stats = await this.redis.getStats();
      const counters = await this.redis.getCounters();
      const workers = await this.redis.getActiveWorkers();
      const readyQueue = await this.redis.getReadyQueueLength();
      
      const metrics = [
        `# HELP taskfleet_tasks_total Total number of tasks`,
        `# TYPE taskfleet_tasks_total gauge`,
        `taskfleet_tasks_total ${stats.totalTasks || 0}`,
        
        `# HELP taskfleet_tasks_ready Number of ready tasks`,
        `# TYPE taskfleet_tasks_ready gauge`,
        `taskfleet_tasks_ready ${readyQueue}`,
        
        `# HELP taskfleet_tasks_completed Number of completed tasks`,
        `# TYPE taskfleet_tasks_completed counter`,
        `taskfleet_tasks_completed ${counters.completed}`,
        
        `# HELP taskfleet_tasks_failed Number of failed tasks`,
        `# TYPE taskfleet_tasks_failed counter`,
        `taskfleet_tasks_failed ${counters.failed}`,
        
        `# HELP taskfleet_workers_active Number of active workers`,
        `# TYPE taskfleet_workers_active gauge`,
        `taskfleet_workers_active ${workers.length}`,
        
        `# HELP taskfleet_uptime_seconds Monitor uptime in seconds`,
        `# TYPE taskfleet_uptime_seconds gauge`,
        `taskfleet_uptime_seconds ${((Date.now() - (stats.startedAt || Date.now())) / 1000).toFixed(2)}`,
      ];
      
      res.set('Content-Type', 'text/plain');
      res.send(metrics.join('\n') + '\n');
    } catch (error) {
      res.status(500).send(`# Error: ${error.message}\n`);
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      const port = this.config.port;
      this.server = this.app.listen(port, () => {
        console.log(`✅ TaskFleet Monitor started on http://localhost:${port}`);
        console.log(`   Dashboard: http://localhost:${port}/dashboard`);
        console.log(`   API:       http://localhost:${port}/api`);
        console.log(`   Metrics:   http://localhost:${port}/metrics`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        console.error(`Error starting server: ${error.message}`);
        reject(error);
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ TaskFleet Monitor stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TaskFleet Monitor Starting`);
  console.log(`   Redis: ${CONFIG.redis.host}:${CONFIG.redis.port}`);
  console.log(`   Port: ${CONFIG.port}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    // Initialize Redis
    const redis = new RedisHelper(CONFIG.redis.host, CONFIG.redis.port);
    await redis.connect();
    
    // Create monitor
    const monitor = new TaskFleetMonitor(redis, CONFIG);
    
    // Start server
    await monitor.start();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Monitor shutting down...');
      await monitor.stop();
      await redis.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Monitor shutting down...');
      await monitor.stop();
      await redis.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

export default TaskFleetMonitor;
