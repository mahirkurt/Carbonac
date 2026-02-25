# ReportWizard AI Integration Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the 22-card Pattern Knowledge Base into the ReportWizard conversation, letting users see and toggle pattern suggestions in real-time, with smarter template selection.

**Architecture:** Hybrid approach — slim pattern card data bundled client-side (~8KB) for instant suggestions, AI-powered template selection at summary step. A `usePatternSuggestions` hook mirrors art-director.js scoring. Pattern toggle cards render inside chat messages after question 4.

**Tech Stack:** React 19, Carbon Components v11 (Toggle, ClickableTile), Vite 7, existing `askAi` service

---

### Task 1: Create Slim Pattern Cards Data Module

**Files:**
- Create: `frontend/src/data/patternCardsSlim.js`

**Step 1: Create the data module**

Create a file exporting an array of 22 slim pattern card objects. Each card has: `id`, `name`, `description` (truncated to ~80 chars), `docTypeAffinity` (array), `icon` (Carbon icon name string), `tags` (array of content signal keywords).

```javascript
/**
 * Slim pattern cards for wizard-side intent matching.
 * Derived from library/patterns/*.json — update manually when cards change.
 */
const PATTERN_CARDS_SLIM = [
  {
    id: 'cover-page-hero',
    name: 'Kapak Sayfası',
    description: 'Büyük başlık, alt başlık ve tarih ile tam genişlikte açılış sayfası',
    docTypeAffinity: ['report', 'whitepaper', 'annual-report'],
    icon: 'Document',
    tags: ['cover', 'title', 'universal'],
  },
  {
    id: 'executive-summary',
    name: 'Yönetici Özeti',
    description: 'Anahtar metrikler ve 3-5 maddelik bulgular ile yapılandırılmış özet',
    docTypeAffinity: ['report', 'whitepaper', 'annual-report', 'research'],
    icon: 'Report',
    tags: ['summary', 'metrics', 'universal'],
  },
  // ... all 22 cards with Turkish names and descriptions
  // See full list below
];

export default PATTERN_CARDS_SLIM;
```

Include all 22 patterns: cover-page-hero, executive-summary, chapter-opener, key-findings-list, hero-stat-with-quote, data-table-spread, chart-composition, action-box, case-study-module, kpi-grid, figure-with-caption, appendix-page, survey-chart-page, table-of-contents, pull-quote-spread, timeline-process, comparison-table, two-column-narrative, infographic-strip, author-bio-strip, methodology-section, sidebar-callout.

Tag mapping for content signals:
- `data`: kpi-grid, data-table-spread, infographic-strip, survey-chart-page
- `charts`: chart-composition, survey-chart-page
- `narrative`: two-column-narrative, pull-quote-spread, sidebar-callout
- `tables`: data-table-spread, comparison-table
- `visuals`: figure-with-caption, infographic-strip
- `process`: timeline-process
- `research`: methodology-section, survey-chart-page, appendix-page
- `universal`: cover-page-hero, executive-summary

**Step 2: Verify module imports cleanly**

Run: `cd frontend && node -e "import('./src/data/patternCardsSlim.js').then(m => console.log(m.default.length, 'cards'))"`
Expected: `22 cards`

**Step 3: Commit**

```bash
git add frontend/src/data/patternCardsSlim.js
git commit -m "feat(wizard): add slim pattern cards data module (22 cards)"
```

---

### Task 2: Create usePatternSuggestions Hook

**Files:**
- Create: `frontend/src/hooks/usePatternSuggestions.js`
- Modify: `frontend/src/hooks/index.js` (add export)

**Step 1: Create the hook file**

The hook takes `selectedOptions` from the wizard and returns an array of scored pattern cards with `enabled` state.

```javascript
/**
 * usePatternSuggestions - Client-side pattern scoring for wizard
 * Mirrors art-director.js selectRelevantPatterns() logic
 */
import { useMemo, useState, useCallback } from 'react';
import PATTERN_CARDS_SLIM from '../data/patternCardsSlim';

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
    isDataHeavy: emphasis.includes('data') && emphasis.length >= 2,
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
  if (intent.hasTables && ['data-table-spread', 'chart-composition', 'kpi-grid', 'comparison-table'].includes(card.id)) score += 2;
  if (intent.hasQuotes && ['hero-stat-with-quote', 'pull-quote-spread'].includes(card.id)) score += 2;
  if (intent.hasSurvey && card.id === 'survey-chart-page') score += 3;
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
```

**Step 2: Add export to hooks/index.js**

Add to `frontend/src/hooks/index.js`:

```javascript
// Pattern suggestions for wizard
export { usePatternSuggestions } from './usePatternSuggestions';
```

**Step 3: Verify hook compiles**

Run: `cd frontend && npx vite build 2>&1 | tail -3`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/hooks/usePatternSuggestions.js frontend/src/hooks/index.js
git commit -m "feat(wizard): add usePatternSuggestions hook with intent analysis"
```

---

### Task 3: Create PatternSuggestionCards Component

**Files:**
- Create: `frontend/src/components/wizard/PatternSuggestionCards.jsx`
- Modify: `frontend/src/components/wizard/ReportWizard.scss` (add pattern card styles)

**Step 1: Create the component**

A presentational component that renders a list of pattern cards with toggles.

```jsx
/**
 * PatternSuggestionCards - Toggle-able pattern suggestion cards for wizard chat
 */
import React from 'react';
import { Toggle } from '@carbon/react';
import {
  ChartBar, Document, Report, Analytics, DataTable,
  TextLongParagraph, Image, ListBulleted, Quotes,
  Time, Compare, Book, UserMultiple, Grid as GridIcon,
} from '@carbon/icons-react';

const ICON_MAP = {
  ChartBar, Document, Report, Analytics, DataTable,
  TextLongParagraph, Image, ListBulleted, Quotes,
  Time, Compare, Book, UserMultiple, Grid: GridIcon,
};

function PatternSuggestionCards({ suggestions, onToggle }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="pattern-suggestion-cards">
      <p className="pattern-suggestion-cards__header">
        İçerik profilinize göre önerilen layout pattern'ları:
      </p>
      <div className="pattern-suggestion-cards__list">
        {suggestions.map((pattern) => {
          const IconComponent = ICON_MAP[pattern.icon] || Document;
          return (
            <div
              key={pattern.id}
              className={`pattern-suggestion-card ${!pattern.enabled ? 'pattern-suggestion-card--disabled' : ''}`}
            >
              <div className="pattern-suggestion-card__icon">
                <IconComponent size={20} />
              </div>
              <div className="pattern-suggestion-card__content">
                <span className="pattern-suggestion-card__name">{pattern.name}</span>
                <span className="pattern-suggestion-card__description">{pattern.description}</span>
              </div>
              <Toggle
                id={`pattern-toggle-${pattern.id}`}
                size="sm"
                toggled={pattern.enabled}
                onToggle={() => onToggle(pattern.id)}
                labelA=""
                labelB=""
                hideLabel
                aria-label={`${pattern.name} pattern'ını ${pattern.enabled ? 'kapat' : 'aç'}`}
              />
            </div>
          );
        })}
      </div>
      <p className="pattern-suggestion-cards__hint">
        İstemediğiniz pattern'ları kapatabilirsiniz.
      </p>
    </div>
  );
}

export default PatternSuggestionCards;
```

**Step 2: Add SCSS styles**

Append to `frontend/src/components/wizard/ReportWizard.scss` (after existing styles):

```scss
// Pattern suggestion cards
.pattern-suggestion-cards {
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--cds-layer-01, #f4f4f4);
  border-radius: 6px;
  border: 1px solid var(--cds-border-subtle-01, #e0e0e0);

  &__header {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--cds-text-primary, #161616);
    margin-bottom: 0.75rem;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__hint {
    font-size: 0.75rem;
    color: var(--cds-text-helper, #6f6f6f);
    margin-top: 0.75rem;
    font-style: italic;
  }
}

.pattern-suggestion-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--cds-layer-02, #fff);
  border-radius: 4px;
  border: 1px solid var(--cds-border-subtle-01, #e0e0e0);
  transition: opacity 0.2s ease;

  &--disabled {
    opacity: 0.5;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--cds-icon-primary, #161616);
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--cds-text-primary, #161616);
    line-height: 1.3;
  }

  &__description {
    display: block;
    font-size: 0.75rem;
    color: var(--cds-text-secondary, #525252);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
```

**Step 3: Verify component renders**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/components/wizard/PatternSuggestionCards.jsx frontend/src/components/wizard/ReportWizard.scss
git commit -m "feat(wizard): add PatternSuggestionCards component with toggle UI"
```

---

### Task 4: Add enabledPatterns to DocumentContext

**Files:**
- Modify: `frontend/src/contexts/DocumentContext.jsx:137-155`

**Step 1: Add enabledPatterns to initial reportSettings**

In `frontend/src/contexts/DocumentContext.jsx`, find the `reportSettings` initial state (line ~137) and add `enabledPatterns: []` to it:

```javascript
  reportSettings: {
    documentType: '',
    docType: '',
    tone: '',
    audience: '',
    purpose: '',
    colorScheme: '',
    layoutStyle: '',
    emphasis: [],
    components: [],
    enabledPatterns: [],  // ← ADD THIS
    locale: 'tr-TR',
    version: 1,
    includeCover: true,
    includeToc: true,
    includeBackCover: true,
    showPageNumbers: true,
    printBackground: true,
    colorMode: 'color',
  },
```

No other changes needed — `updateReportSettings({ enabledPatterns: [...] })` will work through existing `UPDATE_REPORT_SETTINGS` action.

**Step 2: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/contexts/DocumentContext.jsx
git commit -m "feat(wizard): add enabledPatterns to reportSettings state"
```

---

### Task 5: Integrate Pattern Suggestions into ReportWizard

**Files:**
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:6-43` (imports)
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:648-695` (component state + hook)
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:952-984` (handleNext — inject pattern cards into chat)

**Step 1: Add imports**

At line ~6, add the hook and component imports:

```javascript
import { usePatternSuggestions } from '../../hooks/usePatternSuggestions';
import PatternSuggestionCards from './PatternSuggestionCards';
```

**Step 2: Add hook call inside ReportWizard component**

After the existing state declarations (around line ~682), add:

```javascript
const { suggestions: patternSuggestions, togglePattern, enabledPatterns } = usePatternSuggestions(selectedOptions);
const patternSuggestionsShownRef = useRef(false);
```

**Step 3: Inject pattern cards into chat after emphasis question**

In `handleNext` (line ~952 area), after `const aiResponse = generateAIResponse(...)`, add logic to inject pattern cards as a special chat message when emphasis is first answered:

```javascript
const aiResponse = generateAIResponse(questionId, answer, nextAnswers, nextQuestion);
setMessages((prev) => {
  const updated = [...prev, { type: 'ai', content: aiResponse }];

  // Inject pattern suggestions after emphasis question (first time only)
  if (questionId === 'emphasis' && !patternSuggestionsShownRef.current) {
    patternSuggestionsShownRef.current = true;
    updated.push({ type: 'patterns', content: '' });
  }

  return updated;
});
```

**Step 4: Update message rendering in JSX**

Find the `messages.map()` rendering section in the JSX (search for `messages.map` in the component). Add a case for the `patterns` message type:

```jsx
{messages.map((msg, idx) => {
  if (msg.type === 'patterns') {
    return (
      <div key={idx} className="wizard-message wizard-message--ai">
        <div className="wizard-message__avatar"><Bot size={20} /></div>
        <div className="wizard-message__bubble">
          <PatternSuggestionCards
            suggestions={patternSuggestions}
            onToggle={togglePattern}
          />
        </div>
      </div>
    );
  }
  // ... existing message rendering
```

**Step 5: Save enabledPatterns to reportSettings at summary**

In the `handleNext` function, in the block where `setShowSummary(true)` is called (line ~973 area), add:

```javascript
updateReportSettings({ enabledPatterns });
```

**Step 6: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add frontend/src/components/wizard/ReportWizard.jsx
git commit -m "feat(wizard): integrate pattern suggestions into wizard chat flow"
```

---

### Task 6: Enhance Template Selection with Pattern Context

**Files:**
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:437-548` (scoreTemplateCandidate)
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:549-589` (resolveTemplateByAi)
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:786-874` (applyBackgroundDesignProfile)

**Step 1: Add pattern boost to heuristic scoring**

In `scoreTemplateCandidate()` (line ~437), add a new scoring block at the end of the function, before `return score`:

```javascript
// Pattern-aware scoring boost
if (Array.isArray(profile.enabledPatterns)) {
  const text = templateText; // already computed above
  const patternBoosts = {
    'kpi-grid': ['dataviz', 'grid', 'dashboard'],
    'chart-composition': ['dataviz', 'chart', 'visual'],
    'data-table-spread': ['grid', 'data', 'table'],
    'comparison-table': ['grid', 'table', 'compare'],
    'two-column-narrative': ['narrative', 'column', 'text'],
    'infographic-strip': ['dataviz', 'visual', 'infographic'],
    'timeline-process': ['process', 'timeline', 'step'],
    'methodology-section': ['research', 'academic', 'method'],
    'survey-chart-page': ['dataviz', 'survey', 'chart'],
  };

  for (const patternId of profile.enabledPatterns) {
    const keywords = patternBoosts[patternId] || [];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += 3;
        break; // max one boost per pattern
      }
    }
  }
}
```

**Step 2: Add enabledPatterns to AI prompt**

In `resolveTemplateByAi()` (line ~549), where the prompt is constructed, add enabled patterns to the context:

Find the prompt string that includes user profile info and append:

```javascript
const patternsContext = Array.isArray(profile.enabledPatterns) && profile.enabledPatterns.length
  ? `\nKullanıcının seçtiği layout pattern'ları: ${profile.enabledPatterns.join(', ')}`
  : '';
```

Include `patternsContext` in the AI prompt string.

**Step 3: Pass enabledPatterns in profile**

In `applyBackgroundDesignProfile()` (line ~809 area), where the `profile` object is constructed, add:

```javascript
const profile = {
  documentType: answersSnapshot.documentType || reportSettings.documentType,
  // ... existing fields ...
  enabledPatterns: enabledPatterns || [],  // ← ADD THIS
};
```

Also add `enabledPatterns` to the `useCallback` dependency array.

**Step 4: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/components/wizard/ReportWizard.jsx
git commit -m "feat(wizard): enhance template selection with pattern-aware scoring"
```

---

### Task 7: Improve AI Chat Responses with Context

**Files:**
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:590-646` (generateAIResponse function)

**Step 1: Rewrite generateAIResponse to be context-aware**

Replace the `generateAIResponse` function with a context-aware version. The function signature changes to accept the full `answers` object and uses accumulated profile information:

```javascript
function generateAIResponse(questionId, answer, answers, nextQuestion, patternNames) {
  const answerValue = Array.isArray(answer) ? answer[0] : answer;
  const emphasis = Array.isArray(answers.emphasis) ? answers.emphasis : [];
  const docLabel = {
    report: 'iş raporu', presentation: 'sunum', article: 'makale',
    documentation: 'dokümantasyon', analytics: 'analiz raporu', academic: 'akademik rapor',
  }[answers.documentType] || 'doküman';
  const audienceLabel = {
    executive: 'üst yönetim', technical: 'teknik ekip',
    business: 'iş birimi', general: 'genel okuyucu', academic: 'akademik çevre',
  }[answers.audience] || '';

  switch (questionId) {
    case 'documentType':
      if (answerValue === 'analytics') return 'Analiz odaklı bir yapı seçtiniz. Veri hiyerarşisini buna göre optimize edeceğim.';
      if (answerValue === 'academic') return 'Akademik format seçildi. Metodoloji bölümü ve kaynak yapısı otomatik planlanacak.';
      if (answerValue === 'presentation') return 'Sunum tipi için daha vurgu odaklı bir sayfa akışı tasarlayacağım.';
      return 'Doküman tipini aldım. Sonraki adımları bu profile göre kişiselleştiriyorum.';

    case 'audience':
      if (audienceLabel) return `${audienceLabel.charAt(0).toUpperCase() + audienceLabel.slice(1)} hedef kitlesi için ${docLabel} — ${answerValue === 'executive' ? 'kısa ve karar destekli' : 'detay odaklı'} bilgi akışı kuracağız.`;
      return 'Hedef kitleyi kaydettim. Soru akışını buna göre adapte ediyorum.';

    case 'purpose':
      return `${docLabel.charAt(0).toUpperCase() + docLabel.slice(1)} amacı netleşti: ${answerValue === 'persuade' ? 'ikna odaklı vurgu blokları' : answerValue === 'instruct' ? 'adım adım net düzen' : 'içerik vurgularını keskinleştirme'}.`;

    case 'emphasis':
      if (emphasis.includes('data') || emphasis.includes('tables'))
        return `${audienceLabel ? audienceLabel + ' hedef kitlesi için ' : ''}veri odaklı ${docLabel}. Bir sonraki adımda yoğunluk tercihini soracağım.`;
      return 'Vurgu alanlarını aldım. Bu seçimle uyumlu sade ve okunur bir akış kuracağız.';

    case 'dataDensity':
      return answerValue === 'dense'
        ? 'Yoğun içerik tercihini aldım. Grid ve sayfa dağılımını buna göre sıkılaştırıyorum.'
        : 'Yoğunluk tercihini aldım. Okunabilirlik dengesini buna göre ayarlıyorum.';

    case 'pageGoal': {
      const pInfo = answerValue === 'long' ? 'İçindekiler ve Appendix pattern\'ları da eklendi.' : '';
      return `Hedef sayfa aralığını kaydettim.${pInfo ? ' ' + pInfo : ''} Baskı profili önerisini optimize edeceğim.`;
    }

    case 'outputMode':
      return answerValue === 'print'
        ? 'Baskı önceliği aktif. Kontrast ve çıktı güvenliği odaklı ayarları devreye alıyorum.'
        : 'Kullanım önceliğini kaydettim. Görsel dengeyi buna göre ayarlıyorum.';

    case 'tone':
      return `${docLabel.charAt(0).toUpperCase() + docLabel.slice(1)} için ${answerValue === 'formal' ? 'resmi' : answerValue === 'technical' ? 'teknik' : 'yarı resmi'} ton ayarlandı.`;

    case 'colorScheme':
      return 'Renk yaklaşımı tamam. Tüm seçimleri birleştirip ideal PDF profilini oluşturuyorum.';

    default:
      break;
  }

  if (nextQuestion?.summaryLabel) {
    return `Sıradaki: "${nextQuestion.summaryLabel}" tercihine geçelim.`;
  }
  return 'Tercihlerinizi kaydettim. Bir sonraki adıma geçebiliriz.';
}
```

**Step 2: Update the call site**

In `handleNext` where `generateAIResponse` is called (line ~953), update to pass pattern names:

```javascript
const patternNames = patternSuggestions.filter(p => p.enabled).map(p => p.name);
const aiResponse = generateAIResponse(questionId, answer, nextAnswers, nextQuestion, patternNames);
```

**Step 3: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/components/wizard/ReportWizard.jsx
git commit -m "feat(wizard): make AI chat responses context-aware with accumulated profile"
```

---

### Task 8: Write Tests for usePatternSuggestions Hook

**Files:**
- Create: `frontend/src/hooks/usePatternSuggestions.test.js`

**Step 1: Write unit tests for the pure functions**

```javascript
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
});
```

**Step 2: Run tests**

Run: `cd frontend && npx vitest run src/hooks/usePatternSuggestions.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/hooks/usePatternSuggestions.test.js
git commit -m "test(wizard): add unit tests for usePatternSuggestions hook"
```

---

### Task 9: Final Build Verification

**Files:** None (verification only)

**Step 1: Run full frontend test suite**

Run: `cd frontend && npx vitest run`
Expected: All tests pass

**Step 2: Run production build**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Verify art-director module still loads**

Run: `node -e "import('./src/ai/art-director.js').then(m => console.log('OK:', Object.keys(m)))"`
Expected: `OK: [ 'extractQaFeedback', 'getArtDirection', 'storeQaFeedback' ]`

**Step 4: Verify pattern cards count**

Run: `node -e "import('./frontend/src/data/patternCardsSlim.js').then(m => console.log(m.default.length, 'slim cards'))"`
Expected: `22 slim cards`

---

### Task Summary

| Task | Description | Files | Estimated |
|------|-------------|-------|-----------|
| 1 | Slim pattern cards data module | 1 create | 5 min |
| 2 | usePatternSuggestions hook | 1 create, 1 modify | 5 min |
| 3 | PatternSuggestionCards component | 1 create, 1 modify | 5 min |
| 4 | enabledPatterns in DocumentContext | 1 modify | 2 min |
| 5 | Integrate into ReportWizard | 1 modify | 10 min |
| 6 | Pattern-aware template selection | 1 modify | 5 min |
| 7 | Context-aware chat responses | 1 modify | 5 min |
| 8 | Tests for hook | 1 create | 5 min |
| 9 | Final build verification | - | 3 min |
