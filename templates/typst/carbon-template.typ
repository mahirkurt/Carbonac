// IBM Carbon Design System - Typst Template
// Professional Academic Report Template

// Page setup
#set page(
  paper: "a4",
  margin: (
    top: 2.5cm,
    bottom: 2.5cm,
    left: 2.5cm,
    right: 2.5cm,
  ),
  numbering: "1",
  number-align: center,
  header: context {
    if counter(page).get().first() > 1 [
      #set text(size: 9pt, fill: rgb("#525252"))
      #line(length: 100%, stroke: 0.5pt + rgb("#e0e0e0"))
      #v(-8pt)
      #align(right)[_{{title}}_]
      #v(-4pt)
      #line(length: 100%, stroke: 0.5pt + rgb("#e0e0e0"))
    ]
  },
  footer: context {
    set text(size: 9pt, fill: rgb("#525252"))
    line(length: 100%, stroke: 0.5pt + rgb("#e0e0e0"))
    v(-8pt)
    grid(
      columns: (1fr, 1fr, 1fr),
      align(left)[{{author}}],
      align(center)[#counter(page).display("1 of 1", both: true)],
      align(right)[{{date}}]
    )
  }
)

// IBM Plex Font Configuration
#set text(
  font: "IBM Plex Sans",
  size: 11pt,
  fill: rgb("#161616"),
  lang: "en"
)

// Headings with Carbon Design System styling
#show heading.where(level: 1): it => {
  set text(
    size: 32pt,
    weight: 300,
    fill: rgb("#161616"),
    font: "IBM Plex Sans"
  )
  v(24pt)
  it
  v(16pt)
  line(length: 100%, stroke: 2pt + rgb("#0f62fe"))
  v(24pt)
}

#show heading.where(level: 2): it => {
  set text(
    size: 24pt,
    weight: 300,
    fill: rgb("#161616"),
    font: "IBM Plex Sans"
  )
  v(20pt)
  it
  v(12pt)
  line(length: 30%, stroke: 1.5pt + rgb("#0f62fe"))
  v(16pt)
}

#show heading.where(level: 3): it => {
  set text(
    size: 18pt,
    weight: 400,
    fill: rgb("#161616"),
    font: "IBM Plex Sans"
  )
  v(16pt)
  it
  v(12pt)
}

#show heading.where(level: 4): it => {
  set text(
    size: 16pt,
    weight: 400,
    fill: rgb("#393939"),
    font: "IBM Plex Sans"
  )
  v(12pt)
  it
  v(8pt)
}

// Paragraph styling
#set par(
  justify: true,
  leading: 0.65em,
  first-line-indent: 0em
)

// Code blocks with Carbon styling
#show raw.where(block: true): it => {
  set text(
    font: "IBM Plex Mono",
    size: 9.5pt,
    fill: rgb("#161616")
  )
  block(
    fill: rgb("#f4f4f4"),
    stroke: 1pt + rgb("#e0e0e0"),
    radius: 4pt,
    inset: 12pt,
    width: 100%,
  )[
    #it
  ]
}

// Inline code
#show raw.where(block: false): it => {
  set text(
    font: "IBM Plex Mono",
    size: 10pt,
    fill: rgb("#0f62fe")
  )
  box(
    fill: rgb("#f4f4f4"),
    outset: (x: 3pt, y: 2pt),
    radius: 2pt,
    it
  )
}

// Links
#show link: it => {
  set text(fill: rgb("#0f62fe"))
  underline(it)
}

// Lists
#set list(
  indent: 1em,
  marker: [#text(fill: rgb("#0f62fe"))[•]]
)

#set enum(
  indent: 1em,
  numbering: n => text(fill: rgb("#0f62fe"))[#n.]
)

// Blockquotes
#show quote: it => {
  set text(
    size: 10pt,
    fill: rgb("#525252"),
    style: "italic"
  )
  block(
    fill: rgb("#f4f4f4"),
    stroke: (left: 4pt + rgb("#0f62fe")),
    inset: (left: 16pt, right: 16pt, top: 12pt, bottom: 12pt),
    width: 100%,
  )[
    #it
  ]
}

// Tables
#show table: it => {
  set text(size: 10pt)
  block(
    stroke: none,
    inset: 0pt,
    width: 100%,
  )[
    #it
  ]
}

#set table(
  stroke: (x, y) => if y == 0 {
    (bottom: 2pt + rgb("#0f62fe"))
  } else {
    (bottom: 0.5pt + rgb("#e0e0e0"))
  },
  fill: (x, y) => if calc.odd(y) {
    rgb("#f4f4f4")
  } else {
    white
  },
  inset: 8pt,
)

// Images
#show figure: it => {
  v(12pt)
  align(center)[
    #block(
      stroke: 0.5pt + rgb("#e0e0e0"),
      radius: 4pt,
      clip: true,
    )[
      #it.body
    ]
    #v(8pt)
    #text(
      size: 9pt,
      fill: rgb("#525252"),
      style: "italic"
    )[
      #it.caption
    ]
  ]
  v(12pt)
}

// Title Page
#align(center)[
  #v(2fr)

  // IBM Carbon Blue Bar
  #block(
    width: 100%,
    height: 4pt,
    fill: rgb("#0f62fe")
  )

  #v(24pt)

  #text(
    size: 42pt,
    weight: 300,
    fill: rgb("#161616"),
    font: "IBM Plex Sans"
  )[
    {{title}}
  ]

  #v(16pt)

  #text(
    size: 18pt,
    weight: 400,
    fill: rgb("#525252"),
    font: "IBM Plex Sans"
  )[
    {{subtitle}}
  ]

  #v(32pt)

  #text(
    size: 14pt,
    fill: rgb("#393939"),
    font: "IBM Plex Sans"
  )[
    *{{author}}*
  ]

  #v(8pt)

  #text(
    size: 12pt,
    fill: rgb("#525252"),
    font: "IBM Plex Sans"
  )[
    {{date}}
  ]

  #v(2fr)

  // Carbon Design System Badge
  #block(
    fill: rgb("#f4f4f4"),
    stroke: 0.5pt + rgb("#e0e0e0"),
    radius: 4pt,
    inset: 12pt,
  )[
    #text(
      size: 9pt,
      fill: rgb("#525252"),
      font: "IBM Plex Sans"
    )[
      _Styled with IBM Carbon Design System_
    ]
  ]
]

#pagebreak()

// Content starts here
{{content}}
