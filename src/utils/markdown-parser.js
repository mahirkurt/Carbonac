import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';
import { carbonTheme } from '../../styles/carbon/theme.js';
import { applyDirectiveMappings, extractDirectiveComponents } from './directive-mapper.js';

function stripFrontmatter() {
  return (tree) => {
    if (!tree || !Array.isArray(tree.children)) {
      return;
    }
    tree.children = tree.children.filter(
      (node) => node.type !== 'yaml' && node.type !== 'toml'
    );
  };
}

function remarkHeadingIds({ slugger } = {}) {
  return (tree) => {
    const localSlugger = slugger || new GithubSlugger();
    if (typeof localSlugger.reset === 'function') {
      localSlugger.reset();
    }
    visit(tree, 'heading', (node) => {
      const text = toString(node).trim();
      const id = localSlugger.slug(text || 'section');
      const position = node?.position?.start;
      if (!node.data) node.data = {};
      node.data.id = id;
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        id,
      };
      if (position) {
        node.data.hProperties['data-source-line'] = position.line || 1;
        node.data.hProperties['data-source-column'] = position.column || 1;
      }
    });
  };
}

function createMarkdownProcessor({ typography, slugger, includeFrontmatter = false } = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkDirective)
    .use(remarkHeadingIds, { slugger });

  if (typography?.smartypants) {
    const smartypantsOptions = typeof typography.smartypants === 'object'
      ? typography.smartypants
      : typography.smartypantsOptions;
    processor.use(remarkSmartypants, smartypantsOptions || undefined);
  }

  if (!includeFrontmatter) {
    processor.use(stripFrontmatter);
  }

  processor.use(applyDirectiveMappings);

  return processor;
}

function normalizeFrontmatter(frontmatter = {}) {
  const docType = frontmatter.docType || frontmatter.documentType || null;
  const locale = frontmatter.locale || frontmatter.language || 'en-US';
  const defaults = {
    title: 'Untitled Document',
    subtitle: '',
    author: 'Anonymous',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    theme: 'white',
    layoutProfile: 'symmetric',
    printProfile: 'pagedjs-a4',
    locale,
  };

  const metadata = {
    ...defaults,
    ...frontmatter,
  };

  if (docType && !metadata.docType) {
    metadata.docType = docType;
  }
  if (frontmatter.documentType && !metadata.documentType) {
    metadata.documentType = frontmatter.documentType;
  }
  if (!metadata.locale) {
    metadata.locale = locale;
  }
  if (!metadata.language) {
    metadata.language = metadata.locale;
  }

  return metadata;
}

function buildTocFromTree(tree) {
  const toc = [];
  visit(tree, 'heading', (node) => {
    const title = toString(node).trim();
    if (!title) {
      return;
    }
    const id =
      node?.data?.hProperties?.id ||
      node?.data?.id ||
      new GithubSlugger().slug(title);
    toc.push({
      level: node.depth || 1,
      title,
      id,
    });
  });
  return toc;
}

/**
 * Parse markdown file with frontmatter
 * @param {string} markdownContent - Raw markdown content
 * @param {object} options - Parser options
 * @returns {object} Parsed content and metadata
 */
export function parseMarkdown(markdownContent, options = {}) {
  const safeContent = markdownContent || '';
  const { data: frontmatter, content } = matter(safeContent);

  const slugger = new GithubSlugger();
  const processor = createMarkdownProcessor({
    typography: options.typography,
    slugger,
  });
  const tree = processor.parse(safeContent);
  const ast = processor.runSync(tree);
  const toc = buildTocFromTree(ast);
  const components = extractDirectiveComponents(ast);

  return {
    metadata: normalizeFrontmatter(frontmatter),
    content,
    rawContent: safeContent,
    toc,
    ast,
    components,
  };
}

/**
 * Convert markdown to HTML with Carbon styling
 * @param {string} content - Markdown content
 * @param {object} options - Render options
 * @returns {string} HTML content
 */
export function markdownToHtml(content, options = {}) {
  const slugger = new GithubSlugger();
  const processor = createMarkdownProcessor({
    typography: options.typography,
    slugger,
  })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);

  const file = processor.processSync(content || '');
  return String(file);
}

/**
 * Escape special characters for Typst
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeTypst(text) {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\$/g, '\\$')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_');
}

/**
 * Convert markdown to Typst format
 * @param {string} content - Markdown content
 * @returns {string} Typst content
 */
export function markdownToTypst(content) {
  let typstContent = content;

  // First, protect hex color codes by temporarily replacing them
  const hexCodes = [];
  typstContent = typstContent.replace(/(#[0-9a-fA-F]{3,6})/g, (match) => {
    hexCodes.push(match);
    return `__HEX_${hexCodes.length - 1}__`;
  });

  // Headers (now safe to process # as headers)
  typstContent = typstContent.replace(/^######\s+(.+)$/gm, '====== $1');
  typstContent = typstContent.replace(/^#####\s+(.+)$/gm, '===== $1');
  typstContent = typstContent.replace(/^####\s+(.+)$/gm, '==== $1');
  typstContent = typstContent.replace(/^###\s+(.+)$/gm, '=== $1');
  typstContent = typstContent.replace(/^##\s+(.+)$/gm, '== $1');
  typstContent = typstContent.replace(/^#\s+(.+)$/gm, '= $1');

  // Bold-Italic (must be processed first)
  typstContent = typstContent.replace(/\*\*\*(.+?)\*\*\*/g, '*_$1_*');
  typstContent = typstContent.replace(/___(.+?)___/g, '*_$1_*');

  // Bold
  typstContent = typstContent.replace(/\*\*(.+?)\*\*/g, '*$1*');
  typstContent = typstContent.replace(/__(.+?)__/g, '*$1*');

  // Italic
  typstContent = typstContent.replace(/\*(.+?)\*/g, '_$1_');

  // Code blocks
  typstContent = typstContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '```$1\n$2```');

  // Inline code
  typstContent = typstContent.replace(/`([^`]+)`/g, '`$1`');

  // Links
  typstContent = typstContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '#link("$2")[$1]');

  // Lists (preserve as is, Typst understands markdown lists)

  // Blockquotes - convert to Typst quote blocks
  typstContent = typstContent.replace(/^>\s+(.+)$/gm, '#quote[$1]');

  // Restore hex color codes (escape # for Typst)
  typstContent = typstContent.replace(/__HEX_(\d+)__/g, (match, index) => {
    return '\\' + hexCodes[parseInt(index)];
  });

  return typstContent;
}

/**
 * Get Carbon theme colors
 * @param {string} themeName - Theme name (white, g10, g90, g100)
 * @returns {object} Theme colors
 */
export function getCarbonTheme(themeName = 'white') {
  return carbonTheme;
}

/**
 * Extract table of contents from markdown
 * @param {string} content - Markdown content
 * @param {object} options - Parser options
 * @returns {array} Table of contents entries
 */
export function extractToc(content, options = {}) {
  const slugger = new GithubSlugger();
  const processor = createMarkdownProcessor({
    typography: options.typography,
    slugger,
  });
  const tree = processor.parse(content || '');
  const ast = processor.runSync(tree);
  return buildTocFromTree(ast);
}

export default {
  parseMarkdown,
  markdownToHtml,
  markdownToTypst,
  escapeTypst,
  getCarbonTheme,
  extractToc,
};
