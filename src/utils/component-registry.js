const COMPONENT_REGISTRY = {
  HighlightBox: {
    tag: 'aside',
    className: 'component component--highlight-box',
    printOnly: false,
    screenOnly: false,
  },
  DataTable: {
    tag: 'figure',
    className: 'component component--data-table',
    printOnly: false,
    screenOnly: false,
  },
  CarbonChart: {
    tag: 'figure',
    className: 'component component--chart',
    printOnly: false,
    screenOnly: false,
  },
  CodeGroup: {
    tag: 'section',
    className: 'component component--code-group',
    printOnly: false,
    screenOnly: false,
  },
  Figure: {
    tag: 'figure',
    className: 'component component--figure',
    printOnly: false,
    screenOnly: false,
  },
  Quote: {
    tag: 'blockquote',
    className: 'component component--quote',
    printOnly: false,
    screenOnly: false,
  },
  Timeline: {
    tag: 'section',
    className: 'component component--timeline',
    printOnly: false,
    screenOnly: false,
  },
  Accordion: {
    tag: 'section',
    className: 'component component--accordion',
    printOnly: false,
    screenOnly: false,
  },
  MarginNote: {
    tag: 'aside',
    className: 'component component--marginnote',
    printOnly: true,
    screenOnly: false,
  },
  PatternBlock: {
    tag: 'section',
    className: 'component component--pattern',
    printOnly: false,
    screenOnly: false,
  },
  RichText: {
    tag: 'section',
    className: 'component component--richtext',
    printOnly: false,
    screenOnly: false,
  },
};

function resolveComponent(type) {
  if (!type || typeof type !== 'string') {
    return COMPONENT_REGISTRY.RichText;
  }
  return COMPONENT_REGISTRY[type] || COMPONENT_REGISTRY.RichText;
}

function normalizeComponentNode(node = {}) {
  return {
    id: node.id || '',
    type: node.type || 'RichText',
    props: node.props || {},
    layoutProps: node.layoutProps || null,
    styleOverrides: node.styleOverrides || null,
    sourceMap: node.sourceMap || null,
    printOnly: Boolean(node.printOnly),
    screenOnly: Boolean(node.screenOnly),
    className: node.className || '',
  };
}

function buildComponentHtml(node) {
  const normalized = normalizeComponentNode(node);
  const definition = resolveComponent(normalized.type);
  const classNames = [definition.className];
  if (normalized.className) {
    classNames.push(normalized.className);
  }
  if (normalized.printOnly || definition.printOnly) {
    classNames.push('print-only');
  }
  if (normalized.screenOnly || definition.screenOnly) {
    classNames.push('screen-only');
  }
  const tag = definition.tag || 'div';
  const content = normalized.props?.content || '';
  return `<${tag} class="${classNames.join(' ')}" data-component-type="${normalized.type}">${content}</${tag}>`;
}

export { COMPONENT_REGISTRY, resolveComponent, normalizeComponentNode, buildComponentHtml };
