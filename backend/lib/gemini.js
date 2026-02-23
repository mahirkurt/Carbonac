/**
 * Gemini AI API integration
 */

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function deriveGeminiApiRoot(apiUrl) {
  const normalized = stripTrailingSlash(apiUrl);
  if (normalized.endsWith('/models')) {
    return normalized.slice(0, -'/models'.length);
  }
  return normalized;
}

function normalizeGeminiModelResource(model) {
  const value = String(model || '').trim();
  if (!value) return '';

  if (value.startsWith('models/') || value.startsWith('tunedModels/')) {
    return value;
  }

  // Allow full resource names (Vertex / other namespaces) as-is.
  if (value.includes('/')) {
    return value;
  }

  return `models/${value}`;
}

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-pro';

const GEMINI_API_URL =
  process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_API_ROOT =
  deriveGeminiApiRoot(GEMINI_API_URL) || 'https://generativelanguage.googleapis.com/v1beta';

export const GEMINI_CARBON_HTML_MODEL =
  process.env.GEMINI_CARBON_HTML_MODEL || process.env.GEMINI_MARKDOWN_TO_HTML_MODEL || '';
export const GEMINI_CARBON_HTML_FALLBACK_MODEL = process.env.GEMINI_CARBON_HTML_FALLBACK_MODEL || '';
export const GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION = process.env.GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION || '';

export const AI_PROMPT_VERSION = process.env.AI_PROMPT_VERSION || 'v1';
const AI_REDACT_PII = process.env.AI_REDACT_PII !== 'false';

export function redactPii(text) {
  if (!AI_REDACT_PII || typeof text !== 'string') {
    return text;
  }
  let output = text;
  output = output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, '[redacted-email]');
  output = output.replace(/\\b\\+?\\d[\\d\\s().-]{7,}\\d\\b/g, '[redacted-phone]');
  output = output.replace(/\\b\\d{13,19}\\b/g, '[redacted-card]');
  return output;
}

export function stripMarkdownCodeFences(text) {
  const value = String(text || '').trim();
  const fenceMatch = value.match(/^```[a-z0-9_-]*\s*\n([\s\S]*?)\n```\s*$/i);
  if (fenceMatch) {
    return String(fenceMatch[1] || '').trim();
  }
  return value;
}

export function stripOuterHtmlDocument(html) {
  const value = String(html || '').trim();
  const bodyMatch = value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return String(bodyMatch[1] || '').trim();
  }
  return value;
}

export function sanitizeGeneratedHtml(html) {
  let value = String(html || '');

  // Remove scripts/styles defensively before the frontend injects into innerHTML.
  value = value.replace(/<script[\s\S]*?<\/script>/gi, '');
  value = value.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Strip inline event handlers.
  value = value.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip javascript: URLs.
  value = value.replace(/\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, ' $1="#"');

  return value.trim();
}

export async function callGemini({ prompt, model, systemInstruction = null, generationConfig = null }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY.');
  }

  const resolvedModel = normalizeGeminiModelResource(model);
  if (!resolvedModel) {
    throw new Error('Missing Gemini model.');
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: generationConfig || {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    requestBody.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(`${stripTrailingSlash(GEMINI_API_ROOT)}/${resolvedModel}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`Gemini API error: ${response.status} - ${errorText}`);
    err.status = response.status;
    err.code = '';
    try {
      const payload = JSON.parse(errorText);
      const details = Array.isArray(payload?.error?.details) ? payload.error.details : [];
      const reason = details.find((item) => typeof item?.reason === 'string')?.reason || '';
      err.code = reason || String(payload?.error?.status || '');
    } catch {
      // Keep message-based fallback below.
    }

    // Provide a stable-ish code for clients.
    if (response.status === 429) {
      err.code = 'GEMINI_RATE_LIMITED';
    } else if (err.code === 'API_KEY_INVALID' || /api key\s*(expired|invalid)/i.test(errorText)) {
      err.code = 'GEMINI_API_KEY_INVALID';
    }
    throw err;
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned empty response.');
  }
  return text;
}
