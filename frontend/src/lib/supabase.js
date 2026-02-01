/**
 * Supabase Client Configuration
 * 
 * Provides authentication, database, and storage services
 */

import { createClient } from '@supabase/supabase-js';

// Supabase project configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/+$/, '');
}

function resolveSiteBaseUrl() {
  // Prefer the *actual* runtime origin in the browser. This prevents misconfigured
  // build-time env (e.g. VITE_SITE_URL accidentally left as localhost) from
  // generating OAuth redirect URLs that send production users to 127.0.0.1.
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return normalizeBaseUrl(window.location.origin);
  }

  // Fallback for non-browser contexts (tests/SSR) where window is not available.
  const envBaseUrl = import.meta.env.VITE_SITE_URL;
  if (envBaseUrl) return normalizeBaseUrl(envBaseUrl);

  return '';
}

function buildRedirectUrl(pathname) {
  const baseUrl = resolveSiteBaseUrl();
  if (!baseUrl) return undefined;
  const safePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${safePath}`;
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'carbonac',
    },
  },
});

// Auth helpers
export const auth = {
  /**
   * Sign up with email and password
   */
  signUp: async (email, password, metadata = {}) => {
    const emailRedirectTo = buildRedirectUrl('/auth/callback');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
    return { data, error };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  signInWithOAuth: async (provider) => {
    const redirectTo = buildRedirectUrl('/auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        ...(redirectTo ? { redirectTo } : {}),
        skipBrowserRedirect: true,
      },
    });
    return { data, error };
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error };
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user, error };
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email) => {
    const redirectTo = buildRedirectUrl('/auth/reset-password');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      ...(redirectTo ? { redirectTo } : {}),
    });
    return { data, error };
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  /**
   * Get user profile
   */
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { profile: data, error };
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { profile: data, error };
  },

  /**
   * Get user's documents
   */
  getDocuments: async (userId, options = {}) => {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    return { documents: data, error };
  },

  /**
   * Get single document
   */
  getDocument: async (documentId) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    return { document: data, error };
  },

  /**
   * Create new document
   */
  createDocument: async (document) => {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    return { document: data, error };
  },

  /**
   * Update document
   */
  updateDocument: async (documentId, updates) => {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();
    return { document: data, error };
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    return { error };
  },

  /**
   * Get conversion history
   */
  getConversions: async (documentId) => {
    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });
    return { conversions: data, error };
  },

  /**
   * Create conversion record
   */
  createConversion: async (conversion) => {
    const { data, error } = await supabase
      .from('conversions')
      .insert(conversion)
      .select()
      .single();
    return { conversion: data, error };
  },

  /**
   * Update conversion status
   */
  updateConversion: async (conversionId, updates) => {
    const { data, error } = await supabase
      .from('conversions')
      .update(updates)
      .eq('id', conversionId)
      .select()
      .single();
    return { conversion: data, error };
  },

  /**
   * Get user's usage stats
   */
  getUsageStats: async (userId) => {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { stats: data, error };
  },
};

// Storage helpers
export const storage = {
  /**
   * Upload original document
   */
  uploadDocument: async (userId, file, path = null) => {
    const fileName = path || `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { path: data?.path, error };
  },

  /**
   * Upload converted PDF
   */
  uploadPdf: async (userId, file, documentId) => {
    const fileName = `${userId}/${documentId}/${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });
    return { path: data?.path, error };
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl;
  },

  /**
   * Get signed URL for private file (expires in 1 hour)
   */
  getSignedUrl: async (bucket, path, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { url: data?.signedUrl, error };
  },

  /**
   * Download file
   */
  downloadFile: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { blob: data, error };
  },

  /**
   * Delete file
   */
  deleteFile: async (bucket, paths) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(Array.isArray(paths) ? paths : [paths]);
    return { error };
  },

  /**
   * List files in a folder
   */
  listFiles: async (bucket, folder) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    return { files: data, error };
  },
};

export default supabase;
