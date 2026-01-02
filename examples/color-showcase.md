---
title: Carbon Color System Showcase
subtitle: Complete IBM Color Palette & Theme Tokens
author: Carbon Design System
date: January 2026
---

# Carbon Color System

The IBM Carbon Design System includes a comprehensive color palette designed for enterprise applications, data visualization, and accessible interfaces.

## Color Families

Carbon provides **10 color families**, each with **10 shades** (10-100), offering 100 total colors for precise design control.

### Primary Colors

**Blue** is the primary interactive color in Carbon, used for buttons, links, and focus states.

- **Blue-60** (`#0f62fe`) - Primary interactive color
- **Blue-40** - Hover states
- **Blue-80** - Active states

**Gray** provides the neutral foundation for text, backgrounds, and UI elements.

- **Gray-100** (`#161616`) - Primary text
- **Gray-70** (`#525252`) - Secondary text
- **Gray-10** (`#f4f4f4`) - UI backgrounds

### Semantic Colors

**Red** for errors and destructive actions:
- Red-60 (`#da1e28`) - Error state
- Red-10 - Error background

**Green** for success states:
- Green-50 (`#24a148`) - Success indicator
- Green-10 - Success background

**Yellow** for warnings:
- Yellow-30 (`#f1c21b`) - Warning state
- Yellow-10 - Warning background

### Extended Palette

**Purple** - Used for special highlights and code syntax:
- Purple-60 (`#8a3ffc`) - Code keywords
- Purple-40 - Highlights

**Cyan** - Links and informational states:
- Cyan-50 (`#1192e8`) - Hyperlinks
- Cyan-30 - Info backgrounds

**Teal** - Data visualization:
- Teal-70 - Charts and graphs
- Teal-40 - Accents

**Magenta** - Emphasis and branding:
- Magenta-60 - Highlights
- Magenta-30 - Soft accents

**Orange** - Alerts and notifications:
- Orange-40 - Attention states
- Orange-10 - Alert backgrounds

## Theme Tokens

Carbon defines **semantic color tokens** that adapt to different themes (White, G10, G90, G100).

### White Theme (Default)

The **White theme** is optimized for light backgrounds with maximum readability:

- **Background**: `#ffffff`
- **Layer-01**: Gray-10 (elevated surfaces)
- **Text-Primary**: Gray-100 (high contrast)
- **Interactive**: Blue-60 (accessible links/buttons)
- **Border-Subtle**: Gray-20 (dividers)

### Key Token Categories

**Layout Tokens:**
- `background` - Page background
- `layer-01`, `layer-02`, `layer-03` - Stacked surfaces
- `field-01`, `field-02` - Input backgrounds

**Text Tokens:**
- `text-primary` - Body text (WCAG AAA)
- `text-secondary` - Supporting text
- `text-placeholder` - Form placeholders
- `text-helper` - Hints and descriptions

**Interactive Tokens:**
- `link-primary` - Hyperlinks
- `interactive` - Buttons, switches
- `focus` - Keyboard focus rings

**Border Tokens:**
- `border-subtle` - Dividers, rules
- `border-strong` - Prominent borders

## Data Visualization

Carbon includes **14 categorical colors** for charts and data visualization, designed for optimal differentiation and accessibility.

### Categorical Palette

The 14-color palette ensures visual distinction even with many data series:

1. Purple-70 (`#6929c4`)
2. Cyan-50 (`#1192e8`)
3. Teal-70 (`#005d5d`)
4. Magenta-70 (`#9f1853`)
5. Red-50 (`#fa4d56`)
6. Red-90 (`#520408`)
7. Green-60 (`#198038`)
8. Blue-80 (`#002d9c`)
9. Magenta-50 (`#ee5396`)
10. Purple-50 (`#a56eff`)
11. Teal-50 (`#009d9a`)
12. Cyan-90 (`#012749`)
13. Blue-50 (`#4589ff`)
14. Green-30 (`#6fdc8c`)

### Sequential Palettes

For heatmaps and gradient data (light to dark):

**Blue Sequential:**
- Blue-10 → Blue-30 → Blue-50 → Blue-70 → Blue-90

**Green Sequential:**
- Green-10 → Green-30 → Green-50 → Green-70 → Green-90

### Diverging Palettes

For data with positive/negative values or comparisons:

**Red-to-Green:**
- Red-60 → Red-30 → White (center) → Green-30 → Green-60

**Purple-to-Teal:**
- Purple-60 → Purple-30 → White → Teal-30 → Teal-60

## Accessibility

All Carbon colors meet **WCAG 2.1 AA** standards when used correctly:

- Text on backgrounds: minimum 4.5:1 contrast
- Large text (18pt+): minimum 3:1 contrast
- Interactive elements: meet touch target sizes

### High Contrast Combinations

**Best for readability:**
- Gray-100 on White (21:1)
- White on Blue-60 (8.59:1)
- White on Gray-100 (16.1:1)

**Avoid low contrast:**
- Gray-40 on White (3.12:1) - fails AA for normal text
- Blue-40 on White (3.46:1) - use Blue-60 instead

## Usage Guidelines

### Interactive Elements

```markdown
**Buttons:** Use Blue-60 for primary actions
**Links:** Cyan-50 provides clear affordance
**Focus states:** Blue-60 with 2px outline
```

### Status Indicators

> **Success:** Green-50 with Green-10 background
> **Warning:** Yellow-30 with Yellow-10 background
> **Error:** Red-60 with Red-10 background
> **Info:** Blue-60 with Blue-10 background

### Code Syntax Highlighting

- **Keywords:** Purple-60
- **Strings:** Green-50
- **Comments:** Gray-70
- **Functions:** Cyan-50
- **Numbers:** Magenta-60

## Color in Practice

### Example: Status Message

When displaying a success message:
1. Background: Green-10 (light green tint)
2. Border-left: Green-50 (4px accent)
3. Icon: Green-50 (checkmark)
4. Text: Gray-100 (readable on light background)

### Example: Data Table

Alternating row colors improve scannability:
- Header: Blue-60 background, White text
- Odd rows: White background
- Even rows: Gray-10 background
- Hover: Blue-10 background

### Example: Card Component

Layered surfaces create visual hierarchy:
- Page background: White
- Card (layer-01): Gray-10
- Card header (layer-02): White
- Shadow: 0 2px 6px rgba(0,0,0,0.2)

## Color Science

Carbon's color system is built on scientific principles:

**Perceptual Uniformity:** Colors progress evenly in perceived brightness
**Accessible Contrast:** All combinations tested for WCAG compliance
**Print-safe:** Colors reproduce accurately in CMYK
**Colorblind-friendly:** Tested with deuteranopia and protanopia simulators

### Technical Specifications

- **Color Space:** sRGB
- **Format:** Hexadecimal (e.g., `#0f62fe`)
- **Precision:** 6 digits (16.7M colors)
- **Themes:** 4 (White, G10, G90, G100)
- **Total Palette:** 100 colors (10 families × 10 shades)

## Resources

**IBM Design Language:** https://www.ibm.com/design/language/color
**Carbon Website:** https://carbondesignsystem.com/elements/color/overview
**Color Tokens:** Complete palette in design tools (Figma, Sketch)
**Accessibility Checker:** Built into Carbon components

---

*This document demonstrates the IBM Carbon Design System color palette with all 100 colors, theme tokens, and data visualization palettes.*
