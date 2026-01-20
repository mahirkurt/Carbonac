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
import {
  storageEnabled,
  pdfBucket,
  buildPdfStoragePath,
  uploadPdf,
  createPdfSignedUrl,
} from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = getProjectRoot();
const outputRoot = path.join(projectRoot, 'output', 'jobs');
const tempRoot = path.join(projectRoot, 'output', 'temp', 'jobs');

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

  const layoutProfile = settings.layoutProfile || 'symmetric';
  const printProfile = settings.printProfile || 'pagedjs-a4';
  const theme = settings.theme || 'white';
  const title = settings.title || null;
  const author = settings.author || null;
  const date = settings.date || null;

  const artDirection = await getArtDirection({
    markdown,
    layoutProfile,
    printProfile,
    theme,
  });

  const resolvedLayoutProfile = artDirection.layoutProfile || layoutProfile;
  const resolvedPrintProfile = artDirection.printProfile || printProfile;

  await ensureDir(outputRoot);
  await ensureDir(tempRoot);

  const tempMarkdownPath = path.join(tempRoot, `${job.id}.md`);
  await writeFile(tempMarkdownPath, markdown);

  const outputPath = path.join(outputRoot, `${job.id}.pdf`);
  const resolvedPath = await convertToPaged(tempMarkdownPath, outputPath, {
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    title,
    author,
    date,
    artDirection: artDirection.layoutJson,
    verbose: false,
  });

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

  return {
    outputPath: resolvedPath,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    layoutJson: artDirection.layoutJson,
    downloadUrl: `/api/jobs/${job.id}/download`,
    signedUrl,
    signedUrlExpiresAt,
    storage: storagePath
      ? {
          bucket: pdfBucket,
          path: storagePath,
        }
      : null,
  };
}

const worker = new Worker(
  queueName,
  async (job) => {
    switch (job.name) {
      case 'convert-pdf':
        return await handleConvertPdf(job);
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
