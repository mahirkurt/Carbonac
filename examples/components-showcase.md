---
title: Carbon Component Library
subtitle: Reusable UI Components for Professional Documents
author: IBM Carbon Design System
date: January 2026
---

# Component Library Overview

The IBM Carbon Component Library provides a comprehensive set of reusable UI components designed for professional PDF documents. All components follow Carbon design principles and maintain consistent spacing, typography, and color usage.

## Component Categories

**Content Containers:**
- Cards (standard, feature, clickable tiles)
- Accordions (expandable sections)
- Callout boxes (notes, tips, warnings)

**Status Indicators:**
- Badges (colored labels with semantic meaning)
- Tags (removable labels)
- Notification banners (system messages)

**Navigation:**
- Breadcrumbs (hierarchical navigation)
- Table of contents (auto-generated)
- Dividers and section separators

**Data Display:**
- Definition lists (term-definition pairs)
- Statistics grids (key metrics)
- Timeline (chronological events)

## Cards

Cards group related content in visually distinct containers.

### Standard Card

Basic card with optional title:

```typst
#card(
  title: "Card Title",
  padding: sp-05
)[
  Card content goes here with proper spacing
  and visual hierarchy.
]
```

**Use cases:**
- Feature summaries
- Content modules
- Information panels
- Step-by-step guides

### Feature Card

Cards with icons and descriptions:

```typst
#feature-card(
  "Enterprise Ready",
  "Production-quality templates",
  icon: "✓",
  color: green-60
)
```

**Best practices:**
- Use clear, concise titles (2-4 words)
- Keep descriptions to 1-2 sentences
- Choose meaningful icons
- Maintain consistent color scheme

### Clickable Tiles

Tiles with visual affordance for interaction:

```typst
#tile(
  "Typography",
  description: "Complete type scale",
  icon: "Aa",
  accent: blue-60
)
```

**Visual indicators:**
- Colored accent bar on left edge
- Icon at top (optional)
- Title and description
- Subtle hover state (in interactive PDFs)

## Status Indicators

### Badges

Small colored labels for status, categories, or counts:

```typst
#badge("Active", variant: "success")
#badge("Error", variant: "error")
#badge("Warning", variant: "warning")
#badge("Info", variant: "info")
#badge("Default")
```

**Variants:**
- **Success** (green): Completed, active, approved
- **Error** (red): Failed, error, rejected
- **Warning** (yellow): Pending, caution, attention needed
- **Info** (blue): Information, notification, new
- **Default** (gray): Neutral, inactive, archived

**Sizes:**
- `default`: Standard size (10pt text)
- `small`: Compact size (9pt text)

### Tags

Dismissible labels for categorization:

```typst
#tag("Design")
#tag("Removable", dismissible: true)
#tag("Custom Color", color: blue-60)
```

**Use cases:**
- Content categorization
- Filter indicators
- Topic labels
- Metadata display

### Notifications

System-level messages with icons:

```typst
#notification(
  [Your changes have been saved.],
  title: "Success",
  kind: "success",
  dismissible: true
)
```

**Types:**
- **Success**: Confirmations, completions
- **Error**: Failures, critical issues
- **Warning**: Cautions, important notes
- **Info**: General information, updates

**Design features:**
- Colored left border (4pt)
- Icon indicator
- Optional title
- Dismissible × button
- Full-width layout

## Callout Boxes

Enhanced content boxes for special information:

```typst
#callout(
  title: "Pro Tip",
  type: "tip"
)[
  Use spacing tokens consistently for visual rhythm.
]
```

**Types:**
- **Tip** (green): Helpful suggestions, best practices
- **Warning** (yellow): Cautions, important considerations
- **Important** (red): Critical information, requirements
- **Note** (blue): Additional information, explanations

**When to use:**
- Highlight key points
- Provide additional context
- Warn about potential issues
- Share best practices

## Navigation Components

### Breadcrumbs

Hierarchical navigation path:

```typst
#breadcrumbs(("Home", "Docs", "Components"))
#breadcrumbs(("Projects", "Carbon"), separator: ">")
```

**Best practices:**
- Keep to 3-5 levels maximum
- Use clear, concise labels
- Last item is current location (darker text)
- Earlier items are links (blue text)

### Dividers

Visual separation between sections:

```typst
#divider()  // Default spacing
#divider(spacing: sp-04, color: blue-60)
#section-divider(label: "Featured")
```

**Variants:**
- Simple line (default)
- Custom colored line
- Labeled section divider
- Thick section break

## Data Display Components

### Definition Lists

Structured term-definition pairs:

```typst
#definition-list((
  ("Term 1", "Definition of term 1"),
  ("Term 2", "Definition of term 2")
))
```

**Use cases:**
- Glossaries
- Specifications
- API parameters
- Technical terms

**Formatting:**
- Terms: 12pt, bold, primary text color
- Definitions: 11pt, regular, secondary color
- Indented 16px for hierarchy
- 12px spacing between items

### Statistics Grid

Key metrics display:

```typst
#stat-grid((
  (value: "5,047", label: "Lines of Code"),
  (value: "100", label: "Colors")
))
```

**Design:**
- Large value (32pt, light weight)
- Small label (10pt, secondary color)
- Card background
- Centered alignment
- Equal-width columns

### Timeline

Chronological event display:

```typst
#timeline-item(
  "Jan 2026",
  "Phase 1 Complete",
  "Typography system implemented",
  color: green-60
)
```

**Elements:**
- Date (right-aligned, 80pt width)
- Dot indicator (6pt radius)
- Title (13pt, bold)
- Description (11pt, secondary)
- Connecting line between items

## Accordion Sections

Expandable/collapsible content:

```typst
#accordion(
  "Section Title",
  expanded: true
)[
  Section content that can be shown or hidden.
]
```

**Visual states:**
- **Expanded** (−): Content visible, light background
- **Collapsed** (+): Content hidden, header only

**Use cases:**
- FAQ sections
- Long content organization
- Optional details
- Progressive disclosure

## Design Principles

### Consistency

Use components consistently:
- Same component for same purpose
- Consistent spacing (sp-03 to sp-06)
- Standard colors from palette
- Predictable behavior

### Hierarchy

Establish clear visual hierarchy:
- Larger components = more important
- Color draws attention
- Spacing creates grouping
- Typography indicates structure

### Accessibility

Ensure all components are accessible:
- Sufficient color contrast (4.5:1 minimum)
- Clear text labels
- Semantic structure
- Print-friendly designs

### Modularity

Components are self-contained:
- No external dependencies
- Configurable parameters
- Composable design
- Reusable across documents

## Component Composition

Combine components for rich layouts:

**Dashboard Layout:**
1. Statistics grid (top metrics)
2. Feature cards (key highlights)
3. Timeline (project progress)
4. Callout box (important notice)

**Documentation Page:**
1. Breadcrumbs (navigation)
2. Definition list (terms)
3. Callout boxes (notes, tips)
4. Code blocks (examples)

**Report Section:**
1. Cards (content modules)
2. Badges (status indicators)
3. Dividers (section breaks)
4. Tables (detailed data)

## Implementation Examples

### Product Feature Page

```typst
#grid(
  columns: 3,
  column-gutter: sp-06,

  feature-card(
    "Fast",
    "Compile in milliseconds",
    icon: "⚡"
  ),

  feature-card(
    "Accessible",
    "WCAG AA compliant",
    icon: "♿"
  ),

  feature-card(
    "Beautiful",
    "Professional design",
    icon: "✨"
  )
)
```

### Status Dashboard

```typst
#stat-grid((
  (value: "99.9%", label: "Uptime"),
  (value: "2.4M", label: "Users"),
  (value: "156", label: "Projects")
))

#v(sp-06)

#grid(
  columns: 2,
  column-gutter: sp-06,

  notification(
    [All systems operational],
    kind: "success"
  ),

  notification(
    [Maintenance scheduled for tonight],
    kind: "info"
  )
)
```

### Learning Path

```typst
#timeline-item(
  "Week 1",
  "Introduction",
  "Learn Carbon basics",
  color: green-60
)

#timeline-item(
  "Week 2",
  "Components",
  "Build with UI components",
  color: blue-60
)

#timeline-item(
  "Week 3",
  "Advanced",
  "Data visualization",
  color: gray-50
)
```

## API Reference

### Card Parameters

- `title` (optional): Card heading
- `content` (required): Main content
- `padding` (default: sp-05): Internal spacing
- `background` (default: gray-10): Fill color
- `border` (default: gray-20): Stroke color

### Badge Parameters

- `content` (required): Badge text
- `variant` (default): success, error, warning, info, default
- `size` (default): default, small

### Notification Parameters

- `content` (required): Message text
- `title` (optional): Notification heading
- `kind` (default: info): success, error, warning, info
- `dismissible` (default: false): Show × button

### Callout Parameters

- `content` (required): Box content
- `title` (optional): Callout heading
- `type` (default: note): tip, warning, important, note
- `icon` (optional): Custom icon (overrides default)

## Best Practices Summary

**Do:**
- Use semantic variants (success for positive, error for negative)
- Maintain consistent spacing (8px base unit)
- Combine components thoughtfully
- Follow established patterns

**Don't:**
- Mix too many component types on one page
- Use colors inconsistently
- Overuse notifications or callouts
- Create visual clutter

## Resources

**Component Documentation**: https://carbondesignsystem.com/components/overview
**Design Patterns**: https://carbondesignsystem.com/patterns/overview
**Accessibility**: https://carbondesignsystem.com/guidelines/accessibility

---

*This component library enables rapid creation of professional, accessible, and beautiful PDF documents following IBM Carbon Design System standards.*
