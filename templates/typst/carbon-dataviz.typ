// ============================================
// IBM Carbon Design System - Data Visualization
// Chart templates and visualization components
// ============================================

// ============================================
// CARBON COLOR PALETTE
// ============================================

// Blue Family
#let blue-10 = rgb("#edf5ff")
#let blue-20 = rgb("#d0e2ff")
#let blue-40 = rgb("#78a9ff")
#let blue-50 = rgb("#4589ff")
#let blue-60 = rgb("#0f62fe")
#let blue-80 = rgb("#002d9c")

// Gray Family
#let gray-10 = rgb("#f4f4f4")
#let gray-20 = rgb("#e0e0e0")
#let gray-30 = rgb("#c6c6c6")
#let gray-50 = rgb("#8d8d8d")
#let gray-70 = rgb("#525252")
#let gray-100 = rgb("#161616")

// Extended Colors
#let purple-50 = rgb("#a56eff")
#let purple-60 = rgb("#8a3ffc")
#let purple-70 = rgb("#6929c4")
#let cyan-50 = rgb("#1192e8")
#let cyan-90 = rgb("#012749")
#let teal-50 = rgb("#009d9a")
#let teal-70 = rgb("#005d5d")
#let magenta-50 = rgb("#ee5396")
#let magenta-70 = rgb("#9f1853")
#let red-50 = rgb("#fa4d56")
#let red-60 = rgb("#da1e28")
#let red-90 = rgb("#520408")
#let green-30 = rgb("#6fdc8c")
#let green-50 = rgb("#24a148")
#let green-60 = rgb("#198038")

// ============================================
// DATA VISUALIZATION COLOR PALETTES
// ============================================

// Categorical palette (14 colors for distinct series)
#let dataviz-categorical = (
  purple-70,   // 1
  cyan-50,     // 2
  teal-70,     // 3
  magenta-70,  // 4
  red-50,      // 5
  red-90,      // 6
  green-60,    // 7
  blue-80,     // 8
  magenta-50,  // 9
  purple-50,   // 10
  teal-50,     // 11
  cyan-90,     // 12
  blue-50,     // 13
  green-30     // 14
)

// Sequential Blue (light to dark)
#let dataviz-seq-blue = (blue-10, blue-20, blue-40, blue-50, blue-60, blue-80)

// Diverging palette (negative to positive)
#let dataviz-diverging-redgreen = (red-60, red-50, gray-30, green-50, green-60)

// Monochrome palette
#let dataviz-mono = (gray-10, gray-20, gray-30, gray-50, gray-70, gray-100)

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
#let theme-border-subtle = gray-20
#let theme-text-primary = gray-100
#let theme-text-secondary = gray-70
#let theme-link-primary = blue-60
#let theme-interactive = blue-60

// ============================================
// CHART HELPER FUNCTIONS
// ============================================

// Simple horizontal bar chart
#let bar-chart(
  data,
  labels: (),
  max-value: auto,
  colors: dataviz-categorical,
  height: 200pt,
  show-values: true
) = {
  let computed-max = if max-value == auto {
    calc.max(..data)
  } else {
    max-value
  }

  let bar-height = 24pt
  let bar-spacing = 8pt
  let chart-height = data.len() * (bar-height + bar-spacing)

  block(
    width: 100%,
    height: chart-height,
    fill: white,
    stroke: 1pt + theme-border-subtle,
    inset: sp-05
  )[
    #for (i, value) in data.enumerate() {
      let label = if labels.len() > i { labels.at(i) } else { "Item " + str(i + 1) }
      let color = colors.at(calc.rem(i, colors.len()))
      let bar-width = (value / computed-max) * 80%

      v(if i > 0 { bar-spacing } else { 0pt })

      grid(
        columns: (20%, 1fr),
        column-gutter: sp-03,
        align(right + horizon)[
          #text(size: 11pt, fill: theme-text-secondary)[#label]
        ],
        stack(
          dir: ltr,
          block(
            width: bar-width,
            height: bar-height,
            fill: color,
            radius: 2pt
          ),
          h(sp-02),
          if show-values {
            align(horizon)[
              #text(size: 10pt, weight: 600, fill: theme-text-primary)[#value]
            ]
          }
        )
      )
    }
  ]
}

// Vertical bar chart
#let column-chart(
  data,
  labels: (),
  max-value: auto,
  colors: dataviz-categorical,
  height: 200pt,
  show-values: true
) = {
  let computed-max = if max-value == auto {
    calc.max(..data)
  } else {
    max-value
  }

  let column-width = 40pt
  let column-spacing = sp-04
  let total-width = data.len() * (column-width + column-spacing)

  block(
    width: 100%,
    height: height + 40pt,
    fill: white,
    stroke: 1pt + theme-border-subtle,
    inset: sp-05
  )[
    #grid(
      columns: data.len(),
      column-gutter: column-spacing,
      ..for (i, value) in data.enumerate() {
        let label = if labels.len() > i { labels.at(i) } else { str(i + 1) }
        let color = colors.at(calc.rem(i, colors.len()))
        let column-height = (value / computed-max) * height

        (
          stack(
            dir: ttb,
            spacing: sp-02,
            align(center + bottom)[
              #if show-values {
                text(size: 10pt, weight: 600, fill: theme-text-primary)[#value]
              }
            ],
            align(bottom)[
              #block(
                width: column-width,
                height: column-height,
                fill: color,
                radius: (top: 2pt)
              )
            ],
            v(sp-02),
            align(center)[
              #text(size: 10pt, fill: theme-text-secondary)[#label]
            ]
          ),
        )
      }
    )
  ]
}

// Enhanced data table with color coding
#let data-table(
  headers,
  rows,
  highlight-column: none,
  color-scale: dataviz-seq-blue
) = {
  let column-count = headers.len()

  table(
    columns: column-count,
    stroke: (x, y) => if y == 0 {
      (bottom: 2pt + theme-interactive)
    } else {
      (bottom: 0.5pt + theme-border-subtle)
    },
    fill: (x, y) => {
      if y == 0 {
        // Header row
        theme-interactive
      } else if calc.odd(y) {
        theme-layer-01
      } else {
        white
      }
    },
    inset: sp-03,
    align: (x, y) => if y == 0 { center } else if x == 0 { left } else { right },

    // Headers
    ..for header in headers {
      (text(weight: 600, fill: white, size: 12pt)[#header],)
    },

    // Data rows
    ..for row in rows {
      for cell in row {
        (text(fill: theme-text-primary, size: 11pt)[#cell],)
      }
    }
  )
}

// Key-value metric display
#let metric-card(
  value,
  label,
  change: none,
  trend: "neutral",
  color: blue-60
) = {
  let trend-color = if trend == "up" {
    green-60
  } else if trend == "down" {
    red-60
  } else {
    gray-70
  }

  block(
    width: 100%,
    fill: theme-layer-01,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-05
  )[
    #stack(
      dir: ttb,
      spacing: sp-02,
      text(size: 10pt, fill: theme-text-secondary, weight: 600)[#label],
      text(size: 32pt, fill: color, weight: 300)[#value],
      if change != none {
        text(size: 12pt, fill: trend-color)[
          #if trend == "up" [↑] else if trend == "down" [↓] else [→]
          #change
        ]
      }
    )
  ]
}

// Progress bar
#let progress-bar(
  value,
  max-value: 100,
  label: none,
  color: blue-60,
  height: 16pt
) = {
  let percent = (value / max-value) * 100%

  stack(
    dir: ttb,
    spacing: sp-02,
    if label != none {
      grid(
        columns: (1fr, auto),
        text(size: 11pt, fill: theme-text-primary)[#label],
        text(size: 11pt, fill: theme-text-secondary)[#value / #max-value]
      )
    },
    block(
      width: 100%,
      height: height,
      fill: gray-20,
      radius: height / 2,
      clip: true
    )[
      #block(
        width: percent,
        height: 100%,
        fill: color
      )
    ]
  )
}

// Sparkline (mini line chart)
#let sparkline(
  data,
  width: 80pt,
  height: 24pt,
  color: blue-60,
  show-area: false
) = {
  let max-val = calc.max(..data)
  let min-val = calc.min(..data)
  let range = max-val - min-val

  if range == 0 {
    range = 1
  }

  box(
    width: width,
    height: height,
    clip: true
  )[
    #place[
      #for (i, value) in data.enumerate() {
        let x = (i / (data.len() - 1)) * width
        let y = height - ((value - min-val) / range) * height

        place(dx: x, dy: y)[
          #circle(radius: 1.5pt, fill: color)
        ]

        if i > 0 {
          let prev-value = data.at(i - 1)
          let prev-x = ((i - 1) / (data.len() - 1)) * width
          let prev-y = height - ((prev-value - min-val) / range) * height

          place[
            #line(
              start: (prev-x, prev-y),
              end: (x, y),
              stroke: 1.5pt + color
            )
          ]
        }
      }
    ]
  ]
}

// Legend component
#let chart-legend(
  items,
  colors: dataviz-categorical,
  columns: 2
) = {
  grid(
    columns: columns,
    column-gutter: sp-05,
    row-gutter: sp-03,
    ..for (i, item) in items.enumerate() {
      let color = colors.at(calc.rem(i, colors.len()))
      (
        stack(
          dir: ltr,
          spacing: sp-02,
          box(width: 12pt, height: 12pt, fill: color, radius: 2pt),
          text(size: 10pt, fill: theme-text-primary)[#item]
        ),
      )
    }
  )
}

// ============================================
// STACKED BAR CHART
// ============================================

#let stacked-bar-chart(
  data,  // Array of arrays: ((val1, val2, val3), (val1, val2, val3), ...)
  labels: (),
  series-names: (),
  colors: dataviz-categorical,
  height: 24pt,
  show-legend: true
) = {
  // Calculate totals for each row
  let totals = data.map(row => row.sum())
  let max-total = calc.max(..totals)
  
  v(sp-05)
  block(
    width: 100%,
    fill: white,
    stroke: 1pt + theme-border-subtle,
    radius: 4pt,
    inset: sp-05
  )[
    // Legend
    #if show-legend and series-names.len() > 0 {
      chart-legend(series-names, colors: colors, columns: series-names.len())
      v(sp-05)
    }
    
    // Bars
    #for (i, row) in data.enumerate() {
      let label = if labels.len() > i { labels.at(i) } else { "Row " + str(i + 1) }
      let total = totals.at(i)
      
      v(if i > 0 { sp-03 } else { 0pt })
      
      grid(
        columns: (15%, 1fr, auto),
        column-gutter: sp-03,
        align(right + horizon)[
          #text(size: 10pt, fill: theme-text-secondary)[#label]
        ],
        stack(
          dir: ltr,
          ..for (j, value) in row.enumerate() {
            let color = colors.at(calc.rem(j, colors.len()))
            let segment-width = (value / max-total) * 100%
            block(
              width: segment-width,
              height: height,
              fill: color
            )
          }
        ),
        align(horizon)[
          #text(size: 10pt, weight: 600, fill: theme-text-primary)[#total]
        ]
      )
    }
  ]
  v(sp-05)
}

// ============================================
// BULLET CHART (KPI vs Target)
// ============================================

#let bullet-chart(
  value,
  target,
  max-value: auto,
  ranges: (60, 80, 100),  // Poor, Satisfactory, Good thresholds
  label: none,
  color: blue-60
) = {
  let computed-max = if max-value == auto { 
    calc.max(value, target, ..ranges) * 1.1 
  } else { 
    max-value 
  }
  
  let value-width = (value / computed-max) * 100%
  let target-pos = (target / computed-max) * 100%
  
  v(sp-03)
  if label != none {
    text(size: 11pt, weight: 600, fill: theme-text-primary)[#label]
    v(sp-02)
  }
  
  block(
    width: 100%,
    height: 24pt
  )[
    // Background ranges
    #place[
      #grid(
        columns: (
          (ranges.at(0) / computed-max) * 100%,
          ((ranges.at(1) - ranges.at(0)) / computed-max) * 100%,
          ((ranges.at(2) - ranges.at(1)) / computed-max) * 100%
        ),
        block(width: 100%, height: 24pt, fill: gray-30),
        block(width: 100%, height: 24pt, fill: gray-20),
        block(width: 100%, height: 24pt, fill: gray-10)
      )
    ]
    
    // Value bar
    #place[
      #block(
        width: value-width,
        height: 12pt,
        fill: color
      )
    ]
    
    // Target marker
    #place(dx: target-pos, dy: 0pt)[
      #block(width: 3pt, height: 24pt, fill: gray-100)
    ]
  ]
  
  v(sp-02)
  grid(
    columns: (1fr, 1fr),
    text(size: 10pt, fill: theme-text-secondary)[Actual: *#value*],
    align(right)[#text(size: 10pt, fill: theme-text-secondary)[Target: *#target*]]
  )
  v(sp-03)
}

// ============================================
// HEAT MAP CELL
// ============================================

#let heatmap-cell(
  value,
  min-val: 0,
  max-val: 100,
  color-scale: dataviz-seq-blue,
  size: 40pt
) = {
  let normalized = (value - min-val) / (max-val - min-val)
  let color-index = calc.min(calc.floor(normalized * (color-scale.len() - 1)), color-scale.len() - 1)
  let bg-color = color-scale.at(calc.max(0, color-index))
  let text-color = if normalized > 0.5 { white } else { gray-100 }
  
  box(
    width: size,
    height: size,
    fill: bg-color
  )[
    #align(center + horizon)[
      #text(size: 10pt, weight: 600, fill: text-color)[#value]
    ]
  ]
}

// ============================================
// DONUT CHART SEGMENT (Simple representation)
// ============================================

#let donut-stat(
  value,
  max-value: 100,
  label: none,
  color: blue-60,
  size: 80pt
) = {
  let percentage = calc.round((value / max-value) * 100)
  
  align(center)[
    #block(
      width: size,
      height: size
    )[
      // Outer ring (background)
      #place(center)[
        #circle(radius: size / 2, fill: gray-20)
      ]
      // Inner circle (creates donut effect)
      #place(center)[
        #circle(radius: size / 3, fill: white)
      ]
      // Center text
      #place(center + horizon)[
        #stack(
          dir: ttb,
          spacing: 2pt,
          text(size: size / 4, weight: 300, fill: color)[#percentage%],
          if label != none {
            text(size: 8pt, fill: theme-text-secondary)[#label]
          }
        )
      ]
    ]
  ]
}

// ============================================
// COMPARISON BARS
// ============================================

#let comparison-bars(
  items,  // Array of (label, value1, value2)
  labels: ("Series A", "Series B"),
  colors: (blue-60, purple-60),
  max-value: auto
) = {
  let all-values = items.map(item => (item.at(1), item.at(2))).flatten()
  let computed-max = if max-value == auto { calc.max(..all-values) } else { max-value }
  
  v(sp-05)
  // Legend
  grid(
    columns: 2,
    column-gutter: sp-05,
    ..for (i, label) in labels.enumerate() {
      (
        stack(
          dir: ltr,
          spacing: sp-02,
          box(width: 12pt, height: 12pt, fill: colors.at(i), radius: 2pt),
          text(size: 10pt, fill: theme-text-primary)[#label]
        ),
      )
    }
  )
  v(sp-04)
  
  // Bars
  for (label, val1, val2) in items {
    text(size: 11pt, weight: 600, fill: theme-text-primary)[#label]
    v(sp-02)
    
    // First bar
    block(
      width: (val1 / computed-max) * 100%,
      height: 12pt,
      fill: colors.at(0),
      radius: (right: 2pt)
    )
    v(sp-02)
    
    // Second bar
    block(
      width: (val2 / computed-max) * 100%,
      height: 12pt,
      fill: colors.at(1),
      radius: (right: 2pt)
    )
    v(sp-04)
  }
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
      _Styled with IBM Carbon Data Visualization_
    ]
  ]
]

#pagebreak()

// ============================================
// CONTENT
// ============================================

{{content}}
