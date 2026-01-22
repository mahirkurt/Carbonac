# Kod AI Agent To‑Do List

Aşağıdaki liste, bu diyalog boyunca önerilen **tüm işleri**; Carbonac'ın SoT/planı ile (öncelik sırası korunarak) ve CarbonPress dokümanındaki "daha deterministik/pipeline" yaklaşımlarının entegre edilebilir kısımlarıyla birleştirilmiş şekilde, **uygulanabilir** bir to‑do olarak döker.

> Not: Aşağıdaki maddelerde `[P0/P1/P2/P3]` öncelik; `Sprint/Faz` eşlemesi ise IS‑PLANI fazlarını temel alır.

---

## 0) Repo keşfi, hizalama ve "SoT enforcement" (Sprint 0)

- [x] **Repo haritası çıkar (connector ile)**
  - [x] Monorepo mu, tek repo mu? (apps/packages/… yapısı)
  - [x] Mevcut akış: upload → render → export → storage
  - [x] UI route haritası (Documents/Editor/Preview/Templates/Jobs)
  - [x] Worker render pipeline dosyaları nerede? (Paged.js + headless)
  - [x] Build/test/CI durumları
- [x] **SoT kuralını CI seviyesinde enforce et**
  - [x] PR template: "SoT'ye aykırı değişiklik var mı?" checkbox
  - [x] CI job: docs hash / rule check (SoT güncellendiyse ilgili plan/sprint dokümanları da güncellendi mi?)
- [x] **Sürüm/paket hijyeni denetimi**
  - [x] Carbon v11 kullanımı doğrula (yanlış paket karışımı varsa düzelt)
  - [x] `@carbon/react` / `@carbon/styles` tek sürüm stratejisi
- [x] **Çakışma yönetimi**
  - [x] CarbonPress'ten alınacaklar listesi: AST pipeline, directives, typography, QA, postprocess
  - [x] Alınmayacaklar: React "tek kaynak görünüm" ilkesini bozan ikinci template motoru (Nunjucks gibi)

Kaynak: SoT öncelik sırası + mimari kararlar.
Kaynak: CarbonPress pipeline referansı.

---

## 1) Kontratlar, şemalar ve veri modeli (Sprint 0 → Sprint 1)

### 1.1 TypeScript kontratlarını "single source of truth" yap

- [x] **Unified error payload** tipi + middleware
  - [x] `{ code, message, details, request_id }` standardı
  - [x] Her request'e `request_id` üretimi ve log'a yazımı
- [x] **Job state machine** kontratı
  - [x] `queued → processing → completed/failed/cancelled`
  - [x] Retry: max 3 + exponential backoff
- [x] **Job events** kontratı
  - [x] stage/progress (%), log lines, timestamps, error snapshot
- [x] **Frontmatter schema** (wizard + pipeline ortak kullanacak)
  - [x] title/date/version/status/language
  - [x] carbon theme (white/g10/g90/g100)
  - [x] page size/margins/header/footer/toc/features (hyphenation, smart quotes vb)
- [x] **AI LayoutInstruction Schema**
  - [x] Önerilen iki aşama: `DocumentPlan` + `LayoutPlan`
  - [x] `styleOverrides` whitelist (AI'ın tasarım sistemi dışına çıkmasını engelle)
  - [x] Layout JSON schema validation (zod/ajv)
- [x] **Directive DSL schema** (custom directives)
  - [x] callout / data-table / chart / code-group / figure / quote / timeline / accordion / marginnote

Kaynak: Job modeli, error formatı, sprint hedefleri.
Kaynak: CarbonPress frontmatter + directive örnekleri.

### 1.2 Supabase veri modeli ve migration'lar

- [x] `jobs`, `job_events` tabloları (zorunlu)
- [x] `documents`, `document_versions`
- [x] `templates`, `template_versions`
- [x] `assets` (uploads), `outputs`
- [x] `usage_events`, `billing_limits` (Faz 4'e hazırlık)
- [x] RLS politikaları (tenant/user isolation)
- [x] Storage bucket path standardı: `user_id/document_id/job_id/...`

Kaynak: hedef veri modeli ve storage standardı.

---

## 2) Core pipeline: API + Queue + Worker (Faz 1 / Sprint 1–2)

### 2.1 API (Express) – minimum uçtan uca akış

- [x] `POST /api/convert/to-pdf`
  - [x] auth: Supabase JWT (`Authorization: Bearer`)
  - [x] ingestion: md + assets + metadata validate
  - [x] job create + enqueue
  - [x] response: `job_id`, `request_id`
- [x] `GET /api/jobs/:job_id`
  - [x] job + latest events + output url (varsa)
- [x] `GET /api/jobs/:job_id/download`
  - [x] signed URL redirect + refresh
  - [x] expired signed URL fallback
- [x] `GET /api/jobs?filters=...`
  - [x] pagination + status filtreleri
- [x] Server-side AI proxy endpoint'leri
  - [x] `POST /api/ai/analyze`
  - [x] `POST /api/ai/ask`
  - [x] rate limit + audit log + prompt versioning
  - [x] PII redaction (gerekli ise)

Kaynak: SoT API/AI kararları ve IS‑PLANI epikleri.

### 2.2 Queue/Worker (BullMQ + Redis)

- [x] Kuyrukları tanımla
  - [x] `jobs:convert-md` (opsiyonel)
  - [x] `jobs:convert-pdf` (ana)
- [x] Worker süreçleri (ayrı process)
  - [x] concurrency limit
  - [x] retry/backoff uygulaması
  - [x] job progress event'leri (UI timeline için)
- [x] "job stage" standardı
  - [x] ingest → parse → plan → render-html → paginate → export-pdf → postprocess → upload → complete
- [x] İşlem sırasında "artifact" dosyalarını temp klasörde düzenle
  - [x] render HTML snapshot
  - [x] paged HTML snapshot
  - [x] screenshots (QA için)

Kaynak: IS‑PLANI queue/worker hedefleri.

---

## 3) Parser/AST katmanı (CarbonPress'ten alınacak en değerli parça) (Sprint 1–3)

### 3.1 unified/remark/rehype tabanlı parse & transform

- [x] Markdown parse
  - [x] `remark-parse`, `remark-frontmatter`, `remark-gfm`
- [x] Frontmatter'ı normalize et (wizard ile aynı schema)
- [x] Plugin chain kurgula (deterministik sıra)
  - [x] slug/id üretimi (heading ids)
  - [x] TOC üretimi (toc.enabled ise)
  - [x] typography transforms (opt-in)

Kaynak: CarbonPress plugin chain yaklaşımı.
Kaynak: Carbonac "Parser: AST parse, content classification" hedefi.

### 3.2 Directive DSL (explicit components)

- [x] `remark-directive` ile `:::callout`, `:::data-table`, `:::chart`, `:::code-group`, `:::figure`, `:::quote`, `:::timeline`, `:::accordion`, `:marginnote[]` parse et
- [x] Directive → **Component AST** mapping sözlüğü
  - [x] whitelist props (security + design consistency)
  - [x] print‑friendly defaults (close button yok, hover yok)
- [x] Editor'da "Insert component" paleti
  - [x] snippet insertion + schema validation
  - [x] preview'de render doğrulama

Kaynak: CarbonPress directive söz dizimi ve mapping.

### 3.3 "Component AST" standardı

- [x] Ara format: `ComponentNode[]` (RichText, CarbonChart, DataTable, Callout, Figure…)
- [x] Her node: `id`, `type`, `props`, `sourceMap` (md line/column)
- [x] Lint/QA: sourceMap sayesinde "jump-to-source"

---

## 4) Render katmanı: React + Carbon "tek kaynak görünüm" (Sprint 2–4)

### 4.1 React renderer

- [ ] Component AST → React component tree
- [ ] Theme wrapper (white/g10/g90/g100)
- [ ] Grid/Column mapping (Carbon grid)
- [ ] Print-only/screen-only içerik kontrolü (conditional blocks)

Kaynak: "rendering motoru React + Carbon Components (tek kaynak)" kararı.

### 4.2 Paged.js pagination + print.css (SoT zorunlu)

- [x] `print.css` temelini oluştur (SoT kuralları)
  - [x] A4 varsayılan
  - [x] margin 20mm, bleed 3mm, crop/cross marks
  - [x] left/right page cilt payı
  - [x] running header/footer string‑set (doc title / chapter title)
  - [x] page numbers `X/Y`
  - [x] link URL'lerini yazdır
  - [x] interaktif elementleri gizle
  - [x] break rules: `avoid-break`, `force-break` sınıfları
  - [x] CMYK safe renk kısıtları
  - [x] font embedding zorunlu; body 10pt, heading 14pt
- [x] Preview pipeline
  - [x] Paged.js preview UI (web) = export pipeline ile aynı CSS/asset seti
  - [x] WYSIWYG farkını minimize et

Kaynak: PDF export kuralları ve Paged.js zorunluluğu.

---

## 5) Headless export + PDF post-process (Sprint 2–4)

### 5.1 Headless Chromium ile "print to PDF"

- [x] Headless engine seçimi (Puppeteer veya Playwright)
- [x] Print ayarları
  - [x] `preferCSSPageSize: true`
  - [x] `printBackground: true`
  - [x] timeout/launch args (no-sandbox vs)
- [x] Worker container içinde Chromium + font erişimi
- [x] Export çıktısı: PDF buffer → postprocess → storage upload

Kaynak: Carbonac "PDF Engine: headless render + print optimizer" hedefi.
Kaynak: CarbonPress Puppeteer render konfigurasyonu.

### 5.2 pdf-lib ile post-processing

- [x] PDF metadata set et (title/author/subject/keywords/producer)
- [x] Draft watermark (status=draft ise)
- [x] Compress/optimize opsiyonu
- [x] (Opsiyonel) PDF/A moduna hazırlık bayrakları

Kaynak: CarbonPress postprocess önerisi.

---

## 6) AI katmanı: Art Director + Storytelling + Logic-based CSS (Sprint 2–5)

### 6.1 Server-side Gemini entegrasyonu (proxy)

- [x] API key izolasyonu (server only)
- [ ] rate limit + audit logging
- [x] prompt set versioning + rollback

Kaynak: SoT AI provider ve proxy yaklaşımı.

### 6.2 Art director çıktısı (deterministik kontrat)

- [x] `DocumentPlan` üret
  - [x] bölüm hiyerarşisi
  - [x] zorunlu modüller (Exec summary, Key findings, What to do…)
- [x] `LayoutPlan` üret
  - [x] gridSystem + colSpan/offset
  - [x] page-break directives
- [x] Fallback: AI başarısızsa template-default layout

Kaynak: uzun vadeli art director yaklaşımı.

### 6.3 Data storytelling modülleri

- [x] Her chart için: "Insight" + "Implication" üretimi
- [x] Executive summary üretimi
- [ ] Kaynak/örneklem notlarını ekleme (survey reports için)

---

## 7) Tipografik mükemmellik (CarbonPress'ten alınacak; print kalitesini yükseltir) (Sprint 3–6)

- [x] IBM Plex font setini projeye entegre et (sans/serif/mono) + embedding doğrulaması
- [x] OpenType features (kern, liga, calt, tnum/lnum) print CSS'e ekle
- [x] Hyphenation (TR dahil) stratejisi
  - [x] CSS `hyphens: auto`
  - [x] Gerekirse polyfill/engine (opt-in)
  - [x] exception list yönetimi
- [x] Microtypography (smart quotes/dashes/ellipses)
  - [x] Dil aware dönüşüm
  - [x] Akademik/Regulatory metinde "opt-in" (quote/doğruluk riski)

Kaynak: CarbonPress typography hedefleri ve config.
Kaynak: SoT tipografi kuralları.

---

## 8) Data viz ve tablo sayfaları (Sprint 3–6)

### 8.1 Chart engine seçimi ve print‑ready çıktı

- [x] Varsayılan grafik standardı: **SVG tabanlı** üretim (printte vektör kalite)
- [x] "SurveyChartPage" şablonu (soru etiketi + sample size + büyük metrik + notlar)
- [x] Chart caption + source + methodology alanı
- [x] Color/pattern kombinasyonu (erişilebilirlik, grayscale)

### 8.2 Tablo kırılım stratejisi

- [x] `page-break-inside: avoid` (baseline)
- [x] akıllı split algoritması (multi-page)
- [x] sticky header (printte sayfa tekrarı gerekiyorsa)
- [x] satır yüksekliği ve zebra kuralları (token bazlı)

Kaynak: SoT Carbon Charts ve data viz ilkeleri.
Kaynak: CarbonPress chart/table directive'leri.

---

## 9) QA otomasyonu + visual self-healing (Sprint 3–6)

### 9.1 Deterministik "lint & QA gate" (AI'dan önce)

- [x] Markdown lint
  - [x] heading hierarchy, empty heading, uzun paragraf
- [x] HTML accessibility audit (axe-core)
  - [x] wcag2a/wcag2aa/wcag21aa tag'leri
- [x] Typography scoring
  - [x] line length, line height, orphans/widows, hyphenation density
- [x] Visual regression
  - [x] sayfa screenshot'ları + diff threshold
  - [x] golden baselines
- [x] QA harness baseline calistir + raporu arsivle (visual regresyon kaydi)

Kaynak: IS‑PLANI QA hedefleri + golden file.
Kaynak: CarbonPress QA katmanı.

### 9.2 Visual self-healing döngüsü (kural tabanlı + AI hibrit)

- [x] Render draft → screenshot al
- [x] Kural tabanlı tespit:
  - [x] overflow/clip
  - [x] widows/orphans
  - [x] tablo split hatası
  - [x] min font-size ihlali
- [x] Auto-fix (whitelist)
  - [x] break-before/avoid-break ekleme
  - [ ] tabloyu sayfa başına taşıma
  - [ ] görsel ölçekleme sınırları
- [x] AI QA (Gemini multimodal) ile "son kontrol"
- [x] Max iterasyon sayısı + her iterasyonda diff log
- [ ] UI'da "Applied fixes" raporu

Kaynak: Yol haritasındaki self-healing yaklaşımı.
Kaynak: IS‑PLANI Sprint 3 self-healing.

---

## 10) Template Registry + Token Mapping + Theme Packs (Faz 3 / Sprint 5–6)

### 10.1 Template CRUD + versioning + rollback

- [x] Supabase `templates` + `template_versions`
- [x] UI: template oluştur/düzenle/sürümle/rollback
- [x] Render pipeline: doküman her zaman "template_id + version" ile üretilir
- [x] Template preview pipeline (thumbnail job + bucket)

Kaynak: IS‑PLANI Sprint 5.

### 10.2 Print Token Pack

- [x] `tokens/core` (Carbon)
- [x] `tokens/print` (pt/leading/safe-area/baseline/captions)
- [x] `templates/<id>/overrides`
- [x] Token dışı stil kullanımını lint ile engelle (hard-coded hex/px)

Kaynak: IS‑PLANI token mapping ve tema paketleri.
Kaynak: SoT token/theming kuralları.

### 10.3 Tema paketleri

- [x] white, g10, g90, g100 (CSS custom properties)
- [x] Preview'de tema toggle + export'ta aynı tema

Kaynak: SoT theming.

### 10.4 Press Pack + Release Pipeline (Sprint 6)

- [x] Press Pack manifest schema (JSON/YAML) + validation
- [x] Block catalog + content schema mapping (frontmatter alanlari)
- [x] Release metadata + output manifest
- [x] Editorial/publish API kontrati
- [x] Preflight gate (lint + QA + schema validation)
- [x] Template governance (approval/rollback + reviewer role)

---

## 11) Pattern Library (Carbon‑stili PDF modülleri) (Sprint 4–6)

> Amaç: IBM/Carbon raporlarındaki tekrar eden "modül" kalitesini template sistemine taşımak.

- [x] `CoverPageHero`
- [x] `ExecutiveSummary`
- [x] `KeyFindingsList`
- [x] `WhatToDo / ActionBox`
- [x] `HeroStatWithQuote`
- [x] `ChapterOpener / PartOpener`
- [x] `CaseStudyModule`
- [x] `SurveyChartPage`
- [x] `PersistentSectionNavFooter` (mini‑TOC footer + page X/Y)
- [x] `FigureWithCaptionAndSource`
- [x] `AppendixPage` (references, footnotes)

Her modül için:

- [x] Props sözleşmesi (type-safe)
- [x] Print CSS davranışı (break rules)
- [x] A11y (HTML tarafı)
- [x] Snapshot test / visual regression baseline

Kaynak: SoT UI/UX + PDF standardizasyonu.
Kaynak: Roadmap'te "component factory + AI layout" yaklaşımı.

---

## 12) Web UI/UX işleri (Faz 2–3 / Sprint 3–6)

### 12.1 IA ve temel sayfalar

- [ ] UI Shell (Header + SideNav)
- [ ] Documents list
  - [ ] DataTable + pagination + search/filter + empty state
- [ ] Document detail
  - [x] Editor + Preview (split veya content switcher)
  - [x] Lint panel (non-blocking)
  - [ ] Quality panel (QA sonuçları + applied fixes)
- [x] Templates gallery
  - [x] kartlar + filtreler + preview thumbnail
- [ ] Jobs & Activity
  - [ ] job timeline + logs + retry/cancel

Kaynak: SoT Web UI/UX standartları.
Kaynak: IS‑PLANI Sprint 3–6 epikleri.

### 12.2 Frontmatter Wizard

- [ ] Progress indicator
- [ ] Inline validation + error summary
- [ ] Advanced options (accordion/side panel)
- [x] Wizard çıktısı frontmatter schema ile birebir uyumlu

Kaynak: IS‑PLANI Sprint 3 "Frontmatter wizard".
Kaynak: CarbonPress frontmatter taslağı (alan seti).

### 12.3 Editor ergonomisi

- [x] autosave
- [x] keyboard shortcuts
- [ ] outline (H1/H2 ağacı)
- [ ] insert component palette (directive)
- [ ] "jump to issue" (lint/QA sourceMap)

Kaynak: IS‑PLANI Sprint 3–4.

---

## 13) Observability + Security + Compliance (Faz 4 / Sprint 7–8)

- [ ] Rate limit (API + AI proxy)
- [ ] File validation: mime/type/size
- [ ] Secrets management (server only)
- [ ] RLS policy doğrulaması (Supabase)
- [ ] Metrics: latency, success rate, queue depth, p95 convert time
- [ ] Logs: request_id, job_id, user_id (zorunlu)
- [ ] Dashboard: temel SLO'lar
- [ ] Billing limitleri (free/pro) + usage stats

Kaynak: IS‑PLANI Security/Observability/Billing epikleri.

---

## 14) DevOps / Runtime işleri (Docker + Raspberry runbook) (Sürekli)

- [x] Docker image'lara headless Chromium + font paketleri ekle
- [ ] `docker-compose` profilleri: api / worker
- [x] Remote runtime: Raspberry docker context + bridge scriptleri
- [ ] `VITE_API_URL` ortam değişkeni yönetimi
- [ ] CI/CD:
  - [x] unit + integration CI (GitHub Actions)
  - [ ] build + test + QA (axe/typography/visual regression)
  - [ ] artifact upload (PDF/PNG)
  - [ ] version stamping (commit/date/version metadata)
- [ ] QA harness + smoke testlerini CI rutinine bagla (RUN_QA/RUN_SMOKE)
- [ ] Pi uzerinde API/worker yeniden deploy + `/api/convert/to-pdf` smoke test

Kaynak: Raspberry runbook.
Kaynak: CarbonPress GitHub Actions + version stamping yaklaşımı.

---

## 15) Referans PDF kütüphanesi + tasarım yönergesi (repo artefact'ı) (Sürekli)

- [ ] `library/` manifest oluştur (URL + metadata; telif/lisans uygun değilse PDF'yi indirmeden sadece linkle)
- [ ] Her referans PDF için metadata (YAML/JSON)
  - [ ] pattern tags (KeyFindings, ActionBox, ChartPage, FooterNav, vs)
- [ ] `docs/design/Carbon_PDF_Tasarim_Yonergesi.md`
  - [ ] Carbon→PDF eşleştirme (grid/spacing/type/color)
  - [ ] print token pack kuralları
  - [ ] preflight checklist
- [ ] "Pattern extraction notes" dokümanı
  - [ ] hangi PDF hangi modülü destekledi, hangi guardrail'ler çıktı

Kaynak: SoT tasarım standardı + PDF kuralları.

---

## 16) Opsiyonel: CLI modu ve çoklu çıktı formatları (CarbonPress tarzı) (P2/P3)

> Carbonac platformunu bozmadan, CI/CD'de batch üretim için "CLI facade" eklenebilir.

- [ ] `carbonac build <file.md>` CLI (internal)
- [ ] `carbonac qa <file.md>` CLI
- [ ] Çoklu çıktı:
  - [ ] PNG thumbnail (template gallery için **öncelikli**)
  - [ ] HTML export (preview reuse)
  - [ ] EPUB (en sonda, opsiyonel)
- [ ] Build cache (md+template+theme hash)
- [ ] Parallel build (worker concurrency ile uyumlu)

Kaynak: CarbonPress CLI/multi-format taslağı.
Kaynak: IS‑PLANI template preview (mini PDF/PNG) hedefi.

---

## 17) "Definition of Done" (agent'ın her task'ı kapatırken uygulaması gereken standart)

- [ ] SoT'ye aykırılık yok (çakışma varsa SoT güncellendi mi?)
- [ ] En az 1 manuel senaryo ile test edilebilir (DoD)
- [ ] Error path'lerde net mesaj + request_id/job_id log var
- [ ] Unit/integration/e2e testleri güncel (golden/visual regression dahil)
- [ ] Dokümantasyon güncellendi (özellikle kontrat/şema değiştiyse)

Kaynak: Yazılım geliştirme en iyi uygulamaları.

---

# TO-DO LIST (GÜNCEL)

> Kaynak: `docs/PROJE-DURUMU.md` + repo durumu (2025-01-21)

## Tamamlananlar

- [x] Supabase migrations 004/005 uygulandı.
- [x] Press Pack schema validation + release/publish akışı kodlandı.
- [x] Preflight gate (lint + QA raporu + job_events log) entegre.
- [x] Template governance (state + approval) API + UI.
- [x] Editor autosave + frontmatter wizard (content schema uyumlu).
- [x] Paged.js render/print CSS + layout/print profile injection.
- [x] CI workflow (unit + integration) eklendi; opsiyonel QA/smoke girişi mevcut.

## Yapılacaklar (Aktif)

- [ ] QA harness + smoke testlerini CI rutinine bağla (RUN_QA/RUN_SMOKE otomasyon veya schedule).
- [ ] Pi üzerinde API/worker yeniden deploy (son değişiklikleri almak için) + `/api/convert/to-pdf` smoke test.
- [ ] QA harness'i baseline ile çalıştırıp raporu arşivle (visual regresyon kaydı).

## Backlog / İzleme

- [ ] QA/CI gecikmesi kaynaklı riskleri izleme ve giderme (visual regressions).
- [ ] Content schema değişikliklerinde wizard/autosave uyumluluk kontrol listesi (regresyon kontrol).

## Geçersiz / Devre Dışı

- [INVALID] Typst/Quarto CLI pipeline görevleri (Paged.js hedefiyle uyumsuz, kaldırıldı).
