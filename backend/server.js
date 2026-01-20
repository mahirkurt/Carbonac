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
import { storageEnabled, createPdfSignedUrl } from './storage.js';

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
    const { markdown, settings = {}, documentId, layoutProfile, printProfile, template } = req.body || {};
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
      theme: settings.theme || 'white',
    };
    if (!normalizedSettings.template && template) {
      normalizedSettings.template = template;
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
 * Generate YAML frontmatter from settings
 */
function generateFrontmatter(settings) {
  if (!settings || Object.keys(settings).length === 0) {
    return '';
  }

  const lines = ['---'];

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
