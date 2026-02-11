const LONG_PARAGRAPH_WORDS = 120;
const LONG_PARAGRAPH_CHARS = 800;
const DIRECTIVE_RULES = {
  callout: { allow: ['tone', 'title', 'icon'], values: { tone: ['info', 'warning', 'success', 'danger'] } },
  'data-table': { allow: ['caption', 'source', 'columns', 'methodology', 'notes'] },
  chart: {
    allow: [
      'type',
      'variant',
      'caption',
      'question',
      'source',
      'sampleSize',
      'methodology',
      'highlight',
      'notes',
    ],
    values: {
      type: [
        'bar', 'line', 'area', 'donut', 'stacked',
        'scatter', 'bubble', 'radar', 'treemap', 'gauge',
        'heatmap', 'pie', 'histogram', 'boxplot', 'meter',
        'combo', 'lollipop', 'wordcloud', 'alluvial',
      ],
      variant: ['default', 'survey'],
    },
  },
  'code-group': { allow: ['title', 'language', 'filename'] },
  figure: { allow: ['src', 'caption', 'source', 'width'] },
  quote: { allow: ['author', 'title', 'source'] },
  timeline: { allow: ['layout', 'start', 'end'], values: { layout: ['horizontal', 'vertical'] } },
  accordion: { allow: ['variant'], values: { variant: ['default', 'compact'] } },
  marginnote: { allow: ['align'], values: { align: ['left', 'right'] } },
  pattern: {
    allow: [
      'type',
      'title',
      'subtitle',
      'eyebrow',
      'kicker',
      'variant',
      'layout',
      'tone',
      'stat',
      'quote',
      'author',
      'source',
      'caption',
      'cta',
    ],
    values: { tone: ['info', 'warning', 'success', 'danger', 'neutral'] },
  },
};

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

function parseDirectiveAttributes(raw = '') {
  const attributes = {};
  if (!raw) return attributes;
  const regex = /([a-zA-Z0-9_-]+)\s*=\s*(\"[^\"]*\"|'[^']*'|[^\\s\"]+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1];
    let value = match[2] || '';
    if ((value.startsWith('\"') && value.endsWith('\"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    attributes[key] = value;
  }
  return attributes;
}

function lintDirectives(lines, issues) {
  lines.forEach((line, index) => {
    const blockMatch = line.match(/^\\s*:::+\\s*([a-z0-9-]+)\\s*(\\{[^}]*\\})?/i);
    const leafMatch = line.match(/^\\s*:([a-z0-9-]+)\\[[^\\]]*\\]\\s*(\\{[^}]*\\})?/i);
    const match = blockMatch || leafMatch;
    if (!match) {
      return;
    }
    const name = match[1].toLowerCase();
    const rule = DIRECTIVE_RULES[name];
    if (!rule) {
      addIssue(issues, {
        ruleId: 'unknown-directive',
        severity: 'warning',
        message: `Bilinmeyen directive: ${name}.`,
        line: index + 1,
        column: 1,
      });
      return;
    }
    const rawAttrs = match[2] ? match[2].slice(1, -1) : '';
    const attrs = parseDirectiveAttributes(rawAttrs);
    const allowed = new Set(rule.allow || []);
    Object.keys(attrs).forEach((key) => {
      if (!allowed.has(key)) {
        addIssue(issues, {
          ruleId: 'directive-attribute',
          severity: 'info',
          message: `Directive '${name}' için desteklenmeyen attribute: ${key}.`,
          line: index + 1,
          column: 1,
        });
        return;
      }
      const allowedValues = rule.values?.[key];
      if (allowedValues && !allowedValues.includes(attrs[key])) {
        addIssue(issues, {
          ruleId: 'directive-attribute-value',
          severity: 'info',
          message: `Directive '${name}' için geçersiz değer: ${key}=${attrs[key]}.`,
          line: index + 1,
          column: 1,
        });
      }
    });
  });
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
        message: 'Boş başlık algılandı.',
        line: index + 1,
        column: 1,
      });
    }

    if (lastHeadingLevel && level > lastHeadingLevel + 1) {
      addIssue(issues, {
        ruleId: 'heading-order',
        severity: 'warning',
        message: 'Başlık hiyerarşisi atlandı (ör: H2 -> H4).',
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
          message: 'Aynı başlık tekrarı algılandı.',
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
        message: 'Uzun paragraf algılandı (bölmeyi düşünün).',
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

  lintDirectives(lines, issues);

  return issues;
}

export default lintMarkdown;
