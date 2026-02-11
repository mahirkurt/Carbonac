# Pattern Library (Print Modules)

> Bu katalog, PDF uretimi icin tekrarlanabilir pattern modullerini tanimlar.
> Kaynak: `patterns/registry.json` ve `patterns/schemas/*.schema.json`.

## Genel Kurallar
- Pattern modulunu isaretlemek icin `:::pattern{type="..."} ... :::` kullanilir.
- `type` kebab-case olmalidir ve registry'deki `id` ile ayni olmali.
- Pattern icinde gerektigi kadar `callout`, `chart`, `data-table`, `figure`, `quote` directive'i kullanilabilir.
- QA baseline icin `examples/patterns/pattern-library.md` kullanilir.

## Moduller (Ozet)
1) CoverPageHero
2) ExecutiveSummary
3) KeyFindingsList
4) ActionBox (WhatToDo)
5) HeroStatWithQuote
6) ChapterOpener / PartOpener
7) CaseStudyModule
8) SurveyChartPage
9) PersistentSectionNavFooter
10) FigureWithCaptionAndSource
11) AppendixPage
12) SectionDivider
13) KpiGrid
14) TimelineSummary
15) IconList
16) ProfileCard
17) CV Profile / Summary / Experience / Education / Skills / Projects / Certifications / Languages

---

## 1) CoverPageHero
- **Pattern ID:** `cover-page-hero`
- **Props Schema:** `patterns/schemas/cover-page-hero.schema.json`
- **Ornek:**
```
:::pattern{type="cover-page-hero" title="2025 Outlook" subtitle="Q1 Review"}
<div class="pattern__eyebrow">Market Update</div>
<div class="pattern__title">2025 Outlook</div>
<div class="pattern__subtitle">Q1 Review</div>
:::
```

## 2) ExecutiveSummary
- **Pattern ID:** `executive-summary`
- **Props Schema:** `patterns/schemas/executive-summary.schema.json`
- **Ornek:**
```
:::pattern{type="executive-summary" title="Executive Summary"}
Kisa ozet burada.
- Gelir %18 artti.
- Marjlar 2.1 puan iyilesti.
:::
```

## 3) KeyFindingsList
- **Pattern ID:** `key-findings-list`
- **Props Schema:** `patterns/schemas/key-findings-list.schema.json`
- **Ornek:**
```
:::pattern{type="key-findings-list" title="Key Findings"}
- En hizli buyume EMEA bolgesinde.
- NPS 6 puan artti.
:::
```

## 4) ActionBox (WhatToDo)
- **Pattern ID:** `action-box`
- **Props Schema:** `patterns/schemas/action-box.schema.json`
- **Ornek:**
```
:::pattern{type="action-box" title="What To Do"}
- Kanal karmasini optimize et.
- Fiyatlamada A/B dene.
:::
```

## 5) HeroStatWithQuote
- **Pattern ID:** `hero-stat-with-quote`
- **Props Schema:** `patterns/schemas/hero-stat-with-quote.schema.json`
- **Ornek:**
```
:::pattern{type="hero-stat-with-quote" title="Momentum"}
<div class="pattern__stat">+42%</div>
<p>Gelir buyumesi son 3 ceyrektir hizlandi.</p>
> "Net gelir artisi tum pazarlarda goruldu."
:::
```

## 6) ChapterOpener / PartOpener
- **Pattern ID:** `chapter-opener`
- **Props Schema:** `patterns/schemas/chapter-opener.schema.json`
- **Ornek:**
```
:::pattern{type="chapter-opener" title="Part 2" subtitle="Performance Review"}
<div class="pattern__eyebrow">Bolum</div>
:::
```

## 7) CaseStudyModule
- **Pattern ID:** `case-study-module`
- **Props Schema:** `patterns/schemas/case-study-module.schema.json`
- **Ornek:**
```
:::pattern{type="case-study-module" title="Case Study: Retail"}
**Context:** Perakende kanali hizla buyuyor.
**Challenge:** Stok/tedarik dengesi.
**Outcome:** 12 haftada %9 marj artisi.
:::
```

## 8) SurveyChartPage
- **Pattern ID:** `survey-chart-page`
- **Props Schema:** `patterns/schemas/survey-chart-page.schema.json`
- **Ornek:**
```
:::pattern{type="survey-chart-page" title="Survey"}
:::chart{type="bar" variant="survey" question="En onemli faktor?" highlight="64%" sampleSize="n=120"}
```json
[{"group":"A","value":64},{"group":"B","value":36}]
```
:::
:::
```

## 9) PersistentSectionNavFooter
- **Pattern ID:** `persistent-section-nav-footer`
- **Props Schema:** `patterns/schemas/persistent-section-nav-footer.schema.json`
- **Ornek:**
```
:::pattern{type="persistent-section-nav-footer"}
Bolum 2 / Performance Review
:::
```

## 10) FigureWithCaptionAndSource
- **Pattern ID:** `figure-with-caption`
- **Props Schema:** `patterns/schemas/figure-with-caption.schema.json`
- **Ornek:**
```
:::pattern{type="figure-with-caption"}
:::figure{src="https://example.com/image.png" caption="Sekil 1" source="Kaynak"}
:::
:::
```

## 11) AppendixPage
- **Pattern ID:** `appendix-page`
- **Props Schema:** `patterns/schemas/appendix-page.schema.json`
- **Ornek:**
```
:::pattern{type="appendix-page" title="Appendix"}
- Ek A: Metodoloji
- Ek B: Terimler
:::
```

## 12) SectionDivider
- **Pattern ID:** `section-divider`
- **Props Schema:** `patterns/schemas/section-divider.schema.json`
- **Ornek:**
```
:::pattern{type="section-divider" title="Part 2" subtitle="Execution"}
<div class="pattern__eyebrow">Bolum</div>
:::
```

## 13) KpiGrid
- **Pattern ID:** `kpi-grid`
- **Props Schema:** `patterns/schemas/kpi-grid.schema.json`
- **Ornek:**
```
:::pattern{type="kpi-grid" title="KPI Snapshot"}
- ARR: $12.4M (+18%)
- NPS: 47 (+6)
- Churn: 2.1% (-0.4)
:::
```

## 14) TimelineSummary
- **Pattern ID:** `timeline-summary`
- **Props Schema:** `patterns/schemas/timeline-summary.schema.json`
- **Ornek:**
```
:::pattern{type="timeline-summary" title="Roadmap"}
- Q1: Research & alignment
- Q2: Build & rollout
- Q3: Measure & optimize
:::
```

## 15) IconList
- **Pattern ID:** `icon-list`
- **Props Schema:** `patterns/schemas/icon-list.schema.json`
- **Ornek:**
```
:::pattern{type="icon-list" title="Key Capabilities"}
- Design Systems
- Data Visualization
- Facilitation
:::
```

## 16) ProfileCard
- **Pattern ID:** `profile-card`
- **Props Schema:** `patterns/schemas/profile-card.schema.json`
- **Ornek:**
```
:::pattern{type="profile-card" title="Speaker"}
<div class="pattern__title">Jane Doe</div>
<div class="pattern__subtitle">Head of Design</div>
:::
```

## 17) CV Patterns
- **Pattern IDs:** `cv-profile`, `cv-summary`, `cv-experience`, `cv-education`, `cv-skills`, `cv-projects`, `cv-certifications`, `cv-languages`
- **Props Schemas:**
  - `patterns/schemas/cv-profile.schema.json`
  - `patterns/schemas/cv-summary.schema.json`
  - `patterns/schemas/cv-experience.schema.json`
  - `patterns/schemas/cv-education.schema.json`
  - `patterns/schemas/cv-skills.schema.json`
  - `patterns/schemas/cv-projects.schema.json`
  - `patterns/schemas/cv-certifications.schema.json`
  - `patterns/schemas/cv-languages.schema.json`
- **Ornek:**
```
:::pattern{type="cv-profile" title="Profil"}
<div class="pattern__title">Ad Soyad</div>
<div class="pattern__subtitle">Product Designer</div>
:::

:::pattern{type="cv-experience" title="Deneyim"}
- Lead Product Designer — Carbonac (2021–Now)
:::
```

---

## A11y Notlari
- Pattern basliklari hiyerarsiyi bozmamalidir (H1 -> H2 -> H3).
- `figure` kullaniliyorsa `caption` zorunlu, `source` onerilir.
- Chart ve tablo icin data fallback metni eklenmelidir.
- Kontrast ve pattern/grayscale uyumu `docs/CHART-TABLE-STANDARDS.md` ile uyumlu olmalidir.
