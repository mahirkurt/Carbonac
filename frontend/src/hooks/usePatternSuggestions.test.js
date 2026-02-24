import { describe, it, expect } from 'vitest';
import { analyzeWizardIntent, scorePattern } from './usePatternSuggestions';

describe('analyzeWizardIntent', () => {
  it('maps analytics documentType to data-heavy intent', () => {
    const intent = analyzeWizardIntent({ documentType: 'analytics', emphasis: ['data'] });
    expect(intent.docType).toBe('analytics');
    expect(intent.hasTables).toBe(true);
    expect(intent.hasSurvey).toBe(true);
    expect(intent.isDataHeavy).toBe(true);
  });

  it('maps academic documentType to research signals', () => {
    const intent = analyzeWizardIntent({ documentType: 'academic', emphasis: [] });
    expect(intent.hasMethodology).toBe(true);
    expect(intent.hasAuthors).toBe(true);
  });

  it('maps long pageGoal to isLongForm', () => {
    const intent = analyzeWizardIntent({ documentType: 'report', emphasis: [], pageGoal: 'long' });
    expect(intent.isLongForm).toBe(true);
    expect(intent.sectionCount).toBe(8);
  });

  it('detects charts from visuals emphasis', () => {
    const intent = analyzeWizardIntent({ documentType: 'report', emphasis: ['visuals'] });
    expect(intent.hasCharts).toBe(true);
    expect(intent.hasFigures).toBe(true);
  });

  it('defaults to report docType when not specified', () => {
    const intent = analyzeWizardIntent({ emphasis: [] });
    expect(intent.docType).toBe('report');
  });

  it('detects narrative emphasis for quotes', () => {
    const intent = analyzeWizardIntent({ documentType: 'report', emphasis: ['narrative'] });
    expect(intent.hasQuotes).toBe(true);
  });

  it('sets isDataHeavy only when data + another emphasis', () => {
    const single = analyzeWizardIntent({ documentType: 'report', emphasis: ['data'] });
    expect(single.isDataHeavy).toBe(false);
    const multi = analyzeWizardIntent({ documentType: 'report', emphasis: ['data', 'tables'] });
    expect(multi.isDataHeavy).toBe(true);
  });
});

describe('scorePattern', () => {
  const makeCard = (id, affinity, tags = []) => ({
    id, name: id, description: '', docTypeAffinity: affinity, icon: 'Document', tags,
  });

  it('scores docType affinity match at +3', () => {
    const card = makeCard('kpi-grid', ['dashboard', 'report']);
    const intent = analyzeWizardIntent({ documentType: 'report', emphasis: [] });
    expect(scorePattern(card, intent)).toBeGreaterThanOrEqual(3);
  });

  it('boosts kpi-grid when hasTables', () => {
    const card = makeCard('kpi-grid', ['report']);
    const withTables = analyzeWizardIntent({ documentType: 'report', emphasis: ['data'] });
    const withoutTables = analyzeWizardIntent({ documentType: 'report', emphasis: ['narrative'] });
    expect(scorePattern(card, withTables)).toBeGreaterThan(scorePattern(card, withoutTables));
  });

  it('boosts methodology-section for academic', () => {
    const card = makeCard('methodology-section', ['research']);
    const intent = analyzeWizardIntent({ documentType: 'academic', emphasis: [] });
    expect(scorePattern(card, intent)).toBeGreaterThanOrEqual(3);
  });

  it('boosts table-of-contents for long docs', () => {
    const card = makeCard('table-of-contents', ['report']);
    const longIntent = analyzeWizardIntent({ documentType: 'report', emphasis: [], pageGoal: 'long' });
    const shortIntent = analyzeWizardIntent({ documentType: 'report', emphasis: [], pageGoal: 'short' });
    expect(scorePattern(card, longIntent)).toBeGreaterThan(scorePattern(card, shortIntent));
  });

  it('gives universal patterns a baseline score', () => {
    const card = makeCard('cover-page-hero', ['report']);
    const intent = analyzeWizardIntent({ documentType: 'report', emphasis: [] });
    expect(scorePattern(card, intent)).toBeGreaterThanOrEqual(1);
  });

  it('boosts chart-composition when hasCharts', () => {
    const card = makeCard('chart-composition', ['report']);
    const withCharts = analyzeWizardIntent({ documentType: 'report', emphasis: ['visuals'] });
    const withoutCharts = analyzeWizardIntent({ documentType: 'report', emphasis: ['narrative'] });
    expect(scorePattern(card, withCharts)).toBeGreaterThan(scorePattern(card, withoutCharts));
  });

  it('boosts survey-chart-page for survey intent', () => {
    const card = makeCard('survey-chart-page', ['research']);
    const intent = analyzeWizardIntent({ documentType: 'research', emphasis: ['data'] });
    expect(scorePattern(card, intent)).toBeGreaterThanOrEqual(6); // docType(3) + hasSurvey(3)
  });

  it('boosts comparison-table when hasComparison', () => {
    const card = makeCard('comparison-table', ['report']);
    const withComparison = analyzeWizardIntent({ documentType: 'report', emphasis: ['tables'] });
    const withoutComparison = analyzeWizardIntent({ documentType: 'report', emphasis: ['narrative'] });
    expect(scorePattern(card, withComparison)).toBeGreaterThan(scorePattern(card, withoutComparison));
  });
});
