/**
 * Template version status route — PATCH /api/template-versions/:id/status
 */

import { Router } from 'express';
import { sendError, requireReviewer } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import { resolveAuthUser } from '../lib/job-helpers.js';
import { authEnabled } from '../auth.js';
import {
  templateStoreEnabled,
  setTemplateVersionStatus,
} from '../stores/templates-store.js';

const router = Router();

/**
 * PATCH /:id/status — Update template version status
 */
router.patch('/:id/status', async (req, res) => {
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

export default router;
