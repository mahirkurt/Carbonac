---
title: Carbon Grid and Spacing System
subtitle: 2x Grid with Complete Spacing Tokens
author: IBM Carbon Design System
date: January 2026
---

# 2x Grid System Overview

The IBM Carbon Design System uses a **16-column grid** with a **32px gutter** (default) and an **8px base unit** for all spacing decisions.

## Spacing Tokens

Carbon provides **13 spacing tokens** based on an 8px foundation, ensuring consistent rhythm and visual hierarchy throughout your designs.

### Spacing Scale

The spacing scale progresses from micro (2px) to macro (160px):

- **sp-01** (2px) - Minimal spacing for tight elements
- **sp-02** (4px) - Small internal padding
- **sp-03** (8px) - **Base unit** - fundamental spacing
- **sp-04** (12px) - Compact spacing
- **sp-05** (16px) - Standard spacing
- **sp-06** (24px) - Comfortable spacing
- **sp-07** (32px) - Section spacing
- **sp-08** (40px) - Large spacing
- **sp-09** (48px) - Page margins
- **sp-10** (64px) - Extra large spacing
- **sp-11** (80px) - Major sections
- **sp-12** (96px) - Page regions
- **sp-13** (160px) - Maximum spacing

### Usage Guidelines

**Use smaller tokens (01-04) for:**
- Component internal padding
- Fine-tuning alignment
- Tight layouts (data tables, forms)

**Use medium tokens (05-07) for:**
- Standard component spacing
- Content flow (paragraphs, lists)
- Card and container padding

**Use larger tokens (08-13) for:**
- Section breaks
- Page layout structure
- Visual breathing room
- Hero sections

## Grid Configuration

### 16-Column System

Carbon's grid divides the page into **16 equal columns** with consistent gutters:

```
Columns: 16
Gutter: 32px (default)
Margin: 16px (page sides)
Max Width: 1584px (for web)
```

### Column Spans

Components can span any number of columns:

- **Full width**: 16 columns
- **Half width**: 8 columns
- **Third width**: 5-6 columns
- **Quarter width**: 4 columns
- **Sidebar**: 4-5 columns
- **Main content**: 11-12 columns

## Layout Patterns

### Two-Column Layout

A balanced 50/50 split is perfect for comparisons or side-by-side content.

**Use cases:**
- Before/after comparisons
- Dual content streams
- Feature pairs
- Image and text combinations

### Three-Column Layout

Three equal columns work well for feature showcases and card grids.

**Use cases:**
- Feature highlights
- Product cards
- Service offerings
- Team member profiles

### Sidebar Layout

A 1/3 - 2/3 split emphasizes primary content while maintaining supporting information.

**Use cases:**
- Documentation (sidebar navigation)
- Blog posts (sidebar widgets)
- Dashboards (filters + content)
- Settings pages

### Four-Column Layout

Maximum content density while maintaining scanability.

**Use cases:**
- Icon grids
- Statistics dashboards
- Gallery layouts
- Quick facts

## Components with Spacing

### Cards

Cards use spacing tokens for internal structure:

- **Padding**: sp-05 (16px) standard
- **Title margin**: sp-04 (12px) below
- **Content margin**: sp-03 (8px) between elements
- **Outer margin**: sp-06 (24px) from other cards

### Info Boxes

Callout boxes highlight important information:

- **Info** (Blue): General information or tips
- **Warning** (Yellow): Cautions or important notes
- **Error** (Red): Critical issues or errors
- **Success** (Green): Confirmations or positive feedback

### Sections

Sections provide vertical rhythm:

- **Section spacing**: sp-08 (40px) between major sections
- **Subsection spacing**: sp-06 (24px) for subsections
- **Content spacing**: sp-05 (16px) for related content

## Spacing Best Practices

### Vertical Rhythm

Maintain consistent vertical spacing for improved readability:

1. **Headings**: sp-08 above, sp-04 below
2. **Paragraphs**: sp-05 between
3. **Lists**: sp-04 between items
4. **Sections**: sp-09 between major breaks

### Horizontal Spacing

Use gutters and margins consistently:

1. **Grid gutter**: sp-07 (32px) between columns
2. **Container padding**: sp-05 (16px) minimum
3. **Button spacing**: sp-04 (12px) between actions
4. **Form fields**: sp-05 (16px) between inputs

### Responsive Considerations

While PDFs are fixed-size, the grid principles apply:

- Maintain consistent gutters
- Respect spacing tokens
- Ensure readable line lengths (45-75 characters)
- Use appropriate column spans

## Grid in Practice

### Data Tables

Data tables use condensed spacing:
- Row height: sp-06 (24px)
- Cell padding: sp-03 (8px)
- Column spacing: sp-04 (12px)

### Forms

Forms require comfortable spacing:
- Field spacing: sp-05 (16px)
- Label margin: sp-03 (8px)
- Group spacing: sp-07 (32px)
- Submit button margin: sp-08 (40px)

### Navigation

Navigation elements use tight spacing:
- Item padding: sp-04 (12px)
- Group spacing: sp-06 (24px)
- Hierarchy indent: sp-05 (16px)

## Accessibility

Proper spacing improves accessibility:

**Touch targets**: Minimum sp-06 (24px) for interactive elements
**Focus indicators**: sp-02 (4px) offset from element
**Reading comfort**: sp-05 to sp-07 between content blocks
**Visual hierarchy**: Larger spacing = higher importance

## Technical Implementation

### Spacing Token Variables

In Typst templates:
```typst
#let sp-03 = 8pt   // Base unit
#let sp-05 = 16pt  // Standard spacing
#let sp-07 = 32pt  // Section spacing
```

### Grid Functions

```typst
#two-columns(left, right)           // 50/50 split
#three-columns(left, center, right)  // 33/33/33 split
#sidebar-layout(sidebar, main)       // 33/67 split
#four-columns(c1, c2, c3, c4)       // 25/25/25/25 split
```

### Component Helpers

```typst
#card(content, padding: sp-05)      // Padded card
#info-box(content)                  // Blue info box
#warning-box(content)               // Yellow warning
#section(title, content)            // Spaced section
```

## Design Principles

### Consistency

Use the same spacing tokens throughout your document for visual harmony.

### Hierarchy

Larger spacing indicates greater separation - use it to show relationships between content.

### Breathing Room

Don't be afraid of whitespace - it improves comprehension and reduces cognitive load.

### Alignment

Align content to the grid for a professional, polished appearance.

## Resources

**Carbon Grid Documentation**: https://carbondesignsystem.com/elements/2x-grid/
**Spacing Guidelines**: https://carbondesignsystem.com/elements/spacing/
**Layout Patterns**: https://carbondesignsystem.com/patterns/overview/

---

*This document demonstrates the IBM Carbon 2x Grid System with complete spacing token support and layout helpers for professional PDF reports.*
