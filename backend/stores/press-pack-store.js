import '../env.js';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { validatePressPackManifest, normalizePressPackStatus, getPressPackSummary } from '../schemas/press-pack-schema.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

const pressPackStoreEnabled = Boolean(supabase);

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(',')}}`;
}

function hashManifest(manifest) {
  const input = stableStringify(manifest || {});
  return createHash('sha256').update(input).digest('hex');
}

async function getPressPackById(id) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('press_packs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || 'Failed to fetch press pack.');
  }
  return data || null;
}

async function listPressPacks({ templateVersionId, status } = {}) {
  if (!supabase) return [];
  let query = supabase.from('press_packs').select('*');
  if (templateVersionId) {
    query = query.eq('template_version_id', templateVersionId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message || 'Failed to list press packs.');
  }
  return data || [];
}

async function getLatestPressPackForTemplateVersion(templateVersionId, { status } = {}) {
  if (!supabase || !templateVersionId) return null;
  let query = supabase
    .from('press_packs')
    .select('*')
    .eq('template_version_id', templateVersionId);
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
  if (error) {
    throw new Error(error.message || 'Failed to fetch press pack.');
  }
  return data?.[0] || null;
}

async function createPressPack({
  templateVersionId,
  manifest,
  status,
  createdBy = null,
}) {
  if (!supabase) return null;
  const validation = validatePressPackManifest(manifest);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid press pack manifest.');
  }
  const normalized = validation.data;
  const summary = getPressPackSummary(normalized);
  const pressPackStatus = normalizePressPackStatus(status || summary?.status);
  const hash = normalized.metadata?.hash || hashManifest(normalized);
  const name = normalized.pressPack?.name || null;
  const description = normalized.pressPack?.description || null;
  const tags = Array.isArray(normalized.pressPack?.tags) ? normalized.pressPack.tags : [];
  const version = normalized.pressPack?.version || '1.0.0';
  const schemaVersion = normalized.schemaVersion || null;

  const { data, error } = await supabase
    .from('press_packs')
    .insert({
      template_version_id: templateVersionId,
      name,
      description,
      tags,
      version,
      status: pressPackStatus,
      schema_version: schemaVersion,
      manifest_json: normalized,
      hash,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Press pack creation failed.');
  }
  return data;
}

async function updatePressPackStatus(id, status, approvedBy = null) {
  if (!supabase || !id) return null;
  const normalizedStatus = normalizePressPackStatus(status);
  const update = {
    status: normalizedStatus,
    updated_at: new Date().toISOString(),
  };
  if (normalizedStatus === 'approved' || normalizedStatus === 'published') {
    update.approved_by = approvedBy;
    update.approved_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from('press_packs')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Press pack update failed.');
  }
  return data;
}

export {
  pressPackStoreEnabled,
  createPressPack,
  getPressPackById,
  listPressPacks,
  getLatestPressPackForTemplateVersion,
  updatePressPackStatus,
  hashManifest,
};
