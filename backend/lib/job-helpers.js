/**
 * Job snapshot, telemetry, and ownership helpers
 */

import { authEnabled, getUserIdFromToken } from '../auth.js';
import {
  jobStoreEnabled,
  getJobRecord,
  listJobEvents,
} from '../stores/job-store.js';
import { jobQueue } from '../queue.js';

export async function resolveAuthUser(req) {
  const authHeader = req.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    req.authUserId = null;
    return { userId: null };
  }
  if (!authEnabled) {
    req.authUserId = null;
    return { userId: null };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    req.authUserId = null;
    return { userId: null };
  }
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    req.authUserId = null;
    return { error: 'INVALID_AUTH' };
  }
  req.authUserId = userId;
  return { userId };
}

export function normalizeJobStatus(state) {
  switch (state) {
    case 'waiting':
    case 'delayed':
    case 'waiting-children':
    case 'paused':
      return 'queued';
    case 'active':
    case 'stalled':
      return 'processing';
    default:
      return state;
  }
}

export function isSignedUrlValid(expiresAt) {
  if (!expiresAt) {
    return false;
  }
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) {
    return false;
  }
  return expiresMs - Date.now() > 30 * 1000;
}

function resolveIsoTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }
  return date.toISOString();
}

export function buildJobTelemetry({ snapshot = {}, events = [] } = {}) {
  const orderedEvents = [...events]
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = Date.parse(left.created_at || '') || 0;
      const rightTime = Date.parse(right.created_at || '') || 0;
      return leftTime - rightTime;
    });
  const firstEvent = orderedEvents[0] || null;
  const lastEvent = orderedEvents[orderedEvents.length - 1] || null;

  const startedAt =
    firstEvent?.created_at ||
    snapshot.createdAt ||
    snapshot.timings?.createdAt ||
    snapshot.timings?.processedAt ||
    null;
  const updatedAt =
    lastEvent?.created_at ||
    snapshot.updatedAt ||
    snapshot.timings?.finishedAt ||
    snapshot.timings?.processedAt ||
    null;
  const durationMs =
    startedAt && updatedAt ? Math.max(0, Date.parse(updatedAt) - Date.parse(startedAt)) : null;

  const progress = Number.isFinite(lastEvent?.progress)
    ? lastEvent.progress
    : Number.isFinite(snapshot.progress)
      ? snapshot.progress
      : null;
  const stage = lastEvent?.stage || snapshot.stage || null;

  const result = snapshot.result || {};
  const outputManifest = result.outputManifest || {};
  const qaSummary =
    outputManifest.qa?.summary ||
    result.preflight?.qaSummary ||
    outputManifest.preflight?.qaSummary ||
    null;
  const accessibilitySummary =
    outputManifest.qa?.accessibilitySummary ||
    result.preflight?.accessibilitySummary ||
    outputManifest.preflight?.accessibilitySummary ||
    null;
  const qualityChecklist =
    outputManifest.preflight?.qualityChecklist ||
    result.preflight?.qualityChecklist ||
    null;
  const qualityChecklistSummary = qualityChecklist?.summary || null;

  return {
    progress,
    stage,
    startedAt,
    updatedAt,
    durationMs,
    timings: snapshot.timings || null,
    qaSummary,
    accessibilitySummary,
    qualityChecklistSummary,
  };
}

export async function getJobSnapshot(jobId, userId = null) {
  if (jobStoreEnabled) {
    const record = await getJobRecord(jobId);
    if (record) {
      if (userId && record.user_id && record.user_id !== userId) {
        return { forbidden: true };
      }
      return {
        snapshot: {
          status: record.status,
          result: record.result || null,
          error: record.error_message ? { message: record.error_message } : null,
          createdAt: record.created_at || null,
          updatedAt: record.updated_at || null,
          attempts: record.attempts || 0,
        },
      };
    }
  }

  const job = await jobQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const status = normalizeJobStatus(state);
  const error = state === 'failed' ? { message: job.failedReason || 'Job failed.' } : null;
  const progress = Number.isFinite(job.progress) ? Math.round(job.progress) : null;
  const timings = {
    createdAt: resolveIsoTime(job.timestamp),
    processedAt: resolveIsoTime(job.processedOn),
    finishedAt: resolveIsoTime(job.finishedOn),
  };

  return {
    snapshot: {
      status,
      result: job.returnvalue || null,
      error,
      progress,
      timings,
    },
  };
}

export async function assertJobOwnership(jobId, userId) {
  if (!jobStoreEnabled) {
    return { record: null };
  }
  const record = await getJobRecord(jobId);
  if (record && userId && record.user_id && record.user_id !== userId) {
    return { forbidden: true, record };
  }
  return { record };
}

export function validateConvertInput({ markdown, assets, metadata }) {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return 'Markdown content is required.';
  }
  if (assets !== undefined) {
    if (!Array.isArray(assets)) {
      return 'Assets must be an array.';
    }
    for (const asset of assets) {
      if (!asset || typeof asset !== 'object') {
        return 'Assets must be objects.';
      }
      if (!asset.url && !asset.storagePath) {
        return 'Each asset must include url or storagePath.';
      }
    }
  }
  if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    return 'Metadata must be an object.';
  }
  return null;
}

export function generateFrontmatter(settings) {
  if (!settings || Object.keys(settings).length === 0) {
    return '';
  }

  const lines = ['---'];

  const docType = settings.docType || settings.documentType;
  if (docType) {
    lines.push(`docType: ${docType}`);
  }
  if (settings.documentType) {
    lines.push(`documentType: ${settings.documentType}`);
  }
  if (settings.audience) {
    lines.push(`audience: ${settings.audience}`);
  }
  if (settings.tone) {
    lines.push(`tone: ${settings.tone}`);
  }
  if (settings.colorScheme) {
    lines.push(`colorScheme: ${settings.colorScheme}`);
  }
  if (settings.layoutStyle) {
    lines.push(`layoutStyle: ${settings.layoutStyle}`);
  }
  if (settings.layoutProfile) {
    lines.push(`layoutProfile: ${settings.layoutProfile}`);
  }
  if (settings.printProfile) {
    lines.push(`printProfile: ${settings.printProfile}`);
  }
  if (settings.theme) {
    lines.push(`theme: ${settings.theme}`);
  }
  if (settings.colorMode) {
    lines.push(`colorMode: ${settings.colorMode}`);
  }
  if (settings.includeCover !== undefined) {
    lines.push(`includeCover: ${settings.includeCover === true ? 'true' : 'false'}`);
  }
  if (settings.showPageNumbers !== undefined) {
    lines.push(`showPageNumbers: ${settings.showPageNumbers === true ? 'true' : 'false'}`);
  }
  if (settings.printBackground !== undefined) {
    lines.push(`printBackground: ${settings.printBackground === true ? 'true' : 'false'}`);
  }
  if (settings.templateKey) {
    lines.push(`templateKey: ${settings.templateKey}`);
  }
  if (settings.template) {
    lines.push(`template: ${settings.template}`);
  }
  if (settings.locale) {
    lines.push(`locale: ${settings.locale}`);
  }
  if (settings.version !== undefined && settings.version !== null) {
    lines.push(`version: ${settings.version}`);
  }
  if (settings.emphasis && settings.emphasis.length > 0) {
    lines.push(`emphasis: [${settings.emphasis.join(', ')}]`);
  }
  if (settings.components && settings.components.length > 0) {
    lines.push(`components: [${settings.components.join(', ')}]`);
  }

  lines.push('---\n\n');

  return lines.join('\n');
}
