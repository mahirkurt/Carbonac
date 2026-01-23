# Carbonac (mevcut SoT) vs CarbonPress (yeni öneri): Fark Analizi + Entegrasyon ve Yapısal Revizyon Önerileri

Aşağıdaki analiz, **Carbonac’ın SoT dokümanları** (`PROJE-TALIMATLARI.md`, `IS-PLANI.md`, `YOL-HARITASI-REFERANS.md`) ile **ekli CarbonPress tasarım dokümanı** (`PROJECT_DESIGN_DOCUMENT.md`) arasındaki farkları; ayrıca CarbonPress’teki daha güçlü kısımların Carbonac mimarisine **SoT bozmadan** nasıl entegre edilebileceğini ve “CarbonPress yaklaşımı daha makulse” **hangi yapısal değişikliklerin** gerekeceğini kapsar.

---

## 1) Ürün formu ve “problem tanımı” farkı

### Carbonac’ın odağı (SaaS / platform)

* **Web UI + editor/preview + şablon seçimi + job/queue/worker + storage + auth + AI art director** odaklı bir **platform ürünü**.

  * React + Carbon Components “tek kaynak görünüm”, PDF tarafında **Paged.js** (print CSS + pagination), iş yürütmede Redis/BullMQ, auth/storage’da Supabase. (`PROJE-TALIMATLARI.md` L20–37; `IS-PLANI.md` L23–42)
* PDF kalitesi için “**visual self-healing**” (headless Chromium screenshot + Gemini QA + auto-fix) gibi **AI destekli kalite döngüsü** hedefleniyor. (`YOL-HARITASI-REFERANS.md` L154–166; `IS-PLANI.md` L111–118, L213–217)

### CarbonPress’in odağı (pipeline / CLI / CI entegrasyonu)

* “Enterprise-grade Markdown→PDF pipeline” + **CI/CD entegrasyonu** + **CLI** + “çoklu çıktı formatları” (PDF/HTML/EPUB/PNG). (`PROJECT_DESIGN_DOCUMENT.md` L39–49, L925–936, L1109–1126)
* Mimari “unified.js plugin chain + Nunjucks template + SCSS→Print CSS + Puppeteer render + pdf-lib post-process + QA otomasyonu” şeklinde tasarlanmış. (`PROJECT_DESIGN_DOCUMENT.md` L121–149, L170–223)

**Sonuç:** CarbonPress, Carbonac’ın “ürünleşmiş platform” hedefini değil; daha çok “kurumsal dokümantasyon üretim hattı/CLI aracı” hedefini örnekliyor. Bu yüzden “birebir alternatif” değil; **pipeline/QA/typography** tarafında güçlü bir referans.

---

## 2) Mimari farklar: Karşılaştırmalı matris

| Boyut                 | Carbonac (SoT)                                                                                           | CarbonPress (Yeni)                                                                                     | Kritik yorum                                                                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ürün biçimi           | Web app + job queue + storage                                                                            | CLI/pipeline + CI/CD                                                                                   | CarbonPress yaklaşımı Carbonac’a “CLI modu” olarak eklenebilir; platformu ikame etmez.                                                                                                                                                           |
| Render “tek kaynak”   | React + Carbon Components “tek kaynak görünüm” (`PROJE-TALIMATLARI.md` L30–31)                           | Nunjucks template + HTML üretimi (`PROJECT_DESIGN_DOCUMENT.md` L126–129)                               | Nunjucks’a geçiş, Carbonac’ın “tek kaynak görünüm” prensibini **zayıflatır** (çift render yolu).                                                                                                                                                 |
| PDF pagination/print  | Paged.js (print CSS + sayfalandırma) (`PROJE-TALIMATLARI.md` L31–33, L271–278)                           | Puppeteer “primary engine” (`PROJECT_DESIGN_DOCUMENT.md` L145–149, L766–792)                           | Chromium artık bazı margin-box özelliklerini destekliyor (Chrome 131) ([Chrome for Developers][1]); fakat `string-set` ve `target-counter` hâlâ “future possibilities / bug” alanında ([Chrome for Developers][1]) → Paged.js hâlâ yüksek değer. |
| AST & plugin mimarisi | “Parser: AST parse, classification” hedef; teknoloji seçimi açık (`IS-PLANI.md` L36–41)                  | unified/remark/rehype + plugin chain açıkça tanımlı (`PROJECT_DESIGN_DOCUMENT.md` L231–237, L304–331)  | CarbonPress’in en “transfer edilebilir” katkısı: deterministik AST pipeline.                                                                                                                                                                     |
| Direktiflerle bileşen | SoT’de açık bir directive dili tanımlı değil                                                             | `:::callout`, `:::chart`, `:::data-table` vb + mapping sözlüğü (`PROJECT_DESIGN_DOCUMENT.md` L601–705) | Carbonac’ta AI’ye ek olarak “explicit directives” büyük hız kazandırır ve deterministik kalite sağlar.                                                                                                                                           |
| Tipografi             | IBM Plex, type scale, tokens vs tanımlı (`PROJE-TALIMATLARI.md` L72–90, L271–278)                        | OpenType features + hyphenation + microtypography (`PROJECT_DESIGN_DOCUMENT.md` L440–508)              | Bu katman Carbonac’ın PDF kalitesini belirgin yükseltir.                                                                                                                                                                                         |
| QA otomasyonu         | Golden file + e2e + self-healing hedefleri (`IS-PLANI.md` L201–206; `YOL-HARITASI-REFERANS.md` L154–166) | axe-core audit + typography scoring + visual regression (`PROJECT_DESIGN_DOCUMENT.md` L819–862)        | CarbonPress’in QA yaklaşımı, Carbonac’taki AI self-healing’in “ön kapısı” olarak konumlanmalı: önce deterministik test, sonra AI düzeltme.                                                                                                       |
| Veri görselleştirme   | Carbon Charts referansı var (`PROJE-TALIMATLARI.md` L186–194)                                            | Chart.js + D3 + Mermaid (`PROJECT_DESIGN_DOCUMENT.md` L136–138, L731–742)                              | Chart.js varsayılan olarak **canvas** tabanlıdır ([chartjs.org][2]) → baskıda vektör kalite için D3/SVG veya Carbon Charts (D3 tabanlı) daha güvenli.                                                                                            |
| Erişilebilirlik       | Web için WCAG 2.1 AA prensipleri SoT’de var (`PROJE-TALIMATLARI.md` L254–257)                            | “WCAG 2.1 AA garantisi” + axe-core kural etiketleri (`PROJECT_DESIGN_DOCUMENT.md` L84–88, L821–835)    | axe-core WCAG etiketleriyle çalışır ([Deque][3]); ancak bu “HTML erişilebilirliği”dir. PDF/UA hedefleniyorsa ayrı strateji gerekir.                                                                                                              |

---

## 3) CarbonPress’ten Carbonac’a “yüksek değerle” entegre edilebilecek parçalar

Aşağıdakiler **SoT’yi bozmadan** entegre edilebilir (hatta Carbonac’ın `IS-PLANI.md` hedefleriyle doğrudan örtüşüyor).

### 3.1 unified/remark/rehype tabanlı **AST pipeline** (yüksek getiri, orta efor)

CarbonPress, parse/transform/convert hattını net tarif ediyor: remark→MDAST→plugin chain→rehype→HAST→template→render. (`PROJECT_DESIGN_DOCUMENT.md` L172–223, L304–331)

**Carbonac entegrasyonu (öneri):**

* Carbonac’ın “Parser: AST parse, content classification” katmanını (`IS-PLANI.md` L36–41) **unified.js** ile somutlayın.
* Çıktı hedefi “HTML string” değil; **“Component AST”** olsun:

  * Markdown → MDAST
  * MDAST → (directive + table + codeblock + callout + chart) → **Component AST**
  * Component AST → React component tree (Carbon Components) → HTML
  * HTML → Paged.js pagination → headless print → PDF

**Neden kritik:**
Bu yaklaşım, “AI art director”u tamamen kaldırmadan, **deterministik bir taban** sağlar. AI, yalnızca “layout kararları / istisnalar / self-healing” için devreye girer.

---

### 3.2 “Custom directives” ile **explicit Carbon bileşen çağırımı** (yüksek getiri, düşük-orta efor)

CarbonPress’in directive söz dizimi ve mapping sözlüğü doğrudan transfer edilebilir: `:::callout`, `:::data-table`, `:::chart`, `:::figure`, `:::accordion`, `:marginnote[]` vb. (`PROJECT_DESIGN_DOCUMENT.md` L603–672, L674–705)

**Carbonac entegrasyonu (öneri):**

* Markdown editörde “Directive palette / Insert component” UI ekleyin:

  * kullanıcı bir callout eklemek istediğinde `:::callout[info]{title=""}` snippet’i eklenir
  * preview’de Carbon `InlineNotification` render edilir (print’te close button yok, static)
* Directive mapping’i, Carbonac template registry + token mapping’in “component catalog”u ile birleştirin (`IS-PLANI.md` L123–135).

**UI/UX kazanımı:**
Kullanıcı “AI’ye güvenmeden” deterministik olarak doğru bileşeni seçer; AI yalnızca düzen/yerleşim optimizasyonu yapar.

---

### 3.3 Tipografik mükemmellik katmanı (yüksek getiri, orta efor)

CarbonPress’in en güçlü farkı “yayıncılık kalitesi”: OpenType features + heceleme + microtypography. (`PROJECT_DESIGN_DOCUMENT.md` L440–508)

**Carbonac entegrasyonu (öneri):**

* Print CSS’e `font-feature-settings` ve metin render optimizasyonlarını ekleyin (`PROJECT_DESIGN_DOCUMENT.md` L442–456).
* Heceleme:

  * CSS `hyphens: auto` + limit kuralları (`PROJECT_DESIGN_DOCUMENT.md` L480–486)
  * Tarayıcı hyphenation kalitesi/dil kapsamı yetersizse polyfill (ör. Hyphenopoly) opsiyonunu değerlendirin (`PROJECT_DESIGN_DOCUMENT.md` L1032–1034).
* Microtypography:

  * `remarkSmartypants` benzeri dönüşümleri **dil aware** uygulayın (TR/EN ayrımı). (`PROJECT_DESIGN_DOCUMENT.md` L317–319, L489–508)
  * Özellikle bilimsel/klinik PDF’lerde otomatik “tırnak/dash/fraction” dönüşümleri **reprodüksiyon riskine** (exact quote, DOI, kimyasal ad, istatistiksel ifade) dikkat edilerek **opt-in** olmalı.

---

### 3.4 Render katmanı: “Paged.js + headless Chromium” hibriti + pdf-lib postprocess (yüksek getiri, düşük-orta efor)

Carbonac zaten “PDF Engine: headless render + print optimizer” diyerek Chromium tarafını öngörüyor (`IS-PLANI.md` L41–42) ve Paged.js’i SoT yapıyor (`PROJE-TALIMATLARI.md` L31–33, L271–278).

CarbonPress’in Puppeteer ayarları ve postprocess yaklaşımı iyi bir şablon: (`PROJECT_DESIGN_DOCUMENT.md` L766–815)

* `preferCSSPageSize: true`, `printBackground: true`, `displayHeaderFooter` vb.
* `pdf-lib` ile metadata, watermark, compress, PDF/A flag.

**Kritik teknik gerçek (strateji kararı):**

* Chrome 131 ile margin box içerik eklemek mümkün oldu ([Chrome for Developers][1]).
* Ancak `string-set` (running headers) ve `target-counter` (TOC sayfa numarası / cross-ref) hâlâ tarayıcıda “gelecek özellik / bug” olarak duruyor ([Chrome for Developers][1]).
* Paged.js bu paged-media özelliklerini sağlamak için tasarlanmış; named strings örneği dokümantasyonda var ([pagedjs.org][4]).

**Bu nedenle Carbonac için optimal yaklaşım:**

* **Paged.js = pagination/layout engine**
* **Puppeteer/Playwright = headless “print to PDF” motoru**
* **pdf-lib = post-processing (metadata, watermark, optimize)**

Bu hibrit, SoT ile uyumlu kalırken CarbonPress’in “pipeline gerçekçiliğini” taşır.

---

### 3.5 QA otomasyonu: “deterministik test kapısı → AI self-healing” (çok yüksek getiri, orta efor)

CarbonPress QA katmanı:

* axe-core ile WCAG audit (`PROJECT_DESIGN_DOCUMENT.md` L821–835)
* Typography scoring (`PROJECT_DESIGN_DOCUMENT.md` L838–848)
* Visual regression (`PROJECT_DESIGN_DOCUMENT.md` L850–862)

Axe-core kurallarının WCAG etiketleri üzerinden çalıştığı Deque dokümanlarında açık ([Deque][3]).

**Carbonac entegrasyonu (öneri):**

* Job pipeline’a “QA stage” ekleyin:

  1. Markdown lint (zaten planlı: heading hierarchy vs) (`IS-PLANI.md` L116–121)
  2. HTML accessibility audit (axe-core)
  3. Typography scoring (line length, widows/orphans, hyphenation density)
  4. Visual regression (golden screenshot diff)
  5. Fail/Warning politikası
* **AI self-healing** yalnızca şu durumda:

  * QA fail + “auto-fix uygulanabilir” sınıfı (ör. `break-inside: avoid` ekleme, tabloyu sayfa başına taşıma, görseli küçültme)
  * Bu da zaten Carbonac yol haritasında var (`YOL-HARITASI-REFERANS.md` L154–166).

Bu düzen, AI’yi “ilk savunma hattı” olmaktan çıkarıp, **son çare + iyileştirici** yapar; reprodüksiyon ve determinism artar.

---

### 3.6 Çoklu çıktı formatları ve build cache/concurrency (orta getiri, orta efor)

CarbonPress:

* PDF + HTML + EPUB + PNG hedefliyor (`PROJECT_DESIGN_DOCUMENT.md` L925–936)
* Build’de parallel + cache (`PROJECT_DESIGN_DOCUMENT.md` L1099–1103)

**Carbonac için pragmatik entegrasyon:**

* Kısa vadede: **PNG thumbnail** (template gallery için zaten gerekli: “mini PDF/PNG” hedefi var) (`IS-PLANI.md` L125–129)
* Orta vadede: HTML export (zaten preview HTML var)
* EPUB: Carbonac’ın ürün odağına göre opsiyonel; şimdilik “future”.

Cache:

* Aynı MD + aynı template + aynı theme için render cache (hash tabanlı)
* Worker concurrency: BullMQ ile controlled parallelism (CarbonPress’teki `maxConcurrency` fikriyle paralel)

---

## 4) CarbonPress “daha makul” ise Carbonac’ta hangi yapısal değişiklikler gerekir?

Burada iki farklı senaryo var:

### Senaryo A — “SoT korunur; CarbonPress parçaları içeri alınır” (önerilen)

**Değişiklik seviyesi:** orta
**SoT uyumu:** yüksek

* Render tek kaynağı **React + Carbon** kalır (`PROJE-TALIMATLARI.md` L30–31).
* CarbonPress’ten:

  * unified tabanlı parser + plugin chain
  * directive DSL
  * typography/microtypography/hyphenation
  * QA otomasyonu
  * puppeteer ayarları + pdf-lib postprocess
  * CI workflow şablonları
    alınır.

Bu senaryoda “Nunjucks template engine” **alınmaz**; çünkü React ile ikinci bir template katmanı, Carbonac’ın “tek kaynak görünüm” ilkesini fiilen bozar.

### Senaryo B — “CarbonPress mimarisine pivot” (yüksek risk / SoT revizyonu gerekir)

**Değişiklik seviyesi:** yüksek
**SoT uyumu:** düşük (SoT güncellenmeden yapılamaz)

Pivotun anlamlı olacağı durumlar:

* Ürün hedefiniz “SaaS editör + AI art director” değil de,
* “CI/CD’de batch üretilen kurumsal/regulatory PDF üretim hattı” ise.

Gereken temel revizyonlar:

* “Rendering motoru” SoT’si React/Carbon’dan **HTML template engine** (Nunjucks) temeline kayar. (`PROJECT_DESIGN_DOCUMENT.md` L126–129)
* Web UI artık ana ürün değil; “opsiyonel editör” olur.
* Supabase/JWT/tenant/billing gibi platform katmanları küçülür veya tamamen ayrıştırılır.

**Risk:** Çift mimari maliyeti azalır ama “Carbonac ürün vizyonu” değişir.

---

## 5) CarbonPress önerilerini Carbonac’a entegre etmek için “operasyonel” geliştirme planı

Aşağıdaki backlog, doğrudan Carbonac faz/sprint yapısına oturur (`IS-PLANI.md` L72–149).

### Faz 1 (Sprint 1–2): Parser + Directive + Headless export temeli

* [ ] unified/remark parse → MDAST
* [ ] directive parser (remark-directive) + minimal mapping: callout, figure, data-table, code-group
* [ ] headless chromium export pipeline (Paged.js sonrası print)
* [ ] pdf-lib postprocess: metadata (title/author/version), watermark(draft), compress opsiyonları

> Not: Chrome margin box desteği var ama string-set/target-counter yok ([Chrome for Developers][1]) → TOC sayfa numarası ve running header için Paged.js tarafını “zorunlu” kabul edin.

### Faz 2 (Sprint 3–4): Typography + QA paneli + self-healing entegrasyonu

* [ ] OpenType features + typographic defaults (print CSS)
* [ ] hyphenation policy (TR dahil) + limit kuralları
* [ ] typography scoring (line length, widows/orphans, hyphen density)
* [ ] axe-core HTML audit + raporlama (job_events)
* [ ] visual regression (screenshot diff) + golden baselines
* [ ] QA fail → rule-based auto-fix → tekrar render → hâlâ fail ise AI self-healing

### Faz 3 (Sprint 5–6): Template registry ile directive katalog birleşimi

* [ ] Template registry (Supabase) zaten var (`IS-PLANI.md` L123–135)
* [ ] Directive → Component mapping’i template sürümüyle versiyonla
* [ ] Template preview: PNG thumbnail otomasyonu (`IS-PLANI.md` L125–129)

---

## 6) UI/UX’e yansıyan net öneriler (CarbonPress katkılarıyla)

CarbonPress’in “pipeline” yaklaşımını, Carbonac UI’sinde kullanıcıya görünür kılmak kaliteyi artırır:

1. **Directive palette / component inserter**

* “Callout, Table, Figure, Chart, Code-group…” için UI butonları
* Ekleme, editörün içine direktif snippet’i yazar; preview’de Carbon bileşeni olur. (`PROJECT_DESIGN_DOCUMENT.md` L603–672)

2. **QA paneli (Preview yanında)**

* Accessibility score (axe-core tag bazlı)
* Typography score (line length, widows/orphans…)
* Visual regression durumları
* Her uyarı: “jump-to-source” (Markdown satırına git) + “auto-fix öner” (kural tabanlı)
  (`PROJECT_DESIGN_DOCUMENT.md` L821–862)

3. **Print settings UI ↔ frontmatter senkronizasyonu**

* CarbonPress frontmatter şeması iyi bir referans: header/footer, toc depth, margins, features. (`PROJECT_DESIGN_DOCUMENT.md` L238–301)
* Carbonac “frontmatter wizard” zaten planlı (`IS-PLANI.md` L111–115). Bu wizard’a:

  * sayfa boyutu, margin, header/footer şablonları
  * draft/review/final → watermark politika seçimi
  * hyphenation/smart quotes toggle
    eklenebilir.

---

## 7) Net değerlendirme: “Hangisi daha makul?”

* **Carbonac SoT (React + Carbon + Paged.js + AI)**: “platform + editör + kullanıcı yönetimi + template registry + self-healing” hedefi için daha makul ve tutarlı. (`PROJE-TALIMATLARI.md` L20–37; `IS-PLANI.md` L9–16)
* **CarbonPress (unified + directives + QA + typography + puppeteer + postprocess)**: Carbonac’ın özellikle “deterministik kalite” ve “yayıncılık standardı” tarafını olgunlaştırmak için çok iyi bir blueprint.

**En iyi sonuç (pratikte):**
Carbonac’ı “platform” olarak koruyup, CarbonPress’in **AST pipeline + directive DSL + typography/microtypography + QA otomasyonu + postprocess** katmanlarını içeri almak.
PDF tarafında ise: **Paged.js (layout/pagination) + Chromium (print) + pdf-lib (postprocess)** hibriti.

---

### Kaynaklar (web doğrulama)

* Chrome 131 ile print margin box içerikleri (header/footer alanları) destekleniyor. ([Chrome for Developers][1])
* `string-set` ve `target-counter` gibi ileri paged-media özellikleri Chrome tarafında hâlâ “future possibilities / bug” alanında. ([Chrome for Developers][1])
* Paged.js named strings / margin boxes örnekleri. ([pagedjs.org][4])
* Chart.js canvas tabanlıdır (SVG değil); SVG desteği ayrı bir konu olarak tartışılıyor. ([chartjs.org][2])
* axe-core WCAG etiketleri ve kapsamı. ([Deque][3])

[1]: https://developer.chrome.com/blog/print-margins "Add content to the margins of web pages when printed using CSS  |  Blog  |  Chrome for Developers"
[2]: https://www.chartjs.org/docs/?utm_source=chatgpt.com "Chart.js"
[3]: https://www.deque.com/axe/core-documentation/api-documentation/?utm_source=chatgpt.com "Axe API documentation"
[4]: https://pagedjs.org/en/documentation/7-generated-content-in-margin-boxes/ "Paged.js — Generated Content in Margin Boxes"
