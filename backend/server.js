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
import { jobQueue } from './queue.js';
import { authEnabled, getUserIdFromToken } from './auth.js';
import {
  jobStoreEnabled,
  createJobRecord,
  updateJobRecord,
  addJobEvent,
  getJobRecord,
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const OUTPUT_ROOT = path.resolve(__dirname, '../output/jobs');

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logEvent('info', {
      requestId,
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
    return { userId: null };
  }
  if (!authEnabled) {
    return { userId: null };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { userId: null };
  }
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return { error: 'INVALID_AUTH' };
  }
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

  return {
    snapshot: {
      status,
      result: job.returnvalue || null,
      error,
    },
  };
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
  let fallbackName = null;
  try {
    const { fileUrl, fileType } = req.body || {};
    let fileInfo = req.file;

    if (!fileInfo && fileUrl) {
      fileInfo = await downloadRemoteFile(fileUrl, fileType);
    }

    if (!fileInfo) {
      return sendError(res, 400, 'INVALID_INPUT', 'File is required.', null, req.requestId);
    }

    fallbackPath = fileInfo.path;
    fallbackName = fileInfo.originalName;

    const inputPath = fileInfo.path;
    const outputDir = path.join(__dirname, '../temp/output');
    await fs.mkdir(outputDir, { recursive: true });

    const ext = path.extname(fileInfo.originalName || '').toLowerCase();

    if (ext === '.md' || ext === '.txt') {
      const content = await fs.readFile(inputPath, 'utf-8');
      await fs.unlink(inputPath);
      return res.json({
        success: true,
        markdown: content,
        fileName: fileInfo.originalName,
      });
    }

    const outputPath = path.join(outputDir, `${path.basename(inputPath, ext)}.md`);

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
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Marker process exited with code ${code}: ${stderr}`));
        }
      });

      markerProcess.on('error', (err) => {
        reject(err);
      });
    });

    const files = await fs.readdir(outputDir);
    const mdFile = files.find((f) => f.endsWith('.md'));

    if (!mdFile) {
      throw new Error('Failed to create markdown output.');
    }

    const markdown = await fs.readFile(path.join(outputDir, mdFile), 'utf-8');

    await fs.unlink(inputPath);
    await fs.unlink(path.join(outputDir, mdFile));

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

    try {
      if (fallbackPath) {
        const markdown = await convertWithPython(fallbackPath);
        return res.json({
          success: true,
          markdown,
          fileName: fallbackName || 'document',
        });
      }
    } catch (fallbackError) {
      return sendError(
        res,
        500,
        'CONVERSION_FAILED',
        'Markdown conversion failed.',
        fallbackError.message,
        req.requestId
      );
    }

    return sendError(
      res,
      500,
      'CONVERSION_FAILED',
      'Markdown conversion failed.',
      error.message,
      req.requestId
    );
  }
});

/**
 * Fallback Python conversion
 */
async function convertWithPython(inputPath) {
  const pythonScript = path.join(__dirname, 'converters/document_converter.py');

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [pythonScript, inputPath]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || 'Python conversion failed'));
      }
    });
  });
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
    } = req.body || {};
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    if (!markdown) {
      return sendError(res, 400, 'INVALID_INPUT', 'Markdown content is required.', null, req.requestId);
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
    delete normalizedSettings.engine;

    const frontmatter = generateFrontmatter(normalizedSettings);
    const fullContent = frontmatter + markdown;

    const jobId = randomUUID();
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
    const result = await getJobSnapshot(jobId, auth.userId);
    if (result?.forbidden) {
      return sendError(res, 403, 'FORBIDDEN', 'Job access denied.', null, req.requestId);
    }
    const snapshot = result?.snapshot;
    if (!snapshot) {
      return sendError(res, 404, 'NOT_FOUND', 'Job not found.', null, req.requestId);
    }

    return res.json({
      jobId,
      status: snapshot.status,
      result: snapshot.result,
      error: snapshot.error,
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

/**
 * List templates (public + system)
 * GET /api/templates
 */
app.get('/api/templates', async (req, res) => {
  try {
    if (!templateStoreEnabled) {
      return sendError(res, 503, 'TEMPLATE_STORE_DISABLED', 'Template store is not configured.', null, req.requestId);
    }

    const templates = await listTemplates({ includeArchived: false });
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

    const updated = await setActiveTemplateVersion(req.params.id, versionId);
    return res.json({ template: serializeTemplate({ ...updated, activeVersion: null }) });
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
  if (settings.template) {
    lines.push(`template: ${settings.template}`);
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logEvent('error', {
    requestId: req.requestId,
    error: err.message,
  });
  sendError(res, 500, 'SERVER_ERROR', 'Internal server error.', err.message, req.requestId);
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
