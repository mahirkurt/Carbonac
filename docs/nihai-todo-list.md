# Nihai TODO List (Carbonac)

> Kaynaklar: `docs/TO-DO-LIST.md`, sprint dokumanlari, `docs/PROJE-DURUMU.md`.
> Bu dokuman kalan isleri sirali, ayrintili ve uygulanabilir adimlara boler.

## Legend
- [x] tamamlandi
- [ ] yapilacak
- [~] bloke / karar bekliyor

## Calisma Sirasi (Ozet)
1) Repo kesfi + SoT enforcement + paket hijyeni + scope netlestirme
2) Kontrat ve schema eksikleri
3) Veri modeli eksikleri + RLS
4) API bosluklari
5) Queue/worker bosluklari
6) Parser/AST zinciri
7) Directive DSL + component mapping
8) Component AST standardi + renderer mapping
9) Print CSS eksikleri
10) PDF post-process
11) AI art-director iki asama + fallback
12) Tipografi/microtypography
13) Data-viz + tablo standartlari
14) QA tamamlama + visual regression
15) Token packs + tema paketleri + token lint
16) Pattern library modulleri
17) UI/UX kalanlari
18) Observability/Security/Billing
19) DevOps/CI
20) Referans kutuphane + tasarim yonergesi
21) CLI + multi-output + cache
22) DoD enforcement

---

## 1) Repo kesfi + SoT enforcement + paket hijyeni + scope netlestirme
**Hedef:** Repo haritasi ve kurumsal uyum kurallari net olsun.

Adimlar:
- [x] Repo haritasi cikar (apps/packages, pipeline, routes, worker dosyalari, build/test/CI)
- [x] SoT kurali icin CI enforcement planini yaz
- [x] PR template icin SoT checklist ekle
- [x] Carbon v11 paket karisimi ve tek surum stratejisi kontrol et
- [x] CarbonPress'ten alinacaklar / alinmayacaklar listesini netlestir

Ciktilar:
- `docs/REPO-HARITASI.md`
- `.github/pull_request_template.md`
- `scripts/check-sot.js` + `.github/workflows/ci.yml` SoT kontrolu
- Paket versiyon hizalama notu (REPO-HARITASI icinde)

Bagimliliklar: yok

---

## 2) Kontrat ve schema eksikleri
**Hedef:** API/pipeline kontratlari tek kaynakta net olsun.

Adimlar:
- [x] Unified error payload standardi
- [x] Job state machine kontrati
- [x] Job events kontrati (stage/progress/logs/timestamps/error snapshot)
- [x] Frontmatter schema (wizard + pipeline ortak)
- [x] AI LayoutInstruction schema (DocumentPlan + LayoutPlan)
  - [x] Layout JSON schema validation (zod/ajv)
  - [x] styleOverrides whitelist
- [x] Directive DSL schema (callout/table/chart/quote/...)

Ciktilar:
- `docs/SCHEMA-KONTRATLARI.md`
- `docs/DIRECTIVE-DSL.md`
- `docs/schemas/job-event.schema.json`
- `docs/schemas/layout-instruction.schema.json`
- `docs/schemas/directive-dsl.schema.json`
- `docs/schemas/output-manifest.schema.json`

Bagimliliklar: yok

---

## 3) Veri modeli eksikleri + RLS
**Hedef:** Supabase modeli tamam ve tutarli olsun.

Adimlar:
- [x] `jobs`, `job_events`
- [x] `documents`, `document_versions`
- [x] `templates`, `template_versions`
- [x] `assets`, `outputs`
- [x] `usage_events`, `billing_limits`
- [x] RLS policy setleri (tenant/user isolation)
- [x] Storage path standardi (user_id/document_id/job_id/...)

Ciktilar:
- `supabase/migrations/006_documents_assets_usage.sql`

Bagimliliklar: kontratlar (Step 2)

---

## 4) API bosluklari
**Hedef:** API yuzeyi eksiksiz ve tutarli calissin.

Adimlar:
- [x] POST /api/convert/to-pdf (job create + enqueue)
- [x] Ingestion validation (md + assets + metadata)
- [x] GET /api/jobs/:job_id
  - [x] job + latest events + output url
- [x] GET /api/jobs/:job_id/download
  - [x] signed URL redirect + refresh
  - [x] expired signed URL fallback
- [x] GET /api/jobs?filters=... (pagination + status)
- [x] Server-side AI proxy endpoints (analyze/ask)
  - [x] rate limit + audit log + prompt versioning
  - [x] PII redaction (gerekiyorsa)

Ciktilar:
- API kontrat guncellemesi
- Request/response ornekleri

Bagimliliklar: Step 2, Step 3

---

## 5) Queue/worker bosluklari
**Hedef:** Worker pipeline izlenebilir ve dayaniksiz nokta kalmasin.

Adimlar:
- [x] jobs:convert-pdf
- [x] jobs:convert-md (opsiyonel)
- [x] concurrency limit
- [x] retry/backoff
- [x] job progress events (UI timeline)
- [x] job stage standardi (ingest -> parse -> plan -> render -> paginate -> export -> postprocess -> upload -> complete)
- [x] temp artifact duzeni (render html, paged html, screenshots)

Ciktilar:
- Worker stage dokumani
- Job progress event payload

Bagimliliklar: Step 2, Step 3

---

## 6) Parser/AST zinciri
**Hedef:** Markdown parse deterministik ve genisletilebilir olsun.

Adimlar:
- [x] remark parse chain (remark-parse/frontmatter/gfm)
- [x] frontmatter normalize (wizard ile ayni schema)
- [x] slug/id uretimi
- [x] TOC uretimi
- [x] typography transforms (opt-in)

Ciktilar:
- `docs/PARSER-PIPELINE.md`

Bagimliliklar: Step 2

---

## 7) Directive DSL + component mapping
**Hedef:** Directive tabanli component yerlesimi standart olsun.

Adimlar:
- [x] remark-directive parse (callout/data-table/chart/code-group/figure/quote/timeline/accordion/marginnote)
- [x] Directive -> Component AST mapping
  - [x] whitelist props
  - [x] print-friendly defaults
- [x] Editor insert component palette + schema validation

Ciktilar:
- `src/utils/directive-mapper.js`
- `frontend/src/utils/directiveTemplates.js`

Bagimliliklar: Step 6

---

## 8) Component AST standardi + renderer mapping
**Hedef:** Orta format ve renderer mapping tek standarda baglansin.

Adimlar:
- [x] ComponentNode[] standardi (id/type/props/sourceMap)
- [x] sourceMap ile jump-to-issue (lint/QA)
- [x] React renderer mapping (theme/grid/print-only)

Ciktilar:
- `docs/COMPONENT-AST.md`
- `docs/schemas/component-node.schema.json`
- `src/utils/component-registry.js`

Bagimliliklar: Step 6, Step 7

---

## 9) Print CSS eksikleri
**Hedef:** Print kurallari tam ve uyumlu olsun.

Adimlar:
- [x] A4/margin/bleed/crop/left-right/header/footer/page numbers
- [x] link URL yazdirma
- [x] interaktif elementleri gizleme
- [x] avoid-break/force-break
- [x] CMYK safe renk siniri
- [x] font embedding ve min font size kurallari

Ciktilar:
- print.css tamamlanmis

Bagimliliklar: Step 4

---

## 10) PDF post-process
**Hedef:** PDF metadata ve opsiyonel islem katmani eklensin.

Adimlar:
- [x] PDF metadata set (title/author/subject/keywords/producer)
- [x] Draft watermark (status=draft)
- [x] Compress/optimize
- [x] PDF/A readiness flag

Ciktilar:
- `src/utils/pdf-postprocess.js`

Bagimliliklar: Step 9

---

## 11) AI art-director iki asama + fallback
**Hedef:** AI layout kararlari deterministik olsun.

Adimlar:
- [x] DocumentPlan uret (bolum hiyerarsisi + zorunlu moduller)
- [x] LayoutPlan uret (gridSystem/colSpan/offset/page-break directives)
- [x] Fallback: template default layout
- [x] Prompt versioning + rollback hooks (ART_DIRECTOR_PROMPT_VERSION/ART_DIRECTOR_PROMPT_ROLLBACK)
- [x] Data storytelling (insight + executive summary)
- [ ] Kaynak/ornemlem notlari (survey reports)

Ciktilar:
- `src/ai/art-director.js`
- `docs/schemas/layout-instruction.schema.json`

Bagimliliklar: Step 2, Step 6

---

## 12) Tipografi/microtypography
**Hedef:** Print tipografisi kalite standartlarini karsilasin.

Adimlar:
- [x] IBM Plex set (sans/serif/mono) embed + verify
- [x] OpenType features (kern/liga/calt/tnum/lnum)
- [x] Hyphenation (TR dahil)
- [x] Microtypography (smart quotes/dashes/ellipses)

Ciktilar:
- `docs/TIPOGRAFI-KURALLARI.md`
- `styles/print/print-base.css`
- `styles/print/fonts`
- `src/convert-paged.js`

Bagimliliklar: Step 9

---

## 13) Data-viz + tablo standartlari
**Hedef:** Grafik ve tablolar print-ready olsun.

Adimlar:
- [x] SVG default chart output
- [x] SurveyChartPage template (chart variant)
- [x] caption/source/methodology alanlari
- [x] color/pattern kombinasyonu (grayscale friendly)
- [x] page-break-inside: avoid (baseline)
- [x] akilli split algoritmasi (multi-page)
- [x] sticky header (print)
- [x] row height/zebra rules

Ciktilar:
- `docs/CHART-TABLE-STANDARDS.md`
- `styles/print/print-base.css`

Bagimliliklar: Step 8, Step 9

---

## 14) QA tamamlama + visual regression
**Hedef:** QA zinciri deterministic + otomatik hale gelsin.

Adimlar:
- [x] Markdown lint
- [x] HTML accessibility audit (axe-core)
- [x] Typography scoring
- [x] Visual regression (screenshots + diff threshold)
- [x] Golden baselines
- [x] QA diff log (iterasyon bazli)
- [x] Applied fixes UI raporu
- [x] QA harness baseline run + rapor arsivleme

Ciktilar:
- QA rapor standardi (accessibility + typography + visual diff)
- `scripts/vendor/axe.min.js`
- `scripts/vendor/visual_diff.py`
- QA rapor JSON + HTML (qa-report.json / qa-report.html)
- Golden baseline seti (output/qa-baselines)

Bagimliliklar: Step 9, Step 11

---

## 15) Token packs + tema paketleri + token lint
**Hedef:** Token tabanli stil standardi kurulmus olsun.

Adimlar:
- [x] tokens/core
- [x] tokens/print
- [x] templates/<id>/overrides
- [x] token disi stil lint (hard-coded hex/px)
- [x] theme packs (white/g10/g90/g100)
- [x] preview theme toggle + export alignment

Ciktilar:
- Token pack dokumani
- `tokens/` core/print/theme pack'leri
- `scripts/token-lint.js` + `npm run lint:tokens`
- `docs/TOKEN-PACKS.md`

Bagimliliklar: Step 9

---

## 16) Pattern library modulleri
**Hedef:** PDF modulleri reusable hale gelsin.

Adimlar:
- [x] CoverPageHero
- [x] ExecutiveSummary
- [x] KeyFindingsList
- [x] WhatToDo/ActionBox
- [x] HeroStatWithQuote
- [x] ChapterOpener/PartOpener
- [x] CaseStudyModule
- [x] SurveyChartPage
- [x] PersistentSectionNavFooter
- [x] FigureWithCaptionAndSource
- [x] AppendixPage

Her modul icin:
- [x] Props contract (type-safe)
- [x] Print CSS rules
- [x] A11y
- [x] Snapshot/visual regression baseline

Ciktilar:
- Pattern library katalogu
- `docs/PATTERN-LIBRARY.md`
- `patterns/registry.json` + `patterns/schemas/*.schema.json`
- `examples/patterns/pattern-library.md`

Bagimliliklar: Step 8, Step 15

---

## 17) UI/UX kalanlari
**Hedef:** Uygulama arayuzu tamamlanmis olsun.

Adimlar:
- [x] UI shell (Header + SideNav)
- [x] Documents list (datatable + pagination + search/filter + empty state)
- [x] Jobs & Activity (timeline + logs + retry/cancel)
- [x] Quality panel (QA results + applied fixes)
- [x] Wizard progress + inline validation + advanced options
- [x] Editor outline (H1/H2 tree)
- [x] Insert component palette (directive)
- [x] Jump-to-issue (lint/QA sourceMap)

Ciktilar:
- UI/UX completion checklist

Bagimliliklar: Step 8, Step 14

---

## 18) Observability/Security/Billing
**Hedef:** Uretim guvenligi ve izlenebilirlik saglansin.

Adimlar:
- [x] API + AI proxy rate limit
- [x] File validation (mime/type/size)
- [x] Secrets management (server only)
- [x] RLS policy verification
- [x] Metrics (latency, success rate, queue depth, p95)
- [x] Logs (request_id/job_id/user_id)
- [x] Dashboard (SLO)
- [x] Billing/usage stats

Ciktilar:
- `docs/OBSERVABILITY-RUNBOOK.md`
- `/api/metrics/dashboard` (SLO UI)

Bagimliliklar: Step 4, Step 5

---

## 19) DevOps/CI
**Hedef:** CI/CD ve runtime guvenilir olsun.

Adimlar:
- [ ] docker-compose profiles (api/worker)
- [ ] VITE_API_URL env management
- [x] unit + integration CI
- [ ] CI QA (axe/typography/visual regression)
- [ ] artifact upload (PDF/PNG)
- [ ] version stamping (commit/date/version)
- [ ] RUN_QA/RUN_SMOKE otomasyon
- [ ] Pi redeploy + /api/convert/to-pdf smoke test

Ciktilar:
- CI/CD playbook

Bagimliliklar: Step 14, Step 18

---

## 20) Referans kutuphane + tasarim yonergesi
**Hedef:** Tasarim referanslari ve standardlar repo icinde olsun.

Adimlar:
- [ ] library/ manifest (URL + metadata)
- [ ] PDF metadata (YAML/JSON + pattern tags)
- [ ] docs/design/Carbon_PDF_Tasarim_Yonergesi.md
- [ ] Pattern extraction notes

Ciktilar:
- Referans kutuphane
- Tasarim yonergesi

Bagimliliklar: Step 16

---

## 21) CLI + multi-output + cache
**Hedef:** Batch uretim ve cache optimizasyonu.

Adimlar:
- [ ] carbonac build <file.md>
- [ ] carbonac qa <file.md>
- [ ] multi-output (PNG/HTML/EPUB)
- [ ] build cache (md+template+theme hash)
- [ ] parallel build (worker concurrency)

Ciktilar:
- CLI usage doc

Bagimliliklar: Step 5, Step 10

---

## 22) DoD enforcement
**Hedef:** Her task kapanisi standart kural setine uysun.

Adimlar:
- [ ] SoT alignment kontrolu
- [ ] En az 1 manuel senaryo testi
- [ ] Error path + request_id/job_id
- [ ] Unit/integration/e2e guncel
- [ ] Dokumantasyon guncel

Ciktilar:
- DoD checklist + PR template

Bagimliliklar: Step 1, Step 19
