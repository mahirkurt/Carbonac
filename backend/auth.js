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

const authEnabled = Boolean(supabase);

export async function getUserIdFromToken(token) {
  if (!supabase || !token) {
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return null;
  }
  return data?.user?.id || null;
}

export { authEnabled };
