# Carbonac Projesi İçin Carbon-Stili PDF Referans Kütüphanesi ve Geliştirme Önerileri Raporu

## İncelenen Proje Dokümanları

- `PROJE-TALIMATLARI.md` (SoT / tasarım ve mimari kararlar)
- `IS-PLANI.md` (fazlar, KPI, teslimatlar)
- `YOL-HARITASI-REFERANS.md` (uzun vadeli referans mimari, Paged.js + Gemini akışı)
- `RASPBERRY-DOCKER.md` (runtime/deploy runbook)

> **Not (metodolojik şeffaflık):** Bu çalışma kapsamında PDF'lerin görsel sayfa render ekran görüntülerini otomatik alma aracı (screenshot) ortam kısıtı nedeniyle kullanılamadı. Bu nedenle "stil/pattern çıkarımı" PDF metin akışı + başlık/struktur ipuçları ve Carbon/IBM resmi yönergeleri üzerinden sentezlendi. Projenin kendi yol haritasında yer alan *headless Chromium ile screenshot QA + self-healing döngüsü* gerçek sistemde görsel doğrulamayı zaten hedefliyor.

---

## 1. Yürütücü Özet

Carbonac; **React + IBM Carbon (tek kaynak görünüm) + Paged.js (print CSS ile sayfalama)** üzerine kurulu, **Gemini 3 Pro "art director"** modülüyle içerikten layout yönergeleri üreten ve kuyruk/worker mimarisiyle PDF üretimini ölçekleyen bir platform olarak tanımlanmış.

Bu rapor:

1. IBM ağırlıklı **Carbon-benzeri PDF örneklerini** bir "referans kütüphanesi" olarak derler,
2. bu PDF'lerden okunabilen **layout/storytelling patternlerini** çıkarır,
3. mevcut SoT'deki kuralları (A4, margin/bleed/marks, token yaklaşımı, visual self-healing, vb.) bozmadan **Carbon PDF stil yönergesini zenginleştirir**,
4. ve bunları Carbonac mimarisine **entegre edecek kapsamlı geliştirme önerileri** sunar.

---

## 2. Mevcut SoT ve Yol Haritası: Güçlü Yönler ve Açık Noktalar

### 2.1 Güçlü Yönler

- **Tek tasarım kaynağı (SoT)** yaklaşımı net: Carbon v11 temel alınarak PDF ve web arayüzünün tipografi/grid/renk uyumu hedeflenmiş.
- **Print mühendisliği** doğru seçilmiş: Paged.js + `@page` kuralları, A4/margin/bleed/marks, sağ/sol sayfa ayrımı ve string-set header/footer yaklaşımı tanımlı.
- **Art director JSON** fikri (gridSystem + bileşen listesi + storytelling) doğru abstractions: "layout instruction" sözleşmesi hem deterministic üretimi hem de QA/self-healing'i kolaylaştırır.
- **Visual self-healing döngüsü** tasarım kalitesi için kritik: draft render → screenshot analizi → Gemini QA → CSS auto-fix → re-render.

### 2.2 Açık Noktalar

Aşağıdaki boşluklar, çıktı kalitesinde "iyi"den "IBM/Carbon düzeyinde tutarlı"ya geçiş için kritik:

1. **Template/pattern envanteri**: SoT tokenları var; fakat IBM raporlarında görülen tekrarlanabilir "modül" (Exec summary, Key findings, What to do, Case study, Quote + attribution, Mini-TOC footer…) kütüphanesi net değil.
2. **Print'e özgü tipografi eşlemesi**: SoT'de body/heading pt değerleri var; Carbon'daki type tokens / type sets (productive/expressive) ile **print pt** eşlemesi ve "min font-size / line-length / line-height" guardrail'leri daha sistematik olmalı.
3. **Grafik/tablo "sayfa davranışları"**: Paged.js break kuralları var; ancak IBM raporlarındaki gibi *chart sayfaları, sample size/source, caption, repeatable question label* gibi "data viz page template" standardı geliştirilmemiş.
4. **Determinism ve değerlendirme**: IS-PLANI'nda golden file ve regression hedefi var; fakat "Carbon-adherence score / layout-health score / readability score" gibi ölçülebilir kalite metrikleri tanımlı değil.

---

## 3. IBM Ağırlıklı Carbon-Stili PDF Referans Kütüphanesi

Aşağıdaki liste; Carbonac'ın template registry'sini beslemek için **yüksek sinyal** örnekler olacak şekilde seçildi (kurumsal rapor, IBV araştırma raporu, marka/kimlik kılavuzu, anket raporu, kısa brochure).

### 3.1 Kurumsal/IBV Araştırma Raporu Sınıfı

*Storytelling + mini navigasyon + aksiyon kutuları*

| Doküman | Açıklama |
|---------|----------|
| [IBM IBV – The enterprise in 2030][1] (63 sayfa) | Sayfa altında "Foreword \| Summary \| Prediction …" şeklinde **persistant mini-TOC/section nav** paterni (printte yön buldurma) |
| [IBM IBV – 5 Trends for 2025][2] (28 sayfa) | Trend başlıkları + "What to do" aksiyon modülü + araştırma metodolojisi blokları; raporlaşma şablonu için ideal |

### 3.2 Sorumlu Teknoloji / Governance Sınıfı

*Quote + büyük sayı + tekrar*

| Doküman | Açıklama |
|---------|----------|
| IBM Responsible Leadership Report (UK, Oct 2023) (13 sayfa) | Aynı sayfada **alıntı + attribution + büyük yüzde (97%)** tekrar eden vurgu paterni (hero statistic) |

### 3.3 Teknoloji Dönüşüm Yolculuğu / Playbook Sınıfı

*Step-by-step + case study modülleri*

| Doküman | Açıklama |
|---------|----------|
| [The quantum clock is ticking: How quantum safe is your organization?][3] (19 sayfa) | "Part two" gibi bölümlemeler, **numaralı adımlar** ve "Case study" blokları ile uzun form içerik için güçlü pattern seti |

### 3.4 Kısa Brochure / Solution Brief Sınıfı

*3 sayfa; yüksek yoğunluk*

| Doküman | Açıklama |
|---------|----------|
| IBM Quantum Safe Technology Brochure (3 sayfa) | Kısa formatta "Shortage of skills / Impending regulation …" gibi **mikro başlıklarla** yoğun bilgi; 1–3 sayfalık "one-pager" şablonu için iyi referans |

### 3.5 IBM Design/Brand Guideline Sınıfı

*Kurumsal kimlik ve layout guardrail*

| Doküman | Açıklama |
|---------|----------|
| IBM Garage Style Guide (53 sayfa) | Logotype + IBM master brand bağlamı, **clearspace**/kilitleme kuralları gibi print tasarım guardrail'leri |
| IBM Logo Guidelines for Strategic Partners (v1.2) (27 sayfa) | Logo kullanımı için compliance yaklaşımı (review/approval akışı) — "brand compliance lint" fikrini besler |
| [IBM Logo and Brand Guidelines for Third Parties][4] (PDF) | Üçüncü taraf kullanımı / placement & prominence ilkeleri |
| IBM Design for Sustainability – position paper + checklist (8 sayfa) | "Checklist" formatının PDF'de nasıl modüler sunulabileceğine referans (özellikle policy brief şablonu) |
| [IBM Event Experience Design Toolkit][5] (PDF) | Event/brand üretimlerinde tutarlı şablon yaklaşımı (kapak, ara sayfa, ikonografi) |

### 3.6 Survey / Data-Heavy Report Sınıfı

*Chart sayfası standardı*

| Doküman | Açıklama |
|---------|----------|
| IBM ROI of AI Report (Dec 2024) (77 sayfa) | "KEY FINDINGS" + section numbering + veri grafikleri + "Data Deep Dive" gibi modüller |
| IBM Sports Survey Report 2025 (78 sayfa) | Chart sayfalarında **büyük yüzde + soru etiketi + örneklem büyüklüğü** tekrar eden data viz page paterni |
| IBM Global AI Adoption Index Report (Dec 2023) | Metodoloji + örneklem büyüklüğü (sample size) formatını standartlaştırmak için iyi referans |

### 3.7 Investor Relations Sınıfı

*Daha konservatif ama standardizasyon güçlü*

| Doküman | Açıklama |
|---------|----------|
| [IBM Proxy Statement 2023][6] (95 sayfa) | Uzun yasal/kurumsal PDF'de okunabilirlik, TOC/section hiyerarşisi referansı |
| [IBM Annual Report 2022][7] | Kurumsal raporlama formatı |

> **Kütüphaneyi büyütme stratejisi:** [IBM Newsroom][8] "asPDF=1" çıktıları hızlıca çoğaltılabilir; ancak bunlar çoğunlukla press-release formatında olduğu için "yüksek tasarım sinyali" IBV/Design/Survey PDF'leri kadar yüksek olmayabilir.

---

## 4. Referans PDF'lerden Çıkarılan Carbon-Stili Pattern Sentezi

Aşağıdaki patternler, Carbonac template sisteminde "atomik modül" olarak tanımlanmaya uygundur.

### 4.1 Sayfa İçi Navigasyon (Printte Yön Buldurma)

IBV raporunda sayfalar boyunca tekrar eden "Foreword / Summary / Prediction …" mini navigasyon satırı, **web'deki breadcrumb / tab bar** işlevinin print karşılığı gibi çalışıyor. Bu, footer şablonuna entegre edilebilir.

**Pattern adı:** `PersistentSectionNavFooter`

- İçerik: `[| Bölüm 1 | Bölüm 2 | …]` + `Sayfa X/Y`
- Etki: Kullanıcı "neredeyim?" sorusunu sormaz

### 4.2 Hero Statistic + Tekrar Eden Vurgu

Responsible Leadership raporunda aynı sayfada hem alıntı hem de büyük "97%" vurgusu tekrar ediyor; bu, "tek mesajı kazıyan" tasarım paterni.

**Pattern adı:** `HeroStatWithQuote`

- Bileşenler: big-number, short claim, source/attribution, supporting paragraph

### 4.3 What to Do Aksiyon Kutuları

IBV 5 Trends raporunda "What to do" kısmı, raporu "okunur" olmaktan "uygulanır" olmaya çeviren modül.

**Pattern adı:** `ActionBox` / `WhatToDo`

- Çıktı: 3–6 maddelik eylem listesi, kısa fiil odaklı

### 4.4 Case Study Blokları

Quantum-safe raporda "Case study …" blokları; uzun raporda ritim ve kanıt sağlar.

**Pattern adı:** `CaseStudyModule`

- Alanlar: Context / Challenge / Approach / Outcome / Metrics / Source

### 4.5 Data-Viz Sayfa Standardı

Sports Survey raporunda sayfalarda soru ifadesi ve sample size tekrar ediyor; veri yoğun raporlar için "her grafik sayfası = mini story" standardı.

**Pattern adı:** `SurveyChartPage`

- Alanlar: chart title, question label, sample size, big % callout, notes, source

### 4.6 Mikro Başlıklarla Yoğun Bilgi

3 sayfalık brochure; kısa başlıklarla (Shortage of skills / Impending regulation) yoğun içerik taşır.

**Pattern adı:** `MicroHeadingStack`

- Kullanım: 1–3 sayfalık "executive one-pager", ürün broşürü

### 4.7 Brand Compliance: Logo Kilitleme/Clearspace

IBM Garage style guide, IBM master brand bağlamı ve clearspace gibi kuralları açıkça vurgular; "kapak/arka kapak" şablonlarında otomatik uygulanmalı.

---

## 5. Zenginleştirilmiş Carbon PDF Stil Yönergesi

Bu bölüm, mevcut SoT'nin (A4, margin/bleed/marks, token yaklaşımı) üzerine "IBM raporlarında görülen patternleri" ekler; tasarımın **tekrarlanabilir** olmasını hedefler.

### 5.1 Tasarım Sistemi Temeli: Carbon Token Mantığını PDF'ye Taşıma

Carbon; tipografi, spacing ve renk yönetimini "token + theme" yaklaşımıyla standardize eder. Bu yaklaşım PDF'de de korunmalı:

- **Typography:** [IBM Plex temelli tipografik hiyerarşi][9]
- **Spacing:** [2x grid ile uyumlu, iki/dört/sekiz katları üzerinden ilerleyen spacing ölçeği][10]
- **Color:** [Role-based token + theme mantığı; hex'e değil token'a bağlanma][11]

> Carbonac SoT zaten "token mapping ve tema paketleri" hedefini tanımlıyor; burada öneri, bunu PDF'ye özgü "print token pack" ile tamamlamak.

### 5.2 Sayfa Geometrisi ve Grid

**SoT/roadmap ile uyumlu temel:**

- A4, margin 20mm, bleed 3mm, crop/cross marks

**Zenginleştirme (önerilen guardrail'ler):**

- **Safe area**: Margin içinde "metin güvenli alanı" tanımla (ör. marginin içinden +4–6mm)
- **Kolon sistemi**: Carbon Grid mantığını PDF'ye sabitle (örn. 12 kolon + sabit gutter)
- **Baseline grid**: Body line-height'ı baseline'a kilitle (printte ritim artar)
- **Cilt payı**: Left/right margin farkı SoT'de var; buna "tablo/şekil genişlik sınırı" eklenmeli (tablo cilt payına taşmasın)
- **2x grid referansı**: Carbon'ın 2x grid yaklaşımı baseline ve spacing guardrail'leri için doğrudan uygulanabilir [17]

### 5.3 Tipografi: Carbon Type Tokens → Print pt Eşlemesi

[Carbon type sets (productive/expressive)][12] kavramını PDF'ye uyarlayın.
Yeni Carbon sayfaları, type set ayrımını daha net ve güncel örneklerle tanımlar [18].

**Önerilen yaklaşım:**

- "Productive" = teknik rapor, policy brief, yatırımcı dokümanı
- "Expressive" = thought leadership, marketing report, brochure

**Print guardrail önerileri (SoT ile uyumlu):**

- Body min 10pt (SoT), caption/footnote min 8pt; heading 14pt üstü (SoT)
- Satır uzunluğu: 55–85 karakter bandında tut (okunabilirlik)
- Paragraf aralığı: Carbon spacing token'larının katlarıyla yönet (ör. $spacing-03 / $spacing-05)

### 5.4 Renk: Tema + Accent Stratejisi

- [Carbon, token ve theme üzerinden renk yönetir (white, gray10, gray90, gray100)][13]
- Printte "tek accent + nötr katmanlar" yaklaşımı, IBM rapor estetiğini yakalar. (SoT'de CMYK güvenli renkler önerilmiş; bunu "accent palette" olarak resmileştirin.)

### 5.5 Modül Kütüphanesi: Carbon PDF Bileşenleri

Aşağıdaki modüller "template registry"de birer **kompozit bileşen** olmalı:

#### 1. CoverPageHero
- Logo + başlık + alt başlık + tarih + sürüm
- Brand clearspace kuralları (IBM Garage/Logo guideline referansları)

#### 2. ExecutiveSummary
- 5–8 satır özet + 3 ana madde (Key takeaways)

#### 3. KeyFindingsList
- "KEY FINDINGS" gibi bullet seti (ROI of AI örneği)

#### 4. HeroStatWithQuote
- Responsible Leadership tarzı: büyük yüzde + kısa iddia + alıntı + attribution

#### 5. WhatToDo (ActionBox)
- [IBV 5 Trends "What to do" aksiyon kutusu][2]

#### 6. ChapterOpener / PartOpener
- ["Part two:" gibi bölüm açıcı (quantum-safe rapor)][3]

#### 7. CaseStudyModule
- ["Case study" blokları (quantum-safe rapor)][3]

#### 8. SurveyChartPage
- Soru etiketi + sample size + büyük % + chart + notes (Sports Survey)

#### 9. PersistentSectionNavFooter
- [IBV mini-TOC footer yaklaşımı][1] + Sayfa X/Y

### 5.6 Veri Görselleştirme: Carbon Data-Viz İlkeleri → PDF

- [Chart türü seçimini amaçtan başlat (comparisons/trends/part-to-whole)][14]
- [Chart anatomy: başlık, eksenler, tick'ler, legend, frame gibi elementler standardize edilmeli][15]
- [Color palettes: özellikle trend/relationship chart'larda monochromatic yaklaşım][16]

**PDF'ye özgü ek guardrail'ler:**

- Min label font-size (örn. 8–9pt)
- Gridline/axis stroke'ları "printte kaybolmayacak" incelikte
- Renk körlüğü ve grayscale çıktıda ayırt edilebilirlik (pattern + marker)

---

## 6. Carbonac İçin Kapsamlı Geliştirme Önerileri

Aşağıdaki öneriler, *mevcut mimari kararlarla çelişmeden* (React + Carbon + Paged.js + Gemini; queue/worker) kaliteyi yükseltmeye yöneliktir.

### 6.1 "Print Token Pack" ve "Pattern Library"yi SoT'ye Ekleyin

**Sorun:** Token mapping var; ancak print'e özgü token alt kümesi (ör. safe-area, baseline, caption rules, figure spacing, TOC indentation) formal değil.

**Öneri teslimat:**

```
tokens/print.json
├── typography: body, caption, footnote, heading levels (pt, line-height, letter-spacing)
├── spacing: section padding, card padding, gutter, TOC indent
└── color: print-safe neutrals + 1–2 accent

patterns/
├── HeroStatWithQuote
├── SurveyChartPage
├── WhatToDo
└── CaseStudyModule
```

**Neden:** IBM raporlarının "tekrar eden modüller" kalitesini template sistemine taşır.

### 6.2 Art Director JSON Sözleşmesini İki Aşamalı Planlamaya Bölün

YOL-HARITASI'nda LayoutInstruction iskeleti doğru.

**Öneri:** Gemini çıktısını iki katmana ayırın:

1. **DocumentPlan (semantik iskelet)**
    - Bölüm hiyerarşisi, her bölümün amaç tipi (overview, evidence, action, appendix)
    - Hangi patternlerin kullanılacağı (WhatToDo/CaseStudy/ChartPage)

2. **LayoutPlan (uzamsal yerleşim)**
    - gridSystem + colSpan/offset + page-break directives

**Kazanım:** Determinism artar; QA daha net "plan ile çıktı uyumlu mu?" kontrol eder.

### 6.3 Footer Mini-TOC ve Running Header'ı Ürün Standardı Yapın

Roadmap'te header/footer string set yaklaşımı zaten var.

**Öneri:**

- Footer: `| Foreword | Summary | … |` + `Sayfa X/Y` ([IBV örneği][1])
- Header: Sol/sağ sayfada doc title / chapter title (roadmap örneği)
- Not: Running header/footer için Paged.js margin box + string-set yaklaşımı referans alınmalı [19]

### 6.4 Data-Viz Page Template Standardını Kilitleyin

**Sorun:** Carbon Charts var; ama PDF'de "her chart sayfası bir mini story" standardı yok.

**Öneri:**

- `SurveyChartPage` (soru etiketi + sample + büyük metrik + chart + notes) — Sports Survey patterni
- `FigureWithCaptionAndSource` — ROI of AI/IBV raporlarında görülen "source/methodology" yaklaşımı

**Ek:** [Carbon data-viz chart anatomy][15] + color palette kurallarını "lint" kuralına dönüştürün.

### 6.5 Visual Self-Healing'i Kural Tabanlı Lint + AI Hibritine Taşıyın

Roadmap'te döngü var.

**Öneri:** Self-healing'i iki katmanlı yapın:

**Statik PDF lint (deterministik):**
- Overflow / clip / negative margin tespiti
- Widow/orphan heuristics
- Table split kontrolü
- Min font-size, min contrast

**Gemini QA (semantik + görsel):**
- "Mesaj-hiyerarşi uyumu", "okunabilirlik", "layout denge"

**Kazanım:** AI'ı "son karar verici" değil "tasarım denetçisi" konumuna getirir; hatayı minimize eder.

### 6.6 Template Registry'yi Ürün Tipleri Üzerinden Genişletin

IS-PLANI template registry + token mapping fazı var.

**Önerilen template ailesi:**

| Template | Kullanım |
|----------|----------|
| `carbon-report-ibv` | Research brief / thought leadership |
| `carbon-report-survey` | Data-heavy |
| `carbon-policy-brief` | Checklist + recommendations |
| `carbon-onepager` | 1–3 sayfa brochure |
| `carbon-investor` | Proxy/annual-report tone |

Her template:
- Pattern seti + print token pack + theme (white/g10/g90/g100)
- "Hangi içerik tipinde hangi modül zorunlu" kuralları

### 6.7 İçerik-Odaklı Storytelling Standardını Şablona Gömün

Roadmap; data storytelling'in CEO düzeyi özet üretmesini hedefliyor.

**Öneri:** Storytelling'i "modül zorunluluğu" yapın:

- Her rapor: `ExecutiveSummary` + `KeyFindings` + `WhatToDo` (en az 1)
- Her grafik: `Insight` (1–2 cümle; "ne görüyoruz?") + `Implication` (1 cümle; "ne yapacağız?")

[IBV raporları bu yapıyı doğal olarak taşıyor.][2]

### 6.8 Brand Compliance ve Legal Üretim Hattı

SoT'de font embedding zorunlu; printte linklerin URL olarak yazdırılması gibi kurallar var.

**Öneri:**

- **Brand compliance lint:** Logo clearspace, yanlış lockup, eksik trademark satırı, eksik copyright (IBM Garage/Logo guideline referansları)
- **Legal footer pack:** Copyright, trademarks, source references; template türüne göre otomatik
- Ek kaynaklar: IBM Design Language portalı ve stratejik partner logo rehberi [20][21]

### 6.9 Ölçülebilir Kalite Metrikleri Ekleyin

IS-PLANI KPI'ları performans/başarı odaklı; tasarım kalitesi için metrik yok.

**Önerilen kalite skorları:**

| Skor | Açıklama |
|------|----------|
| **Carbon Adherence Score (0–100)** | Token dışı renk/font kullanımı, spacing grid ihlalleri, type hierarchy ihlalleri |
| **Layout Health Score** | Overflow, widows/orphans, table splits, image DPI/scale anomalies |
| **Readability Score** | Line length, heading density, whitespace ratio (template bazlı hedef) |

Golden file + regression zaten planlı; skorlar bunu nicelleştirir.

### 6.10 CarbonPress Yaklaşımı: "Press Pack" ve İçerik Modeli

CarbonPress sistemindeki fikirleri (modüler içerik, paketlenmiş şablon, preflight ve yayın akışı) Carbonac mimarisine şu şekilde entegre edebiliriz:

- **Press Pack (paket şablon)**: `template + print tokens + pattern set + QA rules + sample content`
  - Template registry kaydının aktif versiyonu bu paketin referansı olur.
  - Paged.js print kuralları (break, header/footer, widows/orphans) paketin parçası olur.
- **Content schema / frontmatter**: içerik dosyalarında `docType`, `templateKey`, `layoutProfile`, `printProfile`, `theme`, `locale`, `version` alanlarını standardize edin.
  - Bu alanlar Art Director JSON sözleşmesi ile birebir eşleşir.
- **Block catalog**: içerik blokları (ExecutiveSummary, KeyFindings, WhatToDo, SurveyChartPage) tek bir `blockType` sözlüğüne bağlanır.
  - Gemini, sadece bu sözlükteki modülleri seçer; determinism artar.
- **Release manifest**: her PDF çıktısı, kullanılan template/version/tokens/hash bilgisini metadata içine gömer.
  - Golden file ve regression testleri için tam izlenebilirlik sağlar.

### 6.11 CarbonPress Yayın Akışı: Editorial + Preflight

CarbonPress'teki "yayın hattı" yaklaşımını Carbonac iş akışına uyarlayın:

- **Editorial states**: `draft → review → approved → published`
  - `template_version` ve `content_version` ayrı versiyonlanır.
- **Preflight gate**: çıkış öncesi deterministik lint + AI QA birlikte koşar.
  - Lint başarısızsa PDF render tamamlanmış olsa bile "publish" edilmez.
- **Output bundling**: PDF + JSON manifest + asset list (font/brand) aynı job sonucunda saklanır.
  - Arşivlenebilir ve yeniden üretilebilir çıktı paketi oluşur.

### 6.12 Akademik/Sağlık Raporu Üretimi İçin Research Template

Bu, isteğe bağlı ama kullanım alanıyla doğal örtüşür:

- `carbon-research-report` şablonu: abstract, methods, results, tables/figures, references
- CSL/DOI tabanlı kaynakça modülü (footnote + endnote + bibliography)
- "Evidence box": kanıt düzeyi / guideline özeti (policy brief benzeri)

Bu öneri SoT'yi bozmaz; yalnızca yeni template/pattern seti ekler.

---

## 7. Önerilen Teslimatlar ve Minimum Mükemmellik Checklist'i

### 7.1 Teslimat Paketi

1. **PDF Reference Library Repo**
    - `library/` altına PDF'ler (veya link manifestleri)
    - `metadata/` her PDF için YAML/JSON

2. **Pattern Library (React)**
    - Bölüm 5.5'teki 8–10 modülün ilk sürümü

3. **Print Token Pack**
    - `tokens/print.json` + tema varyantları

4. **PDF Lint + QA Harness**
    - Statik kurallar + AI QA prompt seti

5. **Template Registry Seed**
    - 4–5 template ailesi + örnek içerik

6. **Press Pack Manifest**
    - Template + token + pattern + QA rule versiyon bilgileri
    - Output manifest (job result) ile birebir eşleşir

### 7.2 "Done = IBM-grade PDF" Kontrol Listesi

- [ ] A4 + margin/bleed/marks ve left/right cilt payı doğru
- [ ] Footer: Sayfa X/Y + (opsiyonel) mini-TOC
- [ ] En az 1 adet: Key Findings + What to do
- [ ] Veri sayfalarında: caption + source + sample size standardı
- [ ] Quote + attribution modülü (uygunsa)
- [ ] Case study modülü (uygunsa)
- [ ] [Carbon typography/spacing/color token ilkeleri][9] ihlal edilmiyor
- [ ] Font embedding ve min pt kuralları sağlanıyor
- [ ] Visual self-healing döngüsü en az 1 iterasyon çalıştırıldı

---

## Ek A: PDF Kütüphanesi İçin Önerilen Metadata Şeması (YAML)

```yaml
id: ibm-ibv-5trends-2025
title: "5 Trends for 2025: Ignite innovation with people-powered AI"
publisher: "IBM Institute for Business Value"
year: 2024
type: research-brief
pages: 28
source_url: "<pdf url>"
design_tags:
  - cover-hero-title
  - key-findings
  - what-to-do
  - methodology
  - chart-with-source
  - section-numbering
patterns_to_extract:
  - WhatToDo
  - KeyFindingsList
  - ChapterOpener
  - FigureWithCaptionAndSource
navigation:
  has_persistent_footer_nav: false
  has_running_header: true
notes:
  - "Use as baseline for research brief template."
```

---

## Ek B: Pattern Envanteri — Carbonac PDF Bileşen Sözlüğü

### Atomikler
Heading, Paragraph, List, Caption, Footnote, Badge, Divider

### Kompozitler
CoverPageHero, ExecutiveSummary, KeyFindingsList, WhatToDo, HeroStatWithQuote, CaseStudyModule, SurveyChartPage, ChapterOpener

### Sayfa Şablonları
ResearchBriefPage, DataVizPage, CaseStudyPage, AppendixPage

### Sistem Bileşenleri
PersistentSectionNavFooter, RunningHeaderStrings, PageBreakDirectives

---

## Ek C: IBM Kaynaklı Çekirdek PDF Seti

Aşağıdaki PDF'ler indeksin **IBM-01…IBM-07** kayıtlarıdır; tamamı IBM kaynaklıdır:

| Doküman | URL |
|---------|-----|
| IBM iX Brand Guidelines | https://www.ibm.com/design/event/files/IBM_iX_Brand_Guidelines_101218.pdf |
| IBM Garage Style Guide | https://www.ibm.com/design/event/files/Garage_Style_Guide_V1_040219.pdf |
| Think Brand Guidelines — Think Summit Assets | https://www.ibm.com/design/event/files/200903_IBM_ThinkSummit2020_guidelines.pdf |
| Event Experience Design Toolkit | https://www.ibm.com/design/event/files/IBM-Event-Experience-Design-Toolkit.pdf |
| Digital Event Design Toolkit | https://www.ibm.com/design/event/files/220204_Digital_Event_Design_Toolkit.pdf |
| IBM Design for sustainability — position paper | https://www.ibm.com/design/practices/design-for-sustainability/design-for-sustainability-positionpaper.pdf |
| IBM Software Engineering for sustainability | https://www.ibm.com/design/practices/engineering-for-sustainability/IBM-engineering-for-sustainability.pdf |

---

## Ek D: Carbon → PDF Eşleştirme Mantığı

| Carbon Kavramı | PDF Eşlemesi |
|----------------|--------------|
| [2x Grid][10] | Sayfa ızgarası + baz ölçü (ritim) |
| [Spacing tokens/scale][10] | Boşluk ölçeği (2/4/8/16/24…) ile paragraf, başlık-altı, bloklar arası mesafe yönetimi |
| [Type tokens / type sets][9] | PDF tip hiyerarşisi: H1/H2/H3/Body + "productive vs expressive" yaklaşımı |
| [Color tokens + themes][11] | Rol-temelli renk rolleri (link, vurgu, uyarı, başarı, yüzey/arka plan) |

---

## Ek E: Tipografi Önerileri

| Element | Boyut | Not |
|---------|-------|-----|
| H1 | 20–28 pt | Bölüm açılışı / kapak |
| H2 | 14–18 pt | — |
| H3 | 11–13 pt | — |
| Body | 10–11 pt | Leading 1.3–1.5 |
| Dipnot/etiket | 8–9 pt | — |

> **Not:** Carbon tipografi rehberleri, okunabilirlik ve düzen için **sol hizayı** merkeze hizalamaya tercih eder.

---

## Ek F: Erişilebilirlik ve Üretim Kontrolü

Carbon ekosistemi erişilebilirliği bileşen düzeyinde gömülü ele alır; PDF'de bu, üretim öncesi **preflight** kontrol listesine çevrilmelidir.

**Minimum PDF kontrol listesi:**

- [ ] Başlık yapısı (H1/H2/H3) tutarlı mı?
- [ ] Okuma sırası mantıklı mı (tagging/reading order)?
- [ ] Linkler tıklanabilir mi ve ayırt edilebilir mi?
- [ ] Kontrast yeterli mi (özellikle veri görsellerinde)?
- [ ] Tablolarda başlık satırı / hizalama / satır yüksekliği düzenli mi?
- [ ] Yer imleri (bookmarks) ve meta veriler (başlık, yazar, konu) var mı?
- [ ] PDF erişilebilirlik checklist'i (tagging, reading order, form fields) tamam mı? [22]
- [ ] Reading order kontrolleri (Heading tags -> bookmarks) doğrulandı mı? [23]

---

## Ek G: Press Pack Manifest Schema (JSON/YAML)

Press Pack, template + token + pattern + QA rule + content schema bilgisini tek bir manifestte toplar.

**JSON Schema (ozet):**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PressPackManifest",
  "type": "object",
  "required": [
    "schemaVersion",
    "pressPack",
    "template",
    "tokens",
    "blockCatalog",
    "patterns",
    "qaRules",
    "contentSchema",
    "sampleContent"
  ],
  "properties": {
    "schemaVersion": { "type": "string", "pattern": "^v[0-9]+\\.[0-9]+$" },
    "pressPack": {
      "type": "object",
      "required": ["id", "version", "status"],
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "version": { "type": "string" },
        "status": { "type": "string", "enum": ["draft", "review", "approved", "published"] },
        "description": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "hash": { "type": "string" }
      }
    },
    "template": {
      "type": "object",
      "required": ["key", "version", "engine", "layoutProfile", "printProfile", "theme"],
      "properties": {
        "key": { "type": "string" },
        "version": { "type": "string" },
        "templateVersionId": { "type": "string" },
        "engine": { "type": "string", "enum": ["pagedjs"] },
        "engineVersion": { "type": "string" },
        "layoutProfile": { "type": "string", "enum": ["symmetric", "asymmetric", "dashboard"] },
        "printProfile": { "type": "string" },
        "theme": { "type": "string", "enum": ["white", "g10", "g90", "g100"] }
      }
    },
    "tokens": {
      "type": "object",
      "properties": {
        "tokenPack": {
          "type": "object",
          "required": ["id", "version"],
          "properties": {
            "id": { "type": "string" },
            "version": { "type": "string" },
            "hash": { "type": "string" },
            "overrides": { "type": "object" }
          }
        },
        "typography": { "type": "object" },
        "spacing": { "type": "object" },
        "color": { "type": "object" },
        "print": { "type": "object" }
      }
    },
    "blockCatalog": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["blockType"],
        "properties": {
          "blockType": { "type": "string" },
          "required": { "type": "boolean" },
          "allowedComponents": { "type": "array", "items": { "type": "string" } },
          "constraints": { "type": "object" }
        }
      }
    },
    "patterns": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "blockType"],
        "properties": {
          "id": { "type": "string" },
          "blockType": { "type": "string" },
          "required": { "type": "boolean" },
          "minCount": { "type": "integer" },
          "maxCount": { "type": "integer" },
          "components": { "type": "array", "items": { "type": "string" } },
          "rules": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "qaRules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "severity"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "scope": { "type": "string", "enum": ["document", "page", "block"] },
          "severity": { "type": "string", "enum": ["low", "medium", "high"] },
          "blocking": { "type": "boolean" },
          "selector": { "type": "string" },
          "action": { "type": "string" }
        }
      }
    },
    "contentSchema": {
      "type": "object",
      "required": ["schemaRef", "requiredFields"],
      "properties": {
        "schemaRef": { "type": "string" },
        "requiredFields": { "type": "array", "items": { "type": "string" } },
        "optionalFields": { "type": "array", "items": { "type": "string" } },
        "aliases": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
    "sampleContent": {
      "type": "object",
      "required": ["frontmatter", "body"],
      "properties": {
        "frontmatter": { "type": "object" },
        "body": { "type": "string" },
        "assets": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

**YAML ornek:**

```yaml
schemaVersion: v1.0
pressPack:
  id: presspack-carbon-report
  name: "Carbon Report Pack"
  version: "1.2.0"
  status: approved
  tags: [report, ibm]
metadata:
  createdAt: "2025-02-01T10:00:00Z"
  updatedAt: "2025-02-10T12:30:00Z"
  hash: "sha256:38f5b2d..."
template:
  key: carbon-report
  version: "1.2.0"
  templateVersionId: tmpl_ver_123
  engine: pagedjs
  engineVersion: "0.4.x"
  layoutProfile: symmetric
  printProfile: pagedjs-a4
  theme: white
tokens:
  tokenPack:
    id: carbon-print-pack
    version: "0.3.0"
    hash: "sha256:9c1aa0c..."
  typography:
    body: body-01
    heading: heading-04
  spacing:
    base: 8
  color:
    accent: blue-60
  print:
    margin: 20mm
    bleed: 3mm
blockCatalog:
  - blockType: ExecutiveSummary
    required: true
    allowedComponents: [Heading, Paragraph, List]
patterns:
  - id: executive-summary
    blockType: ExecutiveSummary
    minCount: 1
    maxCount: 1
    required: true
    components: [Heading, Paragraph, List]
    rules: [summary-first]
qaRules:
  - id: no-widow
    type: widow
    scope: block
    severity: high
    blocking: true
    action: avoid-break
contentSchema:
  schemaRef: presspack://schemas/content/v1
  requiredFields: [docType, templateKey, layoutProfile, printProfile, theme, locale, version]
  optionalFields: [author, date, tone, documentType]
  aliases:
    documentType: docType
sampleContent:
  frontmatter:
    title: "Quarterly Report"
    docType: report
    documentType: report
    templateKey: carbon-report
    layoutProfile: symmetric
    printProfile: pagedjs-a4
    theme: white
    locale: tr-TR
    version: "1.0"
  body: |
    # Executive Summary
    Kisa ozet metni burada yer alir.
```

---

## Kaynaklar

| Kaynak | URL |
|--------|-----|
| Carbon Typography | [carbondesignsystem.com/elements/typography/overview][9] |
| Carbon Spacing | [carbondesignsystem.com/elements/spacing/overview][10] |
| Carbon Color | [carbondesignsystem.com/elements/color/overview][11] |
| Carbon Data Visualization | [carbondesignsystem.com/data-visualization/chart-types][14] |
| IBM IBV – The enterprise in 2030 | [ibm.com/downloads/documents/us-en/1550f812c451680b][1] |
| IBM IBV – 5 Trends for 2025 | [ibm.com/downloads/documents/us-en/11630e2b96302ccc][2] |
| Quantum-safe rapor | [community.ibm.com][3] |
| IBM Logo Guidelines for Third Parties | [ibm.com/design/language/files/IBM_Logo_3rdParties_300822.pdf][4] |
| IBM Event Experience Design Toolkit | [ibm.com/design/event/files/IBM-Event-Experience-Design-Toolkit.pdf][5] |
| IBM Proxy Statement 2023 | [ibm.com/investor/att/pdf/IBM_Proxy_2023.pdf][6] |
| IBM Annual Report 2022 | [ibm.com/investor/att/pdf/IBM_Annual_Report_2022.pdf][7] |
| IBM Newsroom | [newsroom.ibm.com][8] |
| IBM Global AI Adoption Index Report (Dec 2023) | [filecache.mediaroom.com][24] |
| Carbon 2x Grid | [v10.carbondesignsystem.com/guidelines/2x-grid/implementation/][17] |
| Carbon Type Sets (v11) | [v11.carbondesignsystem.com/guidelines/typography/type-sets][18] |
| Paged.js Margin Boxes & String-Set | [pagedjs.org/en/documentation/7-generated-content-in-margin-boxes/][19] |
| IBM Design Language | [ibm.com/design/language][20] |
| IBM Logo Guidelines (Strategic Partners) | [ibm.com/design/language/files/IBM_logo_guidelines_strategic_partners_v_1_2.pdf][21] |
| Adobe PDF Accessibility Checklist | [webstandards.ca.gov][22] |
| Adobe Reading Order Tool | [helpx.adobe.com][23] |

[1]: https://www.ibm.com/downloads/documents/us-en/1550f812c451680b "The enterprise in 2030"
[2]: https://www.ibm.com/downloads/documents/us-en/11630e2b96302ccc "5 Trends for 2025"
[3]: https://community.ibm.com/HigherLogic/System/DownloadDocumentFile.ashx?DocumentFileKey=5a489d1d-967b-3b31-d876-2ddbcbea828a&forceDialog=0 "The quantum clock is ticking: How quantum safe is your organization?"
[4]: https://www.ibm.com/design/language/files/IBM_Logo_3rdParties_300822.pdf "IBM Logo and Brand Guidelines for Third Parties"
[5]: https://www.ibm.com/design/event/files/IBM-Event-Experience-Design-Toolkit.pdf "Event Experience Design Toolkit"
[6]: https://www.ibm.com/investor/att/pdf/IBM_Proxy_2023.pdf "IBM Proxy Statement 2023"
[7]: https://www.ibm.com/investor/att/pdf/IBM_Annual_Report_2022.pdf "IBM Annual Report 2022"
[8]: https://newsroom.ibm.com/2024-11-12-new-ibm-report-shows-strong-tailwinds-behind-corporate-investment-in-ai-for-sustainability-but-ambitions-dont-yet-match-actions?asPDF=1 "IBM Newsroom"
[9]: https://carbondesignsystem.com/elements/typography/overview/ "Typography"
[10]: https://carbondesignsystem.com/elements/spacing/overview/ "Spacing"
[11]: https://carbondesignsystem.com/elements/color/overview/ "Color"
[12]: https://v10.carbondesignsystem.com/guidelines/typography/overview/ "Typography – Carbon Design System"
[13]: https://carbondesignsystem.com/elements/themes/overview/ "Themes"
[14]: https://carbondesignsystem.com/data-visualization/chart-types/ "Data visualization: Chart types"
[15]: https://carbondesignsystem.com/data-visualization/chart-anatomy/ "Chart anatomy"
[16]: https://carbondesignsystem.com/data-visualization/color-palettes/ "Data visualization color palettes"
[17]: https://v10.carbondesignsystem.com/guidelines/2x-grid/implementation/ "2x Grid"
[18]: https://v11.carbondesignsystem.com/guidelines/typography/type-sets "Type sets"
[19]: https://pagedjs.org/en/documentation/7-generated-content-in-margin-boxes/ "Paged.js margin boxes"
[20]: https://www.ibm.com/design/language/ "IBM Design Language"
[21]: https://www.ibm.com/design/language/files/IBM_logo_guidelines_strategic_partners_v_1_2.pdf "IBM Logo Guidelines for Strategic Partners"
[22]: https://webstandards.ca.gov/wp-content/uploads/sites/8/2025/03/adobe-pdf-accessibility-checklist.pdf "Adobe PDF Accessibility Checklist"
[23]: https://helpx.adobe.com/acrobat/using/touch-reading-order-tool-pdfs.html "Reading Order tool for PDFs"
[24]: https://filecache.mediaroom.com/mr5mr_ibmspgi/179414/download/IBM%20Global%20AI%20Adoption%20Index%20Report%20Dec.%202023.pdf "IBM Global AI Adoption Index Report"
