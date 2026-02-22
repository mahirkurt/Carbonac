import path from 'path';

const CONTROL_AND_INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g;
const NBSP_CHARS = /\u00A0/g;
const SOFT_HYPHEN_CHARS = /\u00AD/g;

const INVALID_TITLES = new Set([
  '',
  'untitled',
  'untitled document',
  'document',
  'anonymous',
  'n/a',
  'none',
]);

const INVALID_AUTHORS = new Set([
  '',
  'anonymous',
  'anon',
  'unknown',
  'n/a',
  'none',
]);

function countMatches(value, regex) {
  const matches = value.match(regex);
  return matches ? matches.length : 0;
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMeaningful(value, invalidValues = INVALID_TITLES) {
  const candidate = normalizeWhitespace(value).toLowerCase();
  return !!candidate && !invalidValues.has(candidate);
}

function stripFrontmatter(markdown = '') {
  return String(markdown).replace(/^---\s*\n[\s\S]*?\n---\s*\n?/m, '');
}

function stripInlineMarkdown(value = '') {
  return String(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^[#>\-\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferTitleFromMarkdown(markdown = '') {
  const clean = stripFrontmatter(markdown);
  const lines = clean.split('\n').slice(0, 140);

  for (const line of lines) {
    const headingMatch = line.match(/^\s{0,3}#{1,2}\s+(.+)$/);
    if (!headingMatch) {
      continue;
    }
    const candidate = stripInlineMarkdown(headingMatch[1]);
    if (isMeaningful(candidate, INVALID_TITLES)) {
      return candidate;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (/^(```|>|[-*+]\s|\d+\.\s)/.test(trimmed)) {
      continue;
    }
    const candidate = stripInlineMarkdown(trimmed);
    if (candidate.length >= 8 && isMeaningful(candidate, INVALID_TITLES)) {
      return candidate;
    }
  }

  return '';
}

function inferAuthorFromMarkdown(markdown = '') {
  const clean = stripFrontmatter(markdown);
  const lines = clean.split('\n').slice(0, 80);
  const patterns = [
    /^\s*(?:author|yazar|haz[ıi]rlayan|prepared by|report by)\s*[:\-–]\s*(.+)$/i,
    /^\s*by\s+(.+)$/i,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (!match) {
        continue;
      }
      const candidate = stripInlineMarkdown(match[1]);
      if (isMeaningful(candidate, INVALID_AUTHORS) && candidate.length <= 120) {
        return candidate;
      }
    }
  }

  return '';
}

function inferTitleFromFileName(fileName = '') {
  const base = path.basename(String(fileName || '').trim());
  if (!base) {
    return '';
  }
  const withoutExt = base.replace(/\.[^.]+$/, '');
  const normalized = withoutExt
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\((\d+)\)$/g, '')
    .trim();
  if (!normalized || /^\d+$/.test(normalized)) {
    return '';
  }
  return normalized;
}

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'no', 'off', 'disabled'].includes(normalized)) {
    return false;
  }
  if (['true', '1', 'yes', 'on', 'enabled'].includes(normalized)) {
    return true;
  }
  return fallback;
}

function normalizeColorMode(value) {
  if (value === undefined || value === null || value === '') {
    return 'color';
  }
  const normalized = String(value).trim().toLowerCase();
  if (['mono', 'monochrome', 'grayscale', 'grey', 'gray', 'bw', 'blackwhite'].includes(normalized)) {
    return 'mono';
  }
  return 'color';
}

/**
 * Remove hidden / non-printable characters frequently produced by PDF conversions.
 */
export function sanitizeMarkdownContent(content = '', options = {}) {
  const keepSoftHyphen = options.keepSoftHyphen === true;
  const source = typeof content === 'string' ? content : String(content || '');

  const stats = {
    lineBreaksNormalized: countMatches(source, /\r\n?|\u2028|\u2029/g),
    nbspReplaced: countMatches(source, NBSP_CHARS),
    softHyphenRemoved: keepSoftHyphen ? 0 : countMatches(source, SOFT_HYPHEN_CHARS),
    invisibleRemoved: countMatches(source, CONTROL_AND_INVISIBLE_CHARS),
  };

  let text = source
    .replace(/\r\n?|\u2028|\u2029/g, '\n')
    .replace(NBSP_CHARS, ' ');

  if (!keepSoftHyphen) {
    text = text.replace(SOFT_HYPHEN_CHARS, '');
  }

  text = text.replace(CONTROL_AND_INVISIBLE_CHARS, '');

  return {
    text,
    stats,
  };
}

/**
 * Resolve best-effort document metadata when frontmatter is incomplete.
 */
export function resolveDocumentMetadata({
  markdown = '',
  metadata = {},
  settings = {},
  fileName = '',
  fallbackTitle = 'Carbon Report',
} = {}) {
  const sourceMarkdown = String(markdown || '');
  const inferredTitle = inferTitleFromMarkdown(sourceMarkdown);
  const inferredAuthor = inferAuthorFromMarkdown(sourceMarkdown);
  const fileBasedTitle = inferTitleFromFileName(fileName || settings.fileName || '');

  const titleCandidates = [
    settings.title,
    metadata.title,
    inferredTitle,
    fileBasedTitle,
    fallbackTitle,
  ];

  const authorCandidates = [
    settings.author,
    metadata.author,
    inferredAuthor,
  ];

  const title = titleCandidates.find((candidate) => isMeaningful(candidate, INVALID_TITLES)) || fallbackTitle;
  const author = authorCandidates.find((candidate) => isMeaningful(candidate, INVALID_AUTHORS)) || '';

  const language = normalizeWhitespace(
    settings.language || settings.locale || metadata.language || metadata.locale || 'tr'
  );

  const includeCover = normalizeBoolean(
    settings.includeCover ?? settings.cover ?? metadata.includeCover ?? metadata.cover,
    true
  );

  const showPageNumbers = normalizeBoolean(
    settings.showPageNumbers ?? settings.pageNumbers ?? metadata.showPageNumbers ?? metadata.pageNumbers,
    true
  );

  const printBackground = normalizeBoolean(
    settings.printBackground ?? settings.background ?? metadata.printBackground ?? metadata.background,
    true
  );

  const colorMode = normalizeColorMode(
    settings.colorMode ?? settings.printColorMode ?? metadata.colorMode ?? metadata.printColorMode
  );

  return {
    ...metadata,
    title,
    subtitle: normalizeWhitespace(settings.subtitle || metadata.subtitle || ''),
    author,
    date: normalizeWhitespace(settings.date || metadata.date || ''),
    language,
    locale: normalizeWhitespace(settings.locale || metadata.locale || language),
    colorMode,
    includeCover,
    showPageNumbers,
    printBackground,
  };
}
