// ============================================
// Carbon Components Demo - Working Examples
// ============================================

#import "../templates/typst/carbon-components.typ": *

// ============================================
// COMPONENT SHOWCASE
// ============================================

= Component Library Overview

This document demonstrates all available Carbon Design System components for professional PDF reports.

== Cards

Cards group related content and actions:

#v(sp-06)

#grid(
  columns: 2,
  column-gutter: sp-06,

  card(
    title: "Getting Started",
    padding: sp-05
  )[
    Follow these steps to begin using the Carbon Design System in your documents:

    1. Choose a template
    2. Add your content
    3. Compile to PDF
  ],

  card(
    title: "Key Features",
    padding: sp-05
  )[
    - Complete typography system
    - 100-color palette
    - 16-column grid
    - Data visualization
    - Component library
  ]
)

#v(sp-08)

== Tiles

Tiles are clickable cards with accent indicators:

#v(sp-06)

#grid(
  columns: 3,
  column-gutter: sp-05,

  tile(
    "Typography",
    description: "IBM Plex font family with complete type scale",
    icon: "Aa",
    accent: blue-60
  ),

  tile(
    "Colors",
    description: "100 colors across 10 families with 4 themes",
    icon: "🎨",
    accent: purple-60
  ),

  tile(
    "Charts",
    description: "Data visualization with 7+ chart types",
    icon: "📊",
    accent: green-60
  )
)

#pagebreak()

= Status Indicators

== Badges

Badges highlight status, categories, or counts:

#v(sp-05)

#grid(
  columns: 5,
  column-gutter: sp-04,
  row-gutter: sp-04,

  badge("Active", variant: "success"),
  badge("Error", variant: "error"),
  badge("Warning", variant: "warning"),
  badge("Info", variant: "info"),
  badge("Default"),

  badge("New", variant: "success", size: "small"),
  badge("Alert", variant: "error", size: "small"),
  badge("Beta", variant: "warning", size: "small"),
  badge("v2.0", variant: "info", size: "small"),
  badge("Draft", size: "small")
)

#v(sp-08)

== Tags

Tags categorize and filter content:

#v(sp-05)

#stack(
  dir: ltr,
  spacing: sp-03,
  tag("Design"),
  tag("Development"),
  tag("Research"),
  tag("Removable", dismissible: true),
  tag("Analytics", color: blue-60)
)

#v(sp-08)

== Notifications

System-level messages and alerts:

#notification(
  [Your changes have been saved successfully.],
  title: "Success",
  kind: "success"
)

#notification(
  [An error occurred while processing your request. Please try again.],
  title: "Error",
  kind: "error",
  dismissible: true
)

#notification(
  [Your session will expire in 5 minutes. Please save your work.],
  title: "Warning",
  kind: "warning"
)

#notification(
  [New features are now available in the Carbon Design System v11.],
  title: "Information",
  kind: "info",
  dismissible: true
)

#pagebreak()

= Callout Boxes

Enhanced callout boxes for special content:

#callout(
  title: "Pro Tip",
  type: "tip"
)[
  Use spacing tokens consistently throughout your document for professional results. The 8px base unit creates visual rhythm.
]

#callout(
  title: "Important Notice",
  type: "important"
)[
  Always verify color contrast ratios meet WCAG AA standards (minimum 4.5:1 for normal text).
]

#callout(
  title: "Caution",
  type: "warning"
)[
  Avoid using more than 5-7 colors in a single chart. Too many colors reduce comprehension.
]

#callout(
  title: "Technical Note",
  type: "note"
)[
  IBM Plex fonts are available in 8 weights: Thin (100), ExtraLight (200), Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800).
]

#pagebreak()

= Navigation and Structure

== Breadcrumbs

Show hierarchy and navigation path:

#v(sp-05)

#breadcrumbs(("Home", "Documentation", "Components", "Cards"))

#v(sp-03)

#breadcrumbs(("Projects", "Carbon Design", "Templates", "Typst"), separator: ">")

#v(sp-08)

== Definition List

Structured term-definition pairs:

#v(sp-05)

#definition-list((
  ("Carbon Design System", "IBM's open-source design system for digital products and experiences."),
  ("Typst", "Modern markup-based typesetting system for scientific and technical documents."),
  ("Grid System", "16-column responsive layout foundation with 32px gutters."),
  ("Spacing Tokens", "13 predefined spacing values based on 8px base unit.")
))

#pagebreak()

= Timeline

Project milestones and progress tracking:

#v(sp-06)

#timeline-item(
  "Jan 2026",
  "Phase 1 Complete",
  "Typography and layout system implemented",
  color: green-60
)

#place(left, dx: 90pt)[
  #line(start: (0pt, 0pt), end: (0pt, 40pt), stroke: 2pt + gray-30)
]

#timeline-item(
  "Jan 2026",
  "Phase 2 Complete",
  "Full color system with 100 colors and themes",
  color: green-60
)

#place(left, dx: 90pt)[
  #line(start: (0pt, 0pt), end: (0pt, 40pt), stroke: 2pt + gray-30)
]

#timeline-item(
  "Jan 2026",
  "Phase 3 Complete",
  "Grid system and spacing tokens",
  color: green-60
)

#place(left, dx: 90pt)[
  #line(start: (0pt, 0pt), end: (0pt, 40pt), stroke: 2pt + gray-30)
]

#timeline-item(
  "Jan 2026",
  "Phase 4 Complete",
  "Data visualization with 7 chart types",
  color: green-60
)

#place(left, dx: 90pt)[
  #line(start: (0pt, 0pt), end: (0pt, 40pt), stroke: 2pt + gray-30)
]

#timeline-item(
  "Jan 2026",
  "Phase 6 In Progress",
  "Component library development",
  color: blue-60
)

#place(left, dx: 90pt)[
  #line(start: (0pt, 0pt), end: (0pt, 40pt), stroke: 2pt + gray-30)
]

#timeline-item(
  "Feb 2026",
  "Phase 7 Planned",
  "Advanced features and final optimizations",
  color: gray-50
)

#pagebreak()

= Expandable Content

== Accordion Sections

Visual representation of collapsible content:

#v(sp-06)

#accordion(
  "Project Overview",
  expanded: true
)[
  The Carbon Design System implementation for Typst and Quarto provides professional PDF generation with enterprise-grade design standards.
]

#accordion(
  "Technical Requirements",
  expanded: true
)[
  - Typst 0.11.1 or later
  - Quarto 1.4.549 or later
  - IBM Plex font family
  - Node.js 18+ for conversion scripts
]

#accordion(
  "Installation Guide",
  expanded: false
)[
  Installation instructions are available in the README.md file.
]

#accordion(
  "Advanced Configuration",
  expanded: false
)[
  See documentation for template customization options.
]

#pagebreak()

= Dividers and Separators

Simple horizontal rules:

#v(sp-05)

Content above the divider.

#divider()

Content below the divider.

#divider(spacing: sp-04, color: blue-60, thickness: 2pt)

Section with custom divider.

#section-divider(label: "Featured Section")

Content in featured section.

#section-divider()

Another major section break.

#v(sp-08)

= Statistics Display

Key metrics at a glance:

#v(sp-06)

#stat-grid((
  (value: "5,047", label: "Lines of Code"),
  (value: "6", label: "Templates"),
  (value: "100", label: "Colors"),
  (value: "13", label: "Spacing Tokens")
))

#v(sp-08)

#stat-grid((
  (value: "4", label: "Phases Complete"),
  (value: "7", label: "Chart Types"),
  (value: "16", label: "Grid Columns")
))

#pagebreak()

= Feature Cards

Highlight key features with icons:

#v(sp-06)

#grid(
  columns: 2,
  column-gutter: sp-06,
  row-gutter: sp-06,

  feature-card(
    "Enterprise Ready",
    "Production-quality templates following IBM design standards",
    icon: "✓",
    color: green-60
  ),

  feature-card(
    "Fully Accessible",
    "WCAG AA compliant colors and proper semantic structure",
    icon: "♿",
    color: blue-60
  ),

  feature-card(
    "Fast Compilation",
    "Typst compiles PDFs in milliseconds, not minutes",
    icon: "⚡",
    color: purple-60
  ),

  feature-card(
    "Open Source",
    "All code available under open-source licenses",
    icon: "❤",
    color: red-60
  )
)

#v(sp-08)

= Component API Reference

All components accept standard parameters:

#callout(
  title: "Component Parameters",
  type: "note"
)[
  *Common parameters:*

  - `content`: Main component content (required for most)
  - `title`: Optional title or heading
  - `color`: Override default color scheme
  - `size`: Size variant (small, default, large)
  - `variant`: Style variant (default, success, error, warning, info)
]

---

#align(center)[
  #v(sp-06)
  #text(size: 10pt, fill: gray-70)[
    _Component library powered by IBM Carbon Design System_
  ]
]
