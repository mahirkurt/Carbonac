// ============================================
// Carbon Charts Demo - Working Examples
// ============================================

#import "../templates/typst/carbon-dataviz.typ": *

// ============================================
// SALES PERFORMANCE REPORT
// ============================================

= Sales Performance Report

== Regional Revenue Comparison

Regional sales performance for Q4 2025 shows strong growth in Asia Pacific, with all regions exceeding targets.

#v(sp-06)

#bar-chart(
  (450, 380, 520, 285, 195),
  labels: ("North America", "Europe", "Asia Pacific", "Latin America", "Middle East"),
  show-values: true,
  height: 180pt
)

#v(sp-06)

The Asia Pacific region led with 520K USD in revenue, representing a 23% increase over Q3. North America and Europe maintained steady performance with 450K and 380K respectively.

== Quarterly Trends

Year-over-year quarterly comparison demonstrates consistent growth trajectory:

#v(sp-06)

#column-chart(
  (125, 180, 165, 210),
  labels: ("Q1", "Q2", "Q3", "Q4"),
  height: 160pt,
  show-values: true
)

#v(sp-06)

Q4 achieved record revenue of 210K USD, marking a 68% increase from Q1 baseline.

#pagebreak()

= Key Performance Indicators

== Executive Summary Metrics

#grid(
  columns: 2,
  column-gutter: sp-06,
  row-gutter: sp-06,

  metric-card(
    "24,567",
    "Active Users",
    change: "+12.5%",
    trend: "up",
    color: blue-60
  ),

  metric-card(
    "99.97%",
    "System Uptime",
    change: "Stable",
    trend: "neutral",
    color: green-60
  ),

  metric-card(
    "2.4M",
    "Revenue (USD)",
    change: "+8.2%",
    trend: "up",
    color: purple-60
  ),

  metric-card(
    "1,247",
    "Tickets Resolved",
    change: "-3.1%",
    trend: "down",
    color: cyan-50
  )
)

== Project Progress

#v(sp-06)

#progress-bar(
  75,
  max-value: 100,
  label: "Project Alpha - Q1 Deliverables",
  color: blue-60,
  height: 20pt
)

#v(sp-04)

#progress-bar(
  62,
  max-value: 100,
  label: "Server Capacity Utilization",
  color: green-60,
  height: 20pt
)

#v(sp-04)

#progress-bar(
  88,
  max-value: 100,
  label: "Annual Budget Allocation",
  color: purple-60,
  height: 20pt
)

#v(sp-06)

All projects remain on track with expected completion within target timelines.

#pagebreak()

= Regional Performance Details

== Revenue by Region and Quarter

#v(sp-05)

#data-table(
  ("Region", "Q1", "Q2", "Q3", "Q4", "Total"),
  (
    ("North America", "125", "142", "158", "175", "600"),
    ("Europe", "98", "115", "122", "138", "473"),
    ("Asia Pacific", "145", "168", "182", "205", "700"),
    ("Latin America", "62", "75", "81", "89", "307"),
    ("Middle East", "45", "52", "58", "65", "220")
  )
)

#v(sp-05)

All values in thousands USD. Asia Pacific leads total annual revenue with 700K USD.

== Product Line Performance

#v(sp-06)

#column-chart(
  (285, 420, 315, 180, 240),
  labels: ("Enterprise", "Professional", "Standard", "Starter", "Education"),
  height: 180pt,
  show-values: true
)

#v(sp-06)

Enterprise and Professional tiers drive the majority of revenue, accounting for 65% of total sales.

#pagebreak()

= Customer Satisfaction Trends

== Weekly NPS Score

#v(sp-05)

Net Promoter Score tracking shows positive momentum throughout December:

#grid(
  columns: (auto, 1fr),
  column-gutter: sp-04,
  row-gutter: sp-03,

  text(size: 11pt, weight: 600)[Week 1:],
  sparkline((62, 64, 63, 65, 67, 68, 70), width: 120pt, height: 24pt, color: blue-60),

  text(size: 11pt, weight: 600)[Week 2:],
  sparkline((68, 69, 71, 70, 72, 73, 74), width: 120pt, height: 24pt, color: blue-60),

  text(size: 11pt, weight: 600)[Week 3:],
  sparkline((73, 75, 74, 76, 77, 78, 79), width: 120pt, height: 24pt, color: blue-60),

  text(size: 11pt, weight: 600)[Week 4:],
  sparkline((78, 79, 80, 81, 82, 81, 83), width: 120pt, height: 24pt, color: blue-60)
)

#v(sp-05)

NPS improved from 62 to 83 over the month, representing a 34% increase in customer satisfaction.

== Support Response Times

#v(sp-06)

#bar-chart(
  (15, 12, 8, 22, 18),
  labels: ("Email", "Chat", "Phone", "Self-Service", "Social"),
  show-values: true,
  height: 140pt
)

#v(sp-05)

Average response times in minutes. Phone support achieves fastest resolution with 8-minute average.

#pagebreak()

= Chart Legend Reference

The following color palette is used consistently across all visualizations:

#v(sp-06)

#chart-legend(
  ("Revenue", "Expenses", "Profit", "Forecast", "Target", "Actual", "Variance", "Budget"),
  columns: 2
)

#v(sp-08)

== Color Accessibility

All chart colors meet WCAG AA contrast standards and are tested for colorblind accessibility. Sequential data uses brightness variation to ensure clarity in grayscale printing.

== Data Sources

- Revenue data: Financial Systems (Updated daily)
- User metrics: Analytics Platform (Real-time)
- NPS scores: Customer Feedback System (Weekly aggregation)
- Support metrics: Ticketing System (Hourly updates)

---

#align(center)[
  #text(size: 10pt, fill: gray-70)[
    _Generated with IBM Carbon Design System Data Visualization_
  ]
]
