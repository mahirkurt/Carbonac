# AI Canvas Release — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Goal:** Unify uncommitted work into a cohesive release where the Wizard hands off to an AI-powered editor canvas with profile-aware suggestions.

---

## Decisions

- **Wizard → Chat relationship:** Sequential handoff — Wizard builds profile, AI Chat picks up with full awareness
- **Handoff UX:** Explicit bridge — "AI Canvas'a Devam Et" button on wizard summary opens editor with pre-populated context
- **Suggestion personalization:** Profile-aware using `usePatternSuggestions` scoring logic + pattern-to-prompt mapping
- **Backend changes:** Ship together (helmet, rate limiting, error handling)
- **Success metric:** End-to-end flow works — Wizard → Editor → AI Chat → PDF with personalized suggestions

---

## 1. Architecture Overview

Replace the current EditorPanel's toolbar-driven model with a suggestion-driven AI Canvas.

### Current
```
Wizard → [step transition] → EditorPanel
                                ├── TextArea (markdown editor)
                                ├── Toolbar (dropdowns, buttons)
                                ├── Lint panel (sidebar)
                                └── CarbonacAiChat (floating widget)
```

### Proposed
```
Wizard → [bridge button] → AI Canvas
                              ├── Editor Area
                              │     ├── TextArea (markdown, unchanged)
                              │     └── Preview pane (rich HTML, unchanged)
                              ├── Suggestion Sidebar (NEW)
                              │     ├── WizardProfileSummary (compact)
                              │     ├── PatternActionCards (from enabledPatterns)
                              │     ├── ContextualSuggestions (dynamic)
                              │     └── LintSummary (collapsed)
                              └── CarbonacAiChat (embedded in sidebar, not floating)
```

Key changes:
- CarbonacAiChat moves from floating widget to embedded in sidebar
- Suggestion Sidebar replaces old toolbar — pattern-driven actions live here
- Toolbar simplifies to: Preview mode toggle, Generate PDF button, Restart wizard
- Lint panel collapses into sidebar as expandable section

---

## 2. Wizard-to-Canvas Bridge

### Flow
```
Wizard Summary Screen
  ├── Profile summary (existing)
  ├── Enabled patterns list (from wizard toggles)
  ├── Template selection result (existing)
  └── [AI Canvas'a Devam Et] button (primary CTA)
         │
         ▼
    Editor opens with:
      1. AI Chat sends welcome message (auto, no user action)
      2. Suggestion sidebar populates with pattern actions
      3. Wizard profile summary pinned at top of sidebar
```

### Welcome Message

Client-side generated (no API call). Reads `reportSettings` and `enabledPatterns` from DocumentContext:

```
"Sihirbaz profiliniz hazır: [docType label] / [audience label] / [tone label].
Etkin pattern'lar: [pattern names, comma-separated].
Sağ paneldeki önerilerle hızlıca içerik ekleyebilir veya doğrudan yazarak başlayabilirsiniz."
```

### No-Wizard Path

If user skips wizard (direct editor access), sidebar shows generic suggestions (current `buildSuggestionPack` behavior with `hasMarkdown: false`). No welcome message. Sidebar still works with less personalization.

---

## 3. Suggestion Engine & Pattern Action Cards

### Suggestion Types

| Tier | Source | Example | When shown |
|------|--------|---------|------------|
| **Pattern Actions** | `enabledPatterns` from wizard | "Timeline bloğu ekle", "KPI grid oluştur" | Always (if wizard completed) |
| **Contextual** | Document analysis | "Kapak sayfası eksik", "Grafik noktaları öner" | After markdown exists |
| **Selection** | Text selection in editor | "Seçili metni revize et", "Tablo formatına dönüştür" | When text is selected |

### Pattern-to-Prompt Mapping

New data module `frontend/src/data/patternPrompts.js`:

```javascript
const PATTERN_PROMPTS = {
  'kpi-grid': {
    label: 'KPI grid oluştur',
    prompt: 'Markdown içeriğindeki sayısal verileri kullanarak :::data-table directive ile 3-6 KPI grid bloğu oluştur.',
    expectMarkdown: true,
    icon: 'Grid',
  },
  'timeline-process': {
    label: 'Süreç akışı ekle',
    prompt: 'İçerikteki sıralı adımları :::timeline directive formatında süreç akışı bloğuna dönüştür.',
    expectMarkdown: true,
    icon: 'Time',
  },
  // ... one entry per pattern (22 total)
};
```

### Contextual Suggestion Logic

`buildSuggestionPack()` refactored to accept `reportSettings` and scan markdown:

- No markdown → "Örnek iskelet oluştur", "Kapak + içindekiler ekle"
- Has markdown, no cover → "Kapak sayfası ekle"
- Has markdown, no TOC, `isLongForm` → "İçindekiler tablosu ekle"
- Has selection → "Seçili metni revize et" prepended

### Sidebar Rendering

Pattern actions render as compact Carbon `ClickableTile` cards (icon + label + one-click execute). No scores shown. Sorted by relevance from `usePatternSuggestions`.

Clicked actions dispatch via existing `AI_APPLY_COMMAND_EVENT` system.

---

## 4. Canvas Layout

### CSS Grid Structure

```
┌──────────────────────────────────────────────────────────┐
│  Minimal Toolbar: [Preview Mode ▾] [Generate PDF] [⟳]   │
├────────────────────────────────────┬─────────────────────┤
│                                    │  Suggestion Sidebar  │
│                                    │  ┌─────────────────┐ │
│         Editor / Preview           │  │ Profile Summary  │ │
│                                    │  │ (collapsible)    │ │
│   (TextArea or Rich HTML preview)  │  ├─────────────────┤ │
│                                    │  │ Pattern Actions  │ │
│                                    │  │  [KPI Grid    ▶] │ │
│                                    │  │  [Timeline    ▶] │ │
│                                    │  ├─────────────────┤ │
│                                    │  │ Context Suggest. │ │
│                                    │  │  [Kapak ekle  ▶] │ │
│                                    │  ├─────────────────┤ │
│                                    │  │ Lint (collapsed) │ │
│                                    │  ├─────────────────┤ │
│                                    │  │ AI Chat          │ │
│                                    │  │ (embedded, mini) │ │
│                                    │  └─────────────────┘ │
├────────────────────────────────────┴─────────────────────┤
│  Status bar: word count | lint count | template name      │
└──────────────────────────────────────────────────────────┘
```

### Layout Details

- Sidebar: ~320px fixed width, collapsible on narrow screens
- Editor: remaining space (TextArea + preview toggle unchanged)
- AI Chat: embedded at sidebar bottom, compact mode, input always visible
- Sidebar sections: Carbon AccordionItem (collapse/expand)
- No new components for editor area — TextArea, preview, selection handling stay same

### New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AiCanvasSidebar` | Container for all sidebar sections | `frontend/src/components/canvas/` |
| `ProfileSummaryCard` | Compact wizard profile display | Inside sidebar |
| `PatternActionList` | Clickable pattern action tiles | Inside sidebar |
| `ContextualSuggestionList` | Dynamic doc-analysis suggestions | Inside sidebar |

### EditorPanel Changes

EditorPanel becomes simpler — orchestrates grid layout (editor + sidebar slot) and delegates:
- Toolbar logic (preview mode, PDF generation)
- Text selection tracking
- AI command dispatch/result handling (existing event system)

---

## 5. Commit Strategy

### Phase 1: Commit existing changes (as-is, logical batches)

| Commit | Files | Message |
|--------|-------|---------|
| A | backend/server.js, middleware/*.js, package.json, package-lock.json | `feat(backend): add helmet security headers and API rate limiting` |
| B | library/patterns/*.json (10), src/ai/art-director.js | `feat(patterns): enrich all patterns with printBehavior and accessibilityNotes` |
| C | styles/print/print-base.css, src/utils/markdown-cleanup.js, backend/lib/job-helpers.js | `feat(print): add TOC and back cover CSS profiles with metadata support` |
| D | frontend/src/utils/markdownLint.js, markdownLint.test.js | `fix(lint): correct directive regex escaping in markdown linter` |
| E | AppHeader.jsx, AppHeader.scss, AppFooter.scss, LandingPage.jsx | `refactor(ui): modernize header/footer chrome and update landing copy` |
| F | .vscode/settings.json, Carbonac.code-workspace | `chore: update workspace config and VS Code theme` |
| G | docs/CARBON-AI-CHAT-ENTEGRE.md | `docs: document 2026-02 AI chat integration updates` |
| H | editorConstants.js, App.jsx | `refactor(frontend): centralize AI event constants, remove template workspace` |

### Phase 2: Refactor existing AI canvas code

| Commit | What |
|--------|------|
| I | Refactor EditorPanel into grid layout (editor area + sidebar slot) |
| J | Move `buildSuggestionPack` to new profile-aware suggestion engine |
| K | Create `AiCanvasSidebar` + sub-components |

### Phase 3: New glue code

| Commit | What |
|--------|------|
| L | Pattern-to-prompt mapping data module |
| M | Wizard bridge button + welcome message |
| N | Contextual suggestion logic (document analysis) |
| O | Tests + final verification |

---

## Tech Stack

- React 19, Carbon Components v11 (Accordion, ClickableTile, Toggle)
- Vite 7
- Existing event system: `AI_APPLY_COMMAND_EVENT`, `AI_COMMAND_RESULT_EVENT`, `AI_CHAT_SUGGESTIONS_EVENT`
- Existing services: `askAi`, `analyzeAi` from aiService
- Reused hooks: `usePatternSuggestions`, `useDocument`
