# ReportWizard AI Integration Upgrade — Design Document

**Date:** 2026-02-24
**Approach:** Hybrid (client-side pattern suggestions + server-side template selection)

## Problem

The ReportWizard has a 9-step adaptive flow that collects user intent, but its AI integration is limited:
- Template selection uses fragile keyword matching (`text.includes('dataviz')`)
- Chat responses are generic per-question, not context-aware
- The 22-card Pattern Knowledge Base (built for the Art Director) is not surfaced to users
- Users have no visibility into which layout patterns will be used in their PDF

## Solution Overview

Bring the Pattern KB into the wizard conversation so users see real-time pattern suggestions as they answer questions, can toggle patterns on/off, and get smarter template selection that considers their pattern preferences.

## Architecture

### 1. Slim Pattern Cards (Build-time Data)

Generate a lightweight version of the 22 pattern cards for the frontend bundle (~8KB):

```json
{
  "id": "kpi-grid",
  "name": "KPI Grid",
  "description": "3-6 key performance indicators with large display numbers...",
  "docTypeAffinity": ["dashboard", "report", "annual-report"],
  "icon": "ChartBar",
  "tags": ["data", "metrics", "dashboard"]
}
```

- **File:** `frontend/src/data/patternCardsSlim.js`
- **Fields:** id, name, description (truncated), docTypeAffinity, icon (Carbon icon name), tags (derived from content)
- **Size:** ~8KB for 22 cards (vs ~50KB for full cards)
- **Sync:** Manual update when pattern cards change; not auto-generated

### 2. Client-Side Intent Analysis & Pattern Selection

A `usePatternSuggestions` custom hook mirrors the art-director.js scoring logic:

```
frontend/src/hooks/usePatternSuggestions.js
├── analyzeWizardIntent(selectedOptions) → intent signals
├── scorePattern(card, intent) → numeric score
└── usePatternSuggestions(selectedOptions) → sorted cards with enabled state
```

**Intent mapping from wizard answers:**
| Wizard Answer | Intent Signal |
|---|---|
| documentType → 'analytics' | docType='analytics', isDataHeavy=true |
| emphasis includes 'data' | hasTables=true |
| emphasis includes 'visuals' | hasCharts=true |
| emphasis includes 'narrative' | hasQuotes=true |
| pageGoal → 'long' | isLongForm=true, sectionCount≈8 |
| documentType → 'academic' | hasMethodology=true |

**Scoring mirrors `selectRelevantPatterns()` from art-director.js:**
- docTypeAffinity match: +3
- Content signal match: +2 or +3
- Universal patterns (cover, exec summary): +1
- Returns top 7, sorted by score (score not shown to user)

**State:** `suggestedPatterns` (from hook) + `enabledPatterns` (user toggles) stored in local state, passed to `reportSettings` at summary.

### 3. Chat UI — Pattern Suggestion Cards

Pattern cards appear in the AI chat as a special message type after the "emphasis" question (step 4), when enough context exists to make meaningful suggestions.

**Rendering:**
- Each pattern: Carbon `Toggle` + name + one-line description + icon
- Toggling off removes from `enabledPatterns[]`
- Pattern list updates in-place as user answers subsequent questions (new answers may add/remove patterns)
- Cards styled as a distinct "suggestion block" within the chat bubble (bordered, g10 background)

**Trigger:** Patterns appear after question 4 (emphasis). Earlier questions don't provide enough signal.

**Live update:** When user answers questions 5-9, the `usePatternSuggestions` hook recomputes. If the top-7 list changes, the pattern card block re-renders in place.

### 4. Enhanced Template Selection

The existing `applyBackgroundDesignProfile()` at the summary step is enhanced:

**A. AI prompt includes enabled patterns:**
```
User profile: {documentType, audience, purpose, emphasis, ...}
Enabled patterns: [kpi-grid, chart-composition, data-table-spread, ...]
```

This gives Gemini better context for selecting the right template.

**B. Heuristic scoring boost:**
`scoreTemplateCandidate()` gets bonus points when template metadata matches enabled patterns:
- Template has "dataviz" tag + user enabled kpi-grid → +5
- Template has "grid" tag + user enabled data-table-spread → +5
- Template has "narrative" tag + user enabled two-column-narrative → +5

**C. Wizard patterns do NOT override Art Director:**
When PDF generation starts, the Art Director runs its own `selectRelevantPatterns()` based on actual markdown content. Wizard pattern selections only influence template choice in the wizard, not the PDF pipeline.

### 5. Improved AI Chat Responses

Chat responses become context-aware without adding Gemini API calls:

**A. Accumulated context:** Each response references the full profile so far, not just the latest answer.
- Before: "Analitik seçtiniz."
- After: "Executive hedef kitlesi için analitik rapor — net ve öz veri sunumu öncelikli."

**B. Pattern-informed tips:** After patterns are suggested, subsequent responses reference them.
- "Uzun rapor seçtiniz — İçindekiler ve Appendix pattern'ları da eklendi."

**C. Template selection feedback:** In summary, AI explains its choice.
- "Carbon-data template'i seçildi çünkü KPI Grid ve Chart Composition pattern'larınızla en yüksek uyumu gösteriyor."

All responses remain hardcoded (instant, no API call) but richer.

## Data Flow

```
User answers question
  → selectedOptions updated
  → usePatternSuggestions recomputes (client-side, instant)
  → Chat displays AI response + pattern cards (after step 4)
  → User toggles patterns on/off
  → enabledPatterns[] updated

User reaches summary
  → applyBackgroundDesignProfile() fires
  → Sends wizard profile + enabledPatterns to AI for template selection
  → AI returns {templateKey, confidence, reasoning}
  → Summary shows template + explanation

User clicks "Continue to Editor"
  → reportSettings.enabledPatterns saved to context
  → setStep(EDITOR)
  → Art Director later runs independently with actual content
```

## Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `frontend/src/data/patternCardsSlim.js` | Create | Slim card data (~8KB) |
| `frontend/src/hooks/usePatternSuggestions.js` | Create | Intent analysis + pattern scoring hook |
| `frontend/src/components/wizard/PatternSuggestionCards.jsx` | Create | Toggle-able pattern card UI component |
| `frontend/src/components/wizard/ReportWizard.jsx` | Modify | Integrate hook + cards + enhanced responses |
| `frontend/src/components/wizard/ReportWizard.scss` | Modify | Styles for pattern cards |
| `frontend/src/contexts/DocumentContext.jsx` | Modify | Add enabledPatterns to reportSettings |

## Constraints

- No new API endpoints
- No Gemini calls during Q&A (only at summary for template selection)
- Pattern card bundle < 10KB
- Pattern toggles are UX sugar — Art Director always makes its own decisions during PDF generation
- All text in Turkish (matching existing wizard)
