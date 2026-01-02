import { marked } from 'marked';
import matter from 'gray-matter';
import { carbonTheme } from '../../styles/carbon/theme.js';

/**
 * Parse markdown file with frontmatter
 * @param {string} markdownContent - Raw markdown content
 * @returns {object} Parsed content and metadata
 */
export function parseMarkdown(markdownContent) {
  const { data: frontmatter, content } = matter(markdownContent);

  // Default metadata
  const metadata = {
    title: frontmatter.title || 'Untitled Document',
    subtitle: frontmatter.subtitle || '',
    author: frontmatter.author || 'Anonymous',
    date: frontmatter.date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    theme: frontmatter.theme || 'white',
    ...frontmatter
  };

  return {
    metadata,
    content,
    rawContent: markdownContent
  };
}

/**
 * Convert markdown to HTML with Carbon styling
 * @param {string} content - Markdown content
 * @returns {string} HTML content
 */
export function markdownToHtml(content) {
  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  });

  return marked.parse(content);
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
 * @returns {array} Table of contents entries
 */
export function extractToc(content) {
  const toc = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headerRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2];
    const id = title.toLowerCase().replace(/[^\w]+/g, '-');

    toc.push({
      level,
      title,
      id
    });
  }

  return toc;
}

export default {
  parseMarkdown,
  markdownToHtml,
  markdownToTypst,
  escapeTypst,
  getCarbonTheme,
  extractToc
};
