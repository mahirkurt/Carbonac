import '../env.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

const releaseStoreEnabled = Boolean(supabase);
const RELEASE_STATUSES = new Set(['draft', 'review', 'approved', 'published']);

function normalizeReleaseStatus(value) {
  return RELEASE_STATUSES.has(value) ? value : 'draft';
}

function canTransitionRelease(fromStatus, toStatus) {
  if (!fromStatus || fromStatus === toStatus) return true;
  const order = ['draft', 'review', 'approved', 'published'];
  return order.indexOf(toStatus) >= order.indexOf(fromStatus);
}

async function createRelease({
  userId,
  documentId = null,
  templateVersionId = null,
  pressPackId = null,
  sourceJobId = null,
  notes = null,
}) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('releases')
    .insert({
      user_id: userId,
      document_id: documentId,
      template_version_id: templateVersionId,
      press_pack_id: pressPackId,
      source_job_id: sourceJobId,
      status: 'draft',
      notes,
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Release creation failed.');
  }
  return data;
}

async function getReleaseById(id) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('releases').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(error.message || 'Failed to fetch release.');
  }
  return data || null;
}

async function updateRelease(id, updates = {}) {
  if (!supabase || !id) return null;
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('releases')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Release update failed.');
  }
  return data;
}

async function setReleaseStatus(id, nextStatus) {
  if (!supabase || !id) return null;
  const current = await getReleaseById(id);
  if (!current) {
    throw new Error('Release not found.');
  }
  const normalized = normalizeReleaseStatus(nextStatus);
  if (!canTransitionRelease(current.status, normalized)) {
    throw new Error('Invalid release status transition.');
  }
  const update = {
    status: normalized,
    updated_at: new Date().toISOString(),
  };
  if (normalized === 'published') {
    update.published_at = new Date().toISOString();
  }
  return await updateRelease(id, update);
}

export {
  releaseStoreEnabled,
  createRelease,
  getReleaseById,
  updateRelease,
  setReleaseStatus,
  normalizeReleaseStatus,
};
