# Carbon Markdown to PDF - AI Agent Instructions

## Project Overview

This is a **Node.js (ES Modules)** CLI tool that converts Markdown files to professionally styled PDFs using IBM Carbon Design System. It supports two rendering engines: **Typst** (fast, modern) and **Quarto** (LaTeX-based, feature-rich).

## Architecture

```
Markdown → parse (gray-matter + marked) → Template (Mustache) → Engine (Typst/Quarto) → PDF
```

### Key Data Flow
1. **Input**: Markdown with YAML frontmatter (`title`, `subtitle`, `author`, `date`)
2. **Parsing**: [src/utils/markdown-parser.js](src/utils/markdown-parser.js) extracts metadata and converts content
3. **Templates**: Mustache templates in [templates/typst/](templates/typst/) and [templates/quarto/](templates/quarto/) apply Carbon styling
4. **Output**: PDFs generated via external `typst` or `quarto` CLI tools

### Core Modules
| File | Purpose |
|------|---------|
| [src/cli.js](src/cli.js) | CLI entry point using Commander.js |
| [src/convert-typst.js](src/convert-typst.js) | Typst conversion pipeline |
| [src/convert-quarto.js](src/convert-quarto.js) | Quarto conversion pipeline |
| [src/index.js](src/index.js) | Public API exports |
| [styles/carbon/theme.js](styles/carbon/theme.js) | Carbon theme tokens from `@carbon/*` packages |

### Template Files
| Template | Purpose |
|----------|---------|
| `carbon-advanced.typ` | Full-featured Typst template with complete type scale |
| `carbon-components.typ` | Reusable UI components (cards, badges, notifications) |
| `carbon-dataviz.typ` | Data visualization charts and palettes |
| `carbon-theme-g100.typ` | G100 dark theme template |
| `carbon-advanced.qmd` | Full-featured Quarto/LaTeX template |

## Development Commands

```bash
# Run CLI with different engines
node src/cli.js examples/sample.md --engine typst
node src/cli.js examples/sample.md --engine quarto
node src/cli.js examples/sample.md --engine both

# NPM scripts
npm run example          # Quick test with sample.md
npm run convert:typst    # Direct Typst conversion
npm run convert:quarto   # Direct Quarto conversion
```

## Conventions & Patterns

### ES Modules Only
- Use `import/export` syntax, never `require()`
- File extensions required in imports: `import { fn } from './file.js'`
- Use `import.meta.url` pattern for `__dirname` equivalent

### Carbon Design Tokens

#### Colors ([styles/carbon/colors-extended.js](styles/carbon/colors-extended.js))
- 10 shades per color family (10-100): blue, gray, red, green, yellow, purple, cyan, teal, magenta, orange
- Primary: `blue-60` (#0f62fe), Text: `gray-100` (#161616), Background: `gray-10` (#f4f4f4)
- Data visualization: Categorical (14 colors), Sequential, Diverging palettes

#### Typography ([styles/carbon/typography-scale.js](styles/carbon/typography-scale.js))
- Font families: IBM Plex Sans, Serif, Mono, Condensed
- Weights: thin (100) to bold (700)
- Productive type set: code, label, helper-text, legal, body, heading tokens
- Expressive type set: display-01 to display-04 for hero text

#### Spacing ([styles/carbon/spacing-tokens.js](styles/carbon/spacing-tokens.js))
- 8px base unit
- Tokens: `spacing-01` (2px) to `spacing-13` (160px)
- Layout tokens: `layout-01` (16px) to `layout-07` (160px)

#### Theme Modes
- **White**: Default clean theme
- **G10**: Light gray background
- **G90**: Dark theme
- **G100**: Full dark mode ([carbon-theme-g100.typ](templates/typst/carbon-theme-g100.typ))

### Template Variables
Mustache templates use these placeholders:
```
{{title}}, {{subtitle}}, {{author}}, {{date}}, {{content}}
```
**Important**: `Mustache.escape = (text) => text` is set to preserve Typst/LaTeX syntax.

### Markdown to Typst Conversion
The `markdownToTypst()` function handles special escaping:
- Hex colors (`#0f62fe`) are preserved with backslash escaping
- Headers: `# Title` → `= Title`
- Links: `[text](url)` → `#link("url")[text]`
- Quotes: `> text` → `#quote[text]`

## Available Components (Typst)

### UI Components ([carbon-components.typ](templates/typst/carbon-components.typ))
- `card()`, `tile()`, `feature-card()` - Content containers
- `badge()`, `tag()`, `chip()` - Labels and categories
- `notification()`, `callout()` - Alerts and messages
- `progress-bar()`, `meter()`, `stat-tile()` - Data display
- `avatar()`, `breadcrumbs()`, `accordion()` - Navigation
- `timeline-item()`, `definition-list()` - Content organization
- `comparison-table()`, `key-value()` - Data comparison

### Data Visualization ([carbon-dataviz.typ](templates/typst/carbon-dataviz.typ))
- `bar-chart()`, `column-chart()`, `stacked-bar-chart()` - Comparison
- `bullet-chart()` - KPI vs Target
- `sparkline()` - Inline trends
- `donut-stat()`, `heatmap-cell()` - Part-to-whole
- `metric-card()`, `comparison-bars()` - Statistics
- `chart-legend()`, `data-table()` - Supporting elements

## Adding New Features

### New Carbon Component
1. Add styling tokens to appropriate file in [styles/carbon/](styles/carbon/)
2. Add Typst function in [templates/typst/carbon-components.typ](templates/typst/carbon-components.typ)
3. Add LaTeX command in [templates/quarto/carbon-advanced.qmd](templates/quarto/carbon-advanced.qmd)
4. Add example in [examples/](examples/) to demonstrate usage

### New Chart Type
1. Add to [templates/typst/carbon-dataviz.typ](templates/typst/carbon-dataviz.typ)
2. Use colors from `dataviz-categorical` or `dataviz-seq-*` palettes
3. Follow existing function signature patterns

### New Theme
1. Copy [carbon-theme-g100.typ](templates/typst/carbon-theme-g100.typ) as base
2. Update theme token values for new color scheme
3. Register in CLI options if needed

## External Dependencies

**System requirements** (must be installed separately):
- `typst` CLI - Modern typesetting engine
- `quarto` CLI - Scientific publishing system (requires LaTeX)

**Carbon packages** (npm):
- `@carbon/colors`, `@carbon/themes`, `@carbon/type`, `@carbon/layout`

## File Naming

- Templates: `carbon-*.typ` / `carbon-*.qmd`
- Output PDFs: `{input}-typst-{template}.pdf` or `{input}-quarto-{template}.pdf`
- Temp files: Generated in `output/temp/`

## Reference Documentation

- [CARBON_ELEMENTS.md](docs/CARBON_ELEMENTS.md) - Complete Carbon element reference
- [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) - Roadmap and token specifications
