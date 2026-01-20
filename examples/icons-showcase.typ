// ============================================
// Carbon Icons Showcase
// ============================================

#import "../templates/typst/carbon-icons.typ": *

#set page(
  paper: "a4",
  margin: 48pt
)

#set text(
  font: "IBM Plex Sans",
  size: 11pt,
  fill: gray-100
)

#align(center)[
  #text(size: 32pt, weight: 300, fill: blue-60)[Carbon Icon Library]
  #v(8pt)
  #text(size: 14pt, fill: gray-70)[Geometric path-based icons for professional documents]
  #v(24pt)
  #line(length: 100%, stroke: 2pt + blue-60)
]

#v(32pt)

= Status Icons

Icons for indicating status, success, errors, and warnings.

#v(16pt)

#grid(
  columns: 6,
  column-gutter: 24pt,
  row-gutter: 24pt,

  // Success
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("success", size: 32pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[success]]
  ),

  // Checkmark
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("checkmark", size: 32pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[checkmark]]
  ),

  // Error
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("error", size: 32pt, color: red-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[error]]
  ),

  // Close
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("close", size: 32pt, color: gray-100)],
    align(center)[#text(size: 9pt, fill: gray-70)[close]]
  ),

  // Warning
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("warning", size: 32pt, color: yellow-30)],
    align(center)[#text(size: 9pt, fill: gray-70)[warning]]
  ),

  // Info
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("info", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[info]]
  ),
)

#v(32pt)

= Navigation Icons

Arrows and chevrons for indicating direction and navigation.

#v(16pt)

#grid(
  columns: 8,
  column-gutter: 16pt,
  row-gutter: 24pt,

  // Arrows
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("arrow-up", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[arrow-up]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("arrow-down", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[arrow-down]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("arrow-left", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[arrow-left]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("arrow-right", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[arrow-right]]
  ),

  // Chevrons
  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("chevron-up", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[chevron-up]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("chevron-down", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[chevron-down]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("chevron-right", size: 28pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[chevron-right]]
  ),
)

#v(32pt)

= Action Icons

Icons for common user actions.

#v(16pt)

#grid(
  columns: 6,
  column-gutter: 24pt,
  row-gutter: 24pt,

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("add", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[add]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("subtract", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[subtract]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("menu", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[menu]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("settings", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[settings]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("search", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[search]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("view", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[view]]
  ),
)

#v(32pt)

= File & Document Icons

Icons for files, folders, and document operations.

#v(16pt)

#grid(
  columns: 6,
  column-gutter: 24pt,
  row-gutter: 24pt,

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("document", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[document]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("folder", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[folder]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("download", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[download]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("upload", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[upload]]
  ),
)

#v(32pt)

= User & Communication Icons

Icons for users, links, and communication.

#v(16pt)

#grid(
  columns: 6,
  column-gutter: 24pt,
  row-gutter: 24pt,

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("user", size: 32pt)],
    align(center)[#text(size: 9pt, fill: gray-70)[user]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("link", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[link]]
  ),
)

#v(32pt)

= Data Visualization Icons

Icons for charts and data.

#v(16pt)

#grid(
  columns: 6,
  column-gutter: 24pt,
  row-gutter: 24pt,

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("chart-bar", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[chart-bar]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("chart-line", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[chart-line]]
  ),
)

#pagebreak()

= Icon Sizes

Icons scale smoothly to different sizes:

#v(24pt)

#grid(
  columns: 5,
  column-gutter: 32pt,
  row-gutter: 24pt,

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("checkmark", size: 12pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[12pt]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("checkmark", size: 16pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[16pt]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("checkmark", size: 24pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[24pt]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("checkmark", size: 32pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[32pt]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("checkmark", size: 48pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[48pt]]
  ),
)

#v(32pt)

= Icon Colors

Icons adapt to different colors:

#v(24pt)

#grid(
  columns: 6,
  column-gutter: 24pt,
  row-gutter: 24pt,

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("info", size: 32pt, color: blue-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[blue-60]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("success", size: 32pt, color: green-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[green-60]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("error", size: 32pt, color: red-60)],
    align(center)[#text(size: 9pt, fill: gray-70)[red-60]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("warning", size: 32pt, color: yellow-30)],
    align(center)[#text(size: 9pt, fill: gray-70)[yellow-30]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("settings", size: 32pt, color: gray-100)],
    align(center)[#text(size: 9pt, fill: gray-70)[gray-100]]
  ),

  stack(
    dir: ttb,
    spacing: 8pt,
    align(center)[#icon("user", size: 32pt, color: gray-70)],
    align(center)[#text(size: 9pt, fill: gray-70)[gray-70]]
  ),
)

#v(32pt)

= Usage Examples

== In Text

Icons can be used inline: #icon("checkmark", size: 12pt, color: green-60) Success or #icon("error", size: 12pt, color: red-60) Error

== With Labels

#grid(
  columns: 3,
  column-gutter: 16pt,

  stack(
    dir: ltr,
    spacing: 8pt,
    icon("download", size: 16pt, color: blue-60),
    text(size: 12pt)[Download Report]
  ),

  stack(
    dir: ltr,
    spacing: 8pt,
    icon("folder", size: 16pt),
    text(size: 12pt)[Open Folder]
  ),

  stack(
    dir: ltr,
    spacing: 8pt,
    icon("settings", size: 16pt),
    text(size: 12pt)[Settings]
  ),
)

#v(16pt)

== In Buttons (Visual)

#box(
  fill: blue-60,
  outset: (x: 12pt, y: 8pt),
  radius: 4pt
)[
  #stack(
    dir: ltr,
    spacing: 8pt,
    icon("add", size: 14pt, color: white),
    text(size: 12pt, fill: white, weight: 600)[Create New]
  )
]
#h(8pt)
#box(
  fill: white,
  stroke: 1.5pt + blue-60,
  outset: (x: 12pt, y: 8pt),
  radius: 4pt
)[
  #stack(
    dir: ltr,
    spacing: 8pt,
    icon("download", size: 14pt, color: blue-60),
    text(size: 12pt, fill: blue-60, weight: 600)[Download]
  )
]

#v(32pt)

= API Reference

```typst
// Using the icon() function
#icon("checkmark", size: 16pt, color: green-60)

// Direct icon functions
#icon-success(size: 24pt, color: green-60)
#icon-error(size: 24pt, color: red-60)
#icon-warning(size: 24pt, color: yellow-30)
#icon-info(size: 24pt, color: blue-60)

// Available icons (28 total):
// Status: success, checkmark, error, close, warning, info
// Arrows: arrow-up, arrow-down, arrow-left, arrow-right
// Chevrons: chevron-up, chevron-down, chevron-right
// Actions: add, subtract, menu, settings, search, view
// Documents: document, folder, download, upload
// User: user, link
// Charts: chart-bar, chart-line
```

#v(16pt)

#align(center)[
  #text(size: 10pt, fill: gray-70)[
    _28 geometric icons · Path-based rendering · Scalable · Color-customizable_
  ]
]
