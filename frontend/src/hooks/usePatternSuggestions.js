/**
 * usePatternSuggestions - Client-side pattern scoring for wizard
 * Mirrors art-director.js selectRelevantPatterns() logic
 */
import { useMemo, useState, useCallback } from 'react';
import PATTERN_CARDS_SLIM from '../data/patternCardsSlim.js';

function analyzeWizardIntent(options) {
  const docType = (options.documentType || 'report').toLowerCase();
  const emphasis = Array.isArray(options.emphasis) ? options.emphasis : [];
  const pageGoal = options.pageGoal || '';

  return {
    docType,
    hasTables: emphasis.includes('data') || emphasis.includes('tables'),
    hasCharts: emphasis.includes('visuals'),
    hasQuotes: emphasis.includes('narrative'),
    hasSurvey: docType === 'analytics' || docType === 'research',
    hasTimeline: false, // wizard doesn't detect this directly
    hasComparison: emphasis.includes('tables'),
    hasMethodology: docType === 'academic' || docType === 'research',
    hasFigures: emphasis.includes('visuals'),
    hasAuthors: docType === 'academic',
    sectionCount: pageGoal === 'long' ? 8 : pageGoal === 'medium' ? 5 : 3,
    isDataHeavy: emphasis.includes('data') && (emphasis.length >= 2 || docType === 'analytics'),
    isLongForm: pageGoal === 'long',
  };
}

function scorePattern(card, intent) {
  let score = 0;

  // DocType affinity match
  if (Array.isArray(card.docTypeAffinity)) {
    if (card.docTypeAffinity.some(t => intent.docType.includes(t))) {
      score += 3;
    }
  }

  // Content signal boosts
  if (intent.hasTables && ['data-table-spread', 'kpi-grid', 'comparison-table'].includes(card.id)) score += 2;
  if (intent.hasCharts && ['chart-composition', 'survey-chart-page', 'infographic-strip'].includes(card.id)) score += 2;
  if (intent.hasQuotes && ['hero-stat-with-quote', 'pull-quote-spread'].includes(card.id)) score += 2;
  if (intent.hasSurvey && card.id === 'survey-chart-page') score += 3;
  if (intent.hasTimeline && card.id === 'timeline-process') score += 2;
  if (intent.hasComparison && card.id === 'comparison-table') score += 2;
  if (intent.hasMethodology && card.id === 'methodology-section') score += 3;
  if (intent.hasFigures && card.id === 'figure-with-caption') score += 2;
  if (intent.hasAuthors && card.id === 'author-bio-strip') score += 2;
  if (intent.sectionCount >= 3 && card.id === 'chapter-opener') score += 2;
  if (intent.isLongForm && ['table-of-contents', 'appendix-page'].includes(card.id)) score += 2;
  if (intent.isDataHeavy && ['kpi-grid', 'chart-composition', 'infographic-strip'].includes(card.id)) score += 1;

  // Universal patterns
  if (['cover-page-hero', 'executive-summary'].includes(card.id)) score += 1;

  return score;
}

export function usePatternSuggestions(selectedOptions) {
  const [disabledIds, setDisabledIds] = useState(new Set());

  const suggestions = useMemo(() => {
    if (!selectedOptions.emphasis) return []; // not enough context yet

    const intent = analyzeWizardIntent(selectedOptions);
    return PATTERN_CARDS_SLIM
      .map(card => ({ ...card, score: scorePattern(card, intent) }))
      .filter(card => card.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map(card => ({
        ...card,
        enabled: !disabledIds.has(card.id),
      }));
  }, [selectedOptions, disabledIds]);

  const togglePattern = useCallback((patternId) => {
    setDisabledIds(prev => {
      const next = new Set(prev);
      if (next.has(patternId)) {
        next.delete(patternId);
      } else {
        next.add(patternId);
      }
      return next;
    });
  }, []);

  const enabledPatterns = useMemo(
    () => suggestions.filter(s => s.enabled).map(s => s.id),
    [suggestions],
  );

  return { suggestions, togglePattern, enabledPatterns };
}

// Exported for testing
export { analyzeWizardIntent, scorePattern };
