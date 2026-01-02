// ============================================
// IBM Carbon Design System - Icon Library
// Geometric path-based icons (no emoji)
// ============================================

// ============================================
// CARBON COLORS (for icons)
// ============================================

#let blue-60 = rgb("#0f62fe")
#let purple-60 = rgb("#8a3ffc")
#let teal-60 = rgb("#009d9a")
#let magenta-60 = rgb("#ee5396")
#let cyan-50 = rgb("#1192e8")
#let gray-100 = rgb("#161616")
#let gray-70 = rgb("#525252")
#let gray-50 = rgb("#8d8d8d")
#let green-60 = rgb("#198038")
#let red-60 = rgb("#da1e28")
#let yellow-30 = rgb("#f1c21b")
#let orange-60 = rgb("#ff832b")
#let white = rgb("#ffffff")

// ============================================
// ICON BASE FUNCTION
// ============================================

#let icon-base(size: 16pt, color: gray-100, body) = {
  box(
    width: size,
    height: size,
    clip: false
  )[
    #set line(stroke: 1.5pt + color)
    #set path(stroke: 1.5pt + color, fill: none)
    #set circle(stroke: 1.5pt + color, fill: none)
    #set polygon(stroke: 1.5pt + color, fill: none)
    #body
  ]
}

// ============================================
// STATUS ICONS
// ============================================

// Checkmark
#let icon-checkmark(size: 16pt, color: green-60) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(
        start: (0pt, 0pt),
        end: (size * 0.25, size * 0.3),
        stroke: 2pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.75)[
      #line(
        start: (0pt, 0pt),
        end: (size * 0.4, -size * 0.6),
        stroke: 2pt + color
      )
    ]
  ]
}

// Close (X)
#let icon-close(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.2)[
      #line(
        start: (0pt, 0pt),
        end: (size * 0.6, size * 0.6),
        stroke: 2pt + color
      )
    ]
    #place(dx: size * 0.2, dy: size * 0.8)[
      #line(
        start: (0pt, 0pt),
        end: (size * 0.6, -size * 0.6),
        stroke: 2pt + color
      )
    ]
  ]
}

// Success (circle with checkmark)
#let icon-success(size: 16pt, color: green-60) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.4, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.15, size * 0.15), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.42, dy: size * 0.62)[
      #line(start: (0pt, 0pt), end: (size * 0.25, -size * 0.35), stroke: 1.5pt + color)
    ]
  ]
}

// Error (circle with X)
#let icon-error(size: 16pt, color: red-60) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.4, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.3, size * 0.3), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.3, -size * 0.3), stroke: 1.5pt + color)
    ]
  ]
}

// Warning (triangle with !)
#let icon-warning(size: 16pt, color: yellow-30) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.15)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, size * 0.7),
        (-size * 0.35, size * 0.7),
        stroke: 1.5pt + color,
        fill: none
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.2), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.72)[
      #circle(radius: 1.5pt, fill: color)
    ]
  ]
}

// Info (circle with i)
#let icon-info(size: 16pt, color: blue-60) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.4, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.3)[
      #circle(radius: 1.5pt, fill: color)
    ]
    #place(dx: size * 0.5, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 2pt + color)
    ]
  ]
}

// ============================================
// ARROW ICONS
// ============================================

// Arrow Up
#let icon-arrow-up(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.6), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (size * 0.15, size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Down
#let icon-arrow-down(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.6), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.8)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, -size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.8)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Right
#let icon-arrow-right(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, -size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Left
#let icon-arrow-left(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.15, size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Up-Right (diagonal)
#let icon-arrow-up-right(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.4, -size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, size * 0.05), stroke: 2pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (-size * 0.05, size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Down-Right (diagonal)
#let icon-arrow-down-right(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.4, size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, -size * 0.05), stroke: 2pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (-size * 0.05, -size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Down-Left (diagonal)
#let icon-arrow-down-left(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.7, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (-size * 0.4, size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.05), stroke: 2pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.05, -size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrow Up-Left (diagonal)
#let icon-arrow-up-left(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (-size * 0.4, -size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.15, size * 0.05), stroke: 2pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.05, size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Arrows Horizontal (bidirectional)
#let icon-arrows-horizontal(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.1, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.1, size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, size * 0.08), stroke: 1.5pt + color)
    ]
  ]
}

// Arrows Vertical (bidirectional)
#let icon-arrows-vertical(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.6), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (-size * 0.08, size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (size * 0.08, size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.8)[
      #line(start: (0pt, 0pt), end: (-size * 0.08, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.8)[
      #line(start: (0pt, 0pt), end: (size * 0.08, -size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Rotate Clockwise
#let icon-rotate-clockwise(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// Rotate Counterclockwise
#let icon-rotate-counterclockwise(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// Refresh
#let icon-refresh(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (size * 0.12, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Undo
#let icon-undo(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Redo
#let icon-redo(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// ============================================
// CHEVRON ICONS (lighter arrows)
// ============================================

// Chevron Right
#let icon-chevron-right(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.25, size * 0.2), stroke: 1.5pt + color)
    ]
  ]
}

// Chevron Down
#let icon-chevron-down(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.25), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.2, -size * 0.25), stroke: 1.5pt + color)
    ]
  ]
}

// Chevron Up
#let icon-chevron-up(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.2, -size * 0.25), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.25), stroke: 1.5pt + color)
    ]
  ]
}

// Chevron Left
#let icon-chevron-left(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.6, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (-size * 0.25, size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.2), stroke: 1.5pt + color)
    ]
  ]
}

// ============================================
// ACTION ICONS
// ============================================

// Add (plus)
#let icon-add(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.5), stroke: 2pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Subtract (minus)
#let icon-subtract(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Menu (hamburger)
#let icon-menu(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Settings (gear)
#let icon-settings(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.35, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    // Gear teeth (simplified)
    #for angle in (0, 90, 180, 270) {
      place(dx: size * 0.5, dy: size * 0.5)[
        #rotate(angle * 1deg)[
          #line(start: (0pt, -size * 0.25), end: (0pt, -size * 0.4), stroke: 1.5pt + color)
        ]
      ]
    }
  ]
}

// Search
#let icon-search(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.4)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.57, dy: size * 0.57)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.25), stroke: 2pt + color)
    ]
  ]
}

// Edit (pencil)
#let icon-edit(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.6, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.12, -size * 0.05),
        (-size * 0.25, size * 0.42),
        (-size * 0.37, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.2, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Delete (trash)
#let icon-delete(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.45), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.45), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.45), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.45, size * 0.55),
        (size * 0.05, size * 0.55),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Copy
#let icon-copy(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.35, size * 0.45),
        (0pt, size * 0.45),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.35, size * 0.45),
        (0pt, size * 0.45),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Paste
#let icon-paste(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Cut (scissors)
#let icon-cut(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.65)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, -size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, size * 0.2), stroke: 1.5pt + color)
    ]
  ]
}

// Save
#let icon-save(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.15),
        (0pt, size * 0.15),
        fill: color
      )
    ]
  ]
}

// Export
#let icon-export(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, size * 0.12), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (size * 0.12, size * 0.12), stroke: 2pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.7)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.1),
        (0pt, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Import
#let icon-import(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, -size * 0.12), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.12, -size * 0.12), stroke: 2pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.7)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.1),
        (0pt, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Print
#let icon-print(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.45),
        (0pt, size * 0.45),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.15),
        (0pt, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 1pt + color)
    ]
  ]
}

// Share
#let icon-share(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.6)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.6)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.38, dy: size * 0.32)[
      #line(start: (0pt, 0pt), end: (-size * 0.08, size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.62, dy: size * 0.32)[
      #line(start: (0pt, 0pt), end: (size * 0.08, size * 0.2), stroke: 1.5pt + color)
    ]
  ]
}

// Lock
#let icon-lock(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.25),
        (0pt, size * 0.25),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Unlock
#let icon-unlock(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.25),
        (0pt, size * 0.25),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.6, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// View/Hide Toggle
#let icon-view-off(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (size * 0.6, size * 0.6), stroke: 2pt + color)
    ]
  ]
}

// Zoom In
#let icon-zoom-in(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.4)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.57, dy: size * 0.57)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.2), stroke: 2pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Zoom Out
#let icon-zoom-out(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.4)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.57, dy: size * 0.57)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.2), stroke: 2pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Filter
#let icon-filter(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #polygon(
        (-size * 0.25, 0pt),
        (size * 0.25, 0pt),
        (size * 0.1, size * 0.2),
        (size * 0.1, size * 0.45),
        (-size * 0.1, size * 0.45),
        (-size * 0.1, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Sort
#let icon-sort(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.08, size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.4), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (-size * 0.08, -size * 0.08), stroke: 1.5pt + color)
    ]
  ]
}

// Play
#let icon-play(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.25),
        (size * 0.35, 0pt),
        (0pt, size * 0.25),
        fill: color
      )
    ]
  ]
}

// Pause
#let icon-pause(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.1, 0pt),
        (size * 0.1, size * 0.4),
        (0pt, size * 0.4),
        fill: color
      )
    ]
    #place(dx: size * 0.55, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.1, 0pt),
        (size * 0.1, size * 0.4),
        (0pt, size * 0.4),
        fill: color
      )
    ]
  ]
}

// Stop
#let icon-stop(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.4),
        (0pt, size * 0.4),
        fill: color
      )
    ]
  ]
}

// Star
#let icon-star(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.35),
        (size * 0.1, -size * 0.1),
        (size * 0.35, -size * 0.08),
        (size * 0.15, size * 0.12),
        (size * 0.22, size * 0.35),
        (0pt, size * 0.18),
        (-size * 0.22, size * 0.35),
        (-size * 0.15, size * 0.12),
        (-size * 0.35, -size * 0.08),
        (-size * 0.1, -size * 0.1),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Heart
#let icon-heart(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.75)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.25, -size * 0.35),
        (size * 0.25, -size * 0.35),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Flag
#let icon-flag(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.55), stroke: 2pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, size * 0.08),
        (size * 0.35, size * 0.28),
        (0pt, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Tag
#let icon-tag(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.55, size * 0.25),
        (size * 0.3, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.4)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Calendar
#let icon-calendar(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.25, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 2pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Clock
#let icon-clock(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.35, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Bell (notification)
#let icon-bell(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.45)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.05), stroke: 1.5pt + color)
    ]
  ]
}

// ============================================
// DOCUMENT ICONS
// ============================================

// Document
#let icon-document(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.5, size * 0.15),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color,
        fill: none
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1pt + color)
    ]
  ]
}

// Folder
#let icon-folder(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, -size * 0.1),
        (size * 0.6, -size * 0.1),
        (size * 0.6, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color,
        fill: none
      )
    ]
  ]
}

// Download
#let icon-download(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.45), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, -size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Upload
#let icon-upload(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.45), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.15, size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 2pt + color)
    ]
  ]
}

// File
#let icon-file(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Folder Open
#let icon-folder-open(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, -size * 0.1),
        (size * 0.65, -size * 0.1),
        (size * 0.6, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// PDF
#let icon-pdf(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.38, dy: size * 0.45)[
      #text(size: size * 0.25, fill: color)[P]
    ]
  ]
}

// Image
#let icon-image(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.35)[
      #circle(radius: size * 0.08, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.15), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.2), stroke: 1.5pt + color)
    ]
  ]
}

// Video
#let icon-video(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.35, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.47, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.12),
        (size * 0.18, 0pt),
        (0pt, size * 0.12),
        fill: color
      )
    ]
  ]
}

// Audio
#let icon-audio(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.12),
        (size * 0.12, -size * 0.12),
        (size * 0.22, -size * 0.22),
        (size * 0.22, size * 0.22),
        (size * 0.12, size * 0.12),
        (0pt, size * 0.12),
        fill: color
      )
    ]
    #place(dx: size * 0.58, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
  ]
}

// Archive/Zip
#let icon-archive(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #for i in range(5) {
      place(dx: size * 0.48, dy: size * (0.3 + i * 0.08))[
        #line(start: (0pt, 0pt), end: (size * 0.04, 0pt), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Code
#let icon-code(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, -size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, -size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// Database
#let icon-database(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.35), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.35), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
  ]
}

// Cloud
#let icon-cloud(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.4)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.4)[
      #circle(radius: size * 0.18, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
  ]
}

// Cloud Upload
#let icon-cloud-upload(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.35)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, size * 0.1), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.1, size * 0.1), stroke: 2pt + color)
    ]
  ]
}

// Cloud Download
#let icon-cloud-download(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.35)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, -size * 0.1), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (size * 0.1, -size * 0.1), stroke: 2pt + color)
    ]
  ]
}

// Bookmark
#let icon-bookmark(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.5),
        (size * 0.15, size * 0.4),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Attachment
#let icon-attachment(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.25), stroke: 2pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.35)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.65)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
  ]
}

// Email/Mail
#let icon-email(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.25, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (-size * 0.25, size * 0.2), stroke: 1.5pt + color)
    ]
  ]
}

// Send
#let icon-send(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, size * 0.25),
        (0pt, size * 0.5),
        (size * 0.15, size * 0.25),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Reply
#let icon-reply(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, -size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.12, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// Forward
#let icon-forward(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, -size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// ============================================
// USER & COMMUNICATION ICONS
// ============================================

// User
#let icon-user(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.7)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
  ]
}

// Link
#let icon-link(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.4)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.4)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 2pt + color)
    ]
  ]
}

// View (eye)
#let icon-view(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #path(
        ((0pt, 0pt),),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// User Group
#let icon-user-group(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.32)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.32)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.65)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.65)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
  ]
}

// Chat
#let icon-chat(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.35),
        (size * 0.1, size * 0.35),
        (size * 0.05, size * 0.45),
        (0pt, size * 0.3),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Comment
#let icon-comment(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.35),
        (size * 0.1, size * 0.35),
        (size * 0.05, size * 0.45),
        (0pt, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1pt + color)
    ]
  ]
}

// Phone
#let icon-phone(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.43, dy: size * 0.68)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Location (pin)
#let icon-location(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.4)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.75)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.1, -size * 0.2),
        (size * 0.1, -size * 0.2),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.4)[
      #circle(radius: size * 0.08, fill: color)
    ]
  ]
}

// Globe/World
#let icon-globe(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.35, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.15)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.7), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.15, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.7, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Home
#let icon-home(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.25, size * 0.2),
        (size * 0.25, size * 0.5),
        (-size * 0.25, size * 0.5),
        (-size * 0.25, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// ============================================
// CHART ICONS
// ============================================

// Chart Bar
#let icon-chart-bar(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 3pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.35), stroke: 3pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 3pt + color)
    ]
  ]
}

// Chart Line
#let icon-chart-line(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.2, -size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.2, -size * 0.3), stroke: 1.5pt + color)
    ]
    #for x in (0.2, 0.4, 0.6, 0.8) {
      place(dx: size * x, dy: size * (if x == 0.2 { 0.7 } else if x == 0.4 { 0.5 } else if x == 0.6 { 0.6 } else { 0.3 }))[
        #circle(radius: 2pt, fill: color)
      ]
    }
  ]
}

// Chart Pie
#let icon-chart-pie(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.3), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.25, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Chart Area
#let icon-chart-area(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.08),
        (size * 0.35, size * 0.05),
        (size * 0.6, -size * 0.1),
        (size * 0.6, size * 0.45),
        (0pt, size * 0.45),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Chart Scatter
#let icon-chart-scatter(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: gray-100)[
    #for pos in ((0.25, 0.6), (0.4, 0.35), (0.55, 0.5), (0.7, 0.3)) {
      place(dx: size * pos.at(0), dy: size * pos.at(1))[
        #circle(radius: 2.5pt, fill: color)
      ]
    }
  ]
}

// Chart Bubble
#let icon-chart-bubble(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.6)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.4)[
      #circle(radius: size * 0.18, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #circle(radius: size * 0.08, stroke: 1.5pt + color)
    ]
  ]
}

// Chart Radar
#let icon-chart-radar(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.3),
        (size * 0.26, -size * 0.15),
        (size * 0.26, size * 0.15),
        (0pt, size * 0.3),
        (-size * 0.26, size * 0.15),
        (-size * 0.26, -size * 0.15),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Chart Treemap
#let icon-chart-treemap(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.6, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, 0pt),
        (size * 0.15, size * 0.25),
        (0pt, size * 0.25),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.6, dy: size * 0.55)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, 0pt),
        (size * 0.15, size * 0.2),
        (0pt, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Dashboard
#let icon-dashboard(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.35, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.25, -size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Trending Up
#let icon-trending-up(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.6, -size * 0.35), stroke: 2pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, size * 0.05), stroke: 2pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (-size * 0.05, size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Trending Down
#let icon-trending-down(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.6, size * 0.35), stroke: 2pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, -size * 0.05), stroke: 2pt + color)
    ]
    #place(dx: size * 0.8, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (-size * 0.05, -size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Analytics
#let icon-analytics(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.15), stroke: 2.5pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 2.5pt + color)
    ]
  ]
}

// Report
#let icon-report(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.08), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.38)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.42)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 2pt + color)
    ]
  ]
}

// Table
#let icon-table(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.25, dy: size * 0.42)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 1pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.5), stroke: 1pt + color)
    ]
  ]
}

// Grid
#let icon-grid(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for row in range(3) {
      for col in range(3) {
        place(dx: size * (0.25 + col * 0.2), dy: size * (0.25 + row * 0.2))[
          #polygon(
            (0pt, 0pt),
            (size * 0.12, 0pt),
            (size * 0.12, size * 0.12),
            (0pt, size * 0.12),
            stroke: 1pt + color
          )
        ]
      }
    }
  ]
}

// List
#let icon-list(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(4) {
      place(dx: size * 0.25, dy: size * (0.25 + i * 0.15))[
        #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Kanban
#let icon-kanban(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for col in range(3) {
      place(dx: size * (0.2 + col * 0.25), dy: size * 0.2)[
        #polygon(
          (0pt, 0pt),
          (size * 0.15, 0pt),
          (size * 0.15, size * 0.6),
          (0pt, size * 0.6),
          stroke: 1.5pt + color
        )
      ]
    }
  ]
}

// ============================================
// DEVICE & SYSTEM ICONS
// ============================================

// Laptop
#let icon-laptop(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.35),
        (0pt, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.2, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Desktop/Monitor
#let icon-desktop(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.45, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 2pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Mobile/Smartphone
#let icon-mobile(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.73)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Tablet
#let icon-tablet(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.73)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Watch
#let icon-watch(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.55, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.08), stroke: 1.5pt + color)
    ]
  ]
}

// Server
#let icon-server(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(3) {
      place(dx: size * 0.25, dy: size * (0.25 + i * 0.18))[
        #polygon(
          (0pt, 0pt),
          (size * 0.5, 0pt),
          (size * 0.5, size * 0.12),
          (0pt, size * 0.12),
          stroke: 1.5pt + color
        )
      ]
    }
  ]
}

// Network
#let icon-network(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.65)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.65)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (-size * 0.18, size * 0.22), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.18, size * 0.22), stroke: 1.5pt + color)
    ]
  ]
}

// Wifi
#let icon-wifi(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.7)[
      #circle(radius: 2.5pt, fill: color)
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
  ]
}

// Bluetooth
#let icon-bluetooth(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.3),
        (size * 0.2, -size * 0.1),
        (0pt, size * 0.1),
        (size * 0.2, size * 0.3),
        (0pt, size * 0.1),
        (0pt, -size * 0.3),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// USB
#let icon-usb(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.4), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.15, size * 0.12),
        (size * 0.15, size * 0.12),
        stroke: 2pt + color
      )
    ]
  ]
}

// Battery
#let icon-battery(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.4)[
      #polygon(
        (0pt, 0pt),
        (size * 0.45, 0pt),
        (size * 0.45, size * 0.2),
        (0pt, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.7, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Power
#let icon-power(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.45)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
  ]
}

// Microphone
#let icon-microphone(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (-size * 0.1, 0pt),
        (size * 0.1, 0pt),
        (size * 0.1, size * 0.25),
        (-size * 0.1, size * 0.25),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 2pt + color)
    ]
  ]
}

// Camera
#let icon-camera(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.35),
        (0pt, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.52)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
  ]
}

// ============================================
// BUSINESS & COMMERCE ICONS
// ============================================

// Shopping Cart
#let icon-cart(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.4, size * 0.3),
        (size * 0.05, size * 0.3),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.7)[
      #circle(radius: 2pt, fill: color)
    ]
    #place(dx: size * 0.6, dy: size * 0.7)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Credit Card
#let icon-credit-card(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.6, 0pt),
        (size * 0.6, size * 0.3),
        (0pt, size * 0.3),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.2, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Money/Dollar
#let icon-money(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 2pt + color)
    ]
  ]
}

// Wallet
#let icon-wallet(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.65, dy: size * 0.5)[
      #circle(radius: 2pt, fill: color)
    ]
  ]
}

// Receipt
#let icon-receipt(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.55),
        (size * 0.15, size * 0.48),
        (0pt, size * 0.55),
        stroke: 1.5pt + color
      )
    ]
    #for i in range(3) {
      place(dx: size * 0.42, dy: size * (0.32 + i * 0.08))[
        #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1pt + color)
      ]
    }
  ]
}

// Store
#let icon-store(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #polygon(
        (-size * 0.25, 0pt),
        (size * 0.25, 0pt),
        (size * 0.2, size * 0.15),
        (-size * 0.2, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.4)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.35),
        (0pt, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Package/Box
#let icon-package(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.1),
        (size * 0.2, size * 0.4),
        (0pt, size * 0.5),
        (-size * 0.2, size * 0.4),
        (-size * 0.2, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.5), stroke: 1.5pt + color)
    ]
  ]
}

// Delivery/Truck
#let icon-delivery(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.4)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.2),
        (0pt, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.55, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, 0pt),
        (size * 0.15, size * 0.15),
        (0pt, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.68)[
      #circle(radius: 2.5pt, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.68)[
      #circle(radius: 2.5pt, stroke: 1.5pt + color)
    ]
  ]
}

// Barcode
#let icon-barcode(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(8) {
      place(dx: size * (0.22 + i * 0.07), dy: size * 0.3)[
        #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: (if calc.rem(i, 2) == 0 { 2pt } else { 1pt }) + color)
      ]
    }
  ]
}

// ============================================
// MISCELLANEOUS ICONS
// ============================================

// Lightning/Bolt
#let icon-lightning(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (size * 0.1, -size * 0.35),
        (-size * 0.05, size * 0.05),
        (size * 0.15, size * 0.05),
        (-size * 0.1, size * 0.35),
        (size * 0.05, -size * 0.05),
        (-size * 0.15, -size * 0.05),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Sun (light mode)
#let icon-sun(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #for angle in range(0, 360, 45) {
      place(dx: size * 0.5, dy: size * 0.5)[
        #rotate(angle * 1deg)[
          #line(start: (0pt, -size * 0.22), end: (0pt, -size * 0.32), stroke: 1.5pt + color)
        ]
      ]
    }
  ]
}

// Moon (dark mode)
#let icon-moon(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.45, dy: size * 0.5)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.55, dy: size * 0.45)[
      #circle(radius: size * 0.28, fill: white, stroke: none)
    ]
  ]
}

// Fire
#let icon-fire(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.6)[
      #polygon(
        (0pt, -size * 0.35),
        (size * 0.12, -size * 0.15),
        (size * 0.08, size * 0.05),
        (size * 0.15, size * 0.15),
        (0pt, size * 0.2),
        (-size * 0.15, size * 0.15),
        (-size * 0.08, size * 0.05),
        (-size * 0.12, -size * 0.15),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Thermometer
#let icon-thermometer(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
  ]
}

// Drop/Water
#let icon-drop(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.6)[
      #polygon(
        (0pt, -size * 0.35),
        (size * 0.15, size * 0.05),
        (0pt, size * 0.15),
        (-size * 0.15, size * 0.05),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Plant/Leaf
#let icon-plant(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.45), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.4)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, -size * 0.15),
        (size * 0.1, -size * 0.3),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Sparkle
#let icon-sparkle(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.3),
        (size * 0.08, -size * 0.08),
        (size * 0.3, 0pt),
        (size * 0.08, size * 0.08),
        (0pt, size * 0.3),
        (-size * 0.08, size * 0.08),
        (-size * 0.3, 0pt),
        (-size * 0.08, -size * 0.08),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Shield (security)
#let icon-shield(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, 0pt),
        (size * 0.2, size * 0.35),
        (0pt, size * 0.5),
        (-size * 0.2, size * 0.35),
        (-size * 0.2, 0pt),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Key
#let icon-key(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.4)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.48, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.08, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Checkbox (empty)
#let icon-checkbox(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #polygon((0pt, 0pt), (size * 0.4, 0pt), (size * 0.4, size * 0.4), (0pt, size * 0.4), stroke: 1.5pt + color)
    ]
  ]
}

// Checkbox Checked
#let icon-checkbox-checked(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #polygon((0pt, 0pt), (size * 0.4, 0pt), (size * 0.4, size * 0.4), (0pt, size * 0.4), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.08, size * 0.08), stroke: 2pt + color)
    ]
    #place(dx: size * 0.48, dy: size * 0.58)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.2), stroke: 2pt + color)
    ]
  ]
}

// Radio Button (empty)
#let icon-radio(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
  ]
}

// Radio Button Selected
#let icon-radio-selected(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.1, fill: color)
    ]
  ]
}

// Toggle Off
#let icon-toggle-off(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (-size * 0.25, -size * 0.12),
        (size * 0.25, -size * 0.12),
        (size * 0.25, size * 0.12),
        (-size * 0.25, size * 0.12),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.5)[
      #circle(radius: size * 0.1, fill: color)
    ]
  ]
}

// Toggle On
#let icon-toggle-on(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (-size * 0.25, -size * 0.12),
        (size * 0.25, -size * 0.12),
        (size * 0.25, size * 0.12),
        (-size * 0.25, size * 0.12),
        fill: color
      )
    ]
    #place(dx: size * 0.7, dy: size * 0.5)[
      #circle(radius: size * 0.1, fill: white)
    ]
  ]
}

// Minimize
#let icon-minimize(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Maximize
#let icon-maximize(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #polygon((0pt, 0pt), (size * 0.4, 0pt), (size * 0.4, size * 0.4), (0pt, size * 0.4), stroke: 1.5pt + color)
    ]
  ]
}

// Fullscreen
#let icon-fullscreen(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.15), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.15), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.15), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (-size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.75)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.15), stroke: 1.5pt + color)
    ]
  ]
}

// Exit Fullscreen
#let icon-exit-fullscreen(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.1, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Drag
#let icon-drag(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for row in range(3) {
      for col in range(2) {
        place(dx: size * (0.38 + col * 0.12), dy: size * (0.3 + row * 0.12))[
          #circle(radius: 1.5pt, fill: color)
        ]
      }
    }
  ]
}

// Move
#let icon-move(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.2)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.6), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.2, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.6, 0pt), stroke: 1.5pt + color)
    ]
    #for (dx, dy, rot) in ((0.5, 0.2, 0deg), (0.5, 0.8, 180deg), (0.2, 0.5, 270deg), (0.8, 0.5, 90deg)) {
      place(dx: size * dx, dy: size * dy)[
        #rotate(rot)[
          #polygon((0pt, 0pt), (-size * 0.05, size * 0.08), (size * 0.05, size * 0.08), stroke: 1.5pt + color)
        ]
      ]
    }
  ]
}

// Resize
#let icon-resize(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(3) {
      place(dx: size * (0.75 - i * 0.12), dy: size * (0.25 + i * 0.12))[
        #line(start: (0pt, 0pt), end: (0pt, size * (0.5 + i * 0.12)), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Layout
#let icon-layout(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon((0pt, 0pt), (size * 0.5, 0pt), (size * 0.5, size * 0.5), (0pt, size * 0.5), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.42)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.42, dy: size * 0.42)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.33), stroke: 1.5pt + color)
    ]
  ]
}

// Layers
#let icon-layers(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.1),
        (0pt, size * 0.2),
        (-size * 0.2, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.1),
        (0pt, size * 0.2),
        (-size * 0.2, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Columns
#let icon-columns(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon((0pt, 0pt), (size * 0.2, 0pt), (size * 0.2, size * 0.5), (0pt, size * 0.5), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.55, dy: size * 0.25)[
      #polygon((0pt, 0pt), (size * 0.2, 0pt), (size * 0.2, size * 0.5), (0pt, size * 0.5), stroke: 1.5pt + color)
    ]
  ]
}

// Rows
#let icon-rows(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon((0pt, 0pt), (size * 0.5, 0pt), (size * 0.5, size * 0.18), (0pt, size * 0.18), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.52)[
      #polygon((0pt, 0pt), (size * 0.5, 0pt), (size * 0.5, size * 0.18), (0pt, size * 0.18), stroke: 1.5pt + color)
    ]
  ]
}

// Align Left
#let icon-align-left(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(4) {
      place(dx: size * 0.25, dy: size * (0.25 + i * 0.12))[
        #line(start: (0pt, 0pt), end: (size * (if calc.rem(i, 2) == 0 { 0.5 } else { 0.35 }), 0pt), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Align Center
#let icon-align-center(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(4) {
      let w = if calc.rem(i, 2) == 0 { 0.5 } else { 0.35 }
      place(dx: size * (0.5 - w / 2), dy: size * (0.25 + i * 0.12))[
        #line(start: (0pt, 0pt), end: (size * w, 0pt), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Align Right
#let icon-align-right(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(4) {
      let w = if calc.rem(i, 2) == 0 { 0.5 } else { 0.35 }
      place(dx: size * (0.75 - w), dy: size * (0.25 + i * 0.12))[
        #line(start: (0pt, 0pt), end: (size * w, 0pt), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Text Bold
#let icon-text-bold(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.5)[
      #text(size: size * 0.6, weight: 700, fill: color)[B]
    ]
  ]
}

// Text Italic
#let icon-text-italic(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.42, dy: size * 0.5)[
      #text(size: size * 0.6, style: "italic", fill: color)[I]
    ]
  ]
}

// Text Underline
#let icon-text-underline(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.48)[
      #text(size: size * 0.6, fill: color)[U]
    ]
    #place(dx: size * 0.35, dy: size * 0.72)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Link External
#let icon-link-external(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (size * 0.25, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.75, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (-size * 0.2, size * 0.2), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.4)[
      #polygon((0pt, 0pt), (size * 0.3, 0pt), (size * 0.3, size * 0.3), (0pt, size * 0.3), stroke: 1.5pt + color)
    ]
  ]
}

// QR Code
#let icon-qrcode(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for row in range(4) {
      for col in range(4) {
        if calc.rem(row + col, 2) == 0 {
          place(dx: size * (0.28 + col * 0.11), dy: size * (0.28 + row * 0.11))[
            #polygon((0pt, 0pt), (size * 0.08, 0pt), (size * 0.08, size * 0.08), (0pt, size * 0.08), fill: color)
          ]
        }
      }
    }
  ]
}

// Fingerprint
#let icon-fingerprint(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(4) {
      place(dx: size * 0.5, dy: size * 0.5)[
        #circle(radius: size * (0.12 + i * 0.08), stroke: 1pt + color)
      ]
    }
  ]
}

// Face ID
#let icon-face-id(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.42)[
      #circle(radius: 2pt, fill: color)
    ]
    #place(dx: size * 0.6, dy: size * 0.42)[
      #circle(radius: 2pt, fill: color)
    ]
    #place(dx: size * 0.5, dy: size * 0.62)[
      #line(start: (-size * 0.1, 0pt), end: (size * 0.1, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Microchip/CPU
#let icon-chip(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.35)[
      #polygon((0pt, 0pt), (size * 0.3, 0pt), (size * 0.3, size * 0.3), (0pt, size * 0.3), stroke: 1.5pt + color)
    ]
    #for i in range(3) {
      place(dx: size * 0.25, dy: size * (0.38 + i * 0.08))[
        #line(start: (0pt, 0pt), end: (-size * 0.08, 0pt), stroke: 1pt + color)
      ]
      place(dx: size * 0.65, dy: size * (0.38 + i * 0.08))[
        #line(start: (0pt, 0pt), end: (size * 0.08, 0pt), stroke: 1pt + color)
      ]
    }
  ]
}

// Terminal
#let icon-terminal(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.1, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.37)[
      #line(start: (0pt, 0pt), end: (size * 0.1, size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.52, dy: size * 0.52)[
      #line(start: (0pt, 0pt), end: (size * 0.15, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Bug
#let icon-bug(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.45)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.35)[
      #circle(radius: 2pt, fill: color)
    ]
    #place(dx: size * 0.55, dy: size * 0.35)[
      #circle(radius: 2pt, fill: color)
    ]
    #for angle in (30, 150) {
      place(dx: size * 0.5, dy: size * 0.3)[
        #rotate(angle * 1deg)[
          #line(start: (0pt, 0pt), end: (0pt, -size * 0.15), stroke: 1pt + color)
        ]
      ]
    }
  ]
}

// Wrench/Tool
#let icon-wrench(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.25, size * 0.25), stroke: 2pt + color)
    ]
  ]
}

// Hammer
#let icon-hammer(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.6, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, 0pt),
        (size * 0.15, size * 0.1),
        (0pt, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.4, -size * 0.4), stroke: 2pt + color)
    ]
  ]
}

// Rocket
#let icon-rocket(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.35),
        (size * 0.15, size * 0.1),
        (size * 0.08, size * 0.35),
        (-size * 0.08, size * 0.35),
        (-size * 0.15, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.38)[
      #circle(radius: size * 0.08, stroke: 1.5pt + color)
    ]
  ]
}

// Trophy
#let icon-trophy(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.4)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (-size * 0.1, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.1, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.55)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.15), stroke: 2pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Gift/Present
#let icon-gift(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.4)[
      #polygon((0pt, 0pt), (size * 0.4, 0pt), (size * 0.4, size * 0.35), (0pt, size * 0.35), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.35), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Cube/3D
#let icon-cube(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.12),
        (size * 0.2, size * 0.4),
        (0pt, size * 0.52),
        (-size * 0.2, size * 0.4),
        (-size * 0.2, size * 0.12),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.52), stroke: 1.5pt + color)
    ]
  ]
}

// Puzzle
#let icon-puzzle(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.1),
        (size * 0.35, size * 0.1),
        (size * 0.35, size * 0.18),
        (size * 0.3, size * 0.18),
        (size * 0.3, size * 0.3),
        (0pt, size * 0.3),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Target/Aim
#let icon-target(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.3, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: 2.5pt, fill: color)
    ]
  ]
}

// Megaphone
#let icon-megaphone(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.15),
        (size * 0.4, -size * 0.08),
        (size * 0.4, size * 0.18),
        (size * 0.15, size * 0.25),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Volume Up
#let icon-volume-up(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (size * 0.12, -size * 0.1),
        (size * 0.25, -size * 0.1),
        (size * 0.25, size * 0.2),
        (size * 0.12, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
    #for i in range(2) {
      place(dx: size * (0.55 + i * 0.12), dy: size * 0.5)[
        #circle(radius: size * (0.12 + i * 0.08), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Volume Mute
#let icon-volume-mute(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (size * 0.12, -size * 0.1),
        (size * 0.25, -size * 0.1),
        (size * 0.25, size * 0.2),
        (size * 0.12, size * 0.2),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.55, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.2), stroke: 2pt + color)
    ]
  ]
}

// ============================================
// MEDIA CONTROLS
// ============================================

// Skip Forward
#let icon-skip-forward(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.15),
        (0pt, size * 0.3),
        fill: color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.15),
        (0pt, size * 0.3),
        fill: color
      )
    ]
    #place(dx: size * 0.72, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 2pt + color)
    ]
  ]
}

// Skip Back
#let icon-skip-back(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.28, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, size * 0.15),
        (size * 0.2, 0pt),
        (size * 0.2, size * 0.3),
        fill: color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.35)[
      #polygon(
        (0pt, size * 0.15),
        (size * 0.2, 0pt),
        (size * 0.2, size * 0.3),
        fill: color
      )
    ]
  ]
}

// Rewind
#let icon-rewind(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, size * 0.15),
        (size * 0.2, 0pt),
        (size * 0.2, size * 0.3),
        fill: color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.35)[
      #polygon(
        (0pt, size * 0.15),
        (size * 0.2, 0pt),
        (size * 0.2, size * 0.3),
        fill: color
      )
    ]
  ]
}

// Fast Forward
#let icon-fast-forward(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.15),
        (0pt, size * 0.3),
        fill: color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.2, size * 0.15),
        (0pt, size * 0.3),
        fill: color
      )
    ]
  ]
}

// Repeat
#let icon-repeat(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.45)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.08, -size * 0.08),
        (-size * 0.08, size * 0.08),
        fill: color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.08, size * 0.08),
        (size * 0.08, -size * 0.08),
        fill: color
      )
    ]
  ]
}

// Shuffle
#let icon-shuffle(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.5, size * 0.3), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.5, -size * 0.3), stroke: 1.5pt + color)
    ]
  ]
}

// Eject
#let icon-eject(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, size * 0.2),
        (-size * 0.15, 0pt),
        (size * 0.15, 0pt),
        fill: color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 2pt + color)
    ]
  ]
}

// ============================================
// SHAPES
// ============================================

// Circle Outline
#let icon-circle-outline(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.25, stroke: 1.5pt + color)
    ]
  ]
}

// Square Outline
#let icon-square-outline(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Triangle
#let icon-triangle(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.2, size * 0.35),
        (size * 0.2, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Pentagon
#let icon-pentagon(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, -size * 0.15),
        (size * 0.15, -size * 0.05),
        (size * 0.1, size * 0.15),
        (-size * 0.1, size * 0.15),
        (-size * 0.15, -size * 0.05),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Hexagon
#let icon-hexagon(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, -size * 0.15),
        (size * 0.13, -size * 0.075),
        (size * 0.13, size * 0.075),
        (0pt, size * 0.15),
        (-size * 0.13, size * 0.075),
        (-size * 0.13, -size * 0.075),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Diamond
#let icon-diamond(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.2),
        (size * 0.2, 0pt),
        (0pt, size * 0.2),
        (-size * 0.2, 0pt),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// ============================================
// PROGRESS & LOADING
// ============================================

// Loading
#let icon-loading(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.25, stroke: 1.5pt + gray-30)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.25, stroke: (paint: color, thickness: 1.5pt, dash: "dashed"))
    ]
  ]
}

// Spinner
#let icon-spinner(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(8) {
      let angle = i * 45deg
      place(dx: size * 0.5, dy: size * 0.5)[
        #rotate(angle)[
          #place(dy: -size * 0.3)[
            #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: (1.5pt + color))
          ]
        ]
      ]
    }
  ]
}

// Refresh
#let icon-refresh(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.22, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.72, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.08, -size * 0.08),
        (-size * 0.08, size * 0.08),
        fill: color
      )
    ]
  ]
}

// Sync
#let icon-sync(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.65)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.06, size * 0.06),
        (-size * 0.06, size * 0.06),
        fill: color
      )
    ]
    #place(dx: size * 0.7, dy: size * 0.8)[
      #polygon(
        (0pt, 0pt),
        (size * 0.06, -size * 0.06),
        (-size * 0.06, -size * 0.06),
        fill: color
      )
    ]
  ]
}

// Progress Bar
#let icon-progress-bar(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.2, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (size * 0.6, 0pt),
        (size * 0.6, size * 0.1),
        (0pt, size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.2, dy: size * 0.45)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.35, size * 0.1),
        (0pt, size * 0.1),
        fill: color
      )
    ]
  ]
}

// ============================================
// FILE TYPES
// ============================================

// JSON
#let icon-json(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.45)[
      #text(size: size * 0.22, fill: color)[{}]
    ]
  ]
}

// XML
#let icon-xml(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.42)[
      #text(size: size * 0.25, fill: color)[<>]
    ]
  ]
}

// CSV
#let icon-csv(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #for row in range(3) {
      for col in range(2) {
        place(dx: size * (0.32 + col * 0.18), dy: size * (0.3 + row * 0.12))[
          #circle(radius: 1.5pt, fill: color)
        ]
      }
    }
  ]
}

// Markdown
#let icon-markdown(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.38, dy: size * 0.42)[
      #text(size: size * 0.28, fill: color, weight: 700)[M]
    ]
  ]
}

// Text File
#let icon-text-file(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #for i in range(4) {
      place(dx: size * 0.32, dy: size * (0.3 + i * 0.1))[
        #line(start: (0pt, 0pt), end: (size * 0.36, 0pt), stroke: 1pt + color)
      ]
    }
  ]
}

// ZIP
#let icon-zip(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.2)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.6),
        (0pt, size * 0.6),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.42)[
      #text(size: size * 0.25, fill: color)[Z]
    ]
  ]
}

// ============================================
// WEATHER
// ============================================

// Cloud Rain
#let icon-cloud-rain(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// Cloud Snow
#let icon-cloud-snow(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #for i in range(3) {
      place(dx: size * (0.35 + i * 0.15), dy: size * 0.65)[
        #circle(radius: 2pt, fill: color)
      ]
    }
  ]
}

// Wind
#let icon-wind(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(3) {
      place(dx: size * 0.25, dy: size * (0.35 + i * 0.12))[
        #line(start: (0pt, 0pt), end: (size * (0.5 - i * 0.08), 0pt), stroke: 1.5pt + color)
      ]
    }
  ]
}

// Temperature
#let icon-temperature(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #circle(radius: size * 0.08, fill: color)
    ]
  ]
}

// ============================================
// SECURITY
// ============================================

// Shield Check
#let icon-shield-check(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.1),
        (size * 0.15, size * 0.3),
        (0pt, size * 0.4),
        (-size * 0.15, size * 0.3),
        (-size * 0.15, -size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.42, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.06, size * 0.06), stroke: 2pt + color)
    ]
    #place(dx: size * 0.48, dy: size * 0.51)[
      #line(start: (0pt, 0pt), end: (size * 0.12, -size * 0.15), stroke: 2pt + color)
    ]
  ]
}

// Shield X
#let icon-shield-x(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.1),
        (size * 0.15, size * 0.3),
        (0pt, size * 0.4),
        (-size * 0.15, size * 0.3),
        (-size * 0.15, -size * 0.1),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.42, dy: size * 0.38)[
      #line(start: (0pt, 0pt), end: (size * 0.16, size * 0.16), stroke: 2pt + color)
    ]
    #place(dx: size * 0.42, dy: size * 0.54)[
      #line(start: (0pt, 0pt), end: (size * 0.16, -size * 0.16), stroke: 2pt + color)
    ]
  ]
}

// Password
#let icon-password(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #for i in range(4) {
      place(dx: size * (0.3 + i * 0.13), dy: size * 0.5)[
        #circle(radius: 2pt, fill: color)
      ]
    }
  ]
}

// VPN
#let icon-vpn(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.4)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.52)[
      #polygon(
        (-size * 0.08, 0pt),
        (size * 0.08, 0pt),
        (size * 0.08, size * 0.15),
        (-size * 0.08, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Encrypt
#let icon-encrypt(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.15),
        (size * 0.3, 0pt),
        (size * 0.15, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.25, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.15),
        (size * 0.3, 0pt),
        (size * 0.15, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// ============================================
// ADDITIONAL UTILITIES
// ============================================

// Brightness
#let icon-brightness(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.1, fill: color)
    ]
    #for i in range(8) {
      let angle = i * 45deg
      place(dx: size * 0.5, dy: size * 0.5)[
        #rotate(angle)[
          #place(dy: -size * 0.25)[
            #line(start: (0pt, 0pt), end: (0pt, size * 0.08), stroke: 1.5pt + color)
          ]
        ]
      ]
    }
  ]
}

// Contrast
#let icon-contrast(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.2),
        (size * 0.2, 0pt),
        (0pt, size * 0.2),
        fill: color
      )
    ]
  ]
}

// Crop
#let icon-crop(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.4), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Rotate Left
#let icon-rotate-left(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.18, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.28)[
      #polygon(
        (0pt, 0pt),
        (size * 0.08, size * 0.08),
        (-size * 0.08, size * 0.08),
        fill: color
      )
    ]
  ]
}

// Rotate Right
#let icon-rotate-right(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.18, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.28)[
      #polygon(
        (0pt, 0pt),
        (size * 0.08, size * 0.08),
        (-size * 0.08, size * 0.08),
        fill: color
      )
    ]
  ]
}

// Flip Horizontal
#let icon-flip-horizontal(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.15),
        (size * 0.1, 0pt),
        (0pt, size * 0.15),
        fill: color
      )
    ]
    #place(dx: size * 0.65, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.15),
        (-size * 0.1, 0pt),
        (0pt, size * 0.15),
        fill: color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 1pt + color)
    ]
  ]
}

// Flip Vertical
#let icon-flip-vertical(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (-size * 0.15, 0pt),
        (0pt, size * 0.1),
        (size * 0.15, 0pt),
        fill: color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #polygon(
        (-size * 0.15, 0pt),
        (0pt, -size * 0.1),
        (size * 0.15, 0pt),
        fill: color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1pt + color)
    ]
  ]
}

// ============================================
// ADDITIONAL ACTIONS
// ============================================

// Duplicate
#let icon-duplicate(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.35, size * 0.35),
        (0pt, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.35, 0pt),
        (size * 0.35, size * 0.35),
        (0pt, size * 0.35),
        fill: white,
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Archive
#let icon-archive(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.45, size * 0.08),
        (size * 0.05, size * 0.08),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.28, dy: size * 0.38)[
      #polygon(
        (0pt, 0pt),
        (size * 0.44, 0pt),
        (size * 0.44, size * 0.35),
        (0pt, size * 0.35),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.4, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.2, 0pt), stroke: 2pt + color)
    ]
  ]
}

// Pin
#let icon-pin(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #circle(radius: size * 0.05, fill: color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #polygon(
        (0pt, 0pt),
        (-size * 0.08, -size * 0.08),
        (size * 0.08, -size * 0.08),
        fill: color
      )
    ]
  ]
}

// Unpin
#let icon-unpin(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #circle(radius: size * 0.05, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.25), stroke: 2pt + color)
    ]
  ]
}

// Expand
#let icon-expand(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.12, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.3, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.7, dy: size * 0.7)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// Collapse
#let icon-collapse(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (-size * 0.12, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.12), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.12, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.12), stroke: 1.5pt + color)
    ]
  ]
}

// ============================================
// MISCELLANEOUS PROFESSIONAL
// ============================================

// Certificate
#let icon-certificate(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #circle(radius: size * 0.08, stroke: 1.5pt + color)
    ]
  ]
}

// Award
#let icon-award(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #circle(radius: size * 0.12, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.42, dy: size * 0.47)[
      #polygon(
        (0pt, 0pt),
        (size * 0.08, size * 0.2),
        (size * 0.04, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.47)[
      #polygon(
        (0pt, 0pt),
        (size * 0.08, size * 0.2),
        (size * 0.04, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Medal
#let icon-medal(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.15, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.4, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Crown
#let icon-crown(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.4)[
      #polygon(
        (0pt, 0pt),
        (size * 0.1, -size * 0.1),
        (size * 0.2, 0pt),
        (size * 0.3, -size * 0.15),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.15),
        (0pt, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Infinity
#let icon-infinity(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.5)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.5)[
      #circle(radius: size * 0.1, stroke: 1.5pt + color)
    ]
  ]
}

// Percent
#let icon-percent(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.35)[
      #circle(radius: size * 0.05, fill: color)
    ]
    #place(dx: size * 0.65, dy: size * 0.65)[
      #circle(radius: size * 0.05, fill: color)
    ]
    #place(dx: size * 0.3, dy: size * 0.65)[
      #line(start: (0pt, 0pt), end: (size * 0.4, -size * 0.4), stroke: 1.5pt + color)
    ]
  ]
}

// Hash
#let icon-hash(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.5), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.5), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.4)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.25, dy: size * 0.6)[
      #line(start: (0pt, 0pt), end: (size * 0.5, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// At Symbol
#let icon-at(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.08, fill: color)
    ]
  ]
}

// ============================================
// FINAL ADDITIONS
// ============================================

// Notification Bell
#let icon-notification(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.4)[
      #polygon(
        (0pt, -size * 0.1),
        (size * 0.12, size * 0.15),
        (-size * 0.12, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.6)[
      #line(start: (-size * 0.08, 0pt), end: (size * 0.08, 0pt), stroke: 1.5pt + color)
    ]
  ]
}

// Map
#let icon-map(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.05),
        (size * 0.15, size * 0.4),
        (0pt, size * 0.45),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.55, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, size * 0.05),
        (size * 0.15, size * 0.5),
        (0pt, size * 0.45),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Book
#let icon-book(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.4, 0pt),
        (size * 0.4, size * 0.5),
        (0pt, size * 0.5),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.5), stroke: 1pt + color)
    ]
  ]
}

// Bookmark Fill
#let icon-bookmark-fill(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.3, 0pt),
        (size * 0.3, size * 0.45),
        (size * 0.15, size * 0.35),
        (0pt, size * 0.45),
        fill: color
      )
    ]
  ]
}

// Notification Off
#let icon-notification-off(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.4)[
      #polygon(
        (0pt, -size * 0.1),
        (size * 0.12, size * 0.15),
        (-size * 0.12, size * 0.15),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.3, dy: size * 0.25)[
      #line(start: (0pt, 0pt), end: (size * 0.4, size * 0.5), stroke: 2pt + color)
    ]
  ]
}

// Image Gallery
#let icon-gallery(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.25, dy: size * 0.25)[
      #polygon(
        (0pt, 0pt),
        (size * 0.5, 0pt),
        (size * 0.5, size * 0.4),
        (0pt, size * 0.4),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.35, dy: size * 0.35)[
      #circle(radius: size * 0.05, fill: color)
    ]
    #place(dx: size * 0.3, dy: size * 0.55)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.45, dy: size * 0.55)[
      #line(start: (0pt, 0pt), end: (size * 0.15, -size * 0.1), stroke: 1.5pt + color)
    ]
  ]
}

// Layers
#let icon-layer(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.35)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.08),
        (0pt, -size * 0.16),
        (-size * 0.15, -size * 0.08),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.08),
        (0pt, -size * 0.16),
        (-size * 0.15, -size * 0.08),
        stroke: 1.5pt + color
      )
    ]
    #place(dx: size * 0.5, dy: size * 0.65)[
      #polygon(
        (0pt, 0pt),
        (size * 0.15, -size * 0.08),
        (0pt, -size * 0.16),
        (-size * 0.15, -size * 0.08),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Magic Wand
#let icon-magic(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.35, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (size * 0.3, size * 0.3), stroke: 2pt + color)
    ]
    #for i in range(4) {
      let angle = i * 90deg
      place(dx: size * 0.65, dy: size * 0.35)[
        #rotate(angle)[
          #place(dy: -size * 0.08)[
            #line(start: (0pt, 0pt), end: (0pt, size * 0.08), stroke: 1.5pt + color)
          ]
        ]
      ]
    }
  ]
}

// Compass
#let icon-compass(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.12),
        (size * 0.05, 0pt),
        (0pt, size * 0.12),
        (-size * 0.05, 0pt),
        fill: color
      )
    ]
  ]
}

// Alarm
#let icon-alarm(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.18, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (0pt, -size * 0.1), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.5, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.08, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.32, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (-size * 0.08, -size * 0.08), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.68, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.08, -size * 0.08), stroke: 1.5pt + color)
    ]
  ]
}

// Hourglass
#let icon-hourglass(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #polygon(
        (0pt, -size * 0.2),
        (size * 0.12, -size * 0.2),
        (size * 0.05, 0pt),
        (size * 0.12, size * 0.2),
        (-size * 0.12, size * 0.2),
        (-size * 0.05, 0pt),
        (-size * 0.12, -size * 0.2),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Anchor
#let icon-anchor(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.3)[
      #circle(radius: size * 0.05, fill: color)
    ]
    #place(dx: size * 0.5, dy: size * 0.35)[
      #line(start: (0pt, 0pt), end: (0pt, size * 0.3), stroke: 2pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.5)[
      #line(start: (0pt, 0pt), end: (size * 0.3, 0pt), stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.35, dy: size * 0.65)[
      #circle(radius: size * 0.05, stroke: 1.5pt + color)
    ]
    #place(dx: size * 0.65, dy: size * 0.65)[
      #circle(radius: size * 0.05, stroke: 1.5pt + color)
    ]
  ]
}

// Paperclip
#let icon-paperclip(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.45, dy: size * 0.3)[
      #polygon(
        (0pt, 0pt),
        (size * 0.1, 0pt),
        (size * 0.1, size * 0.3),
        (size * 0.05, size * 0.35),
        (0pt, size * 0.3),
        stroke: 1.5pt + color
      )
    ]
  ]
}

// Ruler
#let icon-ruler(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.3, dy: size * 0.45)[
      #line(start: (0pt, 0pt), end: (size * 0.4, 0pt), stroke: 2pt + color)
    ]
    #for i in range(5) {
      place(dx: size * (0.32 + i * 0.09), dy: size * 0.45)[
        #line(start: (0pt, 0pt), end: (0pt, size * (if calc.rem(i, 2) == 0 { 0.08 } else { 0.05 })), stroke: 1pt + color)
      ]
    }
  ]
}

// Palette
#let icon-palette(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.5, dy: size * 0.5)[
      #circle(radius: size * 0.2, stroke: 1.5pt + color)
    ]
    #for i in range(3) {
      let angle = i * 120deg
      place(dx: size * 0.5, dy: size * 0.5)[
        #rotate(angle)[
          #place(dy: -size * 0.12)[
            #circle(radius: 2pt, fill: color)
          ]
        ]
      ]
    }
  ]
}

// Eyedropper
#let icon-eyedropper(size: 16pt, color: gray-100) = {
  icon-base(size: size, color: color)[
    #place(dx: size * 0.4, dy: size * 0.3)[
      #line(start: (0pt, 0pt), end: (size * 0.2, size * 0.2), stroke: 2pt + color)
    ]
    #place(dx: size * 0.6, dy: size * 0.5)[
      #polygon(
        (0pt, 0pt),
        (size * 0.08, size * 0.08),
        (0pt, size * 0.15),
        fill: color
      )
    ]
  ]
}

// ============================================
// UTILITY FUNCTION
// ============================================

// Icon selector function - 251 icons available
#let icon(
  name,
  size: 16pt,
  color: gray-100
) = {
  // Status Icons
  if name == "checkmark" { icon-checkmark(size: size, color: color) }
  else if name == "success" { icon-success(size: size, color: color) }
  else if name == "error" { icon-error(size: size, color: color) }
  else if name == "warning" { icon-warning(size: size, color: color) }
  else if name == "info" { icon-info(size: size, color: color) }
  else if name == "close" { icon-close(size: size, color: color) }

  // Navigation - Arrows
  else if name == "arrow-up" { icon-arrow-up(size: size, color: color) }
  else if name == "arrow-down" { icon-arrow-down(size: size, color: color) }
  else if name == "arrow-left" { icon-arrow-left(size: size, color: color) }
  else if name == "arrow-right" { icon-arrow-right(size: size, color: color) }
  else if name == "arrow-up-left" { icon-arrow-up-left(size: size, color: color) }
  else if name == "arrow-up-right" { icon-arrow-up-right(size: size, color: color) }
  else if name == "arrow-down-left" { icon-arrow-down-left(size: size, color: color) }
  else if name == "arrow-down-right" { icon-arrow-down-right(size: size, color: color) }
  else if name == "arrows-horizontal" { icon-arrows-horizontal(size: size, color: color) }
  else if name == "arrows-vertical" { icon-arrows-vertical(size: size, color: color) }

  // Navigation - Chevrons
  else if name == "chevron-up" { icon-chevron-up(size: size, color: color) }
  else if name == "chevron-down" { icon-chevron-down(size: size, color: color) }
  else if name == "chevron-left" { icon-chevron-left(size: size, color: color) }
  else if name == "chevron-right" { icon-chevron-right(size: size, color: color) }

  // Actions - Rotation & Undo
  else if name == "rotate-clockwise" { icon-rotate-clockwise(size: size, color: color) }
  else if name == "rotate-counterclockwise" { icon-rotate-counterclockwise(size: size, color: color) }
  else if name == "rotate-left" { icon-rotate-left(size: size, color: color) }
  else if name == "rotate-right" { icon-rotate-right(size: size, color: color) }
  else if name == "undo" { icon-undo(size: size, color: color) }
  else if name == "redo" { icon-redo(size: size, color: color) }

  // Actions - Basic
  else if name == "add" { icon-add(size: size, color: color) }
  else if name == "subtract" { icon-subtract(size: size, color: color) }
  else if name == "edit" { icon-edit(size: size, color: color) }
  else if name == "delete" { icon-delete(size: size, color: color) }
  else if name == "copy" { icon-copy(size: size, color: color) }
  else if name == "paste" { icon-paste(size: size, color: color) }
  else if name == "cut" { icon-cut(size: size, color: color) }
  else if name == "save" { icon-save(size: size, color: color) }
  else if name == "export" { icon-export(size: size, color: color) }
  else if name == "import" { icon-import(size: size, color: color) }
  else if name == "print" { icon-print(size: size, color: color) }
  else if name == "share" { icon-share(size: size, color: color) }
  else if name == "lock" { icon-lock(size: size, color: color) }
  else if name == "unlock" { icon-unlock(size: size, color: color) }
  else if name == "view" { icon-view(size: size, color: color) }
  else if name == "view-off" { icon-view-off(size: size, color: color) }
  else if name == "zoom-in" { icon-zoom-in(size: size, color: color) }
  else if name == "zoom-out" { icon-zoom-out(size: size, color: color) }
  else if name == "filter" { icon-filter(size: size, color: color) }
  else if name == "sort" { icon-sort(size: size, color: color) }
  else if name == "search" { icon-search(size: size, color: color) }

  // Media Controls
  else if name == "play" { icon-play(size: size, color: color) }
  else if name == "pause" { icon-pause(size: size, color: color) }
  else if name == "stop" { icon-stop(size: size, color: color) }
  else if name == "skip-forward" { icon-skip-forward(size: size, color: color) }
  else if name == "skip-back" { icon-skip-back(size: size, color: color) }
  else if name == "rewind" { icon-rewind(size: size, color: color) }
  else if name == "fast-forward" { icon-fast-forward(size: size, color: color) }
  else if name == "repeat" { icon-repeat(size: size, color: color) }
  else if name == "shuffle" { icon-shuffle(size: size, color: color) }
  else if name == "eject" { icon-eject(size: size, color: color) }
  else if name == "volume-up" { icon-volume-up(size: size, color: color) }
  else if name == "volume-mute" { icon-volume-mute(size: size, color: color) }

  // UI Elements
  else if name == "menu" { icon-menu(size: size, color: color) }
  else if name == "settings" { icon-settings(size: size, color: color) }
  else if name == "star" { icon-star(size: size, color: color) }
  else if name == "heart" { icon-heart(size: size, color: color) }
  else if name == "flag" { icon-flag(size: size, color: color) }
  else if name == "tag" { icon-tag(size: size, color: color) }
  else if name == "bell" { icon-bell(size: size, color: color) }
  else if name == "notification" { icon-notification(size: size, color: color) }
  else if name == "notification-off" { icon-notification-off(size: size, color: color) }
  else if name == "calendar" { icon-calendar(size: size, color: color) }
  else if name == "clock" { icon-clock(size: size, color: color) }

  // Documents & Files
  else if name == "document" { icon-document(size: size, color: color) }
  else if name == "file" { icon-file(size: size, color: color) }
  else if name == "folder" { icon-folder(size: size, color: color) }
  else if name == "folder-open" { icon-folder-open(size: size, color: color) }
  else if name == "download" { icon-download(size: size, color: color) }
  else if name == "upload" { icon-upload(size: size, color: color) }
  else if name == "pdf" { icon-pdf(size: size, color: color) }
  else if name == "image" { icon-image(size: size, color: color) }
  else if name == "video" { icon-video(size: size, color: color) }
  else if name == "audio" { icon-audio(size: size, color: color) }
  else if name == "archive" { icon-archive(size: size, color: color) }
  else if name == "code" { icon-code(size: size, color: color) }
  else if name == "database" { icon-database(size: size, color: color) }
  else if name == "json" { icon-json(size: size, color: color) }
  else if name == "xml" { icon-xml(size: size, color: color) }
  else if name == "csv" { icon-csv(size: size, color: color) }
  else if name == "markdown" { icon-markdown(size: size, color: color) }
  else if name == "text-file" { icon-text-file(size: size, color: color) }
  else if name == "zip" { icon-zip(size: size, color: color) }
  else if name == "cloud" { icon-cloud(size: size, color: color) }
  else if name == "cloud-upload" { icon-cloud-upload(size: size, color: color) }
  else if name == "cloud-download" { icon-cloud-download(size: size, color: color) }
  else if name == "cloud-rain" { icon-cloud-rain(size: size, color: color) }
  else if name == "cloud-snow" { icon-cloud-snow(size: size, color: color) }
  else if name == "bookmark" { icon-bookmark(size: size, color: color) }
  else if name == "bookmark-fill" { icon-bookmark-fill(size: size, color: color) }
  else if name == "attachment" { icon-attachment(size: size, color: color) }

  // Communication
  else if name == "email" { icon-email(size: size, color: color) }
  else if name == "send" { icon-send(size: size, color: color) }
  else if name == "reply" { icon-reply(size: size, color: color) }
  else if name == "forward" { icon-forward(size: size, color: color) }
  else if name == "user" { icon-user(size: size, color: color) }
  else if name == "user-group" { icon-user-group(size: size, color: color) }
  else if name == "chat" { icon-chat(size: size, color: color) }
  else if name == "comment" { icon-comment(size: size, color: color) }
  else if name == "phone" { icon-phone(size: size, color: color) }
  else if name == "location" { icon-location(size: size, color: color) }
  else if name == "globe" { icon-globe(size: size, color: color) }
  else if name == "home" { icon-home(size: size, color: color) }
  else if name == "link" { icon-link(size: size, color: color) }
  else if name == "link-external" { icon-link-external(size: size, color: color) }
  else if name == "map" { icon-map(size: size, color: color) }
  else if name == "compass" { icon-compass(size: size, color: color) }

  // Charts & Data
  else if name == "chart-bar" { icon-chart-bar(size: size, color: color) }
  else if name == "chart-line" { icon-chart-line(size: size, color: color) }
  else if name == "chart-pie" { icon-chart-pie(size: size, color: color) }
  else if name == "chart-area" { icon-chart-area(size: size, color: color) }
  else if name == "chart-scatter" { icon-chart-scatter(size: size, color: color) }
  else if name == "chart-bubble" { icon-chart-bubble(size: size, color: color) }
  else if name == "chart-radar" { icon-chart-radar(size: size, color: color) }
  else if name == "chart-treemap" { icon-chart-treemap(size: size, color: color) }
  else if name == "dashboard" { icon-dashboard(size: size, color: color) }
  else if name == "trending-up" { icon-trending-up(size: size, color: color) }
  else if name == "trending-down" { icon-trending-down(size: size, color: color) }
  else if name == "analytics" { icon-analytics(size: size, color: color) }
  else if name == "report" { icon-report(size: size, color: color) }
  else if name == "table" { icon-table(size: size, color: color) }
  else if name == "grid" { icon-grid(size: size, color: color) }
  else if name == "list" { icon-list(size: size, color: color) }
  else if name == "kanban" { icon-kanban(size: size, color: color) }

  // Devices
  else if name == "laptop" { icon-laptop(size: size, color: color) }
  else if name == "desktop" { icon-desktop(size: size, color: color) }
  else if name == "mobile" { icon-mobile(size: size, color: color) }
  else if name == "tablet" { icon-tablet(size: size, color: color) }
  else if name == "watch" { icon-watch(size: size, color: color) }
  else if name == "server" { icon-server(size: size, color: color) }
  else if name == "network" { icon-network(size: size, color: color) }
  else if name == "wifi" { icon-wifi(size: size, color: color) }
  else if name == "bluetooth" { icon-bluetooth(size: size, color: color) }
  else if name == "usb" { icon-usb(size: size, color: color) }
  else if name == "battery" { icon-battery(size: size, color: color) }
  else if name == "power" { icon-power(size: size, color: color) }
  else if name == "microphone" { icon-microphone(size: size, color: color) }
  else if name == "camera" { icon-camera(size: size, color: color) }

  // Commerce
  else if name == "cart" { icon-cart(size: size, color: color) }
  else if name == "credit-card" { icon-credit-card(size: size, color: color) }
  else if name == "money" { icon-money(size: size, color: color) }
  else if name == "wallet" { icon-wallet(size: size, color: color) }
  else if name == "receipt" { icon-receipt(size: size, color: color) }
  else if name == "store" { icon-store(size: size, color: color) }
  else if name == "package" { icon-package(size: size, color: color) }
  else if name == "delivery" { icon-delivery(size: size, color: color) }
  else if name == "barcode" { icon-barcode(size: size, color: color) }

  // Shapes
  else if name == "circle-outline" { icon-circle-outline(size: size, color: color) }
  else if name == "square-outline" { icon-square-outline(size: size, color: color) }
  else if name == "triangle" { icon-triangle(size: size, color: color) }
  else if name == "pentagon" { icon-pentagon(size: size, color: color) }
  else if name == "hexagon" { icon-hexagon(size: size, color: color) }
  else if name == "diamond" { icon-diamond(size: size, color: color) }

  // Progress
  else if name == "loading" { icon-loading(size: size, color: color) }
  else if name == "spinner" { icon-spinner(size: size, color: color) }
  else if name == "refresh" { icon-refresh(size: size, color: color) }
  else if name == "sync" { icon-sync(size: size, color: color) }
  else if name == "progress-bar" { icon-progress-bar(size: size, color: color) }

  // Weather
  else if name == "wind" { icon-wind(size: size, color: color) }
  else if name == "temperature" { icon-temperature(size: size, color: color) }
  else if name == "thermometer" { icon-thermometer(size: size, color: color) }
  else if name == "drop" { icon-drop(size: size, color: color) }
  else if name == "sun" { icon-sun(size: size, color: color) }
  else if name == "moon" { icon-moon(size: size, color: color) }

  // Security
  else if name == "shield" { icon-shield(size: size, color: color) }
  else if name == "shield-check" { icon-shield-check(size: size, color: color) }
  else if name == "shield-x" { icon-shield-x(size: size, color: color) }
  else if name == "password" { icon-password(size: size, color: color) }
  else if name == "vpn" { icon-vpn(size: size, color: color) }
  else if name == "encrypt" { icon-encrypt(size: size, color: color) }
  else if name == "key" { icon-key(size: size, color: color) }
  else if name == "fingerprint" { icon-fingerprint(size: size, color: color) }
  else if name == "face-id" { icon-face-id(size: size, color: color) }

  // Utilities
  else if name == "brightness" { icon-brightness(size: size, color: color) }
  else if name == "contrast" { icon-contrast(size: size, color: color) }
  else if name == "crop" { icon-crop(size: size, color: color) }
  else if name == "flip-horizontal" { icon-flip-horizontal(size: size, color: color) }
  else if name == "flip-vertical" { icon-flip-vertical(size: size, color: color) }
  else if name == "duplicate" { icon-duplicate(size: size, color: color) }
  else if name == "pin" { icon-pin(size: size, color: color) }
  else if name == "unpin" { icon-unpin(size: size, color: color) }
  else if name == "expand" { icon-expand(size: size, color: color) }
  else if name == "collapse" { icon-collapse(size: size, color: color) }

  // UI Controls
  else if name == "checkbox" { icon-checkbox(size: size, color: color) }
  else if name == "checkbox-checked" { icon-checkbox-checked(size: size, color: color) }
  else if name == "radio" { icon-radio(size: size, color: color) }
  else if name == "radio-selected" { icon-radio-selected(size: size, color: color) }
  else if name == "toggle-off" { icon-toggle-off(size: size, color: color) }
  else if name == "toggle-on" { icon-toggle-on(size: size, color: color) }
  else if name == "minimize" { icon-minimize(size: size, color: color) }
  else if name == "maximize" { icon-maximize(size: size, color: color) }
  else if name == "fullscreen" { icon-fullscreen(size: size, color: color) }
  else if name == "exit-fullscreen" { icon-exit-fullscreen(size: size, color: color) }
  else if name == "drag" { icon-drag(size: size, color: color) }
  else if name == "move" { icon-move(size: size, color: color) }
  else if name == "resize" { icon-resize(size: size, color: color) }
  else if name == "layout" { icon-layout(size: size, color: color) }
  else if name == "layers" { icon-layers(size: size, color: color) }
  else if name == "layer" { icon-layer(size: size, color: color) }
  else if name == "columns" { icon-columns(size: size, color: color) }
  else if name == "rows" { icon-rows(size: size, color: color) }

  // Text Formatting
  else if name == "align-left" { icon-align-left(size: size, color: color) }
  else if name == "align-center" { icon-align-center(size: size, color: color) }
  else if name == "align-right" { icon-align-right(size: size, color: color) }
  else if name == "text-bold" { icon-text-bold(size: size, color: color) }
  else if name == "text-italic" { icon-text-italic(size: size, color: color) }
  else if name == "text-underline" { icon-text-underline(size: size, color: color) }

  // Advanced
  else if name == "qrcode" { icon-qrcode(size: size, color: color) }
  else if name == "chip" { icon-chip(size: size, color: color) }
  else if name == "terminal" { icon-terminal(size: size, color: color) }
  else if name == "bug" { icon-bug(size: size, color: color) }
  else if name == "wrench" { icon-wrench(size: size, color: color) }
  else if name == "hammer" { icon-hammer(size: size, color: color) }

  // Miscellaneous
  else if name == "lightning" { icon-lightning(size: size, color: color) }
  else if name == "fire" { icon-fire(size: size, color: color) }
  else if name == "plant" { icon-plant(size: size, color: color) }
  else if name == "sparkle" { icon-sparkle(size: size, color: color) }
  else if name == "rocket" { icon-rocket(size: size, color: color) }
  else if name == "trophy" { icon-trophy(size: size, color: color) }
  else if name == "gift" { icon-gift(size: size, color: color) }
  else if name == "cube" { icon-cube(size: size, color: color) }
  else if name == "puzzle" { icon-puzzle(size: size, color: color) }
  else if name == "target" { icon-target(size: size, color: color) }
  else if name == "megaphone" { icon-megaphone(size: size, color: color) }
  else if name == "certificate" { icon-certificate(size: size, color: color) }
  else if name == "award" { icon-award(size: size, color: color) }
  else if name == "medal" { icon-medal(size: size, color: color) }
  else if name == "crown" { icon-crown(size: size, color: color) }
  else if name == "infinity" { icon-infinity(size: size, color: color) }
  else if name == "percent" { icon-percent(size: size, color: color) }
  else if name == "hash" { icon-hash(size: size, color: color) }
  else if name == "at" { icon-at(size: size, color: color) }
  else if name == "book" { icon-book(size: size, color: color) }
  else if name == "gallery" { icon-gallery(size: size, color: color) }
  else if name == "magic" { icon-magic(size: size, color: color) }
  else if name == "alarm" { icon-alarm(size: size, color: color) }
  else if name == "hourglass" { icon-hourglass(size: size, color: color) }
  else if name == "anchor" { icon-anchor(size: size, color: color) }
  else if name == "paperclip" { icon-paperclip(size: size, color: color) }
  else if name == "ruler" { icon-ruler(size: size, color: color) }
  else if name == "palette" { icon-palette(size: size, color: color) }
  else if name == "eyedropper" { icon-eyedropper(size: size, color: color) }

  // Default fallback
  else { box(width: size, height: size)[?] }
}
