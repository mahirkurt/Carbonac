import './env.js';
import { Worker } from 'bullmq';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { jobQueue, queueName, connection, skipVersionCheck } from './queue.js';
import { jobStoreEnabled, updateJobRecord, addJobEvent } from './job-store.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = getProjectRoot();
const outputRoot = path.join(projectRoot, 'output', 'jobs');
const tempRoot = path.join(projectRoot, 'output', 'temp', 'jobs');
const templateRoot = path.join(projectRoot, 'output', 'templates');
const templateTempRoot = path.join(projectRoot, 'output', 'temp', 'templates');

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
  qaReport,
  preflight,
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
    metadata: metadata || null,
    qa: {
      report: qaReport || null,
      summary: preflight?.qaSummary || null,
      accessibilitySummary: preflight?.accessibilitySummary || null,
    },
    preflight: preflight || null,
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

async function recordJobStatus(job, status, updates = {}, message = null) {
  if (!jobStoreEnabled || !job) return;
  await updateJobRecord(job.id, { status, ...updates });
  await addJobEvent(job.id, status, message);
}

async function handleConvertPdf(job) {
  const { markdown, settings = {} } = job.data || {};
  const userId = job.data?.userId || null;
  const documentId = job.data?.documentId || null;
  if (!markdown) {
    throw new Error('Missing markdown content.');
  }

  const parsedMarkdown = parseMarkdown(markdown);
  const metadata = parsedMarkdown?.metadata || {};

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

  await ensureDir(outputRoot);
  await ensureDir(tempRoot);

  const tempMarkdownPath = path.join(tempRoot, `${job.id}.md`);
  await writeFile(tempMarkdownPath, markdown);

  const outputPath = path.join(outputRoot, `${job.id}.pdf`);
  const conversionResult = await convertToPaged(tempMarkdownPath, outputPath, {
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    title,
    author,
    date,
    artDirection: blockCatalogResult.layoutJson,
    verbose: false,
    returnResult: true,
  });

  const resolvedPath = conversionResult?.outputPath || outputPath;
  const qaReport = conversionResult?.qaReport || null;

  await fs.unlink(tempMarkdownPath).catch(() => null);

  let signedUrl = null;
  let signedUrlExpiresAt = null;
  let storagePath = null;
  if (storageEnabled) {
    storagePath = buildPdfStoragePath({ userId, documentId, jobId: job.id });
    await uploadPdf({ filePath: resolvedPath, storagePath });
    const signedUrlResult = await createPdfSignedUrl({ storagePath });
    signedUrl = signedUrlResult?.signedUrl || null;
    signedUrlExpiresAt = signedUrlResult?.expiresAt || null;
  }

  const preflight = evaluatePreflight({
    qaReport,
    qaRules: pressPack?.manifest_json?.qaRules || [],
    contentSchema: pressPack?.manifest_json?.contentSchema || null,
    metadata,
    blockCatalogViolations: blockCatalogResult.violations || [],
  });

  if (jobStoreEnabled) {
    const blockingCount = preflight.blockingIssues?.length || 0;
    const missingCount = preflight.contentMissing?.length || 0;
    const blockCount = preflight.blockCatalogViolations?.length || 0;
    const message =
      preflight.status === 'pass'
        ? 'Preflight passed'
        : `Preflight failed: ${blockingCount} blocking, ${missingCount} missing fields, ${blockCount} block issues.`;
    await addJobEvent(job.id, 'preflight', message).catch(() => null);
  }

  const outputManifest = buildOutputManifest({
    jobId: job.id,
    documentId,
    userId,
    templateMeta,
    pressPack,
    metadata,
    qaReport,
    preflight,
    storagePath,
    signedUrl,
    signedUrlExpiresAt,
  });

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
      case 'convert-pdf':
        return await handleConvertPdf(job);
      case 'template-preview':
        return await handleTemplatePreview(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  },
  { connection, skipVersionCheck }
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
