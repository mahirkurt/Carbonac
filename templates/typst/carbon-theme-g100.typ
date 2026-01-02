// ============================================
// IBM Carbon Design System - G100 Dark Theme
// Complete dark theme for enterprise applications
// ============================================

// ============================================
// CARBON COLOR PALETTE
// ============================================

// Blue Family
#let blue-10 = rgb("#edf5ff")
#let blue-20 = rgb("#d0e2ff")
#let blue-30 = rgb("#a6c8ff")
#let blue-40 = rgb("#78a9ff")
#let blue-50 = rgb("#4589ff")
#let blue-60 = rgb("#0f62fe")
#let blue-70 = rgb("#0043ce")
#let blue-80 = rgb("#002d9c")
#let blue-90 = rgb("#001d6c")
#let blue-100 = rgb("#001141")

// Gray Family
#let gray-10 = rgb("#f4f4f4")
#let gray-20 = rgb("#e0e0e0")
#let gray-30 = rgb("#c6c6c6")
#let gray-40 = rgb("#a8a8a8")
#let gray-50 = rgb("#8d8d8d")
#let gray-60 = rgb("#6f6f6f")
#let gray-70 = rgb("#525252")
#let gray-80 = rgb("#393939")
#let gray-90 = rgb("#262626")
#let gray-100 = rgb("#161616")

// Red, Green, Purple, Cyan, etc.
#let red-40 = rgb("#ff8389")
#let red-60 = rgb("#da1e28")
#let green-50 = rgb("#24a148")
#let purple-60 = rgb("#8a3ffc")
#let cyan-50 = rgb("#1192e8")

// ============================================
// THEME TOKENS - G100 Dark Theme
// ============================================

#let theme-background = gray-100  // Dark background
#let theme-layer-01 = gray-90     // Elevated surfaces
#let theme-layer-02 = gray-80     // More elevated
#let theme-layer-03 = gray-70     // Top layer
#let theme-field-01 = gray-90     // Input backgrounds
#let theme-field-02 = gray-80     // Alternative inputs
#let theme-border-subtle = gray-80  // Subtle borders
#let theme-border-strong = gray-50  // Strong borders
#let theme-text-primary = gray-10   // Light text on dark
#let theme-text-secondary = gray-30  // Secondary light text
#let theme-text-placeholder = gray-50  // Placeholder text
#let theme-text-helper = gray-40     // Helper text
#let theme-text-error = red-40       // Error text (lighter in dark theme)
#let theme-link-primary = blue-40    // Links (lighter in dark theme)
#let theme-interactive = blue-40     // Interactive elements
#let theme-focus = white            // Focus outline
#let theme-inverse = gray-10        // Inverse elements

// ============================================
// SPACING TOKENS
// ============================================

#let sp-02 = 4pt
#let sp-03 = 8pt
#let sp-04 = 12pt
#let sp-05 = 16pt
#let sp-06 = 24pt
#let sp-07 = 32pt
#let sp-08 = 40pt
#let sp-09 = 48pt

// ============================================
// TYPOGRAPHY FUNCTIONS
// ============================================

#let heading-06(content) = text(
  size: 42pt,
  weight: 300,
  fill: theme-text-primary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.19em); #content]

#let heading-05(content) = text(
  size: 32pt,
  weight: 400,
  fill: theme-text-primary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.25em); #content]

#let heading-04(content) = text(
  size: 28pt,
  weight: 400,
  fill: theme-text-primary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.29em); #content]

#let heading-03(content) = text(
  size: 20pt,
  weight: 400,
  fill: theme-text-secondary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.4em); #content]

#let heading-02(content) = text(
  size: 16pt,
  weight: 600,
  fill: theme-text-secondary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.375em); #content]

#let body-long-02(content) = text(
  size: 16pt,
  weight: 400,
  fill: theme-text-primary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.5em); #content]

#let code-01(content) = text(
  size: 12pt,
  weight: 400,
  fill: theme-link-primary,
  font: "IBM Plex Mono"
)[#content]

#let label-01(content) = text(
  size: 12pt,
  weight: 400,
  fill: theme-text-secondary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.33em); #content]

// ============================================
// PAGE SETUP
// ============================================

#set page(
  paper: "a4",
  margin: (
    top: sp-09,
    bottom: sp-09,
    left: sp-09,
    right: sp-09
  ),
  numbering: "1",
  number-align: center,
  fill: theme-background,  // Dark page background
  header: context {
    if counter(page).get().first() > 1 [
      #label-01[_{{title}}_]
      #v(-sp-03)
      #line(length: 100%, stroke: 0.5pt + theme-border-subtle)
    ]
  },
  footer: context {
    line(length: 100%, stroke: 0.5pt + theme-border-subtle)
    v(-sp-03)
    grid(
      columns: (1fr, 1fr, 1fr),
      label-01[{{author}}],
      align(center)[#label-01[#counter(page).display("1 of 1", both: true)]],
      align(right)[#label-01[{{date}}]]
    )
  }
)

// ============================================
// DOCUMENT DEFAULTS
// ============================================

#set text(
  font: "IBM Plex Sans",
  size: 16pt,
  fill: theme-text-primary,  // Light text on dark
  weight: 400,
  lang: "en"
)

#set par(
  justify: true,
  leading: 1.5em,
  first-line-indent: 0em
)

// ============================================
// HEADINGS
// ============================================

#show heading.where(level: 1): it => {
  v(sp-09)
  heading-06(it.body)
  v(sp-05)
  line(length: 100%, stroke: 2pt + theme-interactive)
  v(sp-06)
}

#show heading.where(level: 2): it => {
  v(sp-08)
  heading-05(it.body)
  v(sp-04)
  line(length: 30%, stroke: 1.5pt + theme-interactive)
  v(sp-05)
}

#show heading.where(level: 3): it => {
  v(sp-07)
  heading-04(it.body)
  v(sp-04)
}

#show heading.where(level: 4): it => {
  v(sp-06)
  heading-03(it.body)
  v(sp-03)
}

#show heading.where(level: 5): it => {
  v(sp-05)
  heading-02(it.body)
  v(sp-03)
}

// ============================================
// CODE BLOCKS
// ============================================

#show raw.where(block: true): it => {
  block(
    fill: theme-layer-01,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-05,
    width: 100%
  )[
    #text(
      size: 14pt,
      weight: 400,
      fill: theme-text-primary,
      font: "IBM Plex Mono"
    )[#set par(leading: 1.43em); #it]
  ]
}

#show raw.where(block: false): it => {
  box(
    fill: theme-layer-01,
    outset: (x: sp-02, y: 2pt),
    radius: 2pt
  )[
    #code-01(it)
  ]
}

// ============================================
// LINKS
// ============================================

#show link: it => {
  set text(fill: theme-link-primary)
  underline(it)
}

// ============================================
// LISTS
// ============================================

#set list(
  indent: 1em,
  body-indent: 0.5em,
  marker: text(fill: theme-interactive, size: 1.2em)[•]
)

#set enum(
  indent: 1em,
  body-indent: 0.5em,
  numbering: n => text(fill: theme-interactive)[#n.]
)

// ============================================
// BLOCKQUOTES
// ============================================

#show quote: it => {
  v(sp-06)
  block(
    fill: theme-layer-01,
    stroke: (left: 4pt + theme-interactive),
    inset: (left: sp-05, right: sp-05, top: sp-04, bottom: sp-04),
    width: 100%
  )[
    #set text(fill: theme-text-secondary, style: "italic")
    #set par(leading: 1.6em)
    #it.body
  ]
  v(sp-06)
}

// ============================================
// TABLES
// ============================================

#show table: it => {
  v(sp-06)
  set text(size: 14pt)
  it
  v(sp-06)
}

#set table(
  stroke: (x, y) => if y == 0 {
    (bottom: 2pt + theme-interactive)
  } else {
    (bottom: 0.5pt + theme-border-subtle)
  },
  fill: (x, y) => if calc.odd(y) and y > 0 {
    theme-layer-01
  } else {
    theme-background
  },
  inset: sp-03
)

// ============================================
// TITLE PAGE
// ============================================

#align(center)[
  #v(2fr)

  // Carbon Blue Bar
  #block(
    width: 100%,
    height: 4pt,
    fill: theme-interactive
  )

  #v(sp-07)

  // Title
  #heading-06[{{title}}]

  #v(sp-05)

  // Subtitle
  #heading-03[{{subtitle}}]

  #v(sp-08)

  // Author
  #body-long-02[*{{author}}*]

  #v(sp-03)

  // Date
  #label-01[{{date}}]

  #v(2fr)

  // Badge
  #block(
    fill: theme-layer-01,
    stroke: 0.5pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-04
  )[
    #text(size: 12pt, fill: theme-text-secondary)[
      _Styled with IBM Carbon G100 Dark Theme_
    ]
  ]
]

#pagebreak()

// ============================================
// CONTENT
// ============================================

{{content}}
