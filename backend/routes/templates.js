/**
 * Template routes — CRUD + versions, rollback, preview
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { sendError, requireReviewer } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import { attachTemplatePreviews, serializeTemplate } from '../lib/template-helpers.js';
import { resolveAuthUser } from '../lib/job-helpers.js';
import { authEnabled } from '../auth.js';
import {
  templateStoreEnabled,
  listTemplates,
  createTemplate,
  updateTemplateMetadata,
  deleteTemplate,
  createTemplateVersion,
  rollbackTemplateVersion,
  getTemplateVersions,
  setTemplateVersionStatus,
} from '../stores/templates-store.js';
import { LOCAL_TEMPLATE_FALLBACKS } from '../stores/template-fallbacks.js';
import { jobQueue } from '../queue.js';

const router = Router();

/**
 * GET / — List templates
 */
router.get('/', async (req, res) => {
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
 * POST / — Create template
 */
router.post('/', async (req, res) => {
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
 * PATCH /:id — Update template metadata
 */
router.patch('/:id', async (req, res) => {
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
 * DELETE /:id — Delete/archive template
 */
router.delete('/:id', async (req, res) => {
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
 * POST /:id/versions — Create template version
 */
router.post('/:id/versions', async (req, res) => {
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
 * POST /:id/rollback — Rollback template version
 */
router.post('/:id/rollback', async (req, res) => {
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
 * GET /:id/versions — List template versions
 */
router.get('/:id/versions', async (req, res) => {
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
 * POST /:id/preview — Generate template preview
 */
router.post('/:id/preview', async (req, res) => {
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

export default router;
