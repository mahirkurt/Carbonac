/**
 * Rate limiting middleware (API + AI endpoints)
 */

const AI_RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 20);
const API_RATE_LIMIT_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX || 60);

const aiRateState = new Map();
const apiRateState = new Map();

export function getRateKey(req, auth) {
  return auth?.userId ? `user:${auth.userId}` : `ip:${req.ip || 'unknown'}`;
}

export function checkApiRateLimit(key) {
  const now = Date.now();
  const current = apiRateState.get(key);
  if (!current || current.resetAt <= now) {
    const entry = { count: 1, resetAt: now + API_RATE_LIMIT_WINDOW_MS };
    apiRateState.set(key, entry);
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= API_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.max(0, current.resetAt - now) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function checkAiRateLimit(key) {
  const now = Date.now();
  const current = aiRateState.get(key);
  if (!current || current.resetAt <= now) {
    const entry = { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS };
    aiRateState.set(key, entry);
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= AI_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.max(0, current.resetAt - now) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}
