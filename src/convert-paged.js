import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import {
  readFile,
  writeFile,
  ensureDir,
  getOutputPath,
  getProjectRoot,
  fileExists,
} from './utils/file-utils.js';
import { parseMarkdown, markdownToHtml } from './utils/markdown-parser.js';

const PRINT_PROFILES = {
  'pagedjs-a4': { format: 'A4', css: 'pagedjs-a4.css' },
  'pagedjs-a3': { format: 'A3', css: 'pagedjs-a3.css' },
};

const LAYOUT_PROFILES = new Set(['symmetric', 'asymmetric', 'dashboard']);

function normalizeLayoutProfile(value) {
  if (!value || !LAYOUT_PROFILES.has(value)) {
    return 'symmetric';
  }
  return value;
}

function normalizePrintProfile(value) {
  if (!value || !PRINT_PROFILES[value]) {
    return 'pagedjs-a4';
  }
  return value;
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendClassAttribute(attributes, className) {
  if (!attributes) {
    return ` class="${className}"`;
  }
  const classMatch = attributes.match(/\sclass=(["'])(.*?)\1/);
  if (classMatch) {
    const existing = classMatch[2].split(/\s+/).filter(Boolean);
    const classSet = new Set(existing);
    classSet.add(className);
    const updated = `${classMatch[1]}${Array.from(classSet).join(' ')}${classMatch[1]}`;
    return attributes.replace(classMatch[0], ` class=${updated}`);
  }
  return `${attributes} class="${className}"`;
}

function addClassToTag(html, tagName, className, options = {}) {
  let count = 0;
  const pattern = new RegExp(`<${tagName}([^>]*)>`, 'gi');
  return html.replace(pattern, (match, attributes = '') => {
    count += 1;
    if (options.skipFirst && count === 1) {
      return match;
    }
    const nextAttrs = appendClassAttribute(attributes, className);
    return `<${tagName}${nextAttrs}>`;
  });
}

function applyLogicBasedStyling(html, styleHints = {}) {
  let output = html;
  const avoidTags = Array.isArray(styleHints.avoidBreakSelectors)
    ? styleHints.avoidBreakSelectors.filter((item) => /^[a-z0-9]+$/i.test(item))
    : ['table', 'pre', 'blockquote'];
  for (const tag of avoidTags) {
    output = addClassToTag(output, tag, 'avoid-break');
  }

  let forceTags = Array.isArray(styleHints.forceBreakSelectors)
    ? styleHints.forceBreakSelectors.filter((item) => /^[a-z0-9]+$/i.test(item))
    : [];
  forceTags = Array.from(new Set(forceTags));
  for (const tag of forceTags) {
    output = addClassToTag(output, tag, 'force-break', {
      skipFirst: tag.startsWith('h'),
    });
  }

  return output;
}

function buildStorytellingBlock(storytelling) {
  if (!storytelling || typeof storytelling !== 'object') {
    return '';
  }

  const summary = storytelling.executiveSummary
    ? escapeHtml(storytelling.executiveSummary)
    : '';
  const insights = Array.isArray(storytelling.keyInsights) ? storytelling.keyInsights : [];
  const safeInsights = insights
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  if (!summary && !safeInsights) {
    return '';
  }

  return `
    <section class="ai-insight avoid-break">
      <h2 class="ai-insight__title">AI Insight</h2>
      ${summary ? `<p class="ai-insight__summary">${summary}</p>` : ''}
      ${safeInsights ? `<ul class="ai-insight__list">${safeInsights}</ul>` : ''}
    </section>
  `;
}

function buildCover(metadata) {
  const title = escapeHtml(metadata.title || '');
  const subtitle = escapeHtml(metadata.subtitle || '');
  const author = escapeHtml(metadata.author || '');
  const date = escapeHtml(metadata.date || '');

  if (!title && !subtitle && !author && !date) {
    return '';
  }

  return `
    <header class="report-cover">
      ${title ? `<h1 class="report-title">${title}</h1>` : ''}
      ${subtitle ? `<p class="report-subtitle">${subtitle}</p>` : ''}
      ${(author || date) ? `
        <div class="report-meta">
          ${author ? `<span>${author}</span>` : ''}
          ${date ? `<span>${date}</span>` : ''}
        </div>
      ` : ''}
    </header>
  `;
}

async function resolvePagedScriptPath(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'),
    path.join(projectRoot, 'node_modules', 'pagedjs', 'dist', 'paged.js'),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function buildHtml({ markdown, metadata, layoutProfile, printProfile, theme, artDirection }) {
  const projectRoot = getProjectRoot();
  const baseCssPath = path.join(projectRoot, 'styles', 'print', 'print-base.css');
  const printCssPath = path.join(projectRoot, 'styles', 'print', PRINT_PROFILES[printProfile].css);

  const [baseCss, printCss] = await Promise.all([
    readFile(baseCssPath),
    readFile(printCssPath),
  ]);

  const cover = buildCover(metadata);
  const htmlContent = applyLogicBasedStyling(
    markdownToHtml(markdown),
    artDirection?.styleHints || {}
  );
  const storytellingBlock = buildStorytellingBlock(artDirection?.storytelling);
  const title = escapeHtml(metadata.title || 'Carbon Report');
  const lang = escapeHtml(metadata.language || 'tr');

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
${baseCss}

${printCss}
    </style>
  </head>
  <body class="layout layout--${layoutProfile} theme--${theme} print--${printProfile}">
    <div class="report">
      ${cover}
      <main class="report-content">
        ${storytellingBlock}
        ${htmlContent}
      </main>
    </div>
  </body>
</html>`;
}

async function runPagedPolyfill(page, scriptPath, verbose) {
  if (!scriptPath) {
    return;
  }

  if (verbose) {
    console.log('🧩 Loading Paged.js polyfill...');
  }

  await page.addScriptTag({ path: scriptPath });
  await page.waitForFunction(() => window.PagedPolyfill && window.PagedPolyfill.preview, {
    timeout: 5000,
  });

  await page.evaluate(async () => {
    try {
      const result = window.PagedPolyfill.preview();
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      console.warn('Paged.js preview failed:', error.message);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Convert markdown to PDF using Paged.js + headless Chromium
 * @param {string} inputPath - Path to markdown file
 * @param {string} outputPath - Path to output PDF (optional)
 * @param {object} options - Conversion options
 * @returns {Promise<string>} Path to generated PDF
 */
export async function convertToPaged(inputPath, outputPath = null, options = {}) {
  const {
    layoutProfile,
    printProfile,
    theme = 'white',
    verbose = true,
    title,
    subtitle,
    author,
    date,
    language,
    artDirection = null,
  } = options;

  const resolvedLayout = normalizeLayoutProfile(layoutProfile);
  const resolvedPrint = normalizePrintProfile(printProfile);
  const printConfig = PRINT_PROFILES[resolvedPrint];

  let tempHtmlPath = null;
  try {
    if (verbose) console.log('📄 Reading markdown file...');
    const markdownContent = await readFile(inputPath);

    if (verbose) console.log('🔍 Parsing markdown...');
    const { metadata, content } = parseMarkdown(markdownContent);

    const mergedMetadata = {
      ...metadata,
      title: title || metadata.title,
      subtitle: subtitle || metadata.subtitle,
      author: author || metadata.author,
      date: date || metadata.date,
      language: language || metadata.language,
    };

    if (verbose) console.log('🧱 Building HTML + print CSS...');
    const html = await buildHtml({
      markdown: content,
      metadata: mergedMetadata,
      layoutProfile: resolvedLayout,
      printProfile: resolvedPrint,
      theme,
      artDirection,
    });

    const projectRoot = getProjectRoot();
    const tempDir = path.join(projectRoot, 'output', 'temp');
    await ensureDir(tempDir);

    tempHtmlPath = path.join(tempDir, `paged-${Date.now()}.html`);
    await writeFile(tempHtmlPath, html);

    const finalOutputPath = outputPath || getOutputPath(inputPath, `paged-${resolvedPrint}`);
    await ensureDir(path.dirname(finalOutputPath));

    if (verbose) console.log('🖨️  Rendering PDF with Chromium...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('print');

      const pagedScript = await resolvePagedScriptPath(projectRoot);
      await runPagedPolyfill(page, pagedScript, verbose);

      await page.pdf({
        path: finalOutputPath,
        format: printConfig.format,
        printBackground: true,
        preferCSSPageSize: true,
      });

      await page.close();
    } finally {
      await browser.close();
    }

    if (verbose) console.log(`✅ PDF generated successfully: ${finalOutputPath}`);
    return finalOutputPath;
  } catch (error) {
    console.error('❌ Error converting to PDF with Paged.js:', error.message);
    throw error;
  } finally {
    if (tempHtmlPath) {
      await fs.unlink(tempHtmlPath).catch(() => null);
    }
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  const layoutProfile = process.argv[4];
  const printProfile = process.argv[5];

  if (!inputPath) {
    console.error('Usage: node convert-paged.js <input.md> [output.pdf] [layoutProfile] [printProfile]');
    console.error('Layout profiles: symmetric, asymmetric, dashboard');
    console.error('Print profiles: pagedjs-a4, pagedjs-a3');
    process.exit(1);
  }

  convertToPaged(inputPath, outputPath, {
    layoutProfile,
    printProfile,
    verbose: true,
  })
    .then((output) => {
      console.log(`\n🎉 Success! PDF created at: ${output}`);
    })
    .catch((error) => {
      console.error('\n💥 Conversion failed:', error.message);
      process.exit(1);
    });
}

export default convertToPaged;
