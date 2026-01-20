// ============================================
// IBM Carbon Design System - Advanced Typst Template
// Complete Typography System
// ============================================

// ============================================
// CARBON COLOR TOKENS
// ============================================

#let carbon-blue-60 = rgb("#0f62fe")
#let carbon-gray-10 = rgb("#f4f4f4")
#let carbon-gray-20 = rgb("#e0e0e0")
#let carbon-gray-50 = rgb("#8d8d8d")
#let carbon-gray-70 = rgb("#525252")
#let carbon-gray-80 = rgb("#393939")
#let carbon-gray-90 = rgb("#262626")
#let carbon-gray-100 = rgb("#161616")

// ============================================
// SPACING TOKENS (8px base)
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
// TYPE SCALE FUNCTIONS
// ============================================

// Heading 06 (42px - Main title)
#let heading-06(content) = text(
  size: 42pt,
  weight: 300,
  fill: carbon-gray-100,
  font: "IBM Plex Sans"
)[#set par(leading: 1.19em); #content]

// Heading 05 (32px - Section header)
#let heading-05(content) = text(
  size: 32pt,
  weight: 400,
  fill: carbon-gray-100,
  font: "IBM Plex Sans"
)[#set par(leading: 1.25em); #content]

// Heading 04 (28px - Subsection)
#let heading-04(content) = text(
  size: 28pt,
  weight: 400,
  fill: carbon-gray-100,
  font: "IBM Plex Sans"
)[#set par(leading: 1.29em); #content]

// Heading 03 (20px - Minor heading)
#let heading-03(content) = text(
  size: 20pt,
  weight: 400,
  fill: carbon-gray-90,
  font: "IBM Plex Sans"
)[#set par(leading: 1.4em); #content]

// Heading 02 (16px - Small heading)
#let heading-02(content) = text(
  size: 16pt,
  weight: 600,
  fill: carbon-gray-90,
  font: "IBM Plex Sans"
)[#set par(leading: 1.375em); #content]

// Heading 01 (14px - Smallest heading)
#let heading-01(content) = text(
  size: 14pt,
  weight: 600,
  fill: carbon-gray-80,
  font: "IBM Plex Sans"
)[#set par(leading: 1.29em); #content]

// Body Long 02 (16px - Default body)
#let body-long-02(content) = text(
  size: 16pt,
  weight: 400,
  fill: carbon-gray-100,
  font: "IBM Plex Sans"
)[#set par(leading: 1.5em); #content]

// Body Long 01 (14px - Compact body)
#let body-long-01(content) = text(
  size: 14pt,
  weight: 400,
  fill: carbon-gray-100,
  font: "IBM Plex Sans"
)[#set par(leading: 1.43em); #content]

// Code 02 (14pt - Code blocks)
#let code-02(content) = text(
  size: 14pt,
  weight: 400,
  fill: carbon-gray-100,
  font: "IBM Plex Mono"
)[#set par(leading: 1.43em); #content]

// Code 01 (12pt - Inline code)
#let code-01(content) = text(
  size: 12pt,
  weight: 400,
  fill: carbon-blue-60,
  font: "IBM Plex Mono"
)[#content]

// Label 01 (12pt - Small labels)
#let label-01(content) = text(
  size: 12pt,
  weight: 400,
  fill: carbon-gray-70,
  font: "IBM Plex Sans"
)[#set par(leading: 1.33em); #content]

// Label 02 (14pt - Labels)
#let label-02(content) = text(
  size: 14pt,
  weight: 400,
  fill: carbon-gray-70,
  font: "IBM Plex Sans"
)[#set par(leading: 1.14em); #content]

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
      #line(length: 100%, stroke: 0.5pt + carbon-gray-20)
    ]
  },
  footer: context {
    line(length: 100%, stroke: 0.5pt + carbon-gray-20)
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
  fill: carbon-gray-100,
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
  line(length: 100%, stroke: 2pt + carbon-blue-60)
  v(sp-06)
}

#show heading.where(level: 2): it => {
  v(sp-08)
  heading-05(it.body)
  v(sp-04)
  line(length: 30%, stroke: 1.5pt + carbon-blue-60)
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

#show heading.where(level: 6): it => {
  v(sp-04)
  heading-01(it.body)
  v(sp-02)
}

// ============================================
// CODE BLOCKS
// ============================================

#show raw.where(block: true): it => {
  block(
    fill: carbon-gray-10,
    stroke: 1pt + carbon-gray-20,
    radius: 4pt,
    inset: sp-05,
    width: 100%
  )[
    #code-02(it)
  ]
}

#show raw.where(block: false): it => {
  box(
    fill: carbon-gray-10,
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
  set text(fill: carbon-blue-60)
  underline(it)
}

// ============================================
// LISTS
// ============================================

#set list(
  indent: 1em,
  body-indent: 0.5em,
  marker: text(fill: carbon-blue-60, size: 1.2em)[•]
)

#set enum(
  indent: 1em,
  body-indent: 0.5em,
  numbering: n => text(fill: carbon-blue-60)[#n.]
)

// ============================================
// BLOCKQUOTES
// ============================================

#show quote: it => {
  v(sp-06)
  block(
    fill: carbon-gray-10,
    stroke: (left: 4pt + carbon-blue-60),
    inset: (left: sp-05, right: sp-05, top: sp-04, bottom: sp-04),
    width: 100%
  )[
    #set text(fill: carbon-gray-70, style: "italic")
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
    (bottom: 2pt + carbon-blue-60)
  } else {
    (bottom: 0.5pt + carbon-gray-20)
  },
  fill: (x, y) => if calc.odd(y) and y > 0 {
    carbon-gray-10
  } else {
    white
  },
  inset: sp-03
)

// ============================================
// FIGURES
// ============================================

#show figure: it => {
  v(sp-07)
  align(center)[
    #block(
      stroke: 0.5pt + carbon-gray-20,
      radius: 4pt,
      clip: true
    )[
      #it.body
    ]
    #v(sp-03)
    #label-01[#it.caption]
  ]
  v(sp-07)
}

// ============================================
// TITLE PAGE
// ============================================

#align(center)[
  #v(2fr)

  // Carbon Blue Bar
  #block(
    width: 100%,
    height: 4pt,
    fill: carbon-blue-60
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
  #label-02[{{date}}]

  #v(2fr)

  // Badge
  #block(
    fill: carbon-gray-10,
    stroke: 0.5pt + carbon-gray-20,
    radius: 4pt,
    inset: sp-04
  )[
    #text(size: 12pt, fill: carbon-gray-70)[
      _Styled with IBM Carbon Design System (Advanced Template)_
    ]
  ]
]

#pagebreak()

// ============================================
// CONTENT
// ============================================

{{content}}
