// ============================================
// IBM Carbon Design System - Color System Template
// Full color palette with theme support
// ============================================

// ============================================
// CARBON COLOR PALETTE - 10 Families
// ============================================

// Blue Family (Primary Interactive)
#let blue-10 = rgb("#edf5ff")
#let blue-20 = rgb("#d0e2ff")
#let blue-30 = rgb("#a6c8ff")
#let blue-40 = rgb("#78a9ff")
#let blue-50 = rgb("#4589ff")
#let blue-60 = rgb("#0f62fe")  // Primary
#let blue-70 = rgb("#0043ce")
#let blue-80 = rgb("#002d9c")
#let blue-90 = rgb("#001d6c")
#let blue-100 = rgb("#001141")

// Gray Family (Neutral)
#let gray-10 = rgb("#f4f4f4")
#let gray-20 = rgb("#e0e0e0")
#let gray-30 = rgb("#c6c6c6")
#let gray-40 = rgb("#a8a8a8")
#let gray-50 = rgb("#8d8d8d")
#let gray-60 = rgb("#6f6f6f")
#let gray-70 = rgb("#525252")
#let gray-80 = rgb("#393939")
#let gray-90 = rgb("#262626")
#let gray-100 = rgb("#161616")  // Text primary

// Red Family (Danger/Error)
#let red-10 = rgb("#fff1f1")
#let red-20 = rgb("#ffd7d9")
#let red-30 = rgb("#ffb3b8")
#let red-40 = rgb("#ff8389")
#let red-50 = rgb("#fa4d56")
#let red-60 = rgb("#da1e28")  // Error
#let red-70 = rgb("#a2191f")
#let red-80 = rgb("#750e13")
#let red-90 = rgb("#520408")
#let red-100 = rgb("#2d0709")

// Green Family (Success)
#let green-10 = rgb("#defbe6")
#let green-20 = rgb("#a7f0ba")
#let green-30 = rgb("#6fdc8c")
#let green-40 = rgb("#42be65")
#let green-50 = rgb("#24a148")  // Success
#let green-60 = rgb("#198038")
#let green-70 = rgb("#0e6027")
#let green-80 = rgb("#044317")
#let green-90 = rgb("#022d0d")
#let green-100 = rgb("#071908")

// Purple Family
#let purple-10 = rgb("#f6f2ff")
#let purple-20 = rgb("#e8daff")
#let purple-30 = rgb("#d4bbff")
#let purple-40 = rgb("#be95ff")
#let purple-50 = rgb("#a56eff")
#let purple-60 = rgb("#8a3ffc")  // Code keywords
#let purple-70 = rgb("#6929c4")
#let purple-80 = rgb("#491d8b")
#let purple-90 = rgb("#31135e")
#let purple-100 = rgb("#1c0f30")

// Cyan Family
#let cyan-10 = rgb("#e5f6ff")
#let cyan-20 = rgb("#bae6ff")
#let cyan-30 = rgb("#82cfff")
#let cyan-40 = rgb("#33b1ff")
#let cyan-50 = rgb("#1192e8")  // Links
#let cyan-60 = rgb("#0072c3")
#let cyan-70 = rgb("#00539a")
#let cyan-80 = rgb("#003a6d")
#let cyan-90 = rgb("#012749")
#let cyan-100 = rgb("#061727")

// Teal Family
#let teal-10 = rgb("#d9fbfb")
#let teal-20 = rgb("#9ef0f0")
#let teal-30 = rgb("#3ddbd9")
#let teal-40 = rgb("#08bdba")
#let teal-50 = rgb("#009d9a")
#let teal-60 = rgb("#007d79")
#let teal-70 = rgb("#005d5d")
#let teal-80 = rgb("#004144")
#let teal-90 = rgb("#022b30")
#let teal-100 = rgb("#081a1c")

// Magenta Family
#let magenta-10 = rgb("#fff0f7")
#let magenta-20 = rgb("#ffd6e8")
#let magenta-30 = rgb("#ffafd2")
#let magenta-40 = rgb("#ff7eb6")
#let magenta-50 = rgb("#ee5396")
#let magenta-60 = rgb("#d02670")
#let magenta-70 = rgb("#9f1853")
#let magenta-80 = rgb("#740937")
#let magenta-90 = rgb("#510224")
#let magenta-100 = rgb("#2a0a18")

// Yellow Family (Warning)
#let yellow-10 = rgb("#fcf4d6")
#let yellow-20 = rgb("#fddc69")
#let yellow-30 = rgb("#f1c21b")  // Warning
#let yellow-40 = rgb("#d2a106")
#let yellow-50 = rgb("#b28600")
#let yellow-60 = rgb("#8e6a00")
#let yellow-70 = rgb("#684e00")
#let yellow-80 = rgb("#483700")
#let yellow-90 = rgb("#302400")
#let yellow-100 = rgb("#1c1500")

// Orange Family
#let orange-10 = rgb("#fff2e8")
#let orange-20 = rgb("#ffd9be")
#let orange-30 = rgb("#ffb784")
#let orange-40 = rgb("#ff832b")
#let orange-50 = rgb("#eb6200")
#let orange-60 = rgb("#ba4e00")
#let orange-70 = rgb("#8a3800")
#let orange-80 = rgb("#5e2900")
#let orange-90 = rgb("#3e1a00")
#let orange-100 = rgb("#231000")

// ============================================
// THEME TOKENS - White Theme (Default)
// ============================================

#let theme-background = white
#let theme-layer-01 = gray-10
#let theme-layer-02 = white
#let theme-layer-03 = gray-10
#let theme-field-01 = gray-10
#let theme-field-02 = white
#let theme-border-subtle = gray-20
#let theme-border-strong = gray-50
#let theme-text-primary = gray-100
#let theme-text-secondary = gray-70
#let theme-text-placeholder = gray-40
#let theme-text-helper = gray-60
#let theme-text-error = red-60
#let theme-link-primary = blue-60
#let theme-interactive = blue-60
#let theme-focus = blue-60
#let theme-inverse = gray-100

// ============================================
// DATA VISUALIZATION - Categorical Palette
// ============================================

#let dataviz-colors = (
  purple-70,  // #6929c4
  cyan-50,    // #1192e8
  teal-70,    // #005d5d
  magenta-70, // #9f1853
  red-50,     // #fa4d56
  red-90,     // #520408
  green-60,   // #198038
  blue-80,    // #002d9c
  magenta-50, // #ee5396
  purple-50,  // #a56eff
  teal-50,    // #009d9a
  cyan-90,    // #012749
  blue-50,    // #4589ff
  green-30    // #6fdc8c
)

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
// COLOR UTILITY FUNCTIONS
// ============================================

// Create a color swatch box
#let color-swatch(color, label) = {
  block(
    width: 100%,
    height: 40pt,
    fill: color,
    stroke: 1pt + gray-20,
    radius: 2pt,
    inset: sp-03
  )[
    #text(
      fill: if label.contains("10") or label.contains("20") or label.contains("30") { gray-100 } else { white },
      size: 10pt,
      weight: 600
    )[#label]
  ]
}

// Create a data viz color block
#let dataviz-block(color, index) = {
  block(
    width: 100%,
    height: 30pt,
    fill: color,
    stroke: 0.5pt + gray-20,
    radius: 2pt
  )[
    #align(center + horizon)[
      #text(fill: white, size: 9pt, weight: 600)[#index]
    ]
  ]
}

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
      _Styled with IBM Carbon Design System (Color Template)_
    ]
  ]
]

#pagebreak()

// ============================================
// CONTENT
// ============================================

{{content}}
