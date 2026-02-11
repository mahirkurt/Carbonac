# Directive DSL (Markdown Extensions)

> Amac: Markdown icinde deterministik component yerlesimi saglamak.
> Bu dokuman, `remark-directive` tabanli syntax ve component mapping kurallarini tanimlar.

## Genel Syntax
Block directive:
```
:::callout{tone="info" title="Key Insight"}
Buraya icerik gelir.
:::
```

Leaf directive:
```
:marginnote[Not metni]{align="right"}
```

## Desteklenen Directive'ler

### 1) callout
- **Amac:** Vurgu kutusu, executive insight.
- **Attributes:**
  - `tone`: info | warning | success | danger
  - `title`: string
  - `icon`: string (opsiyonel)
- **Component Mapping:** `HighlightBox`

### 2) data-table
- **Amac:** Tablo verisi icin print-friendly tablo.
- **Attributes:**
  - `caption`: string
  - `source`: string
  - `methodology`: string (opsiyonel)
  - `notes`: string (opsiyonel)
  - `columns`: string (comma separated)
- **Component Mapping:** `DataTable`

### 3) chart
- **Amac:** Veri gorsellestirme.
- **Attributes:**
  - `type`: bar | line | area | donut | stacked
  - `variant`: default | survey
  - `caption`: string
  - `question`: string (SurveyChartPage icin soru etiketi)
  - `highlight`: string (SurveyChartPage icin buyuk metrik)
  - `source`: string
  - `sampleSize`: string
  - `methodology`: string (opsiyonel)
  - `notes`: string (opsiyonel)
- **Component Mapping:** `CarbonChart`

### 4) code-group
- **Amac:** Kod bloklari grubu.
- **Attributes:**
  - `title`: string
  - `language`: string
  - `filename`: string
- **Component Mapping:** `CodeGroup`

### 5) figure
- **Amac:** Gorsel + caption + source.
- **Attributes:**
  - `src`: string
  - `caption`: string
  - `source`: string
  - `width`: string (percent or px)
- **Component Mapping:** `Figure`

### 6) quote
- **Amac:** Alinti + attribution.
- **Attributes:**
  - `author`: string
  - `title`: string
  - `source`: string
- **Component Mapping:** `Quote`

### 7) timeline
- **Amac:** Zaman akisi.
- **Attributes:**
  - `layout`: horizontal | vertical
  - `start`: string
  - `end`: string
- **Component Mapping:** `Timeline`

### 8) accordion
- **Amac:** Katlanabilir bolumler.
- **Attributes:**
  - `variant`: default | compact
- **Component Mapping:** `Accordion`

### 9) marginnote
- **Amac:** Kenar notu.
- **Attributes:**
  - `align`: left | right
- **Component Mapping:** `MarginNote`

### 10) pattern
- **Amac:** Pattern library modullerini isaretlemek.
- **Attributes:**
  - `type`: pattern anahtari (kebab-case)
  - `title`: string (opsiyonel)
  - `subtitle`: string (opsiyonel)
  - `eyebrow`: string (opsiyonel)
  - `variant`: string (opsiyonel)
  - `layout`: string (opsiyonel)
  - `tone`: info | warning | success | danger | neutral
- **Component Mapping:** `PatternBlock`

Ornek:
```
:::pattern{type="executive-summary" title="Executive Summary"}
Kisa ozet ve insight listesi burada.
:::
```

## Mapping Kurallari
- Directive -> Component AST mapping sozlugu zorunlu.
- Her directive icin allowlist props uygulanir.
- Print-friendly defaults (no hover, no close button) zorunlu.

## Kaynak Schema
- JSON schema: `docs/schemas/directive-dsl.schema.json`
