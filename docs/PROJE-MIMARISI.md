# PROJE MIMARISI (Mega Ozet)

Bu dokuman, Carbonac projesinin mimarisini, tamamlanan isleri ve kalan backlog'u tek bir yerde toplar.
Kaynaklar: `docs/PROJE-TALIMATLARI.md`, `docs/SPRINT-0-DELIVERABLES.md`, `docs/IS-PLANI.md`, sprint dokumanlari (docs/archive),
`docs/PROJE-DURUMU.md`, `docs/archive/EK-GELISTIRME-ONERILERI.md`, `docs/TO-DO-LIST.md`, `docs/RASPBERRY-DOCKER.md`.

## 1) SoT ve Yonetim Kurallari
- Oncelik sirasi: `docs/PROJE-TALIMATLARI.md` > `docs/SPRINT-0-DELIVERABLES.md` > `docs/IS-PLANI.md` > sprint dokumanlari (docs/archive).
- Mimari kararlar: React + Carbon + Paged.js + Gemini 3 Pro (fallback 2.5) + Redis/BullMQ + Supabase storage.
- Error format, logging (request_id + job_id), ve print kalite kurallari SoT ile uyumlu olmak zorunda.

## 2) Sistem Ozeti
Carbonac; markdown icerigini AI destekli layout talimatlariyla (LayoutPlan/DocumentPlan) Carbon tasarim sistemine uygun
Paged.js PDF ciktilarinda ureten, queue + worker mimarisiyle olceklenen bir raporlama platformudur.

## 3) Bilesenler ve Sorumluluklari

### 3.1 API Servisi
- HTTP API: `/api/convert/to-pdf`, `/api/jobs/{id}`, `/api/jobs/{id}/download`.
- Job lifecycle ve signed URL akisi.
- Press Pack / template metadata / release output manifest.
- Preflight gate ve job_events loglama.

### 3.2 Worker Servisi
- Markdown parse + directive/pattern mapping.
- Art director (Gemini) layout plan olusturma ve fallback plan.
- Paged.js print pipeline + PDF export + postprocess.
- Storage upload + signed URL.

### 3.3 Frontend (UI)
- Editor, frontmatter wizard, autosave.
- Template gallery + governance aksiyonlari.
- Job status/polling + download akisi.

### 3.4 AI Art Director
- DocumentPlan + LayoutPlan JSON.
- Storytelling: executive summary + key insights (+ survey methodology/sources).
- Prompt versioning ve rollback.

### 3.5 Templates / Press Pack / Patterns
- Template registry + versioning + approval.
- Press Pack manifest (template + tokens + patterns + QA rules + sample content).
- Pattern katalogu: `patterns/registry.json` ve `patterns/schemas/*`.

### 3.6 QA / Preflight
- QA harness: typography, a11y, visual regression, lint.
- Output manifest ve QA raporlari.

### 3.7 Storage ve Veri Modeli
- Supabase: jobs, job_events, templates, releases, assets.
- Storage buckets: documents, pdfs, template-previews (ve digerleri).

### 3.8 CLI
- `carbonac build` ve `carbonac qa` komutlari.
- Multi-output (PDF + HTML + PNG preview) ve build cache.

### 3.9 Infra / Deploy
- Docker Compose: `docker-compose.raspberry.yml` (api/worker/redis).
- Raspberry runbook: `docs/RASPBERRY-DOCKER.md`.
- pi_bridge otomasyonu: `scripts/raspberry/pi_bridge.py`.

## 4) End-to-End Veri Akisi (Ozet)
1. Markdown -> parse + frontmatter.
2. AI art director -> layout instruction (layoutProfile/printProfile + components).
3. HTML render + print CSS (Paged.js).
4. PDF export + postprocess (metadata, qa).
5. Storage upload + signed URL.
6. Job polling + download.

## 5) Konfigurasyon (Env Basliklari)
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`.
- Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_*`.
- Queue/Redis: `REDIS_URL`, `JOB_QUEUE_NAME`.
- Print/QA: `PRINT_*`, `PDF_QA_*`.
- Frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`.

## 6) Referans Kutuphane + Tasarim Yonerghesi
- Referans kutuphane: `library/manifest.json`, `library/pdfs/`, `library/thumbnails/`.
- Tasarim yonergesi: `docs/design/Carbon_PDF_Tasarim_Yonergesi.md`.
- Pattern extraction notes: `docs/design/PATTERN-EXTRACTION-NOTES.md`.

## 7) Durum Profili (Yapilanlar)

### 7.1 Faz 0 (Sprint 0)
- Decision log, API contract, job state, DB schema taslaklari `docs/SPRINT-0-DELIVERABLES.md` icinde uygulanmis.

### 7.2 Faz 1 (Sprint 1-2)
- Core pipeline (API + queue + worker).
- Paged.js print pipeline + signed URL akisi.
- Gemini art director (3 pro + fallback 2.5 pro).

### 7.3 Faz 2 (Sprint 3-4)
- Preview pipeline + QA/self-healing altyapisi.
- Frontmatter wizard + editor UX.
- Markdown lint + empty/error states.

### 7.4 Faz 3 (Sprint 5-6)
- Template registry + preview + gallery.
- Press pack manifest + release/publish akisi.
- Governance + approval.

### 7.5 DevOps / CI / Operasyon
- CI QA baseline + artifact upload.
- Version stamping (PDF metadata).
- RUN_QA / RUN_SMOKE otomasyonu.
- Pi deploy + smoke akisi.
- EK-GELISTIRME kalite checklist'i preflight sonucuna baglandi.
- Metrics dashboard + alert esikleri aktif, DoD check CI'de enforced.

### 7.6 Referans Kutuphane + CLI
- Referans kutuphane ve tasarim yonergesi olusturuldu.
- CLI (build/qa) + cache + parallel batch.

## 8) Kalanlar / Backlog (Opsiyonel)

### 8.1 EK-GELISTIRME-ONERILERI Checklist (archived source)
Asagidaki maddeler preflight qualityChecklist icinde raporlanir (enforcement opsiyonel):
- A4 margin/bleed/marks dogrulama
- Footer X/Y + mini-TOC
- Key Findings + What To Do bloklari
- Caption/source/sample size standardi
- Typography/token guardrail
- Font embedding + min pt
- Visual self-healing en az 1 iterasyon
- Baslik hiyerarsisi + reading order + bookmarks
- Link/kontrast/tablolarin tutarliligi

### 8.2 Dokumantasyon Arsiv Plani
Sprint dokumanlari ve referans notlari `docs/archive/` altinda arsivlendi.

### 8.3 Faz 4 (IS-PLANI)
IS-PLANI Faz 4 (urunlesme, release, monitoring, DoD enforcement) kalemleri detaylandirildi.
Odak: release gating, observability dashboard/alerting, DoD enforcement.

## 9) Dokuman Uyumsuzluklari (Not)
- Guncel dokumanlar hizalandi; arsivleme tamamlandi.

## 10) Sonraki Adimlar (Oncelik)
1. Opsiyonel: alert esiklerini ortam KPI'larina gore kalibre et.
