# Carbon Data Visualization Kit — Entegrasyon Talimatnamesi

> Referans: [Carbon Data Visualization Kit Alpha Release (Medium)](https://medium.com/carbondesign/exciting-news-carbon-data-visualization-kit-alpha-release-now-available-to-the-public-c5e47894d400)
> Tarih: 2026-02-09

## 1. Genel Bakis

Carbon Data Visualization Kit, IBM Carbon Design System'in resmi grafik kutuphanesidir. Alpha surumuyle birlikte Bar, Line ve Area gibi sik kullanilan grafik tipleri, slot/aspect-ratio/resizer gibi yenilikci yapilandirma teknikleri ve benzersiz olcude konfigurasyon imkani sunmaktadir.

**Projemizdeki mevcut durum:** Carbonac su anda `src/convert-paged.js` icerisinde elle yazilmis SVG tabanli bir grafik motoru kullaniyor. Bu motor 5 grafik tipini (bar, line, area, donut, stacked) destekler ve baski icin gri tonlamali pattern'ler uretir. Ancak interaktif degil, sinirli grafik tipi sunar ve resmi Carbon dataviz token'larini kullanmaz.

**Hedef:** `@carbon/charts-react` kutuphanesini entegre ederek:
- 25 grafik tipine erisim saglamak
- Carbon renk paletlerini ve tema desteGini (White, G10, G90, G100) otomatik almak
- Erisebilirlik (a11y) icin D3 tabanli yerlesik destek kazanmak
- Baski ve ekran modlarini ayri ayri yonetebilmek

---

## 2. Kutuphane Bilgileri

| Alan | Deger |
|------|-------|
| Paket | `@carbon/charts-react` |
| Core | `@carbon/charts` (D3 + TypeScript) |
| Guncel surumu | v1.27.2 (Ocak 2026) |
| Lisans | Apache-2.0 |
| Haftalik indirme | 60.000+ |
| GitHub | [carbon-design-system/carbon-charts](https://github.com/carbon-design-system/carbon-charts) |
| Dokumantasyon | [charts.carbondesignsystem.com](https://charts.carbondesignsystem.com/) |
| Figma Kit | [Figma Community](https://www.figma.com/community/file/1342888187036080999) |

---

## 3. Mevcut Grafik Tipleri (@carbon/charts-react)

Kutuphanenin export ettigi 25 React bilesenin tam listesi:

### Karsilastirma
| Bilesen | Aciklama |
|---------|----------|
| `SimpleBarChart` | Tekli bar grafigi |
| `GroupedBarChart` | Gruplandirmali bar |
| `StackedBarChart` | Yigilmis bar |
| `BulletChart` | KPI vs hedef karsilastirma |
| `LollipopChart` | Noktali bar (lollipop) |

### Trend
| Bilesen | Aciklama |
|---------|----------|
| `LineChart` | Cizgi grafigi |
| `AreaChart` | Alan grafigi |
| `StackedAreaChart` | Yigilmis alan |
| `ComboChart` | Cizgi + bar kombine |
| `HistogramChart` | Histogram dagilim |

### Parca-Butun
| Bilesen | Aciklama |
|---------|----------|
| `DonutChart` | Donut grafigi |
| `PieChart` | Pasta grafigi |
| `GaugeChart` | Gosterge/metre |
| `MeterChart` | Ilerleme metresi |
| `TreemapChart` | Agac haritasi |

### Korelasyon ve Dagilim
| Bilesen | Aciklama |
|---------|----------|
| `ScatterChart` | Sacilim grafigi |
| `BubbleChart` | Balon grafigi |
| `HeatmapChart` | Isi haritasi |
| `BoxplotChart` | Kutu grafigi |

### Hiyerarsi ve Akis
| Bilesen | Aciklama |
|---------|----------|
| `TreeChart` | Agac yapisi |
| `CirclePackChart` | Daire paketleme |
| `AlluvialChart` | Akis diyagrami |
| `WordCloudChart` | Kelime bulutu |

### Ozel
| Bilesen | Aciklama |
|---------|----------|
| `RadarChart` | Radar/orumcek grafigi |
| `ChoroplethChart` | Harita (koroplet) |

---

## 4. Veri Formati

`@carbon/charts` tum grafiklerde tutarli bir veri modeli kullanir:

```javascript
// Kategorik veri (bar, donut, pie)
const data = [
  { group: "EMEA", value: 42 },
  { group: "Americas", value: 33 },
  { group: "APAC", value: 25 }
];

// Zaman serisi (line, area)
const data = [
  { group: "Revenue", date: "2025-01", value: 10000 },
  { group: "Revenue", date: "2025-02", value: 12000 },
  { group: "Cost",    date: "2025-01", value: 7000 },
  { group: "Cost",    date: "2025-02", value: 7500 }
];

// Scatter / Bubble
const data = [
  { group: "Product A", sales: 250, profit: 40, employees: 120 }
];
```

**Onemli:** Projemizin mevcut `:::chart` direktif formati (`[{"group":"A","value":12}]`) zaten bu yapiyla uyumlu. Migrasyon icin veri formatinda degisiklik gerekmez.

---

## 5. Options (Yapilandirma) Yapisi

```javascript
const options = {
  title: "Bolgesel Gelir Dagilimi",
  axes: {
    bottom: { mapsTo: "date", scaleType: "time" },
    left: { mapsTo: "value", title: "Gelir (TL)" }
  },
  theme: "g90",        // white | g10 | g90 | g100
  height: "400px",
  legend: { alignment: "center" },
  color: { scale: { "EMEA": "#6929c4", "Americas": "#1192e8" } },
  // Donut icin ek alan:
  donut: { center: { label: "Toplam" } }
};
```

---

## 6. Entegrasyon Plani

### Faz 1: Kurulum ve Temel Entegrasyon (Frontend)

#### 1.1 Bagimliliklari Yukle

```bash
cd frontend
npm install @carbon/charts-react @carbon/charts d3 d3-cloud d3-sankey
```

> `d3` temel bagimlilik, `d3-cloud` ve `d3-sankey` opsiyonel grafik tipleri icin (WordCloud, Alluvial).

#### 1.2 CSS Import

`frontend/src/main.jsx` dosyasina ekle:

```javascript
import '@carbon/charts-react/styles.css';
```

> Bu import Carbon Charts'in gerekli stillerini yukler. Not: `@carbon/charts-react/dist/...` path'i package `exports` nedeniyle bazi bundler'larda build-time hata verebilir; `@carbon/charts-react/styles.css` daha guvenlidir.

#### 1.3 Wrapper Bilesen Olustur

`frontend/src/components/charts/CarbonChartWrapper.jsx` olustur. Bu bilesen:
- `:::chart` direktifinden gelen `type` parametresine gore dogru `@carbon/charts-react` bilesenini secer
- Mevcut JSON veri formatini direkt iletir
- Tema bilgisini `ThemeContext`'ten alir ve grafige aktarir

```
Tip esleme tablosu:
  bar       → SimpleBarChart (veya GroupedBarChart, veri yapısına gore)
  line      → LineChart
  area      → AreaChart
  stacked   → StackedBarChart (veya StackedAreaChart)
  donut     → DonutChart
  scatter   → ScatterChart
  radar     → RadarChart
  treemap   → TreemapChart
  gauge     → GaugeChart
  heatmap   → HeatmapChart
  bubble    → BubbleChart
  combo     → ComboChart
  pie       → PieChart
  histogram → HistogramChart
  boxplot   → BoxplotChart
  meter     → MeterChart
```

### Faz 2: Direktif Sistemini Genislet

#### 2.1 Yeni Grafik Tiplerini directive-mapper'a Ekle

`src/utils/directive-mapper.js` dosyasindaki `chart.typeValues` dizisini genislet:

```javascript
// Mevcut:
typeValues: ['bar', 'line', 'area', 'donut', 'stacked']

// Yeni:
typeValues: [
  'bar', 'line', 'area', 'donut', 'stacked',
  'scatter', 'bubble', 'radar', 'treemap', 'gauge',
  'heatmap', 'pie', 'histogram', 'boxplot', 'meter',
  'combo', 'lollipop', 'wordcloud', 'alluvial'
]
```

#### 2.2 Direktif Sablonlarini Guncelle

`frontend/src/utils/directiveTemplates.js` dosyasina yeni grafik sablon varyantlari ekle:

```javascript
{
  id: 'chart-scatter',
  label: 'Scatter Chart',
  snippet: ':::chart{type="scatter" caption="Korelasyon Analizi" source="Kaynak"}\n```json\n[{"group":"A","x":10,"y":25},{"group":"B","x":30,"y":45}]\n```\n:::'
},
{
  id: 'chart-radar',
  label: 'Radar Chart',
  snippet: ':::chart{type="radar" caption="Yetkinlik Haritas" source="Kaynak"}\n```json\n[{"group":"Takim A","key":"Hiz","value":8},{"group":"Takim A","key":"Kalite","value":7}]\n```\n:::'
}
```

### Faz 3: PDF Baski Entegrasyonu (Worker)

Bu en kritik fazdir. `@carbon/charts-react` ekran icin D3+SVG render eder, ancak PDF baski pipeline'imiz Paged.js + headless Chromium kullanir.

#### 3.1 Strateji: Cift Modlu Render

| Mod | Motor | Kullanim |
|-----|-------|----------|
| **Ekran (Frontend)** | `@carbon/charts-react` | Canli onizleme, interaktif grafikler |
| **Baski (Worker)** | Mevcut SVG motoru (gelistirilmis) | PDF uretimi, Paged.js uyumlu |

**Neden:** `@carbon/charts` DOM ve D3 event loop'una bagli. Headless Chromium'da render edilebilir ancak:
- Animasyonlarin bitmesini beklemek gerekir
- SVG ciktisi daha deterministik ve baski dostu
- Gri tonlama pattern'leri baski icin korunmali

#### 3.2 Worker Icin Yaklasim

`src/convert-paged.js` dosyasindaki mevcut `renderChartSVG()` fonksiyonunu genislet:
- Yeni grafik tiplerini destekle (scatter, radar, treemap, vb.)
- Carbon `dataVizCategorical` paletini (`styles/carbon/colors-extended.js`) varsayilan renk olarak kullan
- `@media print` durumunda gri tonlama filtresi uygula (mevcut davranis korunsun)

#### 3.3 Alternatif: Chromium Tabanli Render (Opsiyonel)

Daha yuksek gorsel dogruluk icin, worker icinde `@carbon/charts` bilesenlerini Playwright'ta render edip screenshot alabilir:

1. Gecici HTML sayfasi olustur (React + @carbon/charts ile)
2. Playwright ile ac, animasyonlarin bitmesini bekle
3. SVG element'ini DOM'dan cikar
4. Bu SVG'yi Paged.js HTML'ine gom
5. PDF render et

Bu yaklasim daha yavas ama gorsel tutarlilik saglar.

### Faz 4: Tema Senkronizasyonu

#### 4.1 Frontend Tema Entegrasyonu

`@carbon/charts` tema desteGi sunar. `ThemeContext`'ten gelen tema degerini grafik `options.theme` alanina ilet:

```javascript
// CarbonChartWrapper.jsx icinde
const { theme } = useTheme();
const chartOptions = {
  ...userOptions,
  theme: theme // 'white' | 'g10' | 'g90' | 'g100'
};
```

#### 4.2 Renk Paleti Esleme

`styles/carbon/colors-extended.js` dosyasindaki `dataVizCategorical` paletini grafikler icin varsayilan olarak kullan. Bu zaten Carbon'un resmi dataviz paleti:

```javascript
// 14 renk: purple-70, cyan-50, teal-70, magenta-70, red-50, ...
```

`@carbon/charts` bu paleti dahili olarak zaten kullanir, bu sayede ekran ve baski arasinda renk tutarliligi saglanir.

### Faz 5: Art Director Entegrasyonu

`src/ai/art-director.js` dosyasindaki `CarbonChart` bilesen tipini yeni grafik turleriyle zenginlestir:

```javascript
// Mevcut: type sadece "CarbonChart"
// Yeni: alt tip belirterek AI'in dogru grafik secmesini sagla
{
  type: "CarbonChart",
  chartType: "scatter",  // yeni alan
  layoutProps: { colSpan: 8 },
  dataHint: "correlation" // AI icin ipucu
}
```

AI prompt'una yeni grafik tipleri ve kullanim senaryolari ekle:
- Korelasyon verisi → scatter/bubble
- Zaman serisi → line/area
- Karsilastirma → bar/grouped-bar
- Dagılım → histogram/boxplot
- Hiyerarsi → treemap/circle-pack
- Kompozisyon → donut/pie

---

## 7. Etkilenen Dosyalar

| Dosya | Degisiklik |
|-------|------------|
| `frontend/package.json` | `@carbon/charts-react`, `@carbon/charts`, `d3` ekle |
| `frontend/src/main.jsx` | CSS import ekle |
| `frontend/src/components/charts/CarbonChartWrapper.jsx` | **Yeni dosya** — wrapper bilesen |
| `frontend/src/components/layout/PreviewPanel.jsx` | Wrapper bileseni kullan |
| `frontend/src/utils/directiveTemplates.js` | Yeni grafik sablonlari ekle |
| `src/utils/directive-mapper.js` | `typeValues` dizisini genislet |
| `src/convert-paged.js` | SVG render motorunu yeni tipler icin genislet |
| `src/ai/art-director.js` | chartType alani + prompt guncellemesi |
| `styles/carbon/colors-extended.js` | Degisiklik yok (mevcut paletler yeterli) |

---

## 8. Veri Uyumlulugu Matrisi

| Mevcut Format | @carbon/charts Uyumu | Aksiyon |
|---------------|----------------------|---------|
| `[{group, value}]` | Direkt uyumlu | Yok |
| `[{label, count}]` | Esleme gerekli | `group=label, value=count` |
| `[{x, y}]` | Scatter icin uyumlu | `mapsTo` ayarla |
| Duz sayi dizisi `[12, 18]` | Donusum gerekli | Index'ten group olustur |

---

## 9. Baski Kalite Guvencesi

Mevcut QA pipeline'i (`backend/preflight.js`) asagidaki kontrolleri grafiklere de uygulamali:

- **SVG boyut kontrolu:** Grafik tasma (overflow) yok
- **Font gomme:** IBM Plex grafik etiketlerinde kullanilmali
- **Kontrast:** WCAG 2.1 AA renk kontrast orani (>= 3:1 buyuk metin, >= 4.5:1 kucuk metin)
- **Gri tonlama:** `@media print` durumunda pattern/hatching ile ayirt edilebilirlik
- **Page break:** Grafiklerin sayfa arasindan bolunmemesi (`break-inside: avoid`)

---

## 10. Test Stratejisi

```bash
# 1. Frontend birim testi: CarbonChartWrapper renderliyor mu?
npm run test:unit

# 2. Entegrasyon: :::chart direktifi dogru grafik tipini seciyor mu?
npm run test:integration

# 3. Smoke: API'ye yeni grafik tipiyle istek at, PDF uret
npm run test:smoke

# 4. QA: Uretilen PDF'te grafik gorunuyor mu, tasiyor mu?
npm run test:qa

# 5. Manuel: Frontend'te farkli grafik tiplerini onizle
cd frontend && npm run dev
# Tarayicida :::chart{type="scatter"} icerikli markdown gir, onizle
```

---

## 11. Kisitlar ve Riskler

| Risk | Etki | Azaltma |
|------|------|---------|
| `@carbon/charts` bundle boyutu (~300KB gzip) | Frontend yukleme suresi artar | Tree-shaking + lazy import |
| D3 bagimliligi catismasi | Mevcut D3 kullanan kod varsa sorun | Proje D3 kullanmiyor, risk dusuk |
| Baski'da animasyon/canvas sorunlari | PDF'te bos grafik | Baski modu icin SVG motorunu koru |
| Alpha kit degisiklikleri | API kirilabilir | v1.x kararlı, kit sadece Figma icin alpha |

> **Not:** Medium makalesindeki "Alpha" etiketi **Figma design kit** icindir. `@carbon/charts` npm paketi **v1.x kararlı** surumdedir ve production kullanima uygundur.

---

## 12. Referanslar

- [Carbon Charts GitHub](https://github.com/carbon-design-system/carbon-charts)
- [Carbon Charts Dokumantasyon](https://charts.carbondesignsystem.com/)
- [Carbon Charts React (npm)](https://www.npmjs.com/package/@carbon/charts-react)
- [Carbon Data Viz Figma Kit](https://www.figma.com/community/file/1342888187036080999)
- [Carbon Data Visualization Rehberi](https://carbondesignsystem.com/data-visualization/chart-types/)
- [Medium: Alpha Release Duyurusu](https://medium.com/carbondesign/exciting-news-carbon-data-visualization-kit-alpha-release-now-available-to-the-public-c5e47894d400)
