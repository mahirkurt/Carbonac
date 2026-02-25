import { describe, it, expect } from 'vitest';
import { enhanceConvertedMarkdown, normalizeConvertedMarkdown } from './markdownConversion';

describe('normalizeConvertedMarkdown', () => {
  it('normalizes line endings, whitespace, and invisible chars', () => {
    const source = '# Başlık\r\n\r\nParagraf\u00A0metni\u200B\r\n\r\n\r\n';
    const normalized = normalizeConvertedMarkdown(source);

    expect(normalized).toBe('# Başlık\n\nParagraf metni');
  });

  it('returns empty string for blank input', () => {
    expect(normalizeConvertedMarkdown('   \n\n')).toBe('');
  });
});

describe('enhanceConvertedMarkdown', () => {
  it('applies deterministic lint-based fixes after normalization', () => {
    const source = [
      '# Title',
      '',
      '#### Deep heading',
      '',
      '## Summary',
      '',
      '## Summary',
      '',
      ':::callout {tone="invalid" foo="bar"}',
      'Text',
      ':::',
    ].join('\n');

    const result = enhanceConvertedMarkdown(source);

    expect(result.markdown).toContain('## Deep heading');
    expect(result.markdown).toContain('## Summary (2)');
    expect(result.markdown).toContain(':::callout');
    expect(result.markdown).not.toContain('tone="invalid"');
    expect(result.markdown).not.toContain('foo="bar"');
    expect(result.appliedFixes.length).toBeGreaterThan(0);
  });
});

