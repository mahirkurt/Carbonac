---
title: Carbon Data Visualization
subtitle: Charts, Graphs, and Visual Analytics
author: IBM Carbon Design System
date: January 2026
---

# Data Visualization Overview

The IBM Carbon Design System provides a comprehensive set of data visualization tools designed for clarity, accessibility, and impact. This showcase demonstrates various chart types and visualization patterns using Carbon's color palettes and design principles.

## Color Palettes for Charts

Carbon offers specialized color palettes optimized for data visualization:

### Categorical Palette (14 Colors)

Perfect for charts with multiple distinct categories:

1. Purple-70 - Primary series
2. Cyan-50 - Secondary series
3. Teal-70 - Tertiary series
4. Magenta-70 - Quaternary series
5-14. Additional distinct colors for complex datasets

**Use when:** Comparing different categories, multiple data series, segmented data

### Sequential Palettes

For data with natural ordering (light to dark):

- **Blue Sequential**: Ideal for single-metric heatmaps
- **Monochrome**: For emphasis and simplicity

**Use when:** Heatmaps, choropleth maps, intensity scales

### Diverging Palettes

For data with a meaningful center point:

- **Red-to-Green**: Negative to positive values
- **Purple-to-Teal**: Cool to warm comparison

**Use when:** Variance from baseline, positive/negative indicators, comparative analysis

## Chart Types

### Bar Charts (Horizontal)

Horizontal bar charts are excellent for comparing values across categories, especially when category labels are long.

**Sample Data - Monthly Revenue by Region:**
- North America: 450
- Europe: 380
- Asia Pacific: 520
- Latin America: 285
- Middle East: 195

**Best practices:**
- Sort bars by value for easier comparison
- Use consistent spacing (8px minimum)
- Show values when space permits
- Limit to 10 bars maximum for readability

### Column Charts (Vertical)

Vertical column charts work well for time-series data and short category labels.

**Sample Data - Quarterly Growth:**
- Q1: 125
- Q2: 180
- Q3: 165
- Q4: 210

**Best practices:**
- Maintain consistent column width
- Use rounded top corners (2pt radius)
- Start Y-axis at zero
- Include grid lines for precision

## Data Tables

Enhanced data tables with visual encoding improve comprehension:

| Region | Q1 Revenue | Q2 Revenue | Q3 Revenue | Q4 Revenue | Total |
|--------|------------|------------|------------|------------|-------|
| North America | 125 | 142 | 158 | 175 | 600 |
| Europe | 98 | 115 | 122 | 138 | 473 |
| Asia Pacific | 145 | 168 | 182 | 205 | 700 |
| Latin America | 62 | 75 | 81 | 89 | 307 |

**Enhancement techniques:**
- Alternating row colors for scannability
- Right-align numbers, left-align text
- Bold headers with color backgrounds
- Highlight totals or key metrics
- Use color scales for heatmap effect

## Key Performance Indicators

### Metric Cards

Large, prominent displays for critical metrics:

**Current Active Users**: 24,567 (↑ 12.5% vs last month)

**Revenue This Quarter**: 2.4M USD (↑ 8.2% vs last quarter)

**System Uptime**: 99.97% (→ Stable)

**Support Tickets Resolved**: 1,247 (↓ 3.1% vs last week)

**Design elements:**
- Large numeral (32pt+)
- Descriptive label (small, secondary color)
- Trend indicator (arrow + percentage)
- Color coding (green=up, red=down, gray=neutral)

### Progress Indicators

Visual representation of completion or capacity:

**Project Alpha**: 75% complete (15 of 20 milestones)

**Server Capacity**: 62% utilized (248 GB of 400 GB)

**Budget Allocation**: 88% spent (880K of 1M USD)

**Design features:**
- Rounded progress bar (16pt height)
- Subtle background (gray-20)
- Vibrant fill color (blue-60)
- Accompanying text labels

## Small Multiples

Sparklines provide quick trend visualization in compact spaces:

**Weekly Traffic Trends:**
- Monday: 2.1K → 2.3K → 2.5K → 2.4K → 2.6K → 2.8K → 3.1K
- Tuesday: 2.4K → 2.2K → 2.3K → 2.6K → 2.7K → 2.9K → 3.0K
- Wednesday: 2.5K → 2.7K → 2.8K → 3.0K → 3.1K → 3.2K → 3.4K

**Characteristics:**
- Minimal size (80pt × 24pt typical)
- No axes or labels (context implied)
- Single color emphasis
- Clear trend visibility

## Chart Legends

Legends help users interpret multi-series charts:

**Chart Legend Items:**
- Revenue (Purple)
- Expenses (Cyan)
- Profit (Teal)
- Forecast (Magenta)

**Legend best practices:**
- Position near chart (top-right or bottom)
- Use same colors as chart series
- Keep labels concise
- Maintain logical order
- Consider inline labels for simple charts

## Accessibility

Data visualizations must be accessible to all users:

### Color Considerations

- **Contrast**: All colors meet WCAG AA standards
- **Colorblind-safe**: Tested with deuteranopia/protanopia simulators
- **Patterns**: Consider adding patterns for critical distinctions
- **Labels**: Always include text labels, not just color coding

### Alternative Formats

- **Data tables**: Provide tabular alternative for complex charts
- **Descriptions**: Include alt-text describing trends
- **Keyboard navigation**: Support tab-through for interactive charts
- **Screen readers**: Ensure SVG charts have proper ARIA labels

### Readability

- **Font size**: Minimum 10pt for labels, 12pt for values
- **Spacing**: Adequate spacing prevents crowding
- **Animation**: Minimize or disable for accessibility
- **Print**: Ensure charts are readable in grayscale

## Chart Selection Guide

### Comparing Categories

**Bar Chart**: 3-10 categories, discrete values
**Column Chart**: Time series, temporal comparisons
**Pie Chart**: Parts of whole (max 5 slices)

### Showing Trends

**Line Chart**: Continuous data over time
**Area Chart**: Cumulative trends, stacked series
**Sparkline**: Inline trends, minimal context

### Displaying Relationships

**Scatter Plot**: Correlation between two variables
**Bubble Chart**: Three-dimensional relationships
**Heatmap**: Matrix of values

### Presenting Hierarchies

**Treemap**: Nested proportions
**Sunburst**: Radial hierarchy
**Organizational Chart**: Structural relationships

## Best Practices Summary

### Design Principles

1. **Clarity**: Remove chartjunk, focus on data
2. **Consistency**: Use standard chart types
3. **Accuracy**: Start axes at zero, avoid distortion
4. **Context**: Provide titles, labels, and legends
5. **Simplicity**: One chart, one message

### Visual Hierarchy

1. **Primary data**: Strongest color, largest size
2. **Secondary data**: Supporting colors, normal size
3. **Reference lines**: Subtle, dashed or dotted
4. **Grid lines**: Light gray, minimal contrast
5. **Labels**: Small, secondary color text

### Color Usage

1. **Categorical**: Use distinct hues from palette
2. **Sequential**: Single hue, varying lightness
3. **Diverging**: Two hues meeting at neutral
4. **Emphasis**: Reserve saturated colors for highlights
5. **Backgrounds**: Use subtle grays or white

## Advanced Visualizations

### Dashboard Layouts

Combine multiple charts for comprehensive views:

- **Overview metrics**: KPI cards across top
- **Primary chart**: Large, prominent position
- **Supporting charts**: Smaller, contextual data
- **Data table**: Detailed values at bottom
- **Filters**: Sidebar or top bar controls

### Responsive Design

Adapt visualizations for different contexts:

- **Large displays**: Full detail, multiple series
- **Medium screens**: Simplified, key series only
- **Small screens**: Single metric, sparklines
- **Print**: Grayscale-friendly, full data table

### Interactive Features

Enhance charts with interactivity (web-based):

- **Tooltips**: Show exact values on hover
- **Zoom**: Explore dense data regions
- **Filter**: Toggle series on/off
- **Drill-down**: Navigate hierarchical data
- **Export**: Download as image or data

## Technical Implementation

### Typst Chart Functions

```typst
// Horizontal bar chart
#bar-chart(
  (450, 380, 520, 285, 195),
  labels: ("NA", "EU", "APAC", "LATAM", "ME"),
  show-values: true
)

// Vertical column chart
#column-chart(
  (125, 180, 165, 210),
  labels: ("Q1", "Q2", "Q3", "Q4"),
  height: 200pt
)

// Data table with styling
#data-table(
  ("Region", "Revenue", "Growth"),
  (
    ("North America", "600K USD", "12%"),
    ("Europe", "473K USD", "8%")
  )
)

// Metric card
#metric-card(
  "24,567",
  "Active Users",
  change: "+12.5%",
  trend: "up"
)

// Progress bar
#progress-bar(
  75,
  max-value: 100,
  label: "Project Completion"
)
```

### Color Palette Access

```typst
// Use categorical colors
#let colors = dataviz-categorical

// Sequential blue scale
#let scale = dataviz-seq-blue

// Diverging palette
#let diverge = dataviz-diverging-redgreen
```

## Resources

**Carbon Charts**: https://carbondesignsystem.com/data-visualization/chart-types
**Color Palettes**: https://carbondesignsystem.com/data-visualization/color-palettes
**Accessibility**: https://carbondesignsystem.com/data-visualization/accessibility

---

*This document showcases the IBM Carbon Design System data visualization capabilities with practical examples and implementation guidance.*
