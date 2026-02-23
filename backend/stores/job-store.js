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

async function addJobEvent(jobId, status, message, details = {}) {
  if (!supabase) return null;

  const payload = {
    job_id: jobId,
    status,
    message: message || null,
  };

  if (details && typeof details === 'object') {
    if (details.stage) {
      payload.stage = details.stage;
    }
    if (Number.isFinite(details.progress)) {
      payload.progress = Math.max(0, Math.min(100, Math.round(details.progress)));
    }
    if (details.level) {
      payload.level = details.level;
    }
    if (details.requestId) {
      payload.request_id = details.requestId;
    }
    if (details.metadata && typeof details.metadata === 'object') {
      payload.metadata = details.metadata;
    }
  }

  const { data, error } = await supabase
    .from('job_events')
    .insert(payload)
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

async function listJobEvents(jobId, limit = 20) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('job_events')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[job-store] list job_events failed:', error.message);
    return [];
  }

  return data || [];
}

async function listJobs({ userId, status, limit = 20, offset = 0 } = {}) {
  if (!supabase) return { jobs: [], total: 0 };

  let query = supabase.from('jobs').select('*', { count: 'exact' });
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const upper = Math.max(offset, offset + limit - 1);
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, upper);

  if (error) {
    console.error('[job-store] list jobs failed:', error.message);
    return { jobs: [], total: 0 };
  }

  return {
    jobs: data || [],
    total: Number.isFinite(count) ? count : (data || []).length,
  };
}

export {
  jobStoreEnabled,
  createJobRecord,
  updateJobRecord,
  addJobEvent,
  getJobRecord,
  listJobEvents,
  listJobs,
};
