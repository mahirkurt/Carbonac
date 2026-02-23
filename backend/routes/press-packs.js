/**
 * Press pack routes — CRUD
 */

import { Router } from 'express';
import { sendError, requireReviewer } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import { resolveAuthUser } from '../lib/job-helpers.js';
import { authEnabled } from '../auth.js';
import {
  pressPackStoreEnabled,
  createPressPack,
  getPressPackById,
  listPressPacks,
  updatePressPackStatus,
} from '../stores/press-pack-store.js';

const router = Router();

/**
 * GET / — List press packs
 */
router.get('/', async (req, res) => {
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
 * GET /:id — Get press pack
 */
router.get('/:id', async (req, res) => {
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
 * POST / — Create press pack
 */
router.post('/', async (req, res) => {
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
 * PATCH /:id — Update press pack status
 */
router.patch('/:id', async (req, res) => {
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

export default router;
