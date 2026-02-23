/**
 * In-memory request metrics with SLO alerting
 */

const METRICS_WINDOW_SIZE = Number(process.env.METRICS_WINDOW_SIZE || 500);
const METRICS_ALERT_ENABLED = process.env.METRICS_ALERT_ENABLED !== 'false';
const METRICS_ALERT_P95_MS = Number(process.env.METRICS_ALERT_P95_MS || 800);
const METRICS_ALERT_ERROR_RATE = Number(process.env.METRICS_ALERT_ERROR_RATE || 5);
const METRICS_ALERT_QUEUE_DEPTH = Number(process.env.METRICS_ALERT_QUEUE_DEPTH || 20);

export const METRICS_REQUIRE_AUTH = process.env.METRICS_REQUIRE_AUTH !== 'false';
export const METRICS_TOKEN = process.env.METRICS_TOKEN || '';

export const requestMetrics = {
  total: 0,
  success: 0,
  error: 0,
  durations: [],
};

export function recordRequestMetric(durationMs, statusCode) {
  requestMetrics.total += 1;
  if (statusCode >= 200 && statusCode < 400) {
    requestMetrics.success += 1;
  } else {
    requestMetrics.error += 1;
  }
  requestMetrics.durations.push(durationMs);
  if (requestMetrics.durations.length > METRICS_WINDOW_SIZE) {
    requestMetrics.durations.shift();
  }
}

export function buildLatencySummary(samples = []) {
  if (!samples.length) {
    return { p50: 0, p95: 0, p99: 0, avg: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const pick = (percentile) => {
    const index = Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1);
    return sorted[index] || 0;
  };
  const avg = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return {
    p50: pick(50),
    p95: pick(95),
    p99: pick(99),
    avg: Math.round(avg),
  };
}

export function buildAlertList({ latencyMs, successRate, queueDepth }) {
  if (!METRICS_ALERT_ENABLED) return [];
  const alerts = [];
  const errorRate = Number((100 - successRate).toFixed(2));
  if (latencyMs.p95 > METRICS_ALERT_P95_MS) {
    alerts.push({
      id: 'latency-p95',
      severity: 'high',
      message: `p95 latency ${latencyMs.p95}ms > ${METRICS_ALERT_P95_MS}ms`,
      value: latencyMs.p95,
      threshold: METRICS_ALERT_P95_MS,
    });
  }
  if (errorRate > METRICS_ALERT_ERROR_RATE) {
    alerts.push({
      id: 'error-rate',
      severity: 'medium',
      message: `error rate ${errorRate}% > ${METRICS_ALERT_ERROR_RATE}%`,
      value: errorRate,
      threshold: METRICS_ALERT_ERROR_RATE,
    });
  }
  if (queueDepth > METRICS_ALERT_QUEUE_DEPTH) {
    alerts.push({
      id: 'queue-depth',
      severity: 'medium',
      message: `queue depth ${queueDepth} > ${METRICS_ALERT_QUEUE_DEPTH}`,
      value: queueDepth,
      threshold: METRICS_ALERT_QUEUE_DEPTH,
    });
  }
  return alerts;
}
