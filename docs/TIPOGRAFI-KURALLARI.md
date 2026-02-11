# TIPOGRAFI KURALLARI (Print)

Bu dokuman Paged.js tabanli PDF ciktilarinda tipografik kaliteyi sabit tutmak icin uygulanacak kurallari ve opt-in ayarlari anlatir.

## 1) Font seti ve embedding

- Varsayilan aileler: IBM Plex Sans (govde), IBM Plex Serif (baslik), IBM Plex Mono (kod).
- Font embedding icin woff2 dosyalari `styles/print/fonts` altina konur.
- Sistem otomatik olarak dosya varsa embed eder, yoksa lokal font + fallback stack kullanir.

Desteklenen dosya adlari (en az regular set):
- `IBMPlexSans-Regular.woff2`
- `IBMPlexSans-Italic.woff2`
- `IBMPlexSerif-Regular.woff2`
- `IBMPlexSerif-Italic.woff2`
- `IBMPlexMono-Regular.woff2`

Not: `*.woff` formatlari da fallback olarak desteklenir.

## 2) OpenType ozellikleri

`styles/print/print-base.css` icinde asagidaki ozellikler aktif:
- `font-kerning: normal`
- `font-variant-ligatures: common-ligatures contextual`
- `font-feature-settings: "kern" 1, "liga" 1, "calt" 1`
- Tablo icin `font-variant-numeric: lining-nums tabular-nums`

## 3) Hyphenation (TR dahil)

- Varsayilan: `hyphens: auto` (tarayici destekledigi olcude).
- Dili `language` veya `locale` frontmatter alanindan alir.

Frontmatter:
```yaml
language: tr-TR
locale: tr-TR
```

Hyphenation kontrolu:
- `typography.hyphenation: auto | none`
- `PRINT_HYPHENATION=auto|none`

## 4) Hyphenation exception list (opt-in)

Belirli kelimeler icin soft-hyphen ekleme desteklenir.
`typography.hyphenationExceptions` alanina `&shy;` veya `\u00AD` ile isaretlenmis kelimeler eklenir.

Ornek:
```yaml
typography:
  hyphenationExceptions:
    - "ana&shy;htar"
    - word: "veribilimi"
      hyphenated: "veri&shy;bilimi"
```

## 5) Hyphenation polyfill/engine hook (opt-in)

Istege bagli JS tabanli hyphenation motoru icin `typography.hyphenationScript` verilebilir.
Bu deger proje kokune gore bir dosya yolu olarak okunur ve HTML icine inline edilir.

```yaml
typography:
  hyphenationScript: styles/print/hyphenopoly.min.js
```

## 6) Microtypography (smart quotes/dashes/ellipses)

`remark-smartypants` opt-in olarak kullanilir:

```yaml
typography:
  smartypants: true
```

Dil/kurum standardi icin opsiyonlar verilebilir:

```yaml
typography:
  smartypants:
    openingQuotes: { double: "«", single: "‹" }
    closingQuotes: { double: "»", single: "›" }
    dashes: oldschool
    ellipses: spaced
```

Global acma:
- `PRINT_TYPOGRAPHY_SMARTYPANTS=true`

## 7) Dogrulama ve raporlama

- QA raporuna `fonts` bolumu eklenir (IBM Plex Sans/Serif/Mono yuklendi mi?).
- Output manifest icinde `qa.report.fonts` ile gorulur.

## 8) Tam ornek frontmatter

```yaml
---
title: "Q3 Rapor"
language: tr-TR
typography:
  smartypants: true
  hyphenation: auto
  hyphenationExceptions:
    - "ana&shy;htar"
  hyphenationScript: styles/print/hyphenopoly.min.js
---
```
