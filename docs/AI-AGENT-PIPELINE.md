# Carbonac AI Agent Pipeline: Dokuman Isleme Algoritmasi

> Bu belge, Carbonac sistemine yuklenen bir dokumanin AI agent tarafindan hangi algoritma ile ele alindigini asama asama aciklar.
>
> Son guncelleme: 2026-02-21 — Directive bosluk fix, fallback insight/layout/summary iyilestirmeleri, test kapsami genisletildi.

---

## Genel Bakis

Carbonac, yuklenen bir dokumani **8 asamali** bir pipeline ile isler. Her asama bir oncekinin ciktisini girdi olarak alir ve surecin tamamlanma yuzdesi worker tarafindan raporlanir.

```
Dokuman Yukleme ──► Markdown Donusumu ──► Markdown Parse ──► AI Art Direction
       (5%)              (10%)              (15%)              (30%)
                                                                 │
PDF Ciktisi ◄── PDF Post-process ◄── QA Harness ◄── Paged.js ◄──┘
   (92%)            (80%)             (70%)          (60%)
```

---

## Asama 1: Dokuman Yukleme ve Ingest (Ilerleme: %5)

### Kaynak Dosyalar
- `backend/server.js` — API endpoint'leri ve Multer konfigurasyonu
- `backend/queue.js` — BullMQ kuyruk yonetimi
- `backend/job-store.js` — Supabase is kaydı

### 1.1 Dosya Alimi

Kullanici frontend'den dosya yuklediginde `POST /api/convert/to-markdown` endpoint'ine istek gonder:

```
Frontend (FormData) ──► Multer (disk storage) ──► Format tespit ──► Markdown donusumu
```

**Multer Konfigurasyonu:**
- Maksimum dosya boyutu: **50 MB**
- Kabul edilen formatlar: PDF, DOCX, DOC, TXT, MD, RTF, ODT
- Dosya isimlendirme: `{timestamp}-{random}-{orijinal_isim}`
- Gecici dizin: `temp/uploads/`

### 1.2 Kimlik Dogrulama ve Rate Limiting

Her istek icin sirayla:
1. **JWT dogrulama** — Supabase token'i `Authorization: Bearer <token>` header'indan alinir
2. **Rate limit kontrolu** — Kullanici basina 60 istek / 5 dakika (API), 20 istek / 15 dakika (AI)
3. Asildiysa `429 Too Many Requests` + `Retry-After` header'i doner

### 1.3 Format Algilama ve Donusum

Dosya uzantisina gore farkli donusum stratejileri uygulanir:

| Uzanti | Strateji | Arac |
|--------|----------|------|
| `.md`, `.txt` | Dogrudan oku + temizle | `sanitizeMarkdownContent()` |
| `.docx`, `.doc` | Node.js icinde donustur | Mammoth.js |
| `.pdf`, `.rtf`, `.odt` | Harici surecle donustur | marker_single → Python fallback |

**Donusum Hiyerarsisi (PDF/RTF/ODT icin):**
```
marker_single (CLI) ──[basarisiz]──► Python converter ──[basarisiz]──► 500 hatasi
```

### 1.4 Is Kuyrugu Olusturma

`POST /api/convert/to-pdf` endpoint'i asenkron is olusturur:

1. Kullanicinin wizard ayarlarindan YAML frontmatter uret (`generateFrontmatter()`)
2. Frontmatter + markdown icerigi birlestir
3. UUID ile `jobId` olustur
4. BullMQ kuyuruguna `convert-pdf` isi ekle
5. Supabase `jobs` tablosuna kayit yaz
6. **HTTP 202 Accepted** ile `jobId` don

**BullMQ Kuyruk Ayarlari:**
- Kuyruk adi: `carbonac-jobs` (env ile degistirilebilir)
- Yeniden deneme: 3 deneme, ustel geri cekilme (1s baslangic)
- Worker concurrency: 2 (env ile degistirilebilir)

**Frontend Polling:**
- Baslangic araligi: 1 saniye
- Ustel artis: `intervalMs * 1.5`, maksimum 5 saniye
- Maksimum deneme: 60
- Terminal durumlar: `completed`, `failed`, `cancelled`

---

## Asama 2: Markdown Temizleme ve On-isleme (Ilerleme: %5–%10)

### Kaynak Dosya
- `src/utils/markdown-cleanup.js`

### 2.1 Karakter Sanitizasyonu (`sanitizeMarkdownContent()`)

PDF-to-Markdown donusturuculerden gelen sorunlu karakterleri temizler:

| Karakter Tipi | Islem |
|---------------|-------|
| `\r\n`, `\u2028`, `\u2029` | `\n` ye normalize et |
| NBSP (`\u00A0`) | Normal bosluga donustur |
| Soft hyphen (`\u00AD`) | Kaldir (opsiyonel tutma) |
| Kontrol karakterleri (`\u0000-\u0008`, vb.) | Tamamen kaldir |

**Cikti:** Temizlenmis metin + istatistik objesi (kac karakter temizlendi).

### 2.2 Metadata Cikarimi (`resolveDocumentMetadata()`)

Frontmatter eksik veya yetersizse, icerikten metadata cikarir:

**Baslik Cikarimi Oncelik Sirasi:**
1. Kullanici ayarlarindan (`settings.title`)
2. YAML frontmatter'dan (`metadata.title`)
3. Markdown iceriginden ilk `# veya ##` basligi (`inferTitleFromMarkdown()`)
4. Dosya adindan (`inferTitleFromFileName()` — `rapor-2025.md` → `rapor 2025`)
5. Varsayilan: `"Carbon Report"`

**Yazar Cikarimi:**
- Ilk 80 satiri tarayarak su kaliplari arar:
  - `author:`, `yazar:`, `hazirlayan:`, `prepared by:`, `report by:`, `by`
- Bulunamazsa bos birakir

**Diger Normalizasyonlar:**
- `includeCover` → boolean (varsayilan: `true`)
- `showPageNumbers` → boolean (varsayilan: `true`)
- `colorMode` → `"color"` veya `"mono"`
- `locale` → dil kodu (varsayilan: `"en-US"`)

---

## Asama 3: Markdown Parse (Ilerleme: %15)

### Kaynak Dosyalar
- `src/utils/markdown-parser.js` — unified/remark/rehype pipeline
- `src/utils/directive-mapper.js` — 11 ozel direktif tipi

### 3.1 Parse Pipeline

unified framework uzerine kurulu zincirleme plugin sistemi:

```
Ham Markdown
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  1. remarkParse          — Markdown tokenization (MDAST)    │
│  2. remarkGfm            — GitHub tablolari, strikethrough  │
│  3. remarkFrontmatter    — YAML/TOML ayirma                │
│  4. remarkDirective      — ::: direktif syntax'i            │
│  5. remarkHeadingIds     — Basliklara slug-ID atama         │
│  6. remarkSourcePositions — Kaynak satir/sutun takibi       │
│  7. remarkSmartypants    — Akilli tirnak, em-dash, ellipsis │
│  8. stripFrontmatter     — Frontmatter node'larini cikart  │
│  9. applyDirectiveMappings — Direktifleri HTML'e donustur   │
│ 10. remarkRehype         — MDAST → HAST (HTML AST)         │
│ 11. rehypeRaw            — Ham HTML etiklerini isle         │
│ 12. rehypeStringify      — HAST → HTML string              │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Parsed Output: { metadata, content, toc, ast, components }
```

### 3.2 Frontmatter Isleme

`gray-matter` kutuphanesi ile `---` sinirlaricilari arasindaki YAML blogu ayristirilir:

```yaml
---
title: Yillik Rapor
author: Ahmet Yilmaz
theme: g10
layoutProfile: asymmetric
printProfile: pagedjs-a4
locale: tr-TR
---
```

**Varsayilan Degerler:**
```javascript
{
  title: '',
  subtitle: '',
  author: '',
  theme: 'white',
  layoutProfile: 'symmetric',
  printProfile: 'pagedjs-a4',
  locale: 'en-US'
}
```

### 3.3 Baslik ID Uretimi

`GithubSlugger` ile URL-guvenli ID'ler uretilir:
- `"Yillik Satis Raporu"` → `id="yillik-satis-raporu"`
- Her basliga `data-source-line` ve `data-source-column` eklenir (hata izleme icin)

### 3.4 Icindekiler Tablosu (TOC) Olusturma

AST uzerinde tum basliklar taranarak hiyerarsik bir TOC dizisi uretilir:

```javascript
[
  { level: 1, title: "Giris", id: "giris" },
  { level: 2, title: "Amac", id: "amac" },
  { level: 2, title: "Kapsam", id: "kapsam" },
  { level: 1, title: "Bulgular", id: "bulgular" },
]
```

### 3.5 Direktif Donusumu

11 ozel direktif tipi tanimlıdir. Her biri farkli bir Carbon Design System bilesenine eslenir:

| Direktif | HTML Etiketi | Carbon Bileseni | Ornek Kullanim |
|----------|-------------|-----------------|----------------|
| `:::callout` | `<aside>` | HighlightBox | `:::callout {tone=warning}` |
| `:::data-table` | `<figure>` | DataTable | `:::data-table {caption="Satis"}` |
| `:::chart` | `<figure>` | CarbonChart | `:::chart {type=bar}` |
| `:::code-group` | `<section>` | CodeGroup | `:::code-group {language=python}` |
| `:::figure` | `<figure>` | Figure | `:::figure {src="/img.png"}` |
| `:::quote` | `<blockquote>` | Quote | `:::quote {author="Ataturk"}` |
| `:::timeline` | `<section>` | Timeline | `:::timeline {layout=horizontal}` |
| `:::accordion` | `<section>` | Accordion | `:::accordion {variant=compact}` |
| `:::marginnote` | `<span>` | MarginNote | `:::marginnote {align=right}` |
| `:::pattern` | `<section>` | PatternBlock | `:::pattern {type=hero}` |
| `:::spacer` | — | Spacer | `:::spacer` |

**Desteklenen Grafik Turleri (20+):** bar, line, area, donut, stacked, scatter, bubble, radar, treemap, gauge, heatmap, pie, histogram, boxplot, meter, combo, lollipop, wordcloud, alluvial

**Direktif Isleme Adimlari:**
1. `normalizeAttributes()` — Sadece beyaz listedeki attribute'lari kabul et (guvenlik)
2. `buildClassName()` — CSS sinif tokenleri uret (orn: `directive directive--callout tone-warning`)
3. `data-*` attribute'lari ekle: `data-directive`, `data-component`, `data-print-friendly`, `data-source-line`
4. `extractDirectiveComponents()` — Tum direktifleri duz bir bilesen dizisine cikart

**Bilesen Cikarimi Ornegi:**
```javascript
{
  id: 'chart-bar-satis-bolgelere-gore',
  type: 'CarbonChart',
  props: { type: 'bar', caption: 'Satis Bolgelere Gore', source: 'Q3 2025' },
  sourceMap: { line: 42, column: 1 }
}
```

---

## Asama 4: AI Art Direction — Gemini Layout Planlamasi (Ilerleme: %30)

### Kaynak Dosya
- `src/ai/art-director.js` — 966+ satir, ana orkestrator

### 4.1 Genel Mimari

v2 prompt sistemi **iki asamali kademeli yonlendirme** (cascade prompting) kullanir:

```
Markdown Icerigi
      │
      ▼
┌──────────────────┐     ┌──────────────────────┐
│ Asama A:         │     │ Asama B:             │
│ DocumentPlan     │────►│ LayoutPlan           │
│ (Icerik Analizi) │     │ (Gorsel Tasarim)     │
└──────────────────┘     └──────────────────────┘
      │                         │
      ▼                         ▼
  Dokuman Yapisi          Layout JSON + Bileslenler
  (basliklar, amac,       (grid, component'lar,
   gerekli bloklar)        storytelling)
```

### 4.2 Giris Noktasi: `getArtDirection()`

```javascript
getArtDirection({ markdown, layoutProfile, printProfile, theme })
```

**Adim Adim Algoritma:**

1. **Markdown Parse** — Frontmatter, icerik, TOC cikart
2. **Profil Normalizasyonu** — Layout/print profili dogrula (`symmetric`, `pagedjs-a4` vb.)
3. **Fallback Hazirligi** — Gemini basarisiz olursa kullanilacak varsayilan layout olustur
4. **Referans Kutuphanesi** — `library/manifest.json` den Carbon desen cuelerini yukle
5. **Icerik Kirpma** — Maksimum 12.000 karakter (Gemini context limiti)
6. **API Anahtari Kontrolu** — Yoksa dogrudan fallback don

### 4.3 v2 Asama A: DocumentPlan (Gemini Cagrisi #1)

**Prompt Ozeti:**
```
"Sen baski-hazir rapor sistemi icin icerik planlamacisin."
- Dokuman anahatini ve gerekli bloklari yakala
- Bolum ID'leri slug formunda (kucuk harf, tire ayirici)
- Maksimum 12 bolum
```

**Gemini API Ayarlari:**
- Model: `gemini-3-pro-preview` (fallback: `gemini-2.5-pro`)
- Temperature: `0.2` (deterministik JSON ciktisi)
- topP: `0.8`
- maxOutputTokens: `4096`
- responseMimeType: `application/json` (JSON cikti zorlamasi)

**DocumentPlan Cikti Semasi (Zod validasyonu):**
```javascript
{
  title: "Yillik Satis Raporu",
  audience: "Ust Yonetim",
  requiredBlocks: ["ExecutiveSummary", "KeyFindings"],
  sections: [
    {
      id: "giris",
      title: "Giris",
      purpose: "Raporun amaci ve kapsamini tanimlama",
      requiredBlocks: ["RichText"],
      dataRefs: []
    },
    {
      id: "satis-analizi",
      title: "Satis Analizi",
      purpose: "Bolgesel satis verilerinin gorsellestirilmesi",
      requiredBlocks: ["CarbonChart", "DataTable"],
      dataRefs: ["satis-tablosu"]
    }
  ]
}
```

### 4.4 v2 Asama B: LayoutPlan (Gemini Cagrisi #2)

DocumentPlan'i baglam olarak alarak gorsel layout JSON olusturur.

**Prompt Icerigi:**
- DocumentPlan yapisi (onceki asamadan)
- Referans kutuphanesi cuelerinin (cover-page-hero, chapter-opener, vb.)
- Gorsel zenginlik hedefleri:
  - RichText + HighlightBox + CarbonChart dengeli karisimi
  - Veri ima edildiyse en az 1 CarbonChart
  - En az 1 HighlightBox
  - Farkli yogunluklar: tam-genislik + cok-sutunlu (6/10, 8/8) + offset
  - Kontrast icin tema degisimi (g10/g90)
- Dokuman tipi ozel kurallar (CV → max 8 bilesen, grafik yok)

**Grafik Tipi → Veri Eslestirme Kuralları:**
| Veri Tipi | Onerilen Grafik |
|-----------|-----------------|
| Zaman serisi | line, area |
| Korelasyon | scatter, bubble |
| Kompozisyon | donut, pie |
| Dagilim | histogram, boxplot |
| Hiyerarsi | treemap |
| Akis | alluvial |
| KPI | gauge, meter |

### 4.5 Layout JSON Cikti Yapisi

```javascript
{
  layoutProfile: "asymmetric",
  printProfile: "pagedjs-a4",
  gridSystem: "asymmetric",
  components: [
    {
      type: "RichText",
      layoutProps: { colSpan: 10, offset: 3 },
      styleOverrides: { theme: "white" },
      className: "intro-section"
    },
    {
      type: "CarbonChart",
      layoutProps: { colSpan: 8, offset: 0 },
      data: { chartType: "bar", dataHint: "composition" },
      styleOverrides: { theme: "g10" }
    },
    {
      type: "HighlightBox",
      layoutProps: { colSpan: 6, offset: 10 },
      styleOverrides: { theme: "g90" }
    }
  ],
  storytelling: {
    executiveSummary: "Bu rapor 2025 Q3 satis performansini...",
    keyInsights: [
      "Bati bolgesi %23 buyume gostermistir",
      "Dijital kanallar toplam satislarin %45'ini olusturuyor"
    ],
    methodologyNotes: "Veriler SAP ve CRM sistemlerinden derlenmistir",
    sources: ["SAP BI Dashboard", "CRM Rapor Modulu"]
  },
  styleHints: {
    avoidBreakSelectors: [".highlight-box", ".chart-container"],
    forceBreakSelectors: [".chapter-break"]
  }
}
```

### 4.6 Zod Sema Validasyonu

Gemini'nin dondurmesi gereken JSON **Zod semalariyla** dogrulanir:
- `colSpan`: 1–16 arasi tamsayi (16-sutunlu grid)
- `offset`: 0–15 arasi tamsayi
- `offset + colSpan ≤ 16` zorunlulugu (asarsa otomatik kucultur)
- Bilinmeyen alanlar `.passthrough()` ile kabul edilir (ek metadata icin)
- `keyInsights` ve `sources`: string veya dizi olarak gelebilir, otomatik diziye cevrilir

### 4.7 Fallback Stratejisi (3 Katmanli)

```
Gemini v2 (DocumentPlan + LayoutPlan)
    │ [basarisiz]
    ▼
Gemini v1 (tek asamali prompt)
    │ [basarisiz]
    ▼
Hardcoded Fallback Layout
    - Varsayilan bileslenler
    - Tablo verilerinden istatistiksel icerik cikarimi
    - Trend tespiti (artan/azalan)
    - Aykiri deger tespiti (mean ± 2*stdDev)
```

**Fallback Icerik Cikarimi Algoritmasi:**
1. Markdown tablolarini parse et
2. Her sutun icin sayisal degerleri topla
3. Trend tespit et: Her deger >= onceki → "artan trend"
4. Aykiri deger tespit et: Deger > ortalama + 2*standart sapma
5. Ilk 3 icgoru don (Turkce)

### 4.8 Referans Kutuphanesi

`library/manifest.json` dosyasindan Carbon desen cuelerini yukler:
- `cover-page-hero` — Kapak sayfasi
- `chapter-opener` — Bolum acilisi
- `executive-summary` — Yonetici ozeti
- `key-findings-list` — Ana bulgular
- `hero-stat-with-quote` — Buyuk istatistik + alinti
- `survey-chart-page` — Anket grafik sayfasi

Maksimum 6 referans, madde imli liste olarak prompt'a enjekte edilir.

---

## Asama 5: HTML Olusturma ve CSS Birlestirme (Ilerleme: %45)

### Kaynak Dosyalar
- `src/convert-paged.js` — `buildHtml()` fonksiyonu
- `src/utils/token-loader.js` — CSS custom property olusturma

### 5.1 CSS Varlik Yukleme (Paralel)

Dort CSS kaynagi **eslezamanli** yuklenir:
```javascript
Promise.all([
  readFile('styles/print/print-base.css'),      // Temel baski CSS
  readFile('styles/print/pagedjs-a4.css'),       // Sayfa boyutu profili
  buildFontFaceCss(projectRoot),                 // IBM Plex font-face'ler
  buildHyphenationScriptTag(...)                 // Hecelem scripti
])
```

### 5.2 Token CSS Olusturma

CSS custom property'leri **5 katmanli oncelik sirasi** ile birlestirilir:

```
1. Core tokens     (tokens/core.json)         — Temel renkler, aralıklar
2. Print tokens    (tokens/print.json)        — Sayfa boyutu, kenar boslugu
3. Theme tokens    (tokens/themes/g10.json)   — Tema renkleri
4. Template tokens (templates/X/overrides.json) — Sablon uzerine yazmalari
5. Runtime tokens  (API parametreleri)        — En yuksek oncelik
```

**Cikti Ornegi:**
```css
:root {
  --cds-ui-01: #ffffff;
  --cds-text-01: #161616;
  --cds-interactive-01: #0f62fe;
  --cds-spacing-05: 16px;
}
.theme--g90 {
  --cds-ui-01: #262626;
  --cds-text-01: #f4f4f4;
}
```

### 5.3 Markdown → HTML Donusumu

```
Markdown ──► Hecelem Istisnalari Ekle ──► markdownToHtml() ──► Mantik Bazli Stil Ekle
```

1. **Hecelem istisnalari:** Belirli kelimelere `U+00AD` (soft hyphen) eklenir
2. **markdownToHtml():** unified pipeline ile HTML string uretir
3. **applyLogicBasedStyling():** Art direction'dan gelen `styleHints` e gore CSS siniflari ekler:
   - `avoid-break` — Sayfa kirilmasini engelle
   - `force-break` — Sayfa kirilmasi zorla

### 5.4 Layout Grid Olusturma

Art direction'dan gelen `components` dizisi 16-sutunlu CSS Grid'e doner:

```
HTML Icerik ──► Basliklardan bolumle ──► Component'leri grid hucresine esle
```

**Algoritma:**
1. HTML'i baslik etiketleri ile bolumlere ayir (`<h1>`, `<h2>`, vb.)
2. Her component icin grid pozisyonu hesapla:
   - `colSpan: 16, offset: 0` → `grid-column: 1 / -1` (tam genislik)
   - `colSpan: 8, offset: 4` → `grid-column: 5 / span 8`
3. Her bilesen `<div class="layout-component layout-component--{type}">` ile sarilir

### 5.5 Kapak Sayfasi

`metadata.includeCover !== false` ise kapak HTML'i uretilir:
```html
<header class="report-cover">
  <h1 class="report-title">{baslik}</h1>
  <p class="report-subtitle">{alt baslik}</p>
  <div class="report-meta">
    <span>{yazar}</span>
    <span>{tarih}</span>
  </div>
</header>
```

### 5.6 Nihai HTML Belgesi

```html
<!doctype html>
<html lang="{dil}">
<head>
  <title>{baslik}</title>
  <style>
    {tokenCss}       /* CSS custom properties */
    {fontFaceCss}    /* IBM Plex font-face */
    {baseCss}        /* print-base.css */
    {printCss}       /* pagedjs-a4.css */
  </style>
</head>
<body class="layout layout--{layoutProfile}
             theme--{theme}
             print--{printProfile}
             color-mode--{colorMode}
             {tipografiSiniflari}">
  <div class="report">
    {kapakSayfasi}
    <main class="report-content">
      {anaIcerik}
    </main>
  </div>
  {hecelemScripti}
  {grafikRendererScripti}
</body>
</html>
```

---

## Asama 6: Paged.js Sayfalama ve Chromium Render (Ilerleme: %60)

### Kaynak Dosya
- `src/convert-paged.js` — `convertToPaged()` ana fonksiyonu

### 6.1 Headless Chromium Baslatma

```javascript
browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
page = await browser.newPage();
await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'domcontentloaded' });
await page.emulateMedia({ media: 'print' });
```

**Chromium Yolu Onceligi:**
1. `PLAYWRIGHT_EXECUTABLE_PATH`
2. `PUPPETEER_EXECUTABLE_PATH`
3. `CHROMIUM_PATH`
4. `/usr/bin/chromium`
5. `/usr/bin/chromium-browser`
6. `/usr/bin/google-chrome`

### 6.2 Grafik Renderleme

Enjekte edilen `__renderCharts()` fonksiyonu tarayici baglaminda calistirilir, `:::chart` direktiflerini gorsel grafiklere donusturur.

### 6.3 Paged.js Polyfill

```javascript
await page.addScriptTag({ path: pagedJsPath });
await page.waitForFunction(() => window.PagedPolyfill?.preview);
await page.evaluate(async () => await window.PagedPolyfill.preview());
await new Promise(resolve => setTimeout(resolve, 500)); // DOM stabilizasyonu
```

**Paged.js Ne Yapar:**
- CSS `@page`, `@top-left`, `@bottom-right` kurallarini isle
- Sayfa kirilmalarini icerik akisina gore hesapla
- `.pagedjs_page` konteynerlarini olustur
- Kosu basliklari/altliklari (running headers/footers) uret
- Her sayfaya `data-page-number` attribute'u ekle

### 6.4 Akilli Tablo Bolme

Buyuk tablolar sayfalar arasi otomatik bolunur:

**Algoritma:**
1. Tum tablolari tara
2. Satir sayisi < 18 ise atla (yapilandirilabilir)
3. Sayfa yuksekliginden kullanilabilir alani hesapla
4. Sayfa basina satir sayisini belirle (minimum 6)
5. Tabloyu parcalara bol, her parcaya baslik satirini kopyala
6. Parcalar arasina `break-before: page` ekle

---

## Asama 7: Kalite Guvence (QA) Harness (Ilerleme: %70)

### Kaynak Dosyalar
- `src/convert-paged.js` — `runQaHarness()` ve yardimci fonksiyonlar
- `src/ai/qa-reviewer.js` — AI kalite degerlendirme

### 7.1 Yinelemeli QA Dongusu

QA sistemi **iteratif duzeltme** yapar (maksimum 2 iterasyon):

```
Statik Lint ──► Sorun Tespit ──► CSS Duzeltme Uygula ──► Yeniden Sayfala ──► Tekrar Tara
     │                                                                            │
     └──── Sorun kalmadiysa veya duzeltme yoksa dur ◄────────────────────────────┘
```

### 7.2 Statik Lint: Tipografi ve Layout Sorunlari

Tarayici DOM'unda her sayfayi tarar ve su sorunlari tespit eder:

| Sorun Tipi | Aciklama | Siddet | Duzeltme |
|------------|----------|--------|----------|
| `overflow` | Icerik sayfa sinirlari disina tasiyor | Yuksek | `force-break` |
| `table-split` | Tablo sayfa sonunda cirkin bolunuyor | Yuksek | `avoid-break` |
| `heading-near-bottom` | Baslik sayfa sonunda yetim kalmis | Orta | `force-break` |
| `orphan` | Sayfa sonunda tek satir metin | Orta | `avoid-break` |
| `widow` | Sayfa basinda tek satir metin | Orta | `avoid-break` |

**Olcum Parametreleri:**
- `bottomGap`: Sayfa alt sinirinin 72px yukarisinda uyari (yapilandirilabilir)
- `topGap`: Sayfa ust sinirinin 32px altinda uyari

### 7.3 Duzeltme Uygulama

Tespit edilen sorunlara CSS siniflari eklenir:
- `force-break` → `break-before: page` (sonraki sayfaya tasi)
- `avoid-break` → `break-before: avoid` (onceki elemanla birlikte tut)

Her duzeltmeden sonra Paged.js yeniden calistirilir.

### 7.4 Erisilebiirlik Kontrolleri

**Yerel Kontroller:**
- Baslik hiyerarsisi: h1 → h3 atlama (h2 eksik) tespiti
- Baglanti dogrulamasi: `href` attribute'u eksik linkler
- Minimum yazi boyutu: 10px altindaki metinler (WCAG AA)

**Axe Core Denetimi:**
- Axe-core kutuphanesi enjekte edilir
- WCAG 2.0 AA, WCAG 2.1 AA kurallari degerlendirilir
- Ihlaller: ID, etki, aciklama, yardim URL'si ile raporlanir

### 7.5 Tipografi Puanlamasi

Her paragraf ve liste ogesi icin olculur:
- **Satir basina karakter (CPL):** Optimal 45–75
- **Satir yukseklik orani:** Optimal 1.4–1.6x
- **Hecelem yogunlugu:** Ideal ~%10
- **Cok kisa satirlar (< 45 CPL):** Dusuk okunabilirlik
- **Cok uzun satirlar (> 90 CPL):** Goz yorgunlugu

### 7.6 Gorsel Regresyon Testi

Etkinlestirildiginde (`PDF_QA_VISUAL_REGRESSION=true`):
1. Tam sayfa PNG ekran goruntusu cek
2. Temel goruntuyle karsilastir (yoksa olustur)
3. Python gorsel fark scripti calistir
4. Piksel uyumsuzluk oranini esik degeriyle karsilastir (%1 varsayilan)

### 7.7 AI Kalite Degerlendirmesi

Tum sorunlar `qa-reviewer.js` e gonderilir:

```javascript
// Gemini'ye gonderilir (maks. 50 sorun)
// temperature: 0.2, maxOutputTokens: 512
reviewQaIssues({ issues })
```

**Cikti:**
```javascript
{
  summary: "Tipografi sorunu: 2. bolumde yetim satir tespit edildi.",
  severity: "medium",  // low | medium | high
  notes: [
    "Paragraf kenar bosluğunu ayarlayarak dulu ortadan kaldirin.",
    "Cok sutunlu layoutta daha kisa satir uzunluğu deneyin."
  ]
}
```

---

## Asama 8: PDF Export ve Post-processing (Ilerleme: %80)

### Kaynak Dosyalar
- `src/convert-paged.js` — PDF olusturma
- `src/utils/pdf-postprocess.js` — Metadata ve PDF/A

### 8.1 PDF Olusturma

```javascript
await page.pdf({
  path: finalOutputPath,
  format: 'A4',  // veya A3/A5
  printBackground: true,
  preferCSSPageSize: true  // CSS @page boyutunu kullan
});
```

### 8.2 PDF Post-processing (`postprocessPdf()`)

`pdf-lib` kutuphanesi ile PDF uzerinde islemler:

1. **Metadata Ekleme:**
   - Title, Author, Subject
   - Producer/Creator (build bilgisi ile)
   - Keywords (pattern tag'leri + build versiyonu/sha/tarih)
   - Olusturma/Degistirme tarihleri

2. **Taslak Filigrani:**
   - Durum "draft" ise her sayfaya seffaf "DRAFT" filigrani
   - IBM Plex Bold, %18 opasite, -25 derece donmus
   - Boyut: min(genislik, yukseklik) / 5

3. **PDF/A Hazirligi:**
   - `pdfaReady` bayragi ayarlanir
   - Object stream sıkıştırma

4. **Optimizasyon:**
   - `useObjectStreams: true` ile boyut kucultme

---

## Asama 9: Yukleme ve Tamamlama (Ilerleme: %92–%100)

### 9.1 Supabase Storage Yukleme

```
PDF dosyasi ──► Supabase Storage 'pdfs' bucket ──► Imzali URL olustur
```

- Depolama yolu: `users/{userId}/documents/{documentId}/jobs/{jobId}.pdf`
- Imzali URL suresi: yapilandirilabilir
- Depolama devre disi ise yerel dosya fallback'i

### 9.2 Preflight Degerlendirmesi

Son kalite kontrol listesi (checklist):
- QA raporu bulgulari
- Press pack QA kurallari
- Icerik sema uyumu
- Blok katalogu ihlalleri
- Baski geometrisi dogrulamasi

### 9.3 Cikti Manifestosu

Tum pipeline bilgileri tek bir `outputManifest` objesinde derlenir:

```javascript
{
  jobId, documentId, userId,
  template: { key, versionId },
  pressPack: { id, name },
  metadata: { title, author, cleanup_stats },
  ai: { promptVersion, models, source },
  qaReport: { issues, fixes, accessibility, typography },
  preflight: { passed, checklist },
  postprocess: { pdfaReady, optimized, watermarked },
  storage: { bucket, path, signedUrl },
  timings: { startedAt, completedAt, durationMs }
}
```

### 9.4 Is Tamamlama

```javascript
recordJobStatus(job, 'completed', { result: outputManifest }, 'Job completed')
```

Frontend polling'i `status: "completed"` gordugunde PDF'i indirir.

---

## Zamanlama Ozeti

| Asama | Ilerleme | Tipik Sure |
|-------|----------|------------|
| Ingest (dosya okuma) | %5 | ~100ms |
| Parse (markdown) | %15 | ~200ms |
| Plan (AI art direction) | %30 | ~4–10s |
| Render HTML | %45 | ~500ms |
| Paginate (Paged.js + Chromium) | %60 | ~2–4s |
| QA Harness | %70 | ~1–2s |
| Export PDF | %80 | ~500ms |
| Post-process | %85 | ~200ms |
| Upload (Supabase) | %92 | ~1–2s |
| Tamamlama | %100 | — |
| **Toplam** | | **~8–18 saniye** |

---

## Hata Yonetimi Ozeti

| Katman | Strateji |
|--------|----------|
| Dosya donusum | Marker → Python fallback → 500 hatasi |
| AI art direction | Gemini v2 → Gemini v1 → Hardcoded fallback |
| Gemini model | `gemini-3-pro-preview` → `gemini-2.5-pro` |
| Is kuyrugu | 3 deneme, ustel geri cekilme |
| QA duzeltme | Maks. 2 iterasyon, duzeltme yoksa dur |
| Depolama | Supabase Storage → yerel dosya |

---

## Ortam Degiskenleri Referansi

| Degisken | Varsayilan | Aciklama |
|----------|------------|----------|
| `GEMINI_API_KEY` | — | Gemini AI erisimi (zorunlu) |
| `REDIS_URL` | `redis://127.0.0.1:6379` | BullMQ kuyruk |
| `WORKER_CONCURRENCY` | `2` | Eslezamanli is sayisi |
| `PDF_QA_ENABLED` | `true` | QA harness'i etkinlestir |
| `PDF_QA_MAX_ITERATIONS` | `2` | QA iterasyon limiti |
| `PDF_QA_VISUAL_REGRESSION` | `false` | Gorsel regresyon testi |
| `PDF_QA_AXE_TAGS` | `wcag2a,wcag2aa,wcag21aa` | Erisilebiirlik kurallari |
| `PRINT_TABLE_SPLIT_MIN_ROWS` | `18` | Tablo bolme esigi |
| `PRINT_TABLE_SPLIT_MIN_ROWS_PER_PAGE` | `6` | Bolunmus sayfa basina min satir |
