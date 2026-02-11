# Carbonac PDF Tasarim Yonerghesi (Paged.js)

Bu dokuman, Carbonac icin referans PDF uretim standartlarini tanimlar. Hedef: tekil tasarim dili, tutarli tipografi, baski uyumlu renk/pattern kurallari ve kalite guvencesi.

## 1) Kapsam ve Oncelik
- Bu yonerge Paged.js tabanli PDF uretiminde gecerlidir.
- SoT dokumani: `docs/PROJE-TALIMATLARI.md`.
- Tasarim standardi once referans kutuphanesi ve pattern katalogu ile uyumlu olmalidir.

## 2) Layout ve Grid
- Varsayilan grid: 16 kolon (symmetric layout).
- Profil secimleri: `symmetric`, `asymmetric`, `dashboard`.
- Grid kararlarini AI LayoutPlan belirler; el degisiklikleri sadece istisna olarak yapilir.
- Sayfa kirilimlari: `avoid-break` ve `force-break` selectorlari ile kontrol edilir.

## 3) Tipografi
- Font ailesi: IBM Plex Sans / Serif / Mono.
- Baslik hiyerarsisi: H1/H2/H3 ve body metinlerde tutarli boyut/line-height.
- Hyphenation: `auto`, istisnalar `PRINT_HYPHENATION_EXCEPTIONS` ile tanimlanir.
- Microtypography: smartypants acik (varsayilan).

## 4) Renk + Baskiya Uygunluk
- Temalar: `white`, `g10`, `g90`, `g100`.
- Baski icin gri tonlari + pattern paleti onceliklidir.
- Renk kritik durumlarda CMYK safe palet kullan.
- Koyu arkaplanli bloklar sadece highlight/spot vurgu icin.

## 5) Grafik ve Tablo Kurallari
- `docs/CHART-TABLE-STANDARDS.md` ile uyum zorunlu.
- Her grafik icin caption + source alanlari gerekir.
- Pattern / grayscale fallback mutlaka uretilecek (print uyumu).
- Table split kurali: minRows + minRowsPerPage; bolunemeyen tablolar icin force-break.

## 6) Pattern Kullanimi (Directive)
- Pattern bloklari `:::pattern{type="<pattern-id>" ...}` ile cagrilir.
- Pattern ID listesi: `patterns/registry.json`.
- Pattern tipleri PDF metadata keywords icine `pattern:<id>` olarak yazilir.

## 7) Metadata ve PDF Kimligi
- PDF metadata: title, author, subject, keywords.
- Build bilgileri: `build-sha`, `build-version`, `build-date` keywords.
- Pattern tags: `pattern:<id>` keywords.
- `pdfa-ready` keywordu PDF-A uyumunu isaret eder.

## 8) QA ve Dogrulama
- QA harness: typography, a11y, visual regression.
- Preflight gate: schema + QA + lint.
- Baseline guncellemeleri sadece onayli PR ile.

## 9) Referans Kutuphane
- Referans PDF listesi: `library/manifest.json`.
- Her entry: kaynak URL + metadata + lisans + local file path.
- Onayli referanslar disinda yeni PDF eklenmez.

## 10) Onay Akisi
- Tasarim degisikligi -> PR -> QA raporu -> reviewer onayi.
- Template governance kurallari `docs/PROJE-TALIMATLARI.md` ile uyumludur.
