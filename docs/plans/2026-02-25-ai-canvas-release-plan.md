# AI Canvas Release — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a cohesive release that commits all uncommitted work and transforms the editor into an AI Canvas with a suggestion sidebar, wizard-to-editor bridge, and profile-aware pattern actions.

**Architecture:** Three-phase approach: (1) commit existing uncommitted changes in logical batches, (2) refactor EditorPanel into grid layout with sidebar slot, (3) add new canvas components — sidebar, pattern prompts, bridge button, welcome message.

**Tech Stack:** React 19, Carbon Components v11 (Accordion, AccordionItem, ClickableTile, Toggle), Vite 7, existing AI event system (`AI_APPLY_COMMAND_EVENT`, `AI_COMMAND_RESULT_EVENT`)

---

## Phase 1: Commit Existing Work

### Task 1: Commit backend security changes

**Files:**
- Commit (already modified): `backend/server.js`, `backend/middleware/error-handler.js`, `backend/middleware/rate-limit.js`, `backend/package.json`, `backend/package-lock.json`

**Step 1: Stage and commit**

```bash
cd /mnt/thunderbolt/workspaces/Carbonac
git add backend/server.js backend/middleware/error-handler.js backend/middleware/rate-limit.js backend/package.json backend/package-lock.json
git commit -m "feat(backend): add helmet security headers and API rate limiting"
```

**Step 2: Verify backend still starts**

Run: `cd backend && node -e "import('./server.js')" 2>&1 | head -5`
Expected: No import errors (may show "port in use" which is OK)

---

### Task 2: Commit pattern library enrichment

**Files:**
- Commit (already modified): `library/patterns/action-box.json`, `library/patterns/case-study-module.json`, `library/patterns/chapter-opener.json`, `library/patterns/chart-composition.json`, `library/patterns/cover-page-hero.json`, `library/patterns/data-table-spread.json`, `library/patterns/executive-summary.json`, `library/patterns/hero-stat-with-quote.json`, `library/patterns/key-findings-list.json`, `library/patterns/kpi-grid.json`, `src/ai/art-director.js`

**Step 1: Stage and commit**

```bash
git add library/patterns/action-box.json library/patterns/case-study-module.json library/patterns/chapter-opener.json library/patterns/chart-composition.json library/patterns/cover-page-hero.json library/patterns/data-table-spread.json library/patterns/executive-summary.json library/patterns/hero-stat-with-quote.json library/patterns/key-findings-list.json library/patterns/kpi-grid.json src/ai/art-director.js
git commit -m "feat(patterns): enrich all patterns with printBehavior and accessibilityNotes"
```

**Step 2: Verify art-director loads**

Run: `node -e "import('./src/ai/art-director.js').then(m => console.log('OK:', Object.keys(m)))"`
Expected: `OK: [ 'extractQaFeedback', 'getArtDirection', 'storeQaFeedback' ]`

---

### Task 3: Commit print CSS and metadata changes

**Files:**
- Commit (already modified): `styles/print/print-base.css`, `src/utils/markdown-cleanup.js`, `backend/lib/job-helpers.js`

**Step 1: Stage and commit**

```bash
git add styles/print/print-base.css src/utils/markdown-cleanup.js backend/lib/job-helpers.js
git commit -m "feat(print): add TOC and back cover CSS profiles with metadata support"
```

---

### Task 4: Commit lint fixes

**Files:**
- Commit (already modified): `frontend/src/utils/markdownLint.js`, `frontend/src/utils/markdownLint.test.js`

**Step 1: Stage and commit**

```bash
git add frontend/src/utils/markdownLint.js frontend/src/utils/markdownLint.test.js
git commit -m "fix(lint): correct directive regex escaping in markdown linter"
```

**Step 2: Run lint tests**

Run: `cd frontend && npx vitest run src/utils/markdownLint.test.js`
Expected: All tests pass

---

### Task 5: Commit UI refinement

**Files:**
- Commit (already modified): `frontend/src/components/layout/AppHeader.jsx`, `frontend/src/components/layout/AppHeader.scss`, `frontend/src/components/layout/AppFooter.scss`, `frontend/src/components/landing/LandingPage.jsx`

**Step 1: Stage and commit**

```bash
git add frontend/src/components/layout/AppHeader.jsx frontend/src/components/layout/AppHeader.scss frontend/src/components/layout/AppFooter.scss frontend/src/components/landing/LandingPage.jsx
git commit -m "refactor(ui): modernize header/footer chrome and update landing copy"
```

---

### Task 6: Commit config and docs

**Files:**
- Commit (already modified): `.vscode/settings.json`, `Carbonac.code-workspace`, `docs/CARBON-AI-CHAT-ENTEGRE.md`

**Step 1: Stage and commit**

```bash
git add .vscode/settings.json Carbonac.code-workspace docs/CARBON-AI-CHAT-ENTEGRE.md
git commit -m "chore: update workspace config, VS Code theme, and AI chat docs"
```

---

### Task 7: Commit frontend refactors (event constants + App.jsx + EditorPanel + CarbonacAiChat)

**Files:**
- Commit (already modified): `frontend/src/constants/editorConstants.js`, `frontend/src/App.jsx`, `frontend/src/components/layout/EditorPanel.jsx`, `frontend/src/components/ai/CarbonacAiChat.jsx`

**Step 1: Build check before committing**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 2: Stage and commit**

```bash
git add frontend/src/constants/editorConstants.js frontend/src/App.jsx frontend/src/components/layout/EditorPanel.jsx frontend/src/components/ai/CarbonacAiChat.jsx
git commit -m "refactor(frontend): centralize AI event constants, streamline editor canvas and chat"
```

---

## Phase 2: Canvas Infrastructure

### Task 8: Create pattern-to-prompt mapping data module

**Files:**
- Create: `frontend/src/data/patternPrompts.js`

**Step 1: Create the data module**

Each enabled pattern maps to a concrete AI action with label, prompt, icon, and flags.

```javascript
/**
 * Pattern-to-prompt mapping for AI Canvas sidebar.
 * Each entry maps a pattern ID (from patternCardsSlim.js) to
 * an actionable AI prompt that generates/inserts that pattern.
 */
const PATTERN_PROMPTS = {
  'cover-page-hero': {
    label: 'Kapak sayfası oluştur',
    prompt: 'Mevcut markdown için Carbon uyumlu bir kapak sayfası oluştur. Başlık, alt başlık, tarih ve yazar bilgisi içersin. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Document',
  },
  'executive-summary': {
    label: 'Yönetici özeti ekle',
    prompt: 'İçerikten anahtar metrikleri ve 3-5 maddelik bulguları çıkararak yönetici özeti bölümü oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Report',
  },
  'chapter-opener': {
    label: 'Bölüm açılışları ekle',
    prompt: 'Mevcut başlıkları kullanarak her ana bölüme Carbon uyumlu bölüm açılış sayfası ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Book',
  },
  'key-findings-list': {
    label: 'Temel bulgular listesi',
    prompt: 'İçerikten öne çıkan bulguları numaralı liste halinde çıkar. Her maddeye önem derecesi ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ListBulleted',
  },
  'hero-stat-with-quote': {
    label: 'Öne çıkan istatistik ekle',
    prompt: 'İçerikteki en etkileyici sayısal veriyi büyük istatistik + uzman alıntısı formatında :::quote directive ile oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Quotes',
  },
  'data-table-spread': {
    label: 'Veri tablosu ekle',
    prompt: 'İçerikteki karşılaştırmalı verileri :::data-table directive formatında tam genişlik tablo olarak düzenle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'DataTable',
  },
  'chart-composition': {
    label: 'Grafik düzeni oluştur',
    prompt: 'İçerikteki sayısal verileri :::chart directive ile uygun grafik türünde (bar, line, donut) görselleştir. Yanına açıklama metni ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ChartBar',
  },
  'action-box': {
    label: 'Aksiyon kutusu ekle',
    prompt: 'İçerikten çıkarılabilecek somut öneriler ve sonraki adımlar için :::callout directive ile aksiyon bloğu oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'CheckmarkOutline',
  },
  'case-study-module': {
    label: 'Vaka çalışması ekle',
    prompt: 'İçerikten bir sorun/çözüm/sonuç yapısında vaka anlatısı bloğu oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Analytics',
  },
  'kpi-grid': {
    label: 'KPI grid oluştur',
    prompt: 'Markdown içeriğindeki sayısal verileri kullanarak 3-6 KPI göstergesi içeren grid bloğu oluştur. Her KPI için büyük sayı ve kısa açıklama olsun. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Grid',
  },
  'figure-with-caption': {
    label: 'Şekil ve altyazı ekle',
    prompt: 'İçeriğe uygun bir :::figure directive ile numaralı şekil, açıklayıcı altyazı ve kaynak bilgisi ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Image',
  },
  'appendix-page': {
    label: 'Ek bölüm oluştur',
    prompt: 'Rapor sonuna metodoloji notları, veri kaynakları ve referanslar içeren bir ek (appendix) bölümü ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'DocumentAttachment',
  },
  'survey-chart-page': {
    label: 'Anket sonuçları sayfası',
    prompt: 'İçerikteki anket/araştırma verilerini bar ve donut chart directive formatında görselleştir. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ChartBar',
  },
  'table-of-contents': {
    label: 'İçindekiler tablosu ekle',
    prompt: 'Başlıklara göre hiyerarşik içindekiler bölümü oluştur ve markdown akışına uygun noktaya ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ListBulleted',
  },
  'pull-quote-spread': {
    label: 'Büyük alıntı ekle',
    prompt: 'İçerikten en etkileyici cümleyi seçerek büyük tipografili :::quote directive ile editöryal alıntı bloğu oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Quotes',
  },
  'timeline-process': {
    label: 'Süreç akışı ekle',
    prompt: 'İçerikteki sıralı adımları :::timeline directive formatında 3-7 adımlı süreç akışı bloğuna dönüştür. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Time',
  },
  'comparison-table': {
    label: 'Karşılaştırma tablosu',
    prompt: 'İçerikteki alternatifleri yan yana karşılaştırma tablosu olarak düzenle. 2-4 seçenek, çoklu kriter. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Compare',
  },
  'two-column-narrative': {
    label: 'İki sütunlu metin',
    prompt: 'Uzun paragrafları iki sütunlu anlatı düzenine dönüştür. Sütunlar arasında dengeli dağılım yap. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'TextLongParagraph',
  },
  'infographic-strip': {
    label: 'İnfografik şerit ekle',
    prompt: 'İçerikteki 3-5 önemli sayısal veriyi ikon + istatistik formatında yatay infografik şerit bloğu olarak düzenle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ChartBar',
  },
  'author-bio-strip': {
    label: 'Yazar bilgisi ekle',
    prompt: 'Doküman yazarları için isim, unvan ve kısa biyografi içeren yazar kartları bölümü oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'UserMultiple',
  },
  'methodology-section': {
    label: 'Metodoloji bölümü yaz',
    prompt: 'Araştırma/rapor için veri toplama yöntemi, örneklem özellikleri ve analiz yaklaşımını açıklayan bir metodoloji bölümü oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Chemistry',
  },
  'sidebar-callout': {
    label: 'Kenar notu ekle',
    prompt: 'İçerikten destekleyici tanım, istatistik veya bağlam bilgisini :::callout{tone="info"} directive ile kenar notu olarak oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'SidePanelOpen',
  },
};

export default PATTERN_PROMPTS;
```

**Step 2: Verify module imports**

Run: `cd frontend && node -e "import('./src/data/patternPrompts.js').then(m => console.log(Object.keys(m.default).length, 'prompts'))"`
Expected: `22 prompts`

**Step 3: Commit**

```bash
git add frontend/src/data/patternPrompts.js
git commit -m "feat(canvas): add pattern-to-prompt mapping data module (22 patterns)"
```

---

### Task 9: Create AiCanvasSidebar component

**Files:**
- Create: `frontend/src/components/canvas/AiCanvasSidebar.jsx`
- Create: `frontend/src/components/canvas/AiCanvasSidebar.scss`

**Step 1: Create the sidebar component**

The sidebar is a container that renders four accordion sections: profile summary, pattern actions, contextual suggestions, and lint summary.

```jsx
/**
 * AiCanvasSidebar - Suggestion sidebar for AI Canvas editor
 */
import React, { useMemo } from 'react';
import { Accordion, AccordionItem, ClickableTile, Tag } from '@carbon/react';
import {
  Document, Report, Book, ListBulleted, Quotes,
  DataTable, ChartBar, Grid as GridIcon, Image, Time,
  Compare, TextLongParagraph, UserMultiple, Analytics,
  CheckmarkOutline, DocumentAttachment, Chemistry, SidePanelOpen,
  WarningAlt,
} from '@carbon/icons-react';
import PATTERN_PROMPTS from '../../data/patternPrompts';
import './AiCanvasSidebar.scss';

const ICON_MAP = {
  Document, Report, Book, ListBulleted, Quotes,
  DataTable, ChartBar, Grid: GridIcon, Image, Time,
  Compare, TextLongParagraph, UserMultiple, Analytics,
  CheckmarkOutline, DocumentAttachment, Chemistry, SidePanelOpen,
};

const DOC_TYPE_LABELS = {
  report: 'İş Raporu', presentation: 'Sunum', article: 'Makale',
  documentation: 'Dokümantasyon', analytics: 'Analiz Raporu', academic: 'Akademik Rapor',
};

const AUDIENCE_LABELS = {
  executive: 'Üst Yönetim', technical: 'Teknik Ekip',
  business: 'İş Birimi', general: 'Genel Okuyucu', academic: 'Akademik Çevre',
};

const TONE_LABELS = {
  formal: 'Resmi', technical: 'Teknik', casual: 'Yarı Resmi',
};

function ProfileSummaryCard({ reportSettings }) {
  const docType = DOC_TYPE_LABELS[reportSettings?.documentType] || '';
  const audience = AUDIENCE_LABELS[reportSettings?.audience] || '';
  const tone = TONE_LABELS[reportSettings?.tone] || '';
  if (!docType) return null;

  return (
    <div className="ai-canvas-sidebar__profile">
      <div className="ai-canvas-sidebar__profile-tags">
        {docType ? <Tag type="blue" size="sm">{docType}</Tag> : null}
        {audience ? <Tag type="teal" size="sm">{audience}</Tag> : null}
        {tone ? <Tag type="gray" size="sm">{tone}</Tag> : null}
      </div>
    </div>
  );
}

function PatternActionList({ enabledPatterns, onAction, disabled }) {
  if (!enabledPatterns || enabledPatterns.length === 0) return null;

  return (
    <div className="ai-canvas-sidebar__patterns">
      {enabledPatterns.map((patternId) => {
        const prompt = PATTERN_PROMPTS[patternId];
        if (!prompt) return null;
        const IconComponent = ICON_MAP[prompt.icon] || Document;

        return (
          <ClickableTile
            key={patternId}
            className="ai-canvas-sidebar__pattern-tile"
            onClick={() => onAction(prompt)}
            disabled={disabled}
          >
            <IconComponent size={16} />
            <span>{prompt.label}</span>
          </ClickableTile>
        );
      })}
    </div>
  );
}

function ContextualSuggestionList({ suggestions, onAction, disabled }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="ai-canvas-sidebar__contextual">
      {suggestions.map((item, idx) => (
        <ClickableTile
          key={`${item.label}-${idx}`}
          className="ai-canvas-sidebar__suggestion-tile"
          onClick={() => onAction(item)}
          disabled={disabled}
        >
          <span>{item.label}</span>
        </ClickableTile>
      ))}
    </div>
  );
}

function LintSummary({ lintIssues, onFix }) {
  const count = Array.isArray(lintIssues) ? lintIssues.length : 0;

  return (
    <div className="ai-canvas-sidebar__lint">
      <div className="ai-canvas-sidebar__lint-count">
        <WarningAlt size={16} />
        <span>{count} lint bulgusu</span>
      </div>
      {count > 0 && onFix ? (
        <button
          type="button"
          className="ai-canvas-sidebar__lint-fix"
          onClick={onFix}
        >
          Otomatik düzelt
        </button>
      ) : null}
    </div>
  );
}

export default function AiCanvasSidebar({
  reportSettings,
  enabledPatterns,
  contextualSuggestions,
  lintIssues,
  onPatternAction,
  onSuggestionAction,
  onLintFix,
  disabled,
  children,
}) {
  const hasProfile = Boolean(reportSettings?.documentType);

  return (
    <aside className="ai-canvas-sidebar">
      <Accordion align="start">
        {hasProfile ? (
          <AccordionItem title="Tasarım Profili" open>
            <ProfileSummaryCard reportSettings={reportSettings} />
          </AccordionItem>
        ) : null}

        {enabledPatterns && enabledPatterns.length > 0 ? (
          <AccordionItem title={`Pattern Aksiyonları (${enabledPatterns.length})`} open>
            <PatternActionList
              enabledPatterns={enabledPatterns}
              onAction={onPatternAction}
              disabled={disabled}
            />
          </AccordionItem>
        ) : null}

        <AccordionItem title="Öneriler" open>
          <ContextualSuggestionList
            suggestions={contextualSuggestions}
            onAction={onSuggestionAction}
            disabled={disabled}
          />
        </AccordionItem>

        <AccordionItem title="Lint">
          <LintSummary lintIssues={lintIssues} onFix={onLintFix} />
        </AccordionItem>
      </Accordion>

      {children ? (
        <div className="ai-canvas-sidebar__chat-slot">
          {children}
        </div>
      ) : null}
    </aside>
  );
}
```

**Step 2: Create SCSS**

```scss
// AiCanvasSidebar.scss
.ai-canvas-sidebar {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--cds-border-subtle-01, #e0e0e0);
  background: var(--cds-layer-01, #f4f4f4);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 100%;

  .cds--accordion {
    flex: 1;
  }

  &__profile {
    padding: 0.5rem 0;
  }

  &__profile-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  &__patterns,
  &__contextual {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  &__pattern-tile,
  &__suggestion-tile {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    min-height: auto;

    svg {
      flex-shrink: 0;
      color: var(--cds-icon-secondary, #525252);
    }

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__lint {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

  &__lint-count {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--cds-text-secondary, #525252);
  }

  &__lint-fix {
    background: none;
    border: none;
    color: var(--cds-link-primary, #0f62fe);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;

    &:hover {
      text-decoration: underline;
    }
  }

  &__chat-slot {
    border-top: 1px solid var(--cds-border-subtle-01, #e0e0e0);
    flex-shrink: 0;
  }
}

// Responsive: collapse sidebar on narrow screens
@media (max-width: 1056px) {
  .ai-canvas-sidebar {
    display: none;
  }
}
```

**Step 3: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds (component not yet imported anywhere — tree-shaken out)

**Step 4: Commit**

```bash
git add frontend/src/components/canvas/AiCanvasSidebar.jsx frontend/src/components/canvas/AiCanvasSidebar.scss
git commit -m "feat(canvas): create AiCanvasSidebar component with pattern actions and profile summary"
```

---

### Task 10: Refactor EditorPanel into grid layout with sidebar

**Files:**
- Modify: `frontend/src/components/layout/EditorPanel.jsx`

This is the biggest refactor. The goal: replace the current toolbar-heavy layout with a two-column grid (editor left, sidebar right). Remove inline action buttons and move them to the sidebar.

**Step 1: Add imports**

At the top of EditorPanel.jsx, add:

```javascript
import AiCanvasSidebar from '../canvas/AiCanvasSidebar';
import PATTERN_PROMPTS from '../../data/patternPrompts';
```

**Step 2: Add contextual suggestion builder**

After the existing `useMemo` hooks (around line 110), add a `contextualSuggestions` memo:

```javascript
const contextualSuggestions = useMemo(() => {
  const md = String(markdownContent || '');
  const suggestions = [];

  if (!md.trim()) {
    suggestions.push({
      label: 'Örnek markdown iskeleti oluştur',
      prompt: 'Carbon standartlarında örnek bir rapor markdown iskeleti oluştur. Çıktıyı markdown code block olarak ver.',
      expectMarkdown: true,
      applyTarget: 'document',
    });
    suggestions.push({
      label: 'Doküman yapısı öner',
      prompt: 'Bu doküman için kapak, içindekiler ve bölüm akışını kısa maddelerle öner.',
      expectMarkdown: false,
    });
    return suggestions;
  }

  // Check for missing structural elements
  const hasCover = /^#\s/m.test(md) && /kapak|cover|title\s*page/i.test(md.slice(0, 500));
  const hasToc = /içindekiler|table\s+of\s+contents/i.test(md);
  const isLong = md.split('\n').filter(l => /^#{1,2}\s/.test(l)).length >= 5;

  if (!hasCover) {
    suggestions.push({
      label: 'Kapak sayfası ekle',
      prompt: 'Mevcut markdown için Carbon uyumlu bir kapak sayfası ekle. Çıktıyı tam markdown olarak ver.',
      expectMarkdown: true,
      applyTarget: 'document',
    });
  }
  if (!hasToc && isLong) {
    suggestions.push({
      label: 'İçindekiler tablosu ekle',
      prompt: 'Başlıklara göre içindekiler bölümü oluştur ve markdown akışına uygun noktaya ekle. Çıktıyı markdown code block olarak ver.',
      expectMarkdown: true,
      applyTarget: 'document',
    });
  }

  suggestions.push({
    label: 'Tüm metni Carbon uyumlu revize et',
    prompt: 'Markdown içeriğini Carbon tasarım ilkelerine göre baştan sona revize et. Çıktıyı yalnızca markdown code block olarak ver.',
    expectMarkdown: true,
    applyTarget: 'document',
  });
  suggestions.push({
    label: 'Tablo/grafik noktalarını öner',
    prompt: 'Bu dokümanda tablo ve grafik eklenebilecek bölümleri kısa gerekçelerle listele.',
    expectMarkdown: false,
  });

  // Selection-aware suggestion
  const selectedText = String(editorSelection?.text || '').trim();
  if (selectedText) {
    suggestions.unshift({
      label: 'Seçili metni revize et',
      prompt: 'Seçili metni daha açık, kısa ve profesyonel olacak şekilde revize et. Çıktıyı sadece seçili bölüm markdown olarak ver.',
      expectMarkdown: true,
      applyTarget: 'selection',
    });
  }

  return suggestions.slice(0, 6);
}, [markdownContent, editorSelection]);
```

**Step 3: Replace the JSX layout**

Replace the entire `return (...)` block. Remove the old `editor-panel__tools`, `editor-panel__actions`, `editor-panel__macro-actions`, `editor-panel__chat-suggestions`, `editor-panel__outline`, and `editor-panel__lint` sections.

The new JSX uses a grid layout:

```jsx
return (
  <div className="editor-panel panel editor-panel--canvas">
    <div className="panel__header">
      <div>
        <h3>
          <Code size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          AI Canvas
        </h3>
      </div>
      <div className="editor-panel__export-actions">
        <div className="editor-panel__preview-mode-actions">
          {EDITOR_PREVIEW_MODES.map((mode) => (
            <Button
              key={mode.id}
              size="sm"
              kind={editorPreviewMode === mode.id ? 'primary' : 'ghost'}
              renderIcon={mode.icon}
              onClick={() => setEditorPreviewMode(mode.id)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
        <Button
          kind="primary"
          size="sm"
          renderIcon={Play}
          onClick={generatePdf}
          disabled={isConverting || isGeneratingPdf || !markdownContent}
        >
          {isGeneratingPdf
            ? `PDF (%${Math.round(pdfJobTelemetry?.progress ?? pdfJobProgress ?? 0)})`
            : 'PDF Oluştur'}
        </Button>
        {outputPath ? (
          <Button
            kind="secondary"
            size="sm"
            renderIcon={Download}
            onClick={handleDownload}
          >
            İndir
          </Button>
        ) : null}
      </div>
    </div>

    {downloadError ? (
      <InlineNotification
        kind="error"
        title="PDF indirilemedi"
        subtitle={downloadError}
        onCloseButtonClick={() => setDownloadError(null)}
        lowContrast
      />
    ) : null}

    {aiCommandState.pending ? (
      <div className="editor-panel__ai-status">
        <InlineLoading status="active" description={aiCommandState.message || 'AI komutu çalışıyor...'} />
      </div>
    ) : null}
    {!aiCommandState.pending && aiCommandState.message ? (
      <p className="editor-panel__ai-feedback">{aiCommandState.message}</p>
    ) : null}

    <div className="editor-panel__canvas-grid">
      <div className="editor-panel__editor-area">
        {editorPreviewMode === 'markdown' ? (
          <div className="panel__content markdown-editor">
            <TextArea
              id="markdown-editor"
              labelText="Markdown İçeriği"
              hideLabel
              value={markdownContent}
              onChange={(e) => {
                setMarkdown(e.target.value);
                updateSelectionFromTarget(e.target);
              }}
              onSelect={(e) => updateSelectionFromTarget(e.target)}
              onClick={(e) => updateSelectionFromTarget(e.target)}
              onKeyUp={(e) => updateSelectionFromTarget(e.target)}
              placeholder="Markdown içeriğinizi buraya yazın..."
              rows={30}
              ref={textAreaRef}
              style={{
                height: '100%',
                fontFamily: 'IBM Plex Mono',
                resize: 'none',
              }}
            />
          </div>
        ) : (
          <div className="panel__content markdown-editor markdown-editor--preview">
            {markdownContent ? (
              <div
                className="markdown-editor__rich-preview"
                dangerouslySetInnerHTML={{ __html: richPreviewHtml }}
              />
            ) : (
              <p className="markdown-editor__preview-empty">Önizleme için markdown içeriği gerekli.</p>
            )}
          </div>
        )}
      </div>

      <AiCanvasSidebar
        reportSettings={reportSettings}
        enabledPatterns={reportSettings?.enabledPatterns}
        contextualSuggestions={contextualSuggestions}
        lintIssues={lintIssues}
        onPatternAction={(prompt) => applySuggestion(prompt.prompt, {
          expectMarkdown: prompt.expectMarkdown,
          applyTarget: 'document',
          loadingMessage: `${prompt.label} AI ile uygulanıyor...`,
        })}
        onSuggestionAction={(item) => applySuggestion(item.prompt, item)}
        onLintFix={() => dispatchAiCommand({
          kind: 'lint-fix',
          loadingMessage: 'Lint düzeltmeleri uygulanıyor...',
        })}
        disabled={aiCommandState.pending}
      />
    </div>

    <div className="editor-panel__status-bar">
      <span>{String(markdownContent || '').split(/\s+/).filter(Boolean).length} kelime</span>
      <span>{lintIssues.length} lint</span>
    </div>
  </div>
);
```

**Step 4: Remove unused imports and functions**

After the refactor, remove imports/functions that are no longer used:
- Remove `Catalog`, `Bullhorn`, `DataTable`, `ChartLine`, `Result`, `TextCreation` from icon imports (keep only `Code`, `Play`, `Download`, `Ai`)
- Remove `Dropdown` from Carbon imports if no longer used
- Remove `pushSelectionContextToAi`, `requestWizardTransform`, `requestDocStructurePack` functions
- Remove `runDesignRewrite` if its functionality is now handled via sidebar
- Keep: `dispatchAiCommand`, `applySuggestion`, `updateSelectionFromTarget`, `handleDownload`, `focusLintLocation`, `focusEditorLocation`
- Remove: `chatSuggestions` state and `AI_CHAT_SUGGESTIONS_EVENT` listener (suggestions now live in sidebar via contextualSuggestions memo)
- Remove: `severityOptions`, `ruleOptions`, `filteredIssues`, `selectedSeverityId`, `selectedRuleId` (lint detail moved to sidebar's collapsed section)
- Remove: `outlineItems` (outline is an EditorPanel feature that could be added back later if needed)

**Step 5: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add frontend/src/components/layout/EditorPanel.jsx
git commit -m "refactor(canvas): restructure EditorPanel into grid layout with AiCanvasSidebar"
```

---

### Task 11: Refactor CarbonacAiChat for embedded mode in sidebar

**Files:**
- Modify: `frontend/src/components/ai/CarbonacAiChat.jsx`

**Step 1: Update buildSuggestionPack to be profile-aware**

Replace the existing `buildSuggestionPack` function (lines ~205-251) to read `reportSettings`:

```javascript
function buildSuggestionPack({ hasMarkdown = false, hasSelection = false, reportSettings = null } = {}) {
  if (!hasMarkdown) {
    return [
      {
        label: 'Örnek markdown iskeleti oluştur',
        prompt: 'Carbon standartlarında örnek bir rapor markdown iskeleti oluştur. Çıktıyı markdown code block olarak ver.',
        expectMarkdown: true,
      },
      {
        label: 'Doküman yapısı öner',
        prompt: 'Bu doküman için kapak, içindekiler ve bölüm akışını kısa maddelerle öner.',
        expectMarkdown: false,
      },
    ];
  }

  const suggestions = [];

  if (hasSelection) {
    suggestions.push({
      label: 'Seçili metni revize et',
      prompt: 'Seçili metni daha açık, kısa ve profesyonel olacak şekilde revize et. Çıktıyı sadece seçili bölüm markdown olarak ver.',
      expectMarkdown: true,
      applyTarget: 'selection',
    });
  }

  suggestions.push({
    label: 'Tüm metni Carbon uyumlu revize et',
    prompt: 'Markdown içeriğini Carbon tasarım ilkelerine göre baştan sona revize et. Çıktıyı yalnızca markdown code block olarak ver.',
    expectMarkdown: true,
    applyTarget: 'document',
  });

  // Profile-aware suggestions
  const docType = reportSettings?.documentType || '';
  if (docType === 'analytics' || docType === 'academic') {
    suggestions.push({
      label: 'Veri görselleştirme planı',
      prompt: 'İçeriği bölüm bölüm analiz ederek hangi bölüme hangi görselleştirme türünün uygun olduğunu listele ve örnek directive ver.',
      expectMarkdown: false,
    });
  }

  suggestions.push({
    label: 'Tablo/grafik noktalarını öner',
    prompt: 'Bu dokümanda tablo ve grafik eklenebilecek bölümleri kısa gerekçelerle listele.',
    expectMarkdown: false,
  });

  return suggestions.slice(0, 6);
}
```

**Step 2: Update publishSuggestionPack to pass reportSettings**

Find the `publishSuggestionPack` callback and update it:

```javascript
const publishSuggestionPack = useCallback(() => {
  const hasMarkdown = Boolean(String(doc.markdownContent || '').trim());
  const hasSelection = Boolean(String(doc.editorSelection?.text || '').trim());
  emitAiSuggestions(buildSuggestionPack({
    hasMarkdown,
    hasSelection,
    reportSettings: doc.reportSettings || null,
  }));
}, [doc.editorSelection?.text, doc.markdownContent, doc.reportSettings, emitAiSuggestions]);
```

**Step 3: Add welcome message on mount**

After the existing `useEffect` hooks (around line 700+), add a welcome message effect:

```javascript
useEffect(() => {
  const instance = instanceRef.current;
  if (!instance) return;
  if (!embedded) return;

  const docType = doc.reportSettings?.documentType;
  if (!docType) return;

  const docLabel = DOC_TYPE_LABELS[docType] || docType;
  const audienceLabel = AUDIENCE_LABELS[doc.reportSettings?.audience] || '';
  const toneLabel = TONE_LABELS[doc.reportSettings?.tone] || '';
  const patterns = Array.isArray(doc.reportSettings?.enabledPatterns)
    ? doc.reportSettings.enabledPatterns
    : [];

  const profileParts = [docLabel, audienceLabel, toneLabel].filter(Boolean).join(' / ');
  const patternNames = patterns.length
    ? `\nEtkin pattern'lar: ${patterns.join(', ')}.`
    : '';

  const welcome = `Sihirbaz profiliniz hazır: ${profileParts}.${patternNames}\nSağ paneldeki önerilerle hızlıca içerik ekleyebilir veya doğrudan yazarak başlayabilirsiniz.`;

  addAssistantText(instance, welcome).catch(() => null);
  publishSuggestionPack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [embedded]);
```

Add the label maps at the top of the file (before the component):

```javascript
const DOC_TYPE_LABELS = {
  report: 'İş Raporu', presentation: 'Sunum', article: 'Makale',
  documentation: 'Dokümantasyon', analytics: 'Analiz Raporu', academic: 'Akademik Rapor',
};
const AUDIENCE_LABELS = {
  executive: 'Üst Yönetim', technical: 'Teknik Ekip',
  business: 'İş Birimi', general: 'Genel Okuyucu', academic: 'Akademik Çevre',
};
const TONE_LABELS = {
  formal: 'Resmi', technical: 'Teknik', casual: 'Yarı Resmi',
};
```

**Step 4: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/components/ai/CarbonacAiChat.jsx
git commit -m "feat(canvas): add profile-aware suggestions and welcome message to AI chat"
```

---

## Phase 3: Wizard Bridge

### Task 12: Add bridge button and enabled patterns display to wizard summary

**Files:**
- Modify: `frontend/src/components/wizard/ReportWizard.jsx:1246-1360`

**Step 1: Add enabled patterns display to summary**

Find the summary panel section (line ~1247). After the `report-wizard__summary-list` div and before the `report-wizard__summary-recommendation` div, add:

```jsx
{enabledPatterns.length > 0 ? (
  <div className="report-wizard__summary-patterns">
    <span className="report-wizard__summary-label">Etkin Pattern'lar</span>
    <div className="report-wizard__summary-pattern-tags">
      {patternSuggestions.filter(p => p.enabled).map((p) => (
        <span key={p.id} className="report-wizard__summary-pattern-tag">
          {p.name}
        </span>
      ))}
    </div>
  </div>
) : null}
```

**Step 2: Change "Editöre Geç" button text to "AI Canvas'a Devam Et"**

Find the button with text `'Editöre Geç'` (line ~1356) and change:

```jsx
{isFinalizing ? 'Hazırlanıyor...' : 'AI Canvas\'a Devam Et'}
```

**Step 3: Add pattern tag styles to ReportWizard.scss**

Append to `frontend/src/components/wizard/ReportWizard.scss`:

```scss
// Summary pattern tags
.report-wizard__summary-patterns {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--cds-border-subtle-01, #e0e0e0);
}

.report-wizard__summary-pattern-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.report-wizard__summary-pattern-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  background: var(--cds-layer-02, #fff);
  border: 1px solid var(--cds-border-subtle-01, #e0e0e0);
  border-radius: 4px;
  color: var(--cds-text-secondary, #525252);
}
```

**Step 4: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/components/wizard/ReportWizard.jsx frontend/src/components/wizard/ReportWizard.scss
git commit -m "feat(wizard): add pattern tags to summary and rename bridge button to AI Canvas"
```

---

### Task 13: Run full test suite and final verification

**Files:** None (verification only)

**Step 1: Run frontend tests**

Run: `cd frontend && npx vitest run`
Expected: All tests pass

**Step 2: Run production build**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Verify art-director still loads**

Run: `node -e "import('./src/ai/art-director.js').then(m => console.log('OK:', Object.keys(m)))"`
Expected: `OK: [ 'extractQaFeedback', 'getArtDirection', 'storeQaFeedback' ]`

**Step 4: Verify pattern data modules**

Run: `node -e "import('./frontend/src/data/patternCardsSlim.js').then(m => console.log(m.default.length, 'slim cards'))"`
Expected: `22 slim cards`

Run: `node -e "import('./frontend/src/data/patternPrompts.js').then(m => console.log(Object.keys(m.default).length, 'prompts'))"`
Expected: `22 prompts`

**Step 5: Check git log**

Run: `git log --oneline -15`
Expected: 13 clean commits in logical order

---

### Task Summary

| # | Phase | Description | Files | Type |
|---|-------|-------------|-------|------|
| 1 | 1 | Backend security (helmet + rate limit) | 5 commit | Commit existing |
| 2 | 1 | Pattern library enrichment | 11 commit | Commit existing |
| 3 | 1 | Print CSS + metadata | 3 commit | Commit existing |
| 4 | 1 | Lint regex fixes | 2 commit | Commit existing |
| 5 | 1 | UI refinement (header/footer) | 4 commit | Commit existing |
| 6 | 1 | Config + docs | 3 commit | Commit existing |
| 7 | 1 | Frontend refactors (events + App + Editor + Chat) | 4 commit | Commit existing |
| 8 | 2 | Pattern-to-prompt mapping | 1 create | New |
| 9 | 2 | AiCanvasSidebar component | 2 create | New |
| 10 | 2 | EditorPanel grid refactor | 1 modify | Refactor |
| 11 | 2 | CarbonacAiChat embedded mode | 1 modify | Modify |
| 12 | 3 | Wizard bridge button + patterns | 2 modify | Modify |
| 13 | 3 | Final verification | - | Verify |
