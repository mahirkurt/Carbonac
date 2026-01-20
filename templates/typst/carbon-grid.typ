// ============================================
// IBM Carbon Design System - 2x Grid & Spacing
// 16-column grid with complete spacing tokens
// ============================================

// ============================================
// CARBON COLOR PALETTE
// ============================================

#let blue-60 = rgb("#0f62fe")
#let gray-10 = rgb("#f4f4f4")
#let gray-20 = rgb("#e0e0e0")
#let gray-30 = rgb("#c6c6c6")
#let gray-50 = rgb("#8d8d8d")
#let gray-70 = rgb("#525252")
#let gray-100 = rgb("#161616")
#let green-50 = rgb("#24a148")
#let purple-60 = rgb("#8a3ffc")
#let red-60 = rgb("#da1e28")

// ============================================
// SPACING TOKENS (8px base unit)
// ============================================

#let sp-01 = 2pt    // 2px
#let sp-02 = 4pt    // 4px
#let sp-03 = 8pt    // 8px - Base unit
#let sp-04 = 12pt   // 12px
#let sp-05 = 16pt   // 16px
#let sp-06 = 24pt   // 24px
#let sp-07 = 32pt   // 32px
#let sp-08 = 40pt   // 40px
#let sp-09 = 48pt   // 48px
#let sp-10 = 64pt   // 64px
#let sp-11 = 80pt   // 80px
#let sp-12 = 96pt   // 96px
#let sp-13 = 160pt  // 160px

// ============================================
// GRID CONFIGURATION (16 columns)
// ============================================

#let grid-columns = 16
#let grid-gutter = sp-07  // 32px default gutter
#let grid-margin = sp-05  // 16px page margins

// Calculate column width for A4 page
// A4 width: 595pt, margins: 48pt each side = 499pt usable
#let page-width = 499pt
#let column-width = (page-width - (grid-gutter * (grid-columns - 1))) / grid-columns

// ============================================
// GRID HELPER FUNCTIONS
// ============================================

// Create a grid row with specified columns
#let grid-row(..children) = {
  grid(
    columns: children.pos().len(),
    column-gutter: grid-gutter,
    ..children
  )
}

// Create a 2-column layout
#let two-columns(left, right, gutter: grid-gutter) = {
  grid(
    columns: (1fr, 1fr),
    column-gutter: gutter,
    left,
    right
  )
}

// Create a 3-column layout
#let three-columns(left, center, right, gutter: grid-gutter) = {
  grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: gutter,
    left,
    center,
    right
  )
}

// Create a 4-column layout
#let four-columns(c1, c2, c3, c4, gutter: grid-gutter) = {
  grid(
    columns: (1fr, 1fr, 1fr, 1fr),
    column-gutter: gutter,
    c1, c2, c3, c4
  )
}

// Create a sidebar layout (1/3 - 2/3)
#let sidebar-layout(sidebar, main, gutter: grid-gutter) = {
  grid(
    columns: (1fr, 2fr),
    column-gutter: gutter,
    sidebar,
    main
  )
}

// Create a container with max width
#let container(content, width: 100%) = {
  block(
    width: width,
    content
  )
}

// Spacer utility
#let spacer(size) = {
  v(size)
}

// Divider with spacing
#let divider(spacing: sp-06, color: gray-20) = {
  v(spacing)
  line(length: 100%, stroke: 1pt + color)
  v(spacing)
}

// ============================================
// LAYOUT COMPONENTS
// ============================================

// Card component with spacing
#let card(content, padding: sp-05, background: gray-10, border: gray-20) = {
  block(
    fill: background,
    stroke: 1pt + border,
    radius: 4pt,
    inset: padding,
    width: 100%,
    content
  )
}

// Section with spacing
#let section(title, content, spacing: sp-08) = {
  v(spacing)
  if title != none {
    text(size: 20pt, weight: 600, fill: gray-100)[#title]
    v(sp-04)
  }
  content
  v(spacing)
}

// Info box
#let info-box(content, color: blue-60) = {
  block(
    fill: rgb("#edf5ff"),  // blue-10
    stroke: (left: 4pt + color),
    inset: (left: sp-05, right: sp-05, top: sp-04, bottom: sp-04),
    radius: (right: 4pt),
    width: 100%
  )[
    #set text(fill: gray-100)
    #content
  ]
}

// Warning box
#let warning-box(content) = {
  block(
    fill: rgb("#fcf4d6"),  // yellow-10
    stroke: (left: 4pt + rgb("#f1c21b")),  // yellow-30
    inset: (left: sp-05, right: sp-05, top: sp-04, bottom: sp-04),
    radius: (right: 4pt),
    width: 100%
  )[
    #set text(fill: gray-100)
    #content
  ]
}

// Error box
#let error-box(content) = {
  block(
    fill: rgb("#fff1f1"),  // red-10
    stroke: (left: 4pt + red-60),
    inset: (left: sp-05, right: sp-05, top: sp-04, bottom: sp-04),
    radius: (right: 4pt),
    width: 100%
  )[
    #set text(fill: gray-100)
    #content
  ]
}

// Success box
#let success-box(content) = {
  block(
    fill: rgb("#defbe6"),  // green-10
    stroke: (left: 4pt + green-50),
    inset: (left: sp-05, right: sp-05, top: sp-04, bottom: sp-04),
    radius: (right: 4pt),
    width: 100%
  )[
    #set text(fill: gray-100)
    #content
  ]
}

// ============================================
// THEME TOKENS
// ============================================

#let theme-background = white
#let theme-layer-01 = gray-10
#let theme-border-subtle = gray-20
#let theme-text-primary = gray-100
#let theme-text-secondary = gray-70
#let theme-link-primary = blue-60
#let theme-interactive = blue-60

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

#let label-01(content) = text(
  size: 12pt,
  weight: 400,
  fill: theme-text-secondary,
  font: "IBM Plex Sans"
)[#set par(leading: 1.33em); #content]

#let code-01(content) = text(
  size: 12pt,
  weight: 400,
  fill: theme-link-primary,
  font: "IBM Plex Mono"
)[#content]

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
  fill: theme-text-primary,
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
    white
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
      _Styled with IBM Carbon 2x Grid System_
    ]
  ]
]

#pagebreak()

// ============================================
// CONTENT
// ============================================

{{content}}
