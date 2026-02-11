# Pattern Extraction Notes

Bu dokuman, directive tabanli pattern bloklarinin nasil kullanilacagini ve PDF metadata tag uretimini ozetler.

## Pattern Kaynagi
- Registry: `patterns/registry.json`
- Schema: `patterns/schemas/*.schema.json`
- Directive: `:::pattern{type="<pattern-id>" ...}`

## Pattern -> Metadata Tag Kurali
- Her pattern directive icin `pattern:<id>` keywordu eklenir.
- Ornek: `type="cover-page-hero"` -> `pattern:cover-page-hero`

## Ornek Kullanım
```
:::pattern{type="executive-summary" title="Executive Summary"}
Kisa ozet metni.
:::
```

## Registry Ozet
- cover-page-hero
- executive-summary
- key-findings-list
- action-box
- hero-stat-with-quote
- chapter-opener
- case-study-module
- survey-chart-page
- persistent-section-nav-footer
- figure-with-caption
- appendix-page

## Uygulama Notlari
- Pattern ID'leri ASCII + kebab-case olmalidir.
- Pattern bloklari, layoutPlan icinde RichText/HighlightBox ile birlikte kullanilabilir.
- Pattern kullanimi QA raporunda dogrudan bir hata olusturmaz, fakat metadata taglari ile rapor takibi saglanir.
