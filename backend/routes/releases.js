/**
 * Release routes — CRUD + preflight + publish
 */

import { Router } from 'express';
import { sendError, requireReviewer } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import { resolveAuthUser, getJobSnapshot } from '../lib/job-helpers.js';
import { authEnabled } from '../auth.js';
import {
  releaseStoreEnabled,
  createRelease,
  getReleaseById,
  updateRelease,
  setReleaseStatus,
} from '../stores/release-store.js';
import { getPressPackById } from '../stores/press-pack-store.js';
import { evaluatePreflight } from '../preflight.js';

const PUBLISH_REQUIRE_QUALITY_CHECKLIST =
  process.env.PUBLISH_REQUIRE_QUALITY_CHECKLIST === 'true';

const router = Router();

/**
 * POST / — Create release
 */
router.post('/', async (req, res) => {
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
 * GET /:id — Get release
 */
router.get('/:id', async (req, res) => {
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
 * PATCH /:id — Update release status/notes
 */
router.patch('/:id', async (req, res) => {
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
 * POST /:id/preflight — Run preflight checks
 */
router.post('/:id/preflight', async (req, res) => {
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
 * POST /:id/publish — Publish release
 */
router.post('/:id/publish', async (req, res) => {
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

export default router;
