import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { chromium } from 'playwright';
import {
  readFile,
  writeFile,
  ensureDir,
  getOutputPath,
  getProjectRoot,
  fileExists,
} from './utils/file-utils.js';
import { parseMarkdown, markdownToHtml } from './utils/markdown-parser.js';
import { postprocessPdf } from './utils/pdf-postprocess.js';
import { buildTokenCss } from './utils/token-loader.js';
import { reviewQaIssues } from './ai/qa-reviewer.js';
import { storeQaFeedback } from './ai/art-director.js';
import {
  resolveDocumentMetadata,
  sanitizeMarkdownContent,
} from './utils/markdown-cleanup.js';
import { dataVizCategorical } from '../styles/carbon/colors-extended.js';
import { acquireBrowser, releaseBrowser } from './utils/browser-pool.js';

const PRINT_PROFILES = {
  'pagedjs-a4': { format: 'A4', css: 'pagedjs-a4.css' },
  'pagedjs-a3': { format: 'A3', css: 'pagedjs-a3.css' },
  'pagedjs-a5': { format: 'A5', css: 'pagedjs-a5.css' },
};

const LAYOUT_PROFILES = new Set(['symmetric', 'asymmetric', 'dashboard']);
const QA_ENABLED = process.env.PDF_QA_ENABLED !== 'false';
const QA_MAX_ITERATIONS = Math.max(0, Number(process.env.PDF_QA_MAX_ITERATIONS || 3));
const QA_BOTTOM_GAP = Number(process.env.PDF_QA_BOTTOM_GAP || 72);
const QA_TOP_GAP = Number(process.env.PDF_QA_TOP_GAP || 32);
const QA_VISUAL_ENABLED = process.env.PDF_QA_VISUAL_REGRESSION === 'true';
const QA_VISUAL_THRESHOLD = Number(process.env.PDF_QA_VISUAL_THRESHOLD || 0.1);
const QA_VISUAL_MAX_MISMATCH_RATIO = Number(
  process.env.PDF_QA_VISUAL_MAX_MISMATCH_RATIO || 0.01
);
const QA_AXE_TAGS = process.env.PDF_QA_AXE_TAGS || 'wcag2a,wcag2aa,wcag21aa';
const QA_BASELINE_DIR = process.env.PDF_QA_BASELINE_DIR || '';
const QA_DIFF_DIR = process.env.PDF_QA_DIFF_DIR || '';
const CHART_RENDERER_ENABLED = process.env.PRINT_CHART_RENDERER !== 'false';
const TABLE_SPLIT_MIN_ROWS = Math.max(1, Number(process.env.PRINT_TABLE_SPLIT_MIN_ROWS || 18));
const TABLE_SPLIT_MIN_ROWS_PER_PAGE = Math.max(
  3,
  Number(process.env.PRINT_TABLE_SPLIT_MIN_ROWS_PER_PAGE || 6)
);
const execFileAsync = promisify(execFile);
const EXAMPLE_QA_THRESHOLD = Number(process.env.EXAMPLE_QA_THRESHOLD || 85);
const EXAMPLE_AUTO_STAGE = process.env.EXAMPLE_AUTO_STAGE !== 'false';

// Module-level caches for performance (avoid repeated disk I/O)
const _cssCache = new Map();
let _cachedPagedScriptPath;

async function getCachedCss(filePath) {
  if (_cssCache.has(filePath)) return _cssCache.get(filePath);
  const content = await readFile(filePath);
  _cssCache.set(filePath, content);
  return content;
}

async function getCachedPagedScriptPath(projectRoot) {
  if (_cachedPagedScriptPath !== undefined) return _cachedPagedScriptPath;
  _cachedPagedScriptPath = await resolvePagedScriptPath(projectRoot);
  return _cachedPagedScriptPath;
}
const FONT_ASSETS = [
  {
    family: 'IBM Plex Sans',
    style: 'normal',
    weight: 400,
    local: ['IBM Plex Sans', 'IBM Plex Sans Regular'],
    files: ['IBMPlexSans-Regular.woff2', 'IBMPlexSans-Regular.woff'],
  },
  {
    family: 'IBM Plex Sans',
    style: 'italic',
    weight: 400,
    local: ['IBM Plex Sans Italic', 'IBM Plex Sans Oblique'],
    files: ['IBMPlexSans-Italic.woff2', 'IBMPlexSans-Italic.woff'],
  },
  {
    family: 'IBM Plex Serif',
    style: 'normal',
    weight: 400,
    local: ['IBM Plex Serif', 'IBM Plex Serif Regular'],
    files: ['IBMPlexSerif-Regular.woff2', 'IBMPlexSerif-Regular.woff'],
  },
  {
    family: 'IBM Plex Serif',
    style: 'italic',
    weight: 400,
    local: ['IBM Plex Serif Italic', 'IBM Plex Serif Oblique'],
    files: ['IBMPlexSerif-Italic.woff2', 'IBMPlexSerif-Italic.woff'],
  },
  {
    family: 'IBM Plex Mono',
    style: 'normal',
    weight: 400,
    local: ['IBM Plex Mono', 'IBM Plex Mono Regular'],
    files: ['IBMPlexMono-Regular.woff2', 'IBMPlexMono-Regular.woff'],
  },
];
const TYPOGRAPHY_DEFAULTS = {
  smartypants: process.env.PRINT_TYPOGRAPHY_SMARTYPANTS === 'true',
  hyphenation: process.env.PRINT_HYPHENATION || 'auto',
};

function normalizeLayoutProfile(value) {
  if (!value || !LAYOUT_PROFILES.has(value)) {
    return 'symmetric';
  }
  return value;
}

function normalizePrintProfile(value) {
  if (!value || !PRINT_PROFILES[value]) {
    return 'pagedjs-a4';
  }
  return value;
}

async function capturePreview(page, options = {}) {
  if (!options.screenshotPath) {
    return;
  }
  const selector = options.selector || '.pagedjs_page';
  const clip = await page.evaluate((targetSelector) => {
    const pageEl = document.querySelector(targetSelector);
    if (!pageEl) return null;
    const rect = pageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }, selector);

  await page.screenshot({
    path: options.screenshotPath,
    type: 'png',
    fullPage: !clip,
    clip: clip || undefined,
  });
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeKeywordList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePatternTag(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractPatternTags(components, metadata) {
  const tags = new Set(normalizeKeywordList(metadata?.patternTags));
  const list = Array.isArray(components) ? components : [];
  for (const component of list) {
    if (!component || component.type !== 'PatternBlock') {
      continue;
    }
    const rawType =
      component.patternType || component.props?.type || component.props?.pattern || component.props?.patternType;
    const normalized = normalizePatternTag(rawType);
    if (normalized) {
      tags.add(normalized);
    }
  }
  return Array.from(tags);
}

function buildPatternKeywords(patternTags) {
  return (patternTags || []).map((tag) => (
    tag.startsWith('pattern:') ? tag : `pattern:${tag}`
  ));
}

function normalizeHyphenationExceptions(exceptions) {
  if (!Array.isArray(exceptions)) {
    return [];
  }
  const normalized = [];
  for (const entry of exceptions) {
    if (typeof entry === 'string') {
      const withSoft = entry.replace(/&shy;/g, '\u00AD');
      if (!withSoft.includes('\u00AD')) {
        continue;
      }
      normalized.push({
        word: withSoft.replace(/\u00AD/g, ''),
        hyphenated: withSoft,
      });
      continue;
    }
    if (entry && typeof entry === 'object') {
      const word = entry.word || entry.plain || '';
      const hyphenated = entry.hyphenated || entry.value || '';
      if (!word || !hyphenated) {
        continue;
      }
      normalized.push({
        word: String(word),
        hyphenated: String(hyphenated).replace(/&shy;/g, '\u00AD'),
      });
    }
  }
  return normalized;
}

function applyHyphenationExceptions(markdown, exceptions) {
  if (!markdown || !Array.isArray(exceptions) || exceptions.length === 0) {
    return markdown;
  }
  let output = markdown;
  for (const { word, hyphenated } of exceptions) {
    if (!word || !hyphenated) {
      continue;
    }
    const pattern = new RegExp(escapeRegExp(word), 'g');
    output = output.replace(pattern, hyphenated);
  }
  return output;
}

function resolveTypographySettings(metadata = {}, overrides = {}) {
  const config = metadata?.typography && typeof metadata.typography === 'object'
    ? metadata.typography
    : {};
  const merged = { ...config, ...overrides };
  const smartypantsSetting = merged.smartypants;
  const smartypantsOptions = typeof smartypantsSetting === 'object'
    ? smartypantsSetting
    : merged.smartypantsOptions;
  const smartypantsEnabled =
    smartypantsSetting === true ||
    typeof smartypantsSetting === 'object' ||
    merged.microtype === true ||
    TYPOGRAPHY_DEFAULTS.smartypants === true;
  const hyphenationSetting = merged.hyphenation || TYPOGRAPHY_DEFAULTS.hyphenation;
  const hyphenationValue = String(hyphenationSetting || '').toLowerCase();
  const hyphenate = !['none', 'off', 'false', 'manual', 'disabled', '0'].includes(
    hyphenationValue
  );
  return {
    smartypants: smartypantsEnabled,
    smartypantsOptions: smartypantsOptions && typeof smartypantsOptions === 'object'
      ? smartypantsOptions
      : null,
    hyphenate,
    hyphenation: hyphenate ? 'auto' : 'manual',
    hyphenationExceptions: normalizeHyphenationExceptions(merged.hyphenationExceptions),
    hyphenationScript: merged.hyphenationScript || null,
  };
}

function appendClassAttribute(attributes, className) {
  if (!attributes) {
    return ` class="${className}"`;
  }
  const classMatch = attributes.match(/\sclass=(["'])(.*?)\1/);
  if (classMatch) {
    const existing = classMatch[2].split(/\s+/).filter(Boolean);
    const classSet = new Set(existing);
    classSet.add(className);
    const updated = `${classMatch[1]}${Array.from(classSet).join(' ')}${classMatch[1]}`;
    return attributes.replace(classMatch[0], ` class=${updated}`);
  }
  return `${attributes} class="${className}"`;
}

function addClassToTag(html, tagName, className, options = {}) {
  let count = 0;
  const pattern = new RegExp(`<${tagName}([^>]*)>`, 'gi');
  return html.replace(pattern, (match, attributes = '') => {
    count += 1;
    if (options.skipFirst && count === 1) {
      return match;
    }
    const nextAttrs = appendClassAttribute(attributes, className);
    return `<${tagName}${nextAttrs}>`;
  });
}

function applyLogicBasedStyling(html, styleHints = {}) {
  let output = html;
  const avoidTags = Array.isArray(styleHints.avoidBreakSelectors)
    ? styleHints.avoidBreakSelectors.filter((item) => /^[a-z0-9]+$/i.test(item))
    : ['table', 'pre', 'blockquote'];
  for (const tag of avoidTags) {
    output = addClassToTag(output, tag, 'avoid-break');
  }

  let forceTags = Array.isArray(styleHints.forceBreakSelectors)
    ? styleHints.forceBreakSelectors.filter((item) => /^[a-z0-9]+$/i.test(item))
    : [];
  forceTags = Array.from(new Set(forceTags));
  for (const tag of forceTags) {
    output = addClassToTag(output, tag, 'force-break', {
      skipFirst: tag.startsWith('h'),
    });
  }

  return output;
}

function splitHtmlIntoSections(html) {
  if (!html) return [];
  const parts = html.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)/gi);
  const sections = [];
  let buffer = '';
  for (const part of parts) {
    if (!part) continue;
    if (/^<h[1-6]/i.test(part.trim())) {
      if (buffer.trim()) {
        sections.push(buffer);
      }
      buffer = part;
    } else {
      buffer += part;
    }
  }
  if (buffer.trim()) {
    sections.push(buffer);
  }
  return sections.length ? sections : [html];
}

function normalizeComponentType(type) {
  if (typeof type !== 'string') return 'richtext';
  const normalized = type.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return normalized || 'richtext';
}

function normalizeClassName(value) {
  if (typeof value !== 'string') return '';
  const tokens = value
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9-_]/gi, ''))
    .filter(Boolean);
  return tokens.join(' ');
}

function resolveLayoutProps(layoutProps = {}) {
  let colSpan = Number(layoutProps.colSpan);
  if (!Number.isFinite(colSpan)) colSpan = 16;
  colSpan = Math.max(1, Math.min(16, Math.round(colSpan)));
  let offset = Number(layoutProps.offset);
  if (!Number.isFinite(offset)) offset = 0;
  offset = Math.max(0, Math.min(15, Math.round(offset)));
  if (offset + colSpan > 16) {
    colSpan = Math.max(1, 16 - offset);
  }
  return { colSpan, offset };
}

function buildStorytellingBlock(storytelling) {
  if (!storytelling || typeof storytelling !== 'object') {
    return '';
  }

  const summary = storytelling.executiveSummary
    ? escapeHtml(storytelling.executiveSummary)
    : '';
  const insights = Array.isArray(storytelling.keyInsights) ? storytelling.keyInsights : [];
  const methodology = storytelling.methodologyNotes
    ? escapeHtml(storytelling.methodologyNotes)
    : '';
  const sources = Array.isArray(storytelling.sources) ? storytelling.sources : [];
  const safeInsights = insights
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const safeSources = sources
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => escapeHtml(item))
    .join('; ');

  if (!summary && !safeInsights && !methodology && !safeSources) {
    return '';
  }

  const metaItems = [];
  if (methodology) {
    metaItems.push(`<span class="ai-insight__meta-item"><strong>Methodology:</strong> ${methodology}</span>`);
  }
  if (safeSources) {
    metaItems.push(`<span class="ai-insight__meta-item"><strong>Sources:</strong> ${safeSources}</span>`);
  }

  return `
    <section class="ai-insight ai-insight--executive avoid-break">
      <div class="ai-insight__header">
        <h2 class="ai-insight__title">Executive Summary</h2>
      </div>
      ${summary ? `<p class="ai-insight__summary">${summary}</p>` : ''}
      ${safeInsights ? `
        <div class="ai-insight__findings">
          <h3 class="ai-insight__subtitle">Key Insights</h3>
          <ul class="ai-insight__list">${safeInsights}</ul>
        </div>` : ''}
      ${metaItems.length ? `<div class="ai-insight__meta">${metaItems.join('')}</div>` : ''}
    </section>
  `;
}

function buildPatternBlockHtml(body, component) {
  const patternType = normalizePatternTag(component?.patternType || '');
  const title = escapeHtml(component?.props?.title || component?.title || '');
  const subtitle = escapeHtml(component?.props?.subtitle || component?.subtitle || '');
  const eyebrow = escapeHtml(component?.props?.eyebrow || component?.eyebrow || '');
  const stat = escapeHtml(component?.props?.stat || component?.stat || '');
  const quote = escapeHtml(component?.props?.quote || component?.quote || '');
  const author = escapeHtml(component?.props?.author || component?.author || '');

  switch (patternType) {
    case 'cover-page-hero':
      return `<div class="pattern">
        ${eyebrow ? `<div class="pattern__eyebrow">${eyebrow}</div>` : ''}
        ${title ? `<h1 class="pattern__title">${title}</h1>` : ''}
        ${subtitle ? `<p class="pattern__subtitle">${subtitle}</p>` : ''}
        ${body}
      </div>`;
    case 'chapter-opener':
    case 'part-opener':
      return `<div class="pattern">
        ${eyebrow ? `<div class="pattern__eyebrow">${eyebrow}</div>` : ''}
        ${title ? `<h2 class="pattern__title">${title}</h2>` : ''}
        ${subtitle ? `<p class="pattern__subtitle">${subtitle}</p>` : ''}
        ${body}
      </div>`;
    case 'kpi-grid':
      return `<div class="pattern">
        ${title ? `<div class="pattern__eyebrow">${title}</div>` : ''}
        ${body}
      </div>`;
    case 'hero-stat-with-quote':
      return `<div class="pattern">
        ${stat ? `<div class="pattern__stat">${stat}</div>` : ''}
        ${quote ? `<blockquote class="directive directive--quote"><p>${quote}</p>${author ? `<footer class="quote__attribution">${author}</footer>` : ''}</blockquote>` : ''}
        ${body}
      </div>`;
    case 'executive-summary':
    case 'key-findings-list':
    case 'action-box':
      return `<div class="pattern">
        ${eyebrow ? `<div class="pattern__eyebrow">${eyebrow}</div>` : ''}
        ${title ? `<h3 class="pattern__title">${title}</h3>` : ''}
        ${body}
      </div>`;
    case 'case-study-module':
      return `<div class="pattern">
        ${eyebrow ? `<div class="pattern__eyebrow">${eyebrow}</div>` : ''}
        ${title ? `<h3 class="pattern__title">${title}</h3>` : ''}
        ${body}
      </div>`;
    default:
      if (title || eyebrow) {
        return `<div class="pattern">
          ${eyebrow ? `<div class="pattern__eyebrow">${eyebrow}</div>` : ''}
          ${title ? `<h3 class="pattern__title">${title}</h3>` : ''}
          ${subtitle ? `<p class="pattern__subtitle">${subtitle}</p>` : ''}
          ${body}
        </div>`;
      }
      return body;
  }
}

function buildComponentBody(type, body, component) {
  switch (type) {
    case 'quote': {
      const author = escapeHtml(component?.props?.author || component?.author || '');
      const source = escapeHtml(component?.props?.source || component?.source || '');
      const attribution = [author, source].filter(Boolean).join(', ');
      return `<blockquote class="directive directive--quote">
        ${body}
        ${attribution ? `<footer class="quote__attribution">${attribution}</footer>` : ''}
      </blockquote>`;
    }
    case 'datatable': {
      const caption = escapeHtml(component?.props?.caption || component?.caption || '');
      const source = escapeHtml(component?.props?.source || component?.source || '');
      const meta = source ? `Source: ${source}` : '';
      return `<figure class="directive directive--data-table"${caption ? ` data-caption="${caption}"` : ''}${meta ? ` data-meta="${meta}"` : ''}>
        ${body}
      </figure>`;
    }
    case 'figure': {
      const caption = escapeHtml(component?.props?.caption || component?.caption || '');
      return `<figure class="directive directive--figure">
        ${body}
        ${caption ? `<figcaption>${caption}</figcaption>` : ''}
      </figure>`;
    }
    case 'marginnote': {
      const align = component?.props?.align || 'right';
      return `<span class="directive directive--marginnote align-${align}">
        ${body}
      </span>`;
    }
    case 'timeline':
      return `<section class="directive directive--timeline">
        ${body}
      </section>`;
    case 'patternblock':
      return buildPatternBlockHtml(body, component);
    default:
      return body;
  }
}

function buildLayoutGridHtml({ htmlContent, artDirection, layoutProfile }) {
  const components = Array.isArray(artDirection?.components) ? artDirection.components : [];
  if (!components.length) {
    return { html: htmlContent, usesStorytelling: false };
  }

  const sections = splitHtmlIntoSections(htmlContent);
  let sectionIndex = 0;
  let usesStorytelling = false;
  const gridSystem = normalizeLayoutProfile(artDirection?.gridSystem || layoutProfile);
  const layoutBlocks = components
    .map((component) => {
      const type = normalizeComponentType(component?.type);
      let body = '';
      if (type === 'highlightbox') {
        body = buildStorytellingBlock(artDirection?.storytelling);
        if (body) {
          usesStorytelling = true;
        }
      }
      if (!body) {
        body = sections[sectionIndex] || '';
        if (body) {
          sectionIndex += 1;
        }
      }
      if (!body) {
        return '';
      }
      body = buildComponentBody(type, body, component);
      const { colSpan, offset } = resolveLayoutProps(component?.layoutProps);
      const gridColumn = colSpan === 16 && offset === 0
        ? '1 / -1'
        : `${offset + 1} / span ${colSpan}`;
      const classNames = [
        'layout-component',
        `layout-component--${type}`,
      ];
      if (type === 'patternblock' && component?.patternType) {
        classNames.push(`pattern--${normalizePatternTag(component.patternType)}`);
      }
      if (component?.printOnly) {
        classNames.push('print-only');
      }
      if (component?.screenOnly) {
        classNames.push('screen-only');
      }
      const extraClass = normalizeClassName(component?.className);
      if (extraClass) {
        classNames.push(extraClass);
      }
      if (component?.styleOverrides?.theme) {
        classNames.push(`theme--${component.styleOverrides.theme}`);
      }
      return `
        <div class="${classNames.join(' ')}" style="grid-column: ${gridColumn};" data-component-type="${type}">
          ${body}
        </div>
      `;
    })
    .filter(Boolean);

  const remaining = sections.slice(sectionIndex).join('');
  if (remaining.trim()) {
    layoutBlocks.push(`
      <div class="layout-component layout-component--auto" style="grid-column: 1 / -1;">
        ${remaining}
      </div>
    `);
  }

  if (!layoutBlocks.length) {
    return { html: htmlContent, usesStorytelling };
  }

  return {
    html: `
      <div class="layout-grid" data-grid-system="${gridSystem}">
        ${layoutBlocks.join('\n')}
      </div>
    `,
    usesStorytelling,
  };
}

function buildCover(metadata) {
  const includeCover = metadata.includeCover !== false;
  if (!includeCover) {
    return '';
  }

  const title = escapeHtml(resolveDocumentTitle(metadata));
  const subtitle = escapeHtml(metadata.subtitle || '');
  const rawAuthor = String(metadata.author || '').trim().toLowerCase();
  const isInvalidAuthor = ['', 'anonymous', 'anon', 'unknown', 'n/a', 'none'].includes(rawAuthor);
  const author = isInvalidAuthor ? '' : escapeHtml(metadata.author);
  const date = escapeHtml(metadata.date || '');

  if (!title && !subtitle && !author && !date) {
    return '';
  }

  return `
    <header class="report-cover">
      <div class="report-cover__eyebrow">Carbonac · Carbon Design Report</div>
      ${title ? `<h1 class="report-title">${title}</h1>` : ''}
      ${subtitle ? `<p class="report-subtitle">${subtitle}</p>` : ''}
      ${(author || date) ? `
        <div class="report-meta">
          ${author ? `<span>${author}</span>` : ''}
          ${date ? `<span>${date}</span>` : ''}
        </div>
      ` : ''}
    </header>
  `;
}

function buildToc(metadata = {}, toc = []) {
  const includeToc = metadata.includeToc !== false;
  if (!includeToc || !Array.isArray(toc) || toc.length === 0) {
    return '';
  }

  const title = String(metadata.language || metadata.locale || 'tr').toLowerCase().startsWith('en')
    ? 'Table of Contents'
    : 'İçindekiler';

  const list = toc
    .filter((item) => item && item.title)
    .map((item) => {
      const level = Math.max(1, Math.min(3, Number(item.level) || 1));
      return `<li class="report-toc__item level-${level}">${escapeHtml(item.title)}</li>`;
    })
    .join('');

  if (!list) {
    return '';
  }

  return `
    <section class="report-toc">
      <h2 class="report-toc__title">${escapeHtml(title)}</h2>
      <ol class="report-toc__list">
        ${list}
      </ol>
    </section>
  `;
}

function buildBackCover(metadata = {}) {
  const includeBackCover = metadata.includeBackCover !== false;
  if (!includeBackCover) {
    return '';
  }

  const title = resolveDocumentTitle(metadata, 'Carbon Report');
  const locale = String(metadata.language || metadata.locale || 'tr').toLowerCase();
  const thanks = locale.startsWith('en')
    ? 'Thank you for reviewing this report.'
    : 'Bu raporu incelediğiniz için teşekkür ederiz.';

  return `
    <footer class="report-back-cover">
      <div class="report-back-cover__brand">Carbonac</div>
      <p class="report-back-cover__title">${escapeHtml(title)}</p>
      <p class="report-back-cover__thanks">${escapeHtml(thanks)}</p>
    </footer>
  `;
}

const INVALID_TITLE_VALUES = new Set([
  '', 'untitled', 'untitled document', 'document', 'anonymous', 'n/a', 'none',
  'new document', 'yeni belge', 'başlıksız', 'isimsiz', 'adsız',
]);

function resolveDocumentTitle(metadata = {}, fallback = 'Carbon Report') {
  const candidate = String(metadata?.title || '').trim();
  if (!candidate || INVALID_TITLE_VALUES.has(candidate.toLowerCase())) {
    return fallback;
  }
  return candidate;
}

async function writeArtifact(filePath, content) {
  if (!filePath) {
    return;
  }
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content);
}

async function writePagedHtml(page, filePath) {
  if (!filePath) {
    return;
  }
  const content = await page.content();
  await writeArtifact(filePath, content);
}

async function resolvePagedScriptPath(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'),
    path.join(projectRoot, 'node_modules', 'pagedjs', 'dist', 'paged.js'),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function loadFontSource(filePath) {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const format = ext === '.woff2' ? 'woff2' : 'woff';
  const mime = format === 'woff2' ? 'font/woff2' : 'font/woff';
  return `url("data:${mime};base64,${buffer.toString('base64')}") format("${format}")`;
}

async function buildFontFaceCss(projectRoot) {
  const fontDir = path.join(projectRoot, 'styles', 'print', 'fonts');
  const rules = [];
  for (const asset of FONT_ASSETS) {
    const sources = [];
    const localSources = Array.isArray(asset.local) ? asset.local : [];
    for (const localName of localSources) {
      sources.push(`local("${localName}")`);
    }
    const files = Array.isArray(asset.files) ? asset.files : [];
    for (const fileName of files) {
      const filePath = path.join(fontDir, fileName);
      if (!(await fileExists(filePath))) {
        continue;
      }
      try {
        const source = await loadFontSource(filePath);
        sources.push(source);
        break;
      } catch (error) {
        console.warn(`[print] Failed to read font ${fileName}: ${error.message}`);
      }
    }
    if (!sources.length) {
      continue;
    }
    rules.push([
      '@font-face {',
      `  font-family: "${asset.family}";`,
      `  font-style: ${asset.style};`,
      `  font-weight: ${asset.weight};`,
      '  font-display: swap;',
      `  src: ${sources.join(', ')};`,
      '}',
    ].join('\n'));
  }
  return rules.join('\n');
}

async function buildHyphenationScriptTag(typography, projectRoot) {
  const scriptPath = typography?.hyphenationScript;
  if (!scriptPath || typeof scriptPath !== 'string') {
    return '';
  }
  const resolvedPath = path.isAbsolute(scriptPath)
    ? scriptPath
    : path.join(projectRoot, scriptPath);
  if (!(await fileExists(resolvedPath))) {
    console.warn(`[print] Hyphenation script not found: ${resolvedPath}`);
    return '';
  }
  const scriptContent = await fs.readFile(resolvedPath, 'utf-8');
  return scriptContent ? `<script>${scriptContent}</script>` : '';
}

function buildChartRendererScript() {
  const palette = Array.isArray(dataVizCategorical) && dataVizCategorical.length
    ? dataVizCategorical
    : ['#111111', '#444444', '#777777', '#aaaaaa', '#000000'];

  return `
(function() {
  const svgNs = "http://www.w3.org/2000/svg";
  const palette = ${JSON.stringify(palette)};
  const dashStyles = ["", "4 3", "2 2", "6 2 1 2", "1 2"];

  function normalizeType(value) {
    return String(value || "").toLowerCase();
  }

  function getLabel(item, index) {
    return item.label || item.group || item.category || item.name || item.x || String(index + 1);
  }

  function getValue(item) {
    let raw = 0;
    if (item.value !== undefined && item.value !== null) {
      raw = item.value;
    } else if (item.count !== undefined && item.count !== null) {
      raw = item.count;
    } else if (item.y !== undefined && item.y !== null) {
      raw = item.y;
    } else if (item.amount !== undefined && item.amount !== null) {
      raw = item.amount;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function getX(item, index) {
    if (item.x !== undefined && item.x !== null) return getNumber(item.x, index);
    if (item.value !== undefined && item.value !== null) return getNumber(item.value, index);
    return index;
  }

  function getY(item) {
    if (item.y !== undefined && item.y !== null) return getNumber(item.y, 0);
    if (item.value !== undefined && item.value !== null) return getNumber(item.value, 0);
    return 0;
  }

  function getSize(item) {
    if (item.size !== undefined && item.size !== null) return getNumber(item.size, 0);
    if (item.r !== undefined && item.r !== null) return getNumber(item.r, 0);
    if (item.value !== undefined && item.value !== null) return getNumber(item.value, 0);
    return 0;
  }

  function parseChartData(figure) {
    const code = figure.querySelector("pre code");
    if (!code) return null;
    const raw = code.textContent || "";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
      if (parsed && Array.isArray(parsed.values)) return parsed.values;
      return null;
    } catch (error) {
      return null;
    }
  }

  function createSvg(width, height) {
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "auto");
    svg.setAttribute("role", "img");
    return svg;
  }

  function buildPatterns(svg) {
    const defs = document.createElementNS(svgNs, "defs");
    palette.forEach((color, index) => {
      const pattern = document.createElementNS(svgNs, "pattern");
      pattern.setAttribute("id", "pattern-" + index);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", "8");
      pattern.setAttribute("height", "8");
      const rect = document.createElementNS(svgNs, "rect");
      rect.setAttribute("width", "8");
      rect.setAttribute("height", "8");
      rect.setAttribute("fill", color);
      pattern.appendChild(rect);
      if (index % 3 === 0) {
        const line = document.createElementNS(svgNs, "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", "8");
        line.setAttribute("x2", "8");
        line.setAttribute("y2", "0");
        line.setAttribute("stroke", "#ffffff");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("opacity", "0.45");
        pattern.appendChild(line);
      } else if (index % 3 === 1) {
        const line = document.createElementNS(svgNs, "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", "4");
        line.setAttribute("x2", "8");
        line.setAttribute("y2", "4");
        line.setAttribute("stroke", "#ffffff");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("opacity", "0.35");
        pattern.appendChild(line);
      } else {
        const dot = document.createElementNS(svgNs, "circle");
        dot.setAttribute("cx", "4");
        dot.setAttribute("cy", "4");
        dot.setAttribute("r", "1.2");
        dot.setAttribute("fill", "#ffffff");
        dot.setAttribute("opacity", "0.45");
        pattern.appendChild(dot);
      }
      defs.appendChild(pattern);
    });
    svg.appendChild(defs);
  }

  function drawAxes(svg, width, height, padding) {
    const axis = document.createElementNS(svgNs, "path");
    axis.setAttribute(
      "d",
      "M" +
        padding.left +
        " " +
        padding.top +
        " V" +
        (height - padding.bottom) +
        " H" +
        (width - padding.right)
    );
    axis.setAttribute("stroke", "#000");
    axis.setAttribute("stroke-width", "1");
    axis.setAttribute("fill", "none");
    svg.appendChild(axis);
  }

  function buildSeries(data) {
    const hasKey = data.some((item) => {
      return item && typeof item === "object" && (item.key || item.series);
    });
    const seriesMap = new Map();
    data.forEach((item, index) => {
      const safeItem = item && typeof item === "object" ? item : { value: item };
      const label = getLabel(safeItem, index);
      const key = hasKey ? (safeItem.key || safeItem.series || "Series") : "Series";
      if (!seriesMap.has(key)) {
        seriesMap.set(key, []);
      }
      seriesMap.get(key).push({
        label,
        value: getValue(safeItem),
      });
    });
    const labels = Array.from(
      new Set(data.map((item, index) => {
        const safeItem = item && typeof item === "object" ? item : { value: item };
        return getLabel(safeItem, index);
      }))
    );
    return { labels, series: Array.from(seriesMap.entries()) };
  }

  function renderBars(svg, width, height, padding, labels, series, stacked) {
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const groups = labels.length || 1;
    const groupWidth = chartWidth / groups;
    const seriesCount = series.length || 1;
    const barGap = groupWidth * 0.15;
    const barWidth = stacked
      ? groupWidth * 0.7
      : (groupWidth - barGap * 2) / seriesCount;
    const maxValue = Math.max(
      1,
      ...labels.map((label) => {
        if (!stacked) {
          return Math.max(
            1,
            ...series.map(([, values]) => {
              const entry = values.find((item) => item.label === label);
              return entry ? entry.value : 0;
            })
          );
        }
        return series.reduce((sum, [, values]) => {
          const entry = values.find((item) => item.label === label);
          return sum + (entry ? entry.value : 0);
        }, 0);
      })
    );

    labels.forEach((label, groupIndex) => {
      let stackOffset = 0;
      series.forEach(([key, values], seriesIndex) => {
        const entry = values.find((item) => item.label === label);
        const value = entry ? entry.value : 0;
        const heightValue = (value / maxValue) * chartHeight;
        const x = padding.left + groupIndex * groupWidth + barGap + (stacked ? 0 : seriesIndex * barWidth);
        const y = padding.top + chartHeight - heightValue - stackOffset;
        const rect = document.createElementNS(svgNs, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(barWidth));
        rect.setAttribute("height", String(heightValue));
        rect.setAttribute("fill", "url(#pattern-" + (seriesIndex % palette.length) + ")");
        rect.setAttribute("stroke", "#000");
        rect.setAttribute("stroke-width", "0.5");
        svg.appendChild(rect);
        if (stacked) {
          stackOffset += heightValue;
        }
      });
    });
  }

  function renderLine(svg, width, height, padding, labels, series, area) {
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    let maxValue = 1;
    series.forEach(([, values]) => {
      values.forEach((item) => {
        if (item.value > maxValue) {
          maxValue = item.value;
        }
      });
    });
    labels.forEach((label, index) => {
      const x = padding.left + (chartWidth / Math.max(1, labels.length - 1)) * index;
      const tick = document.createElementNS(svgNs, "line");
      tick.setAttribute("x1", String(x));
      tick.setAttribute("x2", String(x));
      tick.setAttribute("y1", String(height - padding.bottom));
      tick.setAttribute("y2", String(height - padding.bottom + 4));
      tick.setAttribute("stroke", "#000");
      tick.setAttribute("stroke-width", "1");
      svg.appendChild(tick);
    });
    series.forEach(([key, values], index) => {
      const points = values.map((item, i) => {
        const x = padding.left + (chartWidth / Math.max(1, labels.length - 1)) * i;
        const y = padding.top + chartHeight - (item.value / maxValue) * chartHeight;
        return { x, y };
      });
      const path = document.createElementNS(svgNs, "path");
      const d = points.map((pt, i) => (i ? "L" : "M") + pt.x + " " + pt.y).join(" ");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", palette[index % palette.length]);
      path.setAttribute("stroke-width", "2");
      const dash = dashStyles[index % dashStyles.length];
      if (dash) {
        path.setAttribute("stroke-dasharray", dash);
      }
      svg.appendChild(path);

      if (area) {
        const areaPath = document.createElementNS(svgNs, "path");
        const areaD =
          d +
          " L " +
          points[points.length - 1].x +
          " " +
          (height - padding.bottom) +
          " L " +
          points[0].x +
          " " +
          (height - padding.bottom) +
          " Z";
        areaPath.setAttribute("d", areaD);
        areaPath.setAttribute("fill", palette[index % palette.length]);
        areaPath.setAttribute("opacity", "0.2");
        svg.insertBefore(areaPath, path);
      }
    });
  }

  function renderScatter(svg, width, height, padding, data, bubble) {
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const points = [];
    data.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      points.push({
        group: item.group || item.series || item.key || "Series",
        x: getX(item, index),
        y: getY(item),
        size: getSize(item),
      });
    });
    if (!points.length) return;

    const xValues = points.map((pt) => pt.x);
    const yValues = points.map((pt) => pt.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const groups = new Map();
    points.forEach((pt) => {
      if (!groups.has(pt.group)) groups.set(pt.group, []);
      groups.get(pt.group).push(pt);
    });

    const sizeValues = points.map((pt) => pt.size).filter((v) => Number.isFinite(v));
    const sMin = sizeValues.length ? Math.min(...sizeValues) : 0;
    const sMax = sizeValues.length ? Math.max(...sizeValues) : 1;
    const sRange = (sMax - sMin) || 1;

    let groupIndex = 0;
    groups.forEach((pts) => {
      pts.forEach((pt) => {
        const cx = padding.left + ((pt.x - xMin) / xRange) * chartWidth;
        const cy = padding.top + chartHeight - ((pt.y - yMin) / yRange) * chartHeight;
        const r = bubble
          ? (4 + ((pt.size - sMin) / sRange) * 10)
          : 4;

        const circle = document.createElementNS(svgNs, "circle");
        circle.setAttribute("cx", String(cx));
        circle.setAttribute("cy", String(cy));
        circle.setAttribute("r", String(Math.max(2, r)));
        circle.setAttribute("fill", "url(#pattern-" + (groupIndex % palette.length) + ")");
        circle.setAttribute("stroke", "#000");
        circle.setAttribute("stroke-width", "0.5");
        svg.appendChild(circle);
      });
      groupIndex += 1;
    });
  }

  function polarToCartesian(cx, cy, r, angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
    const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
    const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = polarToCartesian(cx, cy, rInner, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
      "L", startInner.x, startInner.y,
      "A", rInner, rInner, 0, largeArc, 1, endInner.x, endInner.y,
      "Z",
    ].join(" ");
  }

  function describePieSlice(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArc, 0, end.x, end.y,
      "L", cx, cy,
      "Z",
    ].join(" ");
  }

  function renderDonut(svg, width, height, series) {
    const cx = width / 2;
    const cy = height / 2;
    const rOuter = Math.min(width, height) * 0.35;
    const rInner = rOuter * 0.55;
    const values = series[0]?.[1] || [];
    const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
    let current = 0;
    values.forEach((item, index) => {
      const start = (current / total) * 360;
      const end = ((current + item.value) / total) * 360;
      const path = document.createElementNS(svgNs, "path");
      path.setAttribute(
        "d",
        describeArc(cx, cy, rOuter, rInner, start, end)
      );
      path.setAttribute("fill", "url(#pattern-" + (index % palette.length) + ")");
      path.setAttribute("stroke", "#000");
      path.setAttribute("stroke-width", "0.5");
      svg.appendChild(path);
      current += item.value;
    });
  }

  function renderPie(svg, width, height, series) {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.35;
    const values = series[0]?.[1] || [];
    const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
    let current = 0;
    values.forEach((item, index) => {
      const start = (current / total) * 360;
      const end = ((current + item.value) / total) * 360;
      const path = document.createElementNS(svgNs, "path");
      path.setAttribute(
        "d",
        describePieSlice(cx, cy, r, start, end)
      );
      path.setAttribute("fill", "url(#pattern-" + (index % palette.length) + ")");
      path.setAttribute("stroke", "#000");
      path.setAttribute("stroke-width", "0.5");
      svg.appendChild(path);
      current += item.value;
    });
  }

  function renderRadar(svg, width, height, padding, data) {
    const items = data.filter((item) => item && typeof item === "object");
    const axes = Array.from(new Set(items.map((item) => item.key || item.axis || item.label).filter(Boolean)));
    if (!axes.length) return;

    const groups = Array.from(new Set(items.map((item) => item.group || item.series || "Series").filter(Boolean)));
    const maxValue = Math.max(1, ...items.map(getValue));

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const cx = padding.left + chartWidth / 2;
    const cy = padding.top + chartHeight / 2;
    const rOuter = Math.min(chartWidth, chartHeight) * 0.42;
    const angleStep = 360 / axes.length;

    // Grid rings
    const rings = 4;
    for (let i = 1; i <= rings; i += 1) {
      const ring = document.createElementNS(svgNs, "circle");
      ring.setAttribute("cx", String(cx));
      ring.setAttribute("cy", String(cy));
      ring.setAttribute("r", String((rOuter / rings) * i));
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "#000");
      ring.setAttribute("stroke-width", "0.5");
      ring.setAttribute("opacity", "0.25");
      svg.appendChild(ring);
    }

    // Axis spokes
    axes.forEach((label, index) => {
      const angle = index * angleStep;
      const pt = polarToCartesian(cx, cy, rOuter, angle);
      const line = document.createElementNS(svgNs, "line");
      line.setAttribute("x1", String(cx));
      line.setAttribute("y1", String(cy));
      line.setAttribute("x2", String(pt.x));
      line.setAttribute("y2", String(pt.y));
      line.setAttribute("stroke", "#000");
      line.setAttribute("stroke-width", "0.5");
      line.setAttribute("opacity", "0.6");
      svg.appendChild(line);
    });

    groups.forEach((groupName, groupIndex) => {
      const points = axes.map((axis, axisIndex) => {
        const item = items.find((entry) => {
          const g = entry.group || entry.series || "Series";
          const k = entry.key || entry.axis || entry.label;
          return g === groupName && k === axis;
        });
        const value = item ? getValue(item) : 0;
        const r = (value / maxValue) * rOuter;
        return polarToCartesian(cx, cy, r, axisIndex * angleStep);
      });

      const path = document.createElementNS(svgNs, "path");
      const d = points.map((pt, idx) => (idx ? "L" : "M") + pt.x + " " + pt.y).join(" ") + " Z";
      path.setAttribute("d", d);
      path.setAttribute("fill", palette[groupIndex % palette.length]);
      path.setAttribute("opacity", "0.12");
      path.setAttribute("stroke", palette[groupIndex % palette.length]);
      path.setAttribute("stroke-width", "2");
      const dash = dashStyles[groupIndex % dashStyles.length];
      if (dash) {
        path.setAttribute("stroke-dasharray", dash);
      }
      svg.appendChild(path);
    });
  }

  function renderTreemap(svg, width, height, padding, series) {
    const values = series[0]?.[1] || [];
    if (!values.length) return;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const total = values.reduce((sum, item) => sum + item.value, 0) || 1;

    const n = values.length;
    const columns = Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = Math.max(1, Math.ceil(n / columns));

    let y = padding.top;
    let cursor = 0;
    let colorIndex = 0;

    for (let row = 0; row < rows; row += 1) {
      const rowItems = values.slice(cursor, cursor + columns);
      cursor += rowItems.length;
      if (!rowItems.length) break;
      const rowSum = rowItems.reduce((sum, item) => sum + item.value, 0) || 1;
      const rowHeight = (rowSum / total) * chartHeight;
      let x = padding.left;
      rowItems.forEach((item) => {
        const w = (item.value / rowSum) * chartWidth;
        const rect = document.createElementNS(svgNs, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(w));
        rect.setAttribute("height", String(rowHeight));
        rect.setAttribute("fill", "url(#pattern-" + (colorIndex % palette.length) + ")");
        rect.setAttribute("stroke", "#000");
        rect.setAttribute("stroke-width", "0.5");
        svg.appendChild(rect);
        x += w;
        colorIndex += 1;
      });
      y += rowHeight;
    }
  }

  function renderGauge(svg, width, height, series) {
    const cx = width / 2;
    const cy = height * 0.6;
    const rOuter = Math.min(width, height) * 0.4;
    const rInner = rOuter * 0.65;
    const values = series[0]?.[1] || [];
    const value = values[0]?.value || 0;
    const max = values[1]?.value || 100;
    const ratio = Math.min(1, Math.max(0, value / max));
    // Background arc (full semicircle)
    const bgPath = document.createElementNS(svgNs, "path");
    bgPath.setAttribute("d", describeArc(cx, cy, rOuter, rInner, 180, 360));
    bgPath.setAttribute("fill", "#e0e0e0");
    bgPath.setAttribute("stroke", "#000");
    bgPath.setAttribute("stroke-width", "0.5");
    svg.appendChild(bgPath);
    // Value arc
    const endAngle = 180 + ratio * 180;
    if (ratio > 0) {
      const valPath = document.createElementNS(svgNs, "path");
      valPath.setAttribute("d", describeArc(cx, cy, rOuter, rInner, 180, endAngle));
      valPath.setAttribute("fill", "url(#pattern-0)");
      valPath.setAttribute("stroke", "#000");
      valPath.setAttribute("stroke-width", "0.5");
      svg.appendChild(valPath);
    }
    // Center value text
    const text = document.createElementNS(svgNs, "text");
    text.setAttribute("x", String(cx));
    text.setAttribute("y", String(cy - rInner * 0.2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", String(rOuter * 0.35));
    text.setAttribute("font-weight", "600");
    text.setAttribute("fill", "#000");
    text.textContent = String(value);
    svg.appendChild(text);
    // Label
    const label = values[0]?.label || "";
    if (label) {
      const labelEl = document.createElementNS(svgNs, "text");
      labelEl.setAttribute("x", String(cx));
      labelEl.setAttribute("y", String(cy + rOuter * 0.15));
      labelEl.setAttribute("text-anchor", "middle");
      labelEl.setAttribute("font-size", "12");
      labelEl.setAttribute("fill", "#525252");
      labelEl.textContent = label;
      svg.appendChild(labelEl);
    }
  }

  function renderHistogram(svg, width, height, padding, labels, series) {
    // Histogram is bars with no gap between them
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const values = series[0]?.[1] || [];
    const groups = values.length || 1;
    const barWidth = chartWidth / groups;
    const maxValue = Math.max(1, ...values.map(getValue));
    values.forEach((item, index) => {
      const h = (item.value / maxValue) * chartHeight;
      const x = padding.left + index * barWidth;
      const y = padding.top + chartHeight - h;
      const rect = document.createElementNS(svgNs, "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(h));
      rect.setAttribute("fill", "url(#pattern-0)");
      rect.setAttribute("stroke", "#000");
      rect.setAttribute("stroke-width", "0.5");
      svg.appendChild(rect);
    });
  }

  function renderLollipop(svg, width, height, padding, labels, series) {
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const values = series[0]?.[1] || [];
    const groups = values.length || 1;
    const maxValue = Math.max(1, ...values.map(getValue));
    const rowHeight = chartHeight / groups;
    values.forEach((item, index) => {
      const ratio = item.value / maxValue;
      const barLen = ratio * chartWidth;
      const cy = padding.top + index * rowHeight + rowHeight / 2;
      // Line
      const line = document.createElementNS(svgNs, "line");
      line.setAttribute("x1", String(padding.left));
      line.setAttribute("y1", String(cy));
      line.setAttribute("x2", String(padding.left + barLen));
      line.setAttribute("y2", String(cy));
      line.setAttribute("stroke", palette[index % palette.length]);
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);
      // Circle at end
      const circle = document.createElementNS(svgNs, "circle");
      circle.setAttribute("cx", String(padding.left + barLen));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", "6");
      circle.setAttribute("fill", "url(#pattern-" + (index % palette.length) + ")");
      circle.setAttribute("stroke", "#000");
      circle.setAttribute("stroke-width", "0.5");
      svg.appendChild(circle);
      // Label
      if (item.label) {
        const text = document.createElementNS(svgNs, "text");
        text.setAttribute("x", String(padding.left - 4));
        text.setAttribute("y", String(cy + 4));
        text.setAttribute("text-anchor", "end");
        text.setAttribute("font-size", "10");
        text.setAttribute("fill", "#000");
        text.textContent = item.label;
        svg.appendChild(text);
      }
    });
  }

  function renderHeatmap(svg, width, height, padding, labels, series) {
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const rows = series.length || 1;
    const cols = labels.length || 1;
    const cellW = chartWidth / cols;
    const cellH = chartHeight / rows;
    const allValues = series.flatMap(([, values]) => values.map(getValue));
    const maxVal = Math.max(1, ...allValues);
    series.forEach(([key, values], rowIdx) => {
      labels.forEach((label, colIdx) => {
        const entry = values.find((item) => item.label === label);
        const value = entry ? entry.value : 0;
        const intensity = value / maxVal;
        const x = padding.left + colIdx * cellW;
        const y = padding.top + rowIdx * cellH;
        const rect = document.createElementNS(svgNs, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(cellW));
        rect.setAttribute("height", String(cellH));
        const opacity = 0.1 + intensity * 0.85;
        rect.setAttribute("fill", palette[0]);
        rect.setAttribute("opacity", String(opacity));
        rect.setAttribute("stroke", "#fff");
        rect.setAttribute("stroke-width", "1");
        svg.appendChild(rect);
      });
    });
  }

  function renderCombo(svg, width, height, padding, labels, series) {
    // First series as bars, second as line
    if (series.length >= 1) {
      renderBars(svg, width, height, padding, labels, [series[0]], false);
    }
    if (series.length >= 2) {
      renderLine(svg, width, height, padding, labels, [series[1]], false);
    }
  }

  function renderChart(figure) {
    if (figure.dataset.chartRendered === "true") return;
    const rawType = figure.getAttribute("type") || figure.getAttribute("data-type");
    const type = normalizeType(rawType || "bar");
    const data = parseChartData(figure);
    if (!data) return;

    const width = 640;
    const height = 360;
    const padding = { top: 24, right: 24, bottom: 32, left: 40 };
    const svg = createSvg(width, height);
    buildPatterns(svg);

    const axisChart = type === "bar" || type === "line" || type === "area" || type === "stacked" || type === "scatter" || type === "bubble" || type === "histogram" || type === "lollipop" || type === "heatmap" || type === "combo";
    if (axisChart) {
      drawAxes(svg, width, height, padding);
    }

    if (type === "scatter" || type === "bubble") {
      renderScatter(svg, width, height, padding, data, type === "bubble");
    } else if (type === "radar") {
      renderRadar(svg, width, height, padding, data);
    } else if (type === "gauge" || type === "meter") {
      const { labels, series } = buildSeries(data);
      renderGauge(svg, width, height, series);
    } else {
      const { labels, series } = buildSeries(data);
      if (type === "line") {
        renderLine(svg, width, height, padding, labels, series, false);
      } else if (type === "area" || type === "alluvial") {
        renderLine(svg, width, height, padding, labels, series, true);
      } else if (type === "donut") {
        renderDonut(svg, width, height, series);
      } else if (type === "pie") {
        renderPie(svg, width, height, series);
      } else if (type === "treemap" || type === "wordcloud") {
        renderTreemap(svg, width, height, padding, series);
      } else if (type === "stacked") {
        renderBars(svg, width, height, padding, labels, series, true);
      } else if (type === "histogram") {
        renderHistogram(svg, width, height, padding, labels, series);
      } else if (type === "lollipop") {
        renderLollipop(svg, width, height, padding, labels, series);
      } else if (type === "heatmap") {
        renderHeatmap(svg, width, height, padding, labels, series);
      } else if (type === "combo") {
        renderCombo(svg, width, height, padding, labels, series);
      } else if (type === "boxplot") {
        renderBars(svg, width, height, padding, labels, series, false);
      } else {
        renderBars(svg, width, height, padding, labels, series, false);
      }
    }

    const wrapper = document.createElement("div");
    wrapper.className = "chart-svg";
    wrapper.appendChild(svg);
    const pre = figure.querySelector("pre");
    if (pre) {
      pre.remove();
    }
    const highlight = figure.getAttribute("data-highlight");
    if (highlight && !figure.querySelector(".chart-highlight")) {
      const highlightEl = document.createElement("div");
      highlightEl.className = "chart-highlight";
      highlightEl.textContent = highlight;
      figure.appendChild(highlightEl);
    }
    figure.appendChild(wrapper);
    figure.dataset.chartRendered = "true";
  }

  window.__renderCharts = function() {
    const figures = document.querySelectorAll(".directive--chart");
    figures.forEach(renderChart);
  };
})();
  `;
}

async function buildHtml({
  markdown,
  metadata,
  layoutProfile,
  printProfile,
  theme,
  artDirection,
  typography,
  tokens,
  toc = [],
}) {
  const projectRoot = getProjectRoot();
  const baseCssPath = path.join(projectRoot, 'styles', 'print', 'print-base.css');
  const printCssPath = path.join(projectRoot, 'styles', 'print', PRINT_PROFILES[printProfile].css);
  const typographySettings = typography || resolveTypographySettings(metadata);
  const tokenCss = await buildTokenCss({
    projectRoot,
    templateKey:
      tokens?.templateKey ||
      metadata.templateKey ||
      metadata.template ||
      metadata.templateId ||
      null,
    tokenOverrides: tokens?.overrides || tokens?.tokenOverrides || tokens?.pressPack || tokens || null,
  });

  const [baseCss, printCss, fontFaceCss, hyphenationScriptTag] = await Promise.all([
    getCachedCss(baseCssPath),
    getCachedCss(printCssPath),
    buildFontFaceCss(projectRoot),
    buildHyphenationScriptTag(typographySettings, projectRoot),
  ]);
  const chartRendererScriptTag = CHART_RENDERER_ENABLED
    ? `<script>${buildChartRendererScript()}</script>`
    : '';

  const cover = buildCover(metadata);
  const tocSection = buildToc(metadata, toc);
  const processedMarkdown = applyHyphenationExceptions(
    markdown,
    typographySettings.hyphenationExceptions
  );
  const htmlContent = applyLogicBasedStyling(
    markdownToHtml(processedMarkdown, {
      typography: {
        smartypants: typographySettings.smartypants,
        smartypantsOptions: typographySettings.smartypantsOptions,
      },
    }),
    artDirection?.styleHints || {}
  );
  const layoutResult = buildLayoutGridHtml({
    htmlContent,
    artDirection,
    layoutProfile,
  });
  const storytellingBlock = layoutResult.usesStorytelling
    ? ''
    : buildStorytellingBlock(artDirection?.storytelling);
  const mainContent = `${storytellingBlock}${layoutResult.html}`;
  const resolvedTitle = resolveDocumentTitle(metadata);
  const title = escapeHtml(resolvedTitle);
  const lang = escapeHtml(metadata.language || 'tr');
  const colorMode = metadata.colorMode === 'mono' ? 'mono' : 'color';
  const pageNumbersEnabled = metadata.showPageNumbers !== false;

  // Footer page label i18n
  const PAGE_LABELS = { tr: 'Sayfa', en: 'Page', de: 'Seite', fr: 'Page', es: 'Página', pt: 'Página', it: 'Pagina', nl: 'Pagina' };
  const docLang = (metadata.language || metadata.locale || 'tr').slice(0, 2).toLowerCase();
  const footerPageLabel = PAGE_LABELS[docLang] || PAGE_LABELS['tr'];
  const footerLabelCss = `\n:root { --footer-page-label: "${footerPageLabel}"; }`;
  const typographyClasses = [
    typographySettings.hyphenate ? 'typography--hyphenate' : 'typography--no-hyphens',
  ];
  if (typographySettings.smartypants) {
    typographyClasses.push('typography--smartypants');
  }

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
${tokenCss}
${footerLabelCss}
${fontFaceCss}
${baseCss}

${printCss}
    </style>
  </head>
  <body class="layout layout--${layoutProfile} theme--${theme} print--${printProfile} color-mode--${colorMode} ${typographyClasses.join(' ')}" data-page-numbers="${pageNumbersEnabled ? 'on' : 'off'}">
    <div class="report">
      ${cover}
      ${tocSection}
      <main class="report-content">
        ${mainContent}
      </main>
      ${buildBackCover(metadata)}
    </div>
    ${hyphenationScriptTag}
    ${chartRendererScriptTag}
  </body>
</html>`;
}

async function runPagedPolyfill(page, scriptPath, verbose) {
  if (!scriptPath) {
    return;
  }

  if (verbose) {
    console.log('🧩 Loading Paged.js polyfill...');
  }

  await page.addScriptTag({ path: scriptPath });
  await page.waitForFunction(() => window.PagedPolyfill && window.PagedPolyfill.preview, {
    timeout: 5000,
  });

  await page.evaluate(async () => {
    try {
      const result = window.PagedPolyfill.preview();
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      console.warn('Paged.js preview failed:', error.message);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function runChartRenderer(page) {
  if (!CHART_RENDERER_ENABLED) {
    return;
  }
  await page.evaluate(() => {
    if (typeof window.__renderCharts === 'function') {
      window.__renderCharts();
    }
  });
}

async function applySmartTableSplits(page, options = {}) {
  return await page.evaluate(
    ({ minRows, minRowsPerPage }) => {
      const sourceRoot =
        document.querySelector('#pagedjs-source') ||
        document.querySelector('.report') ||
        document.body;
      const contentRoot = sourceRoot.querySelector('.report-content') || sourceRoot;
      const tables = Array.from(contentRoot.querySelectorAll('table'));
      const pageContent = document.querySelector('.pagedjs_page_content');
      const pageHeight = pageContent
        ? pageContent.getBoundingClientRect().height
        : window.innerHeight;
      let splitCount = 0;

      tables.forEach((table) => {
        if (table.dataset.tableSplit === 'true') {
          return;
        }
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length < minRows) {
          return;
        }
        const header = table.querySelector('thead');
        const firstRow = rows[0];
        const rowHeight = firstRow ? firstRow.getBoundingClientRect().height : 0;
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const safeRowHeight = rowHeight || 24;
        const usableHeight = Math.max(200, pageHeight - headerHeight - 80);
        const rowsPerPage = Math.max(
          minRowsPerPage,
          Math.floor(usableHeight / safeRowHeight) - 1
        );

        if (rows.length <= rowsPerPage + 1) {
          return;
        }

        table.classList.add('table--split');
        table.dataset.tableSplit = 'true';

        let currentTable = table;
        let index = rowsPerPage;
        while (index < rows.length) {
          const newTable = table.cloneNode(false);
          if (header) {
            newTable.appendChild(header.cloneNode(true));
          }
          const newBody = document.createElement('tbody');
          newTable.appendChild(newBody);

          for (let i = index; i < Math.min(rows.length, index + rowsPerPage); i += 1) {
            newBody.appendChild(rows[i]);
          }

          newTable.classList.add('table--split');
          newTable.dataset.tableSplit = 'true';

          const breaker = document.createElement('div');
          breaker.className = 'table-split-break force-break';
          currentTable.insertAdjacentElement('afterend', breaker);
          breaker.insertAdjacentElement('afterend', newTable);

          currentTable = newTable;
          index += rowsPerPage;
          splitCount += 1;
        }
      });

      return { splitCount };
    },
    {
      minRows: options.minRows || TABLE_SPLIT_MIN_ROWS,
      minRowsPerPage: options.minRowsPerPage || TABLE_SPLIT_MIN_ROWS_PER_PAGE,
    }
  );
}

async function annotateQaTargets(page) {
  await page.evaluate(() => {
    const root = document.querySelector('.report-content') || document.body;
    if (!root) return;
    let counter = 0;
    const targets = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,table,blockquote,pre,a,small,caption');
    targets.forEach((element) => {
      if (element.dataset.qaId) {
        return;
      }
      counter += 1;
      element.dataset.qaId = `qa-${counter}`;
      const sourceEl = element.closest('[data-source-line]') || element.querySelector?.('[data-source-line]') || element;
      if (sourceEl?.dataset?.sourceLine) {
        element.dataset.sourceLine = sourceEl.dataset.sourceLine;
      }
      if (sourceEl?.dataset?.sourceColumn) {
        element.dataset.sourceColumn = sourceEl.dataset.sourceColumn;
      }
    });
  });
}

async function runStaticLint(page, options = {}) {
  const bottomGap = Number.isFinite(options.bottomGap) ? options.bottomGap : QA_BOTTOM_GAP;
  const topGap = Number.isFinite(options.topGap) ? options.topGap : QA_TOP_GAP;
  return await page.evaluate(
    ({ bottomGap, topGap }) => {
      const issues = [];
      const fixes = [];
      const issueKeys = new Set();
      const fixKeys = new Set();
      const pages = document.querySelectorAll('.pagedjs_page');
      pages.forEach((page, pageIndex) => {
        const pageRect = page.getBoundingClientRect();
        const pageNumber = Number(page.dataset.pageNumber) || pageIndex + 1;
        const content = page.querySelector('.pagedjs_page_content') || page;
        const elements = content.querySelectorAll('table,h2,h3,p,li,blockquote,pre,img');
        elements.forEach((element) => {
          const qaId = element.getAttribute('data-qa-id');
          if (!qaId) return;
          const rect = element.getBoundingClientRect();
          const bottomDistance = pageRect.bottom - rect.bottom;
          const topDistance = rect.top - pageRect.top;
          const tag = element.tagName.toLowerCase();
          const sourceLine = element.dataset.sourceLine ? Number(element.dataset.sourceLine) : null;
          const sourceColumn = element.dataset.sourceColumn ? Number(element.dataset.sourceColumn) : null;
          let type = null;
          let recommendation = null;
          let severity = 'medium';

          if (rect.bottom > pageRect.bottom + 1) {
            type = 'overflow';
            recommendation = 'force-break';
            severity = 'high';
          } else if (tag === 'table' && bottomDistance < bottomGap) {
            type = 'table-split';
            recommendation = 'avoid-break';
            severity = 'high';
          } else if ((tag === 'h2' || tag === 'h3') && bottomDistance < bottomGap) {
            type = 'heading-near-bottom';
            recommendation = 'force-break';
          } else if ((tag === 'p' || tag === 'li') && bottomDistance < 20) {
            type = 'orphan';
            recommendation = 'avoid-break';
          } else if ((tag === 'p' || tag === 'li') && topDistance < topGap && rect.height < 28) {
            type = 'widow';
            recommendation = 'avoid-break';
          } else if (tag === 'table' && rect.width > pageRect.width + 2) {
            type = 'table-overflow-x';
            recommendation = 'shrink-table';
            severity = 'high';
          } else if (tag === 'img' && rect.width > pageRect.width + 2) {
            type = 'image-overflow';
            recommendation = 'shrink-image';
            severity = 'medium';
          }

          if (!type || !recommendation) {
            return;
          }

          const issueKey = `${type}:${qaId}:${pageNumber}`;
          if (!issueKeys.has(issueKey)) {
            issueKeys.add(issueKey);
            issues.push({
              type,
              severity,
              page: pageNumber,
              qaId,
              recommendation,
              sourceLine,
              sourceColumn,
            });
          }

          const fixKey = `${recommendation}:${qaId}`;
          if (!fixKeys.has(fixKey)) {
            fixKeys.add(fixKey);
            fixes.push({ qaId, action: recommendation, sourceLine, sourceColumn });
          }
        });
      });

      return { issues, fixes };
    },
    { bottomGap, topGap }
  );
}

async function applyQaFixes(page, fixes = []) {
  if (!fixes.length) return;
  await page.evaluate((fixes) => {
    const root = document.querySelector('.report-content') || document.body;
    if (!root) return;
    fixes.forEach((fix) => {
      const target = root.querySelector(`[data-qa-id="${fix.qaId}"]`);
      if (!target) return;
      if (fix.action === 'shrink-table') {
        target.style.fontSize = '85%';
        target.style.overflowX = 'hidden';
        target.style.maxWidth = '100%';
        target.style.tableLayout = 'fixed';
        target.style.wordBreak = 'break-word';
      } else if (fix.action === 'shrink-image') {
        target.style.maxWidth = '100%';
        target.style.height = 'auto';
      } else {
        target.classList.add(fix.action);
      }
    });
  }, fixes);
}

async function runAccessibilityLint(page) {
  return await page.evaluate(() => {
    const issues = [];
    const root = document.querySelector('.report-content') || document.body;
    if (!root) return issues;

    const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = Number(heading.tagName.slice(1));
      if (lastLevel && level > lastLevel + 1) {
        issues.push({
          type: 'heading-order',
          severity: 'low',
          qaId: heading.dataset.qaId || null,
          sourceLine: heading.dataset.sourceLine ? Number(heading.dataset.sourceLine) : null,
          sourceColumn: heading.dataset.sourceColumn ? Number(heading.dataset.sourceColumn) : null,
        });
      }
      lastLevel = level;
    });

    const links = root.querySelectorAll('a');
    links.forEach((link) => {
      if (!link.getAttribute('href')) {
        issues.push({
          type: 'link-missing',
          severity: 'low',
          qaId: link.dataset.qaId || null,
          sourceLine: link.dataset.sourceLine ? Number(link.dataset.sourceLine) : null,
          sourceColumn: link.dataset.sourceColumn ? Number(link.dataset.sourceColumn) : null,
        });
      }
    });

    const textNodes = root.querySelectorAll('p,li,small,caption');
    textNodes.forEach((node) => {
      const fontSize = Number.parseFloat(getComputedStyle(node).fontSize || '0');
      if (fontSize && fontSize < 10) {
        issues.push({
          type: 'min-font-size',
          severity: 'medium',
          qaId: node.dataset.qaId || null,
          sourceLine: node.dataset.sourceLine ? Number(node.dataset.sourceLine) : null,
          sourceColumn: node.dataset.sourceColumn ? Number(node.dataset.sourceColumn) : null,
        });
      }
    });

    // Table semantic validation
    const tables = root.querySelectorAll('table');
    tables.forEach((table) => {
      const qaId = table.dataset.qaId || null;
      const sourceLine = table.dataset.sourceLine ? Number(table.dataset.sourceLine) : null;
      const sourceColumn = table.dataset.sourceColumn ? Number(table.dataset.sourceColumn) : null;

      // Check for missing thead
      if (!table.querySelector('thead')) {
        issues.push({
          type: 'table-missing-thead',
          severity: 'medium',
          qaId,
          sourceLine,
          sourceColumn,
        });
      }

      // Check for th elements (header cells)
      const headerCells = table.querySelectorAll('th');
      if (headerCells.length === 0) {
        issues.push({
          type: 'table-missing-headers',
          severity: 'medium',
          qaId,
          sourceLine,
          sourceColumn,
        });
      }

      // Check for inconsistent column counts
      const rows = table.querySelectorAll('tr');
      if (rows.length > 1) {
        const colCounts = new Set();
        rows.forEach((row) => {
          let count = 0;
          row.querySelectorAll('td,th').forEach((cell) => {
            count += Number(cell.getAttribute('colspan') || 1);
          });
          colCounts.add(count);
        });
        if (colCounts.size > 1) {
          issues.push({
            type: 'table-inconsistent-columns',
            severity: 'low',
            qaId,
            sourceLine,
            sourceColumn,
          });
        }
      }

      // Check for empty table
      const dataCells = table.querySelectorAll('td');
      if (dataCells.length === 0) {
        issues.push({
          type: 'table-empty',
          severity: 'low',
          qaId,
          sourceLine,
          sourceColumn,
        });
      }
    });

    return issues;
  });
}

async function runAxeAudit(page, options = {}) {
  const projectRoot = getProjectRoot();
  const axePath =
    options.axePath ||
    path.join(projectRoot, 'scripts', 'vendor', 'axe.min.js');
  if (!(await fileExists(axePath))) {
    return { error: `axe-core not found at ${axePath}` };
  }

  try {
    await page.addScriptTag({ path: axePath });
    const tags = (options.tags || QA_AXE_TAGS)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const results = await page.evaluate(async (tags) => {
      const target = document.querySelector('.report-content') || document.body;
      const runOnly = tags.length ? { type: 'tag', values: tags } : undefined;
      const options = runOnly ? { runOnly } : {};
      const axeResults = await window.axe.run(target, options);
      return axeResults;
    }, tags);

    const violations = (results.violations || []).map((violation) => ({
      id: violation.id,
      impact: violation.impact || 'unknown',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes ? violation.nodes.length : 0,
    }));

    return {
      summary: {
        violations: violations.length,
        passes: results.passes ? results.passes.length : 0,
        incomplete: results.incomplete ? results.incomplete.length : 0,
      },
      violations,
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function collectFontReport(page) {
  return await page.evaluate(async () => {
    if (!document.fonts || typeof document.fonts.check !== 'function') {
      return null;
    }
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness failures; continue with checks.
    }
    const families = ['IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono'];
    return families.map((family) => ({
      family,
      loaded: document.fonts.check(`12px "${family}"`),
    }));
  });
}

// CPL (characters per line) thresholds per print profile
const CPL_THRESHOLDS = {
  'pagedjs-a5': { min: 35, max: 75 },
  'pagedjs-a4': { min: 45, max: 90 },
  'pagedjs-a3': { min: 55, max: 100 },
};

async function runTypographyScoring(page, printProfile = 'pagedjs-a4') {
  const thresholds = CPL_THRESHOLDS[printProfile] || CPL_THRESHOLDS['pagedjs-a4'];
  return await page.evaluate(({ minCpl, maxCpl }) => {
    const nodes = Array.from(document.querySelectorAll('.report-content p, .report-content li'));
    if (!nodes.length) {
      return null;
    }

    const stats = {
      totalNodes: nodes.length,
      totalLines: 0,
      totalChars: 0,
      avgCharsPerLine: 0,
      minCharsPerLine: null,
      maxCharsPerLine: null,
      tooShort: 0,
      tooLong: 0,
      cplThresholds: { min: minCpl, max: maxCpl },
      hyphenationDensity: 0,
      lineHeightRatio: 0,
    };

    let totalLineHeightRatio = 0;
    let softHyphens = 0;
    let totalWords = 0;
    nodes.forEach((node) => {
      const text = (node.textContent || '').trim();
      if (!text) {
        return;
      }
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      const fontSize = Number.parseFloat(style.fontSize || '0');
      let lineHeight = Number.parseFloat(style.lineHeight || '0');
      if (!lineHeight || Number.isNaN(lineHeight)) {
        lineHeight = fontSize * 1.5;
      }
      const lineCount = Math.max(1, Math.round(rect.height / lineHeight));
      const chars = text.length;
      const charsPerLine = chars / lineCount;
      stats.totalLines += lineCount;
      stats.totalChars += chars;
      stats.minCharsPerLine = stats.minCharsPerLine === null
        ? charsPerLine
        : Math.min(stats.minCharsPerLine, charsPerLine);
      stats.maxCharsPerLine = stats.maxCharsPerLine === null
        ? charsPerLine
        : Math.max(stats.maxCharsPerLine, charsPerLine);
      if (charsPerLine < minCpl) {
        stats.tooShort += 1;
      }
      if (charsPerLine > maxCpl) {
        stats.tooLong += 1;
      }
      if (fontSize) {
        totalLineHeightRatio += lineHeight / fontSize;
      }

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      totalWords += wordCount;
      for (const ch of text) {
        if (ch === '\u00AD') {
          softHyphens += 1;
        }
      }
    });

    stats.avgCharsPerLine = stats.totalLines ? stats.totalChars / stats.totalLines : 0;
    stats.lineHeightRatio = nodes.length ? totalLineHeightRatio / nodes.length : 0;
    stats.hyphenationDensity = totalWords ? softHyphens / totalWords : 0;

    return stats;
  }, { minCpl: thresholds.min, maxCpl: thresholds.max });
}

async function collectVisualRichness(page) {
  return await page.evaluate(() => {
    const root = document.querySelector('.report-content') || document.body;
    if (!root) {
      return null;
    }
    const count = (selector) => root.querySelectorAll(selector).length;
    const layoutComponents = Array.from(root.querySelectorAll('.layout-component'));
    const layoutTypes = layoutComponents.reduce((acc, element) => {
      const rawType = element.dataset.componentType || element.getAttribute('data-component-type') || 'unknown';
      const type = String(rawType || 'unknown');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const themedLayoutBlocks = ['white', 'g10', 'g90', 'g100'].reduce((acc, theme) => {
      acc[theme] = root.querySelectorAll(`.layout-component.theme--${theme}`).length;
      return acc;
    }, {});
    return {
      layoutComponents: layoutComponents.length,
      layoutTypes,
      themedLayoutBlocks,
      charts: count('figure.directive--chart, figure.component--chart, .component--chart'),
      highlights: count('.ai-insight'),
      patterns: count('.pattern, .directive--pattern, .component--pattern'),
      images: count('img'),
      tables: count('table'),
    };
  });
}

async function runVisualRegression(options = {}) {
  const { screenshotPath } = options;
  if (!screenshotPath) {
    return null;
  }

  const projectRoot = getProjectRoot();
  const baselineDir = options.baselineDir
    || (QA_BASELINE_DIR ? path.resolve(projectRoot, QA_BASELINE_DIR) : null)
    || path.join(projectRoot, 'output', 'qa-baselines');
  const diffDir = options.diffDir
    || (QA_DIFF_DIR ? path.resolve(projectRoot, QA_DIFF_DIR) : null)
    || path.join(projectRoot, 'output', 'qa-diffs');
  const baselineKey =
    options.baselineKey || path.basename(screenshotPath, path.extname(screenshotPath));
  const baselinePath = path.join(baselineDir, `${baselineKey}.png`);
  const diffPath = path.join(diffDir, `${baselineKey}-diff.png`);
  const threshold = Number.isFinite(options.threshold) ? options.threshold : QA_VISUAL_THRESHOLD;
  const maxMismatchRatio = Number.isFinite(options.maxMismatchRatio)
    ? options.maxMismatchRatio
    : QA_VISUAL_MAX_MISMATCH_RATIO;

  await ensureDir(baselineDir);
  await ensureDir(diffDir);

  if (!(await fileExists(baselinePath))) {
    await fs.copyFile(screenshotPath, baselinePath);
    return {
      createdBaseline: true,
      baselinePath,
      currentPath: screenshotPath,
    };
  }

  try {
    const scriptPath = path.join(projectRoot, 'scripts', 'vendor', 'visual_diff.py');
    if (!(await fileExists(scriptPath))) {
      return { error: `visual_diff.py not found at ${scriptPath}` };
    }
    const { stdout } = await execFileAsync('python3', [
      scriptPath,
      baselinePath,
      screenshotPath,
      '--diff',
      diffPath,
      '--threshold',
      String(threshold),
    ]);
    const payload = stdout ? JSON.parse(stdout.trim()) : {};
    if (payload.sizeMismatch) {
      return {
        baselinePath,
        currentPath: screenshotPath,
        diffPath: null,
        sizeMismatch: payload.sizeMismatch,
      };
    }
    const mismatchRatio = Number(payload.mismatchRatio || 0);
    return {
      baselinePath,
      currentPath: screenshotPath,
      diffPath,
      mismatchPixels: payload.mismatchPixels || 0,
      mismatchRatio,
      threshold,
      maxMismatchRatio,
      passed: mismatchRatio <= maxMismatchRatio,
    };
  } catch (error) {
    return { error: error.message };
  }
}

function buildIssueKey(issue) {
  if (!issue) return '';
  const type = issue.type || 'unknown';
  const qaId = issue.qaId || 'na';
  const page = issue.page || 'na';
  return `${type}:${qaId}:${page}`;
}

function summarizeIssues(issues = []) {
  return issues.reduce((acc, issue) => {
    const key = issue.type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function summarizeFixes(fixes = []) {
  return fixes.reduce((acc, fix) => {
    const key = fix.action || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildQaReportHtml(report = {}, options = {}) {
  const issuesSummary = summarizeIssues(report.issues || []);
  const fixesSummary = summarizeFixes(report.appliedFixes || []);
  const appliedFixes = Array.isArray(report.appliedFixes) ? report.appliedFixes : [];
  const iterations = report.iterations || 0;
  const accessibilityCount = report.accessibilityIssues?.length || 0;
  const issueCount = report.issues?.length || 0;
  const typographyScore = report.typography?.score ?? null;
  const visual = report.visualRegression || {};
  const diffLog = Array.isArray(report.diffLog) ? report.diffLog : [];
  const screenshots = Array.isArray(report.screenshots) ? report.screenshots : [];

  const listItems = (items) =>
    items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('');
  const tableRows = (rows) =>
    rows
      .map(([label, value]) => `<tr><th>${escapeHtml(String(label))}</th><td>${escapeHtml(String(value))}</td></tr>`)
      .join('');
  const keyValueRows = (entries) =>
    entries
      .map(([label, value]) => `<tr><td>${escapeHtml(String(label))}</td><td>${escapeHtml(String(value))}</td></tr>`)
      .join('');

  const summaryRows = [
    ['Issues', issueCount],
    ['Iterations', iterations],
    ['Accessibility', accessibilityCount],
    ['Typography Score', typographyScore ?? 'n/a'],
    ['Visual Regression', visual.passed === true ? 'pass' : visual.passed === false ? 'fail' : 'n/a'],
  ];

  const visualRichness = report.visualRichness || null;
  const richnessRows = visualRichness
    ? [
        ['Layout components', visualRichness.layoutComponents ?? 0],
        ['Charts', visualRichness.charts ?? 0],
        ['Highlights', visualRichness.highlights ?? 0],
        ['Patterns', visualRichness.patterns ?? 0],
        ['Images', visualRichness.images ?? 0],
        ['Tables', visualRichness.tables ?? 0],
      ]
    : [];
  const layoutTypeRows = visualRichness?.layoutTypes
    ? keyValueRows(Object.entries(visualRichness.layoutTypes))
    : '';
  const themeRows = visualRichness?.themedLayoutBlocks
    ? keyValueRows(Object.entries(visualRichness.themedLayoutBlocks))
    : '';

  const issueRows = keyValueRows(Object.entries(issuesSummary));
  const fixRows = keyValueRows(Object.entries(fixesSummary));
  const fixDetailRows = appliedFixes
    .map((fix) => `<tr><td>${escapeHtml(fix.qaId || '')}</td><td>${escapeHtml(fix.action || '')}</td></tr>`)
    .join('');
  const diffRows = diffLog
    .map((entry) => {
      const added = Array.isArray(entry.added) ? entry.added.length : 0;
      const resolved = Array.isArray(entry.resolved) ? entry.resolved.length : 0;
      return `<tr>
        <td>${escapeHtml(String(entry.iteration || ''))}</td>
        <td>${escapeHtml(String(entry.issueCount || 0))}</td>
        <td>${escapeHtml(String(entry.fixCount || 0))}</td>
        <td>${escapeHtml(String(added))}</td>
        <td>${escapeHtml(String(resolved))}</td>
      </tr>`;
    })
    .join('');

  return `
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>QA Report</title>
    <style>
      body { font-family: "IBM Plex Sans", Arial, sans-serif; margin: 24px; color: #161616; }
      h1 { margin-top: 0; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
      th, td { border: 1px solid #e0e0e0; padding: 8px; text-align: left; font-size: 14px; }
      th { background: #f4f4f4; }
      section { margin-bottom: 24px; }
      ul { padding-left: 18px; }
      code { background: #f4f4f4; padding: 2px 4px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>QA Report</h1>
    ${options.outputPath ? `<p><strong>Output:</strong> <code>${escapeHtml(options.outputPath)}</code></p>` : ''}
    <section>
      <h2>Summary</h2>
      <table>
        ${tableRows(summaryRows)}
      </table>
    </section>
    <section>
      <h2>Issue Breakdown</h2>
      <table>
        <tr><th>Type</th><th>Count</th></tr>
        ${issueRows || '<tr><td colspan="2">No issues</td></tr>'}
      </table>
    </section>
    ${visualRichness ? `
    <section>
      <h2>Visual Richness</h2>
      <table>
        ${tableRows(richnessRows)}
      </table>
      <table>
        <tr><th>Layout Type</th><th>Count</th></tr>
        ${layoutTypeRows || '<tr><td colspan="2">No layout components</td></tr>'}
      </table>
      <table>
        <tr><th>Theme</th><th>Layout Blocks</th></tr>
        ${themeRows || '<tr><td colspan="2">No themed blocks</td></tr>'}
      </table>
    </section>
    ` : ''}
    <section>
      <h2>Applied Fixes</h2>
      <table>
        <tr><th>Action</th><th>Count</th></tr>
        ${fixRows || '<tr><td colspan="2">No fixes applied</td></tr>'}
      </table>
      <table>
        <tr><th>qaId</th><th>Action</th></tr>
        ${fixDetailRows || '<tr><td colspan="2">No fix details</td></tr>'}
      </table>
    </section>
    <section>
      <h2>Iteration Diff Log</h2>
      <table>
        <tr><th>Iteration</th><th>Issues</th><th>Fixes</th><th>Added</th><th>Resolved</th></tr>
        ${diffRows || '<tr><td colspan="5">No iteration diff log</td></tr>'}
      </table>
    </section>
    <section>
      <h2>Artifacts</h2>
      ${screenshots.length ? `<p><strong>Screenshots</strong></p><ul>${listItems(screenshots)}</ul>` : '<p>No screenshots captured.</p>'}
      ${visual?.baselinePath ? `<p><strong>Baseline:</strong> <code>${escapeHtml(visual.baselinePath)}</code></p>` : ''}
      ${visual?.diffPath ? `<p><strong>Diff:</strong> <code>${escapeHtml(visual.diffPath)}</code></p>` : ''}
    </section>
  </body>
</html>`;
}

async function rerunPagedPreview(page) {
  await page.evaluate(async () => {
    if (window.PagedPolyfill && window.PagedPolyfill.preview) {
      const result = window.PagedPolyfill.preview();
      if (result && typeof result.then === 'function') {
        await result;
      }
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
}

async function runQaHarness(page, options = {}) {
  const enabled = options.enabled !== false;
  if (!enabled || QA_MAX_ITERATIONS <= 0) {
    return null;
  }

  const report = {
    iterations: 0,
    issues: [],
    appliedFixes: [],
    screenshots: [],
    diffLog: [],
    accessibilityIssues: [],
    accessibilityAudit: null,
    typography: null,
    visualRichness: null,
    visualRegression: null,
    generatedAt: new Date().toISOString(),
  };

  let previousIssueKeys = new Set();
  if (options.screenshotPath) {
    await page.screenshot({ path: options.screenshotPath, fullPage: true });
    report.screenshots.push(options.screenshotPath);
  }

  let lastLint = { issues: [], fixes: [] };
  for (let iteration = 0; iteration < QA_MAX_ITERATIONS; iteration += 1) {
    const lint = await runStaticLint(page, options);
    lastLint = lint;
    const currentIssueKeys = new Set(lint.issues.map((issue) => buildIssueKey(issue)));
    const added = Array.from(currentIssueKeys).filter((key) => !previousIssueKeys.has(key));
    const resolved = Array.from(previousIssueKeys).filter((key) => !currentIssueKeys.has(key));
    report.diffLog.push({
      iteration: iteration + 1,
      issueCount: lint.issues.length,
      fixCount: lint.fixes.length,
      added,
      resolved,
      issues: lint.issues,
      fixes: lint.fixes,
    });
    previousIssueKeys = currentIssueKeys;
    if (!lint.issues.length) {
      break;
    }

    if (!lint.fixes.length) {
      break;
    }

    await applyQaFixes(page, lint.fixes);
    report.appliedFixes.push(...lint.fixes);
    report.iterations += 1;
    await rerunPagedPreview(page);
  }

  const finalLint = await runStaticLint(page, options);
  report.issues = finalLint?.issues || lastLint.issues || [];

  report.accessibilityIssues = await runAccessibilityLint(page);
  report.accessibilityAudit = await runAxeAudit(page, options.axe || {});
  report.typography = await runTypographyScoring(page, options.printProfile);
  report.visualRichness = await collectVisualRichness(page);
  report.fonts = await collectFontReport(page);
  if (options.visual?.enabled ?? QA_VISUAL_ENABLED) {
    report.visualRegression = await runVisualRegression({
      screenshotPath: options.screenshotPath,
      baselineKey: options.visual?.baselineKey || options.baselineKey,
      baselineDir: options.visual?.baselineDir,
      diffDir: options.visual?.diffDir,
      threshold: options.visual?.threshold,
      maxMismatchRatio: options.visual?.maxMismatchRatio,
    });
  }

  if (options.useGemini !== false) {
    try {
      const aiReview = await reviewQaIssues({ issues: report.issues });
      if (aiReview) {
        report.aiReview = aiReview;
      }
    } catch (error) {
      report.aiReviewError = error.message;
    }
  }

  return report;
}

async function stageTrainingExample({ markdown, layoutJson, qaReport, metadata, template }) {
  if (!EXAMPLE_AUTO_STAGE) return;
  const score = qaReport?.overallScore ?? qaReport?.score ?? 0;
  if (score < EXAMPLE_QA_THRESHOLD) return;

  try {
    const id = `example-${randomUUID().slice(0, 8)}`;
    const stagingDir = path.join(getProjectRoot(), 'library', 'examples-staging', id);
    await fs.mkdir(stagingDir, { recursive: true });
    await fs.writeFile(path.join(stagingDir, 'input.md'), markdown || '');
    await fs.writeFile(path.join(stagingDir, 'layout.json'), JSON.stringify(layoutJson, null, 2));
    await fs.writeFile(
      path.join(stagingDir, 'score.json'),
      JSON.stringify({
        qaScore: score,
        manualReview: 'pending',
        strengths: [],
        weaknesses: [],
        tags: [],
        template: template || 'unknown',
        docType: metadata?.docType || 'report',
        createdAt: new Date().toISOString(),
      }, null, 2)
    );
    console.log(`[training] Example staged: ${id} (QA score: ${score})`);
  } catch (error) {
    console.warn(`[training] Failed to stage example: ${error.message}`);
  }
}

/**
 * Convert markdown to PDF using Paged.js + headless Chromium
 * @param {string} inputPath - Path to markdown file
 * @param {string} outputPath - Path to output PDF (optional)
 * @param {object} options - Conversion options
 * @returns {Promise<string>} Path to generated PDF
 */
export async function convertToPaged(inputPath, outputPath = null, options = {}) {
  const {
    layoutProfile,
    printProfile,
    theme = 'white',
    verbose = true,
    title,
    subtitle,
    author,
    date,
    language,
    colorMode,
    includeCover,
    includeToc,
    includeBackCover,
    showPageNumbers,
    printBackground,
    artDirection = null,
    tokens = null,
    qa = {},
    preview = {},
    returnResult = false,
    postprocess = {},
    artifacts = {},
    onStage = null,
  } = options;
  const postprocessEnabled = postprocess.enabled !== false;

  const resolvedLayout = normalizeLayoutProfile(layoutProfile);
  const resolvedPrint = normalizePrintProfile(printProfile);
  const printConfig = PRINT_PROFILES[resolvedPrint];

  let tempHtmlPath = null;
  try {
    if (verbose) console.log('📄 Reading markdown file...');
    const markdownContent = await readFile(inputPath);
    const cleanupResult = sanitizeMarkdownContent(markdownContent, {
      keepSoftHyphen: options.keepSoftHyphen === true,
    });
    const sanitizedMarkdownContent = cleanupResult.text;

    if (verbose) console.log('🔍 Parsing markdown...');
    const { metadata, content, components, toc } = parseMarkdown(sanitizedMarkdownContent);
    const patternTags = extractPatternTags(components, metadata);
    const mergedKeywords = Array.from(new Set([
      ...normalizeKeywordList(metadata.keywords),
      ...buildPatternKeywords(patternTags),
    ]));

    const mergedMetadataRaw = {
      ...metadata,
      title: title || metadata.title,
      subtitle: subtitle || metadata.subtitle,
      author: author || metadata.author,
      date: date || metadata.date,
      language: language || metadata.language,
      colorMode: colorMode || metadata.colorMode || 'color',
      includeCover: includeCover === undefined ? metadata.includeCover : includeCover,
      includeToc: includeToc === undefined ? metadata.includeToc : includeToc,
      includeBackCover: includeBackCover === undefined ? metadata.includeBackCover : includeBackCover,
      showPageNumbers: showPageNumbers === undefined ? metadata.showPageNumbers : showPageNumbers,
      printBackground: printBackground === undefined ? metadata.printBackground : printBackground,
      keywords: mergedKeywords,
      patternTags,
    };
    const mergedMetadata = resolveDocumentMetadata({
      markdown: content,
      metadata: mergedMetadataRaw,
      settings: options,
      fileName: inputPath,
      fallbackTitle: 'Carbon Report',
    });
    mergedMetadata.cleanup = cleanupResult.stats;

    const typography = resolveTypographySettings(mergedMetadata, options.typography || {});

    if (verbose) console.log('🧱 Building HTML + print CSS...');
    const html = await buildHtml({
      markdown: content,
      metadata: mergedMetadata,
      layoutProfile: resolvedLayout,
      printProfile: resolvedPrint,
      theme,
      artDirection,
      typography,
      tokens,
      toc,
    });
    if (typeof onStage === 'function') {
      await onStage('render-html');
    }

    await writeArtifact(artifacts.renderHtmlPath || artifacts.htmlPath, html);

    const projectRoot = getProjectRoot();
    const tempDir = path.join(projectRoot, 'output', 'temp');
    await ensureDir(tempDir);

    tempHtmlPath = path.join(tempDir, `paged-${Date.now()}.html`);
    await writeFile(tempHtmlPath, html);

    const finalOutputPath = outputPath || getOutputPath(inputPath, `paged-${resolvedPrint}`);
    await ensureDir(path.dirname(finalOutputPath));

    if (verbose) console.log('🖨️  Rendering PDF with Chromium...');
    const browser = await acquireBrowser();

    try {
      const page = await browser.newPage();
      await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.emulateMedia({ media: 'print' });
      await runChartRenderer(page);
      const pagedScript = await getCachedPagedScriptPath(projectRoot);
      await runPagedPolyfill(page, pagedScript, verbose);
      if (typeof onStage === 'function') {
        await onStage('paginate');
      }
      const splitResult = await applySmartTableSplits(page, {
        minRows: TABLE_SPLIT_MIN_ROWS,
        minRowsPerPage: TABLE_SPLIT_MIN_ROWS_PER_PAGE,
      });
      if (splitResult?.splitCount) {
        await rerunPagedPreview(page);
      }
      await annotateQaTargets(page);
      await writePagedHtml(page, artifacts.pagedHtmlPath);

      await capturePreview(page, preview);

      const shouldCapture = qa.captureScreenshots !== false;
      const screenshotPath = qa.screenshotPath || artifacts.qaScreenshotPath || (
        shouldCapture
          ? path.join(
              path.dirname(finalOutputPath),
              `${path.basename(finalOutputPath, '.pdf')}-qa.png`
            )
          : null
      );
      const qaReport = await runQaHarness(page, {
        enabled: qa.enabled ?? QA_ENABLED,
        bottomGap: qa.bottomGap,
        topGap: qa.topGap,
        useGemini: qa.useGemini,
        screenshotPath,
        baselineKey: qa.baselineKey,
        visual: qa.visual,
        axe: qa.axe,
        printProfile: resolvedPrint,
      });
      if (qaReport) {
        console.log(
          JSON.stringify({
            event: 'qa_report_summary',
            outputPath: finalOutputPath,
            issues: qaReport.issues?.length || 0,
            accessibilityIssues: qaReport.accessibilityIssues?.length || 0,
            iterations: qaReport.iterations || 0,
            aiSeverity: qaReport.aiReview?.severity || null,
            typography: qaReport.typography || null,
            fonts: qaReport.fonts || null,
          })
        );
        // Store QA feedback for art director learning loop
        try {
          storeQaFeedback(markdown || '', qaReport);
        } catch { /* non-critical */ }
        await stageTrainingExample({ markdown, layoutJson: artDirection?.layoutJson, qaReport, metadata, template: options?.template });
      }
      if (qaReport) {
        const baseName = path.basename(finalOutputPath, '.pdf');
        const qaReportPath =
          qa.reportPath ||
          artifacts.qaReportPath ||
          path.join(path.dirname(finalOutputPath), `${baseName}-qa-report.json`);
        const qaReportHtmlPath =
          qa.reportHtmlPath ||
          artifacts.qaReportHtmlPath ||
          path.join(path.dirname(finalOutputPath), `${baseName}-qa-report.html`);
        qaReport.reportPath = qaReportPath;
        qaReport.reportHtmlPath = qaReportHtmlPath;
        if (qaReportPath) {
          await writeArtifact(qaReportPath, JSON.stringify(qaReport, null, 2));
        }
        if (qaReportHtmlPath) {
          const qaHtml = buildQaReportHtml(qaReport, { outputPath: finalOutputPath });
          await writeArtifact(qaReportHtmlPath, qaHtml);
        }
      }

      const pdfTimeout = Number(process.env.PDF_EXPORT_TIMEOUT) || 120_000;
      await Promise.race([
        page.pdf({
          path: finalOutputPath,
          format: printConfig.format,
          printBackground: mergedMetadata.printBackground !== false,
          preferCSSPageSize: true,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PDF export timed out')), pdfTimeout)
        ),
      ]);
      if (typeof onStage === 'function') {
        await onStage('export-pdf');
      }

      let postprocessSummary = null;
      if (postprocessEnabled) {
        postprocessSummary = await postprocessPdf({
          inputPath: finalOutputPath,
          outputPath: finalOutputPath,
          metadata: mergedMetadata,
          options: {
            ...postprocess,
            status: postprocess.status || mergedMetadata.status,
            headings: toc || [],
          },
        });
      }

      if (typeof onStage === 'function') {
        await onStage('postprocess');
      }

      await page.close();
      if (returnResult) {
        return { outputPath: finalOutputPath, qaReport, postprocess: postprocessSummary };
      }
    } finally {
      releaseBrowser(browser);
    }

    if (verbose) console.log(`✅ PDF generated successfully: ${finalOutputPath}`);
    return finalOutputPath;
  } catch (error) {
    console.error('❌ Error converting to PDF with Paged.js:', error.message);
    throw error;
  } finally {
    if (tempHtmlPath) {
      await fs.unlink(tempHtmlPath).catch(() => null);
    }
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  const layoutProfile = process.argv[4];
  const printProfile = process.argv[5];

  if (!inputPath) {
    console.error('Usage: node convert-paged.js <input.md> [output.pdf] [layoutProfile] [printProfile]');
    console.error('Layout profiles: symmetric, asymmetric, dashboard');
    console.error('Print profiles: pagedjs-a4, pagedjs-a3');
    process.exit(1);
  }

  convertToPaged(inputPath, outputPath, {
    layoutProfile,
    printProfile,
    verbose: true,
  })
    .then((output) => {
      console.log(`\n🎉 Success! PDF created at: ${output}`);
    })
    .catch((error) => {
      console.error('\n💥 Conversion failed:', error.message);
      process.exit(1);
    });
}

export default convertToPaged;
