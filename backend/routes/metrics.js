/**
 * Metrics, dashboard, and health routes
 */

import { Router } from 'express';
import { sendError } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import {
  requestMetrics,
  buildLatencySummary,
  buildAlertList,
  METRICS_TOKEN,
  METRICS_REQUIRE_AUTH,
} from '../lib/metrics.js';
import { resolveAuthUser } from '../lib/job-helpers.js';
import { authEnabled } from '../auth.js';
import { jobQueue } from '../queue.js';

const router = Router();

async function authorizeMetrics(req, res) {
  if (METRICS_TOKEN) {
    const token = req.get('x-metrics-token');
    if (!token || token !== METRICS_TOKEN) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid metrics token.', null, req.requestId);
    }
  } else if (METRICS_REQUIRE_AUTH && authEnabled) {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }
  }
  return null;
}

function renderMetricsDashboard(payload) {
  const reqStats = payload.requests;
  const queue = payload.queue;
  const alerts = payload.alerts || [];
  const alertItems = alerts.length
    ? alerts.map((alert) => `<li>${alert.message}</li>`).join('')
    : '<li>No active alerts.</li>';
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Carbonac Metrics</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; background: #f4f4f4; color: #161616; }
      h1 { font-size: 20px; margin-bottom: 12px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
      .card { background: #fff; padding: 16px; border-radius: 10px; border: 1px solid #e0e0e0; }
      .label { font-size: 12px; color: #525252; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { font-size: 20px; font-weight: 600; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: left; font-size: 13px; }
    </style>
  </head>
  <body>
    <h1>Carbonac SLO Dashboard</h1>
    <div class="grid">
      <div class="card"><div class="label">Requests</div><div class="value">${reqStats.total}</div></div>
      <div class="card"><div class="label">Success Rate</div><div class="value">${reqStats.successRate}%</div></div>
      <div class="card"><div class="label">p95 Latency</div><div class="value">${reqStats.latencyMs.p95} ms</div></div>
      <div class="card"><div class="label">Queue Depth</div><div class="value">${queue.depth}</div></div>
    </div>
    <div class="card">
      <div class="label">Queue Breakdown</div>
      <table>
        <tr><th>Waiting</th><th>Active</th><th>Completed</th><th>Failed</th><th>Delayed</th></tr>
        <tr>
          <td>${queue.waiting}</td>
          <td>${queue.active}</td>
          <td>${queue.completed}</td>
          <td>${queue.failed}</td>
          <td>${queue.delayed}</td>
        </tr>
      </table>
    </div>
    <div class="card">
      <div class="label">Alerts</div>
      <ul>${alertItems}</ul>
    </div>
    <p class="label">Generated at ${payload.generatedAt}</p>
  </body>
</html>`;
}

async function buildMetricsPayload() {
  const latency = buildLatencySummary(requestMetrics.durations);
  const queueCounts = await jobQueue.getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed',
    'paused'
  );
  const successRate = requestMetrics.total
    ? Number(((requestMetrics.success / requestMetrics.total) * 100).toFixed(2))
    : 0;
  const alerts = buildAlertList({
    latencyMs: latency,
    successRate,
    queueDepth: (queueCounts.waiting || 0) + (queueCounts.delayed || 0),
  });

  return {
    generatedAt: new Date().toISOString(),
    requests: {
      total: requestMetrics.total,
      success: requestMetrics.success,
      error: requestMetrics.error,
      successRate,
      latencyMs: latency,
    },
    queue: {
      waiting: queueCounts.waiting || 0,
      active: queueCounts.active || 0,
      completed: queueCounts.completed || 0,
      failed: queueCounts.failed || 0,
      delayed: queueCounts.delayed || 0,
      paused: queueCounts.paused || 0,
      depth: (queueCounts.waiting || 0) + (queueCounts.delayed || 0),
    },
    alerts,
  };
}

/**
 * GET /metrics — JSON metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const authError = await authorizeMetrics(req, res);
    if (authError) {
      return authError;
    }

    const payload = await buildMetricsPayload();
    return res.json(payload);
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'METRICS_FAILED', 'Metrics endpoint failed.', error.message, req.requestId);
  }
});

/**
 * GET /metrics/dashboard — HTML dashboard
 */
router.get('/metrics/dashboard', async (req, res) => {
  try {
    const authError = await authorizeMetrics(req, res);
    if (authError) {
      return authError;
    }

    const payload = await buildMetricsPayload();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderMetricsDashboard(payload));
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'METRICS_FAILED', 'Metrics dashboard failed.', error.message, req.requestId);
  }
});

/**
 * GET /health — Health check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
