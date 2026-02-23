/**
 * Billing routes (stubs)
 */

import { Router } from 'express';
import { sendError } from '../lib/helpers.js';
import { resolveAuthUser } from '../lib/job-helpers.js';
import { authEnabled } from '../auth.js';

const BILLING_FREE_PAGES = Number(process.env.BILLING_FREE_PAGES || 10);

const router = Router();

function buildDefaultBillingStatus() {
  return {
    credits: 0,
    subscription: {
      tier: 'free',
      status: 'active',
      renewsAt: null,
    },
    usage: {
      pagesUsed: 0,
      pagesRemaining: BILLING_FREE_PAGES,
    },
  };
}

function sendBillingNotConfigured(res, requestId) {
  return sendError(
    res,
    501,
    'BILLING_NOT_CONFIGURED',
    'Billing service is not configured in this deployment.',
    null,
    requestId
  );
}

/**
 * GET /status
 */
router.get('/status', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error || (authEnabled && !auth.userId)) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
    }

    return res.json(buildDefaultBillingStatus());
  } catch (error) {
    return sendError(res, 500, 'BILLING_STATUS_FAILED', 'Failed to read billing status.', error.message, req.requestId);
  }
});

router.post('/use-credits', async (req, res) => {
  const auth = await resolveAuthUser(req);
  if (auth.error || (authEnabled && !auth.userId)) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
  }
  return sendBillingNotConfigured(res, req.requestId);
});

router.post('/create-checkout', async (req, res) => {
  const auth = await resolveAuthUser(req);
  if (auth.error || (authEnabled && !auth.userId)) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
  }
  return sendBillingNotConfigured(res, req.requestId);
});

router.post('/purchase-credits', async (req, res) => {
  const auth = await resolveAuthUser(req);
  if (auth.error || (authEnabled && !auth.userId)) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
  }
  return sendBillingNotConfigured(res, req.requestId);
});

router.post('/cancel-subscription', async (req, res) => {
  const auth = await resolveAuthUser(req);
  if (auth.error || (authEnabled && !auth.userId)) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', null, req.requestId);
  }
  return sendBillingNotConfigured(res, req.requestId);
});

export default router;
