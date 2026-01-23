# PROJE TALIMATLARI (Source of Truth)

Bu doküman Carbonac için AI agentlara yönelik ana talimatnamedir ve tek SoT kaynağıdır.
Tüm kararlar, planlar ve tasarım standartları bu dokümanla uyumlu olmak zorundadır.

## Icerik Dizini
- [Yetki ve Öncelik Sırası](#yetki-ve-öncelik-sırası)
- [Proje Özeti](#proje-özeti)
- [Mimari Kararlar (SoT)](#mimari-kararlar-sot)
- [Doküman Haritası ve Sorumluluklar](#doküman-haritası-ve-sorumluluklar)
- [Dokümantasyon Kuralları](#dokümantasyon-kuralları)
- [Tasarım Sistemi ve Web UI/UX Standartları](#tasarım-sistemi-ve-web-uiux-standartları-source-of-truth)
- [Kalite ve DoD (Minimum)](#kalite-ve-dod-minimum)
- [Referanslar](#referanslar)

## Yetki ve Öncelik Sırası
- Çakışma durumunda öncelik: `docs/PROJE-TALIMATLARI.md` > `docs/SPRINT-0-DELIVERABLES.md` > `docs/IS-PLANI.md` > faz/sprint dokümanları > diğer notlar.
- Tasarım ve UI/UX kararları bu dokümandaki "Tasarım Sistemi ve Web UI/UX Standartları" bölümünde tanımlıdır.

## Proje Özeti
Carbonac, IBM Carbon Design System tabanli React arayuzu ve Paged.js baski motoru ile
markdown/PDF ureten, Gemini 3 Pro (preview) + 2.5 Pro fallback destekli akilli raporlama platformudur.
Ana bilesenler: API, worker, queue, frontend UI, template sistemi, storage, Paged.js baski katmani
ve AI art director modulu.

## Mimari Kararlar (SoT)
- Deploy modeli: Docker tabanli Express API + Worker servisleri.
- Queue: Redis + BullMQ.
- Auth: Supabase JWT (Authorization: Bearer).
- Rendering motoru: React + Carbon Components (tek kaynak gorunum).
- Baski/PDF motoru: Paged.js (print CSS + sayfalandirma).
- Storage: Supabase buckets, standard path.
- Preview: Paged.js render (HTML -> paged) + PDF download akisi.
- AI provider: Gemini 3 Pro (preview) + 2.5 Pro fallback (server-side proxy).
- API base URL: `VITE_API_URL`.
- Error format: unified error payload (code, message, details, request_id).
- Logging: request_id + job_id zorunlu.
- Print token pack + pattern library: PDF icin zorunlu tasarim standardi.
- PDF kalite zinciri: statik PDF lint + Gemini QA (self-healing).
- CarbonPress uyumu: Press Pack (template + tokens + patterns + QA rules + sample content) ve preflight gate zorunlu.
- Release publish: preflight pass zorunlu; opsiyonel kalite checklist enforcement `PUBLISH_REQUIRE_QUALITY_CHECKLIST=true`.

## Doküman Haritası ve Sorumluluklar
- `docs/PROJE-MIMARISI.md`: Konsolide mimari, tamamlanan isler ve kalan backlog.
- `docs/SPRINT-0-DELIVERABLES.md`: Sprint 0 kararları, API contract ve job state kaydı.
- `docs/IS-PLANI.md`: Fazlar, sprint planı ve kabul kriterleri.
- `docs/archive/FAZ-0-SPRINT-0.md`: Sprint 0 görevleri ve detaylı checklist (arsiv).
- `docs/archive/FAZ-1-SPRINT-1.md`: Sprint 1 teknik kapsam ve backlog (arsiv).
- `docs/RASPBERRY-DOCKER.md`: Raspberry/remote runtime runbook.
- `docs/archive/YOL-HARITASI-REFERANS.md`: Uzun vadeli referans yol haritası (arsiv, baglayici degildir).

## Dokümantasyon Kuralları
- Karar değişirse: önce bu dokümanı güncelle, sonra ilgili karar dokümanını (Sprint 0) güncelle.
- Plan değişirse: `docs/IS-PLANI.md` ve ilgili faz/sprint dokümanlarını güncelle.
- Operasyon/runtime değişirse: `docs/RASPBERRY-DOCKER.md` güncellenir.
- Tasarım değişirse: bu dokümandaki tasarım standartları güncellenir.

## Tasarım Sistemi ve Web UI/UX Standartları (Source of Truth)
Bu bölüm Carbonac için tek gerçek kaynaktır. PDF ve web arayüzüne dair tüm tasarım kararları burada tanımlanır ve bu kurallarla çelişen başka dokümanlar geçersiz kabul edilir.

### Kapsam ve Tasarım İlkeleri
- IBM Carbon Design System v11 temel alınır.
- PDF çıktıları ve web arayüzü aynı tipografi, grid ve renk dili ile uyumlu tutulur.
- Carbon ilkeleri: Purposeful (amaçlı), Responsive (duyarlı), Natural (doğal), Accessible (erişilebilir).

### PDF vs Web (Özet)
| Özellik | PDF | Web |
| --- | --- | --- |
| Layout | Sabit sayfa | Responsive, fluid |
| Tipografi | Gömülü font | Web font loading |
| Renk | CMYK/RGB sabit | CSS custom properties |
| Etkileşim | Yok | Hover, focus, active, drag |
| Animasyon | Yok | Motion tokenları |
| Erişilebilirlik | Okuyucu | Klavye, ARIA, focus |
| Tema | Tek tema | Dinamik tema değiştirme |

### PDF Print Guardrails (SoT)
- Print token pack: tipografi/spacing/renk icin `tokens/print.json` standart seti.
- Baseline grid + safe area: line-height ve metin genisligi guardrail'leri ile sabit ritim.
- Running header/footer: string-set + margin box ile bolum ve sayfa numarasi.
- Mini-TOC footer: istege bagli persistent bolum navigasyonu.
- Data-viz sayfa standardi: caption + source + sample size + key insight.
- PDF erisilebilirlik preflight: heading hiyerarsisi, okuma sirasi, bookmark, link ve kontrast kontrolu.
- Output manifest: PDF metadata icinde template/version/tokens hash ve preflight sonucu tutulur.

### Tipografi
**IBM Plex aileleri:** Sans (body), Serif (başlık), Mono (kod), Sans Condensed (dar alanlar).

**Ağırlıklar:** 100, 200, 300, 400, 450, 500, 600, 700 (roman + true italic). 100+ dil desteği ve IBM Plex Math kapsar.

**Productive type scale (özet):**
display-04 112px, display-03 84px, display-02 60px, display-01 54px, heading-07 48px, heading-06 42px, heading-05 32px, heading-04 28px, heading-03 20px, heading-02 16px, heading-01 14px, body-long-02 16px, body-long-01 14px, body-short-02 16px, body-short-01 14px, body-compact-02 16px, body-compact-01 14px, code-02 14px, code-01 12px, label-01 12px, label-02 14px, helper-text-01 12px, helper-text-02 14px, legal-01 12px, legal-02 14px.

**Expressive type set:** web/grafik işler için daha dramatik hiyerarşi.

**Line heights:** tight 1.125, default 1.5, loose 1.75.  
**Letter spacing:** 0.16px (küçük metin), 0px (body), -0.64px (büyük başlıklar).

```scss
@use '@carbon/type';

.heading { @include type.type-style('heading-05'); }
.body { @include type.type-style('body-long-02'); }
```

### Renk Sistemi ve Temalar
**Primary interactive:** blue-60 (#0f62fe).  
**Primary text:** gray-100 (#161616).

**Ana paletler:** blue, gray, cool gray, warm gray, red, green, yellow, orange, purple, cyan, teal, magenta.

**Blue:**
- blue-10 #edf5ff, blue-20 #d0e2ff, blue-30 #a6c8ff, blue-40 #78a9ff, blue-50 #4589ff
- blue-60 #0f62fe, blue-70 #0043ce, blue-80 #002d9c, blue-90 #001d6c, blue-100 #001141

**Gray (neutral):**
- white #ffffff, gray-10 #f4f4f4, gray-20 #e0e0e0, gray-30 #c6c6c6, gray-40 #a8a8a8
- gray-50 #8d8d8d, gray-60 #6f6f6f, gray-70 #525252, gray-80 #393939, gray-90 #262626, gray-100 #161616, black #000000

**Cool gray:** #f2f4f8, #dde1e6, #c1c7cd, #a2a9b0, #878d96, #697077, #4d5358, #343a3f, #21272a, #121619  
**Warm gray:** #f7f3f2, #e5e0df, #cac5c4, #ada8a8, #8f8b8b, #726e6e, #565151, #3c3838, #272525, #171414  
**Red:** #fff1f1, #ffd7d9, #ffb3b8, #ff8389, #fa4d56, #da1e28, #a2191f, #750e13, #520408, #2d0709  
**Green:** #defbe6, #a7f0ba, #6fdc8c, #42be65, #24a148, #198038, #0e6027, #044317, #022d0d, #071908  
**Yellow:** #fcf4d6, #fddc69, #f1c21b, #d2a106, #b28600, #8e6a00, #684e00, #483700, #302400, #1c1500  
**Orange:** #fff2e8, #ffd9be, #ffb784, #ff832b, #eb6200, #ba4e00, #8a3800, #5e2900, #3e1a00, #231000  
**Purple:** #f6f2ff, #e8daff, #d4bbff, #be95ff, #a56eff, #8a3ffc, #6929c4, #491d8b, #31135e, #1c0f30  
**Cyan:** #e5f6ff, #bae6ff, #82cfff, #33b1ff, #1192e8, #0072c3, #00539a, #003a6d, #012749, #061727  
**Teal:** #d9fbfb, #9ef0f0, #3ddbd9, #08bdba, #009d9a, #007d79, #005d5d, #004144, #022b30, #081a1c  
**Magenta:** #fff0f7, #ffd6e8, #ffafd2, #ff7eb6, #ee5396, #d02670, #9f1853, #740937, #510224, #2a0a18

**Tema modları:** White (G0), G10, G90, G100.

### Design Tokens ve Kullanım
**Token kuralı:** `$[category]-[property]-[variant]-[state]`.

**Token grupları (özet):**
```
Background: $background, $background-active, $background-hover, $background-selected, $background-selected-hover,
            $background-inverse, $background-inverse-hover, $background-brand
Layer: $layer-01..03, $layer-active-01..03, $layer-hover-01..03, $layer-selected-01..03,
       $layer-accent-01..03, $layer-accent-active-01..03, $layer-accent-hover-01..03
Field: $field-01..03, $field-hover-01..03
Border: $border-subtle-00..03, $border-subtle-selected-01..03, $border-strong-01..03,
        $border-tile-01..03, $border-inverse, $border-interactive, $border-disabled
Text: $text-primary, $text-secondary, $text-placeholder, $text-helper, $text-error,
      $text-inverse, $text-on-color, $text-on-color-disabled, $text-disabled
Link: $link-primary, $link-primary-hover, $link-secondary, $link-visited,
      $link-inverse, $link-inverse-active, $link-inverse-hover
Icon: $icon-primary, $icon-secondary, $icon-on-color, $icon-on-color-disabled, $icon-interactive, $icon-inverse, $icon-disabled
Support: $support-error, $support-success, $support-warning, $support-info,
         $support-error-inverse, $support-success-inverse, $support-warning-inverse, $support-info-inverse,
         $support-caution-major, $support-caution-minor, $support-caution-undefined
```

**Data visualization paleti (categorical 14):**
1. purple-70 #6929c4
2. cyan-50 #1192e8
3. teal-70 #005d5d
4. magenta-70 #9f1853
5. red-50 #fa4d56
6. red-90 #520408
7. green-60 #198038
8. blue-80 #002d9c
9. magenta-50 #ee5396
10. purple-50 #a56eff
11. teal-50 #009d9a
12. cyan-90 #012749
13. blue-50 #4589ff
14. green-30 #6fdc8c

**Alert palette:** $support-error #da1e28, $support-success #24a148, $support-warning #f1c21b, $support-info #0043ce.  
**Sequential palettes:** monochromatic ve diverging varyantlar.

### 2x Grid, Layout ve Breakpoint'ler
- 8px mini unit, 16 sütunlu responsive grid.
- Breakpoints: sm 320 (4 col), md 672 (8 col), lg 1056 (16 col), xlg 1312 (16 col), max 1584 (16 col).
- Gutter modları: wide 32px, narrow 16px, condensed 1px.
- Margin: sm/md/lg/xlg 16px, max 24px.
- Aspect ratios: 16x9, 9x16, 2x1, 1x2, 4x3, 3x4, 1x1, 3x2, 2x3.

### Spacing ve Sizing
Base unit 8px. Spacing tokenları:
```
$spacing-01 2px, $spacing-02 4px, $spacing-03 8px, $spacing-04 12px,
$spacing-05 16px, $spacing-06 24px, $spacing-07 32px, $spacing-08 40px,
$spacing-09 48px, $spacing-10 64px, $spacing-11 80px, $spacing-12 96px, $spacing-13 160px
```
Container tokenları: $container-01 24px, $container-02 32px, $container-03 40px, $container-04 48px, $container-05 64px.  
Icon size tokenları: $icon-size-01 16px, $icon-size-02 20px.

### Icon ve Pictogramlar
**Icon boyutları:** 16/20/24/32px.  
**Stiller:** outlined (default), filled (selected/active).  
**Kategoriler:** action, status, navigation, object, social, file type, device, communication.

**Pictogram boyutları:** 32/48/64/80px.  
**Renk temaları:** dark, light, monochromatic dark, monochromatic light.  
**Kullanım:** hero, empty states, onboarding, error pages.

### Veri Görselleştirme (Carbon Charts)
**Chart türleri (özet):** bar (simple/grouped/stacked), lollipop, bullet, line, area, combo, pie/donut, meter/gauge,
scatter, heat map, choropleth, proportional symbol, sankey/alluvial, network, tree, treemap, circle pack, sunburst,
radar, parallel coordinates, box plot, timeline, Gantt.

**Chart anatomy:** title, subtitle, legend, axes, grid lines, data markers, labels, zero baseline, threshold lines, annotations.

**Erişilebilirlik:** color + pattern kombinasyonu, WCAG AA kontrast, tablo fallback, grafik alt metni.

### Bileşenler (Özet Kategoriler)
- Form: input, textarea, password, number, search, date/time, checkbox, radio, toggle, dropdown, multiselect, combo box, slider, file upload, button varyantları.
- Navigation: header, side nav, tabs, content switcher, breadcrumb, pagination, menu, context menu.
- Content: tile, card, accordion, modal, side panel, popover, data table, structured list, tree view.
- Feedback: inline/toast/actionable notification, tooltip/toggletip, modal türleri.
- Layout/Media: grid, stack, flex, layer, theme, image, aspect ratio, icon, pictogram.

### Patternler ve Sayfa Şablonları
- Form: tek kolon, zorunlu alan göstergesi, inline validation, error summary.
- Empty state: pictogram + açıklayıcı metin + primary action.
- Error handling: inline error + page notification + retry.
- Search & filtering: typeahead, filter panel, active filter tags.
- Data table: sorting, selection, pagination, row expansion, batch actions.
- Wizard: progress indicator, adım validasyonu, kaydetme.
- Şablonlar: dashboard, list/browse, detail/profile, create/edit, settings.

### Motion, Easing ve Micro-interactions
**Productive motion:** 70-240ms, minimal, görev odaklı.  
**Expressive motion:** 240-700ms, belirgin, kritik anlar.

**Duration tokenları:**
- $duration-fast-01 70ms
- $duration-fast-02 110ms
- $duration-moderate-01 150ms
- $duration-moderate-02 240ms
- $duration-slow-01 400ms
- $duration-slow-02 700ms

**Easing eğrileri (cubic-bezier):**
- productive-standard: (0.2, 0, 0.38, 0.9)
- productive-entrance: (0, 0, 0.38, 0.9)
- productive-exit: (0.2, 0, 1, 0.9)
- expressive-standard: (0.4, 0.14, 0.3, 1)
- expressive-entrance: (0, 0, 0.3, 1)
- expressive-exit: (0.4, 0.14, 1, 1)

**Choreography:** stagger 20-40ms, toplam animasyon süresi <= 500ms.  
**Reduced motion:** `prefers-reduced-motion: reduce` desteklenir.

```scss
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### Interactive States
Default, hover, active, focus, disabled, selected, loading.

**Öncelik sırası:** disabled > loading > active > hover > focus > default.  
**Focus ring:** 2px, yüksek kontrast, yalnızca klavye ile görünür.

### Responsive Design
- Mobile-first yaklaşımı; 2x grid ve breakpoint kuralları zorunlu.
- Patternler: stack-to-horizontal, sidebar collapse, card reflow, navigation dönüşümü.
- Touch target min 44px.
```css
font-size: clamp(0.875rem, 0.6vw + 0.75rem, 1rem);
```

### Web Erişilebilirlik (WCAG 2.1 AA)
- Metin kontrastı 4.5:1, UI elemanları 3:1.
- Klavye navigasyonu, focus trap, skip link.
- ARIA rolleri ve durumları doğru kullanılır.

### Theming
4 tema modu (White/G10/G90/G100) CSS custom properties ile uygulanır.
```scss
:root { --cds-background: #ffffff; --cds-text-primary: #161616; --cds-interactive: #0f62fe; }
[data-carbon-theme="g100"] { --cds-background: #161616; --cds-text-primary: #f4f4f4; --cds-interactive: #4589ff; }
```

### Performans Hedefleri (Web)
- LCP < 2.5s, INP < 200ms, CLS < 0.1, TTI < 3.8s.
- Total bundle < 250KB (gzip).
- Lazy loading, code splitting, cache, CDN, RUM takibi.

### PDF Export Kuralları
- Paged.js kullanilir; cikti print CSS ile uretilir.
- A4 varsayilan, margin 20mm, bleed 3mm, crop/cross marks aktif.
- Sag/sol sayfa ayrimi (cilt payi) ve header/footer string setleri zorunludur.
- Interaktif UI ogeleri print'te gizlenir; link URL'leri yazdirilir.
- Sayfa kirilmalari akilli kurallarla yonetilir (avoid-break, force-break).
- CMYK guvenli renkler: blue-80, gray-100, red-70, green-70.
- Font embedding zorunlu, print body 10pt, heading 14pt.

### Kaynaklar
- Carbon Design System: https://carbondesignsystem.com/
- Carbon Components: https://carbondesignsystem.com/components/overview/
- Carbon Charts: https://charts.carbondesignsystem.com/
- Carbon Icons: https://carbondesignsystem.com/elements/icons/library/
- Carbon Pictograms: https://carbondesignsystem.com/elements/pictograms/library/

### Versiyonlama
- Carbon v11 baz alınır.
- Bu bölüm güncellendiğinde yalnızca burada revize edilir.

## Kalite ve DoD (Minimum)
- Feature en az bir manuel senaryo ile test edilebilir olmalı.
- Hata/exception yollarında net mesaj ve log kaydı olmalı.
- Dokümantasyon güncellenmiş olmalı.
- PDF lint checklist'i (overflow, widows/orphans, min font) calistirilmis olmali.
- PDF erisilebilirlik checklist'i (heading/order/bookmark/link) kontrol edilmeli.

## Guncel Durum Profili (Snapshot)
- Core pipeline, Paged.js ve Gemini art director akisi dogrulandi.
- Template registry + press pack + release/publish API kodda tamam; Supabase migrations 004/005 uygulandi.
- Preflight gate ve governance UI aktif; rollback policy enforce edildi.
- Preview/QA ve lint altyapisi calisiyor; editor wizard ve autosave tamamlandi.
- EK-GELISTIRME kalite checklist'i preflight sonucuna baglandi.
- Metrics dashboard + alert esikleri ve CI DoD enforcement aktif.

## Sonraki Adimlar (Odak)
- Opsiyonel: alert esiklerini ortam KPI'larina gore kalibre et.

## Referanslar
- Ayrıntılı, uzun vadeli teknik yol haritası (arsiv): `docs/archive/YOL-HARITASI-REFERANS.md`.
