/**
 * Express error handler middleware
 */

import { logEvent } from '../lib/logger.js';
import { sendError } from '../lib/helpers.js';

export function errorHandler(err, req, res, next) {
  logEvent('error', {
    requestId: req.requestId,
    error: err.message,
  });

  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body too large (max 5 MB).', null, req.requestId);
  }

  if (err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large (max 50 MB).'
        : `Upload error: ${err.message}`;
    return sendError(res, 400, 'UPLOAD_ERROR', msg, null, req.requestId);
  }

  if (err.message === 'Unsupported file type') {
    return sendError(res, 400, 'UNSUPPORTED_TYPE', err.message, null, req.requestId);
  }

  const safeDetails = process.env.NODE_ENV === 'production' ? null : err.message;
  sendError(res, 500, 'SERVER_ERROR', 'Internal server error.', safeDetails, req.requestId);
}
