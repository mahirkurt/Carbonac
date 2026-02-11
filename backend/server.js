/**
 * Backend API Server
 * Handles document conversion, authentication, and billing
 */

import './env.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import mammoth from 'mammoth';
import { jobQueue } from './queue.js';
import { authEnabled, getUserIdFromToken } from './auth.js';
import {
  jobStoreEnabled,
  createJobRecord,
  updateJobRecord,
  addJobEvent,
  getJobRecord,
  listJobEvents,
  listJobs,
} from './job-store.js';
import {
  storageEnabled,
  createPdfSignedUrl,
  templatePreviewEnabled,
  createTemplatePreviewSignedUrl,
} from './storage.js';
import {
  templateStoreEnabled,
  listTemplates,
  createTemplate,
  updateTemplateMetadata,
  deleteTemplate,
  createTemplateVersion,
  setActiveTemplateVersion,
  rollbackTemplateVersion,
  getTemplateVersions,
  setTemplateVersionStatus,
} from './templates-store.js';
import {
  pressPackStoreEnabled,
  createPressPack,
  getPressPackById,
  listPressPacks,
  updatePressPackStatus,
} from './press-pack-store.js';
import {
  releaseStoreEnabled,
  createRelease,
  getReleaseById,
  updateRelease,
  setReleaseStatus,
} from './release-store.js';
import { evaluatePreflight } from './preflight.js';
import { usageStoreEnabled, createUsageEvent } from './usage-store.js';
import { LOCAL_TEMPLATE_FALLBACKS } from './template-fallbacks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const OUTPUT_ROOT = path.resolve(__dirname, '../output/jobs');

// Middleware
const ALLOWED_ORIGINS = [
  'https://carbonac.com',
  'https://www.carbonac.com',
  /--carbonac\.netlify\.app$/,
];
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(/^http:\/\/localhost(:\d+)?$/);
}
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return cb(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin,
      );
      cb(null, allowed ? origin : false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  }),
);
app.use(express.json());
app.use((req, res, next) => {
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
});

function logEvent(level, payload) {
  const entry = {
    level,
    time: new Date().toISOString(),
    ...payload,
  };
  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

const METRICS_WINDOW_SIZE = Number(process.env.METRICS_WINDOW_SIZE || 500);
const METRICS_REQUIRE_AUTH = process.env.METRICS_REQUIRE_AUTH !== 'false';
const METRICS_TOKEN = process.env.METRICS_TOKEN || '';
const METRICS_ALERT_ENABLED = process.env.METRICS_ALERT_ENABLED !== 'false';
const METRICS_ALERT_P95_MS = Number(process.env.METRICS_ALERT_P95_MS || 800);
const METRICS_ALERT_ERROR_RATE = Number(process.env.METRICS_ALERT_ERROR_RATE || 5);
const METRICS_ALERT_QUEUE_DEPTH = Number(process.env.METRICS_ALERT_QUEUE_DEPTH || 20);
const requestMetrics = {
  total: 0,
  success: 0,
  error: 0,
  durations: [],
};

function recordRequestMetric(durationMs, statusCode) {
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

function buildLatencySummary(samples = []) {
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

function buildAlertList({ latencyMs, successRate, queueDepth }) {
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

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function deriveGeminiApiRoot(apiUrl) {
  const normalized = stripTrailingSlash(apiUrl);
  if (normalized.endsWith('/models')) {
    return normalized.slice(0, -'/models'.length);
  }
  return normalized;
}

function normalizeGeminiModelResource(model) {
  const value = String(model || '').trim();
  if (!value) return '';

  if (value.startsWith('models/') || value.startsWith('tunedModels/')) {
    return value;
  }

  // Allow full resource names (Vertex / other namespaces) as-is.
  if (value.includes('/')) {
    return value;
  }

  return `models/${value}`;
}

function stripMarkdownCodeFences(text) {
  const value = String(text || '').trim();
  const fenceMatch = value.match(/^```[a-z0-9_-]*\s*\n([\s\S]*?)\n```\s*$/i);
  if (fenceMatch) {
    return String(fenceMatch[1] || '').trim();
  }
  return value;
}

function stripOuterHtmlDocument(html) {
  const value = String(html || '').trim();
  const bodyMatch = value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return String(bodyMatch[1] || '').trim();
  }
  return value;
}

function sanitizeGeneratedHtml(html) {
  let value = String(html || '');

  // Remove scripts/styles defensively before the frontend injects into innerHTML.
  value = value.replace(/<script[\s\S]*?<\/script>/gi, '');
  value = value.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Strip inline event handlers.
  value = value.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip javascript: URLs.
  value = value.replace(/\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, ' $1="#"');

  return value.trim();
}

const AI_RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 20);
const AI_PROMPT_VERSION = process.env.AI_PROMPT_VERSION || 'v1';
const AI_REDACT_PII = process.env.AI_REDACT_PII !== 'false';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-pro';
const GEMINI_API_URL =
  process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_API_ROOT = deriveGeminiApiRoot(GEMINI_API_URL) || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_CARBON_HTML_MODEL =
  process.env.GEMINI_CARBON_HTML_MODEL || process.env.GEMINI_MARKDOWN_TO_HTML_MODEL || '';
const GEMINI_CARBON_HTML_FALLBACK_MODEL = process.env.GEMINI_CARBON_HTML_FALLBACK_MODEL || '';
const GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION = process.env.GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION || '';
const PUBLISH_REQUIRE_QUALITY_CHECKLIST =
  process.env.PUBLISH_REQUIRE_QUALITY_CHECKLIST === 'true';

const aiRateState = new Map();
const API_RATE_LIMIT_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX || 60);
const apiRateState = new Map();

function redactPii(text) {
  if (!AI_REDACT_PII || typeof text !== 'string') {
    return text;
  }
  let output = text;
  output = output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, '[redacted-email]');
  output = output.replace(/\\b\\+?\\d[\\d\\s().-]{7,}\\d\\b/g, '[redacted-phone]');
  output = output.replace(/\\b\\d{13,19}\\b/g, '[redacted-card]');
  return output;
}

function getRateKey(req, auth) {
  return auth?.userId ? `user:${auth.userId}` : `ip:${req.ip || 'unknown'}`;
}

function checkApiRateLimit(key) {
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

function checkAiRateLimit(key) {
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

function validateConvertInput({ markdown, assets, metadata }) {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return 'Markdown content is required.';
  }
  if (assets !== undefined) {
    if (!Array.isArray(assets)) {
      return 'Assets must be an array.';
    }
    for (const asset of assets) {
      if (!asset || typeof asset !== 'object') {
        return 'Assets must be objects.';
      }
      if (!asset.url && !asset.storagePath) {
        return 'Each asset must include url or storagePath.';
      }
    }
  }
  if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    return 'Metadata must be an object.';
  }
  return null;
}

async function callGemini({ prompt, model, systemInstruction = null, generationConfig = null }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY.');
  }

  const resolvedModel = normalizeGeminiModelResource(model);
  if (!resolvedModel) {
    throw new Error('Missing Gemini model.');
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: generationConfig || {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    requestBody.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(`${stripTrailingSlash(GEMINI_API_ROOT)}/${resolvedModel}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`Gemini API error: ${response.status} - ${errorText}`);
    err.status = response.status;
    // Provide a stable-ish code for clients.
    if (response.status === 429) {
      err.code = 'GEMINI_RATE_LIMITED';
    }
    throw err;
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned empty response.');
  }
  return text;
}

function parseIdList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const reviewerIds = parseIdList(
  process.env.REVIEWER_USER_IDS ||
    process.env.TEMPLATE_REVIEWER_IDS ||
    process.env.PRESS_PACK_REVIEWER_IDS
);

function isReviewer(userId) {
  if (!reviewerIds.length) {
    return true;
  }
  if (!userId) {
    return false;
  }
  return reviewerIds.includes(userId);
}

function requireReviewer(res, userId, requestId) {
  if (!isReviewer(userId)) {
    sendError(
      res,
      403,
      'REVIEWER_REQUIRED',
      'Reviewer approval required for this action.',
      null,
      requestId
    );
    return false;
  }
  return true;
}

function sendError(res, status, code, message, details, requestId) {
  return res.status(status).json({
    error: {
      code,
      message,
      details: details || null,
      request_id: requestId || null,
    },
  });
}

async function pathExists(targetPath) {
  if (!targetPath) return false;
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function safeUnlink(targetPath) {
  if (!targetPath) return;
  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function safeRemoveDir(targetPath) {
  if (!targetPath) return;
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function runPythonConversion(pythonScript, inputPath) {
  const pythonBins = [process.env.PYTHON_BIN, 'python3', 'python']
    .filter((value, index, list) => value && list.indexOf(value) === index);
  const failures = [];

  for (const bin of pythonBins) {
    try {
      return await new Promise((resolve, reject) => {
        const pythonProcess = spawn(bin, [pythonScript, inputPath]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('error', (error) => {
          reject(error);
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(errorOutput || `Python conversion failed (exit: ${code})`));
          }
        });
      });
    } catch (error) {
      failures.push(`${bin}: ${error.message}`);
    }
  }

  throw new Error(failures.join(' | ') || 'Python conversion failed');
}

async function attachTemplatePreviews(templates = []) {
  if (!templatePreviewEnabled) {
    return templates.map((template) => ({
      ...template,
      previewUrl: null,
      previewExpiresAt: null,
    }));
  }

  return Promise.all(
    templates.map(async (template) => {
      const storagePath = template.preview?.storage_path;
      if (!storagePath) {
        return {
          ...template,
          previewUrl: null,
          previewExpiresAt: null,
        };
      }

      const signed = await createTemplatePreviewSignedUrl({ storagePath });
      return {
        ...template,
        previewUrl: signed?.signedUrl || null,
        previewExpiresAt: signed?.expiresAt || null,
      };
    })
  );
}

function serializeTemplate(template) {
  const activeVersion = template.activeVersion
    ? {
        id: template.activeVersion.id,
        version: template.activeVersion.version,
        layoutProfile: template.activeVersion.layout_profile,
        printProfile: template.activeVersion.print_profile,
        theme: template.activeVersion.theme,
        status: template.activeVersion.status || null,
        approvedAt: template.activeVersion.approved_at || null,
        schema: template.activeVersion.schema_json,
      }
    : null;

  return {
    id: template.id,
    key: template.key,
    name: template.name,
    description: template.description,
    status: template.status,
    engine: template.engine,
    category: template.category,
    tags: template.tags || [],
    isPublic: template.is_public,
    isSystem: template.is_system,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
    activeVersion,
    previewUrl: template.previewUrl || null,
    previewExpiresAt: template.previewExpiresAt || null,
  };
}

async function resolveAuthUser(req) {
  const authHeader = req.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    req.authUserId = null;
    return { userId: null };
  }
  if (!authEnabled) {
    req.authUserId = null;
    return { userId: null };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    req.authUserId = null;
    return { userId: null };
  }
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    req.authUserId = null;
    return { error: 'INVALID_AUTH' };
  }
  req.authUserId = userId;
  return { userId };
}

function normalizeJobStatus(state) {
  switch (state) {
    case 'waiting':
    case 'delayed':
    case 'waiting-children':
    case 'paused':
      return 'queued';
    case 'active':
    case 'stalled':
      return 'processing';
    default:
      return state;
  }
}

function isSignedUrlValid(expiresAt) {
  if (!expiresAt) {
    return false;
  }
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) {
    return false;
  }
  return expiresMs - Date.now() > 30 * 1000;
}

function resolveIsoTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }
  return date.toISOString();
}

function buildJobTelemetry({ snapshot = {}, events = [] } = {}) {
  const orderedEvents = [...events]
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = Date.parse(left.created_at || '') || 0;
      const rightTime = Date.parse(right.created_at || '') || 0;
      return leftTime - rightTime;
    });
  const firstEvent = orderedEvents[0] || null;
  const lastEvent = orderedEvents[orderedEvents.length - 1] || null;

  const startedAt =
    firstEvent?.created_at ||
    snapshot.createdAt ||
    snapshot.timings?.createdAt ||
    snapshot.timings?.processedAt ||
    null;
  const updatedAt =
    lastEvent?.created_at ||
    snapshot.updatedAt ||
    snapshot.timings?.finishedAt ||
    snapshot.timings?.processedAt ||
    null;
  const durationMs =
    startedAt && updatedAt ? Math.max(0, Date.parse(updatedAt) - Date.parse(startedAt)) : null;

  const progress = Number.isFinite(lastEvent?.progress)
    ? lastEvent.progress
    : Number.isFinite(snapshot.progress)
      ? snapshot.progress
      : null;
  const stage = lastEvent?.stage || snapshot.stage || null;

  const result = snapshot.result || {};
  const outputManifest = result.outputManifest || {};
  const qaSummary =
    outputManifest.qa?.summary ||
    result.preflight?.qaSummary ||
    outputManifest.preflight?.qaSummary ||
    null;
  const accessibilitySummary =
    outputManifest.qa?.accessibilitySummary ||
    result.preflight?.accessibilitySummary ||
    outputManifest.preflight?.accessibilitySummary ||
    null;
  const qualityChecklist =
    outputManifest.preflight?.qualityChecklist ||
    result.preflight?.qualityChecklist ||
    null;
  const qualityChecklistSummary = qualityChecklist?.summary || null;

  return {
    progress,
    stage,
    startedAt,
    updatedAt,
    durationMs,
    timings: snapshot.timings || null,
    qaSummary,
    accessibilitySummary,
    qualityChecklistSummary,
  };
}

async function getJobSnapshot(jobId, userId = null) {
  if (jobStoreEnabled) {
    const record = await getJobRecord(jobId);
    if (record) {
      if (userId && record.user_id && record.user_id !== userId) {
        return { forbidden: true };
      }
      return {
        snapshot: {
          status: record.status,
          result: record.result || null,
          error: record.error_message ? { message: record.error_message } : null,
          createdAt: record.created_at || null,
          updatedAt: record.updated_at || null,
          attempts: record.attempts || 0,
        },
      };
    }
  }

  const job = await jobQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const status = normalizeJobStatus(state);
  const error = state === 'failed' ? { message: job.failedReason || 'Job failed.' } : null;
  const progress = Number.isFinite(job.progress) ? Math.round(job.progress) : null;
  const timings = {
    createdAt: resolveIsoTime(job.timestamp),
    processedAt: resolveIsoTime(job.processedOn),
    finishedAt: resolveIsoTime(job.finishedOn),
  };

  return {
    snapshot: {
      status,
      result: job.returnvalue || null,
      error,
      progress,
      timings,
    },
  };
}

async function assertJobOwnership(jobId, userId) {
  if (!jobStoreEnabled) {
    return { record: null };
  }
  const record = await getJobRecord(jobId);
  if (record && userId && record.user_id && record.user_id !== userId) {
    return { forbidden: true, record };
  }
  return { record };
}

async function downloadRemoteFile(fileUrl, fileType) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error('Failed to download remote file.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const urlPath = new URL(fileUrl).pathname;
  const urlName = path.basename(urlPath);
  const ext = fileType ? `.${fileType}` : path.extname(urlName);
  const safeExt = ext || '.bin';

  const uploadDir = path.join(__dirname, '../temp/uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}${safeExt}`;
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    path: filePath,
    originalName: urlName || filename,
  };
}

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../temp/uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
    ];

    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.endsWith('.md') ||
      file.originalname.endsWith('.txt')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
});

/**
 * Convert document to Markdown using Marker
 * POST /api/convert/to-markdown
 */
app.post('/api/convert/to-markdown', upload.single('file'), async (req, res) => {
  let fallbackPath = null;
  let outputDir = null;
  try {
    const { fileUrl, fileType } = req.body || {};
    let fileInfo = req.file;

    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkApiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'Rate limit exceeded.', null, req.requestId);
    }

    if (!fileInfo && fileUrl) {
      fileInfo = await downloadRemoteFile(fileUrl, fileType);
    }

    if (!fileInfo) {
      return sendError(res, 400, 'INVALID_INPUT', 'File is required.', null, req.requestId);
    }

    fallbackPath = fileInfo.path;

    const inputPath = fileInfo.path;
    outputDir = path.join(__dirname, '../temp/output', req.requestId || randomUUID());
    await fs.mkdir(outputDir, { recursive: true });

    const ext = path.extname(fileInfo.originalName || '').toLowerCase();

    if (ext === '.md' || ext === '.txt') {
      const content = await fs.readFile(inputPath, 'utf-8');
      return res.json({
        success: true,
        markdown: content,
        fileName: fileInfo.originalName,
      });
    }

    // DOCX/DOC: use mammoth (Node.js, no external deps)
    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.convertToMarkdown({ path: inputPath });
      if (result.messages?.length) {
        logEvent('warn', { requestId: req.requestId, mammothWarnings: result.messages });
      }
      return res.json({
        success: true,
        markdown: result.value,
        fileName: fileInfo.originalName,
      });
    }

    // Other formats (PDF, RTF, ODT): try marker_single → Python fallback
    const errors = [];
    let markdown = null;

    try {
      markdown = await runMarkerConversion(inputPath, outputDir, ext);
    } catch (markerErr) {
      errors.push(`marker: ${markerErr.message}`);
    }

    if (!markdown) {
      try {
        markdown = await convertWithPython(inputPath);
      } catch (pyErr) {
        errors.push(`python: ${pyErr.message}`);
      }
    }

    if (!markdown) {
      return sendError(
        res,
        500,
        'CONVERSION_FAILED',
        'Markdown conversion failed.',
        errors.join(' | '),
        req.requestId,
      );
    }

    res.json({
      success: true,
      markdown,
      fileName: fileInfo.originalName,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(
      res,
      500,
      'CONVERSION_FAILED',
      'Markdown conversion failed.',
      error.message,
      req.requestId,
    );
  } finally {
    if (fallbackPath) {
      await safeUnlink(fallbackPath).catch((cleanupError) => {
        logEvent('error', {
          requestId: req.requestId,
          event: 'cleanup_failed',
          target: fallbackPath,
          error: cleanupError.message,
        });
      });
    }
    if (outputDir) {
      await safeRemoveDir(outputDir).catch((cleanupError) => {
        logEvent('error', {
          requestId: req.requestId,
          event: 'cleanup_failed',
          target: outputDir,
          error: cleanupError.message,
        });
      });
    }
  }
});

/**
 * Run marker_single CLI for non-DOCX formats (PDF, RTF, ODT)
 */
async function runMarkerConversion(inputPath, outputDir, ext) {
  const markerProcess = spawn('marker_single', [
    inputPath,
    outputDir,
    '--output_format',
    'markdown',
  ]);

  let stderr = '';
  markerProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  await new Promise((resolve, reject) => {
    markerProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Marker exited with code ${code}: ${stderr}`));
    });
    markerProcess.on('error', (err) => reject(err));
  });

  const expectedName = `${path.basename(inputPath, ext)}.md`;
  const expectedPath = path.join(outputDir, expectedName);
  if (await pathExists(expectedPath)) {
    return fs.readFile(expectedPath, 'utf-8');
  }

  const files = await fs.readdir(outputDir);
  const mdFile = files.find((f) => f.endsWith('.md'));
  if (!mdFile) throw new Error('Marker produced no markdown output.');
  return fs.readFile(path.join(outputDir, mdFile), 'utf-8');
}

/**
 * Fallback Python conversion
 */
async function convertWithPython(inputPath) {
  const pythonScript = path.join(__dirname, 'converters/document_converter.py');
  return runPythonConversion(pythonScript, inputPath);
}

/**
 * Convert Markdown to PDF using Paged.js (Job-based)
 * POST /api/convert/to-pdf
 */
app.post('/api/convert/to-pdf', async (req, res) => {
  try {
    const {
      markdown,
      settings = {},
      documentId,
      layoutProfile,
      printProfile,
      template,
      pressPackId,
      assets,
      metadata,
    } = req.body || {};
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkApiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'Rate limit exceeded.', null, req.requestId);
    }

    const validationError = validateConvertInput({ markdown, assets, metadata });
    if (validationError) {
      return sendError(res, 400, 'INVALID_INPUT', validationError, null, req.requestId);
    }

    const normalizedSettings = {
      ...settings,
      layoutProfile: settings.layoutProfile || layoutProfile || 'symmetric',
      printProfile: settings.printProfile || printProfile || 'pagedjs-a4',
    };
    if (!normalizedSettings.template && template) {
      normalizedSettings.template = template;
    }
    if (!normalizedSettings.pressPackId && pressPackId) {
      normalizedSettings.pressPackId = pressPackId;
    }
    if (assets) {
      normalizedSettings.assets = assets;
    }
    if (metadata) {
      normalizedSettings.metadata = metadata;
    }
    delete normalizedSettings.engine;

    const frontmatter = generateFrontmatter(normalizedSettings);
    const fullContent = frontmatter + markdown;

    const jobId = randomUUID();
    req.jobId = jobId;

    logEvent('info', {
      requestId: req.requestId,
      jobId,
      event: 'convert_pdf_requested',
      userId: auth.userId || null,
      documentId: documentId || null,
      templateKey: normalizedSettings.template || normalizedSettings.templateKey || null,
      layoutProfile: normalizedSettings.layoutProfile,
      printProfile: normalizedSettings.printProfile,
      theme: normalizedSettings.theme || null,
    });
    await jobQueue.add(
      'convert-pdf',
      {
        markdown: fullContent,
        settings: normalizedSettings,
        documentId: documentId || null,
        userId: auth.userId || null,
      },
      { jobId }
    );

    if (jobStoreEnabled) {
      await createJobRecord({
        id: jobId,
        userId: auth.userId,
        type: 'convert-pdf',
        status: 'queued',
        payload: {
          documentId: documentId || null,
          settings: normalizedSettings,
          markdownLength: markdown.length,
        },
      });
      await addJobEvent(jobId, 'queued', 'Job queued');
    }

    logEvent('info', {
      requestId: req.requestId,
      jobId,
      event: 'job_queued',
      type: 'convert-pdf',
    });

    return res.status(202).json({
      jobId,
      status: 'queued',
      statusUrl: `/api/jobs/${jobId}`,
      downloadUrl: `/api/jobs/${jobId}/download`,
      pdfUrl: `/api/jobs/${jobId}/download`,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'CONVERSION_FAILED', 'PDF job creation failed.', error.message, req.requestId);
  }
});

/**
 * Create job
 * POST /api/jobs
 */
app.post('/api/jobs', async (req, res) => {
  try {
    const { type, payload } = req.body || {};
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }
    const allowedTypes = ['convert-md', 'convert-pdf', 'ai-analyze'];

    if (!type || !allowedTypes.includes(type)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Invalid job type.', null, req.requestId);
    }
    if (payload && (typeof payload !== 'object' || Array.isArray(payload))) {
      return sendError(res, 400, 'INVALID_INPUT', 'Payload must be an object.', null, req.requestId);
    }

    const jobId = randomUUID();
    req.jobId = jobId;
    await jobQueue.add(type, payload || {}, { jobId });

    if (jobStoreEnabled) {
      await createJobRecord({
        id: jobId,
        userId: auth.userId,
        type,
        status: 'queued',
        payload: payload || {},
      });
      await addJobEvent(jobId, 'queued', 'Job queued');
    }

    logEvent('info', {
      requestId: req.requestId,
      jobId,
      event: 'job_queued',
      type,
    });

    return res.status(202).json({
      jobId,
      status: 'queued',
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'JOB_CREATE_FAILED', 'Failed to create job.', error.message, req.requestId);
  }
});

/**
 * List jobs
 * GET /api/jobs?status=queued&limit=20&offset=0
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }
    if (!jobStoreEnabled) {
      return res.json({ jobs: [], total: 0, limit: 0, offset: 0 });
    }

    const status = req.query.status ? String(req.query.status) : null;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = Math.max(0, Number(req.query.offset || 0));

    const result = await listJobs({ userId: auth.userId, status, limit, offset });
    return res.json({
      jobs: result.jobs,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'JOB_LIST_FAILED', 'Failed to list jobs.', error.message, req.requestId);
  }
});

/**
 * Get job status
 * GET /api/jobs/:id
 */
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }
    const jobId = req.params.id;
    req.jobId = jobId;
    const result = await getJobSnapshot(jobId, auth.userId);
    if (result?.forbidden) {
      return sendError(res, 403, 'FORBIDDEN', 'Job access denied.', null, req.requestId);
    }
    const snapshot = result?.snapshot;
    if (!snapshot) {
      return sendError(res, 404, 'NOT_FOUND', 'Job not found.', null, req.requestId);
    }

    const events = jobStoreEnabled ? await listJobEvents(jobId, 20) : [];
    const telemetry = buildJobTelemetry({ snapshot, events });
    return res.json({
      jobId,
      status: snapshot.status,
      result: snapshot.result,
      error: snapshot.error,
      events,
      telemetry,
      downloadUrl: `/api/jobs/${jobId}/download`,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'JOB_STATUS_FAILED', 'Failed to read job status.', error.message, req.requestId);
  }
});

/**
 * Retry a failed job
 * POST /api/jobs/:id/retry
 */
app.post('/api/jobs/:id/retry', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }
    const jobId = req.params.id;
    req.jobId = jobId;
    const ownership = await assertJobOwnership(jobId, auth.userId);
    if (ownership.forbidden) {
      return sendError(res, 403, 'FORBIDDEN', 'Job access denied.', null, req.requestId);
    }

    const job = await jobQueue.getJob(jobId);
    if (!job) {
      return sendError(res, 404, 'NOT_FOUND', 'Job not found.', null, req.requestId);
    }

    const state = await job.getState();
    if (state !== 'failed') {
      return sendError(res, 409, 'JOB_NOT_FAILED', 'Only failed jobs can be retried.', null, req.requestId);
    }

    await job.updateData({ ...(job.data || {}), cancelRequested: false });
    await job.retry();

    if (jobStoreEnabled) {
      await updateJobRecord(jobId, { status: 'queued', error_message: null });
      await addJobEvent(jobId, 'queued', 'Job retry queued', { level: 'info' });
    }

    return res.json({ jobId, status: 'queued' });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'JOB_RETRY_FAILED', 'Failed to retry job.', error.message, req.requestId);
  }
});

/**
 * Cancel a job
 * POST /api/jobs/:id/cancel
 */
app.post('/api/jobs/:id/cancel', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }
    const jobId = req.params.id;
    req.jobId = jobId;
    const ownership = await assertJobOwnership(jobId, auth.userId);
    if (ownership.forbidden) {
      return sendError(res, 403, 'FORBIDDEN', 'Job access denied.', null, req.requestId);
    }

    const job = await jobQueue.getJob(jobId);
    if (!job) {
      if (jobStoreEnabled && ownership.record) {
        await updateJobRecord(jobId, { status: 'cancelled', error_message: 'Job cancelled by user.' });
        await addJobEvent(jobId, 'cancelled', 'Job cancelled', { level: 'warn' });
        return res.json({ jobId, status: 'cancelled' });
      }
      return sendError(res, 404, 'NOT_FOUND', 'Job not found.', null, req.requestId);
    }

    const state = await job.getState();
    if (['completed', 'failed', 'cancelled'].includes(state)) {
      return sendError(res, 409, 'JOB_NOT_CANCELLABLE', 'Job cannot be cancelled.', null, req.requestId);
    }

    if (state === 'active') {
      await job.updateData({ ...(job.data || {}), cancelRequested: true });
      if (jobStoreEnabled) {
        await updateJobRecord(jobId, { status: 'cancelled', error_message: 'Job cancelled by user.' });
        await addJobEvent(jobId, 'cancelled', 'Cancellation requested', { level: 'warn' });
      }
      return res.json({ jobId, status: 'cancelled', state: 'active' });
    }

    await job.remove();
    if (jobStoreEnabled) {
      await updateJobRecord(jobId, { status: 'cancelled', error_message: 'Job cancelled by user.' });
      await addJobEvent(jobId, 'cancelled', 'Job cancelled', { level: 'warn' });
    }
    return res.json({ jobId, status: 'cancelled' });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'JOB_CANCEL_FAILED', 'Failed to cancel job.', error.message, req.requestId);
  }
});

/**
 * Download job output (PDF)
 * GET /api/jobs/:id/download
 */
app.get('/api/jobs/:id/download', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }
    const jobId = req.params.id;
    req.jobId = jobId;
    const result = await getJobSnapshot(jobId, auth.userId);
    if (result?.forbidden) {
      return sendError(res, 403, 'FORBIDDEN', 'Job access denied.', null, req.requestId);
    }
    const snapshot = result?.snapshot;
    if (!snapshot) {
      return sendError(res, 404, 'NOT_FOUND', 'Job not found.', null, req.requestId);
    }

    if (snapshot.status !== 'completed') {
      return sendError(res, 409, 'JOB_NOT_READY', 'Job output is not ready.', null, req.requestId);
    }

    const snapshotResult = snapshot.result || {};
    if (snapshotResult.signedUrl && isSignedUrlValid(snapshotResult.signedUrlExpiresAt)) {
      return res.redirect(snapshotResult.signedUrl);
    }

    const storagePath = snapshotResult.storage?.path;
    if (storageEnabled && storagePath) {
      const signedUrlResult = await createPdfSignedUrl({ storagePath });
      if (signedUrlResult?.signedUrl) {
        const nextResult = {
          ...snapshotResult,
          signedUrl: signedUrlResult.signedUrl,
          signedUrlExpiresAt: signedUrlResult.expiresAt,
        };
        if (jobStoreEnabled) {
          await updateJobRecord(jobId, { result: nextResult });
        }
        return res.redirect(signedUrlResult.signedUrl);
      }
    }

    const outputPath = snapshotResult.outputPath;
    if (!outputPath) {
      return sendError(res, 404, 'OUTPUT_MISSING', 'Job output not available.', null, req.requestId);
    }

    const resolvedOutput = path.resolve(outputPath);
    if (!resolvedOutput.startsWith(OUTPUT_ROOT)) {
      return sendError(res, 403, 'FORBIDDEN', 'Invalid output path.', null, req.requestId);
    }

    await fs.stat(resolvedOutput);
    return res.download(resolvedOutput, `document-${jobId}.pdf`);
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'DOWNLOAD_FAILED', 'Failed to download output.', error.message, req.requestId);
  }
});

function buildAnalyzePrompt({ markdown, metadata }) {
  return `You are a Carbon Design System report assistant.\n\n` +
    `Return a JSON response with summary, keyFindings, risks, and layoutSuggestions.\n` +
    `Tone: executive, concise. Avoid jargon and emojis.\n\n` +
    `Metadata: ${JSON.stringify(metadata || {})}\n\n` +
    `Markdown:\n${markdown}\n`;
}

function buildAskPrompt({ question, context }) {
  return `You are a Carbon Design System report assistant.\n\n` +
    `Answer concisely and reference Carbon tokens where relevant.\n\n` +
    `Context:\n${context || ''}\n\n` +
    `Question:\n${question}\n`;
}

function buildMarkdownToCarbonHtmlSystemInstruction() {
  return (
    'You convert Markdown into a production-ready pure HTML string using IBM Carbon Design System v11.\n' +
    'Return HTML only (no Markdown code fences).\n' +
    'Do NOT include <html>, <head>, <body>, <script>, or <style> tags.\n' +
    'No inline CSS. Use semantic HTML and Carbon classes/components where appropriate.\n' +
    'Output must be safe to inject via innerHTML.\n'
  );
}

/**
 * AI analyze proxy
 * POST /api/ai/analyze
 */
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const { markdown, metadata } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return sendError(res, 400, 'INVALID_INPUT', 'Markdown content is required.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkAiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'AI rate limit exceeded.', null, req.requestId);
    }

    const safeMarkdown = redactPii(markdown);
    const prompt = buildAnalyzePrompt({ markdown: safeMarkdown, metadata });
    let output = '';
    let usedModel = GEMINI_MODEL;

    try {
      output = await callGemini({ prompt, model: GEMINI_MODEL });
    } catch (error) {
      // Preserve upstream 429 as our own 429 so the client can show a proper rate-limit message.
      if (Number(error?.status) === 429) {
        res.setHeader('Retry-After', 60);
        return sendError(res, 429, 'UPSTREAM_RATE_LIMITED', 'AI sağlayıcısı oran sınırına ulaştı.', error.message, req.requestId);
      }
      if (GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL) {
        usedModel = GEMINI_FALLBACK_MODEL;
        try {
          output = await callGemini({ prompt, model: GEMINI_FALLBACK_MODEL });
        } catch (fallbackError) {
          if (Number(fallbackError?.status) === 429) {
            res.setHeader('Retry-After', 60);
            return sendError(
              res,
              429,
              'UPSTREAM_RATE_LIMITED',
              'AI sağlayıcısı oran sınırına ulaştı.',
              fallbackError.message,
              req.requestId
            );
          }
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }

    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: auth.userId,
        eventType: 'ai.analyze',
        units: Math.ceil(safeMarkdown.length / 1000),
        source: 'api',
        metadata: {
          requestId: req.requestId,
          promptVersion: AI_PROMPT_VERSION,
          model: usedModel,
        },
      });
    }

    return res.json({
      promptVersion: AI_PROMPT_VERSION,
      model: usedModel,
      output,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'AI_ANALYZE_FAILED', 'AI analyze failed.', error.message, req.requestId);
  }
});

/**
 * AI ask proxy
 * POST /api/ai/ask
 */
app.post('/api/ai/ask', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const { question, context } = req.body || {};
    if (typeof question !== 'string' || !question.trim()) {
      return sendError(res, 400, 'INVALID_INPUT', 'Question is required.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkAiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'AI rate limit exceeded.', null, req.requestId);
    }

    const safeQuestion = redactPii(question);
    const safeContext = redactPii(context || '');
    const prompt = buildAskPrompt({ question: safeQuestion, context: safeContext });
    let output = '';
    let usedModel = GEMINI_MODEL;

    try {
      output = await callGemini({ prompt, model: GEMINI_MODEL });
    } catch (error) {
      // Preserve upstream 429 as our own 429 so the client can show a proper rate-limit message.
      if (Number(error?.status) === 429) {
        res.setHeader('Retry-After', 60);
        return sendError(res, 429, 'UPSTREAM_RATE_LIMITED', 'AI sağlayıcısı oran sınırına ulaştı.', error.message, req.requestId);
      }
      if (GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL) {
        usedModel = GEMINI_FALLBACK_MODEL;
        try {
          output = await callGemini({ prompt, model: GEMINI_FALLBACK_MODEL });
        } catch (fallbackError) {
          if (Number(fallbackError?.status) === 429) {
            res.setHeader('Retry-After', 60);
            return sendError(
              res,
              429,
              'UPSTREAM_RATE_LIMITED',
              'AI sağlayıcısı oran sınırına ulaştı.',
              fallbackError.message,
              req.requestId
            );
          }
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }

    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: auth.userId,
        eventType: 'ai.ask',
        units: Math.ceil((safeQuestion.length + safeContext.length) / 1000),
        source: 'api',
        metadata: {
          requestId: req.requestId,
          promptVersion: AI_PROMPT_VERSION,
          model: usedModel,
        },
      });
    }

    return res.json({
      promptVersion: AI_PROMPT_VERSION,
      model: usedModel,
      output,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'AI_ASK_FAILED', 'AI ask failed.', error.message, req.requestId);
  }
});

/**
 * AI Markdown -> Carbon HTML proxy (HTML string only)
 * POST /api/ai/markdown-to-carbon-html
 */
app.post('/api/ai/markdown-to-carbon-html', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const { markdown, metadata } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return sendError(res, 400, 'INVALID_INPUT', 'Markdown content is required.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkAiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'AI rate limit exceeded.', null, req.requestId);
    }

    const safeMarkdown = redactPii(markdown);
    const resolvedModel = GEMINI_CARBON_HTML_MODEL || GEMINI_MODEL;
    const resolvedFallback = GEMINI_CARBON_HTML_FALLBACK_MODEL || GEMINI_FALLBACK_MODEL || '';
    const systemInstruction =
      GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION || buildMarkdownToCarbonHtmlSystemInstruction();

    const generationConfig = {
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
    };

    let output = '';
    let usedModel = resolvedModel;

    try {
      output = await callGemini({
        prompt: safeMarkdown,
        model: resolvedModel,
        systemInstruction,
        generationConfig,
      });
    } catch (error) {
      if (Number(error?.status) === 429) {
        res.setHeader('Retry-After', 60);
        return sendError(
          res,
          429,
          'UPSTREAM_RATE_LIMITED',
          'AI sağlayıcısı oran sınırına ulaştı.',
          error.message,
          req.requestId
        );
      }

      if (resolvedFallback && resolvedFallback !== resolvedModel) {
        usedModel = resolvedFallback;
        try {
          output = await callGemini({
            prompt: safeMarkdown,
            model: resolvedFallback,
            systemInstruction,
            generationConfig,
          });
        } catch (fallbackError) {
          if (Number(fallbackError?.status) === 429) {
            res.setHeader('Retry-After', 60);
            return sendError(
              res,
              429,
              'UPSTREAM_RATE_LIMITED',
              'AI sağlayıcısı oran sınırına ulaştı.',
              fallbackError.message,
              req.requestId
            );
          }
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }

    const cleaned = sanitizeGeneratedHtml(stripOuterHtmlDocument(stripMarkdownCodeFences(output)));

    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: auth.userId,
        eventType: 'ai.markdown_to_carbon_html',
        units: Math.ceil(safeMarkdown.length / 1000),
        source: 'api',
        metadata: {
          requestId: req.requestId,
          promptVersion: AI_PROMPT_VERSION,
          model: usedModel,
          hasMetadata: Boolean(metadata && typeof metadata === 'object'),
        },
      });
    }

    return res.json({
      promptVersion: AI_PROMPT_VERSION,
      model: usedModel,
      output: cleaned,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(
      res,
      500,
      'AI_MARKDOWN_TO_CARBON_HTML_FAILED',
      'AI markdown-to-carbon-html failed.',
      error.message,
      req.requestId
    );
  }
});

/**
 * List templates (public + system)
 * GET /api/templates
 */
app.get('/api/templates', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return res.json({
        templates: LOCAL_TEMPLATE_FALLBACKS.map(serializeTemplate),
      });
    }

    const templates = await listTemplates({ includeArchived: false });
    if (!templates.length) {
      return res.json({
        templates: LOCAL_TEMPLATE_FALLBACKS.map(serializeTemplate),
      });
    }
    const withPreviews = await attachTemplatePreviews(templates);
    return res.json({
      templates: withPreviews.map(serializeTemplate),
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'TEMPLATE_LIST_FAILED', 'Failed to list templates.', error.message, req.requestId);
  }
});

/**
 * Create template (requires auth)
 * POST /api/templates
 */
app.post('/api/templates', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { key, name, description, status, category, tags, schema, isPublic, isSystem } = req.body || {};
    if (!key || !name) {
      return sendError(res, 400, 'INVALID_INPUT', 'Template key and name are required.', null, req.requestId);
    }

    const result = await createTemplate({
      key,
      name,
      description,
      status,
      category,
      tags,
      schema,
      isPublic,
      isSystem,
      createdBy: auth.userId || null,
    });

    return res.status(201).json({
      template: serializeTemplate({
        ...result.template,
        activeVersion: result.version,
      }),
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'TEMPLATE_CREATE_FAILED', 'Template creation failed.', error.message, req.requestId);
  }
});

/**
 * Update template metadata (requires auth)
 * PATCH /api/templates/:id
 */
app.patch('/api/templates/:id', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const updated = await updateTemplateMetadata(req.params.id, req.body || {});
    return res.json({
      template: serializeTemplate({ ...updated, activeVersion: null }),
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'TEMPLATE_UPDATE_FAILED', 'Template update failed.', error.message, req.requestId);
  }
});

/**
 * Delete/archive template (requires auth)
 * DELETE /api/templates/:id
 */
app.delete('/api/templates/:id', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const hard = String(req.query.hard || '').toLowerCase() === 'true';
    const result = await deleteTemplate(req.params.id, hard);
    return res.json({ success: true, result });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'TEMPLATE_DELETE_FAILED', 'Template delete failed.', error.message, req.requestId);
  }
});

/**
 * Create template version (requires auth)
 * POST /api/templates/:id/versions
 */
app.post('/api/templates/:id/versions', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { schema, notes, activate = true, status } = req.body || {};
    if (!schema) {
      return sendError(res, 400, 'INVALID_INPUT', 'Schema is required.', null, req.requestId);
    }

    const version = await createTemplateVersion({
      templateId: req.params.id,
      schema,
      notes,
      activate: Boolean(activate),
      status,
      createdBy: auth.userId || null,
    });

    return res.status(201).json({ version });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'TEMPLATE_VERSION_FAILED', 'Template version creation failed.', error.message, req.requestId);
  }
});

/**
 * Rollback template version (requires auth)
 * POST /api/templates/:id/rollback
 */
app.post('/api/templates/:id/rollback', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { versionId } = req.body || {};
    if (!versionId) {
      return sendError(res, 400, 'INVALID_INPUT', 'versionId is required.', null, req.requestId);
    }

    if (!requireReviewer(res, auth.userId, req.requestId)) {
      return;
    }

    const result = await rollbackTemplateVersion(req.params.id, versionId);
    return res.json({
      template: serializeTemplate({ ...result.template, activeVersion: null }),
      fromVersion: result.fromVersion,
      toVersion: result.toVersion,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'TEMPLATE_ROLLBACK_FAILED', 'Template rollback failed.', error.message, req.requestId);
  }
});

/**
 * List template versions (requires auth)
 * GET /api/templates/:id/versions
 */
app.get('/api/templates/:id/versions', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const versions = await getTemplateVersions(req.params.id);
    return res.json({ versions });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'TEMPLATE_VERSIONS_FAILED', 'Failed to list template versions.', error.message, req.requestId);
  }
});

/**
 * Update template version status (requires auth)
 * PATCH /api/template-versions/:id/status
 */
app.patch('/api/template-versions/:id/status', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { status } = req.body || {};
    if (!status) {
      return sendError(res, 400, 'INVALID_INPUT', 'Status is required.', null, req.requestId);
    }

    if (['approved', 'published'].includes(status)) {
      if (!requireReviewer(res, auth.userId, req.requestId)) {
        return;
      }
    }

    const version = await setTemplateVersionStatus(req.params.id, status, auth.userId || null);
    return res.json({ version });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'TEMPLATE_VERSION_UPDATE_FAILED', 'Template version update failed.', error.message, req.requestId);
  }
});

/**
 * Generate template preview (requires auth)
 * POST /api/templates/:id/preview
 */
app.post('/api/templates/:id/preview', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { versionId } = req.body || {};
    const jobId = randomUUID();
    await jobQueue.add(
      'template-preview',
      {
        templateId: req.params.id,
        templateVersionId: versionId || null,
        userId: auth.userId || null,
      },
      { jobId }
    );

    return res.status(202).json({
      jobId,
      status: 'queued',
      statusUrl: `/api/jobs/${jobId}`,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'TEMPLATE_PREVIEW_FAILED', 'Template preview job failed.', error.message, req.requestId);
  }
});

/**
 * List press packs
 * GET /api/press-packs?templateVersionId=...
 */
app.get('/api/press-packs', async (req, res) => {
  try {
    if (!pressPackStoreEnabled) {
      return sendError(res, 503, 'PRESS_PACK_DISABLED', 'Press pack store is not configured.', null, req.requestId);
    }
    const templateVersionId = req.query.templateVersionId;
    const pressPacks = await listPressPacks({
      templateVersionId: templateVersionId || null,
    });
    return res.json({ pressPacks });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'PRESS_PACK_LIST_FAILED', 'Failed to list press packs.', error.message, req.requestId);
  }
});

/**
 * Get press pack
 * GET /api/press-packs/:id
 */
app.get('/api/press-packs/:id', async (req, res) => {
  try {
    if (!pressPackStoreEnabled) {
      return sendError(res, 503, 'PRESS_PACK_DISABLED', 'Press pack store is not configured.', null, req.requestId);
    }
    const pressPack = await getPressPackById(req.params.id);
    if (!pressPack) {
      return sendError(res, 404, 'NOT_FOUND', 'Press pack not found.', null, req.requestId);
    }
    return res.json({ pressPack });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'PRESS_PACK_GET_FAILED', 'Failed to get press pack.', error.message, req.requestId);
  }
});

/**
 * Create press pack (requires auth)
 * POST /api/press-packs
 */
app.post('/api/press-packs', async (req, res) => {
  try {
    if (!pressPackStoreEnabled) {
      return sendError(res, 503, 'PRESS_PACK_DISABLED', 'Press pack store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { templateVersionId, manifest, status } = req.body || {};
    if (!templateVersionId || !manifest) {
      return sendError(res, 400, 'INVALID_INPUT', 'templateVersionId and manifest are required.', null, req.requestId);
    }

    const pressPack = await createPressPack({
      templateVersionId,
      manifest,
      status,
      createdBy: auth.userId || null,
    });

    return res.status(201).json({ pressPack });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'PRESS_PACK_CREATE_FAILED', 'Press pack creation failed.', error.message, req.requestId);
  }
});

/**
 * Update press pack status (requires auth)
 * PATCH /api/press-packs/:id
 */
app.patch('/api/press-packs/:id', async (req, res) => {
  try {
    if (!pressPackStoreEnabled) {
      return sendError(res, 503, 'PRESS_PACK_DISABLED', 'Press pack store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { status } = req.body || {};
    if (!status) {
      return sendError(res, 400, 'INVALID_INPUT', 'Status is required.', null, req.requestId);
    }

    if (['approved', 'published'].includes(status)) {
      if (!requireReviewer(res, auth.userId, req.requestId)) {
        return;
      }
    }

    const pressPack = await updatePressPackStatus(req.params.id, status, auth.userId || null);
    return res.json({ pressPack });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'PRESS_PACK_UPDATE_FAILED', 'Press pack update failed.', error.message, req.requestId);
  }
});

/**
 * Create release (requires auth)
 * POST /api/releases
 */
app.post('/api/releases', async (req, res) => {
  try {
    if (!releaseStoreEnabled) {
      return sendError(res, 503, 'RELEASES_DISABLED', 'Release store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const { documentId, templateVersionId, pressPackId, jobId, notes } = req.body || {};
    const release = await createRelease({
      userId: auth.userId || null,
      documentId: documentId || null,
      templateVersionId: templateVersionId || null,
      pressPackId: pressPackId || null,
      sourceJobId: jobId || null,
      notes: notes || null,
    });

    return res.status(201).json({ release });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'RELEASE_CREATE_FAILED', 'Release creation failed.', error.message, req.requestId);
  }
});

/**
 * Get release (requires auth)
 * GET /api/releases/:id
 */
app.get('/api/releases/:id', async (req, res) => {
  try {
    if (!releaseStoreEnabled) {
      return sendError(res, 503, 'RELEASES_DISABLED', 'Release store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const release = await getReleaseById(req.params.id);
    if (!release) {
      return sendError(res, 404, 'NOT_FOUND', 'Release not found.', null, req.requestId);
    }
    if (release.user_id && release.user_id !== auth.userId) {
      return sendError(res, 403, 'FORBIDDEN', 'Release access denied.', null, req.requestId);
    }

    return res.json({ release });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'RELEASE_GET_FAILED', 'Failed to fetch release.', error.message, req.requestId);
  }
});

/**
 * Update release status/notes (requires auth)
 * PATCH /api/releases/:id
 */
app.patch('/api/releases/:id', async (req, res) => {
  try {
    if (!releaseStoreEnabled) {
      return sendError(res, 503, 'RELEASES_DISABLED', 'Release store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const release = await getReleaseById(req.params.id);
    if (!release) {
      return sendError(res, 404, 'NOT_FOUND', 'Release not found.', null, req.requestId);
    }
    if (release.user_id && release.user_id !== auth.userId) {
      return sendError(res, 403, 'FORBIDDEN', 'Release access denied.', null, req.requestId);
    }

    const updates = {};
    if (req.body?.notes !== undefined) updates.notes = req.body.notes;
    if (req.body?.status) {
      if (req.body.status === 'published') {
        return sendError(
          res,
          409,
          'USE_PUBLISH_ENDPOINT',
          'Use the publish endpoint to finalize releases.',
          null,
          req.requestId
        );
      }
      if (req.body.status === 'approved') {
        if (!requireReviewer(res, auth.userId, req.requestId)) {
          return;
        }
      }
      const next = await setReleaseStatus(req.params.id, req.body.status);
      return res.json({ release: next });
    }

    const updated = await updateRelease(req.params.id, updates);
    return res.json({ release: updated });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 400, 'RELEASE_UPDATE_FAILED', 'Release update failed.', error.message, req.requestId);
  }
});

/**
 * Run preflight (requires auth)
 * POST /api/releases/:id/preflight
 */
app.post('/api/releases/:id/preflight', async (req, res) => {
  try {
    if (!releaseStoreEnabled) {
      return sendError(res, 503, 'RELEASES_DISABLED', 'Release store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const release = await getReleaseById(req.params.id);
    if (!release) {
      return sendError(res, 404, 'NOT_FOUND', 'Release not found.', null, req.requestId);
    }
    if (release.user_id && release.user_id !== auth.userId) {
      return sendError(res, 403, 'FORBIDDEN', 'Release access denied.', null, req.requestId);
    }

    const jobId = req.body?.jobId || release.source_job_id;
    if (!jobId) {
      return sendError(res, 400, 'INVALID_INPUT', 'jobId is required for preflight.', null, req.requestId);
    }

    const jobSnapshot = await getJobSnapshot(jobId, auth.userId);
    if (!jobSnapshot?.snapshot) {
      return sendError(res, 404, 'NOT_FOUND', 'Job not found.', null, req.requestId);
    }

    const jobResult = jobSnapshot.snapshot.result || {};
    const qaReport = jobResult.qaReport || jobResult.outputManifest?.qa?.report || null;
    const metadata = jobResult.outputManifest?.metadata || {};
    const storytelling = jobResult.outputManifest?.ai?.storytelling || null;
    const printProfile =
      jobResult.outputManifest?.template?.printProfile || metadata?.printProfile || null;
    const blockViolations =
      jobResult.preflight?.blockCatalogViolations ||
      jobResult.outputManifest?.preflight?.blockCatalogViolations ||
      [];

    const pressPackId = req.body?.pressPackId || release.press_pack_id || jobResult.pressPack?.id || null;
    const pressPack = pressPackId ? await getPressPackById(pressPackId) : null;

    const preflight = evaluatePreflight({
      qaReport,
      qaRules: pressPack?.manifest_json?.qaRules || [],
      contentSchema: pressPack?.manifest_json?.contentSchema || null,
      metadata,
      blockCatalogViolations: blockViolations,
      storytelling,
      patternTags: metadata?.patternTags || [],
      printProfile,
      enforceQualityChecklist: process.env.PREFLIGHT_ENFORCE_QUALITY_CHECKLIST === 'true',
    });

    const outputManifest = jobResult.outputManifest || {};
    const updated = await updateRelease(req.params.id, {
      preflight,
      output_manifest: outputManifest,
      press_pack_id: pressPackId || release.press_pack_id || null,
      source_job_id: jobId,
    });

    return res.json({ release: updated, preflight });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'PREFLIGHT_FAILED', 'Preflight failed.', error.message, req.requestId);
  }
});

/**
 * Publish release (requires auth)
 * POST /api/releases/:id/publish
 */
app.post('/api/releases/:id/publish', async (req, res) => {
  try {
    if (!releaseStoreEnabled) {
      return sendError(res, 503, 'RELEASES_DISABLED', 'Release store is not configured.', null, req.requestId);
    }

    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    const release = await getReleaseById(req.params.id);
    if (!release) {
      return sendError(res, 404, 'NOT_FOUND', 'Release not found.', null, req.requestId);
    }
    if (release.user_id && release.user_id !== auth.userId) {
      return sendError(res, 403, 'FORBIDDEN', 'Release access denied.', null, req.requestId);
    }

    if (!requireReviewer(res, auth.userId, req.requestId)) {
      return;
    }

    const preflightStatus = release.preflight?.status;
    if (preflightStatus !== 'pass') {
      return sendError(res, 409, 'PREFLIGHT_BLOCKED', 'Preflight checks failed.', release.preflight, req.requestId);
    }
    if (PUBLISH_REQUIRE_QUALITY_CHECKLIST) {
      const qualityChecklist = release.preflight?.qualityChecklist || null;
      if (!qualityChecklist) {
        return sendError(
          res,
          409,
          'QUALITY_CHECKLIST_MISSING',
          'Quality checklist is required before publish.',
          null,
          req.requestId
        );
      }
      const failures = (qualityChecklist.items || []).filter((item) => item.status === 'fail');
      if (failures.length) {
        return sendError(
          res,
          409,
          'QUALITY_CHECKLIST_FAILED',
          'Quality checklist checks failed.',
          { failures },
          req.requestId
        );
      }
    }
    if (release.status !== 'approved') {
      return sendError(res, 409, 'RELEASE_NOT_APPROVED', 'Release must be approved before publish.', null, req.requestId);
    }

    const published = await setReleaseStatus(req.params.id, 'published');
    return res.json({ release: published, outputManifest: published.output_manifest || {} });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'RELEASE_PUBLISH_FAILED', 'Release publish failed.', error.message, req.requestId);
  }
});

/**
 * Generate YAML frontmatter from settings
 */
function generateFrontmatter(settings) {
  if (!settings || Object.keys(settings).length === 0) {
    return '';
  }

  const lines = ['---'];

  const docType = settings.docType || settings.documentType;
  if (docType) {
    lines.push(`docType: ${docType}`);
  }
  if (settings.documentType) {
    lines.push(`documentType: ${settings.documentType}`);
  }
  if (settings.audience) {
    lines.push(`audience: ${settings.audience}`);
  }
  if (settings.tone) {
    lines.push(`tone: ${settings.tone}`);
  }
  if (settings.colorScheme) {
    lines.push(`colorScheme: ${settings.colorScheme}`);
  }
  if (settings.layoutStyle) {
    lines.push(`layoutStyle: ${settings.layoutStyle}`);
  }
  if (settings.layoutProfile) {
    lines.push(`layoutProfile: ${settings.layoutProfile}`);
  }
  if (settings.printProfile) {
    lines.push(`printProfile: ${settings.printProfile}`);
  }
  if (settings.theme) {
    lines.push(`theme: ${settings.theme}`);
  }
  if (settings.templateKey) {
    lines.push(`templateKey: ${settings.templateKey}`);
  }
  if (settings.template) {
    lines.push(`template: ${settings.template}`);
  }
  if (settings.locale) {
    lines.push(`locale: ${settings.locale}`);
  }
  if (settings.version !== undefined && settings.version !== null) {
    lines.push(`version: ${settings.version}`);
  }
  if (settings.emphasis && settings.emphasis.length > 0) {
    lines.push(`emphasis: [${settings.emphasis.join(', ')}]`);
  }
  if (settings.components && settings.components.length > 0) {
    lines.push(`components: [${settings.components.join(', ')}]`);
  }

  lines.push('---\n\n');

  return lines.join('\n');
}

/**
 * Import from Google Docs URL
 * POST /api/import/google-docs
 */
app.post('/api/import/google-docs', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.includes('docs.google.com')) {
      return sendError(res, 400, 'INVALID_INPUT', 'Invalid Google Docs URL.', null, req.requestId);
    }

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return sendError(res, 400, 'INVALID_INPUT', 'Document ID not found.', null, req.requestId);
    }

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl);

    if (!response.ok) {
      throw new Error('Google Docs content could not be fetched.');
    }

    const content = await response.text();

    res.json({
      success: true,
      content,
      title: `Google Doc - ${docId}`,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'IMPORT_FAILED', 'Google Docs import failed.', error.message, req.requestId);
  }
});

/**
 * Health check
 */
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

app.get('/api/metrics', async (req, res) => {
  try {
    const authError = await authorizeMetrics(req, res);
    if (authError) {
      return authError;
    }

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

    return res.json({
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
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'METRICS_FAILED', 'Metrics endpoint failed.', error.message, req.requestId);
  }
});

app.get('/api/metrics/dashboard', async (req, res) => {
  try {
    const authError = await authorizeMetrics(req, res);
    if (authError) {
      return authError;
    }

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

    const payload = {
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler — multer errors + generic
app.use((err, req, res, next) => {
  logEvent('error', {
    requestId: req.requestId,
    error: err.message,
  });

  if (err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large (max 50 MB).'
        : `Upload error: ${err.message}`;
    return sendError(res, 400, 'UPLOAD_ERROR', msg, null, req.requestId);
  }

  if (err.message === 'Unsupported file type') {
    return sendError(res, 400, 'UNSUPPORTED_TYPE', err.message, null, req.requestId);
  }

  sendError(res, 500, 'SERVER_ERROR', 'Internal server error.', err.message, req.requestId);
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
