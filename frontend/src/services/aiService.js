/**
 * AI Service
 * Thin client for Carbonac backend AI endpoints.
 */

import { supabase } from '../lib/supabase';
import { buildApiUrl } from '../utils/apiBase';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function parseBackendError(payload) {
  const code = payload?.error?.code || payload?.code || null;
  const message = payload?.error?.message || payload?.message || null;
  const details = payload?.error?.details || payload?.details || null;
  const requestId = payload?.error?.request_id || payload?.request_id || null;

  return {
    code,
    message,
    details,
    requestId,
  };
}

async function postJson(path, body, { signal } = {}) {
  const token = await getAccessToken();
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const payload = await readJsonSafely(response);
    const parsed = parseBackendError(payload);
    const error = new Error(parsed.message || `Request failed (${response.status}).`);
    error.status = response.status;
    error.code = parsed.code;
    error.details = parsed.details;
    error.requestId = parsed.requestId;
    error.retryAfterSecs = Number(response.headers.get('Retry-After')) || null;
    throw error;
  }

  return await response.json();
}

export async function askAi({ question, context, signal }) {
  const payload = await postJson(
    '/api/ai/ask',
    { question, context },
    { signal }
  );
  return payload?.output || '';
}

export async function analyzeAi({ markdown, metadata, signal }) {
  const payload = await postJson(
    '/api/ai/analyze',
    { markdown, metadata },
    { signal }
  );
  return payload?.output || '';
}

