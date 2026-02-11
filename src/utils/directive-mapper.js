import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';

const DIRECTIVE_DEFS = {
  callout: {
    component: 'HighlightBox',
    tag: 'aside',
    className: 'directive directive--callout',
    allowlist: ['tone', 'title', 'icon'],
    defaults: { tone: 'info' },
    toneValues: ['info', 'warning', 'success', 'danger'],
  },
  'data-table': {
    component: 'DataTable',
    tag: 'figure',
    className: 'directive directive--data-table',
    allowlist: ['caption', 'source', 'columns', 'methodology', 'notes'],
  },
  chart: {
    component: 'CarbonChart',
    tag: 'figure',
    className: 'directive directive--chart',
    allowlist: [
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
    typeValues: [
      'bar', 'line', 'area', 'donut', 'stacked',
      'scatter', 'bubble', 'radar', 'treemap', 'gauge',
      'heatmap', 'pie', 'histogram', 'boxplot', 'meter',
      'combo', 'lollipop', 'wordcloud', 'alluvial',
    ],
  },
  'code-group': {
    component: 'CodeGroup',
    tag: 'section',
    className: 'directive directive--code-group',
    allowlist: ['title', 'language', 'filename'],
  },
  figure: {
    component: 'Figure',
    tag: 'figure',
    className: 'directive directive--figure',
    allowlist: ['src', 'caption', 'source', 'width'],
  },
  quote: {
    component: 'Quote',
    tag: 'blockquote',
    className: 'directive directive--quote',
    allowlist: ['author', 'title', 'source'],
  },
  timeline: {
    component: 'Timeline',
    tag: 'section',
    className: 'directive directive--timeline',
    allowlist: ['layout', 'start', 'end'],
    layoutValues: ['horizontal', 'vertical'],
  },
  accordion: {
    component: 'Accordion',
    tag: 'section',
    className: 'directive directive--accordion',
    allowlist: ['variant'],
    variantValues: ['default', 'compact'],
  },
  marginnote: {
    component: 'MarginNote',
    tag: 'span',
    className: 'directive directive--marginnote',
    allowlist: ['align'],
    alignValues: ['left', 'right'],
  },
  pattern: {
    component: 'PatternBlock',
    tag: 'section',
    className: 'pattern directive directive--pattern',
    allowlist: [
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
    typeClassPrefix: 'pattern--',
  },
};

function normalizeAttributes(attributes = {}, def = {}) {
  const safeAttributes = {};
  const allowlist = new Set(def.allowlist || []);
  for (const [key, value] of Object.entries(attributes || {})) {
    if (!allowlist.has(key)) {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    safeAttributes[key] = String(value);
  }

  if (def.defaults) {
    for (const [key, value] of Object.entries(def.defaults)) {
      if (!safeAttributes[key]) {
        safeAttributes[key] = value;
      }
    }
  }

  return safeAttributes;
}

function buildClassName(def, attrs) {
  const tokens = [def.className, 'directive--print'];
  if (attrs.tone) {
    tokens.push(`tone-${attrs.tone}`);
  }
  if (attrs.align) {
    tokens.push(`align-${attrs.align}`);
  }
  if (attrs.layout) {
    tokens.push(`layout-${attrs.layout}`);
  }
  if (attrs.variant) {
    tokens.push(`variant-${attrs.variant}`);
  }
  if (def.typeClassPrefix && attrs.type) {
    const normalized = String(attrs.type)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (normalized) {
      tokens.push(`${def.typeClassPrefix}${normalized}`);
    }
  }
  return tokens.filter(Boolean).join(' ');
}

function getDirectiveName(node) {
  return node?.name ? String(node.name).trim().toLowerCase() : '';
}

function getDirectiveContent(node) {
  if (!node) return '';
  return toString(node).trim();
}

function buildComponentId(slugger, name, attrs, content) {
  const label = attrs.title || attrs.caption || content || name || 'directive';
  return slugger.slug(`${name}-${label}`);
}

function buildSourceMap(node) {
  const start = node?.position?.start;
  if (!start) return null;
  return { line: start.line || 1, column: start.column || 1 };
}

function buildMetaString(attrs) {
  const parts = [];
  if (attrs.sampleSize) {
    parts.push(`Sample: ${attrs.sampleSize}`);
  }
  if (attrs.methodology) {
    parts.push(`Method: ${attrs.methodology}`);
  }
  if (attrs.source) {
    parts.push(`Source: ${attrs.source}`);
  }
  if (attrs.notes) {
    parts.push(`Notes: ${attrs.notes}`);
  }
  return parts.join('\n');
}

function applyDirectiveMappings() {
  return (tree) => {
    visit(tree, ['containerDirective', 'leafDirective', 'textDirective'], (node) => {
      const name = getDirectiveName(node);
      const def = DIRECTIVE_DEFS[name];
      if (!def) {
        return;
      }

      const attrs = normalizeAttributes(node.attributes || {}, def);
      const className = buildClassName(def, attrs);
      const sourceMap = buildSourceMap(node);

      node.data ||= {};
      node.data.hName = def.tag;
      const hProperties = {
        ...attrs,
        className,
        'data-directive': name,
        'data-component': def.component,
        'data-print-friendly': 'true',
      };
      if (name === 'pattern' && attrs.type) {
        hProperties['data-pattern-type'] = attrs.type;
        delete hProperties.type;
      }
      node.data.hProperties = hProperties;
      if (sourceMap) {
        node.data.hProperties['data-source-line'] = sourceMap.line;
        node.data.hProperties['data-source-column'] = sourceMap.column;
      }

      if (def.tag === 'figure') {
        const caption = attrs.caption || attrs.question || '';
        if (caption) {
          node.data.hProperties['data-caption'] = caption;
        }
        if (attrs.sampleSize) {
          node.data.hProperties['data-sample-size'] = attrs.sampleSize;
        }
        if (attrs.methodology) {
          node.data.hProperties['data-methodology'] = attrs.methodology;
        }
        if (attrs.source) {
          node.data.hProperties['data-source'] = attrs.source;
        }
        if (attrs.highlight) {
          node.data.hProperties['data-highlight'] = attrs.highlight;
        }
        if (attrs.notes) {
          node.data.hProperties['data-notes'] = attrs.notes;
        }
        const meta = buildMetaString(attrs);
        if (meta) {
          node.data.hProperties['data-meta'] = meta;
        }
      }
    });
  };
}

function extractDirectiveComponents(tree) {
  const components = [];
  const slugger = new GithubSlugger();
  slugger.reset();

  visit(tree, ['containerDirective', 'leafDirective', 'textDirective'], (node) => {
    const name = getDirectiveName(node);
    const def = DIRECTIVE_DEFS[name];
    if (!def) {
      return;
    }

    const attrs = normalizeAttributes(node.attributes || {}, def);
    const content = getDirectiveContent(node);
    const id = buildComponentId(slugger, name, attrs, content);

    components.push({
      id,
      type: def.component,
      props: {
        ...attrs,
        content: content || null,
      },
      sourceMap: buildSourceMap(node),
    });
  });

  return components;
}

export {
  DIRECTIVE_DEFS,
  applyDirectiveMappings,
  extractDirectiveComponents,
  normalizeAttributes,
};
