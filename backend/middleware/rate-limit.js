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
