---
title: "Carbon Typography Showcase"
subtitle: "Complete IBM Plex Type Scale Demonstration"
author: "Carbon Design System"
date: "January 2026"
---

# Typography System Overview

The IBM Carbon Design System features a comprehensive typography system based on the **IBM Plex** font family. This document demonstrates the complete type scale with all available styles.

## Type Scale Hierarchy

The type scale provides a systematic approach to typography, ensuring consistency and readability across all content types.

### Display Styles

Display styles are the largest text elements, typically used for hero sections or major page headers. They command attention and establish visual hierarchy.

### Heading Styles

Headings organize content into logical sections, guiding readers through the document structure with seven distinct levels.

#### Heading Level 4

This is heading level 4, suitable for subsection titles within a larger section.

##### Heading Level 5

Heading level 5 provides another level of hierarchy for detailed organization.

###### Heading Level 6

The smallest heading level, used for fine-grained content divisions.

## Body Text

Body text comes in multiple variations optimized for different contexts:

**Body Long 02** (16px, 1.5 leading) is the default for extended reading. It provides comfortable line spacing for paragraphs with more than three lines, reducing eye strain and improving comprehension.

**Body Short 01** (14px, 1.29 leading) works well for compact content areas where space is limited but readability must be maintained.

### Font Weights

The IBM Plex family supports **eight distinct weights**, enabling precise typographic expression:

1. **Thin (100)** - Delicate and refined
2. **Extra Light (200)** - Light and airy
3. **Light (300)** - Elegant and spacious
4. **Regular (400)** - Standard body text
5. **Text (450)** - Optimized for reading
6. **Medium (500)** - Subtle emphasis
7. **Semi-Bold (600)** - Strong emphasis
8. **Bold (700)** - Maximum impact

## Code and Technical Content

### Code Blocks

The `IBM Plex Mono` font ensures excellent readability for code:

```python
def fibonacci(n):
    """Calculate Fibonacci sequence using dynamic programming"""
    if n <= 1:
        return n

    dp = [0] * (n + 1)
    dp[1] = 1

    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]

    return dp[n]

# Generate first 10 Fibonacci numbers
result = [fibonacci(i) for i in range(10)]
print(f"Fibonacci sequence: {result}")
```

### Inline Code

Inline code like `const greeting = "Hello, World!";` uses a smaller monospace font with subtle background highlighting for distinction from body text.

## Lists and Enumeration

### Unordered Lists

- **Typography tokens** define reusable text styles
- **Spacing tokens** ensure consistent vertical rhythm
- **Color tokens** maintain accessible contrast ratios
- **Motion tokens** guide animation and transitions

### Ordered Lists

1. **Plan** your document structure
2. **Write** content in markdown format
3. **Apply** Carbon design system styling
4. **Generate** professional PDF output
5. **Review** and iterate as needed

### Nested Lists

1. **Typography System**
   - Font families (Sans, Serif, Mono, Condensed)
   - Type scales (Productive, Expressive)
   - Weight variations (8 levels)

2. **Layout System**
   - 16-column grid
   - 5 breakpoints
   - Responsive spacing

3. **Color System**
   - 10 color families
   - 10 shades per family
   - 4 theme modes

## Quotes and Citations

Block quotes receive special treatment with left border accent and background fill:

> "Design is not just what it looks like and feels like. Design is how it works."
>
> — Steve Jobs

> "The details are not the details. They make the design."
>
> — Charles Eames

## Tables

Tables demonstrate structured data presentation with Carbon styling:

| Type Token | Size | Weight | Use Case |
|------------|------|--------|----------|
| heading-06 | 42px | 300 | Major page headers |
| heading-05 | 32px | 400 | Section headers |
| heading-04 | 28px | 400 | Subsection headers |
| body-long-02 | 16px | 400 | Extended reading |
| body-short-01 | 14px | 400 | Compact content |
| code-02 | 14px | 400 | Code blocks |
| label-01 | 12px | 400 | UI labels |

## Special Text Treatments

### Emphasis

*Italic text* uses the true italic variant of IBM Plex, not obliqued roman.

**Bold text** provides strong emphasis with increased font weight.

***Bold italic*** combines both treatments for maximum emphasis.

### Links

Links are styled in Carbon Blue: [IBM Carbon Design System](https://carbondesignsystem.com)

### Small Text

Legal disclaimers and helper text use smaller sizes (12px) while maintaining readability through careful spacing and weight selection.

## Vertical Rhythm

Proper vertical spacing creates visual rhythm throughout the document:

- **48px** spacing before major sections
- **32px** spacing before subsections
- **24px** spacing between paragraphs
- **16px** spacing in lists
- **12px** spacing for related elements

This systematic approach to spacing ensures consistent visual flow and improves scannability.

## Accessibility

The Carbon typography system prioritizes accessibility:

- **WCAG AA compliance** for all text and background combinations
- **Minimum 12px** font size for all text
- **1.5:1 minimum** line height for body text
- **4.5:1 minimum** contrast ratio for normal text
- **3:1 minimum** contrast ratio for large text (18px+)

## Responsive Typography

While PDF is a fixed medium, the type scale is designed to work across different contexts. Display styles can scale down on smaller formats, while body text remains consistent for optimal readability.

## Font Loading

The Carbon system uses IBM Plex fonts with systematic fallbacks:

1. **IBM Plex Sans** (primary sans-serif)
2. **System UI** fonts (platform defaults)
3. **Generic sans-serif** (universal fallback)

This ensures graceful degradation when custom fonts are unavailable.

## Conclusion

This showcase demonstrates the complete Carbon typography system. The systematic approach to type scales, weights, and spacing creates professional, accessible, and visually harmonious documents.

The IBM Plex font family, combined with thoughtful design tokens and spacing, provides everything needed for world-class typography in PDF reports and documentation.

---

*This document uses the Carbon Advanced template with full type scale support.*
*Generated: January 2, 2026*
