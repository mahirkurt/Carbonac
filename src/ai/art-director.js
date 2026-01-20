import { parseMarkdown } from '../utils/markdown-parser.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-pro';
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models';

const MAX_CONTENT_CHARS = 12000;
const LAYOUT_PROFILES = new Set(['symmetric', 'asymmetric', 'dashboard']);
const PRINT_PROFILES = new Set(['pagedjs-a4', 'pagedjs-a3']);

function normalizeLayoutProfile(value) {
  return LAYOUT_PROFILES.has(value) ? value : 'symmetric';
}

function normalizePrintProfile(value) {
  return PRINT_PROFILES.has(value) ? value : 'pagedjs-a4';
}

function buildSystemPrompt({ metadata, layoutProfile, printProfile, theme }) {
  return `You are the art director for a print-ready report system.

Return JSON only. Use the requested layoutProfile and printProfile without changing them.

Requested settings:
- layoutProfile: ${layoutProfile}
- printProfile: ${printProfile}
- theme: ${theme || 'white'}
- title: ${metadata.title || 'Untitled'}
- audience: ${metadata.audience || 'general'}

Output schema:
{
  "layoutProfile": "symmetric|asymmetric|dashboard",
  "printProfile": "pagedjs-a4|pagedjs-a3",
  "gridSystem": "symmetric|asymmetric|dashboard",
  "components": [
    {
      "type": "CarbonChart|RichText|HighlightBox",
      "layoutProps": { "colSpan": 8, "offset": 0 },
      "styleOverrides": { "theme": "white|g10|g90|g100" }
    }
  ],
  "storytelling": {
    "executiveSummary": "Short executive summary.",
    "keyInsights": ["Insight one", "Insight two"]
  },
  "styleHints": {
    "avoidBreakSelectors": ["table", "pre", "blockquote"],
    "forceBreakSelectors": ["h2"]
  }
}`;
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1];
  }
  const raw = text.match(/\{[\s\S]*\}/);
  return raw ? raw[0] : null;
}

function stripMarkdown(content) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>+\s?/gm, '')
    .replace(/[#*_>-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarizeContent(content) {
  const plain = stripMarkdown(content || '');
  if (!plain) return '';
  const sentences = plain.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 0) {
    return sentences.slice(0, 2).join(' ').trim();
  }
  return plain.slice(0, 200);
}

function buildFallbackLayoutJson({ content, metadata, layoutProfile, printProfile, theme }) {
  const executiveSummary = summarizeContent(content);
  const forceBreakSelectors = content.length > 800 ? ['h2'] : [];
  return {
    version: 'v1',
    layoutProfile,
    printProfile,
    gridSystem: layoutProfile,
    theme: theme || 'white',
    components: [],
    storytelling: executiveSummary
      ? {
          executiveSummary,
          keyInsights: [],
        }
      : null,
    styleHints: {
      avoidBreakSelectors: ['table', 'pre', 'blockquote'],
      forceBreakSelectors,
    },
    metadata: {
      title: metadata.title || 'Untitled',
    },
  };
}

function normalizeLayoutJson(input, fallback, layoutProfile, printProfile) {
  const output = { ...fallback };

  if (input && typeof input === 'object') {
    if (typeof input.gridSystem === 'string') {
      output.gridSystem = input.gridSystem;
    }
    if (Array.isArray(input.components)) {
      output.components = input.components;
    }
    if (input.storytelling && typeof input.storytelling === 'object') {
      output.storytelling = {
        executiveSummary:
          typeof input.storytelling.executiveSummary === 'string'
            ? input.storytelling.executiveSummary
            : output.storytelling?.executiveSummary || '',
        keyInsights: Array.isArray(input.storytelling.keyInsights)
          ? input.storytelling.keyInsights
          : output.storytelling?.keyInsights || [],
      };
    }
    if (input.styleHints && typeof input.styleHints === 'object') {
      output.styleHints = {
        avoidBreakSelectors: Array.isArray(input.styleHints.avoidBreakSelectors)
          ? input.styleHints.avoidBreakSelectors
          : output.styleHints?.avoidBreakSelectors || [],
        forceBreakSelectors: Array.isArray(input.styleHints.forceBreakSelectors)
          ? input.styleHints.forceBreakSelectors
          : output.styleHints?.forceBreakSelectors || [],
      };
    }
  }

  output.layoutProfile = layoutProfile || output.layoutProfile;
  output.printProfile = printProfile || output.printProfile;

  return output;
}

async function callGemini(model, prompt, content) {
  const body = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\nCONTENT:\n${content}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function requestJsonResponse({ model, prompt, content }) {
  const responseText = await callGemini(model, prompt, content);
  const jsonText = extractJson(responseText);
  if (!jsonText) {
    throw new Error(`Gemini response did not include a JSON payload (${model}).`);
  }
  return jsonText;
}

export async function getArtDirection({ markdown, layoutProfile, printProfile, theme }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is required for art direction.');
  }
  const { metadata, content } = parseMarkdown(markdown || '');
  const resolvedLayoutProfile = normalizeLayoutProfile(layoutProfile);
  const resolvedPrintProfile = normalizePrintProfile(printProfile);
  const fallback = buildFallbackLayoutJson({
    content,
    metadata,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
  });

  const prompt = buildSystemPrompt({
    metadata,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
  });
  const clippedContent = content.slice(0, MAX_CONTENT_CHARS);
  let jsonText = null;

  try {
    jsonText = await requestJsonResponse({
      model: GEMINI_MODEL,
      prompt,
      content: clippedContent,
    });
  } catch (error) {
    if (GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL) {
      jsonText = await requestJsonResponse({
        model: GEMINI_FALLBACK_MODEL,
        prompt,
        content: clippedContent,
      });
    } else {
      throw error;
    }
  }

  const parsed = JSON.parse(jsonText);
  const normalized = normalizeLayoutJson(
    parsed,
    fallback,
    resolvedLayoutProfile,
    resolvedPrintProfile
  );
  return {
    layoutProfile: normalized.layoutProfile,
    printProfile: normalized.printProfile,
    layoutJson: normalized,
  };
}
