import path from 'path';

const CONTROL_AND_INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g;
const NBSP_CHARS = /\u00A0/g;
const SOFT_HYPHEN_CHARS = /\u00AD/g;

// Common emoji → text-label mapping for print-safe output
const EMOJI_TEXT_MAP = new Map([
  ['\u{1F517}', '[link]'],       // 🔗
  ['\u{1F4CD}', '[loc]'],        // 📍
  ['\u{1F916}', '[ai]'],         // 🤖
  ['\u{2705}',  '[ok]'],         // ✅
  ['\u{274C}',  '[x]'],          // ❌
  ['\u{26A0}\uFE0F', '[!]'],     // ⚠️
  ['\u{26A0}',  '[!]'],          // ⚠
  ['\u{2139}\uFE0F', '[i]'],     // ℹ️
  ['\u{2139}',  '[i]'],          // ℹ
  ['\u{1F4A1}', '[tip]'],        // 💡
  ['\u{1F4DD}', '[note]'],       // 📝
  ['\u{1F4CB}', '[list]'],       // 📋
  ['\u{1F4C4}', '[doc]'],        // 📄
  ['\u{1F4C1}', '[folder]'],     // 📁
  ['\u{1F4CA}', '[chart]'],      // 📊
  ['\u{1F4C8}', '[trend]'],      // 📈
  ['\u{1F50D}', '[search]'],     // 🔍
  ['\u{1F512}', '[lock]'],       // 🔒
  ['\u{1F513}', '[unlock]'],     // 🔓
  ['\u{1F527}', '[tool]'],       // 🔧
  ['\u{2699}\uFE0F', '[gear]'],  // ⚙️
  ['\u{2699}',  '[gear]'],       // ⚙
  ['\u{1F3AF}', '[target]'],     // 🎯
  ['\u{1F680}', '[launch]'],     // 🚀
  ['\u{1F4E6}', '[pkg]'],        // 📦
  ['\u{1F4AC}', '[chat]'],       // 💬
  ['\u{1F9EA}', '[test]'],       // 🧪
  ['\u{1F9F1}', '[build]'],      // 🧱
  ['\u{1F5A8}\uFE0F', '[print]'],// 🖨️
  ['\u{1F5A8}', '[print]'],      // 🖨
]);

// Regex that matches most emoji (emoticons, symbols, supplemental, modifiers, flags, etc.)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}]/gu;

const INVALID_TITLES = new Set([
  '',
  'untitled',
  'untitled document',
  'new document',
  'document',
  'anonymous',
  'n/a',
  'none',
  'başlıksız',
  'isimsiz',
  'adsız',
  'yeni belge',
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
/**
 * Replace known emoji with text labels, then strip any remaining emoji.
 */
function stripEmoji(text) {
  let result = text;
  let replaced = 0;

  // First pass: replace mapped emoji with text labels
  for (const [emoji, label] of EMOJI_TEXT_MAP) {
    if (result.includes(emoji)) {
      replaced += countMatches(result, new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gu'));
      result = result.replaceAll(emoji, label);
    }
  }

  // Second pass: strip any remaining emoji characters
  const remaining = countMatches(result, EMOJI_REGEX);
  replaced += remaining;
  result = result.replace(EMOJI_REGEX, '');

  // Clean up orphaned variation selectors (U+FE0E, U+FE0F) left after emoji removal
  result = result.replace(/[\uFE0E\uFE0F]/g, '');

  return { text: result, emojiStripped: replaced };
}

export function sanitizeMarkdownContent(content = '', options = {}) {
  const keepSoftHyphen = options.keepSoftHyphen === true;
  const keepEmoji = options.keepEmoji === true;
  const source = typeof content === 'string' ? content : String(content || '');

  const stats = {
    lineBreaksNormalized: countMatches(source, /\r\n?|\u2028|\u2029/g),
    nbspReplaced: countMatches(source, NBSP_CHARS),
    softHyphenRemoved: keepSoftHyphen ? 0 : countMatches(source, SOFT_HYPHEN_CHARS),
    invisibleRemoved: countMatches(source, CONTROL_AND_INVISIBLE_CHARS),
    emojiStripped: 0,
  };

  let text = source
    .replace(/\r\n?|\u2028|\u2029/g, '\n')
    .replace(NBSP_CHARS, ' ');

  if (!keepSoftHyphen) {
    text = text.replace(SOFT_HYPHEN_CHARS, '');
  }

  text = text.replace(CONTROL_AND_INVISIBLE_CHARS, '');

  if (!keepEmoji) {
    const emojiResult = stripEmoji(text);
    text = emojiResult.text;
    stats.emojiStripped = emojiResult.emojiStripped;
  }

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

  const includeToc = normalizeBoolean(
    settings.includeToc ?? settings.toc ?? metadata.includeToc ?? metadata.toc,
    true
  );

  const includeBackCover = normalizeBoolean(
    settings.includeBackCover
    ?? settings.backCover
    ?? metadata.includeBackCover
    ?? metadata.backCover,
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
    includeToc,
    includeBackCover,
    showPageNumbers,
    printBackground,
  };
}
