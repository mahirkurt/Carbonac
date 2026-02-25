import assert from 'node:assert/strict';
import path from 'path';
import { parseMarkdown, markdownToHtml } from './utils/markdown-parser.js';
import { sanitizeMarkdownContent, resolveDocumentMetadata } from './utils/markdown-cleanup.js';
import { fileExists, getProjectRoot } from './utils/file-utils.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
  }
}

// ─── Markdown Parsing ───────────────────────────────────────────

console.log('\nMarkdown Parsing:');

test('parses frontmatter title', () => {
  const { metadata } = parseMarkdown('---\ntitle: "Test Document"\n---\n# Hello');
  assert.equal(metadata.title, 'Test Document');
});

test('parses frontmatter with all fields', () => {
  const md = '---\ntitle: Rapor\nauthor: Ali\ntheme: g10\nlayoutProfile: asymmetric\n---\n# Test';
  const { metadata } = parseMarkdown(md);
  assert.equal(metadata.author, 'Ali');
  assert.equal(metadata.theme, 'g10');
  assert.equal(metadata.layoutProfile, 'asymmetric');
});

test('handles missing frontmatter gracefully', () => {
  const { metadata } = parseMarkdown('# Başlıksız içerik');
  assert.equal(metadata.title, '');
  assert.equal(metadata.author, '');
  assert.equal(metadata.date, '');
  assert.equal(metadata.theme, 'white');
  assert.equal(metadata.layoutProfile, 'symmetric');
  assert.equal(metadata.printProfile, 'pagedjs-a4');
});

test('generates table of contents', () => {
  const md = '# Giris\n\n## Amac\n\n## Kapsam\n\n# Sonuc';
  const { toc } = parseMarkdown(md);
  assert.equal(toc.length, 4);
  assert.equal(toc[0].level, 1);
  assert.equal(toc[0].title, 'Giris');
  assert.equal(toc[1].level, 2);
  assert.equal(toc[3].title, 'Sonuc');
});

test('generates HTML with heading IDs', () => {
  const html = markdownToHtml('# Hello World');
  assert.ok(html.includes('<h1'));
  assert.ok(html.includes('id="hello-world"'));
});

test('renders GFM tables', () => {
  const md = '| A | B |\n|---|---|\n| 1 | 2 |';
  const html = markdownToHtml(md);
  assert.ok(html.includes('<table'));
  assert.ok(html.includes('<td'));
});

// ─── Directive Parsing ──────────────────────────────────────────

console.log('\nDirective Parsing:');

test('renders callout directive without space', () => {
  const html = markdownToHtml(':::callout{tone=warning}\nDikkat!\n:::\n');
  assert.ok(html.includes('directive--callout'), 'missing directive--callout class');
  assert.ok(html.includes('tone-warning'), 'missing tone-warning class');
});

test('renders callout directive with space before attributes', () => {
  const html = markdownToHtml(':::callout {tone=success}\nBasari!\n:::\n');
  assert.ok(html.includes('directive--callout'), 'space syntax should produce directive--callout');
  assert.ok(html.includes('tone-success'), 'space syntax should produce tone-success');
});

test('renders chart directive', () => {
  const html = markdownToHtml(':::chart{type=bar caption="Satis"}\nGrafik verisi\n:::\n');
  assert.ok(html.includes('directive--chart'));
  assert.ok(html.includes('data-caption="Satis"'));
});

test('extracts directive components from parse', () => {
  const md = ':::callout{tone=info}\nBilgi notu\n:::\n\n:::chart{type=donut}\nVeri\n:::\n';
  const { components } = parseMarkdown(md);
  assert.equal(components.length, 2);
  assert.equal(components[0].type, 'HighlightBox');
  assert.equal(components[0].props.tone, 'info');
  assert.equal(components[1].type, 'CarbonChart');
});

test('handles unknown directive gracefully', () => {
  const html = markdownToHtml(':::unknown{attr=val}\nContent\n:::\n');
  assert.ok(!html.includes('directive--unknown'), 'unknown directive should not produce class');
});

// ─── Markdown Cleanup ───────────────────────────────────────────

console.log('\nMarkdown Cleanup:');

test('sanitizes NBSP and soft hyphens', () => {
  const result = sanitizeMarkdownContent('Hello\u00A0world\u00ADtest');
  assert.equal(result.text, 'Hello worldtest');
  assert.equal(result.stats.nbspReplaced, 1);
  assert.equal(result.stats.softHyphenRemoved, 1);
});

test('normalizes line breaks', () => {
  const result = sanitizeMarkdownContent('line1\r\nline2\rline3');
  assert.ok(result.text.includes('line1\nline2\nline3'));
  assert.ok(result.stats.lineBreaksNormalized > 0);
});

test('handles empty input', () => {
  const result = sanitizeMarkdownContent('');
  assert.equal(result.text, '');
});

test('strips emoji and replaces known ones with text labels', () => {
  const result = sanitizeMarkdownContent('## \u{1F517} İlişkili Dokümantasyon');
  assert.equal(result.text, '## [link] İlişkili Dokümantasyon');
  assert.ok(result.stats.emojiStripped > 0);
});

test('strips unknown emoji completely', () => {
  const result = sanitizeMarkdownContent('Hello \u{1F600} World');
  assert.equal(result.text, 'Hello  World');
  assert.ok(result.stats.emojiStripped > 0);
});

test('preserves emoji when keepEmoji option is true', () => {
  const result = sanitizeMarkdownContent('Hello \u{1F517} World', { keepEmoji: true });
  assert.ok(result.text.includes('\u{1F517}'));
  assert.equal(result.stats.emojiStripped, 0);
});

// ─── Metadata Inference ─────────────────────────────────────────

console.log('\nMetadata Inference:');

test('infers title from h1', () => {
  const result = resolveDocumentMetadata({ markdown: '# Yillik Rapor\n\nIcerik' });
  assert.equal(result.title, 'Yillik Rapor');
});

test('infers author from author: pattern', () => {
  const result = resolveDocumentMetadata({ markdown: '# Rapor\n\nauthor: Ahmet Yilmaz\n\nIcerik' });
  assert.equal(result.author, 'Ahmet Yilmaz');
});

test('infers title from filename when markdown has no heading', () => {
  const result = resolveDocumentMetadata({ markdown: 'kisa', fileName: 'satis-raporu-2025.md' });
  assert.equal(result.title, 'satis raporu 2025');
});

test('uses fallback title when no source available', () => {
  const result = resolveDocumentMetadata({ markdown: '' });
  assert.equal(result.title, 'Carbon Report');
});

test('normalizes boolean fields', () => {
  const result = resolveDocumentMetadata({
    markdown: '# T',
    settings: { includeCover: 'false', showPageNumbers: true },
  });
  assert.equal(result.includeCover, false);
  assert.equal(result.showPageNumbers, true);
});

// ─── Art Director Fallback ──────────────────────────────────────

console.log('\nArt Director Fallback:');

await testAsync('produces row-based insights for labeled tables', async () => {
  // Dynamic import to avoid loading Gemini config at module level
  const { getArtDirection } = await import('./ai/art-director.js');
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const md = `# Rapor\n\n| Bolge | Q1 | Q2 | Q3 |\n|---|---|---|---|\n| Bati | 100 | 200 | 300 |\n| Dogu | 50 | 40 | 30 |\n`;
    const result = await getArtDirection({ markdown: md, layoutProfile: 'symmetric', printProfile: 'pagedjs-a4', theme: 'white' });
    assert.equal(result.source, 'fallback');
    const insights = result.layoutJson.storytelling?.keyInsights || [];
    // Should detect row trends: Bati increasing, Dogu decreasing
    const hasBatiTrend = insights.some((i) => i.includes('Bati') && i.includes('artan'));
    const hasDoguTrend = insights.some((i) => i.includes('Dogu') && i.includes('azalan'));
    assert.ok(hasBatiTrend, 'Should detect Bati increasing trend');
    assert.ok(hasDoguTrend, 'Should detect Dogu decreasing trend');
  } finally {
    if (savedKey) process.env.GEMINI_API_KEY = savedKey;
  }
});

await testAsync('generates minimum fallback components', async () => {
  const { getArtDirection } = await import('./ai/art-director.js');
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const md = `# Rapor\n\n## Bolum 1\n\nIcerik\n\n| A | B |\n|---|---|\n| 1 | 2 |\n`;
    const result = await getArtDirection({ markdown: md, layoutProfile: 'symmetric', printProfile: 'pagedjs-a4', theme: 'white' });
    const components = result.layoutJson.components || [];
    assert.ok(components.length >= 2, `Expected >= 2 components, got ${components.length}`);
    const types = components.map((c) => c.type);
    assert.ok(types.includes('RichText'), 'Should have RichText component');
    assert.ok(types.includes('HighlightBox'), 'Should have HighlightBox component');
  } finally {
    if (savedKey) process.env.GEMINI_API_KEY = savedKey;
  }
});

await testAsync('executive summary excludes table markup', async () => {
  const { getArtDirection } = await import('./ai/art-director.js');
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const md = `# Ozet\n\nBu bir test raporu.\n\n| Col1 | Col2 |\n|---|---|\n| a | b |\n`;
    const result = await getArtDirection({ markdown: md, layoutProfile: 'symmetric', printProfile: 'pagedjs-a4', theme: 'white' });
    const summary = result.layoutJson.storytelling?.executiveSummary || '';
    assert.ok(!summary.includes('|'), `Executive summary should not contain table pipe chars: "${summary}"`);
  } finally {
    if (savedKey) process.env.GEMINI_API_KEY = savedKey;
  }
});

// ─── Print CSS Files ────────────────────────────────────────────

console.log('\nPrint CSS Files:');

const projectRoot = getProjectRoot();
const cssFiles = ['print-base.css', 'pagedjs-a4.css', 'pagedjs-a5.css'];
for (const file of cssFiles) {
  await testAsync(`${file} exists`, async () => {
    const filePath = path.join(projectRoot, 'styles', 'print', file);
    const exists = await fileExists(filePath);
    assert.ok(exists, `Missing ${file}`);
  });
}

// ─── Token Loader ───────────────────────────────────────────────

console.log('\nToken Loader:');

await testAsync('builds CSS custom properties', async () => {
  const { buildTokenCss } = await import('./utils/token-loader.js');
  const css = await buildTokenCss({ projectRoot: getProjectRoot() });
  assert.ok(css.length > 100, 'Token CSS should be substantial');
  assert.ok(css.includes(':root'), 'Should contain :root selector');
});

// ─── Summary ────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
console.log('Tests passed.');
