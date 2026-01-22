# Component AST Standardi

Bu dokuman ComponentNode standardini ve renderer mapping sozlugunu tanimlar.
Amaç, Markdown directive'lerden ve AI layout planindan gelen bloklari ortak bir orta-formata baglamaktir.

## ComponentNode (tekil)
Zorunlu alanlar:
- `id`: benzersiz kimlik
- `type`: component tipi (RichText, HighlightBox, DataTable, CarbonChart...)
- `props`: component props

Opsiyonel:
- `layoutProps`: grid yerlesimi (colSpan/offset)
- `styleOverrides`: tema/renk limitli override
- `sourceMap`: md line/column
- `printOnly` / `screenOnly`: gorunum kontrolu
- `className`: ek CSS class

## JSON Schema
- `docs/schemas/component-node.schema.json`

## Directive -> Component Mapping
Directive DSL icin mapping dosyasi:
- `src/utils/directive-mapper.js`

Ornek mapping:
- `callout` -> `HighlightBox`
- `data-table` -> `DataTable`
- `chart` -> `CarbonChart`
- `code-group` -> `CodeGroup`
- `figure` -> `Figure`
- `quote` -> `Quote`
- `timeline` -> `Timeline`
- `accordion` -> `Accordion`
- `marginnote` -> `MarginNote`
- `pattern` -> `PatternBlock`

## Renderer Mapping Sozlugu
- `src/utils/component-registry.js` icindeki `COMPONENT_REGISTRY`
- Her component icin `tag` + `className` + `printOnly/screenOnly` defaultlari

## SourceMap ve QA
- Directive/heading node'lari `data-source-line` ve `data-source-column` ile HTML'e tasinir.
- QA harness `data-qa-id` ile birlikte bu alanlari yayar.

## Ornek ComponentNode
```json
{
  "id": "callout-key-insight",
  "type": "HighlightBox",
  "props": {
    "tone": "info",
    "title": "Key Insight",
    "content": "Gelir %18 artti."
  },
  "sourceMap": { "line": 12, "column": 1 },
  "layoutProps": { "colSpan": 16, "offset": 0 }
}
```
