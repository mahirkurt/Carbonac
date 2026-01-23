# CHART + TABLE STANDARDS

Bu dokuman Paged.js PDF ciktilari icin chart ve tablo standartlarini tanimlar.

## 1) Chart directive standardi

Desteklenen directive:
```
:::chart{type="bar" variant="survey" question="Soru etiketi" highlight="64%" sampleSize="n=120" source="Kaynak" methodology="Online survey"}
```json
[{"group":"A","value":12},{"group":"B","value":18}]
```
:::
```

Kurallar:
- `variant=survey` SurveyChartPage kalibidir.
- `question` varsa `caption` yerine kullanilir.
- `highlight` buyuk metrik alanidir (survey sayfasi).
- `sampleSize`, `methodology`, `source`, `notes` meta satirinda gosteriIir.
- Print paleti: grayscale + pattern (SVG defs) kullanilir.

Meta satiri formati:
- `Key metric`, `Sample`, `Method`, `Source`, `Notes`

## 2) SurveyChartPage (baseline)

SurveyChartPage icin hedef alanlar:
- Soru etiketi (question)
- Buyuk metrik (highlight)
- Sample size (sampleSize)
- Kaynak/Method (source/methodology)
- Notlar (notes)
- AI storytelling bloklari icin `methodologyNotes` ve `sources` alanlari kullanilir; PDF'de meta satiri olarak yazdirilir.

Not: Buyuk metrik `chart-highlight` olarak vurgulanir; meta satiri sample/method/source/notes icerir.

## 3) SVG-first chart hedefi

- Grafik renderi SVG tabanli olmalidir (print kalite).
- CSS: `.directive--chart svg { width: 100%; height: auto; }`
- Canvas desteklenirse degrade etmeyecek sekilde kullanilmali.
- Pattern/dash kombinasyonu ile seriler birbirinden ayrilir (grayscale uyumlu).

## 4) Table standardi

- `thead { display: table-header-group; }` ile sayfa tekrarina izin verilir.
- Zebra kurali: `tbody tr:nth-child(even)` arka plan.
- Satir yuksekligi: `th/td line-height: 1.4`.
- Break: `break-inside: avoid` baseline uygulanir.
- Akilli split: buyuk tablolar `table--split` ile bolunur ve sayfa arasi `force-break` eklenir.

## 5) Acik isler

- Chart color/pattern kombinasyonlari (grayscale-friendly)
- Akilli tablo split algoritmasi (multi-page)
