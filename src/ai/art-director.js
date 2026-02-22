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
const PRINT_PROFILES = new Set(['pagedjs-a4', 'pagedjs-a3', 'pagedjs-a5']);
const COMPONENT_TYPES = new Set([
  'carbonchart', 'richtext', 'highlightbox',
  'quote', 'timeline', 'datatable', 'figure',
  'patternblock', 'marginnote',
]);

let referenceBriefCache = null;

// QA feedback cache (keyed by content hash, max 10 entries, 30-min TTL)
const qaFeedbackCache = new Map();
const QA_FEEDBACK_TTL = 30 * 60 * 1000;
const QA_FEEDBACK_MAX = 10;

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return String(hash);
}

export function extractQaFeedback(qaReport) {
  if (!qaReport || typeof qaReport !== 'object') return null;
  const feedback = {};
  const typographyScore = qaReport.typographyScore ?? qaReport.typography?.score;
  if (typeof typographyScore === 'number' && typographyScore < 70) {
    feedback.lowTypography = true;
    feedback.typographyScore = typographyScore;
  }
  const chartCount = qaReport.chartCount ?? qaReport.visualRichness?.charts ?? 0;
  const tableCount = qaReport.tableCount ?? qaReport.visualRichness?.tables ?? 0;
  if (chartCount === 0 && tableCount > 0) {
    feedback.missingCharts = true;
  }
  const patternCount = qaReport.patternCount ?? qaReport.visualRichness?.patterns ?? 0;
  if (patternCount === 0) {
    feedback.missingPatterns = true;
  }
  const componentTypes = qaReport.componentTypes ?? qaReport.visualRichness?.componentTypes;
  if (typeof componentTypes === 'number' && componentTypes <= 2) {
    feedback.lowVariety = true;
  }
  const severity = qaReport.aiReview?.severity || qaReport.severity;
  if (severity === 'high') {
    feedback.highSeverity = true;
    feedback.severitySummary = qaReport.aiReview?.summary || qaReport.summary || '';
  }
  const layoutSuggestions = qaReport.aiReview?.layoutSuggestions || qaReport.layoutSuggestions;
  if (Array.isArray(layoutSuggestions) && layoutSuggestions.length) {
    feedback.layoutSuggestions = layoutSuggestions.slice(0, 3);
  }
  return Object.keys(feedback).length ? feedback : null;
}

export function storeQaFeedback(contentKey, qaReport) {
  const feedback = extractQaFeedback(qaReport);
  if (!feedback) return;
  const hash = simpleHash(contentKey);
  qaFeedbackCache.set(hash, { feedback, timestamp: Date.now() });
  // Evict oldest if over limit
  if (qaFeedbackCache.size > QA_FEEDBACK_MAX) {
    const oldest = [...qaFeedbackCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) qaFeedbackCache.delete(oldest[0]);
  }
}

function getQaFeedback(contentKey) {
  const hash = simpleHash(contentKey);
  const entry = qaFeedbackCache.get(hash);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > QA_FEEDBACK_TTL) {
    qaFeedbackCache.delete(hash);
    return null;
  }
  return entry.feedback;
}

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
  printProfile: z.enum(['pagedjs-a4', 'pagedjs-a3', 'pagedjs-a5']).optional(),
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

Component types available:
- RichText: Body text, paragraphs, lists (default for prose)
- HighlightBox: Executive takeaways, key insights, warnings (tone: info/warning/success/danger)
- CarbonChart: Data visualization placeholder (set chartType + dataHint)
- Quote: Attributed quotations for testimonials or expert opinions
- Timeline: Chronological event sequences (horizontal or vertical)
- DataTable: Structured tabular data with semantic markup
- Figure: Image or diagram with caption
- PatternBlock: IBM design patterns for structured page compositions. Subtypes:
  - cover-page-hero: Full-page opening with large title, subtitle, and visual accent
  - chapter-opener: Section divider with part number, title, and optional subtitle
  - executive-summary: Structured summary with key metrics, findings list, and methodology note
  - hero-stat-with-quote: Large statistic paired with an expert quote for impact
  - case-study-module: Bordered box with challenge/solution/result structure
  - kpi-grid: 3-4 column grid of key performance indicators
  - key-findings-list: Numbered or bulleted findings with severity/priority markers
  - action-box: Call-to-action section with recommendations and next steps
  - figure-with-caption: Image/diagram container with structured caption and source
  - appendix-page: Reference section with compact typography and dense layout
  Set "patternType" field to specify the subtype.
- MarginNote: Sidebar annotations for supplementary context (align: left/right)

Visual richness targets:
- Use a varied mix of component types to avoid monotony. Aim for at least 3 different types.
- If content implies data (tables, metrics, survey), include at least one CarbonChart.
- Include at least one HighlightBox for key insights or executive takeaways.
- Use Quote for testimonials, expert opinions, or notable statements.
- Use PatternBlock for cover pages and section openers where appropriate.
- For reports with 4+ sections, use PatternBlock(chapter-opener) between major parts.
- For data-heavy reports, use PatternBlock(kpi-grid) to summarize key metrics upfront.
- For executive reports, use PatternBlock(executive-summary) near the beginning.

Narrative structure (follow this arc):
1. Hook: Open with the most impactful finding, statistic, or provocative question
2. Context: Establish background, scope, and methodology (use MarginNote for methodology details)
3. Evidence: Present data with CarbonChart and DataTable visualizations
4. Analysis: Interpret findings using HighlightBox callouts for key takeaways
5. Conclusion: Summarize with actionable recommendations in a g10-themed closing section
- Each major narrative shift (hook→context, evidence→analysis, analysis→conclusion) deserves a page break
- Avoid front-loading all text — interleave narrative with visual elements

Grid composition rubrics (16-column grid):
- Opening section: full-width (colSpan: 16) for introductory text
- Data sections: 10/6 or 6/10 split (chart + insight side-by-side)
- Highlight callouts: colSpan 12 with offset 2 for visual breathing room
- Multi-metric KPI: 4/4/4/4 grid for dashboards
- Sidebar pattern: 11/5 split with MarginNote in narrow column
- Closing: full-width with g10 theme for executive summary
- NEVER use more than 3 consecutive full-width (colSpan: 16) components
- At least 40% of components should have colSpan < 16

CarbonChart guidance:
- When you include a CarbonChart, set chartType and dataHint.
- Prefer: time-series => line/area, correlation => scatter/bubble, composition => donut/pie, distribution => histogram/boxplot, hierarchy => treemap, flow => alluvial.

Document type guidance:
- docType: ${metadata.docType || metadata.documentType || 'report'}
- If docType indicates cv/resume, keep components <= 8, avoid charts unless explicitly requested, and prefer asymmetric layouts with a concise sidebar.
  CV/resume-specific PatternBlock subtypes: cv-profile, cv-summary, cv-experience, cv-education, cv-skills, cv-projects, cv-certifications, cv-languages.
  Start with PatternBlock(cv-profile) for the header, use cv-experience for work history, cv-education for education.
${printProfile === 'pagedjs-a5' ? `
A5 grid rules (narrow page — 148mm wide):
- Prefer full-width (colSpan: 16) for most content
- Maximum split: 10/6 (chart + caption only, not for body text)
- KPI grid: 2 columns (8/8), not 4-column
- Do not use offset patterns — A5 margins already provide breathing room
- Avoid MarginNote — insufficient column width
` : ''}
Print design token reference:
- Typography: Productive (body, label, compact) vs Expressive (heading, display, editorial)
- Grid gutters: wide (32px), narrow (16px), condensed (1px)
- CMYK-safe accents: blue-60, green-60, red-60
- Dark themes (g90/g100) use light text tokens — contrast increases automatically

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
  "printProfile": "pagedjs-a4|pagedjs-a3|pagedjs-a5",
  "gridSystem": "symmetric|asymmetric|dashboard",
  "components": [
    {
      "type": "CarbonChart|RichText|HighlightBox|Quote|Timeline|DataTable|Figure|PatternBlock|MarginNote",
      "chartType": "bar|line|area|donut|stacked|scatter|bubble|radar|treemap|gauge|heatmap|pie|histogram|boxplot|meter|combo|lollipop|wordcloud|alluvial",
      "dataHint": "time-series|correlation|composition|distribution|hierarchy|flow|kpi|survey",
      "patternType": "cover-page-hero|chapter-opener|executive-summary|hero-stat-with-quote|case-study-module|kpi-grid|key-findings-list|action-box|figure-with-caption|appendix-page",
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

function buildLayoutPlanPrompt({ metadata, layoutProfile, printProfile, theme, documentPlan, referenceBrief, qaFeedback }) {
  const feedbackBlock = qaFeedback
    ? `\nPrior QA feedback (avoid repeating these issues):\n${JSON.stringify(qaFeedback)}\n`
    : '';
  return `You are the layout planner for a print-ready report system.
${feedbackBlock}

Return JSON only. Use the requested layoutProfile and printProfile without changing them.
Create a layoutPlan with gridSystem, components, and pageBreaks.
Include storytelling (executiveSummary + keyInsights + methodologyNotes + sources) and styleHints.
Do NOT include any document body text or excerpts. Do NOT add fields like "content", "html", or "markdown".
Keep all string values short (<= 120 chars). Components are structural placeholders only.
Limit components to at most 12 total.

Component types available:
- RichText: Body text, paragraphs, lists (default for prose)
- HighlightBox: Executive takeaways, key insights, warnings (tone: info/warning/success/danger)
- CarbonChart: Data visualization placeholder (set chartType + dataHint)
- Quote: Attributed quotations for testimonials or expert opinions
- Timeline: Chronological event sequences
- DataTable: Structured tabular data with semantic markup
- Figure: Image or diagram with caption
- PatternBlock: IBM design patterns. Set "patternType" to one of:
  cover-page-hero, chapter-opener, executive-summary, hero-stat-with-quote,
  case-study-module, kpi-grid, key-findings-list, action-box,
  figure-with-caption, appendix-page
- MarginNote: Sidebar annotations for supplementary context

Grid composition rubrics (16-column grid):
- Opening section: full-width (colSpan: 16) for introductory text
- Data sections: 10/6 or 6/10 split (chart + insight side-by-side)
- Highlight callouts: colSpan 12 with offset 2 for visual breathing room
- Multi-metric KPI: 4/4/4/4 grid for dashboards
- Sidebar pattern: 11/5 split with MarginNote in narrow column
- NEVER use more than 3 consecutive full-width (colSpan: 16) components
- At least 40% of components should have colSpan < 16

Narrative structure (follow this arc for coherent storytelling):
1. Hook: Open with the most impactful finding, statistic, or provocative question.
   Use PatternBlock(cover-page-hero) or a bold HighlightBox.
2. Context: Establish background, scope, and methodology.
   Use MarginNote for methodology details to keep the main flow clean.
3. Evidence: Present data with CarbonChart and DataTable visualizations.
   Use 10/6 or 6/10 grid splits for chart + insight pairings.
4. Analysis: Interpret findings using HighlightBox callouts for key takeaways.
   Use PatternBlock(key-findings-list) for structured findings.
5. Conclusion: Summarize with actionable recommendations.
   Use a g10-themed RichText or PatternBlock(action-box) for closing.
- Each major narrative shift (hook→context, evidence→analysis, analysis→conclusion) deserves a page break.
- Avoid front-loading all text — interleave narrative with visual elements.

CarbonChart guidance:
- When you include a CarbonChart, set chartType and dataHint.
- Prefer: time-series => line/area, correlation => scatter/bubble, composition => donut/pie, distribution => histogram/boxplot, hierarchy => treemap, flow => alluvial.

Document type guidance:
- docType: ${metadata.docType || metadata.documentType || 'report'}
- If docType indicates cv/resume, keep components <= 8, avoid charts, prefer asymmetric layouts with concise sidebar.
  CV/resume-specific PatternBlock subtypes: cv-profile, cv-summary, cv-experience, cv-education, cv-skills, cv-projects, cv-certifications, cv-languages.
  Start with PatternBlock(cv-profile) for the header, use cv-experience for work history, cv-education for education.
${printProfile === 'pagedjs-a5' ? `
A5 grid rules (narrow page — 148mm wide):
- Prefer full-width (colSpan: 16) for most content
- Maximum split: 10/6 (chart + caption only, not for body text)
- KPI grid: 2 columns (8/8), not 4-column
- Do not use offset patterns — A5 margins already provide breathing room
- Avoid MarginNote — insufficient column width
` : ''}
Print design token reference:
- Typography: Productive (body, label, compact) vs Expressive (heading, display, editorial)
- Grid gutters: wide (32px), narrow (16px), condensed (1px)
- CMYK-safe accents: blue-60, green-60, red-60
- Dark themes (g90/g100) use light text tokens — contrast increases automatically

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
  "printProfile": "pagedjs-a4|pagedjs-a3|pagedjs-a5",
  "gridSystem": "symmetric|asymmetric|dashboard",
  "layoutPlan": {
    "gridSystem": "symmetric|asymmetric|dashboard",
    "components": [
      {
        "type": "CarbonChart|RichText|HighlightBox|Quote|Timeline|DataTable|Figure|PatternBlock|MarginNote",
        "chartType": "bar|line|...",
        "dataHint": "time-series|correlation|...",
        "patternType": "cover-page-hero|chapter-opener|executive-summary|hero-stat-with-quote|case-study-module|kpi-grid|key-findings-list|action-box|figure-with-caption|appendix-page",
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

function detectTrend(values) {
  if (values.length < 2) return null;
  const isIncreasing = values.every((v, i, a) => i === 0 || v >= a[i - 1]);
  const isDecreasing = values.every((v, i, a) => i === 0 || v <= a[i - 1]);
  if (isIncreasing) return 'increasing';
  if (isDecreasing) return 'decreasing';
  return null;
}

function detectOutlier(values, labels) {
  if (values.length < 3) return null;
  const mean = values.reduce((s, n) => s + n, 0) / values.length;
  const variance = values.reduce((s, n) => s + (n - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return null;
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[maxIdx]) maxIdx = i;
    if (values[i] < values[minIdx]) minIdx = i;
  }
  if (values[maxIdx] > mean + stdDev * 2) {
    return { type: 'high', label: labels[maxIdx], value: values[maxIdx] };
  }
  if (values[minIdx] < mean - stdDev * 2) {
    return { type: 'low', label: labels[minIdx], value: values[minIdx] };
  }
  return null;
}

function buildFallbackInsights(content) {
  const tables = extractMarkdownTables(content);
  const insights = [];

  for (const table of tables) {
    const { header, rows } = table;
    if (!header.length || rows.length < 2) continue;

    // Determine if first column is text labels (row-oriented data)
    const firstColIsLabel = rows.every(
      (row) => row[0] && parseNumericValue(row[0]) === null
    );
    const numericColStart = firstColIsLabel ? 1 : 0;
    const hasMultipleNumericCols =
      header.slice(numericColStart).filter((_, i) =>
        rows.some((row) => parseNumericValue(row[i + numericColStart]) !== null)
      ).length >= 2;

    // Row-wise analysis: each row is a data series across columns
    if (firstColIsLabel && hasMultipleNumericCols) {
      for (const row of rows) {
        const label = row[0].trim();
        const values = row.slice(numericColStart).map(parseNumericValue).filter((v) => v !== null);
        if (values.length < 2) continue;

        const trend = detectTrend(values);
        if (trend === 'increasing') {
          insights.push(`${label} satirinda belirgin bir artan trend gorunuyor.`);
        } else if (trend === 'decreasing') {
          insights.push(`${label} satirinda belirgin bir azalan trend gorunuyor.`);
        }

        const colLabels = header.slice(numericColStart);
        const outlier = detectOutlier(values, colLabels);
        if (outlier) {
          const direction = outlier.type === 'high' ? 'yuksek' : 'dusuk';
          insights.push(`${label} satirinda ${outlier.label} aykiri derecede ${direction} bir deger sergiliyor.`);
        }
        if (insights.length >= 3) break;
      }
    }

    // Column-wise analysis: compare rows within each column
    if (insights.length < 3) {
      for (let colIdx = numericColStart; colIdx < header.length; colIdx++) {
        const colName = header[colIdx] || `Kolon ${colIdx + 1}`;
        const values = [];
        const labels = [];
        for (const row of rows) {
          const num = parseNumericValue(row[colIdx]);
          if (num === null) continue;
          values.push(num);
          labels.push(firstColIsLabel ? row[0].trim() : `Satir ${rows.indexOf(row) + 1}`);
        }
        if (values.length < 2) continue;

        const outlier = detectOutlier(values, labels);
        if (outlier) {
          const direction = outlier.type === 'high' ? 'yuksek' : 'dusuk';
          insights.push(`${colName} kolonunda ${outlier.label} aykiri derecede ${direction} bir deger sergiliyor.`);
        }
        if (insights.length >= 3) break;
      }
    }

    if (insights.length >= 3) break;
  }

  return Array.from(new Set(insights)).slice(0, 3);
}

function summarizeContent(content) {
  if (!content) return '';
  // Strip tables (lines with | separators) before extracting summary
  const withoutTables = content
    .replace(/^\s*\|.*\|.*$/gm, '')
    .replace(/^\s*:?-+:?\s*(\|\s*:?-+:?\s*)+$/gm, '');
  const plain = stripMarkdown(withoutTables);
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

function classifySection(section, content) {
  const title = (section?.title || '').toLowerCase();
  if (/^(giris|introduction|overview|ozet|summary)/.test(title)) return 'hero';
  if (/^(sonuc|conclusion|degerlendirme|result|recommendation)/.test(title)) return 'conclusion';
  if (/^(ek|appendix|kaynakca|references|bibliography)/.test(title)) return 'appendix';
  if (/^(yontem|method|methodology)/.test(title)) return 'methodology';
  // Check if the section likely has data (tables/numbers nearby)
  const sectionId = section?.id || '';
  if (sectionId && content) {
    const heading = title || sectionId;
    const idx = content.toLowerCase().indexOf(heading);
    if (idx >= 0) {
      const slice = content.slice(idx, idx + 1000);
      if (/\|.*\|/.test(slice) || /\d+[\.,]\d+/.test(slice)) return 'data';
    }
  }
  return 'narrative';
}

function buildFallbackLayoutPlan({ layoutProfile, documentPlan, content, printProfile }) {
  const pageBreaks = Array.isArray(documentPlan?.sections)
    ? documentPlan.sections.slice(1).map((section) => ({
        beforeSectionId: section.id,
        action: 'force-break',
        reason: 'section-break',
      }))
    : [];

  const components = [];
  const tables = extractMarkdownTables(content || '');
  const sections = documentPlan?.sections || [];
  const isAsymmetric = layoutProfile === 'asymmetric';
  const isA5 = printProfile === 'pagedjs-a5';
  const minColSpan = isA5 ? 8 : 1;

  // Classify sections for targeted component selection
  const classified = sections.map((s) => ({
    ...s,
    sectionType: classifySection(s, content),
  }));
  const title = documentPlan?.title || '';

  // 1. Cover page: PatternBlock(cover-page-hero) if title exists
  if (title) {
    components.push({
      type: 'PatternBlock',
      patternType: 'cover-page-hero',
      title,
      layoutProps: { colSpan: 16, offset: 0 },
      styleOverrides: { theme: 'white' },
    });
  }

  // 2. Opening: full-width intro
  components.push({
    type: 'RichText',
    layoutProps: { colSpan: 16, offset: 0 },
    styleOverrides: { theme: 'g10' },
  });

  // 3. HighlightBox for key insights (offset for visual interest)
  if (sections.length > 1) {
    components.push({
      type: 'HighlightBox',
      layoutProps: { colSpan: 12, offset: 2 },
      styleOverrides: { theme: 'g10' },
    });
  }

  // 4. Chapter openers for multi-section documents (max 3)
  if (sections.length >= 3) {
    const chapterSections = classified.filter((s) =>
      s.sectionType !== 'hero' && s.sectionType !== 'appendix'
    ).slice(0, 3);
    for (const section of chapterSections.slice(0, 2)) {
      components.push({
        type: 'PatternBlock',
        patternType: 'chapter-opener',
        title: section.title || '',
        layoutProps: { colSpan: 16, offset: 0 },
        styleOverrides: { theme: 'white' },
      });
    }
  }

  // 5. KPI grid for tables with 3+ columns
  const wideTable = tables.find((t) => t.header && t.header.length >= 3);
  if (wideTable) {
    components.push({
      type: 'PatternBlock',
      patternType: 'kpi-grid',
      layoutProps: { colSpan: 16, offset: 0 },
      styleOverrides: { theme: 'white' },
    });
  }

  // 6. Data sections: chart + data table in split layout
  if (tables.length > 0) {
    components.push({
      type: 'CarbonChart',
      layoutProps: { colSpan: isA5 ? 16 : (isAsymmetric ? 10 : 10), offset: isA5 ? 0 : (isAsymmetric ? 1 : 3) },
      data: { chartType: 'bar', dataHint: 'composition' },
      styleOverrides: { theme: 'white' },
    });

    if (tables.length > 1) {
      components.push({
        type: 'DataTable',
        layoutProps: { colSpan: isA5 ? 16 : (isAsymmetric ? 10 : 12), offset: isA5 ? 0 : (isAsymmetric ? 3 : 2) },
        styleOverrides: {},
      });
    }
  }

  // 7. Add narrative-oriented components for richer documents
  const hasQuoteContent = content && /["\u201C\u201D]|alinti|quote/i.test(content);
  if (hasQuoteContent || sections.length >= 4) {
    components.push({
      type: 'Quote',
      layoutProps: { colSpan: isA5 ? 16 : (isAsymmetric ? 10 : 12), offset: isA5 ? 0 : (isAsymmetric ? 3 : 2) },
      styleOverrides: {},
    });
  }

  // 8. Conclusion section with different theme for visual closure
  if (classified.some((s) => s.sectionType === 'conclusion')) {
    components.push({
      type: 'RichText',
      layoutProps: { colSpan: 16, offset: 0 },
      styleOverrides: { theme: 'g10' },
    });
  }

  // 9. MarginNote for asymmetric layouts with methodology/appendix sections (skip for A5)
  if (!isA5 && isAsymmetric && classified.some((s) => s.sectionType === 'methodology' || s.sectionType === 'appendix')) {
    components.push({
      type: 'MarginNote',
      layoutProps: { colSpan: 5, offset: 11 },
      styleOverrides: {},
    });
  }

  // Enforce max 12 components — prioritize: cover > highlight > chart > chapter-opener > richtext
  const MAX_FALLBACK_COMPONENTS = 12;
  if (components.length > MAX_FALLBACK_COMPONENTS) {
    // Remove excess from the end, but keep the first (cover) and second (opening richtext)
    components.splice(MAX_FALLBACK_COMPONENTS);
  }

  return {
    gridSystem: layoutProfile,
    components,
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
  const layoutPlan = buildFallbackLayoutPlan({ layoutProfile, documentPlan: resolvedDocumentPlan, content, printProfile });

  return {
    version: 'v1',
    layoutProfile,
    printProfile,
    gridSystem: layoutProfile,
    theme: theme || 'white',
    components: layoutPlan.components,
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
  const normalized = components.map((component) => {
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

  // Rule 1: Break consecutive full-width runs (max 3, PatternBlock exempt)
  let consecutiveFullWidth = 0;
  for (const comp of normalized) {
    if (comp.layoutProps.colSpan === 16) {
      consecutiveFullWidth++;
      if (consecutiveFullWidth > 3 && comp.type?.toLowerCase() !== 'patternblock') {
        comp.layoutProps = { ...comp.layoutProps, colSpan: 12, offset: 2 };
      }
    } else {
      consecutiveFullWidth = 0;
    }
  }

  // Rule 2: Ensure at least 40% of components have colSpan < 16
  if (normalized.length >= 3) {
    const narrowCount = normalized.filter((c) => c.layoutProps.colSpan < 16).length;
    const targetNarrow = Math.ceil(normalized.length * 0.4);
    if (narrowCount < targetNarrow) {
      let deficit = targetNarrow - narrowCount;
      for (let i = normalized.length - 1; i >= 0 && deficit > 0; i--) {
        const comp = normalized[i];
        if (comp.layoutProps.colSpan === 16 && comp.type?.toLowerCase() !== 'patternblock') {
          comp.layoutProps = { ...comp.layoutProps, colSpan: 12, offset: 2 };
          deficit--;
        }
      }
    }
  }

  return normalized;
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
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const aiTimeout = Number(process.env.GEMINI_TIMEOUT_MS) || 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), aiTimeout);
  let response;
  try {
    response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

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

  // Enrich sections with classification so the layout planner can see them
  if (Array.isArray(documentPlan?.sections)) {
    documentPlan.sections = documentPlan.sections.map((section) => ({
      ...section,
      classification: classifySection(section, clippedContent),
    }));
  }

  const priorFeedback = getQaFeedback(clippedContent);
  const layoutPrompt = buildLayoutPlanPrompt({
    metadata,
    layoutProfile: resolvedLayoutProfile,
    printProfile: resolvedPrintProfile,
    theme,
    documentPlan,
    referenceBrief,
    qaFeedback: priorFeedback,
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
