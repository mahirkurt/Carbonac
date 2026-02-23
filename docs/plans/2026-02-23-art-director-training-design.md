# Art Director AI Training Design

**Status:** Approved
**Date:** 2026-02-23
**Goal:** Teach the Art Director AI to apply Carbon Design System best practices at an exceptional level through a Pattern Knowledge Base and Gemini fine-tuning.

## Strategy

Two-phase approach:
1. **Pattern Knowledge Base** — Structured design rules, component compositions, and Carbon token references that enrich art director prompts at runtime.
2. **Gemini Fine-Tuning** — Once enough approved examples are collected (50+), fine-tune a specialized layout planning model.

## Phase 1: Pattern Knowledge Base

### Directory Structure

```
library/
  manifest.json              ← existing (keep as-is)
  patterns/                  ← NEW: structured pattern cards
    cover-page-hero.json
    chapter-opener.json
    executive-summary.json
    key-findings-list.json
    data-table-spread.json
    chart-composition.json
    hero-stat-with-quote.json
    figure-with-caption.json
    case-study-module.json
    action-box.json
  examples/                  ← NEW: approved input/output pairs
    example-001/
      input.md               ← source markdown
      layout.json            ← art director output (layoutJson)
      score.json             ← QA + manual review score
      notes.md               ← what makes this good
    example-002/
      ...
```

### Pattern Card Schema

Each pattern card in `library/patterns/` follows this schema:

```json
{
  "id": "cover-page-hero",
  "name": "Cover Page Hero",
  "description": "Full-bleed cover with title, subtitle, date, and brand element",
  "grid": {
    "columns": "1-16 (full-width)",
    "verticalAlignment": "center",
    "margins": "bleed-extend"
  },
  "components": ["RichText (title)", "RichText (subtitle)", "PatternBlock (brand)"],
  "rules": [
    "Title should use heading-07 or display-01 type scale",
    "Max 2 colors from primary palette",
    "No body text on cover — only title, subtitle, date, logo",
    "Background: solid brand color or subtle gradient, never white"
  ],
  "carbonTokens": {
    "typography": ["$heading-07", "$body-compact-01"],
    "spacing": ["$spacing-09 (padding)", "$spacing-07 (gap)"],
    "colors": ["$blue-60 (primary)", "$gray-100 (text)"]
  },
  "references": ["ibm-ix-brand-guidelines", "ibm-think-summit-guidelines"],
  "antiPatterns": [
    "Don't use more than 3 font sizes on cover",
    "Don't place charts or tables on cover page"
  ]
}
```

### How Patterns Feed Into Art Director

**Current flow (shallow):**
```
markdown → loadReferenceBrief() → tag-title list (6 lines)
         → buildDocumentPlanPrompt()
         → buildLayoutPlanPrompt()
```

**New flow (deep):**
```
markdown → analyzeDocumentIntent() → {docType, audience, contentSignals}
         → selectRelevantPatterns(intent) → 3-5 pattern cards (~2K tokens)
         → loadSimilarExamples(intent) → 1-2 layout JSONs (~2K tokens)
         → buildDocumentPlanPrompt(patterns, examples)
         → buildLayoutPlanPrompt(patterns, examples)
```

New functions in `art-director.js`:
- `analyzeDocumentIntent(markdown, metadata)` — Lightweight intent detection: doc type, audience, data density, content signals (tables, charts, quotes present).
- `selectRelevantPatterns(intent)` — Loads pattern cards from `library/patterns/`, ranks by tag match to detected intent, returns top 3-5.
- `loadSimilarExamples(intent)` — Finds 1-2 approved examples with matching tags/docType, returns their layout JSONs as few-shot context.
- Updated `buildDocumentPlanPrompt()` and `buildLayoutPlanPrompt()` to inject pattern rules and example layouts.

**Prompt budget:** ~4K additional tokens (well within Gemini context). Pattern cards compressed to key rules only — no verbose descriptions.

## Phase 2: Example Collection Pipeline

### Semi-Automatic Collection

After each PDF generation:
1. QA pipeline scores the output (existing)
2. If QA score >= threshold (configurable, default: 85), flag the output as a candidate
3. Store candidate in a staging area (`library/examples-staging/`)
4. Human reviews and approves/rejects via CLI tool or (future) UI
5. Approved examples move to `library/examples/` with score metadata

### Example Score Schema

```json
{
  "qaScore": 92,
  "manualReview": "approved",
  "strengths": ["good grid variety", "appropriate chart types", "clean cover"],
  "weaknesses": [],
  "tags": ["report", "data-heavy", "sustainability"],
  "template": "corporate-standard",
  "docType": "annual-report",
  "createdAt": "2026-02-23T14:00:00Z"
}
```

### Collection Tooling

- `scripts/training/collect-example.js` — Archive a completed job's input/output as a candidate
- `scripts/training/review-candidates.js` — List staging candidates, approve/reject interactively
- `scripts/training/list-examples.js` — Show approved examples with stats

## Phase 3: Gemini Fine-Tuning

### Training Data Format

Gemini Tuning API expects JSONL:

```jsonl
{"text_input": "Document type: annual-report\nAudience: executives\nTemplate: corporate-standard\nSections: 5\nHas tables: yes\nHas charts: yes\n\nMarkdown:\n# Annual Report 2025\n...", "output": "{\"layoutProfile\":\"symmetric\",\"printProfile\":\"pagedjs-a4\",\"components\":[...]}"}
```

### Pipeline Scripts

- `scripts/training/export-training-data.js` — Reads approved examples, formats as JSONL for Gemini tuning
- `scripts/training/tune-model.js` — Calls Gemini Tuning API to create tuned model, outputs model ID
- `scripts/training/evaluate-model.js` — Runs held-out test set (20% of examples) against tuned vs base model, scores with QA pipeline, reports comparison

### Model Versioning

- Each fine-tune produces a versioned model ID: `tunedModels/carbonac-art-v1`, `v2`, etc.
- Set via `GEMINI_MODEL` env var (existing mechanism)
- Rollback: revert env var to base model
- Evaluation results stored in `library/evaluations/`

### Re-tuning Cadence

- After 20+ new approved examples
- After significant template/component schema changes
- Quarterly baseline

## Implementation Priority

| Phase | Scope | Prerequisite |
|-------|-------|--------------|
| 1a | Create pattern cards for 10 existing pattern types | None |
| 1b | Update art-director.js to load + inject pattern cards | 1a |
| 1c | Add `analyzeDocumentIntent()` for pattern selection | 1b |
| 2a | Example collection tooling (staging + approval scripts) | None |
| 2b | Hook collection into worker.js after QA step | 2a |
| 2c | Bootstrap 15-20 examples from existing good outputs | 2b |
| 3a | Export training data script | 2c (50+ examples) |
| 3b | Fine-tuning script + evaluation | 3a |
| 3c | Deploy tuned model, A/B test | 3b |

Phases 1 and 2 can run in parallel. Phase 3 requires 50+ approved examples from Phase 2.

## Success Metrics

- **Layout quality score:** Average QA score of generated PDFs increases by 15%+
- **Pattern adherence:** Art director uses appropriate patterns for document type (manual audit, 20-doc sample)
- **Grid variety:** Decrease in consecutive full-width components (measured by layout JSON analysis)
- **Fine-tuned model:** Outperforms base model on held-out test set by measurable QA score margin
