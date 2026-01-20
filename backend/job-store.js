import './env.js';
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

const jobStoreEnabled = Boolean(supabase);

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const copy = Array.isArray(payload) ? [...payload] : { ...payload };
  if (copy.markdown) {
    copy.markdown = `[omitted ${copy.markdown.length} chars]`;
  }
  return copy;
}

async function createJobRecord({ id, userId, type, status, payload }) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      id,
      user_id: userId || null,
      type,
      status,
      payload: sanitizePayload(payload) || {},
      attempts: 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[job-store] create job failed:', error.message);
    return null;
  }

  return data;
}

async function updateJobRecord(id, updates = {}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[job-store] update job failed:', error.message);
    return null;
  }

  return data;
}

async function addJobEvent(jobId, status, message) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('job_events')
    .insert({
      job_id: jobId,
      status,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[job-store] insert job_event failed:', error.message);
    return null;
  }

  return data;
}

async function getJobRecord(jobId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    console.error('[job-store] get job failed:', error.message);
    return null;
  }

  return data;
}

export {
  jobStoreEnabled,
  createJobRecord,
  updateJobRecord,
  addJobEvent,
  getJobRecord,
};
