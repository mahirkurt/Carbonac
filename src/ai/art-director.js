import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { parseMarkdown } from '../utils/markdown-parser.js';
import { getProjectRoot } from '../utils/file-utils.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-pro';
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models';
const ART_DIRECTOR_PROMPT_VERSION = process.env.ART_DIRECTOR_PROMPT_VERSION || 'v2';
const ART_DIRECTOR_PROMPT_ROLLBACK =
  process.env.ART_DIRECTOR_PROMPT_ROLLBACK || 'v1';
const ART_DIRECTOR_USE_REFERENCE_LIBRARY =
  process.env.ART_DIRECTOR_USE_REFERENCE_LIBRARY !== 'false';

const MAX_CONTENT_CHARS = 12000;
const LAYOUT_PROFILES = new Set(['symmetric', 'asymmetric', 'dashboard']);
const PRINT_PROFILES = new Set(['pagedjs-a4', 'pagedjs-a3']);
const COMPONENT_TYPES = new Set(['carbonchart', 'richtext', 'highlightbox']);

let referenceBriefCache = null;

const layoutPropsSchema = z.object({
  colSpan: z.coerce.number().int().min(1).max(16),
  offset: z.coerce.number().int().min(0).max(15).optional(),
}).passthrough();

const keyInsightsSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    return [value];
  }
  return value;
}, z.array(z.string()));

const sourcesSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    return [value];
  }
  return value;
}, z.array(z.string()));

const componentSchema = z.object({
  type: z.string(),
  layoutProps: layoutPropsSchema.optional(),
  styleOverrides: z.object({
    theme: z.enum(['white', 'g10', 'g90', 'g100']).optional(),
  }).optional(),
  data: z.unknown().optional(),
  className: z.string().optional(),
}).passthrough();

const documentPlanSchema = z.object({
  title: z.string().optional(),
  audience: z.string().optional(),
  requiredBlocks: z.array(z.string()).optional(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    purpose: z.string().optional(),
    requiredBlocks: z.array(z.string()).optional(),
    dataRefs: z.array(z.string()).optional(),
  }).passthrough()).optional(),
}).passthrough();

const pageBreakSchema = z.object({
  beforeSectionId: z.string().optional(),
  afterSectionId: z.string().optional(),
  selector: z.string().optional(),
  action: z.enum(['force-break', 'avoid-break']).optional(),
  reason: z.string().optional(),
}).passthrough();

const layoutPlanSchema = z.object({
  gridSystem: z.enum(['symmetric', 'asymmetric', 'dashboard']).optional(),
  components: z.array(componentSchema).optional(),
  pageBreaks: z.array(pageBreakSchema).optional(),
}).passthrough();

const layoutJsonSchema = z.object({
  layoutProfile: z.enum(['symmetric', 'asymmetric', 'dashboard']).optional(),
  printProfile: z.enum(['pagedjs-a4', 'pagedjs-a3']).optional(),
  gridSystem: z.enum(['symmetric', 'asymmetric', 'dashboard']).optional(),
  components: z.array(componentSchema).optional(),
  storytelling: z.object({
    executiveSummary: z.string().optional(),
    keyInsights: keyInsightsSchema.optional(),
    methodologyNotes: z.string().optional(),
    sources: sourcesSchema.optional(),
  }).optional(),
  styleHints: z.object({
    avoidBreakSelectors: z.array(z.string()).optional(),
    forceBreakSelectors: z.array(z.string()).optional(),
  }).optional(),
}).passthrough();

function normalizeLayoutProfile(value) {
  return LAYOUT_PROFILES.has(value) ? value : 'symmetric';
}

function normalizePrintProfile(value) {
  return PRINT_PROFILES.has(value) ? value : 'pagedjs-a4';
}

function buildSystemPrompt({ metadata, layoutProfile, printProfile, theme, referenceBrief }) {
  return `You are the art director for a print-ready report system.

Return JSON only. Use the requested layoutProfile and printProfile without changing them.
Do NOT include any document body text or excerpts. Do NOT add fields like "content", "html", or "markdown".
Keep all string values short (<= 120 chars). Components are structural placeholders only.
Limit components to at most 12 total.
Tone: concise executive summary, no jargon, no emojis. Highlight any outliers or trends when data is present.
Include sources/methodology notes for survey-style reports when available.

Visual richness targets:
- Use a balanced mix of components (RichText + HighlightBox + CarbonChart) to avoid monotony.
- If the content implies data (tables, metrics, survey, numbers), include at least one CarbonChart placeholder.
- Include at least one HighlightBox to elevate key insights or executive takeaways.
- Vary layout density: mix full-width blocks with multi-column blocks (e.g., 6/10, 8/8) and occasional offsets.
- Use styleOverrides.theme on a few components to introduce visual contrast (g10/g90) while keeping readability.

CarbonChart guidance:
- When you include a CarbonChart component, set chartType and dataHint.
- Prefer: time-series => line/area, correlation => scatter/bubble, composition => donut/pie, distribution => histogram/boxplot, hierarchy => treemap, flow => alluvial.

Document type guidance:
- docType: ${metadata.docType || metadata.documentType || 'report'}
- If docType indicates cv/resume, keep components <= 8, avoid charts unless explicitly requested, and prefer asymmetric layouts with a concise sidebar.

${referenceBrief ? `Reference cues (IBM Carbon-style):\n${referenceBrief}` : ''}

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
      "chartType": "bar|line|area|donut|stacked|scatter|bubble|radar|treemap|gauge|heatmap|pie|histogram|boxplot|meter|combo|lollipop|wordcloud|alluvial",
      "dataHint": "time-series|correlation|composition|distribution|hierarchy|flow|kpi|survey",
      "layoutProps": { "colSpan": 8, "offset": 0 },
      "styleOverrides": { "theme": "white|g10|g90|g100" }
    }
  ],
  "storytelling": {
    "executiveSummary": "Short executive summary.",
    "keyInsights": ["Highlight outliers or trends", "Use clear, executive wording"],
    "methodologyNotes": "Optional survey methodology notes.",
    "sources": ["Optional source references"]
  },
  "styleHints": {
    "avoidBreakSelectors": ["table", "pre", "blockquote"],
    "forceBreakSelectors": ["h2"]
  }
}`;
}

function resolvePromptVersion(value, fallback = 'v2') {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'v1' || normalized === 'v2') {
    return normalized;
  }
  return fallback;
}

function resolveRollbackVersion(value) {
  const normalized = resolvePromptVersion(value, '');
  return normalized || null;
}

function buildDocumentPlanPrompt({ metadata }) {
  return `You are a content planner for a print-ready report system.

Return JSON only. Capture the document outline and required blocks.
Use slug-like section IDs (lowercase, hyphen-separated).
Do NOT include document body text or excerpts. Keep titles concise.
Limit sections to at most 12 by grouping minor subsections.

Metadata:
- title: ${metadata.title || 'Untitled'}
- audience: ${metadata.audience || 'general'}
- docType: ${metadata.docType || metadata.documentType || 'report'}

Output schema:
{
  "title": "string",
  "audience": "string",
  "requiredBlocks": ["ExecutiveSummary", "KeyFindings"],
  "sections": [
    {
      "id": "string",
      "title": "string",
      "purpose": "string",
      "requiredBlocks": ["string"],
      "dataRefs": ["string"]
    }
  ]
}`;
}

function buildLayoutPlanPrompt({ metadata, layoutProfile, printProfile, theme, documentPlan, referenceBrief }) {
  return `You are the layout planner for a print-ready report system.

Return JSON only. Use the requested layoutProfile and printProfile without changing them.
Create a layoutPlan with gridSystem, components, and pageBreaks.
Include storytelling (executiveSummary + keyInsights + methodologyNotes + sources) and styleHints.
Do NOT include any document body text or excerpts. Do NOT add fields like "content", "html", or "markdown".
Keep all string values short (<= 120 chars). Components are structural placeholders only.
Limit components to at most 12 total.

Visual richness targets:
- Use a balanced mix of components (RichText + HighlightBox + CarbonChart) to avoid monotony.
- If the documentPlan suggests data-heavy sections, include at least one CarbonChart placeholder.
- Include at least one HighlightBox to elevate key insights or executive takeaways.
- Vary layout density: mix full-width blocks with multi-column blocks (e.g., 6/10, 8/8) and occasional offsets.
- Use styleOverrides.theme on a few components to introduce visual contrast (g10/g90) while keeping readability.

CarbonChart guidance:
- When you include a CarbonChart component, set chartType and dataHint.
- Prefer: time-series => line/area, correlation => scatter/bubble, composition => donut/pie, distribution => histogram/boxplot, hierarchy => treemap, flow => alluvial.

Document type guidance:
- docType: ${metadata.docType || metadata.documentType || 'report'}
- If docType indicates cv/resume, keep components <= 8, avoid charts unless explicitly requested, and prefer asymmetric layouts with a concise sidebar.

${referenceBrief ? `Reference cues (IBM Carbon-style):\n${referenceBrief}` : ''}

Requested settings:
- layoutProfile: ${layoutProfile}
- printProfile: ${printProfile}
- theme: ${theme || 'white'}

DocumentPlan:
${JSON.stringify(documentPlan, null, 2)}

Output schema:
{
  "layoutProfile": "symmetric|asymmetric|dashboard",
  "printProfile": "pagedjs-a4|pagedjs-a3",
  "gridSystem": "symmetric|asymmetric|dashboard",
  "layoutPlan": {
    "gridSystem": "symmetric|asymmetric|dashboard",
	    "components": [
	      {
	        "type": "CarbonChart|RichText|HighlightBox",
	        "chartType": "bar|line|area|donut|stacked|scatter|bubble|radar|treemap|gauge|heatmap|pie|histogram|boxplot|meter|combo|lollipop|wordcloud|alluvial",
	        "dataHint": "time-series|correlation|composition|distribution|hierarchy|flow|kpi|survey",
	        "layoutProps": { "colSpan": 8, "offset": 0 },
	        "styleOverrides": { "theme": "white|g10|g90|g100" }
	      }
	    ],
    "pageBreaks": [
      {
        "beforeSectionId": "string",
        "action": "force-break",
        "reason": "string"
      }
    ]
  },
  "storytelling": {
    "executiveSummary": "Short executive summary.",
    "keyInsights": ["Highlight outliers or trends", "Use clear, executive wording"],
    "methodologyNotes": "Optional survey methodology notes.",
    "sources": ["Optional source references"]
  },
  "styleHints": {
    "avoidBreakSelectors": ["table", "pre", "blockquote"],
    "forceBreakSelectors": ["h2"]
  }
}`;
}

async function loadReferenceBrief() {
  if (!ART_DIRECTOR_USE_REFERENCE_LIBRARY) {
    return '';
  }
  if (referenceBriefCache !== null) {
    return referenceBriefCache;
  }
  try {
    const projectRoot = getProjectRoot();
    const manifestPath = path.join(projectRoot, 'library', 'manifest.json');
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);
    const items = Array.isArray(manifest?.items) ? manifest.items : [];
    const activeItems = items.filter((item) => item && item.status === 'active');
    const tagMap = new Map();
    activeItems.forEach((item) => {
      const title = item.title || item.id || 'IBM Reference';
      const tags = Array.isArray(item.tags) ? item.tags : [];
      tags
        .filter((tag) => typeof tag === 'string' && tag.startsWith('pattern:'))
        .forEach((tag) => {
          const key = tag.replace('pattern:', '').trim();
          if (!key) return;
          const list = tagMap.get(key) || [];
          if (!list.includes(title)) {
            list.push(title);
          }
          tagMap.set(key, list);
        });
    });

    const preferredTags = [
      'cover-page-hero',
      'chapter-opener',
      'executive-summary',
      'key-findings-list',
      'action-box',
      'hero-stat-with-quote',
      'survey-chart-page',
      'figure-with-caption',
      'case-study-module',
    ];
    const lines = preferredTags
      .filter((tag) => tagMap.has(tag))
      .slice(0, 6)
      .map((tag) => {
        const refs = (tagMap.get(tag) || []).slice(0, 2).join(', ');
        return `- ${tag}: ${refs}`;
      });

    referenceBriefCache = lines.length ? lines.join('\n') : '';
    return referenceBriefCache;
  } catch (error) {
    console.warn(`[art-director] Reference library unavailable: ${error.message}`);
    referenceBriefCache = '';
    return '';
  }
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

function parseNumericValue(value) {
  if (!value) return null;
  const cleaned = value
    .replace(/[%$]/g, '')
    .replace(/\s+/g, '')
    .trim();
  if (!cleaned) return null;
  const normalized = cleaned.includes(',') && !cleaned.includes('.')
    ? cleaned.replace(',', '.')
    : cleaned;
  const numeric = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isSeparatorLine(line) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line || '');
}

function extractMarkdownTables(content) {
  const lines = (content || '').split('\n');
  const tables = [];
  let i = 0;

  while (i < lines.length - 1) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    if (line.includes('|') && isSeparatorLine(nextLine)) {
      const header = parseTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      if (header.length > 0 && rows.length > 0) {
        tables.push({ header, rows });
      }
      continue;
    }
    i += 1;
  }

  return tables;
}

function buildFallbackInsights(content) {
  const tables = extractMarkdownTables(content);
  const insights = [];

  for (const table of tables) {
    const { header, rows } = table;
    if (!header.length || rows.length < 2) {
      continue;
    }

    const columnValues = header.map(() => []);
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const numeric = parseNumericValue(cell);
        if (numeric === null) return;
        const label = row[0] && parseNumericValue(row[0]) === null
          ? row[0].trim()
          : `Satir ${rowIndex + 1}`;
        columnValues[colIndex].push({ value: numeric, label });
      });
    });

    columnValues.forEach((values, colIndex) => {
      if (colIndex === 0 || values.length < 2) return;
      const colName = header[colIndex] || `Kolon ${colIndex + 1}`;
      const ordered = values.map((entry) => entry.value);
      const isIncreasing = ordered.every((v, idx, arr) => idx === 0 || v >= arr[idx - 1]);
      const isDecreasing = ordered.every((v, idx, arr) => idx === 0 || v <= arr[idx - 1]);
      if (isIncreasing) {
        insights.push(`${colName} kolonunda belirgin bir artan trend gorunuyor.`);
      } else if (isDecreasing) {
        insights.push(`${colName} kolonunda belirgin bir azalan trend gorunuyor.`);
      }

      if (values.length >= 3) {
        const nums = values.map((entry) => entry.value);
        const mean = nums.reduce((sum, n) => sum + n, 0) / nums.length;
        const variance = nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / nums.length;
        const stdDev = Math.sqrt(variance);
        const maxEntry = values.reduce((best, entry) => (entry.value > best.value ? entry : best), values[0]);
        const minEntry = values.reduce((best, entry) => (entry.value < best.value ? entry : best), values[0]);

        if (maxEntry.value > mean + stdDev * 2) {
          insights.push(`${colName} kolonunda ${maxEntry.label} aykiri derecede yuksek bir deger sergiliyor.`);
        } else if (minEntry.value < mean - stdDev * 2) {
          insights.push(`${colName} kolonunda ${minEntry.label} aykiri derecede dusuk bir deger sergiliyor.`);
        }
      }
    });

    if (insights.length >= 3) {
      break;
    }
  }

  return Array.from(new Set(insights)).slice(0, 3);
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

function formatTocForAi(toc = []) {
  if (!Array.isArray(toc) || toc.length === 0) {
    return '';
  }
  return toc
    .filter((entry) => entry && entry.title)
    .map((entry) => {
      const level = Math.max(1, Number(entry.level) || 1);
      const indent = '  '.repeat(Math.min(3, level - 1));
      return `${indent}- ${entry.title}`;
    })
    .join('\n');
}

function buildOutlineContent({ toc, content, maxChars = 2000 }) {
  const summary = summarizeContent(content);
  const headings = formatTocForAi(toc);
  const parts = [];
  if (summary) {
    parts.push(`Summary: ${summary}`);
  }
  if (headings) {
    parts.push(`Headings:\n${headings}`);
  }
  const combined = parts.join('\n\n').trim();
  return combined ? combined.slice(0, maxChars) : '';
}

function buildFallbackDocumentPlan({ metadata, toc = [], content }) {
  const sections = (toc || [])
    .filter((entry) => entry && typeof entry.title === 'string')
    .map((entry) => ({
      id: entry.id || entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: entry.title,
      purpose: entry.level === 1 ? 'section-overview' : 'section-detail',
      requiredBlocks: [],
      dataRefs: [],
    }));

  if (!sections.length) {
    sections.push({
      id: 'overview',
      title: metadata.title || 'Ozet',
      purpose: 'overview',
      requiredBlocks: ['ExecutiveSummary'],
      dataRefs: [],
    });
  }

  return {
    title: metadata.title || 'Untitled',
    audience: metadata.audience || 'general',
    requiredBlocks: ['ExecutiveSummary', 'KeyFindings'],
    sections,
  };
}

function buildFallbackLayoutPlan({ layoutProfile, documentPlan }) {
  const pageBreaks = Array.isArray(documentPlan?.sections)
    ? documentPlan.sections.slice(1).map((section) => ({
        beforeSectionId: section.id,
        action: 'force-break',
        reason: 'section-break',
      }))
    : [];

  return {
    gridSystem: layoutProfile,
    components: [],
    pageBreaks,
  };
}

function normalizeSourcesInput(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return [value.trim()].filter(Boolean);
  }
  return [];
}

function buildFallbackLayoutJson({ content, metadata, layoutProfile, printProfile, theme, documentPlan }) {
  const executiveSummary = summarizeContent(content);
  const keyInsights = buildFallbackInsights(content);
  const methodologyNotes =
    metadata.methodologyNotes ||
    metadata.methodology ||
    metadata.method ||
    '';
  const sources = normalizeSourcesInput(metadata.sources || metadata.source);
  const forceBreakSelectors = content.length > 800 ? ['h2'] : [];
  const resolvedDocumentPlan = documentPlan || buildFallbackDocumentPlan({ metadata, content });
  const storytelling = (executiveSummary || keyInsights.length || methodologyNotes || sources.length)
    ? {
        executiveSummary,
        keyInsights,
        methodologyNotes,
        sources,
      }
    : null;
  const layoutPlan = buildFallbackLayoutPlan({ layoutProfile, documentPlan: resolvedDocumentPlan });

  return {
    version: 'v1',
    layoutProfile,
    printProfile,
    gridSystem: layoutProfile,
    theme: theme || 'white',
    components: [],
    documentPlan: resolvedDocumentPlan,
    layoutPlan,
    storytelling,
    styleHints: {
      avoidBreakSelectors: ['table', 'pre', 'blockquote'],
      forceBreakSelectors,
    },
    metadata: {
      title: metadata.title || 'Untitled',
    },
  };
}

function normalizeComponents(components = []) {
  if (!Array.isArray(components)) return [];
  return components.map((component) => {
    const next = { ...component };
    const layoutProps = component.layoutProps && typeof component.layoutProps === 'object'
      ? { ...component.layoutProps }
      : {};
    let colSpan = Number(layoutProps.colSpan);
    if (!Number.isFinite(colSpan)) colSpan = 16;
    colSpan = Math.max(1, Math.min(16, Math.round(colSpan)));
    let offset = Number(layoutProps.offset);
    if (!Number.isFinite(offset)) offset = 0;
    offset = Math.max(0, Math.min(15, Math.round(offset)));
    if (offset + colSpan > 16) {
      colSpan = Math.max(1, 16 - offset);
    }
    next.layoutProps = { ...layoutProps, colSpan, offset };
    if (typeof next.type === 'string' && !COMPONENT_TYPES.has(next.type.toLowerCase())) {
      next.type = 'RichText';
    }
    return next;
  });
}

function validateLayoutJson(input, fallback) {
  const result = layoutJsonSchema.safeParse(input);
  if (!result.success) {
    console.warn('[art-director] layout JSON validation failed, using fallback.');
    return fallback;
  }
  return result.data;
}

function normalizeLayoutJson(input, fallback, layoutProfile, printProfile) {
  const output = { ...fallback };

  if (input && typeof input === 'object') {
    if (typeof input.gridSystem === 'string') {
      output.gridSystem = input.gridSystem;
    }
    if (input.documentPlan) {
      output.documentPlan = input.documentPlan;
    }
    if (input.layoutPlan) {
      output.layoutPlan = input.layoutPlan;
    }
    if (Array.isArray(input.components)) {
      output.components = normalizeComponents(input.components);
    }
    if (input.layoutPlan?.components && (!output.components || output.components.length === 0)) {
      output.components = normalizeComponents(input.layoutPlan.components);
    }
    if (input.layoutPlan?.gridSystem) {
      output.gridSystem = input.layoutPlan.gridSystem;
    }
    if (input.storytelling && typeof input.storytelling === 'object') {
      const keyInsights = Array.isArray(input.storytelling.keyInsights)
        ? input.storytelling.keyInsights.map((item) => item.trim()).filter(Boolean)
        : output.storytelling?.keyInsights || [];
      const sources = Array.isArray(input.storytelling.sources)
        ? input.storytelling.sources.map((item) => String(item).trim()).filter(Boolean)
        : output.storytelling?.sources || [];
      output.storytelling = {
        executiveSummary:
          typeof input.storytelling.executiveSummary === 'string'
            ? input.storytelling.executiveSummary
            : output.storytelling?.executiveSummary || '',
        keyInsights,
        methodologyNotes:
          typeof input.storytelling.methodologyNotes === 'string'
            ? input.storytelling.methodologyNotes
            : output.storytelling?.methodologyNotes || '',
        sources,
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

  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
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
  return { jsonText, model };
}

async function requestJsonWithFallback({ prompt, content }) {
  try {
    return await requestJsonResponse({
      model: GEMINI_MODEL,
      prompt,
      content,
    });
  } catch (error) {
    if (GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL) {
      return await requestJsonResponse({
        model: GEMINI_FALLBACK_MODEL,
        prompt,
        content,
      });
    }
    throw error;
  }
}

async function runLegacyPrompt({
  prompt,
  content,
  fallbackLayout,
  layoutProfile,
  printProfile,
  promptVersion,
}) {
  let layoutInput = null;
  let modelUsed = null;
  try {
    const response = await requestJsonWithFallback({ prompt, content });
    layoutInput = JSON.parse(response.jsonText);
    modelUsed = response.model;
  } catch (error) {
    console.warn(`[art-director] ${promptVersion} prompt failed, using fallback.`);
  }

  const validated = validateLayoutJson(layoutInput, fallbackLayout);
  const normalized = normalizeLayoutJson(
    validated,
    fallbackLayout,
    layoutProfile,
    printProfile
  );
  normalized.ai = {
    promptVersion,
    model: modelUsed,
    source: layoutInput ? 'gemini' : 'fallback',
  };
  return {
    layoutProfile: normalized.layoutProfile,
    printProfile: normalized.printProfile,
    layoutJson: normalized,
    promptVersion,
    model: modelUsed,
    source: layoutInput ? 'gemini' : 'fallback',
  };
}

export async function getArtDirection({ markdown, layoutProfile, printProfile, theme }) {
  const { metadata, content, toc } = parseMarkdown(markdown || '');
  const resolvedLayoutProfile = normalizeLayoutProfile(layoutProfile);
  const resolvedPrintProfile = normalizePrintProfile(printProfile);
  const fallbackDocumentPlan = buildFallbackDocumentPlan({ metadata, toc, content });
  const fallback = buildFallbackLayoutJson({
    content,
    metadata,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    documentPlan: fallbackDocumentPlan,
  });

  const promptVersion = resolvePromptVersion(ART_DIRECTOR_PROMPT_VERSION, 'v2');
  const rollbackVersion = resolveRollbackVersion(ART_DIRECTOR_PROMPT_ROLLBACK);
  const referenceBrief = await loadReferenceBrief();

  const outlineContent = buildOutlineContent({ toc, content });
  const clippedContent = (outlineContent || content || '').slice(0, MAX_CONTENT_CHARS);
  let documentPlan = fallbackDocumentPlan;
  let layoutInput = null;
  let documentModel = null;
  let layoutModel = null;

  if (!GEMINI_API_KEY) {
    console.warn('[art-director] Missing GEMINI_API_KEY, using fallback.');
    return {
      layoutProfile: resolvedLayoutProfile,
      printProfile: resolvedPrintProfile,
      layoutJson: fallback,
      source: 'fallback',
      promptVersion,
    };
  }

  if (promptVersion === 'v1') {
    const prompt = buildSystemPrompt({
      metadata,
      layoutProfile: resolvedLayoutProfile,
      printProfile: resolvedPrintProfile,
      theme,
      referenceBrief,
    });
    return await runLegacyPrompt({
      prompt,
      content: clippedContent,
      fallbackLayout: fallback,
      layoutProfile: resolvedLayoutProfile,
      printProfile: resolvedPrintProfile,
      promptVersion,
    });
  }

  const docPrompt = buildDocumentPlanPrompt({ metadata });
  try {
    const docResponse = await requestJsonWithFallback({ prompt: docPrompt, content: clippedContent });
    const parsedDoc = JSON.parse(docResponse.jsonText);
    const validatedDoc = documentPlanSchema.safeParse(parsedDoc);
    if (validatedDoc.success) {
      documentPlan = validatedDoc.data;
      documentModel = docResponse.model;
    } else {
      console.warn('[art-director] DocumentPlan validation failed, using fallback plan.');
    }
  } catch (error) {
    console.warn('[art-director] DocumentPlan failed, using fallback plan.');
  }

  const layoutPrompt = buildLayoutPlanPrompt({
    metadata,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    documentPlan,
    referenceBrief,
  });

  try {
    const layoutResponse = await requestJsonWithFallback({
      prompt: layoutPrompt,
      content: clippedContent,
    });
    layoutInput = JSON.parse(layoutResponse.jsonText);
    layoutModel = layoutResponse.model;
  } catch (error) {
    console.warn('[art-director] LayoutPlan failed, using fallback layout.');
  }

  if (!layoutInput && rollbackVersion && rollbackVersion !== promptVersion) {
    console.warn(`[art-director] Rolling back to prompt ${rollbackVersion}.`);
    const prompt = buildSystemPrompt({
      metadata,
      layoutProfile: resolvedLayoutProfile,
      printProfile: resolvedPrintProfile,
      theme,
    });
    return await runLegacyPrompt({
      prompt,
      content: clippedContent,
      fallbackLayout: fallback,
      layoutProfile: resolvedLayoutProfile,
      printProfile: resolvedPrintProfile,
      promptVersion: rollbackVersion,
    });
  }

  if (layoutInput && typeof layoutInput === 'object') {
    layoutInput.documentPlan = documentPlan;
    if (layoutInput.layoutPlan) {
      const validatedLayoutPlan = layoutPlanSchema.safeParse(layoutInput.layoutPlan);
      if (!validatedLayoutPlan.success) {
        console.warn('[art-director] LayoutPlan validation failed, using fallback plan.');
        layoutInput.layoutPlan = fallback.layoutPlan;
      }
    } else {
      layoutInput.layoutPlan = fallback.layoutPlan;
    }
  }

  const validated = validateLayoutJson(layoutInput, fallback);
  const normalized = normalizeLayoutJson(
    validated,
    fallback,
    resolvedLayoutProfile,
    resolvedPrintProfile
  );
  normalized.ai = {
    promptVersion,
    models: {
      documentPlan: documentModel,
      layoutPlan: layoutModel,
    },
    source: layoutInput ? 'gemini' : 'fallback',
  };
  return {
    layoutProfile: normalized.layoutProfile,
    printProfile: normalized.printProfile,
    layoutJson: normalized,
    source: layoutInput ? 'gemini' : 'fallback',
    promptVersion,
    models: normalized.ai.models,
  };
}
