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
import { reviewQaIssues } from './ai/qa-reviewer.js';

const PRINT_PROFILES = {
  'pagedjs-a4': { format: 'A4', css: 'pagedjs-a4.css' },
  'pagedjs-a3': { format: 'A3', css: 'pagedjs-a3.css' },
};

const LAYOUT_PROFILES = new Set(['symmetric', 'asymmetric', 'dashboard']);
const QA_ENABLED = process.env.PDF_QA_ENABLED !== 'false';
const QA_MAX_ITERATIONS = Math.max(0, Number(process.env.PDF_QA_MAX_ITERATIONS || 2));
const QA_BOTTOM_GAP = Number(process.env.PDF_QA_BOTTOM_GAP || 72);
const QA_TOP_GAP = Number(process.env.PDF_QA_TOP_GAP || 32);

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

async function capturePreview(page, options = {}) {
  if (!options.screenshotPath) {
    return;
  }
  const selector = options.selector || '.pagedjs_page';
  const clip = await page.evaluate((targetSelector) => {
    const pageEl = document.querySelector(targetSelector);
    if (!pageEl) return null;
    const rect = pageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }, selector);

  await page.screenshot({
    path: options.screenshotPath,
    type: 'png',
    fullPage: !clip,
    clip: clip || undefined,
  });
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

function splitHtmlIntoSections(html) {
  if (!html) return [];
  const parts = html.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)/gi);
  const sections = [];
  let buffer = '';
  for (const part of parts) {
    if (!part) continue;
    if (/^<h[1-6]/i.test(part.trim())) {
      if (buffer.trim()) {
        sections.push(buffer);
      }
      buffer = part;
    } else {
      buffer += part;
    }
  }
  if (buffer.trim()) {
    sections.push(buffer);
  }
  return sections.length ? sections : [html];
}

function normalizeComponentType(type) {
  if (typeof type !== 'string') return 'richtext';
  const normalized = type.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return normalized || 'richtext';
}

function normalizeClassName(value) {
  if (typeof value !== 'string') return '';
  const tokens = value
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9-_]/gi, ''))
    .filter(Boolean);
  return tokens.join(' ');
}

function resolveLayoutProps(layoutProps = {}) {
  let colSpan = Number(layoutProps.colSpan);
  if (!Number.isFinite(colSpan)) colSpan = 16;
  colSpan = Math.max(1, Math.min(16, Math.round(colSpan)));
  let offset = Number(layoutProps.offset);
  if (!Number.isFinite(offset)) offset = 0;
  offset = Math.max(0, Math.min(15, Math.round(offset)));
  if (offset + colSpan > 16) {
    colSpan = Math.max(1, 16 - offset);
  }
  return { colSpan, offset };
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

function buildLayoutGridHtml({ htmlContent, artDirection, layoutProfile }) {
  const components = Array.isArray(artDirection?.components) ? artDirection.components : [];
  if (!components.length) {
    return { html: htmlContent, usesStorytelling: false };
  }

  const sections = splitHtmlIntoSections(htmlContent);
  let sectionIndex = 0;
  let usesStorytelling = false;
  const gridSystem = normalizeLayoutProfile(artDirection?.gridSystem || layoutProfile);
  const layoutBlocks = components
    .map((component) => {
      const type = normalizeComponentType(component?.type);
      let body = '';
      if (type === 'highlightbox') {
        body = buildStorytellingBlock(artDirection?.storytelling);
        if (body) {
          usesStorytelling = true;
        }
      }
      if (!body) {
        body = sections[sectionIndex] || '';
        if (body) {
          sectionIndex += 1;
        }
      }
      if (!body) {
        return '';
      }
      const { colSpan, offset } = resolveLayoutProps(component?.layoutProps);
      const gridColumn = colSpan === 16 && offset === 0
        ? '1 / -1'
        : `${offset + 1} / span ${colSpan}`;
      const classNames = [
        'layout-component',
        `layout-component--${type}`,
      ];
      const extraClass = normalizeClassName(component?.className);
      if (extraClass) {
        classNames.push(extraClass);
      }
      if (component?.styleOverrides?.theme) {
        classNames.push(`theme--${component.styleOverrides.theme}`);
      }
      return `
        <div class="${classNames.join(' ')}" style="grid-column: ${gridColumn};" data-component-type="${type}">
          ${body}
        </div>
      `;
    })
    .filter(Boolean);

  const remaining = sections.slice(sectionIndex).join('');
  if (remaining.trim()) {
    layoutBlocks.push(`
      <div class="layout-component layout-component--auto" style="grid-column: 1 / -1;">
        ${remaining}
      </div>
    `);
  }

  if (!layoutBlocks.length) {
    return { html: htmlContent, usesStorytelling };
  }

  return {
    html: `
      <div class="layout-grid" data-grid-system="${gridSystem}">
        ${layoutBlocks.join('\n')}
      </div>
    `,
    usesStorytelling,
  };
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
  const layoutResult = buildLayoutGridHtml({
    htmlContent,
    artDirection,
    layoutProfile,
  });
  const storytellingBlock = layoutResult.usesStorytelling
    ? ''
    : buildStorytellingBlock(artDirection?.storytelling);
  const mainContent = `${storytellingBlock}${layoutResult.html}`;
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
        ${mainContent}
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

async function annotateQaTargets(page) {
  await page.evaluate(() => {
    const root = document.querySelector('.report-content') || document.body;
    if (!root) return;
    let counter = 0;
    const targets = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,table,blockquote,pre,a,small,caption');
    targets.forEach((element) => {
      if (element.dataset.qaId) {
        return;
      }
      counter += 1;
      element.dataset.qaId = `qa-${counter}`;
    });
  });
}

async function runStaticLint(page, options = {}) {
  const bottomGap = Number.isFinite(options.bottomGap) ? options.bottomGap : QA_BOTTOM_GAP;
  const topGap = Number.isFinite(options.topGap) ? options.topGap : QA_TOP_GAP;
  return await page.evaluate(
    ({ bottomGap, topGap }) => {
      const issues = [];
      const fixes = [];
      const issueKeys = new Set();
      const fixKeys = new Set();
      const pages = document.querySelectorAll('.pagedjs_page');
      pages.forEach((page, pageIndex) => {
        const pageRect = page.getBoundingClientRect();
        const pageNumber = Number(page.dataset.pageNumber) || pageIndex + 1;
        const content = page.querySelector('.pagedjs_page_content') || page;
        const elements = content.querySelectorAll('table,h2,h3,p,li,blockquote,pre');
        elements.forEach((element) => {
          const qaId = element.getAttribute('data-qa-id');
          if (!qaId) return;
          const rect = element.getBoundingClientRect();
          const bottomDistance = pageRect.bottom - rect.bottom;
          const topDistance = rect.top - pageRect.top;
          const tag = element.tagName.toLowerCase();
          let type = null;
          let recommendation = null;
          let severity = 'medium';

          if (rect.bottom > pageRect.bottom + 1) {
            type = 'overflow';
            recommendation = 'force-break';
            severity = 'high';
          } else if (tag === 'table' && bottomDistance < bottomGap) {
            type = 'table-split';
            recommendation = 'avoid-break';
            severity = 'high';
          } else if ((tag === 'h2' || tag === 'h3') && bottomDistance < bottomGap) {
            type = 'heading-near-bottom';
            recommendation = 'force-break';
          } else if ((tag === 'p' || tag === 'li') && bottomDistance < 20) {
            type = 'orphan';
            recommendation = 'avoid-break';
          } else if ((tag === 'p' || tag === 'li') && topDistance < topGap && rect.height < 28) {
            type = 'widow';
            recommendation = 'avoid-break';
          }

          if (!type || !recommendation) {
            return;
          }

          const issueKey = `${type}:${qaId}:${pageNumber}`;
          if (!issueKeys.has(issueKey)) {
            issueKeys.add(issueKey);
            issues.push({
              type,
              severity,
              page: pageNumber,
              qaId,
              recommendation,
            });
          }

          const fixKey = `${recommendation}:${qaId}`;
          if (!fixKeys.has(fixKey)) {
            fixKeys.add(fixKey);
            fixes.push({ qaId, action: recommendation });
          }
        });
      });

      return { issues, fixes };
    },
    { bottomGap, topGap }
  );
}

async function applyQaFixes(page, fixes = []) {
  if (!fixes.length) return;
  await page.evaluate((fixes) => {
    const root = document.querySelector('.report-content') || document.body;
    if (!root) return;
    fixes.forEach((fix) => {
      const target = root.querySelector(`[data-qa-id="${fix.qaId}"]`);
      if (target) {
        target.classList.add(fix.action);
      }
    });
  }, fixes);
}

async function runAccessibilityLint(page) {
  return await page.evaluate(() => {
    const issues = [];
    const root = document.querySelector('.report-content') || document.body;
    if (!root) return issues;

    const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = Number(heading.tagName.slice(1));
      if (lastLevel && level > lastLevel + 1) {
        issues.push({
          type: 'heading-order',
          severity: 'low',
          qaId: heading.dataset.qaId || null,
        });
      }
      lastLevel = level;
    });

    const links = root.querySelectorAll('a');
    links.forEach((link) => {
      if (!link.getAttribute('href')) {
        issues.push({
          type: 'link-missing',
          severity: 'low',
          qaId: link.dataset.qaId || null,
        });
      }
    });

    const textNodes = root.querySelectorAll('p,li,small,caption');
    textNodes.forEach((node) => {
      const fontSize = Number.parseFloat(getComputedStyle(node).fontSize || '0');
      if (fontSize && fontSize < 10) {
        issues.push({
          type: 'min-font-size',
          severity: 'medium',
          qaId: node.dataset.qaId || null,
        });
      }
    });

    return issues;
  });
}

async function rerunPagedPreview(page) {
  await page.evaluate(async () => {
    if (window.PagedPolyfill && window.PagedPolyfill.preview) {
      const result = window.PagedPolyfill.preview();
      if (result && typeof result.then === 'function') {
        await result;
      }
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
}

async function runQaHarness(page, options = {}) {
  const enabled = options.enabled !== false;
  if (!enabled || QA_MAX_ITERATIONS <= 0) {
    return null;
  }

  const report = {
    iterations: 0,
    issues: [],
    appliedFixes: [],
    screenshots: [],
    accessibilityIssues: [],
    generatedAt: new Date().toISOString(),
  };

  if (options.screenshotPath) {
    await page.screenshot({ path: options.screenshotPath, fullPage: true });
    report.screenshots.push(options.screenshotPath);
  }

  for (let iteration = 0; iteration < QA_MAX_ITERATIONS; iteration += 1) {
    const lint = await runStaticLint(page, options);
    if (!lint.issues.length) {
      break;
    }

    report.issues.push(...lint.issues);
    if (!lint.fixes.length) {
      break;
    }

    await applyQaFixes(page, lint.fixes);
    report.appliedFixes.push(...lint.fixes);
    report.iterations += 1;
    await rerunPagedPreview(page);
  }

  report.accessibilityIssues = await runAccessibilityLint(page);

  if (options.useGemini !== false) {
    try {
      const aiReview = await reviewQaIssues({ issues: report.issues });
      if (aiReview) {
        report.aiReview = aiReview;
      }
    } catch (error) {
      report.aiReviewError = error.message;
    }
  }

  return report;
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
    qa = {},
    preview = {},
    returnResult = false,
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

      await annotateQaTargets(page);
      const pagedScript = await resolvePagedScriptPath(projectRoot);
      await runPagedPolyfill(page, pagedScript, verbose);

      await capturePreview(page, preview);

      const shouldCapture = qa.captureScreenshots !== false;
      const screenshotPath = qa.screenshotPath || (
        shouldCapture
          ? path.join(
              path.dirname(finalOutputPath),
              `${path.basename(finalOutputPath, '.pdf')}-qa.png`
            )
          : null
      );
      const qaReport = await runQaHarness(page, {
        enabled: qa.enabled ?? QA_ENABLED,
        bottomGap: qa.bottomGap,
        topGap: qa.topGap,
        useGemini: qa.useGemini,
        screenshotPath,
      });

      await page.pdf({
        path: finalOutputPath,
        format: printConfig.format,
        printBackground: true,
        preferCSSPageSize: true,
      });

      await page.close();
      if (returnResult) {
        return { outputPath: finalOutputPath, qaReport };
      }
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
