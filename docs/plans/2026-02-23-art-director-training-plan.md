# Art Director AI Training Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Teach the Art Director AI to apply Carbon Design System best practices through a Pattern Knowledge Base, example collection pipeline, and Gemini fine-tuning infrastructure.

**Architecture:** Three phases — (1) Create structured pattern cards that enrich art director prompts with real design rules and Carbon tokens, (2) Build semi-automatic collection of good input/output examples, (3) Export training data and fine-tune a Gemini model. Phase 1 modifies `src/ai/art-director.js` to load rich pattern cards instead of shallow tag briefs. Phase 2 hooks into `src/convert-paged.js` after QA scoring to archive approved examples. Phase 3 adds CLI scripts under `scripts/training/`.

**Tech Stack:** Node.js (ES modules), Gemini Tuning API, JSON pattern schemas, existing art-director.js + convert-paged.js + worker.js

**Design doc:** `docs/plans/2026-02-23-art-director-training-design.md`

---

### Task 1: Create pattern card schema and first 3 pattern cards

**Files:**
- Create: `library/patterns/cover-page-hero.json`
- Create: `library/patterns/executive-summary.json`
- Create: `library/patterns/chapter-opener.json`

**Step 1: Create the patterns directory**

Run: `mkdir -p library/patterns`

**Step 2: Create `library/patterns/cover-page-hero.json`**

```json
{
  "id": "cover-page-hero",
  "name": "Cover Page Hero",
  "description": "Full-bleed cover with title, subtitle, date, and brand element. Sets the visual tone for the entire document.",
  "grid": {
    "columns": "1-16 (full-width)",
    "verticalAlignment": "center",
    "margins": "bleed-extend"
  },
  "components": [
    "PatternBlock (cover-page-hero)",
    "RichText (title — heading-07 or display-01)",
    "RichText (subtitle — body-compact-01)"
  ],
  "rules": [
    "Title uses heading-07 or display-01 type scale — never smaller",
    "Max 2 colors from primary palette on cover",
    "No body text on cover — only title, subtitle, date, logo",
    "Background: solid brand color or subtle gradient, never plain white",
    "Subtitle uses body-compact-01, muted color (text-secondary)",
    "Date/author placed at bottom with spacing-09 from subtitle",
    "Full colSpan: 16 with offset: 0 — no split layouts on cover"
  ],
  "carbonTokens": {
    "typography": ["$display-01 or $heading-07 (title)", "$body-compact-01 (subtitle)", "$label-01 (date/author)"],
    "spacing": ["$spacing-09 (section padding)", "$spacing-07 (element gap)", "$spacing-05 (inner)"],
    "colors": ["$blue-60 (primary accent)", "$gray-100 (title text)", "$text-secondary (subtitle)"]
  },
  "layoutProps": {
    "colSpan": 16,
    "offset": 0,
    "forceBreakAfter": true
  },
  "references": ["ibm-ix-brand-guidelines", "ibm-think-summit-guidelines"],
  "antiPatterns": [
    "Never use more than 3 font sizes on cover",
    "Never place charts, tables, or data on cover page",
    "Never use colSpan < 16 — cover must be full-width",
    "Avoid g90/g100 themes on cover unless document is fully dark-themed",
    "No MarginNote on cover page"
  ],
  "docTypeAffinity": ["report", "whitepaper", "annual-report", "case-study", "position-paper"]
}
```

**Step 3: Create `library/patterns/executive-summary.json`**

```json
{
  "id": "executive-summary",
  "name": "Executive Summary",
  "description": "Structured summary block with key metrics, findings list, and methodology note. Placed early in the document after cover.",
  "grid": {
    "columns": "12-16 (near full-width, slight offset optional)",
    "verticalAlignment": "top",
    "margins": "standard"
  },
  "components": [
    "PatternBlock (executive-summary)",
    "HighlightBox (key findings — tone: info)",
    "RichText (methodology note — body-compact-02)"
  ],
  "rules": [
    "Place immediately after cover page or first chapter opener",
    "Use g10 theme for visual distinction from surrounding content",
    "Include 3-5 key findings as bullet points, not paragraphs",
    "Each finding should be one sentence, executive tone, no jargon",
    "If metrics exist, lead with the most impactful number",
    "Methodology note goes in MarginNote or small text below findings",
    "colSpan: 12 with offset: 2 for visual breathing room, or full-width 16"
  ],
  "carbonTokens": {
    "typography": ["$heading-03 (section title)", "$body-long-02 (findings)", "$label-01 (methodology)"],
    "spacing": ["$spacing-07 (section gap)", "$spacing-05 (item gap)", "$spacing-03 (inner)"],
    "colors": ["$blue-60 (accent)", "$text-primary (findings)", "$text-helper (methodology)"]
  },
  "layoutProps": {
    "colSpan": 12,
    "offset": 2,
    "preferredTheme": "g10"
  },
  "references": ["ibm-design-for-sustainability", "ibm-engineering-for-sustainability"],
  "antiPatterns": [
    "Never place executive summary after the second section — it belongs early",
    "Don't include more than 5 findings — distill, don't dump",
    "Don't use CarbonChart inside executive summary — it's text-focused",
    "Avoid full paragraphs — use concise bullet points"
  ],
  "docTypeAffinity": ["report", "whitepaper", "annual-report", "position-paper", "research"]
}
```

**Step 4: Create `library/patterns/chapter-opener.json`**

```json
{
  "id": "chapter-opener",
  "name": "Chapter Opener",
  "description": "Section divider with part number, title, and optional subtitle. Creates visual rhythm between major document sections.",
  "grid": {
    "columns": "16 (full-width)",
    "verticalAlignment": "center",
    "margins": "standard"
  },
  "components": [
    "PatternBlock (chapter-opener)",
    "RichText (part number — label-01, muted)",
    "RichText (title — heading-05 or heading-04)"
  ],
  "rules": [
    "Always force page break before chapter opener",
    "Part number uses label-01 with text-helper color, uppercase",
    "Title uses heading-05 for major parts, heading-04 for sub-parts",
    "Optional subtitle in body-compact-01, text-secondary",
    "Use white theme with subtle accent line (blue-60, 2px) above title",
    "Minimal content — no body text, no data, no charts",
    "Use for documents with 3+ major sections; skip for short docs",
    "Maximum 4-5 chapter openers per document to avoid fragmentation"
  ],
  "carbonTokens": {
    "typography": ["$heading-05 (title)", "$label-01 (part number)", "$body-compact-01 (subtitle)"],
    "spacing": ["$spacing-09 (top padding)", "$spacing-07 (title gap)", "$spacing-12 (bottom padding)"],
    "colors": ["$blue-60 (accent line)", "$text-primary (title)", "$text-helper (part number)"]
  },
  "layoutProps": {
    "colSpan": 16,
    "offset": 0,
    "forceBreakBefore": true
  },
  "references": ["ibm-ix-brand-guidelines", "ibm-think-summit-guidelines", "ibm-event-experience-design-toolkit"],
  "antiPatterns": [
    "Don't use for documents with fewer than 3 sections",
    "Don't include body text or data on chapter opener page",
    "Don't use more than 5 chapter openers — creates too many empty pages",
    "Don't use g90/g100 theme unless the entire document is dark-themed"
  ],
  "docTypeAffinity": ["report", "annual-report", "whitepaper", "case-study", "guide"]
}
```

**Step 5: Verify JSON is valid**

Run: `node -e "for (const f of ['cover-page-hero','executive-summary','chapter-opener']) { JSON.parse(require('fs').readFileSync('library/patterns/'+f+'.json','utf-8')); console.log(f+': OK'); }"`
Expected: All three print OK

**Step 6: Commit**

```bash
git add library/patterns/
git commit -m "feat(ai): add first 3 pattern cards for art director knowledge base"
```

---

### Task 2: Create remaining 7 pattern cards

**Files:**
- Create: `library/patterns/key-findings-list.json`
- Create: `library/patterns/hero-stat-with-quote.json`
- Create: `library/patterns/data-table-spread.json`
- Create: `library/patterns/chart-composition.json`
- Create: `library/patterns/action-box.json`
- Create: `library/patterns/case-study-module.json`
- Create: `library/patterns/kpi-grid.json`

**Step 1: Create each pattern card**

Follow the same schema as Task 1. Each card should include:
- `id`, `name`, `description`
- `grid` (column usage, alignment)
- `components` (which component types are used)
- `rules` (5-8 specific design rules with Carbon token references)
- `carbonTokens` (typography, spacing, colors with exact token names)
- `layoutProps` (default colSpan, offset, break behavior)
- `references` (which IBM reference PDFs demonstrate this pattern)
- `antiPatterns` (3-5 things to never do)
- `docTypeAffinity` (which document types benefit from this pattern)

Key content for each card:

**key-findings-list:** Numbered findings with severity markers. colSpan 12, offset 2. Use HighlightBox children. Max 7 findings. Each finding: one sentence + severity tag (info/warning/success/danger).

**hero-stat-with-quote:** Large statistic (display-02) paired with expert quote. Split layout: 6/10 or 10/6. Stat on left (blue-60 accent), quote on right (italic, body-long-02). References: ibm-design-for-sustainability, ibm-engineering-for-sustainability.

**data-table-spread:** Full-width DataTable with structured header. colSpan 16 or 14 with offset 1. Use condensed grid for dense data. Zebra-striped rows. Max 8 columns visible. References: ibm-garage-style-guide.

**chart-composition:** CarbonChart with adjacent insight text. Split layout: 10/6 (chart/text) or 6/10. Chart types mapped to data hints (time-series→line, composition→donut, distribution→histogram). Always include dataHint.

**action-box:** Call-to-action with recommendations. colSpan 12, offset 2. g10 theme. Bulleted recommendations (max 5). Uses HighlightBox with tone: success or info. Placed at document end before appendix.

**case-study-module:** Bordered challenge/solution/result structure. colSpan 14, offset 1. Three-part internal structure. Each part: heading-04 label + body-long-01 content. Subtle border-left (blue-60, 4px).

**kpi-grid:** 3-4 column grid of key metrics. colSpan 16, internal 4/4/4/4 or 5/5/6. Each KPI: display-01 number + label-01 caption. g10 theme. Max 6 KPIs.

**Step 2: Validate all pattern JSONs**

Run: `node -e "const fs=require('fs'); const dir='library/patterns'; fs.readdirSync(dir).filter(f=>f.endsWith('.json')).forEach(f=>{JSON.parse(fs.readFileSync(dir+'/'+f,'utf-8'));console.log(f+': OK')})"`
Expected: All 10 files print OK

**Step 3: Commit**

```bash
git add library/patterns/
git commit -m "feat(ai): add remaining 7 pattern cards for art director KB"
```

---

### Task 3: Implement `loadPatternCards()` in art-director.js

This replaces the shallow `loadReferenceBrief()` with a rich pattern loading system.

**Files:**
- Modify: `src/ai/art-director.js` (lines 467-524: `loadReferenceBrief()` function area)

**Step 1: Add a new `loadPatternCards()` function after `loadReferenceBrief()`**

At line ~525 (after the existing `loadReferenceBrief` function), add:

```javascript
let patternCardsCache = null;

async function loadPatternCards() {
  if (patternCardsCache !== null) {
    return patternCardsCache;
  }
  try {
    const projectRoot = getProjectRoot();
    const patternsDir = path.join(projectRoot, 'library', 'patterns');
    const files = await fs.readdir(patternsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const cards = [];
    for (const file of jsonFiles) {
      const raw = await fs.readFile(path.join(patternsDir, file), 'utf-8');
      cards.push(JSON.parse(raw));
    }
    patternCardsCache = cards;
    return cards;
  } catch (error) {
    console.warn(`[art-director] Pattern cards unavailable: ${error.message}`);
    patternCardsCache = [];
    return [];
  }
}
```

**Step 2: Add `selectRelevantPatterns()` function**

```javascript
function analyzeDocumentIntent(metadata, content, toc) {
  const docType = (metadata.docType || metadata.documentType || 'report').toLowerCase();
  const audience = (metadata.audience || 'general').toLowerCase();
  const hasTables = /\|.*\|/.test(content || '');
  const hasCharts = /chart|grafik|figure|diagram/i.test(content || '');
  const hasQuotes = /["\u201C\u201D]|alinti|quote/i.test(content || '');
  const sectionCount = (toc || []).filter((t) => t.level === 1 || t.level === 2).length;
  const isDataHeavy = hasTables && sectionCount >= 3;

  return { docType, audience, hasTables, hasCharts, hasQuotes, sectionCount, isDataHeavy };
}

function selectRelevantPatterns(allCards, intent) {
  if (!allCards.length) return [];

  const scored = allCards.map((card) => {
    let score = 0;

    // Doc type affinity match
    if (Array.isArray(card.docTypeAffinity)) {
      if (card.docTypeAffinity.some((t) => intent.docType.includes(t))) {
        score += 3;
      }
    }

    // Content signal matches
    if (intent.hasTables && ['data-table-spread', 'chart-composition', 'kpi-grid'].includes(card.id)) {
      score += 2;
    }
    if (intent.hasQuotes && card.id === 'hero-stat-with-quote') {
      score += 2;
    }
    if (intent.sectionCount >= 3 && card.id === 'chapter-opener') {
      score += 2;
    }
    if (intent.isDataHeavy && ['kpi-grid', 'chart-composition'].includes(card.id)) {
      score += 1;
    }

    // Always include cover and executive summary for reports
    if (['cover-page-hero', 'executive-summary'].includes(card.id)) {
      score += 1;
    }

    return { card, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.card);
}
```

**Step 3: Add `formatPatternsForPrompt()` function**

```javascript
function formatPatternsForPrompt(patterns) {
  if (!patterns.length) return '';
  const lines = patterns.map((p) => {
    const rules = (p.rules || []).slice(0, 4).map((r) => `  - ${r}`).join('\n');
    const anti = (p.antiPatterns || []).slice(0, 2).map((r) => `  - AVOID: ${r}`).join('\n');
    const tokens = p.carbonTokens
      ? `  Tokens: ${Object.entries(p.carbonTokens).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(', ') : v}`).join('; ')}`
      : '';
    return `### ${p.name} (${p.id})\n${p.description}\nGrid: ${p.grid?.columns || 'full-width'}\nRules:\n${rules}\n${anti}\n${tokens}`;
  });
  return `\n## Design Pattern Reference (apply these rules):\n\n${lines.join('\n\n')}`;
}
```

**Step 4: Verify the file is syntactically valid**

Run: `node -e "import('./src/ai/art-director.js').then(()=>console.log('OK')).catch(e=>console.error(e.message))"`
Expected: OK (or a non-syntax error about missing env vars)

**Step 5: Commit**

```bash
git add src/ai/art-director.js
git commit -m "feat(ai): add pattern card loading and selection for art director"
```

---

### Task 4: Wire pattern cards into art director prompts

**Files:**
- Modify: `src/ai/art-director.js` (lines 180-298: `buildSystemPrompt`, lines 315-465: `buildDocumentPlanPrompt` + `buildLayoutPlanPrompt`, lines 1219-1350: `getArtDirection`)

**Step 1: Update `getArtDirection()` to load and select pattern cards**

In the `getArtDirection` function (line ~1219), after `const referenceBrief = await loadReferenceBrief();` (line ~1235), add:

```javascript
  const allPatterns = await loadPatternCards();
  const intent = analyzeDocumentIntent(metadata, content, toc);
  const relevantPatterns = selectRelevantPatterns(allPatterns, intent);
  const patternContext = formatPatternsForPrompt(relevantPatterns);
```

**Step 2: Pass pattern context into v1 prompt (buildSystemPrompt)**

In `buildSystemPrompt()` (line ~180), replace the line:

```javascript
${referenceBrief ? `Reference cues (IBM Carbon-style):\n${referenceBrief}` : ''}
```

with:

```javascript
${patternContext || ''}
${referenceBrief ? `\nAdditional reference cues (IBM Carbon-style):\n${referenceBrief}` : ''}
```

Add `patternContext` to the function parameters: `{ metadata, layoutProfile, printProfile, theme, referenceBrief, patternContext }`

**Step 3: Pass pattern context into v2 LayoutPlan prompt**

In `buildLayoutPlanPrompt()` (line ~345), add `patternContext` parameter and inject it before the reference brief:

```javascript
${patternContext || ''}
${referenceBrief ? `\nAdditional reference cues (IBM Carbon-style):\n${referenceBrief}` : ''}
```

Update the function signature: `{ metadata, layoutProfile, printProfile, theme, documentPlan, referenceBrief, qaFeedback, patternContext }`

**Step 4: Update all call sites to pass the new params**

In `getArtDirection()`:
- v1 branch (line ~1256): Add `patternContext` to `buildSystemPrompt` call
- v2 branch (line ~1297): Add `patternContext` to `buildLayoutPlanPrompt` call

**Step 5: Verify the art director still works**

Run: `node -e "import('./src/ai/art-director.js').then(m => console.log('exports:', Object.keys(m))).catch(e => console.error(e.message))"`
Expected: `exports: [ 'extractQaFeedback', 'storeQaFeedback', 'getArtDirection' ]`

**Step 6: Commit**

```bash
git add src/ai/art-director.js
git commit -m "feat(ai): wire pattern cards into art director prompts (v1 + v2)"
```

---

### Task 5: Create example collection infrastructure

**Files:**
- Create: `library/examples/.gitkeep`
- Create: `library/examples-staging/.gitkeep`
- Create: `scripts/training/collect-example.js`

**Step 1: Create directories**

Run: `mkdir -p library/examples library/examples-staging scripts/training`

**Step 2: Create `scripts/training/collect-example.js`**

This script archives a completed job's input markdown + layout JSON as an example candidate.

```javascript
#!/usr/bin/env node
/**
 * Collect a completed job output as a training example candidate.
 *
 * Usage:
 *   node scripts/training/collect-example.js \
 *     --markdown path/to/input.md \
 *     --layout path/to/layout.json \
 *     --qa-score 92 \
 *     --tags report,data-heavy \
 *     --template corporate-standard
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

async function main() {
  const markdownPath = getArg('markdown');
  const layoutPath = getArg('layout');
  const qaScore = Number(getArg('qa-score') || 0);
  const tags = (getArg('tags') || '').split(',').filter(Boolean);
  const template = getArg('template') || 'unknown';
  const docType = getArg('doc-type') || 'report';

  if (!markdownPath || !layoutPath) {
    console.error('Usage: collect-example.js --markdown <path> --layout <path> [--qa-score N] [--tags a,b] [--template name] [--doc-type type]');
    process.exit(1);
  }

  const markdown = await fs.readFile(markdownPath, 'utf-8');
  const layout = await fs.readFile(layoutPath, 'utf-8');

  // Validate layout is valid JSON
  JSON.parse(layout);

  const id = `example-${randomUUID().slice(0, 8)}`;
  const stagingDir = path.join('library', 'examples-staging', id);
  await fs.mkdir(stagingDir, { recursive: true });

  await fs.writeFile(path.join(stagingDir, 'input.md'), markdown);
  await fs.writeFile(path.join(stagingDir, 'layout.json'), layout);
  await fs.writeFile(
    path.join(stagingDir, 'score.json'),
    JSON.stringify(
      {
        qaScore,
        manualReview: 'pending',
        strengths: [],
        weaknesses: [],
        tags,
        template,
        docType,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log(`Example staged: ${stagingDir}`);
  console.log(`QA score: ${qaScore} | Tags: ${tags.join(', ') || 'none'} | Template: ${template}`);
  console.log('Run: node scripts/training/review-candidates.js to approve/reject');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

**Step 3: Verify script runs**

Run: `node scripts/training/collect-example.js --help 2>&1 || true`
Expected: Shows usage message (exits with code 1)

**Step 4: Create .gitkeep files**

Run: `touch library/examples/.gitkeep library/examples-staging/.gitkeep`

**Step 5: Commit**

```bash
git add library/examples/ library/examples-staging/ scripts/training/collect-example.js
git commit -m "feat(ai): add example collection script and staging directories"
```

---

### Task 6: Create example review/approval CLI

**Files:**
- Create: `scripts/training/review-candidates.js`

**Step 1: Create `scripts/training/review-candidates.js`**

```javascript
#!/usr/bin/env node
/**
 * Review staged training examples — approve or reject.
 *
 * Usage:
 *   node scripts/training/review-candidates.js          # list all pending
 *   node scripts/training/review-candidates.js approve <id>
 *   node scripts/training/review-candidates.js reject <id>
 *   node scripts/training/review-candidates.js list      # same as no args
 */

import fs from 'fs/promises';
import path from 'path';

const STAGING_DIR = 'library/examples-staging';
const APPROVED_DIR = 'library/examples';

async function listCandidates() {
  let entries;
  try {
    entries = await fs.readdir(STAGING_DIR);
  } catch {
    console.log('No staging directory found.');
    return;
  }
  const dirs = [];
  for (const entry of entries) {
    const scorePath = path.join(STAGING_DIR, entry, 'score.json');
    try {
      const raw = await fs.readFile(scorePath, 'utf-8');
      const score = JSON.parse(raw);
      dirs.push({ id: entry, ...score });
    } catch {
      // skip non-example entries
    }
  }
  if (!dirs.length) {
    console.log('No pending candidates.');
    return;
  }
  console.log(`\n${dirs.length} candidate(s):\n`);
  for (const d of dirs) {
    const status = d.manualReview === 'pending' ? '⏳' : d.manualReview === 'approved' ? '✅' : '❌';
    console.log(`  ${status} ${d.id}  QA: ${d.qaScore}  Tags: ${(d.tags || []).join(',')}  Template: ${d.template || '?'}`);
  }
  console.log('\nUsage: review-candidates.js approve|reject <id>');
}

async function moveExample(id, action) {
  const srcDir = path.join(STAGING_DIR, id);
  const scorePath = path.join(srcDir, 'score.json');

  try {
    await fs.access(srcDir);
  } catch {
    console.error(`Candidate not found: ${id}`);
    process.exit(1);
  }

  const raw = await fs.readFile(scorePath, 'utf-8');
  const score = JSON.parse(raw);

  if (action === 'approve') {
    score.manualReview = 'approved';
    score.reviewedAt = new Date().toISOString();
    await fs.writeFile(scorePath, JSON.stringify(score, null, 2));

    const destDir = path.join(APPROVED_DIR, id);
    await fs.rename(srcDir, destDir);
    console.log(`Approved and moved to ${destDir}`);
  } else if (action === 'reject') {
    score.manualReview = 'rejected';
    score.reviewedAt = new Date().toISOString();
    await fs.writeFile(scorePath, JSON.stringify(score, null, 2));

    // Remove rejected examples
    await fs.rm(srcDir, { recursive: true });
    console.log(`Rejected and removed: ${id}`);
  }
}

const [action, id] = process.argv.slice(2);

if (!action || action === 'list') {
  listCandidates();
} else if ((action === 'approve' || action === 'reject') && id) {
  moveExample(id, action);
} else {
  console.log('Usage: review-candidates.js [list|approve <id>|reject <id>]');
}
```

**Step 2: Verify script runs**

Run: `node scripts/training/review-candidates.js list`
Expected: "No pending candidates." (or "No staging directory found.")

**Step 3: Commit**

```bash
git add scripts/training/review-candidates.js
git commit -m "feat(ai): add example review/approval CLI for training pipeline"
```

---

### Task 7: Hook example collection into the PDF pipeline

After QA scoring in `convert-paged.js`, automatically stage high-scoring outputs.

**Files:**
- Modify: `src/convert-paged.js` (near line 2761 where `storeQaFeedback` is called)

**Step 1: Add an auto-staging function**

Near the top of `convert-paged.js` (after the existing imports), add:

```javascript
import { randomUUID } from 'crypto';

const EXAMPLE_QA_THRESHOLD = Number(process.env.EXAMPLE_QA_THRESHOLD || 85);
const EXAMPLE_AUTO_STAGE = process.env.EXAMPLE_AUTO_STAGE !== 'false';
```

Then add a helper function:

```javascript
async function stageTrainingExample({ markdown, layoutJson, qaReport, metadata, template }) {
  if (!EXAMPLE_AUTO_STAGE) return;
  const score = qaReport?.overallScore ?? qaReport?.score ?? 0;
  if (score < EXAMPLE_QA_THRESHOLD) return;

  try {
    const id = `example-${randomUUID().slice(0, 8)}`;
    const stagingDir = path.join(getProjectRoot(), 'library', 'examples-staging', id);
    await fs.mkdir(stagingDir, { recursive: true });
    await fs.writeFile(path.join(stagingDir, 'input.md'), markdown || '');
    await fs.writeFile(path.join(stagingDir, 'layout.json'), JSON.stringify(layoutJson, null, 2));
    await fs.writeFile(
      path.join(stagingDir, 'score.json'),
      JSON.stringify({
        qaScore: score,
        manualReview: 'pending',
        strengths: [],
        weaknesses: [],
        tags: [],
        template: template || 'unknown',
        docType: metadata?.docType || 'report',
        createdAt: new Date().toISOString(),
      }, null, 2)
    );
    console.log(`[training] Example staged: ${id} (QA score: ${score})`);
  } catch (error) {
    console.warn(`[training] Failed to stage example: ${error.message}`);
  }
}
```

**Step 2: Call it after `storeQaFeedback`**

Find the line (near ~2761):
```javascript
storeQaFeedback(markdown || '', qaReport);
```

Add after it:
```javascript
await stageTrainingExample({ markdown, layoutJson: artDirection?.layoutJson, qaReport, metadata, template: options?.template });
```

Make sure the necessary variables (`markdown`, `artDirection`, `qaReport`, `metadata`, `options`) are in scope at this point.

**Step 3: Verify the file is syntactically valid**

Run: `node -e "import('./src/convert-paged.js').then(()=>console.log('OK')).catch(e=>console.error(e.message))"`
Expected: OK (or non-syntax error about missing browser/dependencies)

**Step 4: Commit**

```bash
git add src/convert-paged.js
git commit -m "feat(ai): auto-stage high-scoring PDF outputs as training examples"
```

---

### Task 8: Create training data export script

**Files:**
- Create: `scripts/training/export-training-data.js`

**Step 1: Create the export script**

```javascript
#!/usr/bin/env node
/**
 * Export approved examples as JSONL for Gemini fine-tuning.
 *
 * Usage:
 *   node scripts/training/export-training-data.js                    # export all
 *   node scripts/training/export-training-data.js --output data.jsonl
 *   node scripts/training/export-training-data.js --min-score 90
 */

import fs from 'fs/promises';
import path from 'path';

const EXAMPLES_DIR = 'library/examples';

const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
}

async function main() {
  const outputPath = getArg('output', 'library/training-data.jsonl');
  const minScore = Number(getArg('min-score', 0));
  const testSplit = Number(getArg('test-split', 0.2));

  let entries;
  try {
    entries = await fs.readdir(EXAMPLES_DIR);
  } catch {
    console.error('No examples directory found.');
    process.exit(1);
  }

  const examples = [];
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const dir = path.join(EXAMPLES_DIR, entry);
    try {
      const scoreRaw = await fs.readFile(path.join(dir, 'score.json'), 'utf-8');
      const score = JSON.parse(scoreRaw);
      if (score.manualReview !== 'approved') continue;
      if (score.qaScore < minScore) continue;

      const markdown = await fs.readFile(path.join(dir, 'input.md'), 'utf-8');
      const layout = await fs.readFile(path.join(dir, 'layout.json'), 'utf-8');

      // Build text_input from metadata signals
      const layoutJson = JSON.parse(layout);
      const docType = score.docType || 'report';
      const template = score.template || 'unknown';
      const tags = (score.tags || []).join(', ');

      // Truncate markdown for training (max 8000 chars)
      const truncatedMd = markdown.length > 8000
        ? markdown.slice(0, 6000) + '\n...\n' + markdown.slice(-2000)
        : markdown;

      const textInput = [
        `Document type: ${docType}`,
        `Template: ${template}`,
        tags ? `Tags: ${tags}` : '',
        `\nMarkdown:\n${truncatedMd}`,
      ].filter(Boolean).join('\n');

      // Output is the layout JSON (without runtime metadata like .ai, .version)
      const cleanLayout = { ...layoutJson };
      delete cleanLayout.ai;
      delete cleanLayout.version;
      delete cleanLayout.metadata;

      examples.push({
        text_input: textInput,
        output: JSON.stringify(cleanLayout),
        _meta: { id: entry, qaScore: score.qaScore },
      });
    } catch {
      // skip invalid entries
    }
  }

  if (!examples.length) {
    console.log('No approved examples found. Need at least 1 to export.');
    process.exit(0);
  }

  // Shuffle and split
  for (let i = examples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [examples[i], examples[j]] = [examples[j], examples[i]];
  }

  const testCount = Math.max(1, Math.floor(examples.length * testSplit));
  const trainSet = examples.slice(testCount);
  const testSet = examples.slice(0, testCount);

  // Write training JSONL
  const trainLines = trainSet.map((e) => JSON.stringify({ text_input: e.text_input, output: e.output }));
  await fs.writeFile(outputPath, trainLines.join('\n') + '\n');

  // Write test JSONL
  const testPath = outputPath.replace('.jsonl', '-test.jsonl');
  const testLines = testSet.map((e) => JSON.stringify({ text_input: e.text_input, output: e.output }));
  await fs.writeFile(testPath, testLines.join('\n') + '\n');

  console.log(`Exported ${trainSet.length} training + ${testSet.length} test examples`);
  console.log(`Training: ${outputPath}`);
  console.log(`Test:     ${testPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

**Step 2: Verify script runs**

Run: `node scripts/training/export-training-data.js`
Expected: "No approved examples found. Need at least 1 to export." (exits 0)

**Step 3: Commit**

```bash
git add scripts/training/export-training-data.js
git commit -m "feat(ai): add training data export script for Gemini fine-tuning"
```

---

### Task 9: Add .gitignore rules and update CLAUDE.md

**Files:**
- Modify: `.gitignore` — exclude staging examples and training data from git
- Modify: `CLAUDE.md` — add training pipeline commands

**Step 1: Add gitignore rules**

Append to `.gitignore`:

```
# Training pipeline (large files, user-specific)
library/examples-staging/*/
library/examples/*/input.md
library/examples/*/layout.json
library/training-data*.jsonl
```

Note: Keep `score.json` files tracked so example metadata is in git, but exclude the large markdown/layout files.

**Step 2: Add training commands to CLAUDE.md**

In the "Common Commands" section, after the existing Docker/infra section, add:

```bash
# AI Training Pipeline
node scripts/training/collect-example.js --markdown input.md --layout layout.json --qa-score 92 --tags report
node scripts/training/review-candidates.js                    # list pending candidates
node scripts/training/review-candidates.js approve <id>       # approve example
node scripts/training/export-training-data.js                 # export JSONL for fine-tuning
```

**Step 3: Commit**

```bash
git add .gitignore CLAUDE.md
git commit -m "docs: add training pipeline commands and gitignore rules"
```

---

### Task 10: Load similar examples into art director prompts

**Files:**
- Modify: `src/ai/art-director.js` — add `loadSimilarExamples()` and wire into prompts

**Step 1: Add `loadSimilarExamples()` function**

After the `selectRelevantPatterns` function:

```javascript
async function loadSimilarExamples(intent, maxExamples = 2) {
  try {
    const projectRoot = getProjectRoot();
    const examplesDir = path.join(projectRoot, 'library', 'examples');
    const entries = await fs.readdir(examplesDir);
    const candidates = [];

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const scorePath = path.join(examplesDir, entry, 'score.json');
      try {
        const raw = await fs.readFile(scorePath, 'utf-8');
        const score = JSON.parse(raw);
        if (score.manualReview !== 'approved') continue;

        // Score relevance
        let relevance = score.qaScore || 0;
        if (score.docType === intent.docType) relevance += 20;
        if ((score.tags || []).some((t) => intent.docType.includes(t))) relevance += 10;

        candidates.push({ dir: path.join(examplesDir, entry), relevance, score });
      } catch {
        // skip invalid
      }
    }

    candidates.sort((a, b) => b.relevance - a.relevance);
    const top = candidates.slice(0, maxExamples);
    const examples = [];

    for (const c of top) {
      try {
        const layout = await fs.readFile(path.join(c.dir, 'layout.json'), 'utf-8');
        const parsed = JSON.parse(layout);
        // Only include components and storytelling (compact)
        examples.push({
          qaScore: c.score.qaScore,
          docType: c.score.docType,
          components: (parsed.components || []).slice(0, 8).map((comp) => ({
            type: comp.type,
            layoutProps: comp.layoutProps,
            patternType: comp.patternType,
            chartType: comp.chartType,
          })),
          storytelling: parsed.storytelling,
        });
      } catch {
        // skip
      }
    }

    return examples;
  } catch {
    return [];
  }
}
```

**Step 2: Format examples for prompt**

```javascript
function formatExamplesForPrompt(examples) {
  if (!examples.length) return '';
  const formatted = examples.map((ex, i) => {
    return `Example ${i + 1} (QA score: ${ex.qaScore}, type: ${ex.docType}):\n${JSON.stringify({ components: ex.components, storytelling: ex.storytelling }, null, 2)}`;
  });
  return `\n## Reference examples (good layouts — learn from these):\n\n${formatted.join('\n\n')}`;
}
```

**Step 3: Wire into `getArtDirection()`**

After `const patternContext = formatPatternsForPrompt(relevantPatterns);`, add:

```javascript
  const similarExamples = await loadSimilarExamples(intent);
  const exampleContext = formatExamplesForPrompt(similarExamples);
```

Then concatenate `exampleContext` into prompts alongside `patternContext`. In `buildSystemPrompt` and `buildLayoutPlanPrompt`, add:

```javascript
${exampleContext || ''}
```

after the `${patternContext || ''}` line.

**Step 4: Verify syntax**

Run: `node -e "import('./src/ai/art-director.js').then(()=>console.log('OK')).catch(e=>console.error(e.message))"`
Expected: OK

**Step 5: Commit**

```bash
git add src/ai/art-director.js
git commit -m "feat(ai): inject similar approved examples as few-shot context in art director"
```

---

### Summary

| Task | What It Does | Phase |
|------|-------------|-------|
| 1 | First 3 pattern cards (cover, exec-summary, chapter-opener) | 1a |
| 2 | Remaining 7 pattern cards | 1a |
| 3 | `loadPatternCards()` + `selectRelevantPatterns()` in art-director.js | 1b |
| 4 | Wire patterns into v1 + v2 prompts | 1b/1c |
| 5 | Example collection infrastructure (staging dirs + collect script) | 2a |
| 6 | Example review/approval CLI | 2a |
| 7 | Auto-stage high-scoring outputs in PDF pipeline | 2b |
| 8 | Training data export script (JSONL) | 3a |
| 9 | Gitignore + CLAUDE.md updates | Housekeeping |
| 10 | Load similar examples as few-shot context | 1c |
