// ============================================
// IBM Carbon Design System - Component Library
// Reusable UI components for professional documents
// ============================================

#import "carbon-icons.typ": icon

// ============================================
// CARBON COLOR PALETTE
// ============================================

#let blue-10 = rgb("#edf5ff")
#let blue-20 = rgb("#d0e2ff")
#let blue-60 = rgb("#0f62fe")
#let blue-70 = rgb("#0043ce")
#let gray-10 = rgb("#f4f4f4")
#let gray-20 = rgb("#e0e0e0")
#let gray-30 = rgb("#c6c6c6")
#let gray-50 = rgb("#8d8d8d")
#let gray-70 = rgb("#525252")
#let gray-80 = rgb("#393939")
#let gray-100 = rgb("#161616")
#let green-10 = rgb("#defbe6")
#let green-50 = rgb("#24a148")
#let green-60 = rgb("#198038")
#let red-10 = rgb("#fff1f1")
#let red-60 = rgb("#da1e28")
#let yellow-10 = rgb("#fcf4d6")
#let yellow-30 = rgb("#f1c21b")
#let purple-60 = rgb("#8a3ffc")
#let cyan-50 = rgb("#1192e8")

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
// THEME TOKENS
// ============================================

#let theme-background = white
#let theme-layer-01 = gray-10
#let theme-layer-02 = white
#let theme-border-subtle = gray-20
#let theme-border-strong = gray-50
#let theme-text-primary = gray-100
#let theme-text-secondary = gray-70
#let theme-text-placeholder = gray-50
#let theme-link-primary = blue-60
#let theme-interactive = blue-60
#let theme-focus = blue-60

// ============================================
// CARD COMPONENTS
// ============================================

// Standard card
#let card(
  title: none,
  content,
  padding: sp-05,
  background: theme-layer-01,
  border: theme-border-subtle
) = {
  block(
    width: 100%,
    fill: background,
    stroke: 1pt + border,
    radius: 4pt,
    inset: padding
  )[
    #if title != none {
      text(size: 14pt, weight: 600, fill: theme-text-primary)[#title]
      v(sp-03)
    }
    #set text(fill: theme-text-primary)
    #content
  ]
}

// Clickable tile (with visual indicator)
#let tile(
  title,
  description: none,
  icon: none,
  background: white,
  accent: blue-60
) = {
  block(
    width: 100%,
    fill: background,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-05
  )[
    // Accent bar on left
    #place(left + top, dx: -sp-05, dy: -sp-05)[
      #block(width: 4pt, height: 100% + 2 * sp-05, fill: accent)
    ]

    #if icon != none {
      text(size: 24pt, fill: accent)[#icon]
      v(sp-03)
    }

    #text(size: 16pt, weight: 600, fill: theme-text-primary)[#title]

    #if description != none {
      v(sp-02)
      text(size: 12pt, fill: theme-text-secondary)[#description]
    }
  ]
}

// Feature card with icon
#let feature-card(
  title,
  description,
  icon: "●",
  color: blue-60
) = {
  block(
    width: 100%,
    fill: white,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-05
  )[
    #grid(
      columns: (auto, 1fr),
      column-gutter: sp-04,
      align(horizon)[
        #circle(
          radius: 20pt,
          fill: color,
          text(size: 18pt, fill: white, weight: 600)[#icon]
        )
      ],
      stack(
        dir: ttb,
        spacing: sp-02,
        text(size: 14pt, weight: 600, fill: theme-text-primary)[#title],
        text(size: 11pt, fill: theme-text-secondary)[#description]
      )
    )
  ]
}

// ============================================
// BADGES AND TAGS
// ============================================

// Status badge
#let badge(
  content,
  variant: "default",
  size: "default"
) = {
  let (bg, fg) = if variant == "success" {
    (green-10, green-60)
  } else if variant == "error" {
    (red-10, red-60)
  } else if variant == "warning" {
    (yellow-10, gray-100)
  } else if variant == "info" {
    (blue-10, blue-70)
  } else {
    (gray-10, gray-80)
  }

  let font-size = if size == "small" { 9pt } else { 10pt }
  let padding-h = if size == "small" { sp-02 } else { sp-03 }
  let padding-v = if size == "small" { 2pt } else { sp-02 }

  box(
    fill: bg,
    outset: (x: padding-h, y: padding-v),
    radius: 12pt
  )[
    #text(size: font-size, weight: 600, fill: fg)[#content]
  ]
}

// Tag (removable label)
#let tag(
  content,
  color: gray-70,
  dismissible: false
) = {
  box(
    fill: gray-10,
    stroke: 1pt + theme-border-subtle,
    outset: (x: sp-03, y: sp-02),
    radius: 2pt
  )[
    #text(size: 10pt, fill: color)[#content]
    #if dismissible {
      h(sp-02)
      text(size: 8pt, fill: gray-50)[×]
    }
  ]
}

// ============================================
// NOTIFICATION BANNERS
// ============================================

#let notification(
  content,
  title: none,
  kind: "info",
  dismissible: false
) = {
  let (bg, border-color, icon-name, icon-color) = if kind == "success" {
    (green-10, green-60, "checkmark", green-60)
  } else if kind == "error" {
    (red-10, red-60, "error", red-60)
  } else if kind == "warning" {
    (yellow-10, yellow-30, "warning", yellow-30)
  } else {
    (blue-10, blue-60, "info", blue-60)
  }

  v(sp-05)
  block(
    width: 100%,
    fill: bg,
    stroke: (left: 4pt + border-color),
    inset: sp-05,
    radius: (right: 4pt)
  )[
    #grid(
      columns: (auto, 1fr, auto),
      column-gutter: sp-04,
      align(horizon)[
        #icon(icon-name, size: 18pt, color: icon-color)
      ],
      stack(
        dir: ttb,
        spacing: sp-02,
        if title != none {
          text(size: 12pt, weight: 600, fill: theme-text-primary)[#title]
        },
        text(size: 11pt, fill: theme-text-primary)[#content]
      ),
      if dismissible {
        align(horizon)[
          #text(size: 14pt, fill: gray-50)[×]
        ]
      }
    )
  ]
  v(sp-05)
}

// ============================================
// CALLOUT BOXES (Enhanced)
// ============================================

#let callout(
  content,
  title: none,
  type: "note",
  icon-override: none
) = {
  let (bg, border, icon-name, icon-color) = if type == "tip" {
    (green-10, green-60, "success", green-60)
  } else if type == "warning" {
    (yellow-10, yellow-30, "warning", yellow-30)
  } else if type == "important" {
    (red-10, red-60, "error", red-60)
  } else if type == "note" {
    (blue-10, blue-60, "info", blue-60)
  } else {
    (gray-10, gray-70, "info", gray-70)
  }

  let display-icon = if icon-override != none { icon-override } else { icon(icon-name, size: 16pt, color: icon-color) }

  v(sp-06)
  block(
    width: 100%,
    fill: bg,
    stroke: (left: 4pt + border),
    inset: sp-05,
    radius: (right: 4pt)
  )[
    #if title != none or icon-override != none {
      grid(
        columns: (auto, 1fr),
        column-gutter: sp-03,
        display-icon,
        text(size: 13pt, weight: 600, fill: theme-text-primary)[
          #if title != none { title } else { upper(type) }
        ]
      )
      v(sp-03)
    }
    #set text(fill: theme-text-primary, size: 11pt)
    #content
  ]
  v(sp-06)
}

// ============================================
// BREADCRUMBS
// ============================================

#let breadcrumbs(
  items,
  separator: "/"
) = {
  let result = ()
  for (i, item) in items.enumerate() {
    result.push(text(
      size: 11pt,
      fill: if i == items.len() - 1 { theme-text-primary } else { theme-link-primary }
    )[#item])

    if i < items.len() - 1 {
      result.push(h(sp-02))
      result.push(text(size: 11pt, fill: gray-50)[#separator])
      result.push(h(sp-02))
    }
  }
  result.join()
}

// ============================================
// DEFINITION LIST
// ============================================

#let definition-list(
  items
) = {
  for (term, definition) in items {
    v(sp-04)
    text(size: 12pt, weight: 600, fill: theme-text-primary)[#term]
    v(sp-02)
    block(inset: (left: sp-05))[
      #text(size: 11pt, fill: theme-text-secondary)[#definition]
    ]
  }
}

// ============================================
// TABLE OF CONTENTS
// ============================================

#let table-of-contents(
  title: "Table of Contents",
  depth: 3
) = {
  v(sp-08)
  heading(outlined: false)[#title]
  v(sp-05)

  outline(
    title: none,
    depth: depth,
    indent: auto
  )

  v(sp-08)
  pagebreak()
}

// ============================================
// TIMELINE
// ============================================

#let timeline-item(
  date,
  title,
  description,
  color: blue-60
) = {
  grid(
    columns: (80pt, auto, 1fr),
    column-gutter: sp-04,
    align(right + horizon)[
      #text(size: 10pt, fill: theme-text-secondary, weight: 600)[#date]
    ],
    align(center + horizon)[
      #circle(radius: 6pt, fill: color, stroke: 3pt + white)
    ],
    stack(
      dir: ttb,
      spacing: sp-02,
      text(size: 13pt, weight: 600, fill: theme-text-primary)[#title],
      text(size: 11pt, fill: theme-text-secondary)[#description]
    )
  )
  v(sp-05)
}

// ============================================
// ACCORDION (Visual representation)
// ============================================

#let accordion(
  title,
  content,
  expanded: true
) = {
  v(sp-04)
  block(
    width: 100%,
    fill: white,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt
  )[
    // Header
    #block(
      width: 100%,
      fill: theme-layer-01,
      inset: sp-04
    )[
      #grid(
        columns: (1fr, auto),
        text(size: 12pt, weight: 600, fill: theme-text-primary)[#title],
        text(size: 12pt, fill: gray-70)[#if expanded { "−" } else { "+" }]
      )
    ]

    // Content (only if expanded)
    #if expanded {
      block(
        width: 100%,
        inset: sp-05
      )[
        #set text(fill: theme-text-primary, size: 11pt)
        #content
      ]
    }
  ]
  v(sp-04)
}

// ============================================
// DIVIDERS
// ============================================

#let divider(
  spacing: sp-06,
  color: theme-border-subtle,
  thickness: 1pt
) = {
  v(spacing)
  line(length: 100%, stroke: thickness + color)
  v(spacing)
}

#let section-divider(
  label: none,
  spacing: sp-08
) = {
  v(spacing)
  if label != none {
    grid(
      columns: (1fr, auto, 1fr),
      column-gutter: sp-04,
      align: horizon,
      line(length: 100%, stroke: 1pt + theme-border-subtle),
      text(size: 10pt, fill: theme-text-secondary, weight: 600)[#label],
      line(length: 100%, stroke: 1pt + theme-border-subtle)
    )
  } else {
    line(length: 100%, stroke: 2pt + theme-border-subtle)
  }
  v(spacing)
}

// ============================================
// PROGRESS BAR
// ============================================

#let progress-bar(
  value,
  max: 100,
  label: none,
  show-percentage: true,
  color: blue-60,
  height: 8pt
) = {
  let percentage = calc.min(value / max * 100, 100)
  
  v(sp-03)
  if label != none {
    text(size: 11pt, weight: 600, fill: theme-text-primary)[#label]
    v(sp-02)
  }
  
  block(
    width: 100%,
    height: height,
    fill: gray-20,
    radius: height / 2
  )[
    #block(
      width: percentage * 1%,
      height: 100%,
      fill: color,
      radius: height / 2
    )
  ]
  
  if show-percentage {
    v(sp-02)
    text(size: 10pt, fill: theme-text-secondary)[#calc.round(percentage)%]
  }
  v(sp-03)
}

// ============================================
// METER / GAUGE
// ============================================

#let meter(
  value,
  max: 100,
  label: none,
  color: blue-60,
  size: 80pt
) = {
  let percentage = calc.min(value / max * 100, 100)
  let angle = percentage * 1.8  // 180 degrees for half circle
  
  align(center)[
    #block(width: size, height: size / 2 + 20pt)[
      // Background arc (gray)
      #place(center + top)[
        #circle(radius: size / 2, fill: none, stroke: 8pt + gray-20)
      ]
      // Value display
      #place(center + bottom, dy: -10pt)[
        #text(size: size / 4, weight: 300, fill: color)[#value]
        #v(-sp-02)
        #if label != none {
          text(size: 10pt, fill: theme-text-secondary)[#label]
        }
      ]
    ]
  ]
}

// ============================================
// STAT TILE (Enhanced KPI Display)
// ============================================

#let stat-tile(
  value,
  label,
  trend: none,
  trend-value: none,
  color: blue-60
) = {
  block(
    width: 100%,
    fill: theme-layer-01,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-05
  )[
    #text(size: 10pt, fill: theme-text-secondary, weight: 500)[#upper(label)]
    #v(sp-03)
    #text(size: 36pt, weight: 300, fill: color)[#value]
    #if trend != none {
      v(sp-02)
      let trend-color = if trend == "up" { green-50 } else if trend == "down" { red-60 } else { gray-50 }
      let trend-icon = if trend == "up" { "↑" } else if trend == "down" { "↓" } else { "→" }
      text(size: 11pt, fill: trend-color)[#trend-icon #trend-value]
    }
  ]
}

// ============================================
// AVATAR
// ============================================

#let avatar(
  initials,
  size: 40pt,
  color: blue-60
) = {
  circle(
    radius: size / 2,
    fill: color
  )[
    #align(center + horizon)[
      #text(size: size / 2.5, weight: 600, fill: white)[#initials]
    ]
  ]
}

// ============================================
// CHIP / PILL
// ============================================

#let chip(
  content,
  color: blue-60,
  outlined: false
) = {
  if outlined {
    box(
      stroke: 1.5pt + color,
      outset: (x: sp-03, y: sp-02),
      radius: 16pt
    )[
      #text(size: 11pt, weight: 500, fill: color)[#content]
    ]
  } else {
    box(
      fill: color,
      outset: (x: sp-03, y: sp-02),
      radius: 16pt
    )[
      #text(size: 11pt, weight: 500, fill: white)[#content]
    ]
  }
}

// ============================================
// KEY-VALUE PAIR
// ============================================

#let key-value(
  key,
  value,
  separator: ":"
) = {
  grid(
    columns: (auto, 1fr),
    column-gutter: sp-03,
    text(size: 11pt, weight: 600, fill: theme-text-secondary)[#key#separator],
    text(size: 11pt, fill: theme-text-primary)[#value]
  )
}

// ============================================
// COMPARISON TABLE
// ============================================

#let comparison-table(
  headers,
  features,
  check-symbol: "✓",
  cross-symbol: "—"
) = {
  table(
    columns: headers.len() + 1,
    align: (left,) + (center,) * headers.len(),
    table.header(
      [*Feature*],
      ..headers.map(h => [*#h*])
    ),
    ..for (feature, values) in features {
      (
        [#feature],
        ..values.map(v => {
          if v == true {
            text(fill: green-50, weight: 600)[#check-symbol]
          } else if v == false {
            text(fill: gray-50)[#cross-symbol]
          } else {
            [#v]
          }
        })
      )
    }
  )
}

// ============================================
// FOOTNOTE
// ============================================

#let footnote-ref(num) = {
  super(text(size: 9pt, fill: theme-link-primary)[#num])
}

#let footnote-content(num, content) = {
  grid(
    columns: (auto, 1fr),
    column-gutter: sp-02,
    text(size: 9pt, fill: theme-text-secondary)[#num.],
    text(size: 9pt, fill: theme-text-secondary)[#content]
  )
}

// ============================================
// STATISTICS GRID
// ============================================

#let stat-grid(
  stats
) = {
  grid(
    columns: stats.len(),
    column-gutter: sp-06,
    ..for stat in stats {
      (
        block(
          width: 100%,
          fill: theme-layer-01,
          stroke: 1pt + theme-border-subtle,
          radius: 4pt,
          inset: sp-05
        )[
          #align(center)[
            #text(size: 32pt, weight: 300, fill: blue-60)[#stat.value]
            #v(sp-02)
            #text(size: 10pt, fill: theme-text-secondary)[#stat.label]
          ]
        ],
      )
    }
  )
}

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
  #text(size: 16pt, weight: 600)[{{author}}]

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
      _Styled with IBM Carbon Component Library_
    ]
  ]
]

#pagebreak()

// ============================================
// CONTENT
// ============================================

{{content}}
