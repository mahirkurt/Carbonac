# Carbonac Master TO-DO (Merged)

Bu dokuman, `docs/nihai-todo-list.md` ve `docs/TO-DO-LIST.md` iceriklerini tek bir master plan olarak birlestirir.
Amac: kalan ve tamamlanan isleri **fazlara bolup**, bir AI agent icin **uygulanabilir adimlar** halinde tanimlamaktir.

Kaynaklar (SoT oncelik sirasi):
1) `docs/PROJE-TALIMATLARI.md`
2) `docs/SPRINT-0-DELIVERABLES.md`
3) `docs/IS-PLANI.md`
4) Sprint dokumanlari (FAZ-*-SPRINT-*.md)
5) `docs/PROJE-DURUMU.md`

---

## Legend
- [x] tamamlandi
- [~] bloke / karar bekliyor

---

## AI Agent Calisma Kurallari (Kisa)
- SoT ile celiskide **SoT kazanir**. Celiski varsa ilgili dokumani guncelle.
- Her task icin: girdi/varsayimlari yaz, uygulama adimlarini netlestir, cikti dosyalarini listele.
- Degisiklikten sonra uygun test/verify adimini calistir ve sonucu kaydet.
- Gereksiz scope genisletme yok; sadece ilgili taski kapat.
- Gizli bilgileri loglarda veya dokumanlarda acik etme.

---

## Faz Haritasi (Ozet)
- **Faz 0 (Sprint 0)**: Repo hizalama, SoT enforcement, schema/kontrat, veri modeli, temel API/worker.
- **Faz 1 (Sprint 1-2)**: Parser/AST, directive DSL, renderer mapping, print CSS, PDF export.
- **Faz 2 (Sprint 3-6)**: AI art-director, QA harness, UI/UX, template/press-pack, pattern library.
- **Faz 3 (Sprint 7-8+)**: Observability, DevOps/CI, referans kutuphane, CLI, DoD enforcement.

---

# FAZ 0 - Temel Altyapi (Tamamlandi)

## 0.1 Repo kesfi + SoT enforcement + paket hijyeni
- [x] Repo haritasi (apps/packages/pipeline/routes/worker/build/test/CI)
- [x] PR template SoT checklist
- [x] CI SoT kontrolu (doc hash/uyum)
- [x] Carbon v11 paket karisimi temizligi
- [x] CarbonPress alinacak/alinmayacaklar listesi

Ciktilar:
- `docs/REPO-HARITASI.md`
- `.github/pull_request_template.md`
- `scripts/check-sot.js` + `.github/workflows/ci.yml`

## 0.2 Kontratlar + Schema
- [x] Unified error payload
- [x] Job state machine + job events
- [x] Frontmatter schema (wizard + pipeline)
- [x] LayoutInstruction schema + validation
- [x] Directive DSL schema

Ciktilar:
- `docs/SCHEMA-KONTRATLARI.md`
- `docs/schemas/*.schema.json`
- `docs/DIRECTIVE-DSL.md`

## 0.3 Veri modeli + RLS
- [x] Supabase migrations (jobs, documents, templates, assets, outputs, usage)
- [x] RLS policy dogrulama
- [x] Storage path standardi

---

# FAZ 1 - Core Pipeline + Render (Tamamlandi)

## 1.1 API + Queue + Worker
- [x] /api/convert/to-pdf ve job polling/download
- [x] AI proxy endpointleri + rate limit + audit log
- [x] Worker stage standardi + artifact snapshots

## 1.2 Parser/AST + Directive DSL
- [x] unified/remark/rehype chain
- [x] directive -> Component AST mapping
- [x] editor insert palette + schema validation

## 1.3 Renderer + Print CSS + PDF Export
- [x] Component AST standardi + React mapping
- [x] Paged.js print CSS (A4/bleed/headers/links/CMYK/font)
- [x] Headless export + pdf postprocess

---

# FAZ 2 - Urunlesme + Kalite (Cogu Tamamlandi)

## 2.1 AI Art-Director (iki asama)
- [x] DocumentPlan + LayoutPlan
- [x] Fallback layout
- [x] Prompt versioning + rollback hooks
- [x] Data storytelling (insight + executive summary)
- [x] Survey report kaynak/orneklem notlari

## 2.2 QA Harness + Visual Regression
- [x] Markdown lint + a11y + typography scoring
- [x] Visual regression (baseline + diff)
- [x] QA raporlama + applied fixes

## 2.3 Templates + Press Pack + Release
- [x] Template registry + versions + rollback
- [x] Press Pack manifest schema + validation
- [x] Preflight gate (lint + QA + schema)
- [x] Release metadata + output manifest
- [x] Template governance (approval + reviewer role)

## 2.4 UI/UX
- [x] UI shell + Documents/Jobs/Quality panelleri
- [x] Wizard progress + inline validation
- [x] Editor outline + insert palette + jump-to-issue

## 2.5 Pattern Library
- [x] Pattern katalogu + schema
- [x] Print CSS + A11y + snapshot baseline

---

# FAZ 3 - Operasyon, CI/CD ve Governance (Tamamlandi)

Aşağıdaki maddeler runbook kaydi olarak tutulur; kalanlar veya tamamlananlar burada yer alir.

## 3.1 AI Art-Director - Survey kaynak notlari
- [x] **Hedef:** Survey report kaynaklari ve ornekleme notlarini standartlastir.
- Girdiler: `src/ai/art-director.js`, `docs/CHART-TABLE-STANDARDS.md`, mevcut promptlar.
- Adimlar:
  1) Survey tabanli raporlar icin kaynak/metodoloji bolumu alanlarini tanimla.
  2) LayoutInstruction schema icinde `methodologyNotes` + `sources` alanlarini ekle (geriye uyumlu).
  3) Prompta "source/methodology" ciktisi kuralini ekle.
  4) Render tarafinda bu alanlari dipnot/caption olarak yazdir.
- Ciktilar: schema guncellemesi + prompt guncellemesi + ornek JSON.
- Kabul Kriteri: survey raporunda kaynak/metodoloji bolumu print/PDF ciktiya giriyor.

## 3.2 DevOps / CI (Faz 3 Oncelik)

### 3.2.1 docker-compose profilleri (api/worker)
- [x] **Hedef:** api ve worker servislerini profile ile ayr.
- Girdiler: `docker-compose.raspberry.yml`, `Dockerfile.api`, `Dockerfile.worker`.
- Adimlar:
  1) `profiles: [api]` ve `profiles: [worker]` ekle.
  2) README/Runbook guncelle: profile ile calistirma komutlari.
- Ciktilar: compose profilleri + dokumantasyon.
- Kabul Kriteri: `docker compose --profile api up -d` ve `--profile worker` ayri calisiyor.

### 3.2.2 VITE_API_URL env yonetimi
- [x] **Hedef:** FE build ve runtime icin tekil API URL standardi.
- Girdiler: `frontend/.env`, `frontend/.env.example`, `docs/USAGE.md`.
- Adimlar:
  1) `VITE_API_URL` tek kaynak yap, fallbackleri kaldir.
  2) FE tarafinda base URL kullanimini standardize et.
- Ciktilar: guncel env dosyalari + dokumantasyon.
- Kabul Kriteri: FE her ortamda dogru API'ye baglaniyor.

### 3.2.3 CI QA (axe/typography/visual regression)
- [x] **Hedef:** QA harness'i CI pipeline'a bagla.
- Girdiler: `scripts/tests/qa-harness.js`, `.github/workflows/ci.yml`.
- Adimlar:
  1) `RUN_QA=true` kosuluyla QA step ekle.
  2) Baseline yoksa jobi skip edecek guard ekle.
  3) QA raporlarini artifact olarak yukle.
- Ciktilar: CI QA step + baseline guard + artifact upload.
- Kabul Kriteri: CI loglarinda QA raporu gorunuyor.

### 3.2.4 Artifact upload (PDF/PNG)
- [x] **Hedef:** CI sonucunda PDF/PNG artefactlarini sakla.
- Adimlar:
  1) QA smoke test ciktilarini `output/` altinda topla.
  2) `actions/upload-artifact` ile yukle.
- Kabul Kriteri: CI run'larinda indirilebilir artifact mevcut (`qa-artifacts`).

### 3.2.5 Version stamping
- [x] **Hedef:** Cikti PDF metadata'sina commit/date/version yaz.
- Girdiler: `src/utils/pdf-postprocess.js`, CI env (GITHUB_SHA).
- Adimlar:
  1) Build sirasinda `BUILD_SHA`, `BUILD_DATE` env set et.
  2) PDF metadata/manifest'e yaz.
- Kabul Kriteri: PDF metadata'da commit ve tarih var.

### 3.2.6 RUN_QA / RUN_SMOKE otomasyon
- [x] **Hedef:** CI ve lokalda tek komutla smoke/QA.
- Adimlar:
  1) `npm run qa` ve `npm run smoke` scriptlerini netlestir.
  2) `RUN_QA` / `RUN_SMOKE` env bayraklari ile kosullu calistir.
- Kabul Kriteri: pipeline kosullu QA/smoke calisiyor.

### 3.2.7 Pi redeploy + smoke test
- [x] **Hedef:** Pi ortaminda gunluk deploy + `/api/convert/to-pdf` smoke.
- Adimlar:
  1) `scripts/raspberry/pi_bridge.py` ile pull + compose up.
  2) Smoke test scriptini calistir ve logu arsivle.
- Kabul Kriteri: Pi'de yeni build calisiyor, smoke test basarili.

## 3.3 Referans Kutuphane + Tasarim Yonerghesi
- [x] **Hedef:** Referans PDF kutuphanesi ve tasarim standardi.
- Girdiler: `docs/design/` dizini, `patterns/` katalog.
- Adimlar:
  1) `library/manifest.json` (URL + metadata + lisans).
  2) PDF metadata (pattern tags) ekle.
  3) `docs/design/Carbon_PDF_Tasarim_Yonergesi.md` olustur.
  4) Pattern extraction notes olustur.
- Ciktilar:
  - `library/manifest.json`
  - `docs/design/Carbon_PDF_Tasarim_Yonergesi.md`
  - `docs/design/PATTERN-EXTRACTION-NOTES.md`
- Kabul Kriteri: tasarim referanslari repo icinde kataloglu, PDF keyword taglari ekleniyor.

## 3.4 CLI + Multi-Output + Cache
- [x] **Hedef:** CI/batch uretim icin CLI facade.
- Girdiler: `src/convert-paged.js`, `package.json`.
- Adimlar:
  1) `carbonac build <file.md>` ve `carbonac qa <file.md>` komutlari.
  2) Multi-output: PNG thumbnail + HTML export (EPUB opsiyonel).
  3) Build cache (md+template+theme hash).
  4) Parallel build (worker concurrency).
- Ciktilar:
  - `src/cli.js` (build/qa + cache + parallel)
  - `package.json` (carbonac bin)
- Kabul Kriteri: CLI ile batch PDF+PNG/HTML cikti uretiliyor.

## 3.5 DoD Enforcement
- [x] **Hedef:** Her task kapanisinda dogrulama standardi.
- Girdiler: `.github/pull_request_template.md`, `docs/PROJE-TALIMATLARI.md`.
- Adimlar:
  1) DoD checklist dokumani ekle (manual test + error path + doc update).
  2) PR template'e linkle.
  3) CI jobuna DoD kontrolu (opsiyonel) ekle.
- Ciktilar:
  - `docs/DEFINITION-OF-DONE.md`
  - `.github/pull_request_template.md` (DoD checklist)
  - `.github/workflows/ci.yml` (opsiyonel DoD check)
- Kabul Kriteri: Her PR'da DoD checklist dolduruluyor.

---

## Durum Ozeti (Kisa)
- Tamamlananlar: Faz 0-3 ana kalemleri (parser/renderer/QA/UI/press-pack/observability/devops).
- Kalanlar: Program backlogu (kalite checklist entegrasyonu + Faz 4 detaylandirma).

## Program Backlog (Tamamlandi)
- [x] Faz 4 epics implementation (release gating, monitoring/alerts, DoD enforcement).
