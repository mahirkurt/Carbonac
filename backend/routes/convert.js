/**
 * Conversion routes — POST /api/convert/to-markdown, /to-pdf
 */

import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import mammoth from 'mammoth';
import { upload, validateFileMagicBytes, downloadRemoteFile } from '../lib/upload.js';
import { sendError, safeUnlink, safeRemoveDir, runPythonConversion } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import { resolveAuthUser, validateConvertInput, generateFrontmatter } from '../lib/job-helpers.js';
import { getRateKey, checkApiRateLimit } from '../middleware/rate-limit.js';
import { jobQueue } from '../queue.js';
import {
  jobStoreEnabled,
  createJobRecord,
  addJobEvent,
} from '../stores/job-store.js';
import { sanitizeMarkdownContent } from '../../src/utils/markdown-cleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * Mammoth style-to-markdown mapping.
 * Maps Word/Pandoc/LibreOffice paragraph styles to semantic markdown elements.
 * Mammoth's default only recognizes Heading1-6; everything else becomes plain text.
 */
const MAMMOTH_STYLE_MAP = [
  // --- Document metadata styles ---
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Author'] => p:fresh",
  "p[style-name='Date'] => p:fresh",
  "p[style-name='Abstract'] => blockquote:fresh",

  // --- Heading styles (explicit, ensures all variants) ---
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='TOC Heading'] => h2:fresh",

  // --- Body text styles ---
  "p[style-name='First Paragraph'] => p:fresh",
  "p[style-name='Body Text'] => p:fresh",
  "p[style-name='Body Text 2'] => p:fresh",
  "p[style-name='Body Text 3'] => p:fresh",
  "p[style-name='Compact'] => p:fresh",
  "p[style-name='Normal'] => p:fresh",
  "p[style-name='No Spacing'] => p:fresh",

  // --- Block styles ---
  "p[style-name='Block Text'] => blockquote:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh",

  // --- List styles ---
  "p[style-name='List Paragraph'] => p:fresh",
  "p[style-name='List Bullet'] => ul > li:fresh",
  "p[style-name='List Number'] => ol > li:fresh",

  // --- Caption / Figure / Footnote ---
  "p[style-name='Caption'] => p:fresh",
  "p[style-name='Table Caption'] => p:fresh",
  "p[style-name='Image Caption'] => p:fresh",
  "p[style-name='Figure'] => p:fresh",
  "p[style-name='Footnote Text'] => p:fresh",

  // --- Academic / Reference ---
  "p[style-name='Bibliography'] => p:fresh",
  "p[style-name='Definition Term'] => p:fresh",
  "p[style-name='Definition'] => p:fresh",

  // --- Character styles ---
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Intense Emphasis'] => strong > em",
  "r[style-name='Verbatim Char'] => code",
  "r[style-name='Source Code'] => code",
];

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
  if (await fs.access(expectedPath).then(() => true).catch(() => false)) {
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
  const pythonScript = path.join(__dirname, '../converters/document_converter.py');
  return runPythonConversion(pythonScript, inputPath);
}

/**
 * POST /to-markdown
 */
router.post('/to-markdown', upload.single('file'), async (req, res) => {
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

    // multer uses originalname (lowercase), downloadRemoteFile uses originalName
    const originalName = fileInfo.originalname || fileInfo.originalName || '';
    fallbackPath = fileInfo.path;

    const inputPath = fileInfo.path;
    const inputExt = path.extname(originalName).toLowerCase();
    const magicValid = await validateFileMagicBytes(inputPath, inputExt).catch(() => false);
    if (!magicValid) {
      return sendError(res, 400, 'INVALID_FILE', 'File content does not match its extension.', null, req.requestId);
    }
    outputDir = path.join(__dirname, '../../temp/output', req.requestId || randomUUID());
    await fs.mkdir(outputDir, { recursive: true });

    const ext = path.extname(originalName).toLowerCase();

    if (ext === '.md' || ext === '.txt') {
      const content = await fs.readFile(inputPath, 'utf-8');
      const cleanupResult = sanitizeMarkdownContent(content, {
        keepSoftHyphen: req.body?.keepSoftHyphen === true,
      });
      return res.json({
        success: true,
        markdown: cleanupResult.text,
        cleanup: cleanupResult.stats,
        fileName: originalName,
      });
    }

    // DOCX/DOC: use mammoth with comprehensive style mapping
    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.convertToMarkdown({
        path: inputPath,
        styleMap: MAMMOTH_STYLE_MAP,
      });
      if (result.messages?.length) {
        logEvent('warn', { requestId: req.requestId, mammothWarnings: result.messages });
      }
      const cleanupResult = sanitizeMarkdownContent(result.value, {
        keepSoftHyphen: req.body?.keepSoftHyphen === true,
      });
      return res.json({
        success: true,
        markdown: cleanupResult.text,
        cleanup: cleanupResult.stats,
        fileName: originalName,
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

    const cleanupResult = sanitizeMarkdownContent(markdown, {
      keepSoftHyphen: req.body?.keepSoftHyphen === true,
    });

    res.json({
      success: true,
      markdown: cleanupResult.text,
      cleanup: cleanupResult.stats,
      fileName: originalName,
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
 * POST /to-pdf
 */
router.post('/to-pdf', async (req, res) => {
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

export default router;
