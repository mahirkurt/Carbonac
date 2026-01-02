---
title: Carbon Theme Demonstration
subtitle: G100 Dark Theme for Enterprise Applications
author: IBM Carbon Design System
date: January 2026
---

# Dark Theme Overview

The **G100 dark theme** is optimized for low-light environments and provides excellent contrast for extended viewing sessions.

## Color Adaptation

In dark themes, colors are carefully adjusted to maintain:
- **Readability**: Light text (Gray-10) on dark backgrounds (Gray-100)
- **Accessibility**: All contrast ratios meet WCAG AA standards
- **Visual hierarchy**: Layered surfaces from Gray-90 to Gray-70
- **Interactive clarity**: Blue-40 for links (lighter than Blue-60 in light theme)

## Key Features

### Typography

The IBM Plex font family maintains excellent readability even in dark mode:

- **Headings** use lighter weights (300-400) for elegance
- **Body text** at Gray-10 provides 16:1 contrast ratio
- **Links** in Blue-40 are easily distinguished

### Code Syntax

```javascript
// Code blocks use elevated surfaces
const theme = {
  background: '#161616',  // Gray-100
  layer01: '#262626',     // Gray-90
  text: '#f4f4f4',        // Gray-10
  link: '#78a9ff'         // Blue-40
};
```

### Interactive Elements

> **Dark themes reduce eye strain** in low-light environments while maintaining the same professional aesthetic as light themes.

## Layout Layers

Carbon uses a **layered approach** in dark themes:

1. **Background** (Gray-100): Page canvas
2. **Layer-01** (Gray-90): Cards, panels
3. **Layer-02** (Gray-80): Modals, tooltips
4. **Layer-03** (Gray-70): Top-most UI elements

### Example Usage

When should you use dark themes?

- 24/7 monitoring dashboards
- Developer tools and IDEs
- Creative applications (video, photo editing)
- User preference for accessibility
- Low-ambient-light environments

## Benefits

**Reduced eye strain:** Lower luminance in dark environments
**Power efficiency:** Especially on OLED displays
**Focus:** Dark backgrounds help content stand out
**Professional:** Modern, sleek aesthetic

---

*This document is rendered with the Carbon G100 dark theme, demonstrating how all typography, colors, and components adapt beautifully to dark mode.*
