/**
 * AI proxy routes — /api/ai/analyze, /ask, /markdown-to-carbon-html
 */

import { Router } from 'express';
import { sendError } from '../lib/helpers.js';
import { logEvent } from '../lib/logger.js';
import {
  callGemini,
  redactPii,
  GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_CARBON_HTML_MODEL,
  GEMINI_CARBON_HTML_FALLBACK_MODEL,
  GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION,
  AI_PROMPT_VERSION,
  stripMarkdownCodeFences,
  stripOuterHtmlDocument,
  sanitizeGeneratedHtml,
} from '../lib/gemini.js';
import { resolveAuthUser } from '../lib/job-helpers.js';
import { getRateKey, checkAiRateLimit } from '../middleware/rate-limit.js';
import { usageStoreEnabled, createUsageEvent } from '../stores/usage-store.js';

const router = Router();

function buildAnalyzePrompt({ markdown, metadata }) {
  return `You are a Carbon Design System report assistant.\n\n` +
    `Return a JSON response with summary, keyFindings, risks, and layoutSuggestions.\n` +
    `Tone: executive, concise. Avoid jargon and emojis.\n\n` +
    `Metadata: ${JSON.stringify(metadata || {})}\n\n` +
    `Markdown:\n${markdown}\n`;
}

function buildAskPrompt({ question, context }) {
  return `You are a Carbon Design System report assistant.\n\n` +
    `Answer concisely and reference Carbon tokens where relevant.\n\n` +
    `Context:\n${context || ''}\n\n` +
    `Question:\n${question}\n`;
}

function buildAskFallbackOutput(question = '') {
  const normalized = String(question || '').toLowerCase();
  const asksTemplateSuggestions =
    normalized.includes('şablon') ||
    normalized.includes('template') ||
    normalized.includes('report') ||
    normalized.includes('rapor');

  if (asksTemplateSuggestions) {
    return [
      'AI servisi geçici olarak kullanılamıyor (sağlayıcı kimlik doğrulama hatası).',
      'Bu sırada manuel olarak şu 3 şablonu deneyebilirsin:',
      '1) carbon-template — genel amaçlı rapor başlangıcı',
      '2) carbon-dataviz — grafik/ağırlıklı raporlar',
      '3) carbon-cv — özgeçmiş/CV çıktıları',
    ].join('\n');
  }

  return [
    'AI servisi geçici olarak kullanılamıyor (sağlayıcı kimlik doğrulama hatası).',
    'Lütfen birkaç dakika sonra tekrar dene veya sistem yöneticisinden API anahtarını yenilemesini iste.',
  ].join('\n');
}

function buildMarkdownToCarbonHtmlSystemInstruction() {
  return (
    'You convert Markdown into a production-ready pure HTML string using IBM Carbon Design System v11.\n' +
    'Return HTML only (no Markdown code fences).\n' +
    'Do NOT include <html>, <head>, <body>, <script>, or <style> tags.\n' +
    'No inline CSS. Use semantic HTML and Carbon classes/components where appropriate.\n' +
    'Output must be safe to inject via innerHTML.\n'
  );
}

/**
 * Helper: call Gemini with primary + fallback model logic
 */
async function callWithFallback({ prompt, primaryModel, fallbackModel, systemInstruction, generationConfig, res, req }) {
  let output = '';
  let usedModel = primaryModel;

  try {
    output = await callGemini({ prompt, model: primaryModel, systemInstruction, generationConfig });
  } catch (error) {
    if (Number(error?.status) === 429) {
      res.setHeader('Retry-After', 60);
      return { error: sendError(res, 429, 'UPSTREAM_RATE_LIMITED', 'AI sağlayıcısı oran sınırına ulaştı.', error.message, req.requestId) };
    }
    if (error?.code === 'GEMINI_API_KEY_INVALID') {
      return { authFailed: true, error };
    }
    if (fallbackModel && fallbackModel !== primaryModel) {
      usedModel = fallbackModel;
      try {
        output = await callGemini({ prompt, model: fallbackModel, systemInstruction, generationConfig });
      } catch (fallbackError) {
        if (Number(fallbackError?.status) === 429) {
          res.setHeader('Retry-After', 60);
          return { error: sendError(res, 429, 'UPSTREAM_RATE_LIMITED', 'AI sağlayıcısı oran sınırına ulaştı.', fallbackError.message, req.requestId) };
        }
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }

  return { output, usedModel };
}

/**
 * POST /analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const { markdown, metadata } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return sendError(res, 400, 'INVALID_INPUT', 'Markdown content is required.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkAiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'AI rate limit exceeded.', null, req.requestId);
    }

    const safeMarkdown = redactPii(markdown);
    const prompt = buildAnalyzePrompt({ markdown: safeMarkdown, metadata });

    const result = await callWithFallback({
      prompt,
      primaryModel: GEMINI_MODEL,
      fallbackModel: GEMINI_FALLBACK_MODEL,
      res,
      req,
    });

    if (result.error && !result.authFailed) return;
    if (result.authFailed) {
      return sendError(
        res,
        503,
        'AI_PROVIDER_AUTH_FAILED',
        'AI provider authentication failed. API key is invalid or expired.',
        null,
        req.requestId
      );
    }

    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: auth.userId,
        eventType: 'ai.analyze',
        units: Math.ceil(safeMarkdown.length / 1000),
        source: 'api',
        metadata: {
          requestId: req.requestId,
          promptVersion: AI_PROMPT_VERSION,
          model: result.usedModel,
        },
      });
    }

    return res.json({
      promptVersion: AI_PROMPT_VERSION,
      model: result.usedModel,
      output: result.output,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'AI_ANALYZE_FAILED', 'AI analyze failed.', error.message, req.requestId);
  }
});

/**
 * POST /ask
 */
router.post('/ask', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const { question, context } = req.body || {};
    if (typeof question !== 'string' || !question.trim()) {
      return sendError(res, 400, 'INVALID_INPUT', 'Question is required.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkAiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'AI rate limit exceeded.', null, req.requestId);
    }

    const safeQuestion = redactPii(question);
    const safeContext = redactPii(context || '');
    const prompt = buildAskPrompt({ question: safeQuestion, context: safeContext });

    const result = await callWithFallback({
      prompt,
      primaryModel: GEMINI_MODEL,
      fallbackModel: GEMINI_FALLBACK_MODEL,
      res,
      req,
    });

    if (result.error && !result.authFailed) return;
    if (result.authFailed) {
      logEvent('warn', {
        requestId: req.requestId,
        userId: auth.userId || null,
        code: 'AI_PROVIDER_AUTH_FAILED',
        message: 'Gemini API key invalid/expired; serving local fallback answer for ask.',
      });
      return res.json({
        promptVersion: AI_PROMPT_VERSION,
        model: 'fallback-local',
        degraded: true,
        reason: 'provider_auth_failed',
        output: buildAskFallbackOutput(safeQuestion),
      });
    }

    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: auth.userId,
        eventType: 'ai.ask',
        units: Math.ceil((safeQuestion.length + safeContext.length) / 1000),
        source: 'api',
        metadata: {
          requestId: req.requestId,
          promptVersion: AI_PROMPT_VERSION,
          model: result.usedModel,
        },
      });
    }

    return res.json({
      promptVersion: AI_PROMPT_VERSION,
      model: result.usedModel,
      output: result.output,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(res, 500, 'AI_ASK_FAILED', 'AI ask failed.', error.message, req.requestId);
  }
});

/**
 * POST /markdown-to-carbon-html
 */
router.post('/markdown-to-carbon-html', async (req, res) => {
  try {
    const auth = await resolveAuthUser(req);
    if (auth.error) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token.', null, req.requestId);
    }

    const { markdown, metadata } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return sendError(res, 400, 'INVALID_INPUT', 'Markdown content is required.', null, req.requestId);
    }

    const rateKey = getRateKey(req, auth);
    const rate = checkAiRateLimit(rateKey);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfter / 1000));
      return sendError(res, 429, 'RATE_LIMITED', 'AI rate limit exceeded.', null, req.requestId);
    }

    const safeMarkdown = redactPii(markdown);
    const resolvedModel = GEMINI_CARBON_HTML_MODEL || GEMINI_MODEL;
    const resolvedFallback = GEMINI_CARBON_HTML_FALLBACK_MODEL || GEMINI_FALLBACK_MODEL || '';
    const systemInstruction =
      GEMINI_CARBON_HTML_SYSTEM_INSTRUCTION || buildMarkdownToCarbonHtmlSystemInstruction();

    const generationConfig = {
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
    };

    const result = await callWithFallback({
      prompt: safeMarkdown,
      primaryModel: resolvedModel,
      fallbackModel: resolvedFallback,
      systemInstruction,
      generationConfig,
      res,
      req,
    });

    if (result.error && !result.authFailed) return;
    if (result.authFailed) {
      return sendError(
        res,
        503,
        'AI_PROVIDER_AUTH_FAILED',
        'AI provider authentication failed. API key is invalid or expired.',
        null,
        req.requestId
      );
    }

    const cleaned = sanitizeGeneratedHtml(stripOuterHtmlDocument(stripMarkdownCodeFences(result.output)));

    if (usageStoreEnabled) {
      await createUsageEvent({
        userId: auth.userId,
        eventType: 'ai.markdown_to_carbon_html',
        units: Math.ceil(safeMarkdown.length / 1000),
        source: 'api',
        metadata: {
          requestId: req.requestId,
          promptVersion: AI_PROMPT_VERSION,
          model: result.usedModel,
          hasMetadata: Boolean(metadata && typeof metadata === 'object'),
        },
      });
    }

    return res.json({
      promptVersion: AI_PROMPT_VERSION,
      model: result.usedModel,
      output: cleaned,
    });
  } catch (error) {
    logEvent('error', {
      requestId: req.requestId,
      error: error.message,
    });
    return sendError(
      res,
      500,
      'AI_MARKDOWN_TO_CARBON_HTML_FAILED',
      'AI markdown-to-carbon-html failed.',
      error.message,
      req.requestId
    );
  }
});

export default router;
