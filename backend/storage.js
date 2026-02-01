import './env.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const pdfBucket = process.env.SUPABASE_BUCKET_PDFS || 'pdfs';
const documentBucket = process.env.SUPABASE_BUCKET_DOCUMENTS || 'documents';
const templatePreviewBucket =
  process.env.SUPABASE_BUCKET_TEMPLATE_PREVIEWS || 'template-previews';
const signedUrlTtl = Number.parseInt(process.env.SUPABASE_SIGNED_URL_TTL || '3600', 10);

const storageEnabled = Boolean(supabaseUrl && supabaseServiceKey && pdfBucket);
const templatePreviewEnabled = Boolean(
  supabaseUrl && supabaseServiceKey && templatePreviewBucket
);
const supabase = storageEnabled
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null;

function normalizeSegment(value, fallback) {
  const raw = String(value || '').trim();
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return cleaned || fallback;
}

function buildPdfStoragePath({ userId, documentId, jobId }) {
  const safeUser = normalizeSegment(userId, 'anonymous');
  const safeDocument = normalizeSegment(documentId, 'document');
  const safeJob = normalizeSegment(jobId, 'job');
  return path.posix.join(safeUser, safeDocument, `${safeJob}.pdf`);
}

async function uploadPdf({ filePath, storagePath }) {
  if (!storageEnabled || !supabase) {
    return null;
  }
  const buffer = await fs.readFile(filePath);
  const { data, error } = await supabase.storage.from(pdfBucket).upload(storagePath, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) {
    throw new Error(error.message || 'PDF upload failed');
  }
  return data;
}

async function createPdfSignedUrl({ storagePath, expiresIn = signedUrlTtl }) {
  if (!storageEnabled || !supabase) {
    return null;
  }
  const ttl = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : signedUrlTtl;
  const { data, error } = await supabase.storage.from(pdfBucket).createSignedUrl(storagePath, ttl);
  if (error) {
    throw new Error(error.message || 'Signed URL creation failed');
  }
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  return {
    signedUrl: data?.signedUrl,
    expiresAt,
  };
}

function buildTemplatePreviewPath({ templateKey, versionId, format = 'png' }) {
  const safeKey = normalizeSegment(templateKey, 'template');
  const safeVersion = normalizeSegment(versionId, 'version');
  const ext = format || 'png';
  return path.posix.join(safeKey, `${safeVersion}.${ext}`);
}

async function uploadTemplatePreview({ filePath, storagePath, contentType = 'image/png' }) {
  if (!templatePreviewEnabled || !supabase) {
    return null;
  }
  const buffer = await fs.readFile(filePath);
  const { data, error } = await supabase.storage
    .from(templatePreviewBucket)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });
  if (error) {
    throw new Error(error.message || 'Template preview upload failed');
  }
  return data;
}

async function createTemplatePreviewSignedUrl({ storagePath, expiresIn = signedUrlTtl }) {
  if (!templatePreviewEnabled || !supabase) {
    return null;
  }
  const ttl = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : signedUrlTtl;
  const { data, error } = await supabase.storage
    .from(templatePreviewBucket)
    .createSignedUrl(storagePath, ttl);
  if (error) {
    throw new Error(error.message || 'Template preview signed URL failed');
  }
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  return {
    signedUrl: data?.signedUrl,
    expiresAt,
  };
}

export {
  storageEnabled,
  pdfBucket,
  documentBucket,
  templatePreviewBucket,
  templatePreviewEnabled,
  signedUrlTtl,
  buildPdfStoragePath,
  uploadPdf,
  createPdfSignedUrl,
  buildTemplatePreviewPath,
  uploadTemplatePreview,
  createTemplatePreviewSignedUrl,
};
