import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { getProjectRoot } from './file-utils.js';

function normalizeKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePatternKeywords(value) {
  const tags = normalizeKeywords(value);
  return tags.map((tag) => (
    tag.startsWith('pattern:') ? tag : `pattern:${tag}`
  ));
}

function normalizeBoolean(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
}

async function resolveBuildInfo(options = {}) {
  const build = options.build || {};
  const buildSha =
    build.sha ||
    options.buildSha ||
    process.env.BUILD_SHA ||
    process.env.GITHUB_SHA ||
    '';
  const buildDate =
    build.date ||
    options.buildDate ||
    process.env.BUILD_DATE ||
    process.env.GITHUB_RUN_STARTED_AT ||
    new Date().toISOString();
  let buildVersion =
    build.version ||
    options.buildVersion ||
    process.env.BUILD_VERSION ||
    process.env.npm_package_version ||
    '';
  if (!buildVersion) {
    try {
      const packagePath = path.join(getProjectRoot(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      buildVersion = packageJson?.version || '';
    } catch {
      buildVersion = '';
    }
  }

  const shortSha = buildSha ? buildSha.slice(0, 7) : '';
  const keywords = [
    buildVersion ? `build-version:${buildVersion}` : null,
    buildSha ? `build-sha:${buildSha}` : null,
    buildDate ? `build-date:${buildDate}` : null,
  ].filter(Boolean);
  const summaryParts = [
    buildVersion ? `v${buildVersion}` : null,
    shortSha ? `sha:${shortSha}` : null,
    buildDate ? `date:${buildDate}` : null,
  ].filter(Boolean);

  return {
    version: buildVersion,
    sha: buildSha,
    shortSha,
    date: buildDate,
    keywords,
    summary: summaryParts.join(' '),
  };
}

async function applyMetadata(pdfDoc, metadata = {}, options = {}) {
  const buildInfo = options.buildInfo || await resolveBuildInfo(options);
  const buildSuffix = buildInfo.summary ? ` (${buildInfo.summary})` : '';
  const title = metadata.title || options.title || 'Carbon Report';
  const author = metadata.author || options.author || 'Carbonac';
  const subject = metadata.subject || metadata.subtitle || options.subject || '';
  const producer = options.producer || `Carbonac PDF Engine${buildSuffix}`;
  const creator = options.creator || `Carbonac${buildSuffix}`;

  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  if (subject) {
    pdfDoc.setSubject(subject);
  }
  pdfDoc.setProducer(producer);
  pdfDoc.setCreator(creator);

  const keywords = normalizeKeywords(metadata.keywords || options.keywords);
  const patternKeywords = normalizePatternKeywords(
    metadata.patternTags || options.patternTags
  );
  const mergedKeywords = Array.from(
    new Set([...keywords, ...patternKeywords, ...buildInfo.keywords])
  );
  if (mergedKeywords.length) {
    pdfDoc.setKeywords(mergedKeywords);
  }

  if (buildInfo.date) {
    const parsedDate = new Date(buildInfo.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      if (typeof pdfDoc.setCreationDate === 'function') {
        pdfDoc.setCreationDate(parsedDate);
      }
      if (typeof pdfDoc.setModificationDate === 'function') {
        pdfDoc.setModificationDate(parsedDate);
      }
    }
  }
}

async function applyWatermark(pdfDoc, text) {
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 5;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    const x = (width - textWidth) / 2;
    const y = (height - textHeight) / 2;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      rotate: degrees(-25),
      opacity: 0.18,
    });
  });
}

export async function postprocessPdf({
  inputPath,
  outputPath,
  metadata = {},
  options = {},
} = {}) {
  if (!inputPath) {
    throw new Error('postprocessPdf requires inputPath.');
  }

  const resolvedOutput = outputPath || inputPath;
  const bytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(bytes);

  const pdfaReady = normalizeBoolean(options.pdfaReady, true);
  const optimize = normalizeBoolean(options.optimize ?? options.compress, true);
  const status = options.status || metadata.status || '';
  const draftWatermark = normalizeBoolean(
    options.draftWatermark,
    String(status).toLowerCase() === 'draft'
  );

  const buildInfo = await resolveBuildInfo(options);
  await applyMetadata(pdfDoc, metadata, { ...options, buildInfo });

  const keywords = normalizeKeywords(metadata.keywords || options.keywords);
  const patternKeywords = normalizePatternKeywords(
    metadata.patternTags || options.patternTags
  );
  const mergedKeywords = Array.from(
    new Set([...keywords, ...patternKeywords, ...buildInfo.keywords])
  );
  if (pdfaReady && !mergedKeywords.includes('pdfa-ready')) {
    mergedKeywords.push('pdfa-ready');
  }
  if (mergedKeywords.length) {
    pdfDoc.setKeywords(mergedKeywords);
  }

  if (draftWatermark) {
    await applyWatermark(pdfDoc, options.watermarkText || 'DRAFT');
  }

  const outputBytes = await pdfDoc.save({
    useObjectStreams: optimize,
    updateFieldAppearances: false,
  });

  await fs.writeFile(resolvedOutput, outputBytes);

  return {
    outputPath: resolvedOutput,
    pdfaReady,
    optimized: optimize,
    watermarked: draftWatermark,
    build: buildInfo,
  };
}

export default postprocessPdf;
