import './env.js';
import { Worker } from 'bullmq';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { jobQueue, queueName, connection, skipVersionCheck } from './queue.js';
import {
  jobStoreEnabled,
  updateJobRecord,
  addJobEvent,
  getJobRecord,
} from './job-store.js';
import { convertToPaged } from '../src/convert-paged.js';
import { ensureDir, getProjectRoot, writeFile } from '../src/utils/file-utils.js';
import { getArtDirection } from '../src/ai/art-director.js';
import { parseMarkdown } from '../src/utils/markdown-parser.js';
import {
  storageEnabled,
  pdfBucket,
  buildPdfStoragePath,
  uploadPdf,
  createPdfSignedUrl,
  templatePreviewEnabled,
  buildTemplatePreviewPath,
  uploadTemplatePreview,
  createTemplatePreviewSignedUrl,
} from './storage.js';
import {
  getTemplateByKey,
  getTemplateById,
  getTemplateVersionById,
  normalizeTemplateSchema,
  createTemplatePreview,
} from './templates-store.js';
import {
  getPressPackById,
  getLatestPressPackForTemplateVersion,
} from './press-pack-store.js';
import { evaluatePreflight } from './preflight.js';
import { usageStoreEnabled, createUsageEvent } from './usage-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = getProjectRoot();
const outputRoot = path.join(projectRoot, 'output', 'jobs');
const tempRoot = path.join(projectRoot, 'output', 'temp', 'jobs');
const templateRoot = path.join(projectRoot, 'output', 'templates');
const templateTempRoot = path.join(projectRoot, 'output', 'temp', 'templates');
const workerConcurrency = Math.max(1, Number(process.env.WORKER_CONCURRENCY || 2));

const JOB_STAGE_PROGRESS = {
  ingest: 5,
  parse: 15,
  plan: 30,
  'render-html': 45,
  paginate: 60,
  postprocess: 70,
  'export-pdf': 80,
  upload: 92,
  complete: 100,
};

const DEFAULT_TEMPLATE_PREVIEW_MARKDOWN = `# Carbon Template Preview

## Executive Summary
Bu sayfa, template onizlemesi icin ornek icerik sunar. Amac; baslik, paragraflar,
liste ve tablo gibi temel ogelerin yerlesimini gostermektir.

## Key Findings
- Gelirler bir onceki ceyrege gore %18 artti.
- EMEA bolgesi toplam buyumenin %42'sini sagladi.
- Maliyet optimizasyonu marjlari 2.1 puan iyilestirdi.

## KPI Tablosu
| Metrix | Q1 | Q2 | Degisim |
| --- | --- | --- | --- |
| Gelir | 12.4M | 14.6M | +18% |
| Marj | 32% | 34.1% | +2.1pt |
| NPS | 41 | 47 | +6 |

## Sonraki Adim
Bir sonraki surumde odak: pazar payi artisi ve kanal optimizasyonu.
`;

class JobCancelledError extends Error {
  constructor(message = 'Job cancelled') {
    super(message);
    this.name = 'JobCancelledError';
    this.code = 'JOB_CANCELLED';
  }
}

async function assertNotCancelled(job) {
  if (!job) return;
  if (job.data?.cancelRequested) {
    throw new JobCancelledError();
  }
  if (jobStoreEnabled) {
    const record = await getJobRecord(job.id);
    if (record?.status === 'cancelled') {
      throw new JobCancelledError();
    }
  }
}

function normalizeBlockType(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function applyBlockCatalog(layoutJson, blockCatalog = []) {
  if (!layoutJson || !Array.isArray(blockCatalog) || blockCatalog.length === 0) {
    return { layoutJson, violations: [] };
  }
  const allowed = new Set(blockCatalog.map((block) => normalizeBlockType(block.blockType)));
  const components = Array.isArray(layoutJson.components) ? layoutJson.components : [];
  const violations = [];
  const filtered = components
    .map((component) => {
      const type = normalizeBlockType(component?.type);
      if (!type || allowed.has(type)) {
        return component;
      }
      if (allowed.has('richtext')) {
        violations.push({ original: component?.type || null, mappedTo: 'RichText' });
        return { ...component, type: 'RichText' };
      }
      violations.push({ original: component?.type || null, dropped: true });
      return null;
    })
    .filter(Boolean);
  return {
    layoutJson: { ...layoutJson, components: filtered },
    violations,
  };
}

function buildOutputManifest({
  jobId,
  documentId,
  userId,
  templateMeta,
  pressPack,
  metadata,
  ai,
  qaReport,
  preflight,
  postprocess,
  storagePath,
  signedUrl,
  signedUrlExpiresAt,
}) {
  return {
    schemaVersion: 'v1.0',
    generatedAt: new Date().toISOString(),
    jobId,
    documentId,
    userId,
    template: templateMeta
      ? {
          key: templateMeta.key,
          templateId: templateMeta.templateId,
          versionId: templateMeta.versionId,
          layoutProfile: templateMeta.layoutProfile,
          printProfile: templateMeta.printProfile,
          theme: templateMeta.theme,
        }
      : null,
    pressPack: pressPack
      ? {
          id: pressPack.id,
          version: pressPack.version,
          status: pressPack.status,
          hash: pressPack.hash || pressPack.manifest_json?.metadata?.hash || null,
          templateVersionId: pressPack.template_version_id,
        }
      : null,
    ai: ai || null,
    metadata: metadata || null,
    qa: {
      report: qaReport || null,
      summary: preflight?.qaSummary || null,
      accessibilitySummary: preflight?.accessibilitySummary || null,
    },
    preflight: preflight || null,
    postprocess: postprocess || null,
    artifacts: {
      pdf: storagePath
        ? { bucket: pdfBucket, path: storagePath, signedUrl, signedUrlExpiresAt }
        : null,
    },
  };
}

function mergeStringList(primary = [], secondary = []) {
  const merged = new Set();
  [...primary, ...secondary].forEach((item) => {
    if (typeof item === 'string' && item.trim()) {
      merged.add(item.trim());
    }
  });
  return Array.from(merged);
}

function mergeLayoutJson(aiLayout, templateLayout = null, templateMeta = null) {
  if (!templateLayout || typeof templateLayout !== 'object') {
    return { ...aiLayout, template: templateMeta || null };
  }

  const merged = { ...aiLayout };
  if (!merged.gridSystem && templateLayout.gridSystem) {
    merged.gridSystem = templateLayout.gridSystem;
  }
  if (
    Array.isArray(templateLayout.components) &&
    templateLayout.components.length &&
    (!Array.isArray(merged.components) || merged.components.length === 0)
  ) {
    merged.components = templateLayout.components;
  }
  if (templateLayout.storytelling && !merged.storytelling) {
    merged.storytelling = templateLayout.storytelling;
  }
  if (templateLayout.styleHints) {
    merged.styleHints = {
      ...merged.styleHints,
      avoidBreakSelectors: mergeStringList(
        merged.styleHints?.avoidBreakSelectors || [],
        templateLayout.styleHints.avoidBreakSelectors || []
      ),
      forceBreakSelectors: mergeStringList(
        merged.styleHints?.forceBreakSelectors || [],
        templateLayout.styleHints.forceBreakSelectors || []
      ),
    };
  }
  merged.template = templateMeta || null;

  return merged;
}

async function recordJobStatus(job, status, updates = {}, message = null, event = {}) {
  if (!jobStoreEnabled || !job) return;
  await updateJobRecord(job.id, { status, ...updates });
  await addJobEvent(job.id, status, message, event);
}

async function reportStage(job, stage, message, progress = null, options = {}) {
  if (!job) return;
  const resolvedProgress =
    Number.isFinite(progress) ? Math.round(progress) : JOB_STAGE_PROGRESS[stage];
  if (Number.isFinite(resolvedProgress) && typeof job.updateProgress === 'function') {
    await job.updateProgress(resolvedProgress).catch(() => null);
  }
  if (!jobStoreEnabled) return;
  await addJobEvent(job.id, options.status || 'processing', message || stage, {
    stage,
    progress: Number.isFinite(resolvedProgress) ? resolvedProgress : null,
    level: options.level || 'info',
    metadata: options.metadata || null,
  });
}

async function convertWithPython(inputPath) {
  const pythonScript = path.join(__dirname, 'converters', 'document_converter.py');

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

async function handleConvertMarkdown(job) {
  const { filePath, fileName, markdown } = job.data || {};
  await assertNotCancelled(job);
  await reportStage(job, 'ingest', 'Markdown ingest started');

  if (markdown && typeof markdown === 'string') {
    await assertNotCancelled(job);
    await reportStage(job, 'parse', 'Markdown payload received', 30);
    await reportStage(job, 'complete', 'Markdown ready', 100, { status: 'completed' });
    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: job.data?.userId || null,
        eventType: 'convert.md',
        units: 1,
        source: 'worker',
        metadata: {
          jobId: job.id,
          fileName: fileName || null,
        },
      }).catch(() => null);
    }
    return { markdown, fileName: fileName || 'document.md' };
  }

  if (!filePath) {
    throw new Error('Missing filePath for convert-md job.');
  }

  await reportStage(job, 'parse', 'Converting source document', 25);
  await assertNotCancelled(job);

  const ext = path.extname(filePath || '').toLowerCase();
  if (ext === '.md' || ext === '.txt') {
    const content = await fs.readFile(filePath, 'utf-8');
    await reportStage(job, 'complete', 'Markdown ready', 100, { status: 'completed' });
    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: job.data?.userId || null,
        eventType: 'convert.md',
        units: 1,
        source: 'worker',
        metadata: {
          jobId: job.id,
          fileName: fileName || path.basename(filePath),
        },
      }).catch(() => null);
    }
    return { markdown: content, fileName: fileName || path.basename(filePath) };
  }

  const jobTempDir = path.join(tempRoot, job.id, 'convert-md');
  await ensureDir(jobTempDir);
  const outputDir = path.join(jobTempDir, 'marker');
  await ensureDir(outputDir);

  try {
    const markerProcess = spawn('marker_single', [
      filePath,
      outputDir,
      '--output_format',
      'markdown',
    ]);

    let stderr = '';
    await new Promise((resolve, reject) => {
      markerProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      markerProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Marker process exited with code ${code}: ${stderr}`));
        }
      });
      markerProcess.on('error', (error) => {
        reject(error);
      });
    });

    const files = await fs.readdir(outputDir);
    const mdFile = files.find((item) => item.endsWith('.md'));
    if (!mdFile) {
      throw new Error('Marker did not produce markdown output.');
    }
    const content = await fs.readFile(path.join(outputDir, mdFile), 'utf-8');
    await reportStage(job, 'complete', 'Markdown ready', 100, { status: 'completed' });
    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: job.data?.userId || null,
        eventType: 'convert.md',
        units: 1,
        source: 'worker',
        metadata: {
          jobId: job.id,
          fileName: fileName || mdFile,
        },
      }).catch(() => null);
    }
    return { markdown: content, fileName: fileName || mdFile };
  } catch (error) {
    const fallback = await convertWithPython(filePath);
    await reportStage(job, 'complete', 'Markdown ready', 100, { status: 'completed' });
    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: job.data?.userId || null,
        eventType: 'convert.md',
        units: 1,
        source: 'worker',
        metadata: {
          jobId: job.id,
          fileName: fileName || path.basename(filePath),
        },
      }).catch(() => null);
    }
    return { markdown: fallback, fileName: fileName || path.basename(filePath) };
  }
}

async function handleConvertPdf(job) {
  const { markdown, settings = {} } = job.data || {};
  const userId = job.data?.userId || null;
  const documentId = job.data?.documentId || null;
  await assertNotCancelled(job);
  if (!markdown) {
    throw new Error('Missing markdown content.');
  }

  await reportStage(job, 'ingest', 'Markdown ingest started');

  const parsedMarkdown = parseMarkdown(markdown);
  const metadata = parsedMarkdown?.metadata || {};

  await reportStage(job, 'parse', 'Markdown parsed');
  await assertNotCancelled(job);

  const templateKey = settings.template || null;
  let templateSchema = null;
  let templateMeta = null;
  if (templateKey) {
    try {
      const templateResult = await getTemplateByKey(templateKey);
      if (templateResult?.version) {
        templateSchema = templateResult.version.schema_json || null;
        templateMeta = {
          key: templateResult.template.key,
          templateId: templateResult.template.id,
          versionId: templateResult.version.id,
          layoutProfile: templateResult.version.layout_profile || null,
          printProfile: templateResult.version.print_profile || null,
          theme: templateResult.version.theme || null,
        };
      } else {
        console.warn(`[worker] Template not found: ${templateKey}`);
      }
    } catch (error) {
      console.warn(`[worker] Template lookup failed: ${error.message}`);
    }
  }

  const pressPackId = settings.pressPackId || settings.pressPack || null;
  let pressPack = null;
  if (pressPackId) {
    try {
      pressPack = await getPressPackById(pressPackId);
    } catch (error) {
      console.warn(`[worker] Press pack lookup failed: ${error.message}`);
    }
  }

  const templateDefaults = normalizeTemplateSchema(templateSchema);
  const templateLayoutProfile =
    templateDefaults.layoutProfile || templateMeta?.layoutProfile || null;
  const templatePrintProfile =
    templateDefaults.printProfile || templateMeta?.printProfile || null;
  const templateTheme = templateDefaults.theme || templateMeta?.theme || null;
  const layoutProfile = settings.layoutProfile || templateLayoutProfile || 'symmetric';
  const printProfile = settings.printProfile || templatePrintProfile || 'pagedjs-a4';
  const theme = settings.theme || templateTheme || 'white';
  const title = settings.title || null;
  const author = settings.author || null;
  const date = settings.date || null;

  const artDirection = await getArtDirection({
    markdown,
    layoutProfile,
    printProfile,
    theme,
  });

  await reportStage(job, 'plan', 'AI layout plan ready');
  await assertNotCancelled(job);

  if (!pressPack && templateMeta?.versionId) {
    try {
      pressPack = await getLatestPressPackForTemplateVersion(templateMeta.versionId, {
        status: 'approved',
      });
    } catch (error) {
      console.warn(`[worker] Press pack lookup failed: ${error.message}`);
    }
  }

  const resolvedLayoutProfile = artDirection.layoutProfile || layoutProfile;
  const resolvedPrintProfile = artDirection.printProfile || printProfile;
  const mergedLayoutJson = mergeLayoutJson(artDirection.layoutJson, templateSchema, templateMeta);
  const blockCatalog = pressPack?.manifest_json?.blockCatalog || [];
  const blockCatalogResult = applyBlockCatalog(mergedLayoutJson, blockCatalog);
  const pressPackTokens = pressPack?.manifest_json?.tokens || null;

  await ensureDir(outputRoot);
  await ensureDir(tempRoot);

  const jobTempDir = path.join(tempRoot, job.id);
  await ensureDir(jobTempDir);
  const tempMarkdownPath = path.join(jobTempDir, 'source.md');
  await writeFile(tempMarkdownPath, markdown);

  const outputPath = path.join(outputRoot, `${job.id}.pdf`);
  const artifacts = {
    renderHtmlPath: path.join(jobTempDir, 'render.html'),
    pagedHtmlPath: path.join(jobTempDir, 'paged.html'),
    qaScreenshotPath: path.join(jobTempDir, 'qa.png'),
    qaReportPath: path.join(jobTempDir, 'qa-report.json'),
    qaReportHtmlPath: path.join(jobTempDir, 'qa-report.html'),
    previewScreenshotPath: path.join(jobTempDir, 'preview.png'),
  };
  const conversionResult = await convertToPaged(tempMarkdownPath, outputPath, {
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    title,
    author,
    date,
    artDirection: blockCatalogResult.layoutJson,
    tokens: {
      templateKey: templateMeta?.key || templateKey || null,
      overrides: pressPackTokens,
    },
    verbose: false,
    artifacts,
    preview: {
      screenshotPath: artifacts.previewScreenshotPath,
      selector: '.pagedjs_page',
    },
    qa: {
      screenshotPath: artifacts.qaScreenshotPath,
      baselineKey: documentId || templateMeta?.versionId || job.id,
    },
    postprocess: {
      enabled: true,
      pdfaReady: true,
      status: metadata.status || null,
    },
    onStage: async (stage) => {
      const messageMap = {
        'render-html': 'HTML render hazır',
        paginate: 'Paged.js sayfalama tamamlandı',
        postprocess: 'PDF postprocess tamamlandı',
        'export-pdf': 'PDF export tamamlandı',
      };
      await reportStage(job, stage, messageMap[stage] || stage);
    },
    returnResult: true,
  });

  const resolvedPath = conversionResult?.outputPath || outputPath;
  const qaReport = conversionResult?.qaReport || null;
  const postprocess = conversionResult?.postprocess || null;

  await fs.unlink(tempMarkdownPath).catch(() => null);

  await assertNotCancelled(job);

  let signedUrl = null;
  let signedUrlExpiresAt = null;
  let storagePath = null;
  if (storageEnabled) {
    storagePath = buildPdfStoragePath({ userId, documentId, jobId: job.id });
    await uploadPdf({ filePath: resolvedPath, storagePath });
    const signedUrlResult = await createPdfSignedUrl({ storagePath });
    signedUrl = signedUrlResult?.signedUrl || null;
    signedUrlExpiresAt = signedUrlResult?.expiresAt || null;
    await reportStage(job, 'upload', 'Output uploaded');
  }

  const preflight = evaluatePreflight({
    qaReport,
    qaRules: pressPack?.manifest_json?.qaRules || [],
    contentSchema: pressPack?.manifest_json?.contentSchema || null,
    metadata,
    blockCatalogViolations: blockCatalogResult.violations || [],
    storytelling: blockCatalogResult.layoutJson?.storytelling || null,
    patternTags: metadata?.patternTags || [],
    printProfile: resolvedPrintProfile,
    enforceQualityChecklist: process.env.PREFLIGHT_ENFORCE_QUALITY_CHECKLIST === 'true',
  });

  const aiSummary = {
    ...(blockCatalogResult.layoutJson?.ai || {}),
    promptVersion: artDirection.promptVersion || null,
    models: artDirection.models || null,
    source: artDirection.source || null,
    storytelling: blockCatalogResult.layoutJson?.storytelling || null,
  };

  if (jobStoreEnabled) {
    const blockingCount = preflight.blockingIssues?.length || 0;
    const missingCount = preflight.contentMissing?.length || 0;
    const blockCount = preflight.blockCatalogViolations?.length || 0;
    const message =
      preflight.status === 'pass'
        ? 'Preflight passed'
        : `Preflight failed: ${blockingCount} blocking, ${missingCount} missing fields, ${blockCount} block issues.`;
    await reportStage(job, 'postprocess', message, null, {
      metadata: { preflightStatus: preflight.status },
    }).catch(() => null);
  }

  const outputManifest = buildOutputManifest({
    jobId: job.id,
    documentId,
    userId,
    templateMeta,
    pressPack,
    metadata,
    ai: aiSummary,
    qaReport,
    preflight,
    postprocess,
    storagePath,
    signedUrl,
    signedUrlExpiresAt,
  });

  await reportStage(job, 'complete', 'Job artifacts ready', 100, { status: 'completed' });

  if (usageStoreEnabled) {
    await createUsageEvent({
      userId,
      eventType: 'convert.pdf',
      units: 1,
      source: 'worker',
      metadata: {
        jobId: job.id,
        documentId,
        templateKey: templateMeta?.key || templateKey || null,
        layoutProfile: resolvedLayoutProfile,
        printProfile: resolvedPrintProfile,
        theme,
        preflightStatus: preflight.status || null,
      },
    }).catch(() => null);
  }

  return {
    outputPath: resolvedPath,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    layoutJson: blockCatalogResult.layoutJson,
    downloadUrl: `/api/jobs/${job.id}/download`,
    signedUrl,
    signedUrlExpiresAt,
    qaReport,
    postprocess,
    template: templateMeta,
    pressPack: pressPack
      ? {
          id: pressPack.id,
          version: pressPack.version,
          status: pressPack.status,
          hash: pressPack.hash || null,
          templateVersionId: pressPack.template_version_id,
        }
      : null,
    preflight,
    outputManifest,
    storage: storagePath
      ? {
          bucket: pdfBucket,
          path: storagePath,
        }
      : null,
  };
}

async function handleTemplatePreview(job) {
  const { templateId, templateVersionId, userId } = job.data || {};
  await assertNotCancelled(job);
  let templateRecord = null;
  if (templateId) {
    templateRecord = await getTemplateById(templateId);
  }

  let templateVersion = null;
  if (templateVersionId) {
    templateVersion = await getTemplateVersionById(templateVersionId);
  }
  if (!templateVersion) {
    templateVersion = templateRecord?.version || null;
  }
  if (!templateVersion) {
    throw new Error('Template version not found.');
  }

  const templateKey = templateRecord?.template?.key || `template-${templateVersion.template_id}`;
  const templateSchema = templateVersion.schema_json || {};
  const defaults = normalizeTemplateSchema(templateSchema);
  const layoutProfile = defaults.layoutProfile || templateVersion.layout_profile || 'symmetric';
  const printProfile = defaults.printProfile || templateVersion.print_profile || 'pagedjs-a4';
  const theme = defaults.theme || templateVersion.theme || 'white';

  await ensureDir(templateRoot);
  await ensureDir(templateTempRoot);

  const tempMarkdownPath = path.join(templateTempRoot, `${job.id}.md`);
  const previewMarkdown = templateSchema.previewMarkdown || DEFAULT_TEMPLATE_PREVIEW_MARKDOWN;
  await writeFile(tempMarkdownPath, previewMarkdown);

  const pdfPath = path.join(templateRoot, `${job.id}.pdf`);
  const pngPath = path.join(templateRoot, `${job.id}.png`);

  await convertToPaged(tempMarkdownPath, pdfPath, {
    layoutProfile,
    printProfile,
    theme,
    artDirection: templateSchema,
    tokens: {
      templateKey,
    },
    qa: { enabled: false, useGemini: false },
    preview: {
      screenshotPath: pngPath,
      selector: '.pagedjs_page',
    },
    verbose: false,
    returnResult: true,
  });

  await fs.unlink(tempMarkdownPath).catch(() => null);

  let storagePath = null;
  let signedUrl = null;
  let signedUrlExpiresAt = null;
  if (templatePreviewEnabled) {
    storagePath = buildTemplatePreviewPath({
      templateKey,
      versionId: templateVersion.id,
      format: 'png',
    });
    await uploadTemplatePreview({ filePath: pngPath, storagePath });
    await createTemplatePreview({
      templateVersionId: templateVersion.id,
      storagePath,
      format: 'png',
      createdBy: userId || null,
    });
    const signed = await createTemplatePreviewSignedUrl({ storagePath });
    signedUrl = signed?.signedUrl || null;
    signedUrlExpiresAt = signed?.expiresAt || null;
  }

  await fs.unlink(pngPath).catch(() => null);
  await fs.unlink(pdfPath).catch(() => null);

  return {
    templateId: templateRecord?.template?.id || templateId || null,
    templateVersionId: templateVersion.id,
    layoutProfile,
    printProfile,
    theme,
    preview: {
      storagePath,
      signedUrl,
      signedUrlExpiresAt,
    },
  };
}

const worker = new Worker(
  queueName,
  async (job) => {
    switch (job.name) {
      case 'convert-md':
        return await handleConvertMarkdown(job);
      case 'convert-pdf':
        return await handleConvertPdf(job);
      case 'template-preview':
        return await handleTemplatePreview(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  },
  { connection, skipVersionCheck, concurrency: workerConcurrency }
);

worker.on('active', (job) => {
  recordJobStatus(
    job,
    'processing',
    { attempts: job.attemptsMade + 1 },
    'Job processing started'
  ).catch(() => null);
});

worker.on('completed', (job) => {
  console.log(`[worker] Job completed: ${job.id}`);
  recordJobStatus(job, 'completed', { result: job.returnvalue || {} }, 'Job completed').catch(
    () => null
  );
});

worker.on('failed', (job, error) => {
  if (error?.code === 'JOB_CANCELLED' || error?.name === 'JobCancelledError') {
    console.warn(`[worker] Job cancelled: ${job?.id} - ${error.message}`);
    recordJobStatus(
      job,
      'cancelled',
      { error_message: error.message },
      'Job cancelled'
    ).catch(() => null);
    return;
  }

  console.error(`[worker] Job failed: ${job?.id} - ${error.message}`);
  recordJobStatus(
    job,
    'failed',
    { error_message: error.message },
    'Job failed'
  ).catch(() => null);
});

process.on('SIGINT', async () => {
  await worker.close();
  await jobQueue.close();
  await connection.quit();
  process.exit(0);
});
