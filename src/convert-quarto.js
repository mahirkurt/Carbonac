import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import Mustache from 'mustache';
import {
  readFile,
  writeFile,
  getTemplatePath,
  getOutputPath,
  ensureDir,
  getProjectRoot
} from './utils/file-utils.js';
import {
  parseMarkdown
} from './utils/markdown-parser.js';

const execAsync = promisify(exec);

/**
 * Convert markdown to PDF using Quarto with Carbon Design System
 * @param {string} inputPath - Path to markdown file
 * @param {string} outputPath - Path to output PDF (optional)
 * @param {object} options - Conversion options
 * @param {string} options.template - Template filename (default: 'carbon-advanced.qmd')
 * @param {boolean} options.verbose - Verbose output (default: true)
 * @returns {Promise<string>} Path to generated PDF
 */
export async function convertToQuarto(inputPath, outputPath = null, options = {}) {
  try {
    const {
      template = 'carbon-advanced.qmd',
      verbose = true
    } = options;

    if (verbose) console.log('📄 Reading markdown file...');
    const markdownContent = await readFile(inputPath);

    if (verbose) console.log('🔍 Parsing markdown...');
    const { metadata, content } = parseMarkdown(markdownContent);

    if (verbose) console.log(`📋 Loading Carbon template: ${template}...`);
    const templatePath = getTemplatePath('quarto', template);
    let templateContent = await readFile(templatePath);

    if (verbose) console.log('✨ Applying Carbon Design System styling...');
    // Replace template variables (preserve markdown/LaTeX syntax)
    Mustache.escape = (text) => text; // Disable HTML escaping
    const renderedContent = Mustache.render(templateContent, {
      title: metadata.title || 'Untitled',
      subtitle: metadata.subtitle || '',
      author: metadata.author || 'Anonymous',
      date: metadata.date || new Date().toLocaleDateString(),
      content: content
    });

    // Create temporary quarto file
    const projectRoot = getProjectRoot();
    const tempDir = path.join(projectRoot, 'output', 'temp');
    await ensureDir(tempDir);

    const tempQmdPath = path.join(tempDir, 'temp.qmd');
    await writeFile(tempQmdPath, renderedContent);

    // Determine output path
    if (!outputPath) {
      const inputFilename = path.basename(inputPath, path.extname(inputPath));
      const templateName = template.replace('.qmd', '').replace('carbon-', '');
      const outputFilename = `${inputFilename}-quarto-${templateName}.pdf`;
      outputPath = path.join(projectRoot, 'output', outputFilename);
    }
    await ensureDir(path.dirname(outputPath));

    if (verbose) console.log('🚀 Rendering with Quarto...');

    // Quarto renders to the same directory as the input file
    // We'll render first, then move the PDF
    const { stdout, stderr } = await execAsync(
      `quarto render "${tempQmdPath}" --to pdf`,
      { cwd: tempDir }
    );

    if (stderr && !stderr.includes('WARNING') && verbose) {
      console.warn('⚠️  Quarto warnings:', stderr);
    }

    // Move the generated PDF to the desired location
    const tempPdfPath = path.join(tempDir, 'temp.pdf');
    const moveCommand = process.platform === 'win32' ? 'move' : 'mv';
    await execAsync(`${moveCommand} "${tempPdfPath}" "${outputPath}"`);

    if (verbose) console.log(`✅ PDF generated successfully: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('❌ Error converting to PDF with Quarto:', error.message);
    throw error;
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  const template = process.argv[4];

  if (!inputPath) {
    console.error('Usage: node convert-quarto.js <input.md> [output.pdf] [template.qmd]');
    console.error('Templates: carbon-template.qmd (basic), carbon-advanced.qmd (full typography), carbon-colors.qmd (color system)');
    process.exit(1);
  }

  convertToQuarto(inputPath, outputPath, { template, verbose: true })
    .then(output => {
      console.log(`\n🎉 Success! PDF created at: ${output}`);
    })
    .catch(error => {
      console.error('\n💥 Conversion failed:', error.message);
      process.exit(1);
    });
}

export default convertToQuarto;
