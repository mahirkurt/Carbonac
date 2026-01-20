#set page(paper: "a4")
#set text(font: "DejaVu Sans", size: 11pt)

= Test Document for Marker Conversion

This is a simple test document to verify that Marker can successfully convert PDFs to Markdown.

== Section 1: Introduction

This document contains:
- Headers and subheaders
- Paragraphs with *bold* and _italic_ text
- Lists (both bulleted and numbered)
- Tables
- Code blocks

== Section 2: Data Table

#table(
  columns: 3,
  [*Name*], [*Age*], [*City*],
  [Alice], [30], [New York],
  [Bob], [25], [London],
  [Charlie], [35], [Tokyo]
)

== Section 3: Code Example

```python
def hello_world():
    print("Hello from Marker!")
    return True
```

== Section 4: Mathematical Formula

The quadratic formula: $ x = (-b plus.minus sqrt(b^2 - 4a c)) / (2a) $

== Conclusion

If you can read this in Markdown format after conversion, Marker is working correctly!
