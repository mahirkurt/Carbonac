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

const usageStoreEnabled = Boolean(supabase);

async function createUsageEvent({ userId, eventType, units = 0, source = 'api', metadata = {} }) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('usage_events')
    .insert({
      user_id: userId || null,
      event_type: eventType,
      units,
      source,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('[usage-store] create usage event failed:', error.message);
    return null;
  }

  return data;
}

export { usageStoreEnabled, createUsageEvent };
