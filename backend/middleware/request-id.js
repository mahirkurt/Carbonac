/**
 * Request ID middleware — assigns UUID to each request + metrics logging
 */

import { randomUUID } from 'crypto';
import { logEvent } from '../lib/logger.js';
import { recordRequestMetric } from '../lib/metrics.js';

export function requestIdMiddleware(req, res, next) {
  const requestId = req.get('x-request-id') || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    recordRequestMetric(durationMs, res.statusCode);
    logEvent('info', {
      requestId,
      userId: req.authUserId || null,
      jobId: req.jobId || null,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
}
