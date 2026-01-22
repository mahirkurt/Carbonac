import fs from 'fs/promises';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

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

function normalizeBoolean(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
}

async function applyMetadata(pdfDoc, metadata = {}, options = {}) {
  const title = metadata.title || options.title || 'Carbon Report';
  const author = metadata.author || options.author || 'Carbonac';
  const subject = metadata.subject || metadata.subtitle || options.subject || '';
  const producer = options.producer || 'Carbonac PDF Engine';
  const creator = options.creator || 'Carbonac';

  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  if (subject) {
    pdfDoc.setSubject(subject);
  }
  pdfDoc.setProducer(producer);
  pdfDoc.setCreator(creator);

  const keywords = normalizeKeywords(metadata.keywords || options.keywords);
  if (keywords.length) {
    pdfDoc.setKeywords(keywords);
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

  await applyMetadata(pdfDoc, metadata, options);

  const keywords = normalizeKeywords(metadata.keywords || options.keywords);
  if (pdfaReady && !keywords.includes('pdfa-ready')) {
    keywords.push('pdfa-ready');
    pdfDoc.setKeywords(keywords);
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
  };
}

export default postprocessPdf;
