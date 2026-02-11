# FAZ 1 - SPRINT 1 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md` ve `docs/SPRINT-0-DELIVERABLES.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 1, core pipeline'in ilk calisan halini uretir: job modeli + queue + worker + `/api/convert/to-pdf` akisi + FE job polling.

## 1. Amac ve Kapsam
Sprint 1, core pipeline icin ilk calisan modeli cikartir: job tablosu, job status endpointleri,
queue/worker iskeleti, conversion is akisi ve frontend tarafinda yeni API hedefi.
Sprint 0 kararlarina gore Docker tabanli Express API + Worker modeli uygulanir.

Kapsam dahili:
- DB migration: jobs ve job_events tablolari
- /api/jobs create + status read endpointleri
- Queue (Redis + BullMQ) ve worker iskeleti
- /api/convert/to-pdf akisinin job uzerinden calistirilmasi
- FE documentService yeni API base URL ve job polling
- Template seciminin backend tarafinda uygulanmasi

Kapsam disi:
- doc -> md pipeline normalizasyonu (Sprint 2)
- signed URL uretimi ve storage lifecycle (Sprint 2)
- Paged.js preview/print polish (Sprint 3)
- Template registry ve token mapping (Sprint 5-6)
- Print token pack + pattern library (Sprint 5-6)
- Billing ve usage limitleri (Sprint 7-8)

## 2. Sprint 0 Kararlari (Uygulanan)
- Deploy: Docker tabanli Express API + Worker
- Queue: Redis + BullMQ
- Auth: Supabase JWT (Authorization: Bearer)
- Storage: Supabase bucket path standardi
- API base URL: VITE_API_URL
- Error format ve logging standardi (request_id + job_id)

## 3. Cikti ve Basari Kriterleri (Exit)
- jobs/job_events migrationlari calisir ve tablo/indexler olusur.
- `/api/jobs` create ve `/api/jobs/{id}` status endpointleri calisir.
- Worker, `convert-pdf` joblarini alir ve status gunceller.
- FE yeni API ile job polling yapar ve sonucu gorur.
- Template id (veya default) backend tarafinda etkili olur.
- Error payload standard ve request_id loglara yazilir.

## 4. Teknik Tasarim Ozeti

### 4.1 API Yuzeyi (Sprint 1)
- POST `/api/convert/to-pdf` -> job create + queue add
- POST `/api/jobs` -> generic job create
- GET `/api/jobs/{id}` -> status read
- GET `/api/health` -> basic health (opsiyonel ama onerilir)

Error payload:
```
{ error: { code, message, details, request_id } }
```

### 4.2 Job Modeli
- type: convert-md | convert-pdf | ai-analyze
- status: queued | processing | completed | failed | cancelled
- result: pdfUrl, outputPath, metadata
- error: error_message + error_code
- status gecisleri: queued -> processing -> completed/failed/cancelled

### 4.3 Queue ve Worker
- Tek queue kullanilir: `JOB_QUEUE_NAME` (default: `carbonac-jobs`).
- Job name: convert-md, convert-pdf, ai-analyze.
- Redis baglantisi `REDIS_URL` ile saglanir (uzak Redis varsayilan).
- Retry: max 3 attempt, exponential backoff.
- Worker ayrilmis process olarak calisir.

### 4.4 Storage
- Sprint 1'de pdfUrl placeholder olabilir.
- Signed URL ve lifecycle Sprint 2 kapsamindadir.

### 4.5 Frontend Entegrasyonu
- API hedefi `VITE_API_URL` ile ayarlanir.
- `/api/convert/*` ile job create edilir, `/api/jobs/{id}` ile polling yapilir.
- FE hata durumunda retry sunar ve error mesaji gosterir.

### 4.6 Ortam Degiskenleri (Minimum)
- API: `REDIS_URL`, `JOB_QUEUE_NAME`, `PORT`, `NODE_ENV`
- FE: `VITE_API_URL`
- Job store (opsiyonel): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- DB/migration: Supabase CLI/credentials (ortam standardina uygun)

## 5. Entegrasyon Akisi (Is Adimi)
1) FE -> POST `/api/convert/to-pdf`
2) API -> DB insert (job: queued)
3) API -> queue add (convert-pdf)
4) Worker -> status: processing
5) Worker -> render -> status: completed + result
6) FE -> polling -> completed -> preview/download

## 6. Sprint Takvimi
- G1-G2: DB migration ve API endpoint tasarimi
- G3-G5: Worker ve conversion job entegrasyonu
- G6-G8: FE refactor + job polling
- G9-G10: Test, demo ve kapanis

## 7. Sprint 1 Backlog (Issue-Based)

### ISSUE F1-S1-01: DB Migration - Jobs ve Job Events
Labels: [DB]
Goal: jobs ve job_events tablolari migration ile eklensin.
Tasks:
- [x] jobs tablosu schema olustur
- [x] job_events tablosu schema olustur
- [x] index ve RLS taslaklari ekle
Acceptance:
- [x] Supabase migration dosyasi hazir
- [x] Tablo ve indexler olustu

### ISSUE F1-S1-02: /api/jobs Create + Status
Labels: [API]
Goal: Job create ve status read endpointleri calissin.
Tasks:
- [x] POST /api/jobs implementasyonu
- [x] GET /api/jobs/{id} implementasyonu
- [x] Error format standardi uygula
Acceptance:
- [x] Create ve status read calisiyor
- [x] Error payload standard

### ISSUE F1-S1-03: Queue + Worker Iskelet
Labels: [API] [OPS]
Goal: Redis + BullMQ ile job isleyen worker iskeleti.
Tasks:
- [x] `REDIS_URL` ve `JOB_QUEUE_NAME` ile connection kur
- [x] Tek queue tanimla (default: carbonac-jobs)
- [x] Worker process ayri servis olarak calissin
- [x] Job status guncelleme (processing, completed, failed)
Acceptance:
- [x] Worker job alir ve status gunceller

### ISSUE F1-S1-04: Convert-to-PDF -> Job Pipeline
Labels: [API]
Goal: /api/convert/to-pdf job uretip kuyruga atar.
Tasks:
- [x] Convert request -> job create bagla
- [x] Job payload icine settings ve template ekle
- [x] Queue'ya `convert-pdf` job'u ekle
- [x] Result olarak pdfUrl (placeholder) dondur
Acceptance:
- [x] Convert endpoint job based calisiyor

### ISSUE F1-S1-05: Frontend API Base URL + Job Polling
Labels: [FE] [API]
Goal: FE yeni API hedefi ve job polling ile uyumlu.
Tasks:
- [x] documentService API base URL guncelle
- [x] /api/convert/* ve /api/jobs/{id} entegrasyonu
- [x] Job polling ve basic error handling
Acceptance:
- [x] FE convert akisi yeni API ile calisiyor

### ISSUE F1-S1-06: Template Selection -> Backend
Labels: [TEMPLATE]
Goal: Template secimi backend tarafinda uygulanir.
Tasks:
- [x] Template id parametresi backend'e iletilir
- [x] Template id ile renderer pipeline icin secim yapilir
- [x] Template fallback (default: carbon-advanced)
- [x] Template id validate listesi
Acceptance:
- [x] Secilen template outputta etkili

### ISSUE F1-S1-07: Logging ve Request ID
Labels: [OPS]
Goal: request_id ve job_id logging standardi.
Tasks:
- [x] request_id middleware ekle
- [x] job_id log formatina dahil et
Acceptance:
- [x] Loglar standard formatta

## 8. Ayrintili Task Breakdown

### F1-S1-01 DB Migration - Jobs ve Job Events
Breakdown:
- [x] Migration dosyasi olustur (dosya adi, tarih prefix)
- [x] `jobs` tablosu kolonlari: id, user_id, type, status, payload, result, error_message, attempts, created_at, updated_at
- [x] `job_events` tablosu kolonlari: id, job_id, status, message, created_at
- [x] Indexler: jobs(user_id), jobs(status), job_events(job_id)
- [x] RLS policy taslaklari (owner access)
- [x] Local migration dry-run ve kontrol
Notlar:
- Status listeleri API ile birebir uyumlu olmali.
- `payload` ve `result` JSONB alanlari versiyonlanabilir yapida tutulmali.

### F1-S1-02 /api/jobs Create + Status
Breakdown:
- [x] Request validation (type, payload, user_id)
- [x] Job kaydi yaratma (DB insert)
- [x] Job status okuma (DB select)
- [x] Error format standardini uygulama
- [x] request_id middleware entegrasyonu
Notlar:
- Auth: Supabase JWT -> user_id map edilmeli.
- Response sabit formatli olmali.

### F1-S1-03 Queue + Worker Iskelet
Breakdown:
- [x] Redis connection config (env, default)
- [x] Queue name: `JOB_QUEUE_NAME` (default: carbonac-jobs)
- [x] Worker process entrypoint (ayri node process)
- [x] Job lifecycle update (queued -> processing -> completed/failed)
- [x] Retry/backoff ayarlari
Notlar:
- Worker crash durumunda yeniden baslatilabilir olmali.
- Job status DB uzerinden tek kaynak olmali.

### F1-S1-04 Convert-to-PDF -> Job Pipeline
Breakdown:
- [x] /api/convert/to-pdf endpointi job uretir
- [x] Payload: markdown, settings, template, engine map
- [x] Queue'ya convert-pdf job'u ekle
- [x] Result alanina outputPath/pdfUrl yazma
- [x] Hata durumunda error_message set etme
Notlar:
- Sprint 1'de pdfUrl placeholder olabilir; signed URL Sprint 2.

### F1-S1-05 Frontend API Base URL + Job Polling
Breakdown:
- [x] VITE_API_URL env okuma ve client config
- [x] documentService fetch adapteri guncelle
- [x] /api/jobs/{id} polling (interval + max retry)
- [x] FE hata mesajlari ve retry butonu
- [x] Legacy Netlify endpointlerini kaldirma
Notlar:
- Polling interval 1-2s baslangic, exponential backoff.

### F1-S1-06 Template Selection -> Backend
Breakdown:
- [x] Template id UI -> API payload icine ekle
- [x] Backend template secimi (renderer-agnostic)
- [x] Template fallback (default: carbon-advanced)
- [x] Template id validate listesi
Notlar:
- Template listesi statik config ile senkronize edilmeli.

### F1-S1-07 Logging ve Request ID
Breakdown:
- [x] request_id uret ve response header'a ekle
- [x] API log formatini standardize et (json)
- [x] job_id loglara eklensin
- [x] Error payload icinde request_id donsun
Notlar:
- Logging middleware her request icin zorunlu olmali.

## 9. Bagimliliklar
- F1-S1-02, F1-S1-03 -> F1-S1-01 tamamlanmadan baslamaz
- F1-S1-04 -> F1-S1-03 queue iskeleti olmadan tamamlanamaz
- F1-S1-05 -> F1-S1-02 endpointleri olmadan test edilemez

## 10. Test ve Dogrulama
Minimum test senaryolari:
- /api/health -> 200
- Create job -> status polling -> completed
- /api/convert/to-pdf -> job queue -> status update
- Invalid payload -> error format dogru
- Template id ile conversion farki

## 11. CarbonPress Uyum Notu
- Job payload ve settings alani, ileride Press Pack manifest (template/version/tokens) bilgisini tasiyacak sekilde tasarlandi.
- layoutProfile/printProfile alanlari sonraki sprintlerde Press Pack icerigi ile hizalanacak.

## 12. Guncel Durum Profili
- Sprint 1 backlog'u tamamlandi; core job pipeline ve loglama stabil.

## 13. Sonraki Adimlar
- Sprint 2: Paged.js print CSS + Gemini art director + signed URL akisi.
- Press Pack manifest semasi icin API payload alanlari korunacak.
