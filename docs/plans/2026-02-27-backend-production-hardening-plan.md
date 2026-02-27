# Backend Production Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the backend fully production-ready on Docker (Pi + HP) by fixing critical reliability, security, and operational issues.

**Architecture:** 8 surgical edits to existing files — no new files, no new dependencies. Redis-backed rate limiting uses the existing IORedis connection. Graceful shutdown ensures clean deploys. Startup validation provides fail-fast behavior.

**Tech Stack:** Node.js 20, Express 5, BullMQ, IORedis, Docker Compose (profile-based)

---

### Task 1: env.js — Startup Validation

**Files:**
- Modify: `backend/env.js`

**Step 1: Write the implementation**

Replace the entire contents of `backend/env.js` with:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '..', '.env');
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : rootEnvPath;

dotenv.config({ path: envPath });

// --- Fail-fast validation ---------------------------------------------------
const REQUIRED = ['REDIS_URL'];
const RECOMMENDED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[env] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const warned = RECOMMENDED.filter((k) => !process.env[k]);
if (warned.length) {
  console.warn(`[env] Missing recommended env vars (features disabled): ${warned.join(', ')}`);
}
```

**Step 2: Verify locally**

Run: `REDIS_URL=redis://localhost:6379 node -e "import('./backend/env.js')"`
Expected: No error, no exit

Run: `node -e "import('./backend/env.js')"`
Expected: `[env] Missing required env vars: REDIS_URL` then exit code 1

**Step 3: Commit**

```bash
git add backend/env.js
git commit -m "fix(env): add startup validation for required env vars"
```

---

### Task 2: queue.js — Reconnect Strategy

**Files:**
- Modify: `backend/queue.js`

**Step 1: Write the implementation**

Replace the entire contents of `backend/queue.js` with:

```js
import './env.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const skipVersionCheck = ['1', 'true', 'yes'].includes(
  (process.env.REDIS_SKIP_VERSION_CHECK || '').toLowerCase()
);

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 20) {
      console.error(`[queue] Redis reconnect failed after ${times} attempts, giving up`);
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    console.warn(`[queue] Redis reconnecting (attempt ${times}, delay ${delay}ms)`);
    return delay;
  },
  reconnectOnError(err) {
    return err.message.includes('READONLY');
  },
});

const queueName = process.env.JOB_QUEUE_NAME || 'carbonac-jobs';
const jobQueue = new Queue(queueName, {
  connection,
  skipVersionCheck,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

connection.on('error', (error) => {
  console.error(`[queue] Redis error: ${error.message}`);
});

connection.on('connect', () => {
  console.log('[queue] Redis connected');
});

export { connection, jobQueue, queueName };
export { skipVersionCheck };
```

**Step 2: Verify**

Run: `REDIS_URL=redis://localhost:6379 node -e "import('./backend/queue.js').then(() => console.log('OK'))"`
Expected: `[queue] Redis connected` then `OK` (or connection error if Redis not running locally — that's fine, the retry log should appear)

**Step 3: Commit**

```bash
git add backend/queue.js
git commit -m "fix(queue): add reconnect strategy with exponential backoff"
```

---

### Task 3: rate-limit.js — Redis-Backed

**Files:**
- Modify: `backend/middleware/rate-limit.js`

**Context:** This module is imported by:
- `backend/server.js` → `apiRateLimitMiddleware`
- `backend/routes/ai.js` → `getRateKey`, `checkAiRateLimit`
- `backend/routes/convert.js` → `getRateKey`, `checkApiRateLimit`

All existing function signatures must be preserved. The only change is the backing store (Map → Redis). Functions become `async`.

**Step 1: Write the implementation**

Replace the entire contents of `backend/middleware/rate-limit.js` with:

```js
/**
 * Rate limiting middleware (API + AI endpoints)
 * Backed by Redis INCR + PEXPIRE for distributed, auto-cleaning rate limits.
 */

import { connection } from '../queue.js';
import { sendError } from '../lib/helpers.js';

const AI_RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 20);
const API_RATE_LIMIT_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX || 60);

async function checkRateLimit(key, windowMs, max) {
  try {
    const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
    const count = await connection.incr(bucket);
    if (count === 1) {
      await connection.pexpire(bucket, windowMs);
    }
    if (count > max) {
      const ttl = await connection.pttl(bucket);
      return { allowed: false, retryAfter: Math.max(0, ttl) };
    }
    return { allowed: true, retryAfter: 0 };
  } catch {
    // Fail-open: if Redis is down, allow the request
    return { allowed: true, retryAfter: 0 };
  }
}

export function getRateKey(req, auth) {
  return auth?.userId ? `user:${auth.userId}` : `ip:${req.ip || 'unknown'}`;
}

export async function checkApiRateLimit(key) {
  return checkRateLimit(key, API_RATE_LIMIT_WINDOW_MS, API_RATE_LIMIT_MAX);
}

/**
 * Express middleware — global API rate limit per IP (60 req / 5 min).
 */
export async function apiRateLimitMiddleware(req, res, next) {
  const key = `ip:${req.ip || 'unknown'}`;
  const result = await checkApiRateLimit(key);
  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));
    return sendError(res, 429, 'RATE_LIMITED', 'Rate limit exceeded.', null, req.requestId);
  }
  next();
}

export async function checkAiRateLimit(key) {
  return checkRateLimit(key, AI_RATE_LIMIT_WINDOW_MS, AI_RATE_LIMIT_MAX);
}
```

**Step 2: Verify callers still work**

The callers in `routes/ai.js` and `routes/convert.js` already `await` the rate limit calls (`const rate = checkAiRateLimit(rateKey)` and `const rate = checkApiRateLimit(rateKey)`). Check these lines:

- `backend/routes/ai.js:128` — `const rate = checkAiRateLimit(rateKey);` → needs `await`
- `backend/routes/ai.js:201` — same
- `backend/routes/ai.js:280` — same
- `backend/routes/convert.js:165` — `const rate = checkApiRateLimit(rateKey);` → needs `await`
- `backend/routes/convert.js:327` — same

**Step 3: Add `await` to callers**

In `backend/routes/ai.js`, add `await` before each `checkAiRateLimit(rateKey)` call (lines 128, 201, 280).

In `backend/routes/convert.js`, add `await` before each `checkApiRateLimit(rateKey)` call (lines 165, 327).

These are inside `async` route handlers already, so adding `await` is safe.

**Step 4: Commit**

```bash
git add backend/middleware/rate-limit.js backend/routes/ai.js backend/routes/convert.js
git commit -m "fix(rate-limit): migrate to Redis-backed rate limiting with fail-open"
```

---

### Task 4: helpers.js — isReviewer Security Fix

**Files:**
- Modify: `backend/lib/helpers.js:100-114`

**Step 1: Write the fix**

In `backend/lib/helpers.js`, change lines 100-114:

Old:
```js
const reviewerIds = parseIdList(
  process.env.REVIEWER_USER_IDS ||
    process.env.TEMPLATE_REVIEWER_IDS ||
    process.env.PRESS_PACK_REVIEWER_IDS
);

export function isReviewer(userId) {
  if (!reviewerIds.length) {
    return true;
  }
  if (!userId) {
    return false;
  }
  return reviewerIds.includes(userId);
}
```

New:
```js
const reviewerIds = parseIdList(
  process.env.REVIEWER_USER_IDS ||
    process.env.TEMPLATE_REVIEWER_IDS ||
    process.env.PRESS_PACK_REVIEWER_IDS
);

if (!reviewerIds.length) {
  console.warn('[auth] REVIEWER_USER_IDS not set — reviewer actions disabled');
}

export function isReviewer(userId) {
  if (!reviewerIds.length) {
    return false;
  }
  if (!userId) {
    return false;
  }
  return reviewerIds.includes(userId);
}
```

**Step 2: Commit**

```bash
git add backend/lib/helpers.js
git commit -m "fix(auth): deny reviewer access when REVIEWER_USER_IDS not configured"
```

---

### Task 5: server.js — Graceful Shutdown

**Files:**
- Modify: `backend/server.js:7,87-91`

**Step 1: Write the implementation**

In `backend/server.js`, add the `connection` import at line 7 (after existing imports):

```js
import { connection } from './queue.js';
```

Replace lines 87-91 (the `app.listen` block):

Old:
```js
// --- Start ---
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
```

New:
```js
// --- Start ---
const server = app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

async function gracefulShutdown(signal) {
  console.log(`[server] ${signal} received, shutting down…`);
  server.close();
  try { await connection.quit(); } catch { /* best-effort */ }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Step 2: Commit**

```bash
git add backend/server.js
git commit -m "fix(server): add graceful shutdown on SIGTERM/SIGINT"
```

---

### Task 6: worker.js — SIGTERM Handler

**Files:**
- Modify: `backend/worker.js:1024-1029`

**Step 1: Write the implementation**

Replace lines 1024-1029 (the existing SIGINT handler):

Old:
```js
process.on('SIGINT', async () => {
  await worker.close();
  await jobQueue.close();
  await connection.quit();
  process.exit(0);
});
```

New:
```js
async function gracefulShutdown(signal) {
  console.log(`[worker] ${signal} received, draining…`);
  await worker.close();
  await jobQueue.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Step 2: Commit**

```bash
git add backend/worker.js
git commit -m "fix(worker): add SIGTERM handler for Docker graceful shutdown"
```

---

### Task 7: infra.py — Compose File Path Fix

**Files:**
- Modify: `scripts/infra.py:44-47`

**Step 1: Write the fix**

In `scripts/infra.py`, change lines 44-47:

Old:
```python
    PI_COMPOSE_DIR = os.getenv("CARBONAC_PI_PATH", "~/carbonac")
    PI_COMPOSE_FILE = "docker-compose.raspberry.yml"
    PI_PROFILE = "api"
    PI_ENV_FILES = "--env-file .env"
```

New:
```python
    PI_COMPOSE_DIR = os.getenv("CARBONAC_PI_PATH", "~/carbonac")
    PI_COMPOSE_FILE = "docker-compose.yml"
    PI_PROFILE = "pi"
    PI_ENV_FILES = "--env-file .env --env-file .env.pi"
```

**Step 2: Commit**

```bash
git add scripts/infra.py
git commit -m "fix(infra): use unified docker-compose.yml with pi profile"
```

---

### Task 8: Docker — Legacy Cleanup + API Health Check

**Files:**
- Modify: `docker/Dockerfile.worker`
- Modify: `docker-compose.yml`

**Step 1: Clean Dockerfile.worker — remove legacy build args**

The current `docker/Dockerfile.worker` does NOT have explicit ARG lines for TYPST/QUARTO (they're only in docker-compose.yml). So only docker-compose.yml needs editing.

**Step 2: Edit docker-compose.yml**

In `docker-compose.yml`, remove the `args` block from the worker service (lines 83-85):

Old:
```yaml
    build:
      context: .
      dockerfile: docker/Dockerfile.worker
      args:
        INSTALL_TYPST: "0"
        INSTALL_QUARTO: "0"
```

New:
```yaml
    build:
      context: .
      dockerfile: docker/Dockerfile.worker
```

**Step 3: Fix API health check**

In `docker-compose.yml`, change the API service health check (line 63):

Old:
```yaml
    healthcheck:
      test: ["CMD", "node", "backend/scripts/redis-healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

New:
```yaml
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3001/api/health').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "fix(docker): remove legacy build args, use HTTP health check for API"
```

---

### Task 9: .env.example — Document Missing Variables

**Files:**
- Modify: `.env.example`

**Step 1: Add missing variables**

Append the following blocks to `.env.example` in their logical sections.

After the `METRICS_TOKEN` line (line 47), add:

```
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX=20
```

After the `PDF_QA_MAX_ITERATIONS` line (line 53), add:

```
PYTHON_BIN=
KEEP_TEMP_FILES=false
```

After the `REDIS_URL` comment block (line 58), add:

```
REDIS_SKIP_VERSION_CHECK=false
JOB_QUEUE_NAME=carbonac-jobs
```

After the `HP_RUNNER_DIR` line (line 83, end of file), add:

```

# Authorization
REVIEWER_USER_IDS=
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(env): document missing env vars in .env.example"
```

---

### Task 10: Verification

**Step 1: Verify all files parse correctly**

Run: `node -e "import('./backend/env.js')"` (with REDIS_URL set)
Expected: No errors

Run: `node -e "import('./backend/queue.js')"` (with REDIS_URL set)
Expected: `[queue] Redis connected` or retry logs

Run: `node -e "import('./backend/middleware/rate-limit.js')"` (with REDIS_URL set)
Expected: No errors

**Step 2: Verify Docker build**

Run: `docker compose --profile full config` (validates compose YAML)
Expected: Valid YAML output with no args block on worker, HTTP health check on API

**Step 3: Final commit (if any fixes needed)**

If verification reveals issues, fix and commit individually.
