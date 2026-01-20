const LONG_PARAGRAPH_WORDS = 120;
const LONG_PARAGRAPH_CHARS = 800;

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

export function buildLintCacheKey(content = '') {
  return `${content.length}-${hashString(content)}`;
}

function addIssue(issues, issue) {
  issues.push({
    ruleId: issue.ruleId,
    severity: issue.severity || 'warning',
    message: issue.message,
    line: issue.line || 1,
    column: issue.column || 1,
  });
}

function normalizeHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function lintMarkdown(content = '') {
  const issues = [];
  if (!content || !content.trim()) {
    return issues;
  }

  const lines = content.split('\n');
  let lastHeadingLevel = 0;
  const headingMap = new Map();

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s*(.*)$/);
    if (!match) {
      return;
    }

    const level = match[1].length;
    const text = match[2] || '';
    const trimmed = text.trim();

    if (!trimmed) {
      addIssue(issues, {
        ruleId: 'empty-heading',
        severity: 'warning',
        message: 'Bos baslik algilandi.',
        line: index + 1,
        column: 1,
      });
    }

    if (lastHeadingLevel && level > lastHeadingLevel + 1) {
      addIssue(issues, {
        ruleId: 'heading-order',
        severity: 'warning',
        message: 'Baslik hiyerarsisi atlandi (or: H2 -> H4).',
        line: index + 1,
        column: 1,
      });
    }

    const normalized = normalizeHeading(trimmed);
    if (normalized) {
      if (headingMap.has(normalized)) {
        addIssue(issues, {
          ruleId: 'duplicate-heading',
          severity: 'info',
          message: 'Ayni baslik tekrari algilandi.',
          line: index + 1,
          column: 1,
        });
      } else {
        headingMap.set(normalized, index + 1);
      }
    }

    lastHeadingLevel = level;
  });

  let paragraphLines = [];
  let paragraphStart = 0;
  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const paragraph = paragraphLines.join(' ').trim();
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length >= LONG_PARAGRAPH_WORDS || paragraph.length >= LONG_PARAGRAPH_CHARS) {
      addIssue(issues, {
        ruleId: 'long-paragraph',
        severity: 'info',
        message: 'Uzun paragraf algilandi (bolmeyi dusunun).',
        line: paragraphStart + 1,
        column: 1,
      });
    }
    paragraphLines = [];
    paragraphStart = 0;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const isHeading = /^#{1,6}\s+/.test(trimmed);
    if (!trimmed || isHeading) {
      flushParagraph();
      return;
    }
    if (!paragraphLines.length) {
      paragraphStart = index;
    }
    paragraphLines.push(trimmed);
  });
  flushParagraph();

  return issues;
}

export default lintMarkdown;
