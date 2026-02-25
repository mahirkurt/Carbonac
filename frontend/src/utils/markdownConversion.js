import { lintMarkdown } from './markdownLint';
import { applyLintFixes } from './markdownLintFixes';

const NBSP_PATTERN = /\u00A0/g;
const INVISIBLE_CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00AD]/g;

function normalizeLineEndings(value = '') {
  return String(value || '').replace(/\r\n?/g, '\n');
}

function sanitizeInvisibleCharacters(value = '') {
  return String(value || '')
    .replace(NBSP_PATTERN, ' ')
    .replace(INVISIBLE_CONTROL_PATTERN, '');
}

function trimTrailingWhitespacePerLine(value = '') {
  return String(value || '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');
}

function collapseExcessiveBlankLines(value = '') {
  return String(value || '').replace(/\n{3,}/g, '\n\n');
}

export function normalizeConvertedMarkdown(markdown = '') {
  const source = String(markdown || '');
  if (!source.trim()) {
    return '';
  }

  return collapseExcessiveBlankLines(
    trimTrailingWhitespacePerLine(
      sanitizeInvisibleCharacters(
        normalizeLineEndings(source)
      )
    )
  ).trim();
}

export function enhanceConvertedMarkdown(markdown = '') {
  const normalizedMarkdown = normalizeConvertedMarkdown(markdown);
  if (!normalizedMarkdown) {
    return {
      markdown: '',
      lintIssues: [],
      appliedFixes: [],
      skippedFixes: [],
    };
  }

  const lintIssues = lintMarkdown(normalizedMarkdown);
  const { nextMarkdown, applied, skipped } = applyLintFixes(normalizedMarkdown, lintIssues);

  return {
    markdown: nextMarkdown,
    lintIssues,
    appliedFixes: applied,
    skippedFixes: skipped,
  };
}

export default enhanceConvertedMarkdown;

