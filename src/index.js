/**
 * Carbon Markdown to PDF
 * Main module exports
 */

export { convertToPaged } from './convert-paged.js';
export {
  parseMarkdown,
  markdownToHtml,
  getCarbonTheme,
  extractToc
} from './utils/markdown-parser.js';
export {
  readFile,
  writeFile,
  fileExists,
  getProjectRoot,
  getTemplatePath,
  getOutputPath
} from './utils/file-utils.js';

// AI-powered Carbon Design Advisor
export {
  analyzeDocument,
  analyzeFile,
  askDesignQuestion
} from './ai/carbon-advisor.js';

/**
 * Convert markdown to PDF using the Paged.js pipeline
 * @param {string} inputPath - Path to markdown file
 * @param {object} options - Conversion options
 * @returns {Promise<string|object>} Path(s) to generated PDF(s)
 */
export async function convertMarkdownToPdf(inputPath, options = {}) {
  const {
    outputPath = null,
    layoutProfile = 'symmetric',
    printProfile = 'pagedjs-a4',
    theme = 'white',
  } = options;

  const { convertToPaged } = await import('./convert-paged.js');

  return await convertToPaged(inputPath, outputPath, {
    layoutProfile,
    printProfile,
    theme,
  });
}

export default {
  convertMarkdownToPdf
};
