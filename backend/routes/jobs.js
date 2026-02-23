/**
 * Job routes — CRUD for conversion jobs
 */

import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { sendError } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import {
  resolveAuthUser,
  getJobSnapshot,
  assertJobOwnership,
  buildJobTelemetry,
  isSignedUrlValid,
} from '../lib/job-helpers.js';
import { jobQueue } from '../queue.js';
import {
  jobStoreEnabled,
  createJobRecord,
  updateJobRecord,
  addJobEvent,
  listJobEvents,
  listJobs,
} from '../stores/job-store.js';
import {
  storageEnabled,
  createPdfSignedUrl,
} from '../stores/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_ROOT = path.resolve(__dirname, '../../output/jobs');

const router = Router();

/**
 * POST / — Create job
 */
router.post('/', async (req, res) => {
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
 * GET / — List jobs
 */
router.get('/', async (req, res) => {
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
 * GET /:id — Get job status
 */
router.get('/:id', async (req, res) => {
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
 * POST /:id/retry — Retry a failed job
 */
router.post('/:id/retry', async (req, res) => {
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
 * POST /:id/cancel — Cancel a job
 */
router.post('/:id/cancel', async (req, res) => {
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
 * GET /:id/download — Download job output (PDF)
 */
router.get('/:id/download', async (req, res) => {
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

export default router;
