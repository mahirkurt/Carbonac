# FAZ 3 - SPRINT 5 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md`, `docs/SPRINT-0-DELIVERABLES.md` ve `docs/IS-PLANI.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 5 ile template registry aktif edilir: Supabase tablolari, CRUD + versioning, preview thumbnail akisi ve UI template galerisi.

## 1. Amac ve Kapsam
Template secimi end-to-end calisir ve Paged.js pipeline ile uyumlu bir registry olusur.

Kapsam dahili:
- Supabase template tablolari + versioning
- Template CRUD ve rollback API
- Preview thumbnail pipeline (pagedjs + puppeteer)
- UI template galerisi + filtre/siralama

Kapsam disi:
- Token mapping ve print token pack (Sprint 6)
- Pattern library genisletmesi (Sprint 6)
- Billing ve usage limitleri (Sprint 7-8)

## 2. SoT Kararlari (Ozet)
- Rendering motoru: React + Carbon Components
- Baski/PDF motoru: Paged.js
- AI: Gemini 3 Pro (preview) + 2.5 Pro fallback
- Storage: Supabase buckets
- Template ID standardi: `carbon-<variant>`

## 3. Cikti ve Basari Kriterleri (Exit)
- Template CRUD + versioning + rollback calisir
- Varsayilan template seti (seed) galeride listelenir
- Preview thumbnail uretilir ve galeride gorunur
- Template secimi convert job ayarlarina yansir

## 4. Teknik Tasarim Ozeti

### 4.1 Veri Modeli (Supabase)
- `templates`
  - id, key, name, description, status, engine, category, tags
  - is_system, is_public, user_id
  - active_version_id, latest_version_id
  - created_at, updated_at
- `template_versions`
  - id, template_id, version
  - schema_json (layout json)
  - layout_profile, print_profile, theme
  - notes, created_by, created_at
- `template_previews`
  - id, template_version_id
  - storage_path, format, created_by, created_at

### 4.2 Template JSON Schema (Paged.js)
Template schema, art-director layout JSON ile uyumlu tutulur.
Minimum alanlar:
- layoutProfile: symmetric | asymmetric | dashboard
- printProfile: pagedjs-a4 | pagedjs-a3
- theme: white | g10 | g90 | g100
Opsiyonel:
- gridSystem, components, storytelling, styleHints
- previewMarkdown (preview icin ornek icerik)

### 4.3 API Contract (Ozet)
- GET `/api/templates`
  - Response: `{ templates: [{ id, key, name, status, category, tags, activeVersion, previewUrl }] }`
- POST `/api/templates`
  - Body: `{ key, name, description, status, category, tags, schema }`
- PATCH `/api/templates/:id`
  - Body: `{ name, description, status, category, tags, is_public }`
- POST `/api/templates/:id/versions`
  - Body: `{ schema, notes, activate }`
- POST `/api/templates/:id/rollback`
  - Body: `{ versionId }`
- POST `/api/templates/:id/preview`
  - Response: `{ jobId, status, statusUrl }`
- GET `/api/templates/:id/versions`

### 4.4 Preview Pipeline
- Job type: `template-preview`
- Worker, Paged.js + Chromium ile PDF + PNG uretir
- PNG `SUPABASE_BUCKET_TEMPLATE_PREVIEWS` bucket'ina yazilir
- `template_previews.storage_path` saklanir, API signed URL ile doner

### 4.5 Template Secimi
- FE `settings.template` olarak gonderir
- Worker template schema ile layout/print/theme defaultlarini uygular
- AI layout sonucu template styleHints ile birlestirilir

### 4.6 Ortam Degiskenleri (Minimum)
- API/Worker: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Storage: `SUPABASE_BUCKET_DOCUMENTS`, `SUPABASE_BUCKET_PDFS`, `SUPABASE_BUCKET_TEMPLATE_PREVIEWS`
- FE: `VITE_API_URL`

### 4.7 Press Pack Manifest (CarbonPress Uyum)
- Template version ile birlikte `press_pack` manifest tutulur (tokens + patterns + QA rules + sample content).
- Release manifest: template/version/tokens hash + QA sonucu job result metadata'ya baglanir.

## 5. Entegrasyon Akisi (Is Adimi)
1) FE template listesini getirir
2) Kullanici template secer
3) Convert job `settings.template` ile gonderilir
4) Worker template defaults + AI layout ile render eder
5) Preview job, template thumbnail uretir ve galeride gorunur

## 6. Sprint Takvimi
- G1-G2: Supabase schema + migration
- G3-G4: Template CRUD + versioning API
- G5-G6: Preview pipeline (thumbnail)
- G7-G8: FE template galerisi
- G9: Seed data + integration
- G10: Test, demo ve kapanis

## 7. Sprint 5 Backlog (Issue-Based)

### ISSUE F3-S5-01: Template Registry Schema
Labels: [DB] [API]
Goal: Supabase template tablolarini kur.
Tasks:
- [x] templates table
- [x] template_versions table
- [x] template_previews table
Acceptance:
- [x] Migration uygulanir ve tablolar hazir

### ISSUE F3-S5-02: Template CRUD API
Labels: [API]
Goal: Template CRUD ve versioning endpointleri.
Tasks:
- [x] Template list/create/update/delete
- [x] Version create + rollback
- [x] Validation (schema_json)
Acceptance:
- [x] CRUD + versioning calisir

### ISSUE F3-S5-03: Template Preview Pipeline
Labels: [RENDER] [STORAGE]
Goal: Template preview (thumbnail) olustur.
Tasks:
- [x] Preview render job
- [x] PNG thumbnail export
- [x] Preview URL storage
Acceptance:
- [x] Template galeride thumbnail gorunur

### ISSUE F3-S5-04: Template Gallery UI
Labels: [FE] [UX]
Goal: Template listeleme ve filtreleme UI.
Tasks:
- [x] Gallery layout
- [x] Filter/sort (type/theme)
- [x] Template secimi
Acceptance:
- [x] Template secimi convert job'a yansir

## 8. Ayrintili Task Breakdown

### F3-S5-01 Template Registry Schema
Breakdown:
- [x] Migration dosyalari
- [x] RLS policy taslaklari
- [x] Seed template seti
Notlar:
- Template key standardi: `carbon-<variant>`
- Varsayilan template seti: carbon-advanced, carbon-grid, carbon-theme-g100

### F3-S5-02 Template CRUD API
Breakdown:
- [x] Validation (schema_json)
- [x] Versioning ve rollback akisi
- [x] API error format uyumu
Notlar:
- Version state, template table uzerinden aktif/pasif kontrol edilir.

### F3-S5-03 Template Preview Pipeline
Breakdown:
- [x] Preview job queue (template-preview)
- [x] Thumbnail standartlari (ilk sayfa PNG)
- [x] Storage path standardi (template key + version)
Notlar:
- Preview, worker tarafinda uretilir ve bucket'a yazilir.

### F3-S5-04 Template Gallery UI
Breakdown:
- [x] Gallery kartlari + preview
- [x] Filtre UI (theme/category) + siralama
- [x] Template secimi ve state
Notlar:
- UI template verisini API'den alir.

## 9. Bagimliliklar
- F3-S5-03 -> F3-S5-01 tamamlanmadan baslamaz
- F3-S5-04 -> F3-S5-02 tamamlanmadan kapanmaz

## 10. Test ve Dogrulama
Minimum test senaryolari:
- Template CRUD + versioning
- Template rollback
- Preview thumbnail olusumu
- Template secimi ile convert job

## 11. Cikti Artefaktlari
- Template registry migration
- Template API contract + preview job
- Gallery UI tasarimi

## 12. CarbonPress Uyum Notu
- Template registry, Press Pack manifest katmaninin altyapisini saglar.
- Press Pack manifest ve release metadata Sprint 6 kapsaminda tamamlanacak.

## 13. Guncel Durum Profili
- Sprint 5 backlog'u tamamlandi; registry + preview + gallery calisiyor.

## 14. Sonraki Adimlar
- Sprint 6 backlog'unu baslat: Press Pack manifest + block catalog + release metadata.
- Template governance: editorial states + publish gate kurallari.
