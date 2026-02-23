/**
 * Import routes — Google Docs
 */

import { Router } from 'express';
import { sendError } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';

const router = Router();

/**
 * POST /google-docs — Import from Google Docs URL
 */
router.post('/google-docs', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.includes('docs.google.com')) {
      return sendError(res, 400, 'INVALID_INPUT', 'Invalid Google Docs URL.', null, req.requestId);
    }

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return sendError(res, 400, 'INVALID_INPUT', 'Document ID not found.', null, req.requestId);
    }

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl);

    if (!response.ok) {
      throw new Error('Google Docs content could not be fetched.');
    }

    const content = await response.text();

    res.json({
      success: true,
      content,
      title: `Google Doc - ${docId}`,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });

    return sendError(res, 500, 'IMPORT_FAILED', 'Google Docs import failed.', error.message, req.requestId);
  }
});

export default router;
