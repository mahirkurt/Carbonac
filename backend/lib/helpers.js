/**
 * Shared utility helpers
 */

import fs from 'fs/promises';
import { spawn } from 'child_process';
import { logEvent } from './logger.js';

export function sendError(res, status, code, message, details, requestId) {
  return res.status(status).json({
    error: {
      code,
      message,
      details: details || null,
      request_id: requestId || null,
    },
  });
}

export async function pathExists(targetPath) {
  if (!targetPath) return false;
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function safeUnlink(targetPath) {
  if (!targetPath) return;
  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function safeRemoveDir(targetPath) {
  if (!targetPath) return;
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function runPythonConversion(pythonScript, inputPath) {
  const pythonBins = [process.env.PYTHON_BIN, 'python3', 'python']
    .filter((value, index, list) => value && list.indexOf(value) === index);
  const failures = [];

  for (const bin of pythonBins) {
    try {
      return await new Promise((resolve, reject) => {
        const pythonProcess = spawn(bin, [pythonScript, inputPath]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('error', (error) => {
          reject(error);
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(errorOutput || `Python conversion failed (exit: ${code})`));
          }
        });
      });
    } catch (error) {
      failures.push(`${bin}: ${error.message}`);
    }
  }

  throw new Error(failures.join(' | ') || 'Python conversion failed');
}

function parseIdList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const reviewerIds = parseIdList(
  process.env.REVIEWER_USER_IDS ||
    process.env.TEMPLATE_REVIEWER_IDS ||
    process.env.PRESS_PACK_REVIEWER_IDS
);

export function isReviewer(userId) {
  if (!reviewerIds.length) {
    return true;
  }
  if (!userId) {
    return false;
  }
  return reviewerIds.includes(userId);
}

export function requireReviewer(res, userId, requestId) {
  if (!isReviewer(userId)) {
    sendError(
      res,
      403,
      'REVIEWER_REQUIRED',
      'Reviewer approval required for this action.',
      null,
      requestId
    );
    return false;
  }
  return true;
}

export function isPrivateIp(ip) {
  // IPv4 private/reserved ranges
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true;                          // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true;    // 192.168.0.0/16
    if (parts[0] === 127) return true;                         // 127.0.0.0/8
    if (parts[0] === 169 && parts[1] === 254) return true;    // 169.254.0.0/16
    if (parts[0] === 0) return true;                           // 0.0.0.0/8
  }
  // IPv6 loopback and private
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fd')) return true;
  return false;
}
