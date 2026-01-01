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
 * @returns {Promise<string>} Path to generated PDF
 */
export async function convertToQuarto(inputPath, outputPath = null) {
  try {
    console.log('📄 Reading markdown file...');
    const markdownContent = await readFile(inputPath);

    console.log('🔍 Parsing markdown...');
    const { metadata, content } = parseMarkdown(markdownContent);

    console.log('📋 Loading Carbon template...');
    const templatePath = getTemplatePath('quarto', 'carbon-template.qmd');
    let template = await readFile(templatePath);

    console.log('✨ Applying Carbon Design System styling...');
    // Replace template variables (preserve markdown/LaTeX syntax)
    Mustache.escape = (text) => text; // Disable HTML escaping
    const renderedContent = Mustache.render(template, {
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
    const finalOutputPath = outputPath || getOutputPath(inputPath, 'quarto');
    await ensureDir(path.dirname(finalOutputPath));

    console.log('🚀 Rendering with Quarto...');

    // Quarto renders to the same directory as the input file
    // We'll render first, then move the PDF
    const { stdout, stderr } = await execAsync(
      `quarto render "${tempQmdPath}" --to pdf`,
      { cwd: tempDir }
    );

    if (stderr && !stderr.includes('WARNING')) {
      console.warn('⚠️  Quarto warnings:', stderr);
    }

    // Move the generated PDF to the desired location
    const tempPdfPath = path.join(tempDir, 'temp.pdf');
    const moveCommand = process.platform === 'win32' ? 'move' : 'mv';
    await execAsync(`${moveCommand} "${tempPdfPath}" "${finalOutputPath}"`);

    console.log(`✅ PDF generated successfully: ${finalOutputPath}`);
    return finalOutputPath;

  } catch (error) {
    console.error('❌ Error converting to PDF with Quarto:', error.message);
    throw error;
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath) {
    console.error('Usage: node convert-quarto.js <input.md> [output.pdf]');
    process.exit(1);
  }

  convertToQuarto(inputPath, outputPath)
    .then(output => {
      console.log(`\n🎉 Success! PDF created at: ${output}`);
    })
    .catch(error => {
      console.error('\n💥 Conversion failed:', error.message);
      process.exit(1);
    });
}

export default convertToQuarto;
